// In-memory store
let store = {
    profileImage: null,
    profileName: 'Xrans Official',
    profileTitle: 'Digital Creator',
    products: [],
    portfolios: []
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const data = {
        profileImage: store.profileImage,
        profileName: store.profileName,
        profileTitle: store.profileTitle,
        products: store.products,
        portfolios: store.portfolios
    };
    
    res.status(200).json(data);
}