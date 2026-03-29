// api/get-response.js - Cek respons admin untuk customer

import { getCustomerResponse, deleteCustomerResponse } from './_db.js';

export default async function handler(req, res) {
    const { deviceId } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const response = await getCustomerResponse(deviceId);
        if (response && (Date.now() - response.timestamp < 3600000)) {
            const result = { hasResponse: true, text: response.text, image: response.image };
            await deleteCustomerResponse(deviceId);
            res.status(200).json(result);
        } else {
            res.status(200).json({ hasResponse: false });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
}