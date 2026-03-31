const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_secret_key_2026');

            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                return res.status(401).json({ error: "User not found" });
            }
            next();
        } catch (err) {
            res.status(401).json({ error: "Not authorized" });
        }
    } else {
        res.status(401).json({ error: "No token provided" });
    }
};

const optionalAuthenticate = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_secret_key_2026');
            req.user = await User.findById(decoded.id).select("-password");
        } catch (err) {
            // ignore token errors for optional auth
        }
    }
    next();
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ error: "Not authorized: No user found in request" });
        }
        if (!req.user.role) {
            return res.status(403).json({ error: "Not authorized: User has no role assigned" });
        }
        
        const userRoleLower = req.user.role.toLowerCase().trim();
        const allowedRolesLower = roles.map(r => r.toLowerCase().trim());
        
        if (!allowedRolesLower.includes(userRoleLower)) {
            return res.status(403).json({ 
                error: `Not authorized for this role. Your role: "${req.user.role}"`,
                details: `Required: ${roles.join(' or ')}`
            });
        }
        next();
    };
};

module.exports = { authenticate, optionalAuthenticate, authorize };
