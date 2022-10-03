"use strict";
export default class MysqlHelper {
    pool;
    timeout;
    constructor(mysqlPool) {
        this.pool = mysqlPool;
        this.timeout = 10000;
    }
    query(sql){
        let self = this;
        return new Promise((resolve, reject) => {
            self.pool.getConnection(function (error, connection){
                if (error) return reject(error);
                connection.query({sql: sql, timeout: self.timeout}, function (error, result){
                    connection.release();
                    if (error) return reject(error);
                    resolve(result);
                });
            });
        })
    }
    async getData(table, fields = "*", conditions = "", order = "", limit = ""){
        let sql = `SELECT ${fields} FROM ${table} `;
        if (conditions && conditions !== "") {
            sql += `WHERE ${conditions} `;
        }
        if (order && order !== "") {
            sql += `ORDER BY ${order} `;
        }
        if (limit && limit !== "") {
            sql += `LIMIT ${limit} `;
        }
        let execute = await this.query(sql);
        return {data: execute, length: execute.length};
    }
    async getOneData(table, fields = "*", conditions = "", order = ""){
        let sql = `SELECT ${fields} FROM ${table} `;
        if (conditions && conditions !== "") {
            sql += `WHERE ${conditions} `;
        }
        if (order && order !== "") {
            sql += `ORDER BY ${order} `;
        }
        sql += `LIMIT 1`;
        let execute = await this.query(sql);
        return {data: execute[0], length: execute.length};
    }
    async insertData(table, data){
        return await this.query(`INSERT INTO ${table} SET ${data}`);
    }
    async updateData(table, data, conditions = "", limit = ""){
        let sql = `UPDATE ${table} SET ${data} `;
        if (conditions && conditions !== ""){
            sql += `WHERE ${conditions} `;
        }
        sql += `LIMIT ${limit}`;
        return await this.query(sql);
    }
    async deleteData(table, conditions = "", limit = 1){
        let sql = `DELETE FROM ${table} `;
        if (conditions && conditions !== ""){
            sql += `WHERE ${conditions} `;
        }
        sql += `LIMIT ${limit}`;
        return await this.query(sql);
    }
}