const {hashPassword, comparePassword, validatePassword} = require('../lib/utils/passwordUtils')
const {generateToken} = require('../lib/utils/jwtUtils')
const {pool} = require('../lib/utils/database')

const authController = {
    register: async (req, res) => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {email, password, firstName, lastName, role } = req.body;
    
            // user validation
            const userCheck = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            )
            if(userCheck.rows.length>0){
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'User Already exists with this email'
                })
            }

            // password validation
            if(!validatePassword(password)){
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
                });
            }

            // hash password
            const hashedPassword = await hashPassword(password);

            // create new user
            const newUser = await client.query(
                `INSERT INTO users (email, password, first_name, last_name, role)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, email, fist_name, last_name, role, create_at`,
                [email, hashedPassword, firstName, lastName, role]
            );

            const user = newUser.rows[0];

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        role: user.role,
                        createdAt: user.create_at
                    },
                },
                message: 'User registered successfully'
            })
        }catch(error){
            await client.query('ROLLBACK');
            console.error('Registration error:', error);

            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }finally{
            client.release()
        }
    },

    login: async(req, res)=>{
        try{

            const {email, password, rememberMe} = req.body;
    
            // find user by email
            const userCheck = await query.pool('SELECT id FROM user WHERE email = $1',[email]);
    
            if(userCheck.rows.length === 0){
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                })
            }
            
            const user = userCheck.rows[0];

            if(user.locked_until && user.locked_until > new Date()){
                return res.status(432).json({
                    success: false,
                    message: 'Account temporarily locked due to too many failed attampes'
                });
            }

            const isPassword = await comparePassword(password, user.password)
            if(!isPassword){
                const newAttempts = user.login_attemps + 1;
                let lockUntil = null;

                if(newAttempts >= 5){
                    lockUntil = new Date(Date.now() + 30 * 60  * 1000);
                }

                await pool.query(
                    'UPDATE user SET login_attempts = $1, locked_until = $2 WHERE id = $3',
                    [newAttempts, lockUntil, user.id]
                );

                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
    
            const token = generateToken({
                userId: user.id,
                email: user.email,
                role: user.role
                }, 
                rememberMe
            );

            res.cookie('token', token,{
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: rememberMe ? 7*24*60*60*1000 : 24*60*60*1000
            });

            res.json({
                success: true,
                data:{
                    user:{
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.last_name,
                        role: user.role
                    },
                    token
                },
                message: "Login Successfull",
            })  
        }catch(error){
            console.error('Error in Login: ', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            })
        }
    }
}

module.exports = {authController}