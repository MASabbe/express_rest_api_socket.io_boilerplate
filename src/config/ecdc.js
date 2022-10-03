"use strict";
import CryptoJS from "crypto-js";
export default class ecdc {
    key;
    constructor(secret) {
        this.key  = secret;
    }
    dec(object){
        if (typeof object !== "string")throw new Error("pass encrypt data is not an string");
        let data = CryptoJS.AES.decrypt(object, this.key);
        let jsondata = JSON.parse(data.toString(CryptoJS.enc.Utf8));
        let param = jsondata.ApiKey;
        let apiKey = jsondata.params;
        param = CryptoJS.AES.decrypt(param, this.key);
        param = JSON.parse(param.toString(CryptoJS.enc.Utf8));
        let hmac = CryptoJS.HmacSHA512(JSON.stringify(param),this.key);
        hmac = hmac.toString();
        if (apiKey !== hmac){
            throw new Error("invalid param. api key did not match");
        }
        return param;
    }
    enc(object){
        if (typeof object !== "string") throw new Error("pass encrypt data is not an string");
        object = JSON.parse(object);
        let hmac = CryptoJS.HmacSHA512(JSON.stringify(object), this.key);
        let aes = CryptoJS.AES.encrypt(JSON.stringify(object), this.key);
        let postdata = {
            params : hmac.toString(),
            ApiKey : aes.toString()
        }
        let postvar = CryptoJS.AES.encrypt(JSON.stringify(postdata), this.key);
        postvar = postvar.toString();
        return postvar;
    }
    passEnc(pass, passKey){
        if (typeof pass !== "string") throw new Error("pass encrypt data is not an string");
        let newKey = CryptoJS.MD5(passKey).toString();
        let hmac = CryptoJS.HmacSHA512(pass, newKey);
        hmac = hmac.toString();
        let aes = CryptoJS.AES.encrypt(pass, newKey);
        aes = aes.toString();
        let postdata = {
            params : hmac,
            ApiKey : aes
        }
        let postvar = CryptoJS.AES.encrypt(JSON.stringify(postdata), newKey);
        postvar = postvar.toString();
        return postvar;
    }
    passDec(pass, passKey){
        if (typeof pass !== "string") throw new Error("pass decrypt data is not an string");
        let newKey = CryptoJS.MD5(passKey).toString();
        let data = CryptoJS.AES.decrypt(pass, newKey);
        let jsondata = JSON.parse(data.toString(CryptoJS.enc.Utf8));
        let param = jsondata.ApiKey;
        let apiKey = jsondata.params;
        param = CryptoJS.AES.decrypt(param, newKey);
        param = param.toString(CryptoJS.enc.Utf8);
        let hmac = CryptoJS.HmacSHA512(param,newKey);
        hmac = hmac.toString();
        if (apiKey !== hmac){
            throw new Error("invalid param. api key did not match");
        }
        return param;
    }
    pinEnc(pin){
        return CryptoJS.MD5(pin).toString();
    }
    randomWord(){
        return CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
    }
}
