"use strict";
import { DateTime } from "luxon";
import MysqlHelper from './mysql.helper';
export default class MlmCoreHelper {
    connection;
    mysqlHelper;
    constructor(connection) {
        this.connection = connection;
        this.mysqlHelper = new MysqlHelper(this.connection);
    }
    async getNewIdMember(){
        let countMember = await this.mysqlHelper.getOneData("tbl_member", "IFNULL(MAX(id), 0) AS count");
        let count = countMember.length > 0 ? parseInt(countMember.data.count) : 0;
        let nextId = count + 1;
        nextId = nextId.toString();
        let sb = "000000";
        return "SZ" + sb.substring(0, sb.length - nextId.length) + nextId;
    }
    async updateGeneration(idUpline){
        let getData = await this.mysqlHelper.getOneData("tbl_level_all A INNER JOIN tbl_member B ON B.id_member = A.id_member", "COUNT(DISTINCT A.id) AS generation_tot, SUM(IF(B.is_premium = 0,1,0)) AS generation_free, SUM(IF(B.is_premium = 1,1,0)) AS generation_premium", "A.id_upline = "+this.connection.escape(idUpline));
        if (getData.length > 0){
            await this.mysqlHelper.updateData("tbl_member", `generation_tot=${this.connection.escape(getData.data.generation_tot)},generation_free=${this.connection.escape(getData.data.generation_free)},generation_premium=${this.connection.escape(getData.data.generation_premium)}`, `id_member=${this.connection.escape(idUpline)}`, 1);
        }
    }
    async inputLevelAll(idMember){
        let now = DateTime.utc();
        let check = await this.mysqlHelper.getOneData("tbl_member", "id_member,id_upline,position", "id_member = "+this.connection.escape(idMember), "id ASC");
        let i = 1;
        let idUpLine = check.length > 0 ? check.data.id_upline : "";
        let position = check.data.position;
        while (idUpLine !== "" && idUpLine){
            let checkLevel = await this.mysqlHelper.getOneData("tbl_level_all", "id", `id_member = ${this.connection.escape(idMember)} AND id_upline = ${this.connection.escape(idUpLine)} AND position = ${this.connection.escape(position)} AND level = ${this.connection.escape(i)}`, "id ASC");
            if (checkLevel.length <= 0){
                await this.mysqlHelper.insertData("tbl_level_all", "id_member = "+this.connection.escape(idMember)+" , id_upline = "+this.connection.escape(idUpLine)+", position = "+this.connection.escape(position)+", level= "+this.connection.escape(i)+", date_created = "+this.connection.escape(now.toISO({ includeOffset: false })));
            }
            await this.updateGeneration(idUpLine);
            let checkUpline = await this.mysqlHelper.getOneData("tbl_member", "id_member,id_upline,position", "id_member = "+this.connection.escape(idUpLine), "id ASC");
            idUpLine = checkUpline.length > 0 ? checkUpline.data.id_upline : "";
            position = checkUpline.length > 0 ? checkUpline.data.position : "";
            i++;
        }
    }
    async checkDailyBonus(idMember){
        let check = await this.mysqlHelper.getOneData("tbl_bonus_daily", "id", `date_created = CURRENT_DATE() AND id_member = ${this.connection.escape(idMember)}`, "id ASC");
        if (check.length > 0){
            return check.data.id;
        }
        let insert = await this.mysqlHelper.insertData("tbl_bonus_daily", `date_created = CURRENT_DATE(), id_member = ${this.connection.escape(idMember)}`);
        return insert.insertId;
    }
    async checkMonthlyBonus(idMember){
        let check = await this.mysqlHelper.getOneData("tbl_bonus_monthly", "id", `date_created = CURRENT_DATE() AND id_member = ${this.connection.escape(idMember)}`, "id ASC");
        if (check.length > 0){
            return check.data.id;
        }
        let insert = await this.mysqlHelper.insertData("tbl_bonus_monthly", `date_created = CURRENT_DATE(), id_member = ${this.connection.escape(idMember)}`);
        return insert.insertId;
    }
    async updateBonusStatistic(idMember, bonus){
        let check = await Promise.all([
            this.checkDailyBonus(idMember),
            this.checkMonthlyBonus(idMember),
        ]);
        let idDaily = check[0];
        let idMonthly = check[1];
        await Promise.all([
            this.mysqlHelper.updateData("tbl_bonus_daily", `bonus_sponsor = (bonus_sponsor + ${bonus})`, `id = ${this.connection.escape(idDaily)}`, 1),
            this.mysqlHelper.updateData("tbl_bonus_monthly", `bonus_sponsor = (bonus_sponsor + ${bonus})`, `id = ${this.connection.escape(idMonthly)}`, 1),
        ])
    }
    async userActivityLog(idMember, activity){
        let now = DateTime.utc();
        return await this.mysqlHelper.insertData("tbl_activity_log", `date_created = ${this.connection.escape(now.toISO({ includeOffset: false }))},id_member = ${this.connection.escape(idMember)}, activity = ${this.connection.escape(activity)}`);
    }
    async userTransactionLog(idMember,transactionType,doc){
        let now = DateTime.utc();
        let hash = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        while (hash === ''){
            for ( let i = 0; i < 62; i++ ) {
                hash += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            hash = '0x'.concat(hash).substr(0, 64);
            hash = hash.toLocaleLowerCase();
            let check = await this.mysqlHelper.getOneData("tbl_trx_history", "id", `id_transaction = ${this.connection.escape(hash)}`);
            if (check.length > 0){
                hash = '';
            }
        }
        if (typeof doc === "object"){
            doc = JSON.stringify(doc);
        }
        return await this.mysqlHelper.insertData("tbl_trx_history", `status = 1, date_created = ${this.connection.escape(now.toISO({ includeOffset: false }))}, id_transaction = ${this.connection.escape(hash)}, id_member = ${this.connection.escape(idMember)}, type = ${this.connection.escape(transactionType)}, docs = ${this.connection.escape(doc)}`);
    }
    async userTransferLog(idMember,transferType,doc){
        let now = DateTime.utc();
        let hash = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        while (hash === ''){
            for ( let i = 0; i < 62; i++ ) {
                hash += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            hash = '0x'.concat(hash).substr(0, 64);
            hash = hash.toLocaleLowerCase();
            let check = await this.mysqlHelper.getOneData("tbl_transfer_history", "id", `id_transaction = ${this.connection.escape(hash)}`);
            if (check.length > 0){
                hash = '';
            }
        }
        if (typeof doc === "object"){
            doc = JSON.stringify(doc);
        }
        return await this.mysqlHelper.insertData("tbl_transfer_history", `status = 1, date_created = ${this.connection.escape(now.toISO({ includeOffset: false }))}, id_transaction = ${this.connection.escape(hash)}, id_member = ${this.connection.escape(idMember)}, type = ${this.connection.escape(transferType)}, docs = ${this.connection.escape(doc)}`);
    }
    async userWithdrawalLog(idMember,withdrawalType,doc){
        let now = DateTime.utc();
        let hash = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        while (hash === ''){
            for ( let i = 0; i < 62; i++ ) {
                hash += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            hash = '0x'.concat(hash).substr(0, 64);
            hash = hash.toLocaleLowerCase();
            let check = await this.mysqlHelper.getOneData("tbl_withdrawal_history", "id", `id_transaction = ${this.connection.escape(hash)}`);
            if (check.length > 0){
                hash = '';
            }
        }
        if (typeof doc === "object"){
            doc = JSON.stringify(doc);
        }
        return await this.mysqlHelper.insertData("tbl_withdrawal_history", `status = 0, date_created = ${this.connection.escape(now.toISO({ includeOffset: false }))}, id_transaction = ${this.connection.escape(hash)}, id_member = ${this.connection.escape(idMember)}, type = ${this.connection.escape(withdrawalType)}, docs = ${this.connection.escape(doc)}`);
    }
    async userDepositLog(idMember,depositType,doc, status = 1){
        let now = DateTime.utc();
        let hash = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        while (hash === ''){
            for ( let i = 0; i < 62; i++ ) {
                hash += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            hash = '0x'.concat(hash).substr(0, 64);
            hash = hash.toLocaleLowerCase();
            let check = await this.mysqlHelper.getOneData("tbl_deposit_history", "id", `id_transaction = ${this.connection.escape(hash)}`);
            if (check.length > 0){
                hash = '';
            }
        }
        if (typeof doc === "object"){
            doc = JSON.stringify(doc);
        }
        return await this.mysqlHelper.insertData("tbl_deposit_history", `status = ${this.connection.escape(status)}, date_created = ${this.connection.escape(now.toISO({ includeOffset: false }))}, id_transaction = ${this.connection.escape(hash)}, id_member = ${this.connection.escape(idMember)}, type = ${this.connection.escape(depositType)}, docs = ${this.connection.escape(doc)}`);
    }
    async userBonusLog(idMember,bonusType,doc){
        let now = DateTime.utc();
        let hash = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        while (hash === ''){
            for ( let i = 0; i < 62; i++ ) {
                hash += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            hash = '0x'.concat(hash).substr(0, 64);
            hash = hash.toLocaleLowerCase();
            let check = await this.mysqlHelper.getOneData("tbl_bonus_history", "id", `id_transaction = ${this.connection.escape(hash)}`);
            if (check.length > 0){
                hash = '';
            }
        }
        if (typeof doc === "object"){
            doc = JSON.stringify(doc);
        }
        return await this.mysqlHelper.insertData("tbl_bonus_history", `status = 1, date_created = ${this.connection.escape(now.toISO({ includeOffset: false }))}, id_transaction = ${this.connection.escape(hash)}, id_member = ${this.connection.escape(idMember)}, type = ${this.connection.escape(bonusType)}, docs = ${this.connection.escape(doc)}`);
    }
    async bonusSponsoring(jumlahBonus,fromIdMember,toIdMember){
        if (fromIdMember === "AIT000001") return;
        let check = await Promise.all([
            this.mysqlHelper.getOneData("tbl_member", "username", `id_member = ${this.connection.escape(fromIdMember)}`, "id ASC"),
            this.mysqlHelper.getOneData("tbl_member", "username,id_member,enable_bonus,saldo_bonus_sponsor,bonus_sponsor", `id_member = ${this.connection.escape(toIdMember)}`, "id ASC"),
        ]);
        if (check[0].length <= 0){
            throw new Error("Invalid from id member. Member not found");
        }
        if (check[1].length <= 0){
            throw new Error("Invalid to id member. Member not found");
        }
        let fromUsername = check[0].data.username;
        let toUsername = check[1].data.username;
        let toEnableBonus = Number(check[1].data.enable_bonus);
        let toSaldoSponsor = Number(check[1].data.saldo_bonus_sponsor);
        let toBonusSponsor = Number(check[1].data.bonus_sponsor);
        let saldoSponsorAfter = toSaldoSponsor + jumlahBonus;
        let bonusSponsorAfter = toBonusSponsor + jumlahBonus;
        if (toEnableBonus === 1){
            let doc = {
                from: fromUsername,
                to: toUsername,
                type: "referral_bonus",
                amount: jumlahBonus,
                saldo_sponsor_before: toSaldoSponsor,
                saldo_sponsor_after: saldoSponsorAfter,
                bonus_sponsor_before: toBonusSponsor,
                bonus_sponsor_after: bonusSponsorAfter,
                mode: "Referral bonus, from : " + fromUsername + ". Amount : " + jumlahBonus,
            }
            await this.updateBonusStatistic(toIdMember,jumlahBonus);
            await this.mysqlHelper.updateData("tbl_member", `saldo_bonus_sponsor = ${this.connection.escape(saldoSponsorAfter)},bonus_sponsor = ${this.connection.escape(bonusSponsorAfter)}`, `id_member=${this.connection.escape(toIdMember)}`, 1);
            await this.userBonusLog(toIdMember, "bonus_sponsor", doc);
        }
    }
    async bonusGeneration(amount, fromIdMember){
        if (fromIdMember === "AIT000001") return;
        const maxGen = 10;
        const check = await Promise.all([
            this.mysqlHelper.getOneData("tbl_member", "username,id_upline", `id_member = ${this.connection.escape(fromIdMember)}`, "id ASC"),
        ]);
        if (check[0].length <= 0){
            throw new Error("Invalid from id member. Member not found");
        }
        let fromUsername = check[0].data.username;
        let idUpline = check[0].data.id_upline;
        let a = 1;
        let jumlahBonus;
        while (idUpline && a <= maxGen){
            const checkUpline = await this.mysqlHelper.getOneData("tbl_member", "username,id_upline,enable_bonus,saldo_bonus_sponsor,bonus_sponsor", `id_member = ${this.connection.escape(idUpline)}`, "id ASC");
            if (checkUpline.length <= 0){
                throw new Error("Invalid to id member. Member not found");
            }
            switch (a){
                case 1:{
                    jumlahBonus = amount * 0.15;
                    break;
                }
                case 2:{
                    jumlahBonus = amount * 0.10;
                    break;
                }
                case 3:{
                    jumlahBonus = amount * 0.05;
                    break;
                }
                case 4:{
                    jumlahBonus = amount * 0.05;
                    break;
                }
                case 5:{
                    jumlahBonus = amount * 0.05;
                    break;
                }
                default: {
                    jumlahBonus = amount * 0.02;
                }
            }
            const toIdMember = idUpline;
            const toUsername = checkUpline.data.username;
            const toEnableBonus = Number(checkUpline.data.enable_bonus);
            const toSaldoSponsor = Number(checkUpline.data.saldo_bonus_sponsor);
            const toBonusSponsor = Number(checkUpline.data.bonus_sponsor);
            const saldoSponsorAfter = toSaldoSponsor + jumlahBonus;
            const bonusSponsorAfter = toBonusSponsor + jumlahBonus;
            if (toEnableBonus === 1){
                let doc = {
                    from: fromUsername,
                    to: toUsername,
                    type: `affiliate_g${a}_bonus`,
                    amount: jumlahBonus,
                    saldo_sponsor_before: toSaldoSponsor,
                    saldo_sponsor_after: saldoSponsorAfter,
                    bonus_sponsor_before: toBonusSponsor,
                    bonus_sponsor_after: bonusSponsorAfter,
                    mode: "Referral bonus, from : " + fromUsername + ". Amount : " + jumlahBonus,
                }
                await this.updateBonusStatistic(toIdMember,jumlahBonus);
                await this.mysqlHelper.updateData("tbl_member", `saldo_bonus_sponsor = ${this.connection.escape(saldoSponsorAfter)},bonus_sponsor = ${this.connection.escape(bonusSponsorAfter)}`, `id_member=${this.connection.escape(toIdMember)}`, 1);
                await this.userBonusLog(toIdMember, "bonus_sponsor", doc);
            }
            idUpline = checkUpline.data.id_upline;
            a++;
        }
    }
}