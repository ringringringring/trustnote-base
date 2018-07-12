'use strict'

var ReadManager = require('./readManager');
var WriteManager = require('./writeManager');

const readconfig = {
    max_connections : 30,
    host : 'localhost',
    name : 'trustnote',
    user : 'root',
    password: '123'
}

const writeconfig = {
    max_connections : 30,
    host : 'localhost',
    name : 'trustnote',
    user : 'root',
    password: '123'
}

const readManager =  new ReadManager(readconfig);
const writeManager = new WriteManager(writeconfig);


module.exports = {
    getWalletByWalletId: getWalletByWalletId,
    getUnitByUnitHash: getUnitByUnitHash
}





