const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const token = req.cookies.token || (req.header("Authorization") && req.header("Authorization").split(" ")[1]);

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
}


// Middleware to allow only admins
function authorizeAdmin(req, res, next) {
    if (!req.user || req.user.roleID !== 2) {  // Ensure user exists and is admin
        return res.status(403).json({ message: "Admins only. Access denied."});
    }
    next();
}

// Middleware to allow only users
function authorizeUser(req, res, next) {
    if (!req.user || req.user.roleID !== 1) {  // Ensure user exists and is a normal user
        return res.status(403).json({ message: "Users only. Access denied."});
    }
    next();
}

module.exports = { authenticateToken, authorizeAdmin, authorizeUser };