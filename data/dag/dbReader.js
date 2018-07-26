/* jslint node: true */

const conf = require('../../config/conf');
const dataBase = require('./db.js');

class ReadManager {
    constructor(readerConf) {
        this.reader = new dataBase.DataBase(readerConf);
    }

    async lastStableMCI() {
        const mci = await this.reader.query('SELECT max(main_chain_index) as mci FROM units where is_on_main_chain =1 and is_stable=1;');
        if (mci.length === 1) {
            return mci[0].mci;
        }
    }

    async lastStableUnit() {
        const mci = await this.lastStableMCI();
        const unit = await this.unitByMCI(mci);
        return unit;
    }

    async stableUnits(fromMci, toMci) {
        const units = await this.reader.query('SELECT * FROM units where is_on_main_chain =1 and is_stable=1 and main_chain_index >= ? and main_chain_index < ? order by main_chain_index', [fromMci, toMci]);
        return units;
    }

    async unitByMCI(mci) {
        const units = await this.reader.query('SELECT * from units where is_on_main_chain =1 and is_stable=1 and main_chain_index = ?;', [mci]);
        if (units.length === 1) {
            return units[0];
        }
    }

    async childrenUnits (unit) {
        const children = await this.reader.query('SELECT child_unit from parenthoods where parent_unit = ?', [unit.unit]);
        let units = [];
        for (const u of children) {
            const c = await this.reader.query('select * from units where unit = ?', [u.child_unit]);
            units = [...units, ...c];
        }
        return units;
    }

    async unitsFromLevel(level) {
        const units = await this.reader.query('select * from units where level > ? order by level', [level]);
        return units;
    }

    async parentUnits(unit) {
        const units = await this.reader.query('select parent_unit from parenthoods where child_unit = ?', [unit.unit]);
        const arr = [];
        for (const unit of units) {
            arr.push(unit.parent_unit);
        }
        return arr;
    }

    async archivedJoints() {
        const units = await this.reader.query('select unit from archived_joints');
        const arr = [];
        for (const unit of units) {
            arr.push(unit.unit);
        }
        return arr;
    }
}
/*
async function getUnitParentsByUnit(unit) {
    const parentUnits = await readInst.query('select parent_unit from parenthoods where child_unit = ?', [unit]);
    return parentUnits;
}

async function getUnitChildrenByUnit(unit) {
    const childrenUnits = await readInst.query('select child_unit from parenthoods where parent_unit = ?', [unit]);
    return childrenUnits;
}

async function getUnitById(conn, id) {
    const ret = await conn.query(`select * from units where unit = ${id}`);
    return ret;
}
*/

let instance = null;
function getInstance() {
    if (!instance) {
        instance = new ReadManager(conf.databaseReader);
    }
    return instance;
}

module.exports = {
    getInstance,
};
