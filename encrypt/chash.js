/* jslint node: true */

const crypto = require('crypto')
const base32 = require('thirty-two')

const PI = '1451369234883381050283968485892027449493' // Soldner Constant
const zeroString = '00000000'

const arrRelativeOffsets = PI.split('')

function checkLength(chashLength) {
    if (chashLength !== 160 && chashLength !== 288) {
        throw Error(`unsupported c-hash length: ${chashLength}`)
    }
}

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

function bin2buffer(bin) {
    const len = bin.length / 8
    // console.log(typeof len)
    const buf = Buffer.alloc(len)
    // console.log(buf)
    for (let i = 0; i < len; i += 1) buf[i] = parseInt(bin.substr(i * 8, 8), 2)
    return buf
}

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

function getChash160(data) {
    return getChash(data, 160)
}

function getChash288(data) {
    return getChash(data, 288)
}

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
