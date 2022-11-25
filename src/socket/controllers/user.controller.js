import { DateTime } from 'luxon';
import userModel from "../models/user.model";
import { updateProfile,updateWallet,updateCopyTrade,updateGoogleSecret } from "../validations/user.validation";
import { list } from "../validations/list.validation";
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
    socket.on('user:profile', async (data, callback)=>{
        try {
            const idMember = session.userData.idMember;
            const check = await Promise.all([
                userModel.getProfile(idMember),
                userModel.getDepositAddress(),
            ]).then(async (res)=>{
                if (res[0].length > 0){
                    const checkDetails = await Promise.all([
                        userModel.getPackageDetail(res[0].data.id_package),
                        userModel.getVoucherDetail(res[0].data.id_voucher),
                    ]);
                    res[0].data.package_details = checkDetails[0].length > 0 ? checkDetails[0].data:null;
                    res[0].data.voucher_details = checkDetails[1].length > 0 ? checkDetails[1].data:null;
                }
                return res
            });
            if (check[0].length <= 0){
                return callback(setError({message: "Invalid session."}, 403,true));
            }
            callback(setResponse({
                status: 200,
                data: {
                    profile: check[0].data,
                    deposit: check[1].data,
                }
            }));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:balance', async (data, callback)=>{
        try {
            const idMember = session.userData.idMember;
            const check = await userModel.findOneMember({id_member: idMember}, "saldo,saldo_bonus,bonus_referral,downline_free,downline_premium,downline_total");
            if (check.length <= 0){
                return callback(setError({message: "Invalid session."}, 403,true));
            }
            callback(setResponse({status: 200,data: check.data}));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:copyTrade', async (data, callback)=>{
        try {
            const idMember = session.userData.idMember;
            const check = await userModel.findOneMember({id_member: idMember}, "enable_copy_trade");
            if (check.length <= 0){
                return callback(setError({message: "Invalid session."}, 403,true));
            }
            callback(setResponse({status: 200,data: check.data}));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:networks', async (data, callback)=>{
        const validate = await list.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const idMember = session.userData.idMember;
            const check = await userModel.getUserNetworks(idMember, validate);
            callback(setResponse({status: 200,data: check.data}));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:available:vouchers', async (data, callback) => {
        try {
            const idMember = session.userData.idMember;
            const check = await userModel.findOneMember({id_member: idMember}, "id_package");
            if (check.length <= 0){
                return callback(setError({message: "Invalid session."}, 403,true));
            }
            const packageId = check.data.id_package;
            const getData = await userModel.getAvailableVouchers(packageId);
            callback(setResponse({status: 200,data: getData.data}));
        }catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:update:profile', async (data, callback)=>{
        const validate = await updateProfile.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const now = DateTime.utc();
            const idMember = session.userData.idMember;
            const {firstname,lastname,image} = validate;
            await Promise.all([
               userModel.updateOneMember({id_member: idMember}, {firstname: firstname, lastname: lastname, image: image, last_activity: now.toISO({includeOffset: false})}),
               userModel.activityLog(idMember, `success update profile`),
            ]);
            callback(setResponse({status: 200, message: "success"}));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:update:wallet', async (data, callback)=>{
        const validate = await updateWallet.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const now = DateTime.utc();
            const idMember = session.userData.idMember;
            const {apiKey,secretKey,wallet} = validate;
            const check = await userModel.validateWallet(wallet);
            if (!check.success){
                return callback(setError(check, 400,true));
            }
            await Promise.all([
               userModel.updateOneMember({id_member: idMember}, {wallet: {apiKey: apiKey,secretKey: secretKey,wallet_address: wallet}, last_activity: now.toISO({includeOffset: false})}),
               userModel.activityLog(idMember, `success update profile`),
            ]);
            callback(setResponse({status: 200, message: "success"}));
        } catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:update:copyTrade', async (data, callback) => {
        const validate = await updateCopyTrade.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const now = DateTime.utc();
            const idMember = session.userData.idMember;
            const {status} = validate;
            await Promise.all([
                userModel.updateOneMember({id_member: idMember}, {enable_copy_trade :status, last_activity: now.toISO({includeOffset: false})}),
                userModel.activityLog(idMember, `success ${status === 1 ? "start": "stop"} copy trade`),
            ]);
            callback(setResponse({status: 200, message: `success ${status === 1 ? "start": "stop"} copy trade`}));
        }catch (e) {
            callback(setError(e, 500,false));
        }
    });
    socket.on('user:update:gSecret', async (data, callback) => {
        const validate = await updateGoogleSecret.validateAsync(data).catch((e) => {
            return {success: false, message: e.message, stack: e.stack}
        });
        if (validate.success === false) {
            return callback(setError(validate, 400,true));
        }
        try {
            const now = DateTime.utc();
            const idMember = session.userData.idMember;
            const {gSecret} = validate;
            await Promise.all([
                userModel.updateOneMember({id_member: idMember}, {g_secret :gSecret, last_activity: now.toISO({includeOffset: false})}),
                userModel.activityLog(idMember, `success update google secret`),
            ]);
            callback(setResponse({status: 200, message: `success`}));
        }catch (e) {
            callback(setError(e, 500,false));
        }
    });
}