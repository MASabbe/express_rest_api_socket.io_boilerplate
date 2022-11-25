import { DateTime } from "luxon";
const validateNonce = (timestamp) =>{
    let now = DateTime.utc();
    let serverTime = now.toMillis();
    let recvWindow = 10000;//milliseconds
    return timestamp < (serverTime + 1000) && (serverTime - timestamp) <= recvWindow;
}
export default function (io,socket) {
    socket.use(function ([event, data, callback], next) {
        let res = {};
        let eventWithoutSession = [
            'auth:signIn',
            'auth:register',
            'auth:forgot:passowrd',
        ]
        let eventWithSession = [
            'auth:update:passowrd',
            'user:profile',
        ]
        let registeredEvent = ["serverTime",...eventWithoutSession,...eventWithSession];
        let checkValidEvent = registeredEvent.includes(event);
        let checkEventSession = eventWithSession.includes(event);
        if (!checkValidEvent || typeof callback !== "function"){
            return  next(new Error("Unauthorized socket connection. Event not found."+event));
        }
        if (typeof data !== "object"){
            res.success = false;
            res.message = "Data is not an object.";
            return callback(res);
        }
        if (event !== "serverTime"){
            if (!data.hasOwnProperty('nonce')){
                res.success = false;
                res.message = "Data does not have nonce.";
                return callback(res);
            }
            // let validate = validateNonce(data.nonce);
            let validate = true;
            if (!validate){
                res.success = false;
                res.message = "event expired.";
                return callback(res);
            }
        }
        if (checkEventSession){
            if (!session.hasOwnProperty('userData')) {
                res.success = false;
                res.message = "no session";
                return callback(res);
            }
        }
        return  next();
    });
    socket.on('serverTime', function (data, callback){
        let now = DateTime.utc();
        callback(now.toMillis());
    });
}