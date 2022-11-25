import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import {jwtSecret,jwtExpirationInterval} from "../../config/vars";
import {pool} from "../../config/mysql";
import MysqlHelper from "../../helper/mysql.helper";
import jwt from 'jwt-simple';
import APIError from '../errors/api-error';
import { DateTime } from 'luxon';
const mysqlHelper = new MysqlHelper(pool);
const table = "tbl_admin";
function token(id){
    const payload = {
        exp: DateTime.utc().plus({minutes: jwtExpirationInterval}).toMillis(),
        iat: DateTime.utc().toMillis(),
        sub: id,
    };
    return jwt.encode(payload, jwtSecret);
}
/**
 * User Roles
 */
export const roles = ["SuperUser","User"];
export const sendTelegramMessage = async (messages, telegramId) => {
    return true
}
export const transform = (user) => {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        banned: Number(user.banned),
        role: user.role,
        createdAt: user.date_created,
    }
};
export const checkUnique = async (conditions) =>{
    let i = 0;
    let where = "";
    for (const [key, value] of Object.entries(conditions)){
        if (i>0) where+= " AND ";
        where+= key+"="+pool.escape(value);
        i++;
    }
    return await mysqlHelper.getOneData(table, 'id', where, 'id ASC');
}
export const save = async (userData) => {
    const now = DateTime.utc().toISODate();
    const {email,username,password} = userData;
    const hash = await bcrypt.hash(password, 10);
    const save = await mysqlHelper.insertData(table, `email=${pool.escape(email)},username=${pool.escape(username)},pass=${pool.escape(hash)},date_created=${pool.escape(now)}`).then(async (insert) => {
        const user = await mysqlHelper.getOneData(table, 'id,email,username,pass,banned,otp,role,date_created', `id=${pool.escape(insert.insertId)}`, 'id ASC');
        return user.data;
    });
    return {
        id: save.id,
        username: save.username,
        token: token(save.id),
    };
}
export const login = async (userData) => {
    const now = DateTime.utc();
    const {username,password,otp} = userData;
    const err = {
        status: httpStatus.UNAUTHORIZED,
        isPublic: true,
    };
    const check = await mysqlHelper.getOneData(table, 'id,email,username,pass,banned,otp,role,date_created', `username=${pool.escape(username)}`, 'id ASC');
    if (check.length <= 0){
        err.message = "Invalid username. User not found";
        throw new APIError(err);
    }
    const id = check.data.id;
    const usernameDb = check.data.username;
    const passwordDb = check.data.pass;
    const email = check.data.email;
    const role = check.data.role;
    const date_created = check.data.date_created;
    const otpDb = check.data.otp;
    const isValid = await bcrypt.compare(password, passwordDb);
    const status = Number(check.data.status);
    const banned = Number(check.data.banned);
    if (status === 0){
        err.message = "This user is not active. Please activate first.";
        throw new APIError(err);
    }
    if (banned === 1){
        err.message = "Banned username.";
        throw new APIError(err);
    }
    if (otpDb !== otp){
        err.message = "Invalid OTP. Please check again.";
        throw new APIError(err);
    }
    if (!isValid){
        err.message = "Invalid password. Please check again.";
        throw new APIError(err);
    }
    await mysqlHelper.updateData(table,`last_login = ${pool.escape(now.toISO({includeOffset: false}))}`, `id = ${pool.escape(id)}`, 1);
    return {
        user: {
            id: id,
            username: usernameDb,
            email: email,
            role: role,
            date_created: date_created,
        },
        accessToken: token(id),
    }
}
export const findAndGenerateToken = async (data) => {
    const {username,refreshObject}  = data;
    const err = {
        status: httpStatus.UNAUTHORIZED,
        isPublic: true,
    };
    if (!refreshObject.hasOwnProperty('username') || refreshObject['username'] !== username){
        err.message = "Invalid refresh token";
        throw new APIError(err);
    }
    const diff = DateTime.fromJSDate(refreshObject['expires']).diffNow('milliseconds').toObject();
    if (Number(diff['milliseconds']) <= 0){
        err.message = "Invalid refresh token";
        throw new APIError(err);
    }
    const check = await mysqlHelper.getOneData(table, 'id,email,username,pass,banned,otp,role,date_created', `username=${pool.escape(username)}`, 'id ASC');
    if (check.length <= 0){
        err.message = "Invalid username. User not found";
        throw new APIError(err);
    }
    const id = check.data.id;
    const email = check.data.email;
    const usernameDb = check.data.username;
    const role = check.data.role;
    const date_created = check.data.date_created;
    return {
        user: {
            id: id,
            username: usernameDb,
            email: email,
            role: role,
            date_created: date_created,
        },
        accessToken: token(id),
    }
}
export const findOne = async (conditions, fields = "*") => {
    const err = {
        status: httpStatus.UNAUTHORIZED,
        isPublic: true,
    };
    let i = 0;
    let where = ``;
    for (const [key,value] of Object.entries(conditions)){
        if (i > 0) where += ` AND `;
        where += value === null ? `${key} = NULL`:`${key} = ${pool.escape(value)}`;
        i++;
    }
    const check = await mysqlHelper.getOneData(table, fields, where, 'id ASC');
    if (check.length <= 0){
        err.message = "User not found";
        throw new APIError(err);
    }
    return check.data;
}
export const findById = async (id) =>{
    const err = {
        status: httpStatus.UNAUTHORIZED,
        isPublic: true,
    };
    const check = await mysqlHelper.getOneData(table, 'id,email,username,pass,banned,otp,role,date_created', `id=${pool.escape(id)}`, 'id ASC');
    if (check.length <= 0){
        err.message = "User not found";
        throw new APIError(err);
    }
    return check.data;
}
export const list = async (data) => {
    const {page,perPage,username,email,role} = data;
    const start = (page - 1) * perPage;
    let where = ``;
    if (role){
        where += `role = ${pool.escape(role)}`
    }
    if (username){
        where += where === `` ? `username LIKE "%${username}%"`:` AND username LIKE "%${username}%"`;
    }
    if (email){
        where += where === `` ? `email LIKE "%${email}%"`:` AND email LIKE "%${email}%"`;
    }
    const getData = await mysqlHelper.getData(table, "id,email,username,banned,role,date_created", where, "id ASC", `${start},${perPage}`);
    return getData.data;
}
export const updateOne = async (conditions,adminData={}) => {
    let i = 0;
    let data = ``
    for (const [key,value] of Object.entries(adminData)){
        if (i>0) data += ` ,`;
        if(value === null){
            data += `${key} = NULL`;
        }else if (typeof value !== "string"){
            data += `${key} = ${pool.escape(JSON.stringify(value))}`
        }else{
            data += `${key} = ${pool.escape(value)}`;
        }
        i++;
    }
    let j = 0;
    let where = ``;
    for (const [key,value] of Object.entries(conditions)){
        if (j > 0) where += ` AND `;
        where += value === null ? `${key} = NULL`:`${key} = ${pool.escape(value)}`;
        j++;
    }
    return await mysqlHelper.updateData(table, data, where, 1);
}
export const updatePassword = async (conditions, password) => {
    let j = 0;
    let where = ``;
    for (const [key,value] of Object.entries(conditions)){
        if (j > 0) where += ` AND `;
        where += value === null ? `${key} = NULL`:`${key} = ${pool.escape(value)}`;
        j++;
    }
    const hash = await bcrypt.hash(password, 10);
    return await mysqlHelper.updateData(table, `pass = ${pool.escape(hash)}`, where, 1);
}