const {pool} = require('./database')
const {v4:uuidv4} = require('uuid')
const nodemailer = require('nodemailer')
require('dotenv').config()

// to send email forgot password confirmation
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

// forgot password logic
const ForgotPassword = async (req, res)=>{
    let client;
    try{
        // take email from body and confirm if not null
        const [email] = req.body;
        if(!email){
            return res.status(400).json({
                success: false,
                message: 'Email fields are required'
            })
        }

        // connent to database
        client = await pool.connect()

        // check is email exist
        const isEmail = await client.query('SELECT * FROM users WHERE email = $1',[email])
        if(isEmail.rows.length === 0){
            return res.status(401).json({
                success: false,
                message: 'Email not registerd'
            })
        }
        
        // creating uuid and expired date for 15 minutes
        const resetPass = uuidv4();
        const resetPassEx = new Date(Date.now() + 15 * 60 * 1000);

        // add reset and expires date to DB
        const addtoken = await client.query(`
            UPDATE users SET 
            reset_token = $1, 
            reset_expires = $2 
            WHERE email = $3`, [resetPass, resetPassEx, email])
        
        // sending email 
        await sendForgotPassEmail(email, resetPass)
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
    }finally{
        if(client){
            client.realese()
        }
    }
}

module.exports = {ForgotPassword}