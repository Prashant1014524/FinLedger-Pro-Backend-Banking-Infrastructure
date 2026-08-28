const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");
// ======================================================
// NORMAL USER TRANSACTION
// ======================================================

async function createTransaction(req, res) {

    const {
        fromAccount,
        toAccount,
        amount,
        idempotencyKey
    } = req.body;


    // 1. Validate request

    if (
        !fromAccount ||
        !toAccount ||
        !idempotencyKey ||
        amount === undefined ||
        amount === null ||
        amount <= 0
    ) {
        return res.status(400).json({
            message:
                "fromAccount, toAccount, amount and idempotencyKey are required"
        });
    }


    // 2. Same account check

    if (fromAccount === toAccount) {
        return res.status(400).json({
            message:
                "Cannot transfer money to the same account"
        });
    }


    // 3. Find sender account

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    });


    // 4. Find receiver account

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    });


    // 5. Check accounts

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message:
                "Invalid fromAccount or toAccount"
        });
    }


    // 6. Check idempotency key

    const existingTransaction =
        await transactionModel.findOne({
            idempotencyKey
        });


    if (existingTransaction) {

        if (
            existingTransaction.fromAccount.toString() !== fromAccount ||
            existingTransaction.toAccount.toString() !== toAccount ||
            existingTransaction.amount !== amount
        ) {
            return res.status(409).json({
                message:
                    "Idempotency key already used for a different transaction"
            });
        }


        if (existingTransaction.status === "COMPLETED") {
            return res.status(200).json({
                message:
                    "Transaction already processed",
                transaction:
                    existingTransaction
            });
        }


        if (existingTransaction.status === "PENDING") {
            return res.status(200).json({
                message:
                    "Transaction is still processing",
                transaction:
                    existingTransaction
            });
        }


        if (existingTransaction.status === "FAILED") {
            return res.status(500).json({
                message:
                    "Transaction processing failed, please retry"
            });
        }


        if (existingTransaction.status === "REVERSED") {
            return res.status(500).json({
                message:
                    "Transaction was reversed, please retry"
            });
        }
    }


    // 7. Check account status

    if (
        fromUserAccount.status !== "ACTIVE" ||
        toUserAccount.status !== "ACTIVE"
    ) {
        return res.status(400).json({
            message:
                "Both fromAccount and toAccount must be ACTIVE to process transaction"
        });
    }


    // 8. Get sender balance

    const balance =
        await fromUserAccount.getBalance();


    if (balance < amount) {
        return res.status(400).json({
            message:
                `Insufficient Balance. Current balance: ${balance}. Requested amount: ${amount}`
        });
    }


    // 9. Start session

    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        // 10. Create transaction

        const transaction =
            new transactionModel({
                fromAccount,
                toAccount,
                amount,
                idempotencyKey,
                status: "PENDING"
            });


        await transaction.save({
            session
        });


        // 11. Debit ledger

        await ledgerModel.create(
            [
                {
                    account: fromAccount,
                    amount: amount,
                    transaction: transaction._id,
                    type: "DEBIT"
                }
            ],
            {
                session
            }
        );


        // 12. Credit ledger

        await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount: amount,
                    transaction: transaction._id,
                    type: "CREDIT"
                }
            ],
            {
                session
            }
        );


        // 13. Complete transaction

        transaction.status = "COMPLETED";

        await transaction.save({
            session
        });


        // 14. Commit

        await session.commitTransaction();

        session.endSession();


        // 15. Email

        await emailService.sendTransactionEmail(
            req.user.email,
            req.user.name,
            amount,
            toAccount
        );


        // 16. Response

        return res.status(201).json({
            message:
                "Transaction completed successfully",
            transaction
        });


    } catch (error) {

        await session.abortTransaction();

        session.endSession();

        console.error(
            "Transaction failed:",
            error
        );

        return res.status(500).json({
            message:
                "Transaction failed",
            error:
                error.message
        });
    }
}


// ======================================================
// SYSTEM USER → INITIAL FUNDS
// ======================================================
// ======================================================
// SYSTEM USER → INITIAL FUNDS
// ======================================================

async function createInitialFundsTransaction(req, res) {

    const {
        toAccount,
        amount,
        idempotencyKey
    } = req.body;


    // ======================================================
    // 1. Validate request
    // ======================================================

    if (
        !toAccount ||
        amount === undefined ||
        amount === null ||
        amount <= 0 ||
        !idempotencyKey
    ) {
        return res.status(400).json({
            message:
                "toAccount, amount and idempotencyKey are required"
        });
    }


    // ======================================================
    // 2. Find receiver account
    // ======================================================

    const toUserAccount =
        await accountModel.findOne({
            _id: toAccount
        });


    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        });
    }


    // ======================================================
    // 3. Receiver must be ACTIVE
    // ======================================================

    if (toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message:
                "Receiver account must be ACTIVE"
        });
    }


    // ======================================================
    // 4. Find SYSTEM USER's account
    // ======================================================

    const fromUserAccount =
        await accountModel.findOne({
            user: req.user._id,
            status: "ACTIVE"
        });


    if (!fromUserAccount) {
        return res.status(400).json({
            message:
                "System user account not found"
        });
    }


    // ======================================================
    // 5. Prevent system → system transaction
    // ======================================================

    if (
        fromUserAccount._id.toString() ===
        toUserAccount._id.toString()
    ) {
        return res.status(400).json({
            message:
                "System account cannot be the receiver"
        });
    }


    // ======================================================
    // 6. Check idempotency
    // ======================================================

    const existingTransaction =
        await transactionModel.findOne({
            idempotencyKey
        });


    if (existingTransaction) {

        return res.status(200).json({
            message:
                "Initial funds transaction already processed",

            transaction:
                existingTransaction
        });
    }


    // ======================================================
    // 7. Start MongoDB session
    // ======================================================

    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        // ======================================================
        // 8. Create transaction
        // ======================================================

        const transaction =
            new transactionModel({

                fromAccount:
                    fromUserAccount._id,

                toAccount:
                    toUserAccount._id,

                amount:
                    amount,

                idempotencyKey:
                    idempotencyKey,

                status:
                    "PENDING"
            });


        await transaction.save({
            session
        });


        // ======================================================
        // 9. Debug information
        // ======================================================

        console.log(
            "SYSTEM ACCOUNT:",
            fromUserAccount._id.toString()
        );

        console.log(
            "USER ACCOUNT:",
            toUserAccount._id.toString()
        );

        console.log(
            "TRANSACTION:",
            transaction._id.toString()
        );


        // ======================================================
        // 10. CREATE BOTH LEDGER ENTRIES
        // ======================================================

        await ledgerModel.insertMany(
            [

                // ------------------------------------------
                // SYSTEM ACCOUNT → DEBIT
                // ------------------------------------------

                {
                    account:
                        fromUserAccount._id,

                    amount:
                        amount,

                    transaction:
                        transaction._id,

                    type:
                        "DEBIT"
                },


                // ------------------------------------------
                // USER ACCOUNT → CREDIT
                // ------------------------------------------

                {
                    account:
                        toUserAccount._id,

                    amount:
                        amount,

                    transaction:
                        transaction._id,

                    type:
                        "CREDIT"
                }

            ],
            {
                session,
                ordered: true
            }
        );


        // ======================================================
        // 11. Mark transaction COMPLETED
        // ======================================================

        transaction.status =
            "COMPLETED";


        await transaction.save({
            session
        });


        // ======================================================
        // 12. Commit transaction
        // ======================================================

        await session.commitTransaction();


        console.log(
            "Initial funds ledger entries created successfully"
        );


        // ======================================================
        // 13. End session
        // ======================================================

        await session.endSession();


        // ======================================================
        // 14. Response
        // ======================================================

        return res.status(201).json({

            message:
                "Initial funds transaction completed successfully",

            transaction:
                transaction
        });


    } catch (error) {

        // ======================================================
        // Rollback everything if anything fails
        // ======================================================

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        await session.endSession();


        console.error(
            "Initial funds transaction failed:",
            error
        );


        return res.status(500).json({

            message:
                "Initial funds transaction failed",

            error:
                error.message
        });
    }
}

// ======================================================
// EXPORT
// ======================================================
module.exports = {
    createTransaction,
    createInitialFundsTransaction
};