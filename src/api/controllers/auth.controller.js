import httpStatus from 'http-status';
import { omit } from 'lodash';
import * as userModel from '../models/user.model';
import * as RefreshToken from '../models/refreshToken.model';
import * as PasswordResetToken from '../models/passwordResetToken.model';
import { jwtExpirationInterval,jwtSecret } from '../../config/vars';
import APIError from '../errors/api-error';
import { DateTime } from 'luxon';
/**
 * Returns a formated object with tokens
 * @private
 */
function generateTokenResponse(user, accessToken) {
    const tokenType = 'Bearer';
    const refreshToken = RefreshToken.generate(user).token;
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
        const user = await new User(userData).save();
        const userTransformed = user.transform();
        const token = generateTokenResponse(user, user.token());
        res.status(httpStatus.CREATED);
        return res.json({ token, user: userTransformed });
    } catch (error) {
        return next(User.checkDuplicateEmail(error));
    }
}
/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
export async function login (req, res, next) {
    try {
        const { user, accessToken } = await userModel.findAndGenerateToken(req.body);
        const token = generateTokenResponse(user, accessToken);
        const userTransformed = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.date_created,
        };
        return res.json({ token, user: userTransformed });
    } catch (error) {
        return next(error);
    }
}
/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
export async function oAuth (req, res, next) {
    try {
        const { user } = req;
        const accessToken = user.token();
        const token = generateTokenResponse(user, accessToken);
        const userTransformed = user.transform();
        return res.json({ token, user: userTransformed });
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
        const { email, refreshToken } = req.body;
        const refreshObject = await RefreshToken.findOneAndRemove({
            userEmail: email,
            token: refreshToken,
        });
        const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
        const response = generateTokenResponse(user, accessToken);
        return res.json(response);
    } catch (error) {
        return next(error);
    }
}
export async function sendPasswordReset (req, res, next) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email }).exec();

        if (user) {
            const passwordResetObj = await PasswordResetToken.generate(user);
            emailProvider.sendPasswordReset(passwordResetObj);
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
        const resetTokenObject = await PasswordResetToken.findOneAndRemove({
            userEmail: email,
            resetToken,
        });

        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        if (!resetTokenObject) {
            err.message = 'Cannot find matching reset token';
            throw new APIError(err);
        }
        if (moment().isAfter(resetTokenObject.expires)) {
            err.message = 'Reset token is expired';
            throw new APIError(err);
        }

        const user = await User.findOne({ email: resetTokenObject.userEmail }).exec();
        user.password = password;
        await user.save();
        emailProvider.sendPasswordChangeEmail(user);

        res.status(httpStatus.OK);
        return res.json('Password Updated');
    } catch (error) {
        return next(error);
    }
}
export async function encrypt (req, res, next) {
    try {
        let { username, password } = req.body;
        const check = await User.findOne({username: username}, "id_member,username");
        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        if (check.length <= 0){
            err.message = 'Invalid username. Member not found.';
            throw new APIError(err);
        }
        username = check.data.username;
        let id_member = check.data.id_member;
        let key = id_member.concat("_",username,"_");
        let passHash = ecdc.passEnc(password, key.toString());
        res.status(httpStatus.OK);
        return res.json(passHash);
    }catch (error) {
        return next(error);
    }
}
export async function adminOtp (req, res, next) {
    try {
        const now = DateTime.utc();
        const { username } = req.body;
        const checkuserModel = await userModel.findOne({username: username}, "username,id, telid");
        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        if (checkuserModel.length <= 0){
            err.message = 'Invalid username. Member not found.';
            throw new APIError(err);
        }
        const userModelUsername = checkuserModel.data.username;
        const id = checkuserModel.data.id;
        const telegramId = checkuserModel.data.telid;
        const otp = Math.floor(111111 + Math.random() * 999999).toString().substr(0, 6);
        const messages = `[Admin OTP]\nusername ${userModelUsername} is ${otp} valid for 15 minutes.`;
        await Promise.all([
            sendMessage(messages, telegramId),
            userModel.updateOne({id: id}, {totp: otp, totp_exp: now.plus({minutes: 15 }).toISO({ includeOffset: false })}),
        ])
        res.status(httpStatus.OK);
        return res.json({messages: "success"});
    }catch (error) {
        return next(error);
    }
}