/* jslint node: true */

const conf = require('../../../config/conf');
const dataBase = require('../db.js');

class WriterManager  {
    constructor (writerConf) {
        this.writer = new dataBase.DataBase(writerConf);
    }

    

}

let instance = null
function getInstance() {
    if (!instance) {
        instance = new WriterManager(conf.databaseWriter);
    }
    return instance;
}



module.exports = {
    getInstance,
};

// async function test(){
//     console.log("start");
//     const inst = getInstance();
//     // const con = await inst.takeConnectionFromPool();
//     // console.log("got con ",con);
//     const ret=await inst.query('select * from addresses');
//     console.log("done",ret);
// }
// test();
