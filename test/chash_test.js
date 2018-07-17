const chash = require('../encrypt/chash')
const objectHash = require('../encrypt/objectHash')

// let offset_160 = chash.calcOffsets(160);
// console.log(offset_160.length);
// console.log(offset_160);

// let offset_288 = chash.calcOffsets(288);
// console.log(offset_288.length);
// console.log(offset_288)

// mnemonic: group scout drum liquid thumb join scrub wash violin satoshi mimic deny

let address = objectHash.getChash160(['sig', { pubkey: 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a' }])
console.log(address)
let isValid = chash.isChashValid(address)
console.log(isValid)

console.log('\n=============\n')

address = objectHash.getChash160(['sig', { pubkey: 'AhZA7VXOUVVbqkuZ9+OWFLcfHW2LEpKIF+aUakZzypNQ' }])
console.log(address)
isValid = chash.isChashValid(address)
console.log(isValid)

// ['sig', { pubkey: 'AhZA7VXOUVVbqkuZ9+OWFLcfHW2LEpKIF+aUakZzypNQ' }]
let newAddress = chash.changeOldAddressToNewAddress('VTQFOIBG7CW2K3ALFMDTJHIM2YRT5PCC')
console.log(newAddress)
console.log(address === newAddress)

console.log('\n=============\n')

address = objectHash.getChash160(['sig', { pubkey: 'A99C/p2BnuYz3etkI89x1VmEiMejCR+VeAzxdd7T1agH' }])
console.log(address)
isValid = chash.isChashValid(address)
console.log(isValid)

// ['sig', { pubkey: 'A99C/p2BnuYz3etkI89x1VmEiMejCR+VeAzxdd7T1agH' }]
newAddress = chash.changeOldAddressToNewAddress('WYVBLQ3H6AMUFXLGOKTW7C7UVNM3WP2T')
console.log(newAddress)
console.log(address === newAddress)
