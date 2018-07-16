/* jslint node: true */

const ValidationUtils = require('../validation/validationUtils.js')
const constants = require('../config/constants.js')
const conf = require('../config/conf.js')
const Mnemonic = require('bitcore-mnemonic')


function parseUri(uri, callbacks) {
    const protocol = conf.program || 'trustnote'
    const re = new RegExp(`^${protocol}:(.+)$`, 'i')
    const arrMatches = uri.match(re)
    if (!arrMatches) { return callbacks.ifError(`no ${protocol} prefix`) }
    const value = arrMatches[1]
    const objRequest = {}
    const arrPairingMatches = value.replace('%23', '#').match(/^([\w/+]{44})@([\w.:/-]+)#([\w/+-]+)$/)
    if (arrPairingMatches) {
        objRequest.type = 'pairing';
        objRequest.pubkey = arrPairingMatches[1]
        objRequest.hub = arrPairingMatches[2]
        objRequest.pairing_secret = arrPairingMatches[3]
        // if (objRequest.pairing_secret.length > 12)
        //    return callbacks.ifError("pairing secret too long");
        return callbacks.ifOk(objRequest)
    }

    // authentication/authorization
    const arrAuthMatches = value.match(/^auth\?(.+)$/)
    if (arrAuthMatches) {
        objRequest.type = 'auth';
        const queryString = arrAuthMatches[1]
        const assocParams = parseQueryString(queryString)
        if (assocParams.url) {
            if (!assocParams.url.match(/^https?:\/\//)) { return callbacks.ifError('invalid url') }
        } else if (assocParams.device) {
            if (!assocParams.pairing_secret) { return callbacks.ifError('no pairing secret in auth params') }
            if (!assocParams.app) { return callbacks.ifError('no app in auth params') }
            const arrParts = assocParams.device.split('@')
            if (arrParts.length !== 2) { return callbacks.ifError('not 2 parts in full device address') }
            const pubkey = arrParts[0]
            const hub = arrParts[1]
            if (pubkey.length !== constants.PUBKEY_LENGTH) { return callbacks.ifError('pubkey length is not 44') }
            if (hub.match(/[^\w.:-]/)) { return callbacks.ifError('invalid hub address') }
        } else { return callbacks.ifError('neither url nor device in auth params') }
        objRequest.params = assocParams
        return callbacks.ifOk(objRequest)
    }

    // claim textcoin using mnemonic
    const arrMnemonicMatches = value.match(/^textcoin\?(.+)$/)
    if (arrMnemonicMatches) {
        objRequest.type = 'textcoin';
        const mnemonic = arrMnemonicMatches[1].split('-').join(' ')
        try {
            if (Mnemonic.isValid(mnemonic)) {
                objRequest.mnemonic = mnemonic
                return callbacks.ifOk(objRequest)
            }
            return callbacks.ifError('invalid mnemonic')
        } catch (e) {
            return callbacks.ifError('invalid mnemonic')
        }
    }

    // pay to address
    const arrParts = value.split('?')
    if (arrParts.length > 2) { return callbacks.ifError('too many question marks')}
    const address = arrParts[0]
    const queryString = arrParts[1]
    if (!ValidationUtils.isValidAddress(address)) { return callbacks.ifError(`address ${address} is invalid`) }
    objRequest.type = 'address'
    objRequest.address = address
    if (queryString) {
        const assocParams = parseQueryString(queryString)
        const strAmount = assocParams.amount
        if (typeof strAmount === 'string') {
            const amount = parseInt(strAmount, 10)
            if (`${amount}` !== strAmount) { return callbacks.ifError(`invalid amount: ${strAmount}`) }
            if (!ValidationUtils.isPositiveInteger(amount)) { return callbacks.ifError(`nonpositive amount: ${strAmount}`) }
            objRequest.amount = amount
        }
        const { asset } = assocParams.asset
        if (typeof asset === 'string') {
            if (asset !== 'base' && !ValidationUtils.isValidBase64(asset, constants.HASH_LENGTH)) { // invalid asset
                return callbacks.ifError(`invalid asset: ${asset}`) 
            }
            objRequest.asset = asset
        }
        if (!objRequest.asset && objRequest.amount) { // when amount is set, asset must be also set
            objRequest.asset = 'base'
        }
        const deviceAddress = assocParams.device_address
        if (deviceAddress) {
            if (!ValidationUtils.isValidDeviceAddress(deviceAddress)) { return callbacks.ifError(`invalid device address: ${deviceAddress}`) }
            objRequest.device_address = deviceAddress
        }
    }
    return callbacks.ifOk(objRequest)
}

function parseQueryString(str, delimiter) {
    if (!delimiter) { delimiter = '&' }
    const arrPairs = str.split(delimiter)
    const assocParams = {}
    arrPairs.forEach((pair) => {
        const arrNameValue = pair.split('=');
        if (arrNameValue.length !== 2) { return }
        const name = decodeURIComponent(arrNameValue[0]);
        const value = decodeURIComponent(arrNameValue[1]);
        assocParams[name] = value
    })
    return assocParams
}


exports.parseQueryString = parseQueryString
exports.parseUri = parseUri
