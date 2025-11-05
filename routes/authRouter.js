const express = require('express');
const rateLimit = require('express-rate-limit');
const authRouter = express.Router();
const {register, login} = require('../controllers/authController')
const {emailverivy, tokenExpired} = require('../lib/utils/verifyEmail')
const {ForgotPassword} = require('../lib/utils/forgotPassword')

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify-email", emailverivy)
authRouter.post("/update-token-email", tokenExpired)
authRouter.post("/forgot-pass", rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 3,
    message: {
            success: false,
            message: 'Too many password reset attempts, please try again after 15 minutes'
        }
    }), 
    ForgotPassword)

module.exports = {authRouter}