const readManager = require('./readManager')
const writerManager = require('./writerManager')

async function getAllUnits() {
    const inst = readManager.getInstance();
    const units = await inst.query('select * from units');
    return units;
}

async function addNewAddress(addr) {
    const inst = writerManager.getInstance();
    const units = await inst.query(`insert into addresses (address) value (${addr})`);
    return units;
}

// test purpose
//getAllUnits();
//addNewAddress('VIFOO3NSQURCHCPNV2TIHYR5E5JETJO9');
module.exports = {
    getAllUnits,
    addNewAddress,
}
