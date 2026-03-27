export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { product, deviceId, ipAddress, userAgent, timestamp } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_CHAT_ID;

    // Format dengan blockquote dan backtick untuk memudahkan copy-paste
    const message = `🛒 *PESANAN BARU!*

━━━━━━━━━━━━━━━━━━━━
*PRODUK*
━━━━━━━━━━━━━━━━━━━━
> 📦 *Nama:* ${product.name}
> 💰 *Harga:* Rp ${product.price.toLocaleString()}
> 📝 *Deskripsi:* ${product.description || 'Tidak ada deskripsi'}

━━━━━━━━━━━━━━━━━━━━
*DATA PELANGGAN*
━━━━━━━━━━━━━━━━━━━━
> 🆔 *Device ID:* 
> \`${deviceId}\`

> 🌐 *IP Address:* 
> \`${ipAddress}\`

> 📱 *User Agent:* 
> \`${userAgent.substring(0, 150)}${userAgent.length > 150 ? '...' : ''}\`

> ⏰ *Waktu:* 
> \`${new Date(timestamp).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long'
})}\`

━━━━━━━━━━━━━━━━━━━━
*CARA RESPON*
━━━━━━━━━━━━━━━━━━━━
Balas dengan format berikut:

• *Kirim Teks:*
\`reply_${deviceId} [pesan Anda]\`

• *Kirim Foto + Teks:*
Kirim foto dengan caption:
\`reply_${deviceId} [pesan opsional]\`

*Contoh:*
\`reply_${deviceId} Halo kak, pesanan sedang diproses, mohon ditunggu ya\`

━━━━━━━━━━━━━━━━━━━━
*STATUS*
━━━━━━━━━━━━━━━━━━━━
⏳ Menunggu respons dari admin...`;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        res.status(200).json({ success: true });
    } catch(e) {
        console.error('Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
}