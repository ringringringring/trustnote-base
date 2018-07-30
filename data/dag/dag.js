/* jslint node: true */

const dagre = require('dagre')
const constant = require('../../config/const')
const dbReader = require('./dbReader').getInstance()
const log = require('../../common/logger')
const getRedisClient = require('../../redis/redisClient')

class Dag {
    constructor() {
        this.dag = this.initdag()
        this.relationship = new Map()
        // this.units = new Map();
        this.stableUnits = []
        this._archivedJoints = []
    }

    initdag() {
        this.funcName = 'DAG'
        const g = new dagre.graphlib.Graph({
            compound: true,
            directed: true,
        })
        return g
    }

    async saveUnitDetail(unit) {
        if (!this.redisClient) {
            this.redisClient = await getRedisClient()
        }
        await this.redisClient.setKey(unit.unit, JSON.stringify(unit))
    }

    pushStableUnit(unit) {
        this.stableUnits.push(unit.unit)
    }

    pushArchivedJoints(unit) {
        this._archivedJoints.push(unit)
    }

    archivedJoints() {
        return this._archivedJoints
    }

    async setRootUnit(unit) {
        await this._setUnitNode(unit)
    }

    async _setUnitNode(unit) {
        this.dag.setNode(unit.unit)
        await this.saveUnitDetail(unit)
    }

    async addUnit(unit) {
        await this._setUnitNode(unit)
        const relations = []
        const targets = []
        unit.parent_units.forEach((parentUnit) => {
            this.dag.setEdge(unit.unit, parentUnit)
            const relation = { source: unit.unit, target: parentUnit, skip: 1 }
            if (!targets.includes(relation.target)) {
                targets.push(relation.target)
                relations.push(relation)
            }
            const grandfathers = (this.relationship.get(parentUnit)
            || { relations: [], targets: [] }).relations
            grandfathers.forEach((relation) => {
                const grandfatherRelation = {
                    source: unit.unit,
                    target: relation.target,
                    skip: relation.skip + 1,
                }
                if (!targets.includes(grandfatherRelation.target)) {
                    targets.push(grandfatherRelation.target)
                    relations.push(grandfatherRelation)
                }
            })
        })
        this.relationship.set(unit.unit, { relations, targets })
    }

    async unitDetail(unitHash) {
        let ret = await this.redisClient.getKey(unitHash)
        ret = JSON.parse(ret)
        return ret
    }

    getRelationship() {
        return this.relationship
    }

    determineIfIncluded(sourceUnit, targetUnit) {
        const obj = this.relationship.get(sourceUnit)
        const index = obj.targets.indexOf(targetUnit)
        if (index >= 0) {
            log.debug('relation: ', obj.relations[index])
            return true
        }
        return false
    }

    parentUnits(unit) {
        return this.dag.successors(unit.unit)
    }

    childrenUnit(unit) {
        return this.dag.predecessors(unit.unit)
    }

    /*
    * return {Array} tip units
    */
    tipUnits() {
        return this.dag.sources()
    }

    async tipUnitsWithGoodSequence() {
        const tipUnits = this.tipUnits()
        const arr = []
        for (const u of tipUnits) {
            const unit = await this.unitDetail(u)
            if (unit.sequence === 'good') {
                arr.push(unit)
            }
        }
        return arr
    }


    /*
    *
    * return {Array} ROOT_UNIT
    */
    rootUnit() {
        return this.dag.sinks()
    }
}

const GO_UP_STABLE_UNITS_LENGTH = 10
let dag = null

async function makeUpHashTree(rootUnit) {
    // log.debug('rootUnit:', rootUnit);
    await dag.setRootUnit(rootUnit)

    const units = await dbReader.unitsFromLevel(rootUnit.level)
    // log.debug('makeUpHashTree:  ', units);
    for (let i = 0; i < units.length; i++) {
        const unit = units[i]
        const parentUnits = await dbReader.parentUnits(unit)
        unit.parent_units = parentUnits
        await dag.addUnit(unit)
    }
}

async function getInstance() {
    if (dag) {
        return dag
    }

    dag = new Dag()

    const archivedJoints = await dbReader.archivedJoints()
    for (const joint of archivedJoints) {
        dag.pushArchivedJoints(joint)
    }

    const lastStableMci = await dbReader.lastStableMCI()
    log.info('lastStableMci: ', lastStableMci)
    const stableUnits = await dbReader.stableUnits(lastStableMci - GO_UP_STABLE_UNITS_LENGTH, lastStableMci)
    // log.debug('stableUnit: ', stableUnits);

    // 已经稳定的单元存储
    for (let i = 0; i < stableUnits.length; i++) {
        const stableUnit = stableUnits[i]
        await dag.saveUnitDetail(stableUnit)
        dag.pushStableUnit(stableUnit.unit)
    }

    const rootUnit = await dbReader.unitByMCI(lastStableMci)
    await makeUpHashTree(rootUnit)

    return dag
}

async function initDagDatabase(lastStableStamp, unstableUnits) {
    const topUnits = []
    unstableUnits.forEach((unit) => {
        if (unit.is_free === 1) topUnits.push(unit)
    })

    function goUpAndAddUnit(cunit) {
        if (cunit === lastStableStamp) return dag.setRootUnit(lastStableStamp)
        if (cunit.is_stable === 1) return undefined
        cunit.parent_units.forEach((unit) => {
            goUpAndAddUnit(unit)
        })
        dag.addUnit(cunit)
        return undefined
    }

    topUnits.forEach(unit => goUpAndAddUnit(unit))
}

exports.getInstance = getInstance
exports.initDagDatabase = initDagDatabase
