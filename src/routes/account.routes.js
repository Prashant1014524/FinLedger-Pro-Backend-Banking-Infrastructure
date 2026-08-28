const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const accountController = require("../controllers/account.controller");

const router = express.Router();


// Create Account
// POST /api/accounts

router.post(
    "/",
    authMiddleware.authMiddleware,
    accountController.createAccountController
);


// Get User Accounts
// GET /api/accounts

router.get(
    "/",
    authMiddleware.authMiddleware,
    accountController.getUserAccountsController
);
/**
 * get/api/accounts/balance/:accountTD
 
 */ 
router.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getAccountBalanceController);





module.exports = router;