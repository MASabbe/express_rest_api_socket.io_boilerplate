'use strict';
import mysql from "mysql";
import logger from'./logger';
import { mysqlConfig, env } from './vars';
const mysqlOptions = {
    "host": mysqlConfig.host,
    "user": mysqlConfig.user,
    "password": mysqlConfig.pass,
    "database": mysqlConfig.db,
    "connectionLimit":"50",
    "multipleStatements": true,
    "timezone": "UTC"
}
// print mysql logs in dev env
if (env === 'development') {
    Object.assign(mysqlOptions, {debug: true});
}
/**
 * Connect to mysql db
 *
 * @returns {object} Mysql pooling connection
 * @public
 */
export const pool = mysql.createPool(mysqlOptions);
export function connect (){
    pool.getConnection((err, connection) => {
        if (err) {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                logger.error('Database connection was closed.')
            }
            if (err.code === 'ER_CON_COUNT_ERROR') {
                logger.error('Database has too many connections.')
            }
            if (err.code === 'ECONNREFUSED') {
                logger.error('Database connection was refused.')
            }
        }
        logger.info('mysqlDB connected to '+mysqlOptions.host+" ("+mysqlOptions.database+")");
        return connection
    });
}
