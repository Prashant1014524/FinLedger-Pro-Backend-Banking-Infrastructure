const Redis = require("ioredis");
require("dotenv").config();

let redisClient = null;
let isConnected = false;

function initRedis() {
    const redisHost = process.env.REDIS_HOST || "127.0.0.1";
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    let hasLoggedFallback = false;

    const redisOptions = {
        host: redisHost,
        port: Number(redisPort),
        password: redisPassword,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy(times) {
            if (times > 3) {
                if (!hasLoggedFallback) {
                    hasLoggedFallback = true;
                    console.log("ℹ️  Redis server not detected on 127.0.0.1:6379. Operating cleanly in MongoDB Fallback Mode.");
                }
                return null; // Stop retrying to avoid console spam
            }
            return 500; // Wait 500ms between initial retries
        },
        lazyConnect: true
    };

    if (process.env.REDIS_URI) {
        redisClient = new Redis(process.env.REDIS_URI, redisOptions);
    } else {
        redisClient = new Redis(redisOptions);
    }

    redisClient.on("connect", () => {
        isConnected = true;
        console.log("⚡ Redis connected successfully");
    });

    redisClient.on("ready", () => {
        isConnected = true;
    });

    redisClient.on("error", (err) => {
        isConnected = false;
        if (!hasLoggedFallback && err.code === "ECONNREFUSED") {
            hasLoggedFallback = true;
            console.log("ℹ️  Redis server not detected. Operating cleanly in MongoDB Fallback Mode.");
        }
    });

    redisClient.on("close", () => {
        isConnected = false;
    });

    // Attempt initial connection asynchronously
    redisClient.connect().catch(() => {
        // Silently handled in retryStrategy and error event listener
    });

    return redisClient;
}

const client = initRedis();

module.exports = {
    redisClient: client,
    isRedisConnected: () => isConnected
};
