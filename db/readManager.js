
/* jslint node: true */

const conf = require('../config/conf')
const dataBase = require('./db.js')

let instance = null
function getInstance() {
    if (!instance) {
        instance = new dataBase.DataBase(conf.databaseReader)
    }
    return instance
}

module.exports = {
    getInstance,
}
// async function test(){
//     console.log("start");
//     const inst = getInstance();
//     const con = await inst.takeConnectionFromPool();
//     console.log("got con ",con);
//     const ret=await inst.query('select * from addresses');
//     console.log("done",ret);
// }
// test();
