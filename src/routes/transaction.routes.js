const { Router } = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

transactionRoutes.post(
    "/",
    authMiddleware.authMiddleware,
    transactionController.createTransaction
);
/***
 * post/api/transactions/system/initial-funds
 * Create initial funds transaction from system user
 */



module.exports = transactionRoutes;