/* jslint node: true */


/**
 * Signature Module
 * @module signature
 */

const ecdsa = require('secp256k1')

/**
 * Signature function
 * @function
 * @instance
 * @param {string} hash - hash of text to sign
 * @param {string} priv_key - private key
 * @return {string} return signature result in base64
 */
function sign(hash, privKey) {
    const res = ecdsa.sign(hash, privKey)
    return res.signature.toString('base64')
}

/**
 * Validate Signature function
 * @function
 * @instance
 * @param {string} hash - hash of text to sign
 * @param {string} b64Sig - signature result in base64
 * @param {string} b64PubKey - public key in base64
 * @return {string} return signature result
 */
function verify(hash, b64Sig, b64PubKey) {
    try {
        const signature = Buffer.alloc(b64Sig, 'base64') // 64 bytes (32+32)
        return ecdsa.verify(hash, signature, Buffer.alloc(b64PubKey, 'base64'))
    } catch (e) {
        console.log(`signature verification exception: ${e.toString()}`)
        return false
    }
}

module.exports = {
    sign,
    verify,
}
