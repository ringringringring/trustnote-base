const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const writerManager = require('./writerManager')

async function connectSqliteDB() {
    const file = path.resolve(__dirname, '../db/SqliteData/trustnote.sqlite')
    const db = new sqlite3.Database(file, sqlite3.OPEN_READONLY, ((err) => {
        if (err) { console.log(err) }
    }))

    const inst = writerManager.getInstance()
    const mysql = await inst.takeConnectionFromPool()
    // const units = await db.all('select * from units')
    db.all('select * from units', async function (err, rows){
        if (err) {
            console.log(err)
            return
        }

        for (const row of rows) {
            const fields = `unit, version, alt, round_index, last_ball_unit, sequence, content_hash, main_chain_index, creation_date,is_on_main_chain,
                             latest_included_mc_index,is_stable,level,attestor_level,best_parent_unit`
            const sql =  `insert into units (${fields}) values ( \'${row.unit}\',  ${row.version},  ${row.alt},  ${0}, ${row.last_ball_unit}, 
                 \'${row.sequence}\', ${row.content_hash}, ${row.main_chain_index}, \'${row.creation_date}\', ${row.is_on_main_chain}, 
                 ${row.latest_included_mc_index}, ${row.is_stable}, ${row.level}, ${row.witnessed_level}, ${row.best_parent_unit})`
            const ret = await mysql.query(sql)

            console.log(ret)
        }
        // console.log(rows[0].unit)
    })
    // console.log(units[0].unit)
}


async function writeUnits(rows) {
    rows.forEach((row) => {


    })
}
connectSqliteDB()
