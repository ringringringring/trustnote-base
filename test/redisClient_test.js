
const log = require('../common/logger');
const getRedisClient = require('../redis/redisClient');

async function test () {
    let client = await getRedisClient();
    
    let key = 'test_unit';
    let ret = await client.setKey(key, 'One World One Dream');
    log.info('setKey: ', key ,ret);

    let ret1 = await client.getKey(key)
    console.log('getKey',ret1);

    let ret2 = await client.delKey(key)
    console.log('delKey:',ret2);

    let ret3 = await client.getKey(key)
    console.log('getKey',ret3);
}

test ();


