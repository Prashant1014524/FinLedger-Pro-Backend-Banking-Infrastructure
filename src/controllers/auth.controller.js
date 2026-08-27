async function authSystemUserMiddleware(req, res, next) {

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            });
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            });
        }

        req.user = user;

        return next();

    } catch (err) {

        return res.status(401).json({
            message: "Unauthorized access, invalid or expired token"
        });
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    authSystemUserMiddleware
};