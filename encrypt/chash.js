/*jslint node: true */
"use strict";
let crypto = require('crypto');
let base32 = require('thirty-two');

const PI = "1451369234883381050283968485892027449493"; //Soldner Constant
const zeroString = "00000000";

const arrRelativeOffsets = PI.split("");

function checkLength(chash_length){
	if (chash_length !== 160 && chash_length !== 288)
		throw "unsupported c-hash length: "+chash_length;
}

function calcOffsets(chash_length){
	checkLength(chash_length);
	let arrOffsets = [];
	let offset = 0;
	let index = 0;

	for (let i=0; offset<chash_length; i++){
		let relative_offset = parseInt(arrRelativeOffsets[i]);
		if (relative_offset === 0)
			continue;
		offset += relative_offset;
		if (chash_length === 288)
			offset += 4;
		if (offset >= chash_length)
			break;
		arrOffsets.push(offset);
		//console.log("index="+index+", offset="+offset);
		index++;
	}

	if (index != 32)
		throw "wrong number of checksum bits";
	
	return arrOffsets;
}

let arrOffsets160 = calcOffsets(160);
let arrOffsets288 = calcOffsets(288);

function separateIntoCleanDataAndChecksum(bin){
	let len = bin.length;
	let arrOffsets;
	if (len === 160)
		arrOffsets = arrOffsets160;
	else if (len === 288)
		arrOffsets = arrOffsets288;
	else
		throw Error("bad length="+len+", bin = "+bin);
	let arrFrags = [];
	let arrChecksumBits = [];
	let start = 0;
	for (let i=0; i<arrOffsets.length; i++){
		arrFrags.push(bin.substring(start, arrOffsets[i]));
		arrChecksumBits.push(bin.substr(arrOffsets[i], 1));
		start = arrOffsets[i]+1;
	}
	// add last frag
	if (start < bin.length)
		arrFrags.push(bin.substring(start));
	let binCleanData = arrFrags.join("");
	let binChecksum = arrChecksumBits.join("");
	return {clean_data: binCleanData, checksum: binChecksum};
}

function mixChecksumIntoCleanData(binCleanData, binChecksum){
	if (binChecksum.length !== 32)
		throw "bad checksum length";
	let len = binCleanData.length + binChecksum.length;
	let arrOffsets;
	if (len === 160)
		arrOffsets = arrOffsets160;
	else if (len === 288)
		arrOffsets = arrOffsets288;
	else
		throw Error("bad length="+len+", clean data = "+binCleanData+", checksum = "+binChecksum);
	let arrFrags = [];
	let arrChecksumBits = binChecksum.split("");
	let start = 0;
	for (let i=0; i<arrOffsets.length; i++){
		let end = arrOffsets[i] - i;
		arrFrags.push(binCleanData.substring(start, end));
		arrFrags.push(arrChecksumBits[i]);
		start = end;
	}
	// add last frag
	if (start < binCleanData.length)
		arrFrags.push(binCleanData.substring(start));
	return arrFrags.join("");
}

function buffer2bin(buf){
	let bytes = [];
	for (let i=0; i<buf.length; i++){
		let bin = buf[i].toString(2);
		if (bin.length < 8) // pad with zeros
			bin = zeroString.substring(bin.length, 8) + bin;
		bytes.push(bin);
	}
	return bytes.join("");
}

function bin2buffer(bin){
	let len = bin.length/8;
	let buf = new Buffer(len);
	for (let i=0; i<len; i++)
		buf[i] = parseInt(bin.substr(i*8, 8), 2);
	return buf;
}

function getChecksum(clean_data){
	let full_checksum = crypto.createHash("sha256").update(clean_data).digest();
	//console.log(full_checksum);
	let checksum = new Buffer([full_checksum[5], full_checksum[13], full_checksum[21], full_checksum[29]]);
	return checksum;
}

function getChash(data, chash_length){
	//console.log("getChash: "+data);
	checkLength(chash_length);
	let hash = crypto.createHash((chash_length === 160) ? "ripemd160" : "sha256").update(data, "utf8").digest();
	//console.log("hash", hash);
	let truncated_hash = (chash_length === 160) ? hash.slice(4) : hash; // drop first 4 bytes if 160
	//console.log("clean data", truncated_hash);
	let checksum = getChecksum(truncated_hash);
	//console.log("checksum", checksum);
	//console.log("checksum", buffer2bin(checksum));
	
	let binCleanData = buffer2bin(truncated_hash);
	let binChecksum = buffer2bin(checksum);
	let binChash = mixChecksumIntoCleanData(binCleanData, binChecksum);
	//console.log(binCleanData.length, binChecksum.length, binChash.length);
	let chash = bin2buffer(binChash);
	//console.log("chash     ", chash);
	let encoded = (chash_length === 160) ? base32.encode(chash).toString() : chash.toString('base64');
	//console.log(encoded);
	return encoded;
}

function getChash160(data){
	return getChash(data, 160);
}

function getChash288(data){
	return getChash(data, 288);
}

function isChashValid(encoded){
	let encoded_len = encoded.length;
	if (encoded_len !== 32 && encoded_len !== 48) // 160/5 = 32, 288/6 = 48
		throw "wrong encoded length: "+encoded_len;
	let chash = (encoded_len === 32) ? base32.decode(encoded) : new Buffer(encoded, 'base64');
	let binChash = buffer2bin(chash);
	let separated = separateIntoCleanDataAndChecksum(binChash);
	let clean_data = bin2buffer(separated.clean_data);
	//console.log("clean data", clean_data);
	let checksum = bin2buffer(separated.checksum);
	// console.log(checksum);
	// console.log(getChecksum(clean_data));
	return checksum.equals(getChecksum(clean_data));
}


exports.getChash160 = getChash160;
exports.getChash288 = getChash288;
exports.isChashValid = isChashValid;
