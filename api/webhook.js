// api/webhook.js - VERSION TANPA MARKDOWN (AMAN)

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
    // Handle GET request
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'active',
            message: 'Webhook is running',
            timestamp: new Date().toISOString()
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !adminId) {
        console.error('Missing environment variables');
        return res.status(500).json({ error: 'Configuration error' });
    }

    try {
        const body = req.body;
        
        if (!body || !body.message) {
            return res.status(200).json({ ok: true });
        }

        const chatId = body.message.chat.id;
        const text = body.message.text;
        const isAdmin = chatId.toString() === adminId;

        console.log(`Message from ${chatId}: ${text}`);

        // ============================================
        // ADMIN COMMANDS
        // ============================================
        if (isAdmin) {
            
            // /start - Menu Utama
            if (text === '/start') {
                await sendMessage(botToken, chatId, `
╔══════════════════════════════════╗
║     XRANS OFFICIAL BOT           ║
╚══════════════════════════════════╝

📸 PROFILE SETTINGS
/setprofile [url] - Ganti foto profil
/setname [nama] - Ganti nama
/settitle [title] - Ganti jabatan

📦 PRODUCT MANAGEMENT
/addproduct Nama|Harga|Deskripsi|url - Tambah produk
/delproduct [id] - Hapus produk
/listproduct - Lihat semua produk

🖼️ PORTFOLIO MANAGEMENT
/addportfolio Judul|Deskripsi|url - Tambah portofolio
/delportfolio [id] - Hapus portofolio
/listportfolio - Lihat semua portofolio

💬 RESPONSE TO CUSTOMER
reply_[deviceId] [pesan] - Balas teks
Kirim foto dengan caption reply_[deviceId] - Balas foto

Contoh:
/addproduct Kaos Premium|150000|Kaos katun|https://example.com/kaos.jpg
reply_device123 Halo, pesanan sedang diproses
`);
                return res.status(200).json({ ok: true });
            }

            // Set profile image
            if (text.startsWith('/setprofile')) {
                const url = text.replace('/setprofile', '').trim();
                if (url && url.startsWith('http')) {
                    store.profileImage = url;
                    await sendMessage(botToken, chatId, `✅ Foto profil berhasil diupdate!\n\nURL: ${url}`);
                } else {
                    await sendMessage(botToken, chatId, `❌ Format salah!\nGunakan: /setprofile https://example.com/foto.jpg`);
                }
                return res.status(200).json({ ok: true });
            }

            // Set profile name
            if (text.startsWith('/setname')) {
                const name = text.replace('/setname', '').trim();
                if (name) {
                    store.profileName = name;
                    await sendMessage(botToken, chatId, `✅ Nama berhasil diubah menjadi: ${name}`);
                } else {
                    await sendMessage(botToken, chatId, `❌ Format salah!\nGunakan: /setname Xrans Official`);
                }
                return res.status(200).json({ ok: true });
            }

            // Set profile title
            if (text.startsWith('/settitle')) {
                const title = text.replace('/settitle', '').trim();
                if (title) {
                    store.profileTitle = title;
                    await sendMessage(botToken, chatId, `✅ Jabatan berhasil diubah menjadi: ${title}`);
                } else {
                    await sendMessage(botToken, chatId, `❌ Format salah!\nGunakan: /settitle Digital Creator`);
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
                        image: parts[3] ? parts[3].trim() : null
                    };
                    
                    store.products.push(product);
                    await sendMessage(botToken, chatId, 
                        `✅ PRODUK BERHASIL DITAMBAHKAN!\n\n📦 Nama: ${product.name}\n💰 Harga: Rp ${product.price.toLocaleString()}\n🆔 ID: ${product.id}\n📝 Deskripsi: ${product.description || '-'}`
                    );
                } else {
                    await sendMessage(botToken, chatId, 
                        `❌ Format salah!\n\nGunakan:\n/addproduct Nama|Harga|Deskripsi|url\n\nContoh:\n/addproduct Kaos Premium|150000|Kaos katun berkualitas|https://example.com/kaos.jpg`
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
                    await sendMessage(botToken, chatId, `✅ Produk berhasil dihapus!\n\n📦 ${deleted.name}\n💰 Rp ${deleted.price.toLocaleString()}`);
                } else {
                    await sendMessage(botToken, chatId, `❌ Produk dengan ID ${id} tidak ditemukan.\n\nGunakan /listproduct untuk melihat daftar produk.`);
                }
                return res.status(200).json({ ok: true });
            }

            // List products
            if (text === '/listproduct') {
                if (store.products.length === 0) {
                    await sendMessage(botToken, chatId, `📦 Belum ada produk.\n\nTambahkan produk dengan:\n/addproduct Nama|Harga|Deskripsi|url`);
                } else {
                    let list = '📦 DAFTAR PRODUK\n━━━━━━━━━━━━━━━━━━━━\n\n';
                    store.products.forEach((p, i) => {
                        list += `${i+1}. ${p.name}\n`;
                        list += `   ID: ${p.id}\n`;
                        list += `   Harga: Rp ${p.price.toLocaleString()}\n`;
                        list += `   Deskripsi: ${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}\n\n`;
                    });
                    list += `Gunakan /delproduct [id] untuk menghapus produk.`;
                    await sendMessage(botToken, chatId, list);
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
                        image: parts[2] ? parts[2].trim() : null
                    };
                    
                    store.portfolios.push(portfolio);
                    await sendMessage(botToken, chatId, `✅ PORTOFOLIO BERHASIL DITAMBAHKAN!\n\n🖼️ Judul: ${portfolio.title}\n📝 Deskripsi: ${portfolio.description}\n🆔 ID: ${portfolio.id}`);
                } else {
                    await sendMessage(botToken, chatId, 
                        `❌ Format salah!\n\nGunakan:\n/addportfolio Judul|Deskripsi|url\n\nContoh:\n/addportfolio Website E-commerce|Website modern untuk toko online|https://example.com/project.jpg`
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
                    await sendMessage(botToken, chatId, `✅ Portofolio berhasil dihapus!\n\n🖼️ ${deleted.title}`);
                } else {
                    await sendMessage(botToken, chatId, `❌ Portofolio dengan ID ${id} tidak ditemukan.\n\nGunakan /listportfolio untuk melihat daftar.`);
                }
                return res.status(200).json({ ok: true });
            }

            // List portfolios
            if (text === '/listportfolio') {
                if (store.portfolios.length === 0) {
                    await sendMessage(botToken, chatId, `🖼️ Belum ada portofolio.\n\nTambahkan portofolio dengan:\n/addportfolio Judul|Deskripsi|url`);
                } else {
                    let list = '🖼️ DAFTAR PORTOFOLIO\n━━━━━━━━━━━━━━━━━━━━\n\n';
                    store.portfolios.forEach((p, i) => {
                        list += `${i+1}. ${p.title}\n`;
                        list += `   ID: ${p.id}\n`;
                        list += `   Deskripsi: ${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}\n\n`;
                    });
                    list += `Gunakan /delportfolio [id] untuk menghapus portofolio.`;
                    await sendMessage(botToken, chatId, list);
                }
                return res.status(200).json({ ok: true });
            }

            // Handle reply to customer (text)
            if (text && text.match(/^reply_/)) {
                const match = text.match(/^(reply_[a-zA-Z0-9_]+)\s+(.+)/s);
                if (match) {
                    const deviceId = match[1];
                    const replyMessage = match[2];
                    
                    store.customerResponses[deviceId] = {
                        text: replyMessage,
                        image: null,
                        timestamp: Date.now()
                    };
                    
                    await sendMessage(botToken, chatId, 
                        `✅ Pesan terkirim ke customer!\n\nDevice ID: ${deviceId}\nPesan: ${replyMessage.substring(0, 200)}`
                    );
                }
                return res.status(200).json({ ok: true });
            }
        }

        // ============================================
        // HANDLE ADMIN SEND PHOTO
        // ============================================
        if (isAdmin && body.message.photo) {
            const caption = body.message.caption || '';
            const match = caption.match(/^(reply_[a-zA-Z0-9_]+)/);
            
            if (match) {
                const deviceId = match[1];
                const textMessage = caption.replace(deviceId, '').trim();
                
                const fileId = body.message.photo[body.message.photo.length - 1].file_id;
                const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
                const fileData = await fileRes.json();
                const photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
                
                store.customerResponses[deviceId] = {
                    text: textMessage || null,
                    image: photoUrl,
                    timestamp: Date.now()
                };
                
                await sendMessage(botToken, chatId, `✅ Gambar dan pesan terkirim ke customer!\n\nDevice ID: ${deviceId}`);
            }
            return res.status(200).json({ ok: true });
        }

        // ============================================
        // CUSTOMER COMMANDS
        // ============================================
        if (!isAdmin && text === '/start') {
            await sendMessage(botToken, chatId, 
                `🛍️ Selamat datang di Xrans Official!\n\nKunjungi website kami:\nhttps://xrans-official.vercel.app\n\nUntuk order, silakan melalui website.`
            );
            return res.status(200).json({ ok: true });
        }

        // Default response untuk perintah tidak dikenal (admin only)
        if (isAdmin && text && !text.startsWith('/')) {
            await sendMessage(botToken, chatId, `❌ Perintah tidak dikenal.\n\nKetik /start untuk melihat daftar perintah.`);
        }

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

// Fungsi helper kirim pesan - TANPA Markdown!
async function sendMessage(token, chatId, text) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text
                // TIDAK ADA parse_mode - pakai plain text
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Telegram API error:', error);
        }
    } catch (err) {
        console.error('Failed to send message:', err);
    }
}
