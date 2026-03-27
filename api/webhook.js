import { Telegraf } from 'telegraf';

// In-memory storage
let store = {
    profileImage: null,
    profileName: 'Xrans Official',
    profileTitle: 'Digital Creator',
    products: [],
    portfolios: [],
    customerResponses: {}
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_CHAT_ID;
    const body = req.body;

    if (!body || !body.message) {
        return res.status(200).json({ ok: true });
    }

    const bot = new Telegraf(botToken);
    const chatId = body.message.chat.id;
    const text = body.message.text;
    const isAdmin = chatId.toString() === adminId;

    // Admin commands
    if (isAdmin) {
        // /start command
        if (text === '/start') {
            const helpMessage = `
*XRANS OFFICIAL BOT* 🤖

Selamat datang Admin! Berikut perintah yang tersedia:

━━━━━━━━━━━━━━━━━━━━
*📸 PROFILE SETTINGS*
━━━━━━━━━━━━━━━━━━━━
\`/setprofile [url]\` - Ganti foto profil
\`/setname [nama]\` - Ganti nama
\`/settitle [title]\` - Ganti jabatan

━━━━━━━━━━━━━━━━━━━━
*📦 PRODUCT MANAGEMENT*
━━━━━━━━━━━━━━━━━━━━
\`/addproduct [nama]|[harga]|[deskripsi]|[url_gambar]\` - Tambah produk
\`/delproduct [id]\` - Hapus produk
\`/listproduct\` - Lihat semua produk

━━━━━━━━━━━━━━━━━━━━
*🖼️ PORTFOLIO MANAGEMENT*
━━━━━━━━━━━━━━━━━━━━
\`/addportfolio [judul]|[deskripsi]|[url_gambar]\` - Tambah portofolio
\`/delportfolio [id]\` - Hapus portofolio
\`/listportfolio\` - Lihat semua portofolio

━━━━━━━━━━━━━━━━━━━━
*💬 RESPONSE TO CUSTOMER*
━━━━━━━━━━━━━━━━━━━━
Balas dengan format:

• *Teks:* 
\`reply_[deviceId] [pesan]\`

• *Foto + Teks:* 
Kirim foto dengan caption:
\`reply_[deviceId] [pesan]\`

━━━━━━━━━━━━━━━━━━━━
*CONTOH PENGGUNAAN*
━━━━━━━━━━━━━━━━━━━━
\`/addproduct Kaos Premium|150000|Kaos katun berkualitas|https://example.com/kaos.jpg\`

\`reply_device123 Halo, pesanan Anda sedang diproses!\`
`;

            await bot.telegram.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
            return res.status(200).json({ ok: true });
        }

        // Set profile image
        if (text.startsWith('/setprofile')) {
            const url = text.replace('/setprofile', '').trim();
            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                store.profileImage = url;
                await bot.telegram.sendMessage(chatId, 
                    `✅ *Foto profil berhasil diupdate!*\n\n> ${url}`,
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.telegram.sendMessage(chatId, 
                    `❌ *Format salah!*\n\nGunakan:\n\`/setprofile https://example.com/foto.jpg\``,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }

        // Set profile name
        if (text.startsWith('/setname')) {
            const name = text.replace('/setname', '').trim();
            if (name) {
                store.profileName = name;
                await bot.telegram.sendMessage(chatId, 
                    `✅ *Nama berhasil diubah menjadi:*\n\n> ${name}`,
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.telegram.sendMessage(chatId, 
                    `❌ *Format salah!*\n\nGunakan:\n\`/setname Xrans Official\``,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }

        // Set profile title
        if (text.startsWith('/settitle')) {
            const title = text.replace('/settitle', '').trim();
            if (title) {
                store.profileTitle = title;
                await bot.telegram.sendMessage(chatId, 
                    `✅ *Jabatan berhasil diubah menjadi:*\n\n> ${title}`,
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.telegram.sendMessage(chatId, 
                    `❌ *Format salah!*\n\nGunakan:\n\`/settitle Digital Creator\``,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }

        // Add product
        if (text.startsWith('/addproduct')) {
            const content = text.replace('/addproduct', '').trim();
            const parts = content.split('|');
            
            if (parts.length >= 2) {
                const product = {
                    id: Date.now().toString(),
                    name: parts[0].trim(),
                    price: parseInt(parts[1].trim()),
                    description: parts[2] ? parts[2].trim() : '',
                    image: parts[3] ? parts[3].trim() : null,
                    createdAt: new Date().toISOString()
                };
                
                store.products.push(product);
                
                const successMessage = `
✅ *PRODUK BERHASIL DITAMBAHKAN!*

━━━━━━━━━━━━━━━━━━━━
📦 *Nama:* ${product.name}
💰 *Harga:* Rp ${product.price.toLocaleString()}
📝 *Deskripsi:* ${product.description || '-'}
🆔 *ID:* \`${product.id}\`
━━━━━━━━━━━━━━━━━━━━

Gunakan \`/delproduct ${product.id}\` untuk menghapus.
                `;
                
                await bot.telegram.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
            } else {
                await bot.telegram.sendMessage(chatId, 
                    `❌ *Format salah!*\n\nGunakan format:\n\`/addproduct Nama|Harga|Deskripsi|url_gambar\`\n\n*Contoh:*\n\`/addproduct Kaos Premium|150000|Kaos katun berkualitas|https://example.com/kaos.jpg\``,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }

        // Delete product
        if (text.startsWith('/delproduct')) {
            const id = text.replace('/delproduct', '').trim();
            const index = store.products.findIndex(p => p.id === id);
            
            if (index !== -1) {
                const deleted = store.products.splice(index, 1)[0];
                await bot.telegram.sendMessage(chatId, 
                    `✅ *Produk berhasil dihapus!*\n\n📦 ${deleted.name}\n💰 Rp ${deleted.price.toLocaleString()}\n🆔 \`${deleted.id}\``,
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.telegram.sendMessage(chatId, 
                    `❌ *Produk tidak ditemukan!*\n\n🆔 \`${id}\`\n\nGunakan \`/listproduct\` untuk melihat daftar produk.`,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }

        // List products
        if (text === '/listproduct') {
            if (store.products.length === 0) {
                await bot.telegram.sendMessage(chatId, 
                    `📦 *Belum ada produk*\n\nTambahkan produk dengan perintah:\n\`/addproduct Nama|Harga|Deskripsi|url_gambar\``,
                    { parse_mode: 'Markdown' }
                );
            } else {
                let productList = '*📦 DAFTAR PRODUK*\n\n';
                store.products.forEach((p, i) => {
                    productList += `${i+1}. *${p.name}*\n`;
                    productList += `   🆔 \`${p.id}\`\n`;
                    productList += `   💰 Rp ${p.price.toLocaleString()}\n`;
                    productList += `   📝 ${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}\n\n`;
                });
                productList += `Gunakan \`/delproduct [id]\` untuk menghapus produk.`;
                
                await bot.telegram.sendMessage(chatId, productList, { parse_mode: 'Markdown' });
            }
            return res.status(200).json({ ok: true });
        }

        // Add portfolio
        if (text.startsWith('/addportfolio')) {
            const content = text.replace('/addportfolio', '').trim();
            const parts = content.split('|');
            
            if (parts.length >= 2) {
                const portfolio = {
                    id: Date.now().toString(),
                    title: parts[0].trim(),
                    description: parts[1] ? parts[1].trim() : '',
                    image: parts[2] ? parts[2].trim() : null,
                    createdAt: new Date().toISOString()
                };
                
                store.portfolios.push(portfolio);
                
                await bot.telegram.sendMessage(chatId, 
                    `✅ *PORTOFOLIO BERHASIL DITAMBAHKAN!*\n\n🖼️ ${portfolio.title}\n📝 ${portfolio.description}\n🆔 \`${portfolio.id}\``,
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.telegram.sendMessage(chatId, 
                    `❌ *Format salah!*\n\nGunakan format:\n\`/addportfolio Judul|Deskripsi|url_gambar\`\n\n*Contoh:*\n\`/addportfolio Website E-commerce|Website modern untuk toko online|https://example.com/project.jpg\``,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }

        // Delete portfolio
        if (text.startsWith('/delportfolio')) {
            const id = text.replace('/delportfolio', '').trim();
            const index = store.portfolios.findIndex(p => p.id === id);
            
            if (index !== -1) {
                const deleted = store.portfolios.splice(index, 1)[0];
                await bot.telegram.sendMessage(chatId, 
                    `✅ *Portofolio berhasil dihapus!*\n\n🖼️ ${deleted.title}\n🆔 \`${deleted.id}\``,
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.telegram.sendMessage(chatId, 
                    `❌ *Portofolio tidak ditemukan!*\n\n🆔 \`${id}\`\n\nGunakan \`/listportfolio\` untuk melihat daftar.`,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }

        // List portfolios
        if (text === '/listportfolio') {
            if (store.portfolios.length === 0) {
                await bot.telegram.sendMessage(chatId, 
                    `🖼️ *Belum ada portofolio*\n\nTambahkan portofolio dengan perintah:\n\`/addportfolio Judul|Deskripsi|url_gambar\``,
                    { parse_mode: 'Markdown' }
                );
            } else {
                let portfolioList = '*🖼️ DAFTAR PORTOFOLIO*\n\n';
                store.portfolios.forEach((p, i) => {
                    portfolioList += `${i+1}. *${p.title}*\n`;
                    portfolioList += `   🆔 \`${p.id}\`\n`;
                    portfolioList += `   📝 ${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}\n\n`;
                });
                portfolioList += `Gunakan \`/delportfolio [id]\` untuk menghapus portofolio.`;
                
                await bot.telegram.sendMessage(chatId, portfolioList, { parse_mode: 'Markdown' });
            }
            return res.status(200).json({ ok: true });
        }

        // Handle reply to customer (text)
        if (text && text.match(/^reply_[a-zA-Z0-9_]+/)) {
            const match = text.match(/^(reply_[a-zA-Z0-9_]+)\s+(.+)/s);
            if (match) {
                const deviceId = match[1];
                const replyMessage = match[2];
                
                store.customerResponses[deviceId] = {
                    text: replyMessage,
                    image: null,
                    timestamp: Date.now()
                };
                
                await bot.telegram.sendMessage(chatId, 
                    `✅ *Pesan terkirim ke customer!*\n\n━━━━━━━━━━━━━━━━━━━━\n🆔 *Device ID:* \n\`${deviceId}\`\n\n📝 *Pesan:* \n> ${replyMessage.substring(0, 200)}${replyMessage.length > 200 ? '...' : ''}\n━━━━━━━━━━━━━━━━━━━━`,
                    { parse_mode: 'Markdown' }
                );
            }
            return res.status(200).json({ ok: true });
        }
    }

    // Handle admin send photo with caption (reply to customer)
    if (isAdmin && body.message.photo) {
        const caption = body.message.caption || '';
        const match = caption.match(/^(reply_[a-zA-Z0-9_]+)/);
        
        if (match) {
            const deviceId = match[1];
            const text = caption.replace(deviceId, '').trim();
            
            // Get file URL
            const fileId = body.message.photo[body.message.photo.length - 1].file_id;
            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();
            const filePath = fileData.result.file_path;
            const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
            
            store.customerResponses[deviceId] = {
                text: text || null,
                image: photoUrl,
                timestamp: Date.now()
            };
            
            let responseText = `✅ *Gambar dan pesan terkirim ke customer!*\n\n━━━━━━━━━━━━━━━━━━━━\n🆔 *Device ID:* \n\`${deviceId}\`\n`;
            if (text) {
                responseText += `\n📝 *Pesan:* \n> ${text}\n`;
            }
            responseText += `━━━━━━━━━━━━━━━━━━━━\n📷 *Gambar:* ${photoUrl.substring(0, 80)}...`;
            
            await bot.telegram.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
            return res.status(200).json({ ok: true });
        }
    }

    // Default response for unknown commands
    if (isAdmin) {
        await bot.telegram.sendMessage(chatId, 
            `❌ *Perintah tidak dikenal*\n\nKetik \`/start\` untuk melihat daftar perintah yang tersedia.`,
            { parse_mode: 'Markdown' }
        );
    }

    return res.status(200).json({ ok: true });
}
