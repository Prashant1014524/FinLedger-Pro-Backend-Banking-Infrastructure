const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");
const { createRateLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// Transaction Rate Limiter: max 20 transfers per minute
const transactionRateLimiter = createRateLimiter({
    windowSeconds: 60,
    maxRequests: 20,
    keyPrefix: "rl:txn"
});

// Normal transaction
router.post(
    "/",
    authMiddleware.authMiddleware,
    transactionRateLimiter,
    transactionController.createTransaction
);

// System initial funds
router.post(
    "/system/initial-funds",
    authMiddleware.authSystemUserMiddleware,
    transactionController.createInitialFundsTransaction
);


module.exports = router;