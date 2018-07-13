/* jslint node: true */


/**
 * A Utility for chash
 * @module chash
 */

const crypto = require('crypto')
const base32 = require('thirty-two')

const PI = '1451369234883381050283968485892027449493' // Soldner Constant
const zeroString = '00000000'

const arrRelativeOffsets = PI.split('')

/**
 * check if chash length is 160 or 288
 * @function
 * @private
 * @param {number} chashLength - chash length, 160 or 288
 * @throws {object} Error - error message: unsupported c-hash length: ${chashLength}
 */
function checkLength(chashLength) {
    if (chashLength !== 160 && chashLength !== 288) {
        throw Error(`unsupported c-hash length: ${chashLength}`)
    }
}

/**
 * calculate offset of chash
 * @function
 * @private
 * @param {number} chashLength - chash length
 * @returns {array} arrOffsets - array of offsets index
 * @throws {object} Error - if index is not 32 error message: 'wrong number of checksum bits'
 */
function calcOffsets(chashLength) {
    checkLength(chashLength)
    const arrOffsets = []
    let offset = 0
    let index = 0

    for (let i = 0; offset < chashLength; i += 1) {
        const relativeOffset = parseInt(arrRelativeOffsets[i], 10)
        if (relativeOffset !== 0) {
            offset += relativeOffset
            if (chashLength === 288) offset += 4
            if (offset >= chashLength) break
            arrOffsets.push(offset)
            // console.log("index="+index+", offset="+offset);
            index += 1
        }
    }

    if (index !== 32) throw Error('wrong number of checksum bits')

    return arrOffsets
}

const arrOffsets160 = calcOffsets(160)
const arrOffsets288 = calcOffsets(288)

/**
 * separate into clean data and checksum
 * @function
 * @private
 * @param {array} bin - binary data include clean data and checksum
 * @returns {object} result - include clean datan and checksum
 */
function separateIntoCleanDataAndChecksum(bin) {
    const len = bin.length
    let arrOffsets
    if (len === 160) arrOffsets = arrOffsets160
    else if (len === 288) arrOffsets = arrOffsets288
    else throw Error(`bad length=${len}, bin = ${bin}`)
    const arrFrags = []
    const arrChecksumBits = []
    let start = 0
    for (let i = 0; i < arrOffsets.length; i += 1) {
        arrFrags.push(bin.substring(start, arrOffsets[i]))
        arrChecksumBits.push(bin.substr(arrOffsets[i], 1))
        start = arrOffsets[i] + 1
    }
    // add last frag
    if (start < bin.length) arrFrags.push(bin.substring(start))
    const binCleanData = arrFrags.join('')
    const binChecksum = arrChecksumBits.join('')
    return { clean_data: binCleanData, checksum: binChecksum }
}

/**
 * mix clean data with checksum
 * @function
 * @private
 * @param {string} binCleanData - clean data without checksum
 * @param {array} binChecksum - chechsum
 * @returns {string} data - data mixed by clean data and checksum
 */
function mixChecksumIntoCleanData(binCleanData, binChecksum) {
    if (binChecksum.length !== 32) throw Error('bad checksum length')
    const len = binCleanData.length + binChecksum.length
    let arrOffsets
    if (len === 160) arrOffsets = arrOffsets160
    else if (len === 288) arrOffsets = arrOffsets288
    else throw Error(`bad length=${len}, clean data = ${binCleanData}, checksum = ${binChecksum}`)
    const arrFrags = []
    const arrChecksumBits = binChecksum.split('')
    let start = 0
    for (let i = 0; i < arrOffsets.length; i += 1) {
        const end = arrOffsets[i] - i
        arrFrags.push(binCleanData.substring(start, end))
        arrFrags.push(arrChecksumBits[i])
        start = end
    }
    // add last frag
    if (start < binCleanData.length) arrFrags.push(binCleanData.substring(start))
    return arrFrags.join('')
}

/**
 * buffer to binary
 * @function
 * @private
 * @param {array} buf - buffer array
 * @returns {string} bin - binary string
 */
function buffer2bin(buf) {
    const bytes = []
    for (let i = 0; i < buf.length; i += 1) {
        let bin = buf[i].toString(2)
        if (bin.length < 8) { // pad with zeros
            bin = zeroString.substring(bin.length, 8) + bin
        }
        bytes.push(bin)
    }
    return bytes.join('')
}

/**
 * binary to buffer
 * @function
 * @private
 * @param {string} bin - binary string
 * @returns {array} buffer - buffer array
 */
function bin2buffer(bin) {
    const len = bin.length / 8
    // console.log(typeof len)
    const buf = Buffer.alloc(len)
    // console.log(buf)
    for (let i = 0; i < len; i += 1) buf[i] = parseInt(bin.substr(i * 8, 8), 2)
    return buf
}

/**
 * get check sum
 * @function
 * @private
 * @param {string} cleanData - clean data without checksum
 * @returns {array} checksum - checksum of clean data
 */
function getChecksum(cleanData) {
    const fullChecksum = crypto.createHash('sha256').update(cleanData).digest()
    // console.log(full_checksum);
    const checksum = Buffer.from([
        fullChecksum[5],
        fullChecksum[13],
        fullChecksum[21],
        fullChecksum[29]])
    return checksum
}

/**
 * get chash data
 * @function
 * @private
 * @param {any} data - date that need to be chashed
 * @param {number} chashLength - length of chash result
 * @returns {string} chash - chashed data
 */
function getChash(data, chashLength) {
    // console.log("getChash: "+data);
    checkLength(chashLength)
    const hash = crypto.createHash((chashLength === 160) ? 'ripemd160' : 'sha256').update(data, 'utf8').digest()
    // console.log("hash", hash);
    const truncatedHash = (chashLength === 160) ? hash.slice(4) : hash // drop first 4 bytes if 160
    // console.log("clean data", truncated_hash);
    const checksum = getChecksum(truncatedHash)
    // console.log("checksum", checksum);
    // console.log("checksum", buffer2bin(checksum));

    const binCleanData = buffer2bin(truncatedHash)
    const binChecksum = buffer2bin(checksum)
    const binChash = mixChecksumIntoCleanData(binCleanData, binChecksum)
    // console.log(binCleanData.length, binChecksum.length, binChash.length);
    const chash = bin2buffer(binChash)
    // console.log("chash     ", chash);
    const encoded = (chashLength === 160) ? base32.encode(chash).toString() : chash.toString('base64')
    // console.log(encoded);
    return encoded
}

/**
 * get 160 bits chash
 * @function
 * @public
 * @param {any} data - data to be chashed
 * @returns {string} chash - 160 bits chashed data
 */
function getChash160(data) {
    return getChash(data, 160)
}

/**
 * get 288 bits chash
 * @function
 * @public
 * @param {any} data - data to be chashed
 * @returns {string} chash - 288 bits chashed data
 */
function getChash288(data) {
    return getChash(data, 288)
}

/**
 * validate if the encoded is a valid chash message
 * @function
 * @public
 * @param {string} encoded - chashed message
 * @returns {boolean} true/false - if it's valid return true or false
 * @throws {object} Error - if throw error if length if not 32 or 48
 */
function isChashValid(encoded) {
    const encodedLen = encoded.length
    if (encodedLen !== 32 && encodedLen !== 48) { // 160/5 = 32, 288/6 = 48
        throw Error(`wrong encoded length: ${encodedLen}`)
    }
    const chash = (encodedLen === 32) ? base32.decode(encoded) : Buffer.alloc(encoded, 'base64')
    const binChash = buffer2bin(chash)
    const separated = separateIntoCleanDataAndChecksum(binChash)
    const cleanData = bin2buffer(separated.clean_data)
    // console.log("clean data", clean_data);
    const checksum = bin2buffer(separated.checksum)
    // console.log(checksum);
    // console.log(getChecksum(clean_data));
    return checksum.equals(getChecksum(cleanData))
}


exports.getChash160 = getChash160
exports.getChash288 = getChash288
exports.isChashValid = isChashValid
