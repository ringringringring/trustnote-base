
const dag = require('../../data/dag/dag');
const log = require('../../common/logger');

async function test () {
    let dagInst = await dag.getInstance();

    let ret = dagInst.determineIfIncluded('XIp/6HIyl2QsbgnBcr9IBXM90LKoFUGDhyrS5+i3hhs=', 'vPgT4iHDDocSH73ph77IEXqPxJdeRWdFWHbrOWNiIvM=');
    log.info('ret: ', ret);
    
    let c = dagInst.unitDetail('XIp/6HIyl2QsbgnBcr9IBXM90LKoFUGDhyrS5+i3hhs=')
    log.info('detail: ', c);
    
    let tipUnitsWithGoodSequence = dagInst.tipUnitsWithGoodSequence();

    console.log('tipUnitsWithGoodSequence: ', tipUnitsWithGoodSequence ); 

    /*
    console.log('now tips unit:', dag.tipUnits());
    
    let ships = dagInst.getRelationship();
    console.log('getRelationship: ')
    ships.forEach(function (value, key) {
        console.log('\nkey:', key)
        console.log('value:\n', value)
    })

    let units = [
        { unit: '1', parent_units: ['0'] },
        { unit: '2', parent_units: ['1'] },
        
        //广播过来一个unit: 3 , parent 1
        { unit: '3', parent_units: ['1'] },

        { unit: '4', parent_units: ['2', '3'] },
        { unit: '5', parent_units: ['4']},
        { unit: '6', parent_units: ['4']},
        { unit: '7', parent_units: ['5','6']},
        { unit: '8', parent_units: ['5','6']},

        { unit: '9', parent_units: ['7','8']},

        { unit: '10', parent_units: ['9']},
        { unit: '11', parent_units: ['9']},
        { unit: '12', parent_units: ['10','11']}
    ];

    for (let i = 0; i < units.length; i++) {
        let unit = units[i];
        dag.addUnit(unit);
        console.log('add unit:', unit.unit,', now tips unit:', dag.tipUnits());
    }

    let unit_7 = { unit: '7' , parent_units: ['5', '6']};
    let ret7 = dag.parentUnits(unit_7);
    console.log(ret7);

    let ret7_1 = dag.childrenUnit(unit_7);
    console.log(ret7_1);

    let ships = dag.getRelationship();
    console.log('getRelationship: ')

    ships.forEach(function (value, key) {
        console.log('\nkey:', key)
        console.log('value:\n', value)
    })
    */
    // let levelInfo = dag.levelInfo(unit_7);
    // console.log('7----', levelInfo);

    // let levelInfo2 = dag.levelInfo({ unit: '12', parents: ['10', '11']});
    // console.log('12----', levelInfo2);

}

test();
















