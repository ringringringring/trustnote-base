/* jslint node: true */

const dagre = require('dagre');
const constant = require('../../config/const');
const readManager = require('./reader/readManager').getInstance();
const log = require('../../common/logger');

class Dag {
    constructor() {
        this.dag = this.initdag();
        this.relationship = new Map();
        this.units = new Map();
        this.stableUnits = [];
        this.archivedJoints = [];
    }

    initdag() {
        const g = new dagre.graphlib.Graph({
            compound: true,
            directed: true,
        });
        return g;
    }

    saveUnitDetail(unit) {
        this.units.set(unit.unit, unit);
    }

    pushStableUnit(unit) {
        this.stableUnits.push(unit.unit);
    }

    pushArchivedJoints(unit) {
        this.archivedJoints.push(unit);
    }

    archivedJoints() {
        return this.archivedJoints;
    }

    setRootUnit(unit) {
        this.__setUnitNode(unit);
    }

    __setUnitNode(unit) {
        this.dag.setNode(unit.unit);
        this.saveUnitDetail(unit);
    }

    addUnit(unit) {
        this.__setUnitNode(unit);
        const relations = [];
        const targets = [];
        for (const parentUnit of unit.parent_units) {
            this.dag.setEdge(unit.unit, parentUnit);
            const relation = { source: unit.unit, target: parentUnit, skip: 1 };
            if (!targets.includes(relation.target)) {
                targets.push(relation.target);
                relations.push(relation);
            }
            const grandfather = (this.relationship.get(parentUnit) || { relations: [], targets: [] }).relations;
            for (const relation of grandfather) {
                const grandfatherRelation = { source: unit.unit, target: relation.target, skip: relation.skip + 1 };
                if (!targets.includes(grandfatherRelation.target)) {
                    targets.push(grandfatherRelation.target);
                    relations.push(grandfatherRelation);
                }
            }
        }
        this.relationship.set(unit.unit, { relations, targets });
    }

    unitDetail(unitHash) {
        return this.units.get(unitHash);
    }

    getRelationship() {
        return this.relationship;
    }

    determineIfIncluded(sourceUnit, targetUnit) {
        const obj = this.relationship.get(sourceUnit);
        const index = obj.targets.indexOf(targetUnit);
        if (index >= 0) {
            log.debug('relation: ', obj.relations[index]);
            return true;
        }
        return false;
    }

    parentUnits(unit) {
        return this.dag.successors(unit.unit);
    }

    childrenUnit(unit) {
        return this.dag.predecessors(unit.unit);
    }

    /*
    * return {Array} tip units
    */
    tipUnits() {
        return this.dag.sources();
    }

    tipUnitsWithGoodSequence() {
       // Todo
    }


    /*
    *
    * reture {Array} ROOT_UNIT
    */
    rootUnit() {
        return this.dag.sinks();
    }
}

const GO_UP_STABLE_UNITS_LENGTH = 10;

let dag = null;
function initDag() {
    if (!dag) {
        dag = new Dag();
    }
    return dag;
}

async function makeUpHashTree(rootUnit) {
    log.debug('rootUnit:', rootUnit);
    dag.setRootUnit(rootUnit);

    const units = await readManager.unitsFromLevel(rootUnit.level);
    // log.debug('makeUpHashTree:  ', units);
    for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        const parentUnits = await readManager.parentUnits(unit);
        unit.parent_units = parentUnits;
        dag.addUnit(unit);
    }
}

async function getInstance() {
    initDag();

    const archivedJoints = await readManager.archivedJoints();
    for (const joint of archivedJoints) {
        dag.pushArchivedJoints(joint);
    }

    const lastStableMci = await readManager.lastStableMCI();
    log.debug('lastStableMci: ', lastStableMci);
    const stableUnits = await readManager.stableUnits(lastStableMci - GO_UP_STABLE_UNITS_LENGTH, lastStableMci);
    // log.debug('stableUnit: ', stableUnits);

    // 已经稳定的单元存储
    for (let i = 0; i < stableUnits.length; i++) {
        const stableUnit = stableUnits[i];
        dag.saveUnitDetail(stableUnit);
        dag.pushStableUnit(stableUnit.unit);
    }

    const rootUnit = await readManager.unitByMCI(lastStableMci);
    await makeUpHashTree(rootUnit);

    return dag;
}


exports.getInstance = getInstance;
