import httpStatus from 'http-status';
import passport from 'passport';
import * as adminModel from '../models/admin.model';
import APIError from '../errors/api-error';
const handleJWT = (req, res, next, roles) => async (err, user, info) => {
    const error = err || info;
    const logIn = Promise.promisify(req.logIn);
    const apiError = new APIError({
        message: error ? error.message : 'Unauthorized',
        status: httpStatus.UNAUTHORIZED,
        stack: error ? error.stack : undefined,
    });
    try {
        if (error || !user) throw error;
        await logIn(user, { session: false });
    } catch (e) {
        return next(apiError);
    }
    if (roles === LOGGED_USER) {
        if (user.role !== 'SuperUser' && req.params.userId !== user.id.toString()) {
            apiError.status = httpStatus.FORBIDDEN;
            apiError.message = 'Forbidden 1';
            return next(apiError);
        }
    } else if (!roles.includes(user.role)) {
        apiError.status = httpStatus.FORBIDDEN;
        apiError.message = 'Forbidden 2';
        return next(apiError);
    } else if (err || !user) {
        return next(apiError);
    }
    req.user = user;
    return next();
};
export const ADMIN = 'SuperUser';
export const LOGGED_USER = 'User';
export const authorize = (roles = adminModel.roles) => (req, res, next) => passport.authenticate(
    'jwt', { session: false },
    handleJWT(req, res, next, roles),
)(req, res, next);
export const oAuth = (service) => passport.authenticate(service, { session: false });