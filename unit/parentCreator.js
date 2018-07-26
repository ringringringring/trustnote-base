/* jslint node: true */

const _ = require('lodash')
const dataManager = require('../data/dataManager')



function pickParentUnitsAndLastBall(conn, arrWitnesses, onDone){
	pickParentUnits(conn, arrWitnesses, function(err, arrParentUnits){
		if (err)
			return onDone(err);
		findLastStableMcBall(conn, arrWitnesses, function(err, last_stable_mc_ball, last_stable_mc_ball_unit, last_stable_mc_ball_mci){
			if (err)
				return onDone(err);
			adjustLastStableMcBallAndParents(
				conn, last_stable_mc_ball_unit, arrParentUnits, arrWitnesses, 
				function(last_stable_ball, last_stable_unit, last_stable_mci, arrAdjustedParentUnits){
					trimParentList(conn, arrAdjustedParentUnits, arrWitnesses, function(arrTrimmedParentUnits){
						storage.findWitnessListUnit(conn, arrWitnesses, last_stable_mci, function(witness_list_unit){
							var objFakeUnit = {parent_units: arrTrimmedParentUnits};
							if (witness_list_unit)
								objFakeUnit.witness_list_unit = witness_list_unit;
							storage.determineIfHasWitnessListMutationsAlongMc(conn, objFakeUnit, last_stable_unit, arrWitnesses, function(err){
								if (err)
									return onDone(err); // if first arg is not array, it is error
								onDone(null, arrTrimmedParentUnits, last_stable_ball, last_stable_unit, last_stable_mci);
							});
						});
					});
				}
			);
		});
	});
}

exports.getParentUnitsAndLastBall = getParentUnitsAndLastBall
