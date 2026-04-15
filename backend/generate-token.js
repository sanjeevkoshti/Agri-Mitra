const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'd:/Pramod/md/Mandi-Connect/backend/.env' });

const token = jwt.sign(
    { id: '6c2bd84d-10bb-495e-9c10-65c05a4a7de2', role: 'farmer', email: 'test@example.com' },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
);

console.log(token);
