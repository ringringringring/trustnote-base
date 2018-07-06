'use strict'

var db = require('../db/db');
const log = require('../common/logger');

async function test () {
   let ret =  await db.query("select * from addresses where address=?", ['wuwei']);
   log.info(ret);

   // let arr = [];
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['zhangsan']);
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['lisi'])
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['22222'])
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['333333'])

   // let ok = await db.exec(arr);
   // console.log(ok);


   /*
   let arr = [];
   db.addQuery(arr, "delete from addresses where address=?", ['zhangsan']);
   db.addQuery(arr, "delete from addresses where address=?", ['lisi'])
   db.addQuery(arr, "delete from addresses where address=?", ['22222'])
   db.addQuery(arr, "delete from addresses where address=?", ['333333'])

   let ok = await db.exec(arr);
   console.log(ok);
   */
   let ret2 =  await db.query("select * from addresses"); 
   log.info(ret2);
   
   async function doWork (conn) {
        let ret2 =  await db.query("insert into addresses ( address ) values (?)",  ['zhangsan1111'] , conn);
   }    

   await db.executeInTransaction(doWork);

   let ret3 =  await db.query("select * from addresses");
   log.info(ret3);
   
}

test();

