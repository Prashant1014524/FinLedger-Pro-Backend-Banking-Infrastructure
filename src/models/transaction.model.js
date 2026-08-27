const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true
    },

    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true
    },

    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED","REVERSED"],
        default: "PENDING"
    },
    
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});
const transactionModel = mongoose.model(
    "transaction",
    transactionSchema
);
module.exports = transactionModel;