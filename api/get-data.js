// api/get-data.js - Dengan no-cache agar real-time

import { getAllData } from './_db.js';

export default async function handler(req, res) {
    // Header untuk mencegah cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
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
