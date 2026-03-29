// api/_db.js - Database dengan file cache + backup ke Telegram

import fs from 'fs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.TELEGRAM_CHAT_ID;
const DATA_PATH = '/tmp/store.json';

let DATABASE_MESSAGE_ID = null;

const defaultData = {
    profileImage: null,
    profileName: 'Xrans Official',
    profileTitle: 'Digital Creator',
    products: [],
    portfolios: [],
    customerResponses: {}
};

// ============================================
// BACA DATA - PRIORITAS DARI FILE (CACHE)
// ============================================
export async function readData() {
    try {
        // Coba baca dari file cache dulu (cepat)
        if (fs.existsSync(DATA_PATH)) {
            const data = fs.readFileSync(DATA_PATH, 'utf8');
            const parsed = JSON.parse(data);
            console.log('Data loaded from file cache');
            return { ...defaultData, ...parsed };
        }
    } catch (e) {}
    
    // Jika file tidak ada, ambil dari Telegram
    console.log('File cache not found, loading from Telegram...');
    const telegramData = await loadFromTelegram();
    if (telegramData) {
        // Simpan ke file cache
        fs.writeFileSync(DATA_PATH, JSON.stringify(telegramData, null, 2));
        return { ...defaultData, ...telegramData };
    }
    
    return { ...defaultData };
}

// ============================================
// TULIS DATA - SIMPAN KE FILE + BACKUP KE TELEGRAM
// ============================================
export async function writeData(data) {
    try {
        // 1. Simpan ke file cache (real-time)
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        console.log('Data saved to file cache');
        
        // 2. Backup ke Telegram (async, tidak ngeblock)
        const { customerResponses, ...backupData } = data;
        backupToTelegram(backupData);
        
        return true;
    } catch (e) {
        console.error('Error writing data:', e);
        return false;
    }
}

// ============================================
// LOAD DATABASE DARI TELEGRAM
// ============================================
async function loadFromTelegram() {
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offset: -1, limit: 50 })
            }
        );
        const result = await response.json();
        
        if (!result.ok || !result.result) return null;
        
        const messages = result.result.reverse();
        for (const update of messages) {
            const msg = update.message || update.edited_message;
            if (!msg || msg.chat.id.toString() !== ADMIN_ID) continue;
            const text = msg.text || msg.caption;
            if (!text) continue;
            try {
                const parsed = JSON.parse(text);
                if (parsed.hasOwnProperty('products') && parsed.hasOwnProperty('portfolios')) {
                    DATABASE_MESSAGE_ID = msg.message_id;
                    console.log('Database loaded from Telegram');
                    return parsed;
                }
            } catch (e) {}
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ============================================
// BACKUP KE TELEGRAM (TIDAK NGEMBAT)
// ============================================
async function backupToTelegram(data) {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        
        if (DATABASE_MESSAGE_ID) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_ID,
                    message_id: DATABASE_MESSAGE_ID,
                    text: jsonString
                })
            });
        } else {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: ADMIN_ID, text: jsonString })
            });
            const result = await response.json();
            if (result.ok) {
                DATABASE_MESSAGE_ID = result.result.message_id;
            }
        }
        console.log('Backup to Telegram completed');
    } catch (e) {
        console.error('Backup failed:', e);
    }
}

// ============================================
// FORCE RESTORE DARI TELEGRAM
// ============================================
export async function forceRestore() {
    const data = await loadFromTelegram();
    if (data) {
        await writeData(data);
        return data;
    }
    return null;
}

export async function manualBackup() {
    const data = await readData();
    const { customerResponses, ...backupData } = data;
    await backupToTelegram(backupData);
    return true;
}

// ============================================
// FUNGSI CRUD (SAMA SEPERTI SEBELUMNYA)
// ============================================
export async function getProducts() {
    const data = await readData();
    return data.products;
}

export async function addProduct(product) {
    const data = await readData();
    data.products.push(product);
    await writeData(data);
    return product;
}

export async function deleteProduct(id) {
    const data = await readData();
    data.products = data.products.filter(p => p.id !== id);
    await writeData(data);
}

export async function getPortfolios() {
    const data = await readData();
    return data.portfolios;
}

export async function addPortfolio(portfolio) {
    const data = await readData();
    data.portfolios.push(portfolio);
    await writeData(data);
}

export async function deletePortfolio(id) {
    const data = await readData();
    data.portfolios = data.portfolios.filter(p => p.id !== id);
    await writeData(data);
}

export async function updateProfile(updates) {
    const data = await readData();
    Object.assign(data, updates);
    await writeData(data);
}

export async function getProfile() {
    const data = await readData();
    return {
        profileImage: data.profileImage,
        profileName: data.profileName,
        profileTitle: data.profileTitle
    };
}

export async function saveCustomerResponse(deviceId, response) {
    const data = await readData();
    data.customerResponses = data.customerResponses || {};
    data.customerResponses[deviceId] = response;
    await writeData(data);
}

export async function getCustomerResponse(deviceId) {
    const data = await readData();
    return data.customerResponses?.[deviceId];
}

export async function deleteCustomerResponse(deviceId) {
    const data = await readData();
    if (data.customerResponses) {
        delete data.customerResponses[deviceId];
        await writeData(data);
    }
}

export async function getAllData() {
    return await readData();
}

export async function clearAllData() {
    await writeData({ ...defaultData });
}
