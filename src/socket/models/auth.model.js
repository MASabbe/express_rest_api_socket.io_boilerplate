import { pool } from "../../config/mysql";
import MysqlHelper from "../../helper/mysql.helper";
import MlmCoreHelper from "../../helper/mlmCore.helper";
const mysqlHelper = new MysqlHelper(pool);
const mlmCore = new MlmCoreHelper(pool);
const checkSession = async (session_id) => {
    return await mysqlHelper.getOneData("sessions", "data", `session_id = ${pool.escape(session_id)}`);
}
const getNewIdMember =  async () => {
    return await mlmCore.getNewIdMember();
}
const updateLevelAll = async (idMember) => {
    return await mlmCore.inputLevelAll(idMember);
}
const updatePassword = async (idMember, userData) => {
    let i = 0;
    let fields = "";
    for (const [key, value] of Object.entries(userData)){
        if (i>0) fields+= " , ";
        fields+= key+"="+pool.escape(value);
        i++;
    }
    return await mysqlHelper.updateData("tbl_member", fields, `id_member = ${pool.escape(idMember)}`, 1);
}
const save = async (userData) => {
    let i = 0;
    let fields = "";
    for (const [key, value] of Object.entries(userData)){
        if (i>0) fields+= " , ";
        fields+= key+"="+pool.escape(value);
        i++;
    }
    return await mysqlHelper.insertData("tbl_member", fields);
}
const findOneMember =  async (conditions, field = "*") => {
    let i = 0;
    let where = "";
    for (const [key, value] of Object.entries(conditions)){
        if (i>0) where+= " AND ";
        where+= key+"="+pool.escape(value);
        i++;
    }
    return await mysqlHelper.getOneData("tbl_member", field, where, "id ASC");
}
const updateOneMember = async (conditions, userData = {}) =>{
    let i = 0;
    let fields = "";
    for (const [key, value] of Object.entries(userData)){
        if (i>0) fields+= " , ";
        fields+= key+"="+pool.escape(value);
        i++;
    }
    let j = 0;
    let where = "";
    for (const [key, value] of Object.entries(conditions)){
        if (j>0) where+= " AND ";
        where+= key+"="+pool.escape(value);
        j++;
    }
    return await mysqlHelper.updateData("tbl_member", fields, where, 1);
}
export default {
    getNewIdMember,
    updateLevelAll,
    checkSession,
    updatePassword,
    findOneMember,
    updateOneMember,
    save,
}