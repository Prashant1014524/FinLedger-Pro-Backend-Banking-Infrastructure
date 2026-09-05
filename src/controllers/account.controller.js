const accountModel = require("../models/account.model");
const mongoose = require("mongoose");
const { redisClient, isRedisConnected } = require("../config/redis");

async function createAccountController(req, res) {
    const user = req.user;
    const { currency } = req.body;
    const account = await accountModel.create({
        user: user._id,
        currency: currency || "INR"
    });

    res.status(201).json({
        account
    })
}

async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });
    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req, res) {
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(400).json({
            message: "Invalid account ID format"
        });
    }

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    const cacheKey = `balance:${accountId}`;

    // 1. Redis Cache-Aside Hit Check
    if (isRedisConnected() && redisClient) {
        try {
            const cachedBalance = await redisClient.get(cacheKey);
            if (cachedBalance !== null) {
                return res.status(200).json({
                    accountId: account._id,
                    balance: parseFloat(cachedBalance),
                    source: "redis_cache"
                });
            }
        } catch (cacheErr) {
            console.warn("Redis balance cache hit failed (falling back to DB):", cacheErr.message);
        }
    }

    // 2. Cache Miss: Compute balance from MongoDB aggregation
    const balance = await account.getBalance();

    // 3. Cache the computed balance in Redis (TTL: 1 hour)
    if (isRedisConnected() && redisClient) {
        try {
            await redisClient.set(cacheKey, balance.toString(), "EX", 3600);
        } catch (cacheErr) {
            console.warn("Redis balance caching failed:", cacheErr.message);
        }
    }

    res.status(200).json({
        accountId: account._id,
        balance: balance,
        source: "database"
    });
}


module.exports={
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}