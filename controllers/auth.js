const User = require('../models/user')
const jwt = require("jsonwebtoken") // To generate signed token
const expressJwt = require("express-jwt") // for authorisation check
const { errorHandler } = require('../helpers/dbErrorHandler')

exports.signup = (req, res) => {
    //   console.log("Req-body: " +JSON.stringify(req.body))
    const user = new User(req.body)

    user.save((error, user) => {
        if (error) {
            return res.status(400).json({
                error: errorHandler(error)
            })
        }
        user.salt = undefined;
        user.hashed_password = undefined;
        res.json({
            user
        })

    })
}

exports.signin = (req, res) => {
    //Find the user based on email
    const { email, password } = req.body
    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with  that email does not exist. please signup'
            })
        }
        //If user found make sure the email and password match
        //create authanticate method in user model
        if(!user.authenticate(password))
        {
            return res.status(401).json({
                error : 'Email and password dont match'
            })
        }

        //generate signed token with user id and secret
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET)
        //Persist the token as 't' in cookies with expiry date
        res.cookie('t', token, { expire: new Date() + 9999 })
        //Return the response with the user and token to frontend client
        const { _id, name, email, role } = user
        return res.json({ token, user: { _id, name, email, name, role } })

    })

}
exports.signout = (req, res) =>{
    res.clearCookie("t");
    res.json({message : 'signout sucessfully'})
}

exports.requireSignin = expressJwt ({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    userProperty : "auth"
})

exports.isAuth = (req,res,next)=>{
    let user = req.profile && req.auth && req.profile._id == req.auth._id;

    if(!user){
        return res.status(403).json({
            error : 'Access Denied'
        })
    }
    next();
}

exports.isAdmin = (req, res, next) =>{

    if(req.profile.role === 0 ){
        return res.status(403).json({
            error:'Admin Resources! Access Denied'
        })
    }
    next()
}