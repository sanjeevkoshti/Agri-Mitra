const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token, authorization denied' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Add user from payload
        req.user = decoded;
        next();
    } catch (err) {
        console.error('[AuthMiddleware] Token verification failed:', err.message);
        res.status(401).json({ 
            success: false, 
            error: 'Token is not valid' 
        });
    }
};

module.exports = authMiddleware;
