/* jslint node: true */

const constant = require('../config/const');
const dagre = require('dagre');
const dataManager = require('../db/dataManager');

class Dag {
    constructor (ROOT_UNIT) {
        if (!this.dag) {
            this.dag = this.initdag();
            this.relationship =  new Map();
            // this.setRootUnit(ROOT_UNIT);
        }
    }

    initdag() {
        const g = new dagre.graphlib.Graph({
            compound: true,
            directed: true
        })
        return g
    }

    setRootUnit(unit) {
        this.dag.setNode(unit.unit, unit);
    }

    addUnit(unit) {
        this.dag.setNode(unit.unit, unit);
        let relations = [];
        let tempTarget = [];
        for ( let parentUnit of unit.parent_units ) {
            this.dag.setEdge(unit.unit, parentUnit); 
            const relation = { source: unit.unit,  target: parentUnit,  skip: 1 };
            if (!tempTarget.includes(relation.target)) {
                tempTarget.push(relation.target);
                relations.push(relation);
            }
            const grandfather = this.relationship.get(parentUnit) || [];
            for ( let relation of grandfather ) {
                const grandfatherRelation = { source: unit.unit, target: relation.target, skip: relation.skip + 1 }
                if (!tempTarget.includes(grandfatherRelation.target)) {
                    tempTarget.push(grandfatherRelation.target);
                    relations.push(grandfatherRelation);
                }
            }
        }
        this.relationship.set(unit.unit, relations);
    }

    unit (unit) {
        return this.dag.node(unit.unit);
    }

    getRelationship () {
        return this.relationship
    }

    determineIfIncluded (sourceUnit, targetUnit) {
        // if (  )
    }

    parentUnits (unit) {
        return this.dag.successors(unit.unit);
    }

    childrenUnit (unit) {
        return this.dag.predecessors(unit.unit);
    }

    /*
    * return {Array} tip units
    */
    tipUnits () {
        return this.dag.sources()
    }

    /*
    *
    * reture {Array} ROOT_UNIT
    */
    rootUnit () {
        return this.dag.sinks();
    }

}

let dag = null;
async function getInstance (ROOT_UNIT) {
    if (!dag) {
        dag = new Dag();
    }
    let units = await dataManager.readHashTreeFromUnit();
    for ( let unit of units ) {
        dag.addUnit(unit);
    }
    return dag;
}

exports.getInstance = getInstance;

