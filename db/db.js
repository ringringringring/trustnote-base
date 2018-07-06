/*jslint node: true */
"use strict";

const conf = require('../config/constants');
const log = require('../common/logger');
var mysql = require('mysql');
var pool  = mysql.createPool({
    connectionLimit : conf.database.max_connections,
    host     : conf.database.host,
    user     : conf.database.user,
    password : conf.database.password,
    charset  : 'UTF8_UNICODE_CI',
    database : conf.database.name
});

class DataBase {

    constructor() {
        this.pool = pool;
    }

    async executeInTransaction (doWork) {
        let conn =  await this.takeConnectionFromPool();
        if (!conn) {
            log.error('takeConnectionFromPool failed !');
            return;
        }
        await this.query("BEGIN", null, conn);
        let err = await doWork(conn);
        await this.query(err ? "ROLLBACK" : "COMMIT", null, conn);
        conn.release();
        log.info(`connection: ${conn.threadId} is released`)
    }
    
    query (sqlstr, params, conn ) {
        let resolve;
        const waitPromise = new Promise(r => resolve = r);
        
        function callback ( err, results, fields ) {
            if (err) {
                log.error(`query err: ${err}`);
                resolve(err);
            } else  resolve(results);
        };

        let conn_or_pool = this.pool;
        if (conn) {
            conn_or_pool = conn;
        };

        if (params) {
            conn_or_pool.query(sqlstr, params, callback);
        } else {
            conn_or_pool.query(sqlstr, callback); 
        }
        return waitPromise;
    }

    takeConnectionFromPool () {
        return new Promise ((resolve, reject)=> {
            this.pool.getConnection(function(err, new_connection) {
                if (err) {
                    log.error('getConnection err:',err);
                    resolve(null)
                    return;
                };
                log.info("got connection from pool");
                resolve(new_connection);
            });
        })
    }

    addQuery (arr, sqlstr, params, conn ) {
        if (!Array.isArray(arr)) {
            log.warn('the first param execpted an array');
            return;
        };
        arr.push( {sqlstr: sqlstr, params: params, conn: conn } );
    }

    async exec (arr) {
        if (!Array.isArray(arr)) {
            log.info('exec params execpted an array');
            return;
        }
        for (let i = 0; i < arr.length; i ++ ) {
            let item = arr[i];
            await this.query(item.sqlstr, item.params, item.conn);
        }
        return '1'
    }

    getCountUsedConnections (){
        return (this.pool._allConnections.length - this.pool._freeConnections.length);
    };
    
    close (cb){
        connection_or_pool.end(cb);
    };
    
    addTime (interval){
        return "NOW() + INTERVAL "+interval;
    };

    getNow (){
        return "NOW()";
    };

    getFromUnixTime (ts){
        return "FROM_UNIXTIME("+ts+")";
    };

    getRandom (){
        return "RAND()";
    };

    forceIndex (index){
        return "FORCE INDEX ("+ index +")";
    };

    dropTemporaryTable (table){
        return "DROP TEMPORARY TABLE IF EXISTS " + table;
    };

    getIgnore (){
        return "IGNORE";
    };

    getUnixTimestamp (date){
        return "UNIX_TIMESTAMP("+date+")";
    };
}

module.exports = new DataBase();