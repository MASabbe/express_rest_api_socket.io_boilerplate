import { appName, appVersion, jwtSecret } from "../../config/vars";
import encryption from "../../config/ecdc";
import logger from "../../config/logger";
import authModel from "../models/auth.model";
const ecdc = new encryption(jwtSecret);
export default async function (socket,payload,next) {
    try {
        const connparam = socket._query.param;
        const session = socket.session;
        if (!connparam){
            return next(new Error("Unauthorized socket connection. Err no socket param"));
        }
        let hashConnect = ecdc.dec(connparam);
        if (typeof hashConnect !== "object"){
            hashConnect = JSON.parse(hashConnect);
        }
        const modeConnect = hashConnect.mode;
        const appConnect = hashConnect.app;
        const versionConnect = hashConnect.version;
        const sessionId = hashConnect.sessionId;
        const token = hashConnect.token;
        if (modeConnect !== "server" && modeConnect !== "client"){
            return next(new Error("Unauthorized socket connection. Err invalid socket mode."));
        }
        if (appConnect !== appName){
            return next(new Error("Unauthorized socket connection. Err invalid app name."));
        }
        if (Number(versionConnect) !== Number(appVersion)){
            return next(new Error("Unauthorized socket connection. Err invalid app version."));
        }
        if (!sessionId){
            return next();
        }
        const checkSession = await authModel.checkSession(sessionId);
        if (checkSession.length <= 0){
            return next(  new Error("Unauthorized socket connection. Err invalid session, not found."));
        }
        const sessionData = typeof checkSession.data.data === "string" ? JSON.parse(checkSession.data.data):checkSession.data.data;
        const userData = sessionData.userData;
        const check = await authModel.findOneMember({id_member: userData.idMember}, "banned,token");
        if (check.length <= 0){
            return next(new Error("Unauthorized socket connection. Err invalid session."));
        }
        const dbToken = check.data.token;
        const banned = Number(check.data.banned);
        if (banned === 1){
            return next(new Error("Unauthorized socket connection. Err member is banned."));
        }
        if (token && token !== dbToken){
            await authModel.updateOneMember({id_member: userData.idMember}, {token: token});
        }
        session.reload(()=>{session.userData = userData});
        next();
    }catch (e) {
        logger.error(e.stack);
        next(e);
    }
}