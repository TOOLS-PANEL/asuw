// api/_db.js - Database via Telegram (tanpa file lokal)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.TELEGRAM_CHAT_ID;

let DATABASE_MESSAGE_ID = null;

const defaultData = {
    profileImage: null,
    profileName: 'Xrans Official',
    profileTitle: 'Digital Creator',
    products: [],
    portfolios: [],
    customerResponses: {}
};

export async function readData() {
    try {
        const messages = await getLastDatabaseMessage();
        if (messages && messages.text) {
            const data = JSON.parse(messages.text);
            return { ...defaultData, ...data };
        }
    } catch (e) {}
    return { ...defaultData };
}

export async function writeData(data) {
    try {
        const { customerResponses, ...backupData } = data;
        const jsonString = JSON.stringify(backupData, null, 2);
        return await sendDatabaseMessage(jsonString);
    } catch (e) {
        return false;
    }
}

async function getLastDatabaseMessage() {
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
                    return { text, message_id: msg.message_id };
                }
            } catch (e) {}
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function sendDatabaseMessage(jsonString) {
    try {
        if (DATABASE_MESSAGE_ID) {
            const response = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: ADMIN_ID,
                        message_id: DATABASE_MESSAGE_ID,
                        text: jsonString
                    })
                }
            );
            const result = await response.json();
            if (result.ok) return true;
        }
        
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_ID,
                    text: jsonString
                })
            }
        );
        const result = await response.json();
        if (result.ok) {
            DATABASE_MESSAGE_ID = result.result.message_id;
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export async function forceRestore() {
    const data = await readData();
    await writeData(data);
    return data;
}

export async function manualBackup() {
    const data = await readData();
    return await writeData(data);
}

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