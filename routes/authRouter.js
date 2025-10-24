const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/authController')

authRouter.post("/regiester", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/profile", authController)
authRouter.post("/logout", authController);
