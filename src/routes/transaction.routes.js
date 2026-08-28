const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const router = express.Router();


// DEBUG
console.log(
    "authMiddleware:",
    typeof authMiddleware.authMiddleware
);

console.log(
    "authSystemUserMiddleware:",
    typeof authMiddleware.authSystemUserMiddleware
);

console.log(
    "createTransaction:",
    typeof transactionController.createTransaction
);

console.log(
    "createInitialFundsTransaction:",
    typeof transactionController.createInitialFundsTransaction
);


// Normal transaction
router.post(
    "/",
    authMiddleware.authMiddleware,
    transactionController.createTransaction
);


// System initial funds
router.post(
    "/system/initial-funds",
    authMiddleware.authSystemUserMiddleware,
    transactionController.createInitialFundsTransaction
);


module.exports = router;