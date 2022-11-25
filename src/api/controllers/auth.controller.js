import httpStatus from 'http-status';
import { omit } from 'lodash';
import * as adminModel from '../models/admin.model';
import * as refreshTokenModel from '../models/refreshToken.model';
import * as PasswordResetToken from '../models/passwordResetToken.model';
import { jwtExpirationInterval,jwtSecret } from '../../config/vars';
import APIError from '../errors/api-error';
import { DateTime } from 'luxon';
/**
 * Returns a formated object with tokens
 * @private
 */
async function generateTokenResponse(user, accessToken) {
    const tokenType = 'Bearer';
    const refreshToken = await refreshTokenModel.generate(user).token;
    const expiresIn = DateTime.utc().plus({minute: jwtExpirationInterval});
    return {
        tokenType,
        accessToken,
        refreshToken,
        expiresIn,
    };
}
/**
 * Returns jwt token if registration was successful
 * @public
 */
export async function register (req, res, next){
    try {
        const userData = omit(req.body, 'role');
        const {email,username} = userData;
        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        const check = await Promise.all([
            adminModel.checkUnique({username: username}),
            adminModel.checkUnique({email: email}),
        ]);
        if (check[0].length > 0){
            err.status = httpStatus.BAD_REQUEST;
            err.message = 'Username already exist. Please use another username.';
            throw new APIError(err);
        }
        if (check[1].length > 0){
            err.status = httpStatus.BAD_REQUEST;
            err.message = 'Email already exist.';
            throw new APIError(err);
        }
        const user = await adminModel.save(userData);
        const userTransformed = adminModel.transform(user);
        const token = await generateTokenResponse(user, user.token);
        res.status(httpStatus.CREATED);
        return res.json({ token, user: userTransformed });
    } catch (error) {
        return next(error);
    }
}
/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
export async function login (req, res, next) {
    try {
        const { user, accessToken } = await adminModel.login(req.body);
        const token = await generateTokenResponse(user, accessToken);
        res.status(httpStatus.OK);
        return res.json({ token, user: adminModel.transform(user)});
    } catch (error) {
        return next(error);
    }
}
/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
export async function refresh (req, res, next) {
    try {
        const { username, refreshToken } = req.body;
        const refreshObject = await refreshTokenModel.findOneAndRemove({username: username, token: refreshToken,});
        const { user, accessToken } = await adminModel.findAndGenerateToken({ username, refreshObject });
        const response = await generateTokenResponse(user, accessToken);
        return res.json(response);
    } catch (error) {
        return next(error);
    }
}
export async function sendPasswordReset (req, res, next) {
    try {
        const { email } = req.body;
        const user = await adminModel.findOne({ email });
        if (user) {
            const passwordResetObj = await PasswordResetToken.generate(user);
            // emailProvider.sendPasswordReset(passwordResetObj);
            res.status(httpStatus.OK);
            return res.json('success');
        }
        throw new APIError({
            status: httpStatus.UNAUTHORIZED,
            message: 'No account found with that email',
        });
    } catch (error) {
        return next(error);
    }
}
export async function resetPassword (req, res, next) {
    try {
        const { email, password, resetToken } = req.body;
        const resetTokenObject = await PasswordResetToken.findOneAndRemove({email: email, token: resetToken});

        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        if (!resetTokenObject) {
            err.message = 'Cannot find matching reset token';
            throw new APIError(err);
        }
        const diff = DateTime.fromJSDate(resetTokenObject['expires']).diffNow('milliseconds').toObject();
        if (Number(diff['milliseconds']) <= 0){
            err.message = "Invalid refresh token.Reset token is expired";
            throw new APIError(err);
        }
        await adminModel.updatePassword({email: email}, password);
        // emailProvider.sendPasswordChangeEmail(user);
        res.status(httpStatus.OK);
        return res.json('Password Updated');
    } catch (error) {
        return next(error);
    }
}
export async function adminOtp (req, res, next) {
    try {
        const now = DateTime.utc();
        const { username } = req.body;
        const user = await adminModel.findOne({username: username}, "username,id,telegram_id");
        const {id,telegram_id} = user;
        const otp = Math.floor(111111 + Math.random() * 999999).toString().substr(0, 6);
        const messages = `[Admin OTP]\nUsername ${username} is ${otp} valid for 15 minutes.`;
        await Promise.all([
            adminModel.sendTelegramMessage(messages, telegram_id),
            adminModel.updateOne({id: id}, {otp: otp, otp_expired: now.plus({minutes: 15 }).toISO({ includeOffset: false })}),
        ])
        res.status(httpStatus.OK);
        return res.json({messages: "success"});
    }catch (error) {
        return next(error);
    }
}