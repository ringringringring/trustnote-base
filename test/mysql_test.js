'use strict'

var db = require('../db/db');

async function test () {
   let ret =  await db.query("select * from addresses where address=?", ['wuwei']);
   console.log(ret);

   // let arr = [];
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['zhangsan']);
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['lisi'])
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['22222'])
   // db.addQuery(arr, "insert into addresses ( address ) values (?)", ['333333'])

   // let ok = await db.exec(arr);
   // console.log(ok);

   let arr = [];
   db.addQuery(arr, "delete from addresses where address=?", ['zhangsan']);
   db.addQuery(arr, "delete from addresses where address=?", ['lisi'])
   db.addQuery(arr, "delete from addresses where address=?", ['22222'])
   db.addQuery(arr, "delete from addresses where address=?", ['333333'])

   let ok = await db.exec(arr);
   console.log(ok);

   let ret2 =  await db.query("select * from addresses");
   console.log(ret2);

}

test();
























