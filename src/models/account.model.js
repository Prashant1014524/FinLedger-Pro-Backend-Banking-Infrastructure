const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");


const accountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: [true, "Account must be associated with a user"],
            index: true
        },

        status: {
            type: String,
            enum: {
                values: ["ACTIVE", "FROZEN", "CLOSED"],
                message: "Status can be either ACTIVE, FROZEN or CLOSED"
            },
            default: "ACTIVE"
        },

        currency: {
            type: String,
            required: [true, "Currency is required for creating an account"],
            default: "INR"
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// Compound Index
// ==========================================

accountSchema.index({
    user: 1,
    status: 1
});


// ==========================================
// Get Account Balance
// ==========================================

accountSchema.methods.getBalance = async function () {

    const balanceData = await ledgerModel.aggregate([

        // 1. Get ledger entries belonging to this account
        {
            $match: {
                account: this._id
            }
        },

        // 2. Calculate total CREDIT and DEBIT
        {
            $group: {

                _id: null,

                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            0
                        ]
                    }
                },

                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "DEBIT"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },

        // 3. Calculate final balance
        {
            $project: {

                _id: 0,

                totalCredit: 1,

                totalDebit: 1,

                balance: {
                    $subtract: [
                        "$totalCredit",
                        "$totalDebit"
                    ]
                }
            }
        }
    ]);


    // Fresh account with no ledger entries
    if (balanceData.length === 0) {
        return 0;
    }


    // Return calculated balance
    return balanceData[0].balance;
};








// ==========================================
// Create Account Model
// ==========================================






const accountModel = mongoose.model(
    "account",
    accountSchema
);



module.exports = accountModel;