'use strict'

const db = require('./db');

class readManager {

    constructor(config) {
        this.db = db; //暂时这样写
        //this.db = new db(config);
    }
    /*
    * 
    */
    getWalletByWalletId (walletId) {


    }

    /*
    *
    */
    getUnitByUnitHash (unithash, needshowkeys) {
        
        
    }


}

module.exports = readManager;
