// api/send-to-customer.js - Kirim order ke admin Telegram

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { product, deviceId, ipAddress, userAgent, timestamp } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_CHAT_ID;

    const message = `
🛒 PESANAN BARU!
━━━━━━━━━━━━━━━━━━━━
PRODUK: ${product.name}
HARGA: Rp ${product.price.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
DEVICE ID: \`${deviceId}\`
IP: \`${ipAddress}\`
WAKTU: ${new Date(timestamp).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
BALAS: reply_${deviceId} [pesan]
`;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: adminId, text: message, parse_mode: 'Markdown' })
        });
        res.status(200).json({ success: true });
    } catch(e) {
        res.status(500).json({ success: false });
    }
}