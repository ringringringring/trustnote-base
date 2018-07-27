/* jslint node: true */

const mysql = require('mysql');
const log = require('../../common/logger');

function queryCallbackToQueryPromise(connOrPool) {
    const fn = connOrPool.query;
    return function (...args) {
        const lastArg = args[args.length - 1];
        const bHasCallback = (typeof lastArg === 'function');
        if (bHasCallback) {
            return fn.apply(connOrPool, args);
        }
        const newArgs = Array.from(args);
        let resolve;
        const waitPromise = new Promise(r => resolve = r);
      
        function callback(err, results) {
            if (err) {
                log.error(`query err: ${err}`);
                resolve();
                throw new Error(err);
            } else resolve(results);
        }
        newArgs.push(callback);
        fn.apply(connOrPool, newArgs);
        return waitPromise;
    };
}

function createPool({
    maxConnections, host, database, user, password,
}) {
    const pool = mysql.createPool({
        connectionLimit: maxConnections,
        host,
        database,
        user,
        password,
        charset: 'utf8mb4_unicode_ci',
    });
    return pool;
}

class DataBase {
    constructor({
        maxConnections, host, database, user, password,
    }) {
        if (!this.pool) {
            this.pool = createPool({
                maxConnections, host, database, user, password,
            });
        }
        const query = this.pool.query;
        this.query = queryCallbackToQueryPromise(this.pool);
    }

    async executeInTransaction(doWork) {
        const conn = await this.takeConnectionFromPool();
        await conn.query('BEGIN');
        const err = await doWork(conn);
        await conn.query(err ? 'ROLLBACK' : 'COMMIT');
        await conn.release();
        log.info(`connection: ${conn.threadId} is released`);
    }

    takeConnectionFromPool() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, new_connection) => {
                if (err) {
                    log.error('getConnection err:', err);
                    resolve();
                    throw new Error(err);
                }
                log.info('got connection from pool');
                new_connection.query = queryCallbackToQueryPromise(new_connection);
                resolve(new_connection);
            });
        });
    }

    static addQuery(arr) {
        if (!Array.isArray(arr)) {
            log.warn('the first param execpted an array');
            return;
        }
        const queryArgs = [];
        for (let i = 1; i < arguments.length; i++) {
            queryArgs.push(arguments[i]);
        }
        arr.push(queryArgs);
    }

    async exec(arr) {
        if (!Array.isArray(arr)) {
            log.info('exec params execpted an array');
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            const queryArgs = arr[i];
            await this.query.apply(this, queryArgs);
        }
        return 'ok';
    }

    getCountUsedConnections() {
        return (this.pool._allConnections.length - this.pool._freeConnections.length);
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.pool.end((err) => {
                resolve();
                if (err) reject(err);
            });
        });
    }

   static addTime(interval) {
        return `NOW() + INTERVAL ${interval}`;
    }

    static getNow() {
        return 'NOW()';
    }

    static getFromUnixTime(ts) {
        return `FROM_UNIXTIME(${ts})`;
    }

    static getRandom() {
        return 'RAND()';
    }

    static forceIndex(index) {
        return `FORCE INDEX (${index})`;
    }

    static dropTemporaryTable(table) {
        return `DROP TEMPORARY TABLE IF EXISTS ${table}`;
    }

    static getIgnore() {
        return 'IGNORE';
    }

    static getUnixTimestamp(date) {
        return `UNIX_TIMESTAMP(${date})`;
    }
}

module.exports = {
    DataBase,
};
