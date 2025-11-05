const nodemailer = require('nodemailer');
require('dotenv').config();
const { pool } = require('./database');
const {v4:uuidv4} = require('uuid')
const db = require('./database')

// emailsender 
const emailSender = async(userEmail, tokenverify)=>{
    try{
        // configure for email sender only development
        const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS
            }
        })
        // send email
        await transporter.sendMail({
            from: `Kopi Journey <kopijourney@journey.com>`,
            to: userEmail,
            subject: 'Account Verification',
            text: `Click this link to verify your email: https://kopijourney/verify-email?token=${tokenverify}`,
        });
    }catch(error){
        console.error("Email sending failed: ",error);
        throw error;
    }
}

// email verification
const emailverivy = async(req, res)=>{
    try{
        // take token from frontend
        const {token} = req.body;

        if(!token){
            return res.status.json({
                success:false,
                message: "Token is required"
            });
        }

        // verify token in DB with body
        const user = await db('users')
            .where('verification_token', token)
            .first();

        if(!user){
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            })
        }

        // if token expired
        if (user.verification_expires < new Date()){
            return res.status(400).json({
                success: false,
                message: 'Verification token has expired'
            });
        }

        // update db for email, token, and expired
        await db('users')
            .where('id', user.id)
            .update({
                'email_verified': true,
                'verification_token': null,
                'verification_expires': null
            })

        // status OK
        res.status(201).json({
            success: true,
            message: 'Your account is actived'
        })

    }catch(error){
        console.error(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error' 
        })
    }
}

// resend email verification token
const tokenExpired = async(req, res)=>{
    try{
        // take email from body
        const {email} = req.body;
        
        // check is user email exist 
        const user = await db('users')
            .where('email', email)
            .first();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Your email is not registered"
            });
        }

        // generate verify token
        const verificationToken = uuidv4();
        const expiresIn = new Date(Date.now() + 24*60*60*1000);

        // update data table for token and expired
        await db('users')
            .where('email', email)
            .update({
                'verification_token': verificationToken,
                'verification_expires': expiresIn,
            })
        
        // send email verify
        await emailSender(email, verificationToken)

        res.status(201).json({
            success: true,
            message: 'Your token is updated'
        })
    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

module.exports = {emailSender, tokenExpired, emailverivy}