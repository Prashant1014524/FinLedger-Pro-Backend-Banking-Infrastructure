const express = require("express")
const authController = require("../controllers/auth.controller")
const { createRateLimiter } = require("../middleware/rateLimiter.middleware")

const router = express.Router()

// Auth Rate Limiter: max 10 attempts per minute
const authRateLimiter = createRateLimiter({
    windowSeconds: 60,
    maxRequests: 10,
    keyPrefix: "rl:auth"
});

/* POST /api/auth/register */
router.post("/register", authRateLimiter, authController.userRegisterController)

/* POST /api/auth/login */
router.post("/login", authRateLimiter, authController.userLoginController)

/**
 * - POST /api/auth/logout
 */
router.post("/logout", authController.userLogoutController)



module.exports = router