import Joi from 'joi';
export const listUsers = {
    query: Joi.object().keys({
        page: Joi.number().required().min(1),
        perPage: Joi.number().required().min(1).max(100),
        name: Joi.string().required(),
        email: Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
        role: Joi.string().required().valid('user', 'admin'),
    }),
}
export const createUser = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(128).required(),
        name: Joi.string().max(128),
        role: Joi.string().required().valid('user', 'admin'),
    }),
}
export const replaceUser = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(128).required(),
        name: Joi.string().max(128),
        role: Joi.string().required().valid('user', 'admin'),
    }),
}
export const updateUser = {
    body: Joi.object().keys({
        email: Joi.string().email(),
        password: Joi.string().min(6).max(128),
        name: Joi.string().max(128),
        role: Joi.string().required().valid('user', 'admin'),
    }),
    params: Joi.object().keys({
        userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    }),
}