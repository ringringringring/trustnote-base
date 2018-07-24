
const readManager = require('./dag/reader/readManager')
const writerManager = require('./dag/writer/writerManager')
const dag = require('./dag/dag')

const readInst = readManager.getInstance();
const writeInst = writerManager.getInstance();

async function getParentsFromFreeUnits() {
    const dagInst = await dag.getInstance();
    // combine good sequence unit and exclude archived joints 
    const parents= dagInst.tipUnitsWithGoodSequence()
    const archived= dagInst.archivedJoints()
    if (archived && archived.length >0){
        parents = parents.filter ( (unit)=> return archived.index(unit) == -1 );
    }
    
    return parents
}

function ReleaseConnection(conn) {
    conn.release()
}
async function getWriterConnction() {
    const conn = await writeInst.takeConnectionFromPool()
    return conn
}


// test purpose
getParentsFromFreeUnits()
module.exports = {
    getWriterConnction,
    ReleaseConnection,
};
