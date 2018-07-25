/* jslint node: true */

const log = require('../common/logger');
const redis = require("redis");
const client = redis.createClient();

let redisReady = null;
client.on("error", function (err) {
    log.error("Error " + err);
});

client.on("ready", () => {
    log.info('redis client is ready');
    redisReady = true;
});

const {promisify} = require('util');

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);


client.setKey = function (key, value ) {
    return new Promise( async (resolve, reject) => { 
         try {
             let ret = await setAsync(key, value);
             resolve(ret);
         } catch (err) {
             log.error(`setKey err: ${key}`, err);
             reject(err);
         }
    })
}


client.getKey = function (key) {
    return new Promise( async (resolve, reject) => { 
         try {
             let ret = await getAsync(key);
             resolve(ret);
         } catch (err) {
             log.error(`getKey err: ${key}`, err);
             reject(err);
         }
    })
}


client.delKey = function (key) {
    return new Promise( async (resolve, reject) => { 
         try {
             let ret = await delAsync(key);
             resolve(ret);
         } catch (err) {
             log.error(`clearKey err: ${key}`, err);
             reject(err);
         }
    })
}

function getRedisClient ()  {
    return new Promise((resolve,reject) => {
            if (redisReady) {
                return resolve(client);
            }
            client.on("error", function (err) {
                log.error("Error " + err);
                log.error('encounter an error connecting to the Redis server, Make sure you turn on it');
                redisReady = false;
                reject(err);
            });

            client.on("ready", () => {
                log.info('redis client is ready');
                redisReady = true;
                resolve(client);
            });
        })
}

module.exports = getRedisClient 

