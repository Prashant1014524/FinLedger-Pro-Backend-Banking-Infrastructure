const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService=require("../services/email.service")

async function userRegisterController(req, res) {
    const { email, password, name } = req.body;

    const isExits = await userModel.findOne({
        email: email
    });
    if (isExits) {
        return res.status(422).json({
            message: "User already exists with email.",
            status: "failed"
        });
    }
    const user = await userModel.create({
        email,
        password,
        name
    });
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    );
    res.cookie("token", token);

    // Send registration email

    // Send registration email
// console.log("About to send email...");
// console.log("Email:", user.email);
// console.log("Name:", user.name);


    await emailService.sendRegistrationEmail(
        user.email,
        user.name
    );
    return res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
}
/**
 * -USer Login Controller
 * POST/api/auth/login
 */

async function userLoginController(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        });
    }

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    );

    res.cookie("token", token);

    return res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
}
module.exports = {
    userRegisterController,
    userLoginController
};

