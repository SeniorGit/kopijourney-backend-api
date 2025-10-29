const express = require('express');
const authRouter = express.Router();
const {register, login} = require('../controllers/authController')
const {emailverivy, tokenExpired} = require('../lib/utils/verifyEmail')
const {ForgotPassword} = require('../lib/utils/forgotPassword')

authRouter.post("/forgot-pass", ForgotPassword )
authRouter.post("/register", register);
authRouter.post("/verify-email", emailverivy)
authRouter.post("/update-token", tokenExpired)
authRouter.post("/login", login);

module.exports = {authRouter}