let customerResponses = {};

export default async function handler(req, res) {
    const { deviceId } = req.query;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const response = customerResponses[deviceId];
    
    if (response && (Date.now() - response.timestamp < 3600000)) {
        const result = {
            hasResponse: true,
            text: response.text,
            image: response.image
        };
        
        delete customerResponses[deviceId];
        
        res.status(200).json(result);
    } else {
        res.status(200).json({ hasResponse: false });
    }
}