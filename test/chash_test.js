"use strict"

let chash = require("../encrypt/chash");
let objectHash = require("../encrypt/object_hash");

// let offset_160 = chash.calcOffsets(160);
// console.log(offset_160.length);
// console.log(offset_160);

// let offset_288 = chash.calcOffsets(288);
// console.log(offset_288.length);
// console.log(offset_288)

// mnemonic: group scout drum liquid thumb join scrub wash violin satoshi mimic deny
var address = objectHash.getChash160(["sig", {"pubkey": "xpub661MyMwAqRbcFjjL32Wcrq94pt7zp9csPK9EGd7egJZZqcf9AurBJR3JMWoCZdfokjUBsmGgBPRn5Y19weMnfdj5ZiingJBDjiGGYfCSoKy"}]);
console.log(address);
var isValid = chash.isChashValid(address);
console.log(isValid);

var test_address = objectHash.getChash160(["sig", {"pubkey": "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"}]);
console.log(test_address);
var isValid = chash.isChashValid(test_address);
console.log(isValid);
