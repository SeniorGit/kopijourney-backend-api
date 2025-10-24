const { verifyToken } = require('../lib/utils/jwtUtils')

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({
            success: false,
            message: 'Access Denied'
        })
    }

    try{
        const decode = verifyToken(token);
        req.user = decode;
        next();
    }catch(error){
        return res.status(403).json({
            success: false,
            message: 'Invalid or Expired Token'
        })
    }
}

export const requireRole = (role) =>{
    return(req, res, next)=>{
        if(!req.user){
            return res.status(401).json({
                success:false,
                message: 'Authentication required'
            })
        }

        if(!role.includes(req.user.role)){
            return res.status(403).json({
                success: false,
                message: 'Insufficien Permission'
            });
        }

        next();
    };
};

module.exports = {authMiddleware, requireRole};