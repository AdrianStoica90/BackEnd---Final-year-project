const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    //get token from the header
    const token = req.header('auth-token');
    if(!token) return res.status(401).send('Access denied'); //token does not exist
    next();
    try{
        const verified = jwt.verity(token, process.env.TOKEN_SECRET);
        req.user = verified; //token is verified - user is logged in

    }catch(err){
        res.status(400).send('You are not logged in yet!');
    }
};


