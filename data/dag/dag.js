/* jslint node: true */

const dagre = require('dagre');
const constant = require('../../config/const');
const dbReader = require('./dbReader').getInstance();
const log = require('../../common/logger');
const redisClient = require('../../redis/redisClient');

class Dag {
    constructor() {
        this.dag = this.initdag();
        this.relationship = new Map();
        // this.units = new Map();
        this.stableUnits = [];
        this._archivedJoints = [];
    }

    initdag() {
        const g = new dagre.graphlib.Graph({
            compound: true,
            directed: true,
        });
        return g;
    }

    async saveUnitDetail(unit) {
        await redisClient.setKey(unit.unit, JSON.stringify(unit)); 
    }

    pushStableUnit(unit) {
        this.stableUnits.push(unit.unit);
    }

    pushArchivedJoints(unit) {
        this._archivedJoints.push(unit);
    }

    archivedJoints() {
        return this._archivedJoints;
    }

    async setRootUnit(unit) {
        await this._setUnitNode(unit);
    }

    async _setUnitNode(unit) {
        this.dag.setNode(unit.unit);
        await this.saveUnitDetail(unit);
    }

    async addUnit(unit) {
        await this._setUnitNode(unit);
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

    async unitDetail(unitHash) {
        let ret = await redisClient.getKey(unitHash);
        ret = JSON.parse(ret); 
        return ret;
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

    async tipUnitsWithGoodSequence() {
        const tipUnits = this.tipUnits();
        let arr = [];
        for ( let u of tipUnits) {
            let unit =  await this.unitDetail(u);
            if ( unit.sequence === 'good') {
                arr.push (unit)
            } 
        }
        return arr;
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

async function makeUpHashTree(rootUnit) {
    // log.debug('rootUnit:', rootUnit);
    await dag.setRootUnit(rootUnit);

    const units = await dbReader.unitsFromLevel(rootUnit.level);
    // log.debug('makeUpHashTree:  ', units);
    for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        const parentUnits = await dbReader.parentUnits(unit);
        unit.parent_units = parentUnits;
        await dag.addUnit(unit);
    }
}

async function getInstance() {
    if (dag) {
        return dag;
    };

    dag = new Dag();

    const archivedJoints = await dbReader.archivedJoints();
    for (const joint of archivedJoints) {
        dag.pushArchivedJoints(joint);
    }

    const lastStableMci = await dbReader.lastStableMCI();
    log.info('lastStableMci: ', lastStableMci);
    const stableUnits = await dbReader.stableUnits(lastStableMci - GO_UP_STABLE_UNITS_LENGTH, lastStableMci);
    // log.debug('stableUnit: ', stableUnits);

    // 已经稳定的单元存储
    for (let i = 0; i < stableUnits.length; i++) {
        const stableUnit = stableUnits[i];
        await dag.saveUnitDetail(stableUnit);
        dag.pushStableUnit(stableUnit.unit);
    }

    const rootUnit = await dbReader.unitByMCI(lastStableMci);
    await makeUpHashTree(rootUnit);

    return dag;
}


exports.getInstance = getInstance;
