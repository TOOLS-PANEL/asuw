// api/get-data.js - Ambil data untuk website

import { getAllData } from './_db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const data = await getAllData();
        res.status(200).json({
            profileImage: data.profileImage,
            profileName: data.profileName,
            profileTitle: data.profileTitle,
            products: data.products,
            portfolios: data.portfolios
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}
