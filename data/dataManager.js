const readManager = require('./readManager');
const writerManager = require('./writerManager');
const readInst = readManager.getInstance();
const writeInst = writerManager.getInstance();

async function getAllUnits() {
    const units = await readInst.query('select * from units');
    return units;
}

async function getUnitParentsByUnit (unit) {
    const parentUnits = await readInst.query('select parent_unit from parenthoods where child_unit = ?', [unit])
    return parentUnits;
}

async function getUnitChildrenByUnit (unit) {
    const childrenUnits = await readInst.query('select child_unit from parenthoods where parent_unit = ?', [unit])
    return childrenUnits;
}


async function readHashTreeFromUnit () {
    let list = [];
    let units = await readInst.query('select unit from units where is_stable=1 and is_on_main_chain=1 ORDER BY main_chain_index');
    for ( let i = 1; i < units.length; i ++) {
        let unit = units[i];
        let j = i - 1;
        let parent_unit = units[j];
        let obj = { unit: unit, parent_units: [ parent_unit ] }
        list.push(obj);
    }
    return list.reverse();
}

async function getUnitById(conn, id) {
    const ret = await conn.query(`select * from units where unit = ${id}`);
    return ret;
}

function ReleaseConnection(conn) {
    conn.release();
}
async function getWriterConnction() {
    const conn = await writeInst.takeConnectionFromPool();
    return conn;
}


// test purpose
// getAllUnits();
// addNewAddress('VIFOO3NSQURCHCPNV2TIHYR5E5JETJO9');
module.exports = {
    getAllUnits,
    getWriterConnction,
    ReleaseConnection,
    getUnitById,
    readHashTreeFromUnit
};
