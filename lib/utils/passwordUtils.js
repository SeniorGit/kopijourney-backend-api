const bcrypt = require('bcryptjs');

// hashed password when firstime register
const hashPassword = async (password) =>{
    const saltRounds = 2;
    return await bcrypt.hash(password, saltRounds);
}

// compare pasword when login 
const comparePassword = async (password, hashedPassword)=>{
    return await bcrypt.compare(password, hashedPassword);
}

// password validation 
const validatePassword = (password) =>{
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
}

module.exports = {hashPassword, comparePassword, validatePassword};

