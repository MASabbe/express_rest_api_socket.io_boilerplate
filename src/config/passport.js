import BearerStrategy from "passport-http-bearer";
import LocalStrategy from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { jwtSecret, jwtExpirationInterval, env, passwordSakti } from "./vars";
import authProviders from "#api/services/authProviders";
import User from "#api/models/user.model";
const jwtOptions = { secretOrKey: jwtSecret, jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer') };
const jwt = async (payload, done) => {
    try {
        const user = await User.findById(payload.sub);
        if (user) return done(null, user);
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
};
const oAuth = (service) => async (token, done) => {
    try {
        const userData = await authProviders[service](token);
        const user = await User.oAuthLogin(userData);
        return done(null, user);
    } catch (err) {
        return done(err);
    }
};
exports.jwt = new JWTStrategy(jwtOptions, jwt);
exports.facebook = new BearerStrategy(oAuth('facebook'));
exports.google = new BearerStrategy(oAuth('google'));