const jwt = require("jsonwebtoken")
const User = require('../models/User');
const router = require("../routes/userRoutes");

const auth = async(req, res, next) =>{
    try{
        const token = req.header('Authorization').replace('clone', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findOne({
            _id: decoded._id,
        })
        if(!user){
            throw new Error('unable to login invalid credentials')
        }
        req.user = user;
        req.token = token;
        next();
    } 
    catch (error) {
        res.status(401).send({error: "token expire", status: false})
    }
}

module.exports = auth;