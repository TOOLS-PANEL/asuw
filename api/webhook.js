export default async function handler(req, res) {
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'active', message: 'Database di Telegram' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !adminId) {
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

        // ADMIN COMMANDS
        if (isAdmin) {
            
            if (text === '/start') {
                await sendMessage(botToken, chatId, 
                    'XRANS OFFICIAL BOT\n\n' +
                    '📦 Produk: ' + (await getProductCount()) + '\n' +
                    '🖼️ Portofolio: ' + (await getPortfolioCount()) + '\n\n' +
                    '📸 PROFILE\n/setprofile [url]\n/setname [nama]\n/settitle [title]\n\n' +
                    '📦 PRODUCT\n/addproduct Nama|Harga|Deskripsi|url\n/delproduct [id]\n/listproduct\n\n' +
                    '🖼️ PORTFOLIO\n/addportfolio Judul|Deskripsi|url\n/delportfolio [id]\n/listportfolio\n\n' +
                    '💾 BACKUP\n/backup\n/restore\n/clearall\n\n' +
                    '💬 RESPON\nreply_[deviceId] [pesan]'
                );
                return res.status(200).json({ ok: true });
            }

            if (text === '/backup') {
                await sendMessage(botToken, chatId, 'Backup database...');
                const success = await manualBackup();
                await sendMessage(botToken, chatId, success ? 'Backup berhasil!' : 'Backup gagal!');
                return res.status(200).json({ ok: true });
            }

            if (text === '/restore') {
                await sendMessage(botToken, chatId, 'Restore database...');
                const data = await forceRestore();
                await sendMessage(botToken, chatId, 'Restore berhasil! Produk: ' + (data.products?.length || 0));
                return res.status(200).json({ ok: true });
            }

            if (text === '/clearall') {
                await clearAllData();
                await sendMessage(botToken, chatId, 'Semua data dihapus!');
                return res.status(200).json({ ok: true });
            }

            if (text === '/listproduct') {
                const products = await getProducts();
                if (products.length === 0) {
                    await sendMessage(botToken, chatId, 'Belum ada produk');
                } else {
                    let list = 'DAFTAR PRODUK\n';
                    products.forEach((p, i) => {
                        list += (i+1) + '. ' + p.name + '\n   Rp ' + p.price.toLocaleString() + '\n   ID: ' + p.id + '\n\n';
                    });
                    await sendMessage(botToken, chatId, list);
                }
                return res.status(200).json({ ok: true });
            }

            if (text === '/listportfolio') {
                const portfolios = await getPortfolios();
                if (portfolios.length === 0) {
                    await sendMessage(botToken, chatId, 'Belum ada portofolio');
                } else {
                    let list = 'DAFTAR PORTOFOLIO\n';
                    portfolios.forEach((p, i) => {
                        list += (i+1) + '. ' + p.title + '\n   ID: ' + p.id + '\n\n';
                    });
                    await sendMessage(botToken, chatId, list);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/setprofile')) {
                const url = text.replace('/setprofile', '').trim();
                if (url && url.startsWith('http')) {
                    await updateProfile({ profileImage: url });
                    await sendMessage(botToken, chatId, 'Foto profil diupdate: ' + url);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/setname')) {
                const name = text.replace('/setname', '').trim();
                if (name) {
                    await updateProfile({ profileName: name });
                    await sendMessage(botToken, chatId, 'Nama: ' + name);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/settitle')) {
                const title = text.replace('/settitle', '').trim();
                if (title) {
                    await updateProfile({ profileTitle: title });
                    await sendMessage(botToken, chatId, 'Jabatan: ' + title);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/addproduct')) {
                const parts = text.replace('/addproduct', '').trim().split('|');
                if (parts.length >= 2) {
                    const product = {
                        id: Date.now().toString(),
                        name: parts[0].trim(),
                        price: parseInt(parts[1].trim()),
                        description: parts[2] ? parts[2].trim() : '',
                        image: parts[3] ? parts[3].trim() : null
                    };
                    await addProduct(product);
                    await sendMessage(botToken, chatId, 'Produk ditambahkan: ' + product.name + '\nID: ' + product.id);
                } else {
                    await sendMessage(botToken, chatId, 'Format salah! /addproduct Nama|Harga|Deskripsi|url');
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/delproduct')) {
                const id = text.replace('/delproduct', '').trim();
                await deleteProduct(id);
                await sendMessage(botToken, chatId, 'Hapus produk ID: ' + id);
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/addportfolio')) {
                const parts = text.replace('/addportfolio', '').trim().split('|');
                if (parts.length >= 2) {
                    const portfolio = {
                        id: Date.now().toString(),
                        title: parts[0].trim(),
                        description: parts[1] ? parts[1].trim() : '',
                        image: parts[2] ? parts[2].trim() : null
                    };
                    await addPortfolio(portfolio);
                    await sendMessage(botToken, chatId, 'Portofolio ditambahkan: ' + portfolio.title + '\nID: ' + portfolio.id);
                } else {
                    await sendMessage(botToken, chatId, 'Format salah! /addportfolio Judul|Deskripsi|url');
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/delportfolio')) {
                const id = text.replace('/delportfolio', '').trim();
                await deletePortfolio(id);
                await sendMessage(botToken, chatId, 'Hapus portofolio ID: ' + id);
                return res.status(200).json({ ok: true });
            }

            if (text && text.match(/^reply_/)) {
                const match = text.match(/^(reply_[a-zA-Z0-9_]+)\s+(.+)/s);
                if (match) {
                    const deviceId = match[1];
                    const replyMessage = match[2];
                    await saveCustomerResponse(deviceId, { text: replyMessage, image: null, timestamp: Date.now() });
                    await sendMessage(botToken, chatId, 'Pesan ke ' + deviceId + ': ' + replyMessage.substring(0, 100));
                }
                return res.status(200).json({ ok: true });
            }
        }

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
                await saveCustomerResponse(deviceId, { text: textMessage || null, image: photoUrl, timestamp: Date.now() });
                await sendMessage(botToken, chatId, 'Gambar ke ' + deviceId);
            }
            return res.status(200).json({ ok: true });
        }

        if (!isAdmin && text === '/start') {
            await sendMessage(botToken, chatId, 'Xrans Official\nhttps://xrans-official.vercel.app');
            return res.status(200).json({ ok: true });
        }

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Helper functions (import dari _db.js)
import { 
    addProduct, deleteProduct, getProducts,
    addPortfolio, deletePortfolio, getPortfolios,
    updateProfile, getProfile,
    saveCustomerResponse, clearAllData,
    manualBackup, forceRestore, getAllData
} from './_db.js';

async function getProductCount() {
    const p = await getProducts();
    return p.length;
}

async function getPortfolioCount() {
    const p = await getPortfolios();
    return p.length;
}

async function sendMessage(token, chatId, text) {
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text })
        });
    } catch (err) {}
}
