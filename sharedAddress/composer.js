/* jslint node: true */

const objectHash = require('../encrypt/objectHash.js')
const db = require('../db/db.js')

const validationUtils = {}
const device = {}
const eventBus = {}
const definition = {}
const conf = {}
const network = {}

const MAX_INT32 = (2 ** 31) - 1

function sendNewSharedAddress(deviceAddress, address, arrDefinition,
    assocSignersByPath, bForwarded) {
    device.sendMessageToDevice(deviceAddress, 'new_shared_address', {
        address, definition: arrDefinition, signers: assocSignersByPath, forwarded: bForwarded,
    })
}

function includesMyDeviceAddress(assocSignersByPath) {
    Object.values(assocSignersByPath).forEach((signerInfo) => {
        if (signerInfo.device_address === device.getMyDeviceAddress()) return true
        return undefined
    })
    return false
}

function determineIfIncludesMe(assocSignersByPath, handleResult) {
    const assocMemberAddresses = {}
    Object.values(assocSignersByPath).forEach((signerInfo) => {
        if (signerInfo.address) assocMemberAddresses[signerInfo.address] = true
    })
    const arrMemberAddresses = Object.keys(assocMemberAddresses)
    if (arrMemberAddresses.length === 0) return handleResult('no member addresses?')
    db.query(
        'SELECT address FROM my_addresses WHERE address IN(?) UNION SELECT shared_address AS address FROM shared_addresses WHERE shared_address IN(?)',
        [arrMemberAddresses, arrMemberAddresses],
        (rows) => {
            handleResult(rows.length > 0 ? null : 'I am not a member of this shared address')
        },
    )
    return undefined
}

function validateAddressDefinition(arrDefinition, handleResult) {
    const objFakeUnit = { authors: [] }
    const objFakeValidationState = {
        last_ball_mci: MAX_INT32,
        bAllowUnresolvedInnerDefinitions: true,
    }
    definition.validateDefinition(db, arrDefinition, objFakeUnit,
        objFakeValidationState, false, (err) => {
            if (err) return handleResult(err)
            return handleResult()
        })
}

function forwardNewSharedAddressToCosignersOfMyMemberAddresses(address,
    arrDefinition, assocSignersByPath) {
    const assocMyMemberAddresses = {}
    Object.values(assocSignersByPath).forEach((signerInfo) => {
        if (signerInfo.device_address === device.getMyDeviceAddress() && signerInfo.address) {
            assocMyMemberAddresses[signerInfo.address] = true
        }
    })
    const arrMyMemberAddresses = Object.keys(assocMyMemberAddresses)
    if (arrMyMemberAddresses.length === 0) throw Error('my member addresses not found')
    db.query(
        'SELECT DISTINCT device_address FROM my_addresses JOIN wallet_signing_paths USING(wallet) WHERE address IN(?) AND device_address!=?',
        [arrMyMemberAddresses, device.getMyDeviceAddress()],
        (rows) => {
            rows.forEach((row) => {
                sendNewSharedAddress(row.device_address, address,
                    arrDefinition, assocSignersByPath, true)
            })
        },
    )
}

function addNewSharedAddress(address, arrDefinition, assocSignersByPath, bForwarded, onDone) {
    db.query(
        `INSERT ${db.getIgnore()} INTO shared_addresses (shared_address, definition) VALUES (?,?)`,
        [address, JSON.stringify(arrDefinition)],
        () => {
            const arrQueries = []
            Object.keys(assocSignersByPath).forEach((signingPath) => {
                const signerInfo = assocSignersByPath[signingPath]
                db.addQuery(arrQueries,
                    `INSERT ${db.getIgnore()} INTO shared_address_signing_paths
                        (shared_address, address, signing_path, member_signing_path, device_address) VALUES (?,?,?,?,?)`,
                    [address, signerInfo.address, signingPath,
                        signerInfo.member_signing_path, signerInfo.device_address])
            })
            arrQueries.forEach(() => {
                console.log(`added new shared address ${address}`)
                eventBus.emit(`new_address-${address}`)
                if (conf.bLight) {
                    network.addLightWatchedAddress(address)
                }
                if (!bForwarded) {
                    forwardNewSharedAddressToCosignersOfMyMemberAddresses(address,
                        arrDefinition, assocSignersByPath)
                }
                if (onDone) onDone()
            })
        },
    )
}

function handleNewSharedAddress(body, callbacks) {
    if (!validationUtils.isArrayOfLength(body.definition, 2)) return callbacks.ifError('invalid definition')
    if (typeof body.signers !== 'object' || Object.keys(body.signers).length === 0) return callbacks.ifError('invalid signers')
    if (body.address !== objectHash.getChash160(body.definition)) return callbacks.ifError('definition doesn\'t match its c-hash')
    Object.values(body.signers).forEach((signerInfo) => {
        if (signerInfo.address && !validationUtils.isValidAddress(signerInfo.address)) return callbacks.ifError(`invalid member address: ${signerInfo.address}`)
        return undefined
    })
    determineIfIncludesMe(body.signers, (err) => {
        if (err) return callbacks.ifError(err)
        return validateAddressDefinition(body.definition, (error) => {
            if (error) return callbacks.ifError(err)
            return addNewSharedAddress(body.address, body.definition,
                body.signers, body.forwarded, callbacks.ifOk)
        })
    })
    return undefined
}

function createNewSharedAddress(arrDefinition, assocSignersByPath, callbacks) {
    if (!includesMyDeviceAddress(assocSignersByPath)) return callbacks.ifError('my device address not mentioned')
    const address = objectHash.getChash160(arrDefinition)
    return handleNewSharedAddress({
        address,
        definition: arrDefinition,
        signers: assocSignersByPath,
    }, {
        ifError: callbacks.ifError,
        ifOk() {
            // share the new address with all cosigners
            const arrDeviceAddresses = []
            Object.values(assocSignersByPath).forEach((signerInfo) => {
                if (signerInfo.device_address !== device.getMyDeviceAddress()
                && arrDeviceAddresses.indexOf(signerInfo.device_address) === -1) {
                    arrDeviceAddresses.push(signerInfo.device_address)
                }
            })
            arrDeviceAddresses.forEach((deviceAddress) => {
                sendNewSharedAddress(deviceAddress, address, arrDefinition, assocSignersByPath)
            })
            callbacks.ifOk(address)
        },
    })
}

exports.createNewSharedAddress = createNewSharedAddress
