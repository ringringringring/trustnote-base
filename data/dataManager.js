
const readManager = require('./dag/reader/readManager');
const writerManager = require('./dag/writer/writerManager');
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
