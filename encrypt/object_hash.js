/* jslint node: true */

/**
 * Get object chash
 * @module object_hash
 */

const crypto = require('crypto')
const chash = require('./chash.js')

/**
 * change everthing into string
 * @function
 * @private
 * @param {Object} obj - object or others things
 * @returns {String} string - string of obj
 */
function getSourceString(obj) {
    const arrComponents = []
    function extractComponents(variable) {
        if (variable === null) throw Error(`null value in ${JSON.stringify(obj)}`)
        switch (typeof variable) {
        case 'string':
            arrComponents.push('s', variable)
            break
        case 'number':
            arrComponents.push('n', variable.toString())
            break
        case 'boolean':
            arrComponents.push('b', variable.toString())
            break
        case 'object':
            if (Array.isArray(variable)) {
                if (variable.length === 0) throw Error(`empty array in ${JSON.stringify(obj)}`)
                arrComponents.push('[')
                variable.forEach((item) => {
                    extractComponents(item)
                })
                arrComponents.push(']')
            } else {
                const keys = Object.keys(variable).sort()
                if (keys.length === 0) throw Error(`empty object in ${JSON.stringify(obj)}`)
                keys.forEach((key) => {
                    if (typeof variable[key] === 'undefined') {
                        throw Error(`undefined at ${key} of ${JSON.stringify(obj)}`)
                    }
                    arrComponents.push(key)
                    extractComponents(variable[key])
                })
            }
            break
        default:
            throw Error(`hash: unknown type=${typeof variable} of ${variable}, object: ${JSON.stringify(obj)}`)
        }
    }

    extractComponents(obj)
    return arrComponents.join('\x00')
}

/**
 * get 160 bits chash
 * @function
 * @public
 * @param {Object} obj - object to be chashed
 * @returns {String} chash - 160 bits chashed data
 */
function getChash160(obj) {
    return chash.getChash160(getSourceString(obj))
}

/**
 * get 288 bits chash
 * @function
 * @public
 * @param {Object} obj - object to be chashed
 * @returns {String} chash - 288 bits chashed data
 */
function getChash288(obj) {
    return chash.getChash288(getSourceString(obj))
}

function getHexHash(obj) {
    return crypto.createHash('sha256').update(getSourceString(obj), 'utf8').digest('hex')
}

function getBase64Hash(obj) {
    return crypto.createHash('sha256').update(getSourceString(obj), 'utf8').digest('base64')
}


function getNakedUnit(objUnit) {
    const objNakedUnit = Object.assign({}, objUnit)
    delete objNakedUnit.unit
    delete objNakedUnit.headers_commission
    delete objNakedUnit.payload_commission
    delete objNakedUnit.main_chain_index
    delete objNakedUnit.timestamp
    // delete objNakedUnit.last_ball_unit;
    if (objNakedUnit.messages) {
        for (let i = 0; i < objNakedUnit.messages.length; i += 1) {
            delete objNakedUnit.messages[i].payload
            delete objNakedUnit.messages[i].payload_uri
        }
    }
    // console.log("naked Unit: ", objNakedUnit);
    // console.log("original Unit: ", objUnit);
    return objNakedUnit
}

function getUnitContentHash(objUnit) {
    return getBase64Hash(getNakedUnit(objUnit))
}

function getUnitHash(objUnit) {
    if (objUnit.content_hash) { // already stripped
        return getBase64Hash(getNakedUnit(objUnit))
    }
    const objStrippedUnit = {
        content_hash: getUnitContentHash(objUnit),
        version: objUnit.version,
        alt: objUnit.alt,
        authors: objUnit.authors.map(author => ({ address: author.address })), // already sorted
    }
    if (objUnit.witness_list_unit) objStrippedUnit.witness_list_unit = objUnit.witness_list_unit
    else objStrippedUnit.witnesses = objUnit.witnesses
    if (objUnit.parent_units) {
        objStrippedUnit.parent_units = objUnit.parent_units
        objStrippedUnit.last_ball = objUnit.last_ball
        objStrippedUnit.last_ball_unit = objUnit.last_ball_unit
    }
    return getBase64Hash(objStrippedUnit)
}

function getUnitHashToSign(objUnit) {
    const objNakedUnit = getNakedUnit(objUnit)
    for (let i = 0; i < objNakedUnit.authors.length; i += 1) {
        delete objNakedUnit.authors[i].authentifiers
    }
    return crypto.createHash('sha256').update(getSourceString(objNakedUnit), 'utf8').digest()
}

function getBallHash(unit, arrParentBalls, arrSkiplistBalls, bNonserial) {
    const objBall = {
        unit,
    }
    if (arrParentBalls && arrParentBalls.length > 0) objBall.parent_balls = arrParentBalls
    if (arrSkiplistBalls && arrSkiplistBalls.length > 0) objBall.skiplist_balls = arrSkiplistBalls
    if (bNonserial) objBall.is_nonserial = true
    return getBase64Hash(objBall)
}

function getJointHash(objJoint) {
    // we use JSON.stringify, we can't use objectHash here because it might throw errors
    return crypto.createHash('sha256').update(JSON.stringify(objJoint), 'utf8').digest('base64')
}

function cleanNulls(obj) {
    Object.keys(obj).forEach((key) => {
        if (obj[key] === null) {
            delete obj[key]
        }
    })
}

// -----------------

// prefix device addresses with 0 to avoid confusion with payment addresses
// Note that 0 is not a member of base32 alphabet, which makes device addresses
// easily distinguishable from payment addresses
// but still selectable by double-click.  Stripping the leading 0 will not produce
// a payment address that the device owner knows a private key for,
// because payment address is derived by c-hashing the definition object, while device
//  address is produced from raw public key.
function getDeviceAddress(b64Pubkey) {
    return (`0${getChash160(b64Pubkey)}`)
}

function getDeviceMessageHashToSign(objDeviceMessage) {
    const objNakedDeviceMessage = Object.assign({}, objDeviceMessage)
    delete objNakedDeviceMessage.signature
    return crypto.createHash('sha256').update(getSourceString(objNakedDeviceMessage), 'utf8').digest()
}


exports.getChash160 = getChash160
exports.getChash288 = getChash288

exports.getHexHash = getHexHash
exports.getBase64Hash = getBase64Hash

exports.getUnitContentHash = getUnitContentHash
exports.getUnitHash = getUnitHash
exports.getUnitHashToSign = getUnitHashToSign
exports.getBallHash = getBallHash
exports.getJointHash = getJointHash

exports.cleanNulls = cleanNulls

exports.getDeviceAddress = getDeviceAddress
exports.getDeviceMessageHashToSign = getDeviceMessageHashToSign
