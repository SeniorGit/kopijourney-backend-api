const nodemailer = require('nodemailer');
require('dotenv').config();
const { pool } = require('./database');
const {v4:uuidv4} = require('uuid')

// emailsender logic
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

// token verivy
const emailverivy = async(req, res)=>{
    let client;
    try{
        // connect & take token from frontend
        client = await pool.connect();
        const {token} = req.body

        // verify token in DB with body
        const istoken = await client.query(`
            SELECT * FROM users WHERE verification_token = $1
            `, [token])
        if(istoken.rows.length === 0){
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            })
        }

        const user = istoken.rows[0];
        
        // if token expired
        if (user.verification_expires < new Date()){
            return res.status(400).json({
                success: false,
                message: 'Verification token has expired'
            });
        }

        // update db for email, token, and expired
        await client.query(`
            UPDATE users SET email_verified = true, verification_token = NULL, verification_expires= NULL WHERE id = $1`,
        [user.id])

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
    }finally{
        if (client) {
            client.release();
        }
    }
}

// resend token if expired
const tokenExpired = async(req, res)=>{
    let client;
    try{
        // connect & take email from body
        client = await pool.connect();
        const {email} = req.body;
        
        // check is user email exist 
        const isUser = await client.query(`
                SELECT * FROM users WHERE email = $1
            `, [email])
        if (isUser.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Your email is not registered"
            });
        }

        // generate verify token
        const verificationToken = uuidv4();
        const expiresIn = new Date(Date.now() + 24*60*60*1000);

        // update data table for token and expired
        const updateToken = await client.query(`
            UPDATE users SET 
            verification_token = $1, 
            verification_expires = $2
            WHERE email = $3
            `, [verificationToken, expiresIn, email])

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
    }finally{
        if(client){
            client.release()
        }
    }
   
}

module.exports = {emailSender, tokenExpired, emailverivy}