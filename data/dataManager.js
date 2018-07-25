
const dag = require('./dag/dag');

async function getParentsFromFreeUnits() {
    const dagInstance = await dag.getInstance()
    // combine good sequence unit and exclude archived joints
    let parents = dagInstance.tipUnitsWithGoodSequence()
    const archived = dagInstance.archivedJoints()
    if (archived && archived.length > 0) {
        parents = parents.filter(unit => archived.index(unit) === -1);
    }

    return parents
}

async function getLastStableMcBall() {
    return null
}

async function readStaticUnitProps(unit) {
    return null
}

// conn.query("SELECT unit, is_free, main_chain_index FROM units WHERE unit IN(?)", [arrAltBranchRootUnits]
async function readStaticUnitsProps(units) {
    return null
}

async function readPropsOfUnits(earlierUnit, arrLaterUnits) {
    return null
}

async function readBestChildrenByBestParentUnit(bestParentUnit) {
    return null
}

async function readAttestorsOfUnit(unit) {
    return null
}

// graph.determineIfIncludedOrEqual(conn, row.unit, arrLaterUnits, function(bIncluded){
async function determineIfIncludedOrEqual(unit, arrLaterUnits) { 
    return null
}

// 	"SELECT witnessed_level, address \n\
// FROM units \n\
// CROSS JOIN unit_authors USING(unit) \n\
// WHERE unit IN("+arrBestChildren.map(db.escape).join(', ')+") AND address IN(?) \n\
// ORDER BY witnessed_level DESC",
async function getMinMcAttestorLevelByBestChildren(arrBestChildren) {
    retrun null
}

// SELECT MAX(units.level) AS max_alt_level \n\
// FROM units \n\
// CROSS JOIN units AS bpunits \n\
//     ON units.best_parent_unit=bpunits.unit AND bpunits.witnessed_level < units.witnessed_level \n\
// WHERE units.unit IN("+arrAltBestChildren.map(db.escape).join(', ')+")",
async function getMaxAltLevelByBestChildren(arrBestChildren) {
    retrun null
}



// test purpose
// getParentsFromFreeUnits()
module.exports = {
    getParentsFromFreeUnits,
}
