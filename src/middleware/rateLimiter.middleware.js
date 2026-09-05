const { redisClient, isRedisConnected } = require("../config/redis");

/**
 * Custom Redis Rate Limiter Middleware
 * @param {Object} options
 * @param {number} options.windowSeconds Time window in seconds (default: 60)
 * @param {number} options.maxRequests Max allowed requests in time window (default: 10)
 * @param {string} options.keyPrefix Prefix for Redis key (default: "rl")
 */
function createRateLimiter(options = {}) {
    const windowSeconds = options.windowSeconds || 60;
    const maxRequests = options.maxRequests || 10;
    const keyPrefix = options.keyPrefix || "rl";

    return async function rateLimiterMiddleware(req, res, next) {
        // Fallback: If Redis is offline, allow traffic through cleanly
        if (!isRedisConnected() || !redisClient) {
            return next();
        }

        try {
            const identifier = req.user ? req.user._id.toString() : (req.ip || req.headers["x-forwarded-for"] || "anonymous");
            const redisKey = `${keyPrefix}:${identifier}`;

            // Multi/Pipeline to atomically INCR and set EXPIRE if new key
            const results = await redisClient
                .multi()
                .incr(redisKey)
                .ttl(redisKey)
                .exec();

            const currentRequests = results[0][1];
            const ttl = results[1][1];

            // Set TTL if key is new (ttl == -1)
            if (ttl === -1) {
                await redisClient.expire(redisKey, windowSeconds);
            }

            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - currentRequests));

            if (currentRequests > maxRequests) {
                return res.status(429).json({
                    message: `Too many requests. Limit is ${maxRequests} requests per ${windowSeconds}s. Please try again later.`,
                    status: "rate_limited"
                });
            }

            return next();
        } catch (error) {
            console.warn("Rate limiter error (passing request):", error.message);
            return next();
        }
    };
}

module.exports = {
    createRateLimiter
};
