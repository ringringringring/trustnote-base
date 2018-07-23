
const GENESIS_UNIT = { unit:'0' , level: 0 };
const dag = require('../../dag/dag').getInstance(GENESIS_UNIT);


function test () {
    console.log('now tips unit:', dag.tipUnits());
    
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


    // let levelInfo = dag.levelInfo(unit_7);
    // console.log('7----', levelInfo);

    // let levelInfo2 = dag.levelInfo({ unit: '12', parents: ['10', '11']});
    // console.log('12----', levelInfo2);

}

test();
















