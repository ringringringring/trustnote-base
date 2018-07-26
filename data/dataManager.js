
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
    const dagInstance = await dag.getInstance()
    // const lastBall= dagInstance.
    // const {lastStableMcBall, lastStableMcBallUnit, lastStableMcBallMci} = dagInstance.get
    return null
}

async function readStaticUnitProps(unit) {
    const dagInstance = await dag.getInstance()
    return dagInstance.unitDetail(unit)
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
async function determineIfIncludedOrEqual(earlierUnit, arrLaterUnits) {
    const dagInstance = await dag.getInstance()
    const includes = arrLaterUnits.filter( (unit) => unit == earlierUnit || dagInstance.determineIfIncluded(unit, earlierUnit))

    return includes.length > 0
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


// is_stable=0 condition is redundant given that last_ball_mci is stable
// "SELECT 1 FROM units CROSS JOIN unit_authors USING(unit) \n\
// WHERE  (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) AND definition_chash IS NOT NULL \n\
// UNION \n\
// SELECT 1 FROM units JOIN address_definition_changes USING(unit) \n\
// WHERE (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) \n\
// UNION \n\
// SELECT 1 FROM units CROSS JOIN unit_authors USING(unit) \n\
// WHERE (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) AND sequence!='good'", 
// [last_ball_mci, arrFromAddresses, last_ball_mci, arrFromAddresses, last_ball_mci, arrFromAddresses],
async function getUnstablePredecessorsByAddresses(arrFromAddresses, lastBallMci) {

    retrun null
}

async function isGenesisUnit(unit) {

    retrun true
}


// test purpose
// getParentsFromFreeUnits()
module.exports = {
    getParentsFromFreeUnits,
}
