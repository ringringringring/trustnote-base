
const readManager = require('./dag/reader/readManager');
const writerManager = require('./dag/writer/writerManager');

const readInst = readManager.getInstance();
const writeInst = writerManager.getInstance();

async function getAllUnits() {
    const units = await readInst.query('select * from units');
    return units;
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
};
