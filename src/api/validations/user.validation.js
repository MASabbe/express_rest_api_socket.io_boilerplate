import Joi from 'joi';
export const listUsers = {
    query: Joi.object().keys({
        page: Joi.number().required().min(1),
        perPage: Joi.number().required().min(1).max(100),
        username: Joi.string().trim().min(4).max(15),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
        role: Joi.string().valid('SuperUser', 'User'),
    }),
}
export const createUser = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        passwordConfirmation: Joi.any().valid(Joi.ref('password')).required().options({ messages: { 'any.only': '{{#label}} does not match'} }),
        username: Joi.string().trim().min(4).max(15),
        role: Joi.string().required().valid('SuperUser', 'User'),
    }),
}
export const replaceUser = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        role: Joi.string().required().valid('SuperUser', 'User'),
    }),
}
export const updateUser = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().alphanum().min(6).max(15).pattern(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/, 'password').required().trim(),
        username: Joi.string().trim().min(4).max(15),
        role: Joi.string().required().valid('SuperUser', 'User'),
    }),
    params: Joi.object().keys({
        userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    }),
}