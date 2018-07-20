/* jslint node: true */

const constant = require('../config/const');
const dagre = require('dagre');


class Dag {
    constructor (ROOT_UNIT) {
        if (!this.dag) {
            this.dag = this.initdag();
            this.setRootUnit(ROOT_UNIT);
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
        for ( let parentUnit of unit.parent_units ) {
            this.dag.setEdge(unit.unit, parentUnit);  
        }
    }

    unit (unit) {
        return this.dag.node(unit.unit);
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
function getInstance () {
    if (!dag) {
        dag = new Dag();
    }
    return dag;
}

exports.getInstance = getInstance;

