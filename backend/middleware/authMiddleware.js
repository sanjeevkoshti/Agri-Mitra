const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    // Debug log for presence (be careful with logs on production, but we need this)
    if (process.env.NODE_ENV !== 'production' || true) { // Temporarily enabled for prod debugging
        // global.serverLog(`[Auth] Header present: ${!!authHeader}`);
    }

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
        // Log the specific error for server logs
        if (global.serverLog) {
            global.serverLog(`❌ [Auth] Verification failed: ${err.message} | Secret length: ${JWT_SECRET.length} | Token start: ${token.substring(0, 10)}...`);
        } else {
            console.error('[Auth] Verification failed:', err.message);
        }

        // Return the specific error to the client for easier debugging
        res.status(401).json({ 
            success: false, 
            error: 'Token is not valid',
            reason: err.message,
            token_expired: err.name === 'TokenExpiredError'
        });
    }
};

module.exports = authMiddleware;

