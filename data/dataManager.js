
const dag = require('./dag/dag');

async function getParentsFromFreeUnits() {
    const dagInstance = await dag.getInstance();
    // combine good sequence unit and exclude archived joints
    let parents = dagInstance.tipUnitsWithGoodSequence();
    const archived = dagInstance.archivedJoints();
    if (archived && archived.length > 0) {
        parents = parents.filter(unit => archived.index(unit) === -1);
    }

    return parents;
}


// test purpose
// getParentsFromFreeUnits()
module.exports = {
    getParentsFromFreeUnits,
};
