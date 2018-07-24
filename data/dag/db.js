/*jslint node: true */
"use strict";

const conf = require('../../config/conf');
const log = require('../../common/logger');
var mysql = require('mysql');

function queryCallbackToQueryPromise (conn_or_pool) {
    let fn = conn_or_pool.query;
    return function () {
        let last_arg = arguments[arguments.length - 1];
        let bHasCallback = (typeof last_arg === 'function');
        if (bHasCallback){ 
            return fn.apply(conn_or_pool, arguments);
        }
        let new_args =  Array.from(arguments);
        let resolve;
        const waitPromise = new Promise(r => resolve = r);
        function callback ( err, results, fields ) {
            if (err) {
                log.error(`query err: ${err}`);
                resolve();
                throw new Error(err);
            } else  resolve(results);
        };
        new_args.push(callback);
        fn.apply(conn_or_pool, new_args);
        return waitPromise;
    }
}

function createPool ({max_connections,host,database,user,password}) {
    let pool  = mysql.createPool({
        connectionLimit : max_connections,
        host     : host,
        database : database,
        user     : user,
        password : password,
        charset  : 'utf8mb4_unicode_ci'
    });
    return pool;
}

class DataBase {

    constructor({max_connections,host,database,user,password}) {
        if (!this.pool) {
             this.pool = createPool({max_connections,host,database,user,password});
        }
        let query = this.pool.query;
        this.query = queryCallbackToQueryPromise(this.pool);
    }

    async executeInTransaction (doWork) {
        let conn =  await this.takeConnectionFromPool();
        await conn.query("BEGIN");
        let err = await doWork(conn);
        await conn.query(err ? "ROLLBACK" : "COMMIT");
        await conn.release();
        log.info(`connection: ${conn.threadId} is released`)
    }
    
    takeConnectionFromPool () {
        return new Promise ((resolve, reject)=> {
            this.pool.getConnection(function(err, new_connection) {
                if (err) {
                    log.error('getConnection err:',err);
                    resolve();
                    throw new Error(err);
                    return;
                };
                log.info("got connection from pool");
                new_connection.query = queryCallbackToQueryPromise(new_connection);
                resolve(new_connection);
            });
        })
    }

    addQuery (arr) {
        if (!Array.isArray(arr)) {
            log.warn('the first param execpted an array');
            return;
        };
        let query_args = [];
        for (let i=1; i<arguments.length; i++){
            query_args.push(arguments[i]);
        }
        arr.push(query_args);
    }

    async exec (arr) {
        if (!Array.isArray(arr)) {
            log.info('exec params execpted an array');
            return;
        }
        for (let i = 0; i < arr.length; i ++ ) {
            let query_args = arr[i];
            await this.query.apply(this, query_args);
        }
        return 'ok';
    }

    getCountUsedConnections (){
        return (this.pool._allConnections.length - this.pool._freeConnections.length);
    };
    
    async close (cb){
        return new Promise((resolve, reject) => {
            this.pool.end(function(err){
                resolve();
                if(err) throw new Error(err);
            });
        })
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

module.exports =  {
    DataBase,
};
