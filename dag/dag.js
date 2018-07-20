/* jslint node: true */

const constant = require('../config/const');
const dagre = require('dagre');


class Dag {
    constructor (GENESIS_UNIT) {
        if (!this.dag) {
            this.level = new Map();
            this.dag = this.initdag();
            // this.setGenesisUnit(GENESIS_UNIT);
        }
    }

    initdag() {
        const g = new dagre.graphlib.Graph({
            compound: true,
            directed: true
        })
        return g
    }

    setGenesisUnit(unit) {
        this.dag.setNode(unit.unit, unit);
        this.level.set(unit.unit, { unitlevel: 0 });
    }

    addUnit(unit) {
        this.dag.setNode(unit.unit, unit);
        let levels = [];
        for ( let parentUnit of unit.parents ) {
            this.dag.setEdge(unit.unit, parentUnit);  
            // let level = this.level.get(parentUnit);
            // levels.push(level.unitlevel);
        }
        // //其父单元中最大的单元level
        // let maxlevel = Math.max(...levels);
        // this.level.set(unit.unit, { unitlevel: maxlevel + 1});
    }

    levelInfo (unit) {
        return this.level.get(unit.unit);
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
    * reture {Array} GENESIS_UNIT
    */
    genesisUnit () {
        return this.dag.sinks();
    }

}

let dag = null;
function getInstance () {
    if (!dag) {
        dag = new Dag();
    }
    return dag;
}

exports.getInstance = getInstance;

