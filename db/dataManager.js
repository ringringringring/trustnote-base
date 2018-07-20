const readManager = require('./readManager');
const writerManager = require('./writerManager');

async function getAllUnits() {
    const inst = readManager.getInstance()
    const units = await inst.query('select * from units')
    return units
}

async function getUnitById(conn, id) {
    const ret = await conn.query(`select * from units where unit = ${id}`)
    return ret
}

function ReleaseConnection(conn) {
    conn.release()
}
async function getWriterConnction() {
    const inst = writerManager.getInstance()
    const conn = await inst.takeConnectionFromPool()
    return conn
}


// test purpose
// getAllUnits();
// addNewAddress('VIFOO3NSQURCHCPNV2TIHYR5E5JETJO9');
module.exports = {
    getAllUnits,
    getWriterConnction,
    ReleaseConnection,
    getUnitById,
}
