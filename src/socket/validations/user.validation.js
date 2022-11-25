import Joi from "joi";
export const updateProfile = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    firstname: Joi.string().required().trim().label('Firstname'),
    lastname: Joi.string().required().trim().label('Lastname'),
    image: Joi.string().required().trim().label('Image'),
});
export const updateWallet = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    apiKey: Joi.string().alphanum().required().trim().label("API Key"),
    secretKey: Joi.string().alphanum().required().trim().label("Secret Key"),
    wallet: Joi.string().alphanum().required().trim().label("Wallet"),
});
export const updateCopyTrade = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    status: Joi.number().required().valid(0,1).label('Status'),
});
export const updateGoogleSecret = Joi.object().keys({
    nonce: Joi.date().timestamp().required(),
    gSecret: Joi.string().trim().label('Secret'),
});