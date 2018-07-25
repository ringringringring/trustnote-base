/* jslint node: true */

const crypto = require('crypto')
// const async = require('async')
const _ = require('lodash')
const db = require('../db/db.js')
const consts = require('../config/consts.js')
const logger = require('../common/logger')
// const objectHash = require('./object_hash.js')
// const objectLength = require('./object_length.js')
// const ecdsaSig = require('./signature.js')
const mutex = require('../common/mutex.js')
// const storage = require('./storage.js')
// const myWitnesses = require('./my_witnesses.js')
// const parentComposer = require('./parent_composer.js')
// const validation = require('./validation.js')
// const writer = require('./writer.js')
// const conf = require('./conf.js')
// const profiler = require('./profiler.js')
// const inputs = require('./inputs.js')

const hashPlaceholder = '--------------------------------------------' // 256 bits (32 bytes) base64: 44 bytes
const sigPlaceholder = '----------------------------------------------------------------------------------------' // 88 bytes


let bGenesis = false
exports.setGenesis = function (_bGenesis) { bGenesis = _bGenesis }


function repeatString(str, times) {
    if (str.repeat) { return str.repeat(times) }
    return (new Array(times + 1)).join(str)
}

function sortOutputs(a, b) {
    const addr_comparison = a.address.localeCompare(b.address)
    return addr_comparison || (a.amount - b.amount)
}

function createJoint(params) {
    // try to use as few paying_addresses as possible.
    // Assuming paying_addresses are sorted such that the most well-funded addresses come first
    if (params.minimal && !params.send_all) {
        const callbacks = params.callbacks
        const arrCandidatePayingAddresses = params.paying_addresses

        const trySubset = (count) => {
            if (count > consts.MAX_AUTHORS_PER_UNIT) {
                return callbacks.ifNotEnoughFunds('Too many authors.  Consider splitting the payment into two units.')
            }
            const tryParams = _.clone(params)
            delete tryParams.minimal
            tryParams.paying_addresses = arrCandidatePayingAddresses.slice(0, count)
            tryParams.callbacks = {
                ifOk: callbacks.ifOk,
                ifError: callbacks.ifError,
                ifNotEnoughFunds(errorMessage) {
                    if (count === arrCandidatePayingAddresses.length) return callbacks.ifNotEnoughFunds(errorMessage)
                    trySubset(count + 1) // add one more paying address
                },
            }
            createJoint(tryParams)
        }

        return trySubset(1)
    }

    const arrSigningAddresses = params.signing_addresses || []
    const arrPayingAddresses = params.paying_addresses || []
    const arrOutputs = params.outputs || []
    const arrMessages = _.clone(params.messages || [])
    const assocPrivatePayloads = params.private_payloads || {} // those that correspond to a subset of params.messages
    const fnRetrieveMessages = params.retrieveMessages
    const signer = params.signer
    const callbacks = params.callbacks

    const arrChangeOutputs = arrOutputs.filter(output => (output.amount === 0))
    const arrExternalOutputs = arrOutputs.filter(output => (output.amount > 0))
    if (arrChangeOutputs.length > 1) { throw Error('more than one change output') }
    if (arrChangeOutputs.length === 0) { throw Error('no change outputs') }

    if (arrPayingAddresses.length === 0) { throw Error('no payers?') }
    const arrFromAddresses = _.union(arrSigningAddresses, arrPayingAddresses).sort()

    const objPaymentMessage = {
        app: 'payment',
        payload_location: 'inline',
        payload_hash: hashPlaceholder,
        payload: {
            // first output is the change, it has 0 amount (placeholder) that we'll modify later.
            // Then we'll sort outputs, so the change is not necessarity the first in the final transaction
            outputs: arrChangeOutputs,
            // we'll add more outputs below
        },
    }
    let totalAmount = 0
    arrExternalOutputs.forEach((output) => {
        objPaymentMessage.payload.outputs.push(output)
        totalAmount += output.amount
    })
    arrMessages.push(objPaymentMessage)

    const bMultiAuthored = (arrFromAddresses.length > 1)
    const objUnit = {
        version: consts.version,
        alt: consts.alt,
        // timestamp: Date.now(),
        messages: arrMessages,
        authors: [],
    }
    const objJoint = { unit: objUnit }

    let totalInput
    let lastBallMci
    const assocSigningPaths = {}
    let unlockCallback
    let conn
    let lightProps

    const handleError = (err) => {
        // profiler.stop('compose');
        unlockCallback()
        if (typeof err === 'object') {
            if (err.error_code === 'NOT_ENOUGH_FUNDS') { return callbacks.ifNotEnoughFunds(err.error) }
            throw Error(`unknown error code in: ${JSON.stringify(err)}`)
        }
        callbacks.ifError(err)
    }

    async function lockAddress() {
        await mutex.lock(arrFromAddresses.map((fromAddress) => `c-${fromAddress}`),
        (unlock) => {
            unlockCallback = unlock
        })
    }

    async function startTransaction() { // start transaction
        await db.takeConnectionFromPool((newConn) => {
            conn = newConn
            conn.query('BEGIN', () => {})
        })
    }

    async function createParents() { // parent units
        if (bGenesis) { return }

        function checkForUnstablePredecessors() {
            conn.query(
                // is_stable=0 condition is redundant given that lastBallMci is stable
                'SELECT 1 FROM units CROSS JOIN unit_authors USING(unit) \n\
                WHERE  (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) AND definition_chash IS NOT NULL \n\
                UNION \n\
                SELECT 1 FROM units JOIN address_definition_changes USING(unit) \n\
                WHERE (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) \n\
                UNION \n\
                SELECT 1 FROM units CROSS JOIN unit_authors USING(unit) \n\
                WHERE (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) AND sequence!=\'good\'',
                [lastBallMci, arrFromAddresses, lastBallMci, arrFromAddresses, lastBallMci, arrFromAddresses],
                (rows) => {
                    if (rows.length > 0) {return cb("some definition changes or definitions or nonserials are not stable yet");}
                    cb()
                },
            )
        }

        parentComposer.pickParentUnitsAndLastBall(
            conn,
            arrWitnesses,
            (err, arrParentUnits, last_stable_mc_ball, last_stable_mc_ball_unit, last_stable_mc_ball_mci) => {
                if (err) {return cb("unable to find parents: "+err);}
                objUnit.parent_units = arrParentUnits
                objUnit.last_ball = last_stable_mc_ball
                objUnit.last_ball_unit = last_stable_mc_ball_unit
                lastBallMci = last_stable_mc_ball_mci
                checkForUnstablePredecessors()
            },
        )
    }

    async function createAuthors() { // authors
        async.eachSeries(arrFromAddresses, (from_address, cb2) => {

            function setDefinition() {
                signer.readDefinition(conn, from_address, (err, arrDefinition) => {
                    if (err)
                        return cb2(err);
                    objAuthor.definition = arrDefinition;
                    cb2();
                })
            }

            let objAuthor = {
                address: from_address,
                authentifiers: {},
            }
            signer.readSigningPaths(conn, from_address, (assocLengthsBySigningPaths) => {
                const arrSigningPaths = Object.keys(assocLengthsBySigningPaths);
                assocSigningPaths[from_address] = arrSigningPaths;
                for (let j = 0; j < arrSigningPaths.length; j++) {
                    objAuthor.authentifiers[arrSigningPaths[j]] = repeatString('-', assocLengthsBySigningPaths[arrSigningPaths[j]]);
                }
                objUnit.authors.push(objAuthor);
                conn.query(
                    "SELECT 1 FROM unit_authors CROSS JOIN units USING(unit) \n\
                    WHERE address=? AND is_stable=1 AND sequence='good' AND main_chain_index<=? \n\
                    LIMIT 1",
                    [from_address, lastBallMci],
                    function(rows){
                        if (rows.length === 0) // first message from this address
                            return setDefinition();
                        // try to find last stable change of definition, then check if the definition was already disclosed
                        conn.query(
                            "SELECT definition \n\
                            FROM address_definition_changes CROSS JOIN units USING(unit) LEFT JOIN definitions USING(definition_chash) \n\
                            WHERE address=? AND is_stable=1 AND sequence='good' AND main_chain_index<=? \n\
                            ORDER BY level DESC LIMIT 1",
                            [from_address, lastBallMci],
                            function(rows){
                                if (rows.length === 0) // no definition changes at all
                                    return cb2();
                                let row = rows[0];
                                row.definition ? cb2() : setDefinition(); // if definition not found in the db, add it into the json
                            }
                        );
                    }
                );
            })
        }, cb)
    }

    (async () => {
        console.time('test')

        await lockAddress()
        await startTransaction()

        console.timeEnd('test')
    })()

    // async.series([
    //     function (cb) { // lock
    //         mutex.lock(arrFromAddresses.map((from_address) => { return 'c-'+from_address; }), (unlock) => {
    //             unlockCallback = unlock;
    //             cb();
    //         })
    //     },
    //     function (cb) { // start transaction
    //         db.takeConnectionFromPool((new_conn) => {
    //             conn = new_conn;
    //             conn.query("BEGIN", function(){cb();});
    //         })
    //     },
    //     function (cb) { // parent units
    //         if (bGenesis) {return cb();}

    //         function checkForUnstablePredecessors() {
    //             conn.query(
    //                 // is_stable=0 condition is redundant given that lastBallMci is stable
    //                 'SELECT 1 FROM units CROSS JOIN unit_authors USING(unit) \n\
    //                 WHERE  (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) AND definition_chash IS NOT NULL \n\
    //                 UNION \n\
    //                 SELECT 1 FROM units JOIN address_definition_changes USING(unit) \n\
    //                 WHERE (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) \n\
    //                 UNION \n\
    //                 SELECT 1 FROM units CROSS JOIN unit_authors USING(unit) \n\
    //                 WHERE (main_chain_index>? OR main_chain_index IS NULL) AND address IN(?) AND sequence!=\'good\'',
    //                 [lastBallMci, arrFromAddresses, lastBallMci, arrFromAddresses, lastBallMci, arrFromAddresses],
    //                 (rows) => {
    //                     if (rows.length > 0)
    //                         return cb("some definition changes or definitions or nonserials are not stable yet");
    //                     cb();
    //                 },
    //             )
    //         }

    //         if (conf.bLight) {
    //             objUnit.parent_units = lightProps.parent_units
    //             objUnit.last_ball = lightProps.last_stable_mc_ball
    //             objUnit.last_ball_unit = lightProps.last_stable_mc_ball_unit
    //             lastBallMci = lightProps.last_stable_mc_ball_mci
    //             return checkForUnstablePredecessors()
    //         }
    //         parentComposer.pickParentUnitsAndLastBall(
    //             conn,
    //             arrWitnesses,
    //             (err, arrParentUnits, last_stable_mc_ball, last_stable_mc_ball_unit, last_stable_mc_ball_mci) => {
    //                 if (err)
    //                     return cb("unable to find parents: "+err);
    //                 objUnit.parent_units = arrParentUnits;
    //                 objUnit.last_ball = last_stable_mc_ball;
    //                 objUnit.last_ball_unit = last_stable_mc_ball_unit;
    //                 lastBallMci = last_stable_mc_ball_mci;
    //                 checkForUnstablePredecessors();
    //             },
    //         )
    //     },
    //     function (cb) { // authors
    //         async.eachSeries(arrFromAddresses, (from_address, cb2) => {

    //             function setDefinition(){
    //                 signer.readDefinition(conn, from_address, function(err, arrDefinition){
    //                     if (err)
    //                         return cb2(err);
    //                     objAuthor.definition = arrDefinition;
    //                     cb2();
    //                 });
    //             }

    //             let objAuthor = {
    //                 address: from_address,
    //                 authentifiers: {}
    //             };
    //             signer.readSigningPaths(conn, from_address, function(assocLengthsBySigningPaths){
    //                 let arrSigningPaths = Object.keys(assocLengthsBySigningPaths);
    //                 assocSigningPaths[from_address] = arrSigningPaths;
    //                 for (let j=0; j<arrSigningPaths.length; j++)
    //                     objAuthor.authentifiers[arrSigningPaths[j]] = repeatString("-", assocLengthsBySigningPaths[arrSigningPaths[j]]);
    //                 objUnit.authors.push(objAuthor);
    //                 conn.query(
    //                     "SELECT 1 FROM unit_authors CROSS JOIN units USING(unit) \n\
    //                     WHERE address=? AND is_stable=1 AND sequence='good' AND main_chain_index<=? \n\
    //                     LIMIT 1",
    //                     [from_address, lastBallMci],
    //                     function(rows){
    //                         if (rows.length === 0) // first message from this address
    //                             return setDefinition();
    //                         // try to find last stable change of definition, then check if the definition was already disclosed
    //                         conn.query(
    //                             "SELECT definition \n\
    //                             FROM address_definition_changes CROSS JOIN units USING(unit) LEFT JOIN definitions USING(definition_chash) \n\
    //                             WHERE address=? AND is_stable=1 AND sequence='good' AND main_chain_index<=? \n\
    //                             ORDER BY level DESC LIMIT 1",
    //                             [from_address, lastBallMci],
    //                             function(rows){
    //                                 if (rows.length === 0) // no definition changes at all
    //                                     return cb2();
    //                                 let row = rows[0];
    //                                 row.definition ? cb2() : setDefinition(); // if definition not found in the db, add it into the json
    //                             }
    //                         );
    //                     }
    //                 );
    //             });
    //         }, cb)
    //     },
    //     function (cb) { // witnesses
    //         if (bGenesis) {
    //             objUnit.witnesses = arrWitnesses
    //             return cb()
    //         }
    //         if (conf.bLight) {
    //             if (lightProps.witness_list_unit) {objUnit.witness_list_unit = lightProps.witness_list_unit;}
    //             else {objUnit.witnesses = arrWitnesses;}
    //             return cb()
    //         }
    //         // witness addresses must not have references
    //         storage.determineIfWitnessAddressDefinitionsHaveReferences(conn, arrWitnesses, (bWithReferences) => {
    //             if (bWithReferences)
    //                 return cb("some witnesses have references in their addresses");
    //             storage.findWitnessListUnit(conn, arrWitnesses, lastBallMci, function(witness_list_unit){
    //                 if (witness_list_unit)
    //                     objUnit.witness_list_unit = witness_list_unit;
    //                 else
    //                     objUnit.witnesses = arrWitnesses;
    //                 cb();
    //             });
    //         })
    //     },
    //     // messages retrieved via callback
    //     function (cb) {
    //         if (!fnRetrieveMessages) {return cb();}
    //         console.log('will retrieve messages')
    //         fnRetrieveMessages(conn, lastBallMci, bMultiAuthored, arrPayingAddresses, (err, arrMoreMessages, assocMorePrivatePayloads) => {
    //             console.log("fnRetrieveMessages callback: err code = "+(err ? err.error_code : ""));
    //             if (err)
    //                 return cb((typeof err === "string") ? ("unable to add additional messages: "+err) : err);
    //             Array.prototype.push.apply(objUnit.messages, arrMoreMessages);
    //             if (assocMorePrivatePayloads && Object.keys(assocMorePrivatePayloads).length > 0)
    //                 for (let payload_hash in assocMorePrivatePayloads)
    //                     assocPrivatePayloads[payload_hash] = assocMorePrivatePayloads[payload_hash];
    //             cb();
    //         })
    //     },
    //     function (cb) { // input coins
    //         objUnit.headers_commission = objectLength.getHeadersSize(objUnit)
    //         let naked_payload_commission = objectLength.getTotalPayloadSize(objUnit) // without input coins

    //         if (bGenesis) {
    //             let issueInput = { type: 'issue', serial_number: 1, amount: consts.TOTAL_WHITEBYTES }
    //             if (objUnit.authors.length > 1) {
    //                 issueInput.address = arrWitnesses[0]
    //             }
    //             objPaymentMessage.payload.inputs = [issueInput]
    //             objUnit.payload_commission = objectLength.getTotalPayloadSize(objUnit)
    //             totalInput = consts.TOTAL_WHITEBYTES
    //             return cb()
    //         }
    //         if (params.inputs) { // input coins already selected
    //             if (!params.input_amount) {throw Error('inputs but no input_amount');}
    //             totalInput = params.input_amount
    //             objPaymentMessage.payload.inputs = params.inputs
    //             objUnit.payload_commission = objectLength.getTotalPayloadSize(objUnit)
    //             return cb()
    //         }

    //         // all inputs must appear before last_ball
    //         let target_amount = params.send_all ? Infinity : (totalAmount + objUnit.headers_commission + naked_payload_commission)
    //         inputs.pickDivisibleCoinsForAmount(
    //             conn, null, arrPayingAddresses, lastBallMci, target_amount, bMultiAuthored, params.spend_unconfirmed || 'own',
    //             (arrInputsWithProofs, _totalInput) => {
    //                 if (!arrInputsWithProofs)
    //                     return cb({
    //                         error_code: "NOT_ENOUGH_FUNDS",
    //                         error: "not enough spendable funds from "+arrPayingAddresses+" for "+target_amount
    //                     });
    //                 totalInput = _totalInput;
    //                 objPaymentMessage.payload.inputs = arrInputsWithProofs.map(function(objInputWithProof){ return objInputWithProof.input; });
    //                 objUnit.payload_commission = objectLength.getTotalPayloadSize(objUnit);
    //                 console.log("inputs increased payload by", objUnit.payload_commission - naked_payload_commission);
    //                 cb();
    //             },
    //         )
    //     },
    // ], (err) => {
    //     // we close the transaction and release the connection before signing as multisig signing may take very very long
    //     // however we still keep c-ADDRESS lock to avoid creating accidental doublespends
    //     conn.query(err ? "ROLLBACK" : "COMMIT", function(){
    //         conn.release();
    //         if (err)
    //             return handleError(err);

    //         // change, payload hash, signature, and unit hash
    //         let change = totalInput - totalAmount - objUnit.headers_commission - objUnit.payload_commission;
    //         if (change <= 0){
    //             if (!params.send_all)
    //                 throw Error("change="+change+", params="+JSON.stringify(params));
    //             return handleError({
    //                 error_code: "NOT_ENOUGH_FUNDS",
    //                 error: "not enough spendable funds from "+arrPayingAddresses+" for fees"
    //             });
    //         }
    //         objPaymentMessage.payload.outputs[0].amount = change;
    //         objPaymentMessage.payload.outputs.sort(sortOutputs);
    //         objPaymentMessage.payload_hash = objectHash.getBase64Hash(objPaymentMessage.payload);
    //         let text_to_sign = objectHash.getUnitHashToSign(objUnit);
    //         async.each(
    //             objUnit.authors,
    //             function(author, cb2){
    //                 let address = author.address;
    //                 async.each( // different keys sign in parallel (if multisig)
    //                     assocSigningPaths[address],
    //                     function(path, cb3){
    //                         if (signer.sign){
    //                             signer.sign(objUnit, assocPrivatePayloads, address, path, function(err, signature){
    //                                 if (err)
    //                                     return cb3(err);
    //                                 // it can't be accidentally confused with real signature as there are no [ and ] in base64 alphabet
    //                                 if (signature === '[refused]')
    //                                     return cb3('one of the cosigners refused to sign');
    //                                 author.authentifiers[path] = signature;
    //                                 cb3();
    //                             });
    //                         }
    //                         else{
    //                             signer.readPrivateKey(address, path, function(err, privKey){
    //                                 if (err)
    //                                     return cb3(err);
    //                                 author.authentifiers[path] = ecdsaSig.sign(text_to_sign, privKey);
    //                                 cb3();
    //                             });
    //                         }
    //                     },
    //                     function(err){
    //                         cb2(err);
    //                     }
    //                 );
    //             },
    //             function(err){
    //                 if (err)
    //                     return handleError(err);
    //                 objUnit.unit = objectHash.getUnitHash(objUnit);
    //                 if (bGenesis)
    //                     objJoint.ball = objectHash.getBallHash(objUnit.unit);
    //                 console.log(require('util').inspect(objJoint, {depth:null}));
    //                 objJoint.unit.timestamp = Math.round(Date.now()/1000); // light clients need timestamp
    //                 if (Object.keys(assocPrivatePayloads).length === 0)
    //                     assocPrivatePayloads = null;
    //                 //profiler.stop('compose');
    //                 callbacks.ifOk(objJoint, assocPrivatePayloads, unlockCallback);
    //             }
    //         );
    //     });
    // })
    return objJoint
}

// test

function onError(err) {
    throw Error(err)
}
const callbacks = {
    ifNotEnoughFunds: onError,
    ifError: onError,
    ifOk() {
    },
}

const fromAddress = 'PYQJWUWRMUUUSUHKNJWFHSR5OADZMUYR'
const payeeAddress = 'LS3PUAGJ2CEYBKWPODVV72D3IWWBXNXO'
const arrOutputs = [
    { address: fromAddress, amount: 0 }, // the change
    { address: payeeAddress, amount: 10000 }, // the receiver
]
const params = {
    paying_addresses: [fromAddress], outputs: arrOutputs, signer: null, callbacks,
}

const obj = createJoint(params)


logger.info(obj)

exports.createJoint = createJoint
