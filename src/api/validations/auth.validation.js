import Joi from 'joi';
// POST /v1/auth/register
export const register = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().alphanum().required().trim().min(6).max(15),
    }),
}
// POST /v1/auth/encrypt
export const encrypt = {
    body: Joi.object().keys({
        username: Joi.string().trim().min(4).max(15).required(),
        password: Joi.string().alphanum().required().trim().min(6).max(15),
        passwordConfirmation: Joi.any().valid(Joi.ref('password')).required().options({ messages: { 'any.only': '{{#label}} does not match'} }),
    }),
}
// POST /v1/auth/adminUpdatePassword
export const adminUpdatePassword = {
    body: Joi.object().keys({
        username: Joi.string().alphanum().required(),
        new_password: Joi.string().alphanum().required().trim().min(6).max(15),
        confirm_new_password: Joi.any().valid(Joi.ref('new_password')).required().options({ messages: { 'any.only': '{{#label}} does not match'} }),
    }),
}
// POST /v1/auth/otp
export const adminOtp =  {
    body: Joi.object().keys({
        username: Joi.string().alphanum().required(),
    }),
}
// POST /v1/auth/signIn
export const login = {
    body: Joi.object().keys({
        username: Joi.string().alphanum().required(),
        password: Joi.string().alphanum().required().trim().min(6).max(15),
        otp: Joi.string().pattern(/^[0-9]+$/, 'numbers').trim().required(),
    }),
}
// POST /v1/auth/refresh
export const refresh = {
    body: Joi.object().keys({
        email: Joi.string()
            .email()
            .required(),
        refreshToken: Joi.string().required(),
    }),
}
// POST /v1/auth/refresh
export const sendPasswordReset = {
    body: Joi.object().keys({
        email: Joi.string()
            .email()
            .required(),
    }),
}
// POST /v1/auth/password-reset
export const passwordReset = {
    body: Joi.object().keys({
        email: Joi.string()
            .email()
            .required(),
        password: Joi.string().alphanum().required().trim().min(6).max(15),
        resetToken: Joi.string().required(),
    }),
}