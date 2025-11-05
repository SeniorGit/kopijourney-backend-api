const {v4:uuidv4} = require('uuid')
const nodemailer = require('nodemailer')
require('dotenv').config()
const db = require('./database')
const {hashPassword, validatePassword} = require('./passwordUtils')

// email sender
const sendForgotPassEmail = async(useremail, tokenverfy)=>{
    try{
        // email configure only for development
        const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS
            }
        })
        // email body 
        await transporter.sendMail({
            from: `Kopi Journey <kopijourney@journey.com>`,
            to: useremail,
            subject: 'Account Verification',
            text: `Click this link to reset your password: https://kopijourney/reset-password?token=${tokenverfy}`,
        })
    }catch(error){
        console.error("Email sending failed: ",error);
        throw error;
    }
}

// forgot password verification request
const ForgotPassword = async (req, res)=>{
    try{
        // take email from body and confirm if not null
        const {email} = req.body;
        if(!email){
            return res.status(400).json({
                success: false,
                message: 'Email fields are required'
            })
        }

        // check is email exist
        const user = await db('users').where('email', email).first();
        if(!user){
            return res.status(200).json({
                success: true,
                message: "If the email exists, reset instructions will be sent"
            })
        }
        
        // creating uuid and expired date for 15 minutes
        const resetToken = uuidv4();
        const expiresIn = new Date(Date.now() + 15 * 60 * 1000);

        // if reset token still valid
        if (user.reset_token && user.reset_expires > new Date()) {
            return res.status(400).json({
                success: false,
                message: "Reset token already sent. Please check your email or wait until it expires."
            });
        }

        // add reset and expires date to DB
        await db('users')
            .where('email', email) 
            .update({
                'reset_token': resetToken,
                'reset_expires': expiresIn
            })
            
        // sending email 
        await sendForgotPassEmail(email, resetToken)
        res.status(201).json({
            success: true,
            message: "Confirmation change send to your email, valid only 15 minutes"
        })

    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

// change password forgot password
const ChangePassword = async(req, res)=>{
    try{
        // verify token exist from users
        const {token, newpassword} = req.body;
        if(!token){
            return res.status(401).json({
                success:false,
                message: "Token is required"
            });
        }

        // check token if exist on db
        const user = await db('users').where('reset_token', token).first();
        if(!user){
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            })
        }

        // if token expired
        if(user.reset_expires < new Date()){
            return res.status(401).json({
                success: false,
                message: "Reset token has expired. Please request a new password reset."
            })
        }

        // check new password
        if (!validatePassword(newpassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
            });
        }

        const hashNewPassword = await hashPassword(newpassword);

        await db('users')
            .where('reset_token', token)
            .update({
                'password': hashNewPassword,
                'reset_token': null,
                'reset_expires': null
            })
        
        res.status(200).json({
            success: true,
            message:  "Password changed successfully"
        })
    }catch(error){
        console.error(error);
        res.status(500).json({
            success:false,
            message: 'Internal server error'
        })
    }
}

module.exports = {ForgotPassword, ChangePassword}