/* jslint node: true */

const childProcess = require('child_process')
const conf = require('../config/conf.js')
const mail = require('./mail.js')
const logger = require('./logger.js')

function write(str) {
    logger.info(`${Date().toString()}: ${str}`)
}

function checkDaemon(daemonName, handleResult) {
    childProcess.exec('ps x', (err, stdout, stderr) => {
        if (err) {
            throw Error(`ps x failed: ${err}`)
        }
        if (stderr) {
            throw Error(`ps x stderr: ${stderr}`)
        }
        let bFound = false
        stdout.split('\n').forEach((line) => {
            if (line.indexOf(daemonName) >= 0) {
                bFound = true
                write(line)
            }
        })
        handleResult(bFound)
    })
}

function notifyAdmin(message) {
    write(message)
    if (!conf.admin_email || !conf.from_email) {
        write('cannot notify admin as admin_email or from_email are not defined')
    } else {
        mail.sendmail({
            to: conf.admin_email,
            from: conf.from_email,
            subject: message,
            body: `Check daemon:\n${message}`,
        })
    }
}

function checkDaemonAndNotify(daemonName) {
    checkDaemon(daemonName, (bFound) => {
        if (!bFound) {
            notifyAdmin(`daemon ${daemonName} is down`)
        }
    })
}

function checkDaemonAndRestart(daemonName, startCommand) {
    checkDaemon(daemonName, (bFound) => {
        if (bFound) {
            return
        }
        notifyAdmin(`daemon ${daemonName} is down, trying to restart ${startCommand}`)
        childProcess.exec(startCommand).unref()
        process.exit()
    })
}

exports.checkDaemon = checkDaemon
exports.checkDaemonAndNotify = checkDaemonAndNotify
exports.checkDaemonAndRestart = checkDaemonAndRestart
