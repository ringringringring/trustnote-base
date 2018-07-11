/* jslint node: true */
"use strict"

/**
 * Signature Module
 * @module signature
 */

var ecdsa = require('secp256k1');

/**
 * Signature function
 * @function
 * @instance
 * @param {string} hash - hash of text to sign
 * @param {string} priv_key - private key
 * @return {string} return signature result in base64
 */
exports.sign = function(hash, priv_key){
	var res = ecdsa.sign(hash, priv_key);
	return res.signature.toString("base64");
};

/**
 * Validate Signature function
 * @function
 * @instance
 * @param {string} hash - hash of text to sign
 * @param {string} b64_sig - signature result in base64
 * @param {string} b64_pub_key - public key in base64
 * @return {string} return signature result
 */
exports.verify = function(hash, b64_sig, b64_pub_key){
	try{
		var signature = new Buffer(b64_sig, "base64"); // 64 bytes (32+32)
		return ecdsa.verify(hash, signature, new Buffer(b64_pub_key, "base64"));
	}
	catch(e){
		console.log('signature verification exception: '+e.toString());
		return false;
	}
};

