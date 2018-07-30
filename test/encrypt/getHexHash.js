/* global describe it */

const assert = require('assert')
const logger = require('../../common/logger')
const cryptojs = require('crypto-js')

const objectHash = require('../../encrypt/object_hash')

describe('encrypt->object_hash->getHexHash', () => {
    const definition = ['sig', { pubkey: 'xpub661MyMwAqRbcFjjL32Wcrq94pt7zp9csPK9EGd7egJZZqcf9AurBJR3JMWoCZdfokjUBsmGgBPRn5Y19weMnfdj5ZiingJBDjiGGYfCSoKy' }]

    describe('getHexHash(obj)', () => {
        it('Verify hex hash get from object_hash module', () => {

            logger.info(`Step 1. Get hex hash from object.`)
            const actual = objectHash.getHexHash(definition)
            logger.info(`Get hex hash: ${actual}`)

            logger.info(`Step 2. Convert object to string.`)
            const input = objectHash.getSourceString(definition)
            logger.info(`Converted object to string: ${input}`)

            logger.info(`Step 3. Do SHA256 to converted string.`)
            const expected = cryptojs.SHA256(input);
            logger.info(`SHA256 string: ${expected}`)

            assert.equal(actual, expected, `Verify convert object to hex hash failed!\n expected: ${expected} \nactual:${actual}`)
        })
    })
})
