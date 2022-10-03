"use strict";
class redisHelper {
    connection;
    timeout;
    constructor(redisConnection) {
        this.connection = redisConnection;
        this.timeout = 50;
        this.ttl = 60 * 60;
    }
    async sendCommand(query){
        let self = this;
        return await self.sendCommand(query);
    }
    async setData(key, value){
        let self = this;
        return await self.connection.multi().set(key, value).expire(key, self.ttl).exec();
    }
    async getData(key){
        let self = this;
        let execute = await self.connection.get(key);
        if (execute){
            return {data: execute, length: 1};
        }else{
            return {data: execute, length: 0};
        }
    }
    async hGetOneData(key, field){
        let self = this;
        let execute = await self.connection.hGet(key, field);
        if (execute){
            return {data: execute, length: 1};
        }else{
            return {data: execute, length: 0};
        }
    }
    async hSetOneData(key, field, value){
        let self = this;
        return await self.connection.hSet(key, field, value);
    }

}
module.exports = redisHelper;