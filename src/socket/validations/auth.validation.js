import Joi from "joi";
import JoiPhoneValidation from "joi-phone-number";
const myCustomJoi = Joi.extend(JoiPhoneValidation);
export const signIn = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).trim().label('Email'),
    username: Joi.string().alphanum().trim().min(6).max(25).when('email', {is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required()}).label('Username'),
    password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim().label('Password'),
    platform: Joi.string().lowercase().trim().valid('web','android','ios').required().label('Platform'),
});
export const register = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    username: Joi.string().alphanum().trim().min(6).max(25).required().label('Username'),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().trim().label('Email'),
    password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim().label('Password'),
    passwordConfirmation: Joi.any().valid(Joi.ref('password')).required().label('Password Confirmation'),
    platform: Joi.string().lowercase().trim().valid('web','android','ios').required().label('Platform'),
    referral: Joi.string().alphanum().trim().min(6).max(25).label('Referral'),
});
export const forgotPassword = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).trim().label('Email'),
});
export const updatePassword = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim().label('Password'),
    newPassword: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim().label('New Password'),
    passwordConfirmation: Joi.any().valid(Joi.ref('newPassword')).required().label('New Password Confirmation').options({ messages: { 'any.only': '{{#label}} does not match'} }),
});
export const validateUsername = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    username: Joi.string().alphanum().trim().min(6).max(25).required().label('Username'),
});
export const validatePhoneNumber = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    phone: myCustomJoi.string().phoneNumber({ defaultCountry: 'ID', format: 'e164' }).trim().required().label('Phone'),
});
export const validateEmail = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().trim().label('Email'),
});