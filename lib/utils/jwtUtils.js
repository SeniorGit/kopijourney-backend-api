const jwt = require('jsonwebtoken');

// generate jwt token
const generateToken = (payload, rememberMe) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: rememberMe ? '7d': JWT_EXPIRES_IN
    });
};

// verify token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const decodeToken = (token) => {
    try{
        return jwt.decode(token, process.env.JWT_SECRET);
    }catch{
        null;
    }
};

module.exports = { generateToken, verifyToken, decodeToken};