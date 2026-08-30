const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel=require("../models/account.model")

// ======================================================
// NORMAL USER AUTHENTICATION
// ======================================================

async function authMiddleware(req, res, next) {

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];


    // Token missing
    if (!token) {

        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });

    }
    const isBlacklisted=await tokenBlackListModel.findOne({token})
    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access,token is invalid"
        })
    }



    try {

        // Verify JWT
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // Find user
        const user =
            await userModel.findById(
                decoded.userId
            );


        // User doesn't exist
        if (!user) {

            return res.status(401).json({
                message: "Unauthorized access, user not found"
            });

        }


        // Attach user to request
        req.user = user;


        // Continue
        return next();


    } catch (err) {

        console.error(
            "Auth middleware error:",
            err.message
        );

        return res.status(401).json({
            message:
                "Unauthorized access, invalid or expired token"
        });

    }

}



// ======================================================
// SYSTEM USER AUTHENTICATION
// ======================================================

async function authSystemUserMiddleware(req, res, next) {

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];


    // Token missing
    if (!token) {

        return res.status(401).json({
            message:
                "Unauthorized access, token is missing"
        });

    }
     const isBlacklisted=await tokenBlackListModel.findOne({token})
    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access,token is invalid"
        })
    }



    try {

        // Verify JWT
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // Find user
        // +systemUser is important if the field
        // has select:false in your schema
        const user =
            await userModel
                .findById(decoded.userId)
                .select("+systemUser");


        // User doesn't exist
        if (!user) {

            return res.status(401).json({
                message:
                    "Unauthorized access, user not found"
            });

        }


        // Check system user
        if (!user.systemUser) {

            return res.status(403).json({
                message:
                    "Forbidden access, not a system user"
            });

        }


        // Attach user
        req.user = user;


        // Continue
        return next();


    } catch (err) {

        console.error(
            "System user middleware error:",
            err.message
        );

        return res.status(401).json({
            message:
                "Unauthorized access, invalid or expired token"
        });

    }

}



// ======================================================
// EXPORT
// ======================================================

module.exports = {

    authMiddleware,

    authSystemUserMiddleware

};