/*
let conf = require('../../config/conf')
let db = require('../../db/db')
let assert = require('assert')

let dbInstance=null

describe("DB suite:" , function() {
    describe('test db query method', function() {

        before(function() {
            dbInstance = new db.DataBase(conf.databaseReader)
        })

        after(function() {
        })
      it('query for select test',  function(done){
        const ret = dbInstance.query('select * from units')
        ret.then(function(value){
           assert.notEqual(value,null,'test passed')
           done()
        })
      })
  })
})
*/
