const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");


// Create new transaction
//
// 1. Validate request
// 2. Validate idempotency key
// 3. Check account status
// 4. Derive sender balance from ledger
// 5. Create transaction as PENDING
// 6. Create DEBIT ledger entry
// 7. Create CREDIT ledger entry
// 8. Make transaction COMPLETED
// 9. Commit MongoDB session
// 10. Send email notification


async function createTransaction(req, res) {

    /**
     * 
     * 1. Validate Request
     * 
     */

    const {
        fromAccount,
        toAccount,
        amount,
        idempotencyKey
    } = req.body;


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


    /**
     * 
     * 2. Check Same Account
     * 
     */

    if (fromAccount === toAccount) {

        return res.status(400).json({
            message:
                "Cannot transfer money to the same account"
        });

    }


    /**
     * 
     * 3. Find Sender Account
     * 
     */

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    });


    /**
     * 
     * 4. Find Receiver Account
     * 
     */

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    });


    /**
     * 
     * 5. Check Accounts
     * 
     */

    if (!fromUserAccount || !toUserAccount) {

        return res.status(400).json({
            message:
                "Invalid fromAccount or toAccount"
        });

    }


    /**
     * 
     * 6. Check Idempotency Key
     * 
     */

    const existingTransaction =
        await transactionModel.findOne({
            idempotencyKey
        });


    if (existingTransaction) {

        /**
         * Same idempotency key cannot be used
         * for a different transaction.
         */

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


        /**
         * Transaction already completed
         */

        if (existingTransaction.status === "COMPLETED") {

            return res.status(200).json({
                message:
                    "Transaction already processed",

                transaction:
                    existingTransaction
            });

        }


        /**
         * Transaction is still processing
         */

        if (existingTransaction.status === "PENDING") {

            return res.status(200).json({
                message:
                    "Transaction is still processing",

                transaction:
                    existingTransaction
            });

        }


        /**
         * Transaction failed
         */

        if (existingTransaction.status === "FAILED") {

            return res.status(500).json({
                message:
                    "Transaction processing failed, please retry"
            });

        }


        /**
         * Transaction reversed
         */

        if (existingTransaction.status === "REVERSED") {

            return res.status(500).json({
                message:
                    "Transaction was reversed, please retry"
            });

        }

    }


    /**
     * ==========================================
     * 7. Check Account Status
     * ==========================================
     */

    if (
        fromUserAccount.status !== "ACTIVE" ||
        toUserAccount.status !== "ACTIVE"
    ) {

        return res.status(400).json({
            message:
                "Both fromAccount and toAccount must be ACTIVE to process transaction"
        });

    }


    /**
     * 
     * 8. Derive Sender Balance
     * 
     */

    const balance =
        await fromUserAccount.getBalance();


    if (balance < amount) {

        return res.status(400).json({

            message:
                `Insufficient Balance. Current balance: ${balance}. Requested amount: ${amount}`

        });

    }


    /**
     * 
     * 9. Start MongoDB Session
     * 
     */

    const session =
        await mongoose.startSession();


    try {

        /**
         * Start MongoDB transaction
         */

        session.startTransaction();


        /**
         * 
         * 10. Create Transaction as PENDING
         * 
         */

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


        /**
         * ==========================================
         * 11. Create DEBIT Ledger Entry
         * ==========================================
         */

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


        /**
         * 
         * 12. Create CREDIT Ledger Entry
         * 
         */

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


        /**
         * 
         * 13. Mark Transaction COMPLETED
         * 
         */

        transaction.status = "COMPLETED";


        await transaction.save({
            session
        });


        /**
         * 
         * 14. Commit Transaction
         * 
         */

        await session.commitTransaction();


        /**
         * End MongoDB session
         */

        session.endSession();


        /**
         * 
         * 15. Send Email Notification
         * 
         */

        await emailService.sendTransactionEmail(

            req.user.email,

            req.user.name,

            amount,

            toAccount

        );


        /**
         * 
         * 16. Send Response
         * 
         */

        return res.status(201).json({

            message:
                "Transaction completed successfully",

            transaction

        });


    } catch (error) {

        /**
         * 
         * Rollback Transaction
         * 
         */

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


// 
// Export
// 

module.exports = {
    createTransaction
};