/* jslint node: true */

const _ = require('lodash')
require('./singleton.js')
const logger = require('./logger.js')

const arrQueuedJobs = []
const arrLockedKeyArrays = []

function getCountOfQueuedJobs() {
    return arrQueuedJobs.length
}

function getCountOfLocks() {
    return arrLockedKeyArrays.length
}

function isAnyOfKeysLocked(arrKeys) {
    for (let i = 0; i < arrLockedKeyArrays.length; i++) {
        const arrLockedKeys = arrLockedKeyArrays[i]
        for (let j = 0; j < arrLockedKeys.length; j++) {
            if (arrKeys.indexOf(arrLockedKeys[j]) !== -1) {
                return true
            }
        }
    }
    return false
}

function release(arrKeys) {
    for (let i = 0; i < arrLockedKeyArrays.length; i++) {
        if (_.isEqual(arrKeys, arrLockedKeyArrays[i])) {
            arrLockedKeyArrays.splice(i, 1)
            return
        }
    }
}

function handleQueue() {
    for (let i = 0; i < arrQueuedJobs.length; i++) {
        const job = arrQueuedJobs[i]
        if (!isAnyOfKeysLocked(job.arrKeys)) {
            arrQueuedJobs.splice(i, 1)
            exec(job.arrKeys, job.proc, job.next_proc)
            i -= 1 // we've just removed one item
        }
    }
}

function exec(arrKeys, proc, nextProc, ...args) {
    arrLockedKeyArrays.push(arrKeys)
    let bLocked = true
    proc(() => {
        if (!bLocked) {
            throw Error('double unlock?')
        }
        bLocked = false
        release(arrKeys)
        if (nextProc) {
            nextProc.apply(nextProc, args)
        }
        handleQueue()
    })
}


function lock(arrKeys, proc, nextProc) {
    if (isAnyOfKeysLocked(arrKeys)) {
        arrQueuedJobs.push({
            arrKeys, proc, nextProc, ts: Date.now(),
        })
    } else { exec(arrKeys, proc, nextProc) }
}

function lockOrSkip(arrKeys, proc, nextProc) {
    if (isAnyOfKeysLocked(arrKeys)) {
        if (nextProc) { nextProc() }
    } else { exec(arrKeys, proc, nextProc) }
}

setInterval(() => {
    logger.info(`queued jobs: ${JSON.stringify(arrQueuedJobs.map(job => job.arrKeys))}, locked keys: ${JSON.stringify(arrLockedKeyArrays)}`)
}, 10000)

exports.lock = lock
exports.lockOrSkip = lockOrSkip
exports.getCountOfQueuedJobs = getCountOfQueuedJobs
exports.getCountOfLocks = getCountOfLocks
