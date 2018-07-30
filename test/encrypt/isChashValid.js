/* global describe it */

const assert = require('assert')
const logger = require('../../test/tools/logger')

const chash = require('../../encrypt/chash')

describe('encrypt->chash->isChashValid', () => {
    const correct_address = 'NC6OE7KNBL5KWA3NPGRXUZ7YSF7KWZPM'

    beforeEach(() => {
        logger.info('Test case start.')
    })

    afterEach(() => {
        logger.info('Test case end.')
    })

    describe('isChashValid(encoded)', () => {
        it('Verify correct address should return true by object_hash module', () => {

            logger.info(`Step 1. Input correct address to isChashValid.`)
            const address = correct_address
            const actual = chash.isChashValid(address)
            logger.info(`test result: ${actual} and test address: ${address}`)

            assert.equal(actual, true, `Generated address: ${address} is invalidate!`)
        })

        it('Verify incorrect address should return false by object_hash module', () => {

            logger.info(`Step 1. Create incorrect address in length.`)
            const address = correct_address.substring(0, correct_address.length / 2)
            logger.info(`Genrated incorrect address:${address}`)

            logger.info(`Step 2. Verify incorrect address.`)
            try {
                const actual = chash.isChashValid(address)
                assert.equal(actual, false, `Generated incorrect address: ${address} is should verify failed!`)
            }
            catch (e){
                logger.info(`Generated incorrect address: ${address} verify passed.`)
                return
            }

            assert.fail(`Generated incorrect address: ${address} is should verify failed!`)
        })
    })
})


// describe('encrypt->object_hash->getChash160', () => {
//     describe('getChash160(obj)', () => {
//         it('Verify 160 address generate by object_hash module', () => {
//             const address = objectHash.getChash160(definition)
//             logger.info(`Generated address : ${address} by pubkey : ${definition[1].pubkey}`)

//             const isValid = chash.isChashValid(address)
//             assert.equal(isValid, true, `Generated address :${address} is invalidate!`)
//             logger.info(`Verify generate address :${address} passed.`)
//         })
//     })
// })
