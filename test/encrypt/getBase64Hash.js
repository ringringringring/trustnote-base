/* global describe it */

const assert = require('assert')
const logger = require('../../common/logger')
const cryptojs = require('crypto-js')

const objectHash = require('../../encrypt/object_hash')

describe('encrypt->object_hash->getBase64Hash', () => {
    const definition = ['sig', { pubkey: 'xpub661MyMwAqRbcFjjL32Wcrq94pt7zp9csPK9EGd7egJZZqcf9AurBJR3JMWoCZdfokjUBsmGgBPRn5Y19weMnfdj5ZiingJBDjiGGYfCSoKy' }]

    describe('getBase64Hash(obj)', () => {
        it('Verify hex hash get from object_hash module', () => {
            
            logger.info(`Step 1. Get base64 hash from object.`)
            const actual = objectHash.getBase64Hash(definition)
            logger.info(`Get base64 hash: ${actual}`)

            logger.info(`Step 2. Convert object to string.`)
            const input = objectHash.getSourceString(definition)
            logger.info(`Converted object to string: ${input}`)

            logger.info(`Step 3. Do SHA256 to converted string.`)
            const sha256 = cryptojs.SHA256(input);
            logger.info(`SHA256 string: ${sha256}`)

            logger.info(`Step 4. Convert SHA256 to base64 string.`)
            const expected = sha256.toString(cryptojs.enc.Base64)
            logger.info(`base64 string: ${expected}`)

            assert.equal(actual, expected, `Verify convert object to base64 hash failed!\n expected: ${expected} \nactual:${actual}`)
        })
    })
})
