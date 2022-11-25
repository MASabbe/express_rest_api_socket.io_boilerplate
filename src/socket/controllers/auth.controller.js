import { DateTime } from 'luxon';
import authModel from "../models/auth.model";
import userModel from "../models/user.model";
import {signIn,register,forgotPassword,updatePassword,validateUsername,validateEmail} from "../validations/auth.validation";
import SocketError from "../errors/socket-error";
const setResponse = (response={}) => {
    return {
        status: response.status,
        data: response.data,
        message: response.message,
        success: response.status === 200
    }
}
const setError = (error= {},status,isPublic) => {
    return new SocketError({
        message: error.message,
        errors: error.errors,
        stack: error.stack,
        status: status,
        isPublic: isPublic,
        success: false,
    });
}
export default function (socket,session) {
    socket.on('signIn', async (data, callback)=>{
        const now = DateTime.utc()
        const validate = await signIn.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const { username,platform} = validate;
            const check = await authModel.signIn(validate);
            if (!check.success){
                return callback(setError(check, check.status,true));
            }
            session.userData = {
                idMember: check.idMember,
                username: username,
                isShakti: check.isShakti,
                platform: platform,
            };
            session.save();
            await Promise.all([
                userModel.updateOneMember({id_member: check.idMember}, {last_login: now.toISO({includeOffset: false})}),
                userModel.activityLog(check.idMember, `success login with platform ${platform}`),
            ]);
            callback(setResponse({status: 200,data: session.id}));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('register', async (data, callback)=>{
        const validate = await register.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const now = DateTime.utc();
            const {username,email,password,referral,platform} = validate;
            const check = await Promise.all([
                authModel.getMaster(),
                authModel.checkUnique({username: username}),
                authModel.checkUnique({email: email}),
            ]);
            if (check[1].length > 0){
                return callback(setError({message: "Invalid username. Username already exist."}, 400, true));
            }
            if (check[2].length > 0){
                return callback(setError({message: "Invalid email. Email already exist."}, 400,true));
            }
            const refUsername = referral ? referral : check[0].data.username;
            const checkReferral = await userModel.findOneMember({username: refUsername}, "id_member,username,referral_total");
            if (checkReferral.length <= 0){
                return callback(setError({message: "Invalid referral. Not found."}, 403,true));
            }
            const idMember = await authModel.getNewIdMember();
            const idReferral = checkReferral.data.id_member;
            const idUpline = checkReferral.data.id_member;
            const upUsername = checkReferral.data.username;
            const position = Number(checkReferral.data.referral_total) + 1;
            const userData = {
                date_created: now.toISO({includeOffset: false}),
                enable_bonus: 1,
                status: 1,
                id_member: idMember,
                username: username,
                id_referral: idReferral,
                refusername: refUsername,
                id_upline: idUpline,
                upusername: upUsername,
                email: email,
                platform: platform,
                password: password,
                position: position,
            }
            await authModel.register(userData);
            await Promise.all([
                authModel.updateLevelAll(idMember),
                authModel.updateReferral(idReferral),
            ]);
            callback(setResponse({
                status: 200,
                success: true,
                message: "success",
            }));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('auth:forgot:password', async (data, callback)=>{
        const validate = await forgotPassword.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            callback(setResponse({
                status: 200,
                success: true,
                message: "valid",
            }));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('auth:update:password', async (data, callback)=>{
        const validate = await updatePassword.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const idMember = session.userData.idMember;
            const {password,newPassword} = validate;
            const update = await authModel.updatePassword(idMember,password, newPassword);
            if (!update.success){
                return callback(setError({message: update.message}, 400,true));
            }
            await userModel.activityLog(idMember, `success update password.`)
            callback(setResponse({
                status: 200,
                success: true,
                message: "success",
            }));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('auth:validate:username', async (data, callback)=>{
        const validate = await validateUsername.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const {username} = validate;
            const check = await authModel.checkUnique({username: username});
            if (check.length > 0){
                return callback(setError({message: `Invalid username. Username already exist.`}, 400,true));
            }
            callback(setResponse({
                status: 200,
                success: true,
                message: "valid",
            }));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('auth:validate:email', async (data, callback)=>{
        const validate = await validateEmail.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const {email} = validate;
            const check = await authModel.checkUnique({email: email});
            if (check.length > 0){
                return callback(setError({message: `Invalid email. Email already exist.`}, 400,true));
            }
            callback(setResponse({
                status: 200,
                success: true,
                message: "valid",
            }));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
}