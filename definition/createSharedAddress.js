/* jslint node: true */

const objectHash = require('../encrypt/objectHash.js')

const conf = {}
const network = {}
const eventBus = {}
const db = {}
const definition = {}
const validationUtils = {}
const device = {}

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


function handleNewSharedAddress(body) {
    return new Promise((resolve, reject) => {
        if (!validationUtils.isArrayOfLength(body.definition, 2)) return reject(Error('invalid definition'))
        if (typeof body.signers !== 'object' || Object.keys(body.signers).length === 0) return reject(Error('invalid signers'))
        if (body.address !== objectHash.getChash160(body.definition)) return reject(Error('definition doesn\'t match its c-hash'))
        Object.values(body.signers).forEach((signerInfo) => {
            if (signerInfo.address && !validationUtils.isValidAddress(signerInfo.address)) {
                return reject(Error(`invalid member address: ${signerInfo.address}`))
            }
            return undefined
        })
        return resolve()
    })
}


function determineIfIncludesMe(assocSignersByPath) {
    return new Promise(async (resolve, reject) => {
        const assocMemberAddresses = {}
        Object.values(assocSignersByPath).forEach((signerInfo) => {
            if (signerInfo.address) assocMemberAddresses[signerInfo.address] = true
        })
        const arrMemberAddresses = Object.keys(assocMemberAddresses)
        if (arrMemberAddresses.length === 0) return reject(Error('no member addresses?'))
        const rows = await db.selectSharedAddressUnionMyAddress(arrMemberAddresses)
        if (rows.length <= 0) {
            reject(Error('I am not a member of this shared address'))
        }
        return resolve()
    })
}

function validateAddressDefinition(arrDefinition) {
    return new Promise(async (resolve, reject) => {
        const objFakeUnit = { authors: [] }
        const objFakeValidationState = {
            last_ball_mci: MAX_INT32,
            bAllowUnresolvedInnerDefinitions: true,
        }
        const res = await definition.validateDefinition(db, arrDefinition, objFakeUnit,
            objFakeValidationState, false)
        if (res) return reject(Error(res))
        return resolve()
    })
}

async function forwardNewSharedAddressToCosignersOfMyMemberAddresses(address,
    arrDefinition, assocSignersByPath) {
    const assocMyMemberAddresses = {}
    Object.values(assocSignersByPath).forEach((signerInfo) => {
        if (signerInfo.device_address === device.getMyDeviceAddress() && signerInfo.address) {
            assocMyMemberAddresses[signerInfo.address] = true
        }
    })
    const arrMyMemberAddresses = Object.keys(assocMyMemberAddresses)
    if (arrMyMemberAddresses.length === 0) throw Error('my member addresses not found')
    const rows = await db.selectSharedAddressPartner(arrMyMemberAddresses,
        device.getMyDeviceAddress)
    rows.forEach((row) => {
        sendNewSharedAddress(row.device_address, address,
            arrDefinition, assocSignersByPath, true)
    })
}

function addNewSharedAddress(address, arrDefinition, assocSignersByPath) {
    return new Promise((resolve) => {
        db.insertSharedAddreess(address, JSON.stringify(arrDefinition))
        const arrQueries = []
        Object.keys(assocSignersByPath).forEach((signingPath) => {
            const signerInfo = assocSignersByPath[signingPath]
            db.insertSharedAddreessSigningPaths(address, signerInfo.address, signingPath,
                signerInfo.member_signing_path, signerInfo.device_address)
        })
        resolve(arrQueries)
    })
}

async function createNewSharedAddress(arrDefinition, assocSignersByPath) {
    if (!includesMyDeviceAddress(assocSignersByPath)) {
        throw Error('my device address not mentioned')
    }
    const address = objectHash.getChash160(arrDefinition)
    const body = await handleNewSharedAddress({
        address,
        definition: arrDefinition,
        signers: assocSignersByPath,
    })
    await determineIfIncludesMe(body.signers)
    await validateAddressDefinition(body.definition)
    const arrQueries = await addNewSharedAddress(body.address, body.definition,
        body.signers, body.forward)
    arrQueries.forEach(() => {
        // console.log(`added new shared address ${address}`)
        eventBus.emit(`new_address-${address}`)
        if (conf.bLight) {
            network.addLightWatchedAddress(address)
        }
        if (!body.forward) {
            forwardNewSharedAddressToCosignersOfMyMemberAddresses(address,
                arrDefinition, assocSignersByPath)
        }
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
    })
}

exports.createNewSharedAddress = createNewSharedAddress
