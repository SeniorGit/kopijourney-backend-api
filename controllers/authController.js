const { hashPassword, comparePassword, validatePassword } = require('../lib/utils/passwordUtils');
const { generateToken } = require('../lib/utils/jwtUtils');
const db = require('../lib/utils/database');
const {emailSender} = require('../lib/utils/verifyEmail')
const {v4:uuidv4} = require('uuid')

// REGISTER
exports.register = async (req, res) => {
    try {
        // Validasi input DULU sebelum connect database
        const { email, password, firstName, lastName, role = 'customer' } = req.body;

        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        // validasi role
        const validRoles = ['customer', 'farmer', 'roaster', 'admin'];
        if(!validRoles.includes(role)){
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of : ${validRoles.join(', ')}`
            })
        }

        // Validasi password
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
            });
        }

        // check email
        const isEmail = await db('users').where({email}).first();
        if (isEmail) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            });
        }

        // hashed password
        const hashedPassword = await hashPassword(password);

        // token for verivy email
        const verificationToken = uuidv4();
        const expiresIn = new Date(Date.now() + 24*60*60*1000);
        
        // insert to db
        const [newUser] = await db('users').insert({
            email,
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            role: role,
            verification_token: verificationToken,
            verification_token_expires: expiresIn
        }).returning(['id', 'email', 'first_name', 'last_name', 'role', 'created_at'])
        
        // send email verify 
        const verifyLink = `https://kopijourney/verify-email?token=${verificationToken}`;
        await emailSender(email, verifyLink);

        // response if OK
        res.status(201).json({
            success: true,
            data: newUser,
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
    } 
};

// LOGIN  
exports.login = async (req, res) => {
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
        const user = await db('users').where({email}).first()      
    
        // check if user exist
        if (!user) {
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
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                },
                token: token
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
    } 
};
