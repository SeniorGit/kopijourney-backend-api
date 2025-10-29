const { hashPassword, comparePassword, validatePassword } = require('../lib/utils/passwordUtils');
const { generateToken } = require('../lib/utils/jwtUtils');
const { pool } = require('../lib/utils/database');
const {emailSender} = require('../lib/utils/verifyEmail')
const {v4:uuidv4} = require('uuid')
// REGISTER
exports.register = async (req, res) => {
    let client;
    try {
        // Validasi input DULU sebelum connect database
        const { email, password, firstName, lastName, role } = req.body;

        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        // Validasi password
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
            });
        }

        // connect and checking user if exist
        client = await pool.connect();
        const userCheck = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (userCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // hashed password
        const hashedPassword = await hashPassword(password);

        // token for verivy email
        const verificationToken = uuidv4();
        const expiresIn = new Date(Date.now() + 24*60*60*1000);
        // insert to db
        const newUser = await client.query(
            `INSERT INTO users (email, password, first_name, 
            last_name, role, verification_token, verification_expires)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, email, first_name, last_name, role, created_at`,
            [email, hashedPassword, firstName, lastName, role, verificationToken, expiresIn]
        );
        // send email verify 
        const user = newUser.rows[0];
        const verifyLink = `https://kopijourney/verify-email?token=${verificationToken}`;
        await emailSender(email, verifyLink);

        // response if OK
        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                createdAt: user.created_at
            },
            message: 'User registered successfully',
        });

        
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === '23505') { 
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }
        
        if (error.code === '57014') { 
            return res.status(408).json({
                success: false,
                message: 'Request timeout',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// LOGIN  
exports.login = async (req, res) => {
    
    let client;
    try {
        const { email, password, rememberMe } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        // connect & search user by email
        client = await pool.connect();      
        const userCheck = await client.query(
            'SELECT * FROM users WHERE email = $1', 
            [email]
        );

        const user = userCheck.rows[0];
        // check if user exist
        if (userCheck.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
        // check if email verify
        if(!user.email_verified){
            return res.status(401).json({
                success: false,
                message: 'Please verify your account first' 
            })
        }

        // check password and compare it 
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
        // generate token for accessing
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, rememberMe);

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                token,
            },
            message: 'Login successful',
        });

    } catch (error) {
        // error on backend
        console.error('Login error:', error);
        if (error.code === '57014') { 
            return res.status(408).json({
                success: false,
                message: 'Request timeout',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};
