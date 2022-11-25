import Joi from 'joi';
// POST /v1/auth/register
export const register = {
    body: Joi.object().keys({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().trim(),
        username: Joi.string().trim().min(4).max(15).required(),
        password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        passwordConfirmation: Joi.any().valid(Joi.ref('password')).required().options({ messages: { 'any.only': '{{#label}} does not match'} }),
    }),
}
// POST /v1/auth/encrypt
export const encrypt = {
    body: Joi.object().keys({
        username: Joi.string().trim().min(4).max(15).required(),
        password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        passwordConfirmation: Joi.any().valid(Joi.ref('password')).required().options({ messages: { 'any.only': '{{#label}} does not match'} }),
    }),
}
// POST /v1/auth/adminUpdatePassword
export const adminUpdatePassword = {
    body: Joi.object().keys({
        username: Joi.string().alphanum().required(),
        newPassword: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        confirmNewPassword: Joi.any().valid(Joi.ref('newPassword')).required().options({ messages: { 'any.only': '{{#label}} does not match'} }),
    }),
}
// POST /v1/auth/facebook
// POST /v1/auth/google
export const oAuth = {
    body: Joi.object().keys({
        access_token: Joi.string().required(),
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
        password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        otp: Joi.string().pattern(/^[0-9]+$/, 'numbers').trim().required(),
    }),
}
// POST /v1/auth/refresh
export const refresh = {
    body: Joi.object().keys({
        username: Joi.string().trim().min(4).max(15).required(),
        refreshToken: Joi.string().required(),
    }),
}
// POST /v1/auth/refresh
export const sendPasswordReset = {
    body: Joi.object().keys({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).trim(),
    }),
}
// POST /v1/auth/password-reset
export const passwordReset = {
    body: Joi.object().keys({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).trim(),
        password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        resetToken: Joi.string().required(),
    }),
}
