/**
 * Role-Based Access Control Middleware
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error('Unauthorized');
            error.statusCode = 401;
            return next(error);
        }

        if (!allowedRoles.includes(req.user.role)) {
            const error = new Error('Forbidden: You do not have permission to perform this action');
            error.statusCode = 403;
            return next(error);
        }

        next();
    };
};

module.exports = { authorize };
