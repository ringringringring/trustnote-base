/* jslint node: true */

const dagre = require('dagre');
const constant = require('../../config/consts');
const dbReader = require('./dbReader').getInstance();
const log = require('../../common/logger');
const getRedisClient = require('../../redis/redisClient');

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
        if (!this.redisClient) {
            this.redisClient = await getRedisClient();
        }
        await this.redisClient.setKey(unit.unit, JSON.stringify(unit)); 
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

    // async setRootUnit(unit) {
    //     await this._setUnitNode(unit);
    // }

    async setUnitNode(unit) {
        this.dag.setNode(unit.unit);
        // await this.saveUnitDetail(unit);
    }

    setEdge (sourceUnit, targetUnit) {
        this.dag.setEdge(sourceUnit, targetUnit);
    }

    async addUnit(unit) {
        await this._setUnitNode(unit);
        const relations = [];
        const targets = [];
        for (const parentUnit of unit.parent_units) {
            this.dag.setEdge(unit.unit, parentUnit);
            const relation = { source: unit.unit, target: parentUnit, step: 1 };
            if (!targets.includes(relation.target)) {
                targets.push(relation.target);
                relations.push(relation);
            }
            const grandfather = (this.relationship.get(parentUnit) || { relations: [], targets: [] }).relations;
            for (const relation of grandfather) {
                const grandfatherRelation = { source: unit.unit, target: relation.target, step: relation.step + 1 };
                if (!targets.includes(grandfatherRelation.target)) {
                    targets.push(grandfatherRelation.target);
                    relations.push(grandfatherRelation);
                }
            }
        }
        this.relationship.set(unit.unit, { relations, targets });
    }




    async unitDetail(unitHash) {
        let ret = await this.redisClient.getKey(unitHash);
        ret = JSON.parse(ret); 
        return ret;
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


async function makeUpHashTree(nodeUnits) {
    let unitSet = new Set();
    for ( let unit of nodeUnits ) {
        let children = await dbReader.childrenUnits(unit);
        if (children.length === 0) {
            return;
        }

        for ( let child of children) {
            dag.setUnitNode(child);
            dag.setEdge(child.unit, unit);

            const parentUnits = await dbReader.parentUnits(child.unit);
            const relations = [];
            const targets = [];
            for (const parentUnit of parentUnits) {
                const relation = { source: child.unit, target: parentUnit.unit, step: 1 };
                if (!targets.includes(relation.target)) {
                    targets.push(relation.target);
                    relations.push(relation);
                }
                const grandfather = (dag.relationship.get(parentUnit.unit) || { relations: [], targets: [] }).relations;
                for (const relation of grandfather) {
                    const grandfatherRelation = { source: child.unit, target: relation.target, step: relation.step + 1 };
                    if (!targets.includes(grandfatherRelation.target)) {
                        targets.push(grandfatherRelation.target);
                        relations.push(grandfatherRelation);
                    }
                }
            }
            dag.relationship.set(child.unit, { relations, targets });

            let child_children = await dbReader.childrenUnits(child.unit);

            for ( let child_child of child_children ) {
                unitSet.add(child_child.unit);
            }
        }    
    }
    await makeUpHashTree(arr);
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
    log.debug('stableUnit: ', stableUnits);

    // 已经稳定的单元存储
    for (let i = 0; i < stableUnits.length; i++) {
        const stableUnit = stableUnits[i];
        await dag.saveUnitDetail(stableUnit);
        dag.pushStableUnit(stableUnit.unit);
    }

    const rootUnit = await dbReader.unitByMCI(lastStableMci);
    await makeUpHashTree([rootUnit.unit]);

    console.log('unitSet:---', unitSet.size);

    return dag;
}


exports.getInstance = getInstance;
