import httpStatus from 'http-status';
import expressValidation from 'express-validation';
import APIError from '../errors/api-error';
import { env } from '../../config/vars';
/**
 * Error handler. Send stacktrace only during development
 * @public
 */
export const handler = function (err, req, res, next) {
    const response = {
        code: err.status,
        message: err.message || httpStatus[err.status],
        errors: err.errors,
        stack: err.stack,
    };
    if (env === 'production') {
        delete response.stack;
    }else{
        console.error(response)
    }
    res.status(err.status);
    res.json(response);
};
/**
 * If error is not an instanceOf APIError, convert it.
 * @public
 */
export const converter = function (err,req, res, next) {
    let convertedError = err;
    if (err instanceof expressValidation.ValidationError) {
        console.log(err.details)
        convertedError = new APIError({
            message: 'Validation Error',
            errors: err.errors,
            status: err.status,
            stack: err.details,
        });
    } else if (!(err instanceof APIError)) {
        convertedError = new APIError({
            message: err.message,
            status: err.status,
            stack: err.stack,
        });
    }
    return handler(convertedError, req, res);
}
/**
 * Catch 404 and forward to error handler
 * @public
 */
export const notFound = function (req, res, next){
    const err = new APIError({
        message: 'Not found',
        status: httpStatus.NOT_FOUND,
    });
    return handler(err, req, res);
}
