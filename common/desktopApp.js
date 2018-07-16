/* jslint node: true  */
// eslint-disable-line global-require

const fs = require('fs')
const path = require('path') // make browserify skip it
const logger = require('./logger.js')

function getAppsDataDir() {
    switch (process.platform) {
    case 'win32': return process.env.LOCALAPPDATA
    case 'linux': return `${process.env.HOME}/.config`
    case 'darwin': return `${process.env.HOME}/Library/Application Support`
    default: throw Error(`unknown platform ${process.platform}`)
    }
}

function getPackageJsonDir(startDir) {
    try {
        fs.accessSync(`${startDir}/package.json`)
        return startDir
    } catch (e) {
        const parentDir = path.dirname(startDir)
        if (parentDir === '/' || (process.platform === 'win32' && parentDir.match(/^\w:[/\\]\\$/))) {
            throw Error('no package.json found')
        }
        return getPackageJsonDir(parentDir)
    }
}

// app installation dir, this is where the topmost package.json resides
function getAppRootDir() {
    const mainModuleDir = path.dirname(process.mainModule.paths[0])
    return getPackageJsonDir(mainModuleDir)
}

// read app name from the topmost package.json
// eslint-disable-line global-require
function getAppName() {
    try {
        const appDir = getAppRootDir()
        const appPackage = require(`${appDir}/package.json`)
        return appPackage.name
    } catch (e) {
        logger.info(e)
        return ''
    }
}
getAppName()

// app data dir inside user's home directory
function getAppDataDir() {
    return (`${getAppsDataDir()}/${getAppName()}`)
}


exports.getAppRootDir = getAppRootDir
exports.getAppDataDir = getAppDataDir
