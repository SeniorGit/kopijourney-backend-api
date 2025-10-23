const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/authController')

authRouter.post("/regiester", authController);
authRouter.post("/login", authController);
authRouter.post("/logout", authController);
authRouter.get("/me")