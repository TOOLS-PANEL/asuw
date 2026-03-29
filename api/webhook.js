// api/webhook.js - VERSI DIPERBAIKI (TIDAK LOOP)

import { 
    addProduct, deleteProduct, getProducts,
    addPortfolio, deletePortfolio, getPortfolios,
    updateProfile, getProfile,
    saveCustomerResponse, clearAllData,
    manualBackup, forceRestore, getAllData
} from './_db.js';

export default async function handler(req, res) {
    // PASTIKAN selalu return response 200 untuk GET
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'active' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !adminId) {
        return res.status(200).json({ ok: true }); // TETAP return 200
    }

    try {
        const body = req.body;
        if (!body || !body.message) {
            return res.status(200).json({ ok: true });
        }

        const chatId = body.message.chat.id;
        const text = body.message.text;
        const isAdmin = chatId.toString() === adminId;

        // ============================================
        // ADMIN COMMANDS - SEMUA PAKAI TRY-CATCH
        // ============================================
        if (isAdmin) {
            
            if (text === '/start') {
                try {
                    const data = await getAllData();
                    await sendMessage(botToken, chatId, 
                        'XRANS BOT\n\n' +
                        '📦 Produk: ' + (data.products?.length || 0) + '\n' +
                        '🖼️ Portofolio: ' + (data.portfolios?.length || 0) + '\n\n' +
                        '/addproduct Nama|Harga|Desk|url\n' +
                        '/listproduct\n' +
                        '/addportfolio Judul|Desk|url\n' +
                        '/listportfolio\n' +
                        '/backup\n' +
                        '/restore\n' +
                        '/clearall'
                    );
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text === '/backup') {
                try {
                    await sendMessage(botToken, chatId, 'Backup...');
                    await manualBackup();
                    await sendMessage(botToken, chatId, 'Backup berhasil!');
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Backup gagal: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text === '/restore') {
                try {
                    await sendMessage(botToken, chatId, 'Restore database...');
                    const data = await forceRestore();
                    await sendMessage(botToken, chatId, 'Restore berhasil! Produk: ' + (data?.products?.length || 0));
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Restore gagal: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text === '/clearall') {
                try {
                    await clearAllData();
                    await sendMessage(botToken, chatId, 'Semua data dihapus!');
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Gagal: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text === '/listproduct') {
                try {
                    const products = await getProducts();
                    if (!products || products.length === 0) {
                        await sendMessage(botToken, chatId, 'Belum ada produk');
                    } else {
                        let list = 'PRODUK:\n';
                        products.forEach((p, i) => {
                            list += (i+1) + '. ' + p.name + ' - Rp ' + (p.price?.toLocaleString() || 0) + '\nID: ' + p.id + '\n';
                        });
                        await sendMessage(botToken, chatId, list);
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text === '/listportfolio') {
                try {
                    const portfolios = await getPortfolios();
                    if (!portfolios || portfolios.length === 0) {
                        await sendMessage(botToken, chatId, 'Belum ada portofolio');
                    } else {
                        let list = 'PORTOFOLIO:\n';
                        portfolios.forEach((p, i) => {
                            list += (i+1) + '. ' + p.title + '\nID: ' + p.id + '\n';
                        });
                        await sendMessage(botToken, chatId, list);
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/setprofile')) {
                try {
                    const url = text.replace('/setprofile', '').trim();
                    if (url && url.startsWith('http')) {
                        await updateProfile({ profileImage: url });
                        await sendMessage(botToken, chatId, 'Foto diupdate');
                    } else {
                        await sendMessage(botToken, chatId, 'URL tidak valid');
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/setname')) {
                try {
                    const name = text.replace('/setname', '').trim();
                    if (name) {
                        await updateProfile({ profileName: name });
                        await sendMessage(botToken, chatId, 'Nama: ' + name);
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/settitle')) {
                try {
                    const title = text.replace('/settitle', '').trim();
                    if (title) {
                        await updateProfile({ profileTitle: title });
                        await sendMessage(botToken, chatId, 'Jabatan: ' + title);
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/addproduct')) {
                try {
                    const parts = text.replace('/addproduct', '').trim().split('|');
                    if (parts.length >= 2) {
                        const product = {
                            id: Date.now().toString(),
                            name: parts[0].trim(),
                            price: parseInt(parts[1].trim()) || 0,
                            description: parts[2] ? parts[2].trim() : '',
                            image: parts[3] ? parts[3].trim() : null
                        };
                        await addProduct(product);
                        await sendMessage(botToken, chatId, 'Produk: ' + product.name + '\nID: ' + product.id);
                    } else {
                        await sendMessage(botToken, chatId, 'Format: /addproduct Nama|Harga|Desk|url');
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/delproduct')) {
                try {
                    const id = text.replace('/delproduct', '').trim();
                    if (id) {
                        await deleteProduct(id);
                        await sendMessage(botToken, chatId, 'Hapus ID: ' + id);
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/addportfolio')) {
                try {
                    const parts = text.replace('/addportfolio', '').trim().split('|');
                    if (parts.length >= 2) {
                        const portfolio = {
                            id: Date.now().toString(),
                            title: parts[0].trim(),
                            description: parts[1] ? parts[1].trim() : '',
                            image: parts[2] ? parts[2].trim() : null
                        };
                        await addPortfolio(portfolio);
                        await sendMessage(botToken, chatId, 'Portofolio: ' + portfolio.title + '\nID: ' + portfolio.id);
                    } else {
                        await sendMessage(botToken, chatId, 'Format: /addportfolio Judul|Desk|url');
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text.startsWith('/delportfolio')) {
                try {
                    const id = text.replace('/delportfolio', '').trim();
                    if (id) {
                        await deletePortfolio(id);
                        await sendMessage(botToken, chatId, 'Hapus ID: ' + id);
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }

            if (text && text.match(/^reply_/)) {
                try {
                    const match = text.match(/^(reply_[a-zA-Z0-9_]+)\s+(.+)/s);
                    if (match) {
                        const deviceId = match[1];
                        const replyMessage = match[2];
                        await saveCustomerResponse(deviceId, { text: replyMessage, image: null, timestamp: Date.now() });
                        await sendMessage(botToken, chatId, 'Pesan ke: ' + deviceId);
                    }
                } catch(e) {
                    await sendMessage(botToken, chatId, 'Error: ' + e.message);
                }
                return res.status(200).json({ ok: true });
            }
        }

        // Photo reply
        if (isAdmin && body.message.photo) {
            try {
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
                    await sendMessage(botToken, chatId, 'Gambar ke: ' + deviceId);
                }
            } catch(e) {
                console.error('Photo error:', e);
            }
            return res.status(200).json({ ok: true });
        }

        // Customer /start
        if (!isAdmin && text === '/start') {
            await sendMessage(botToken, chatId, 'Xrans Official\nhttps://xrans-official.vercel.app');
            return res.status(200).json({ ok: true });
        }

        return res.status(200).json({ ok: true });

    } catch (error) {
        // JANGAN LUPA: tetap return 200 biar Telegram stop loop
        console.error('Fatal error:', error);
        return res.status(200).json({ ok: true, error: error.message });
    }
}

async function sendMessage(token, chatId, text) {
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text })
        });
    } catch (err) {
        console.error('Send message error:', err);
    }
}
