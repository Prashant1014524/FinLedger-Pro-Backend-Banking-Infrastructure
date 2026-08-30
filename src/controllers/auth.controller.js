const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/tokenBlacklist.model");


// ======================================================
// USER REGISTER
// POST /api/auth/register
// ======================================================

async function userRegisterController(req, res) {

    const { email, password, name } = req.body;

    // Check if user already exists
    const isExits = await userModel.findOne({
        email: email
    });

    if (isExits) {
        return res.status(422).json({
            message: "User already exists with email.",
            status: "failed"
        });
    }

    // Create user
    const user = await userModel.create({
        email,
        password,
        name
    });

    // Generate JWT
    const token = jwt.sign(
        {
            userId: user._id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "3d"
        }
    );

    // Store token in cookie
    res.cookie("token", token);

    // Send registration email
    await emailService.sendRegistrationEmail(
        user.email,
        user.name
    );

    // Send response
    return res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
}


// ======================================================
// USER LOGIN
// POST /api/auth/login
// ======================================================

async function userLoginController(req, res) {

    const { email, password } = req.body;

    // Find user
    // +password because password has select:false
    const user = await userModel
        .findOne({ email })
        .select("+password");

    // User doesn't exist
    if (!user) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        });
    }

    // Compare password
    const isValidPassword =
        await user.comparePassword(password);

    // Wrong password
    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        });
    }

    // Generate JWT
    const token = jwt.sign(
        {
            userId: user._id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "3d"
        }
    );

    // Store token in cookie
    res.cookie("token", token);

    // Send response
    return res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
}


// ======================================================
// SYSTEM USER AUTHENTICATION MIDDLEWARE
// ======================================================

async function authSystemUserMiddleware(req, res, next) {

    // Get token from cookie OR Authorization header
    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];

    // Token doesn't exist
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }

    try {

        // ----------------------------------------------
        // 1. Check token blacklist
        // ----------------------------------------------

        const isBlacklisted =
            await tokenBlackListModel.findOne({
                token: token
            });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token has been logged out"
            });
        }


        // ----------------------------------------------
        // 2. Verify JWT
        // ----------------------------------------------

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // ----------------------------------------------
        // 3. Find user
        // ----------------------------------------------

        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            });
        }


        // ----------------------------------------------
        // 4. Check system user
        // ----------------------------------------------

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            });
        }


        // ----------------------------------------------
        // 5. Store user in request
        // ----------------------------------------------

        req.user = user;


        // ----------------------------------------------
        // 6. Continue to controller
        // ----------------------------------------------

        return next();

    } catch (err) {

        return res.status(401).json({
            message: "Unauthorized access, invalid or expired token"
        });
    }
}


// ======================================================
// USER LOGOUT
// POST /api/auth/logout
// ======================================================

async function userLogoutController(req, res) {

    // Get token from cookie OR Authorization header
    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];


    // If no token exists
    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        });
    }


    // Add token to blacklist
    await tokenBlackListModel.create({
        token: token
    });


    // Clear cookie
    res.clearCookie("token");


    // Send response
    return res.status(200).json({
        message: "User logged out successfully"
    });
}

module.exports = {
    userRegisterController,
    userLoginController,
    authSystemUserMiddleware,
    userLogoutController
};