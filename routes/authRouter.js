const express = require('express');
const authRouter = express.Router();
const {register, login} = require('../controllers/authController')
const {emailverivy, tokenExpired} = require('../lib/utils/verifyEmail')

authRouter.post("/register", register);
authRouter.post("/verify-email", emailverivy)
authRouter.post("/update-token", tokenExpired)
authRouter.post("/login", login);

module.exports = {authRouter}