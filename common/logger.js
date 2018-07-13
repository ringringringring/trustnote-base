/* jslint node: true */

const log4js = require('log4js')

log4js.configure({
    replaceConsole: true, // whether or not to replace console.log
    appenders: {
        out: { type: 'console' },
        info: {
            type: 'dateFile', filename: './logs/trustnote.log', pattern: '.yyyy-MM-dd', compress: true, level: 'info',
        },
        debug: {
            type: 'dateFile', filename: './logs/trustnote.log', pattern: '.yyyy-MM-dd', compress: true, level: 'debug',
        },
        warn: {
            type: 'dateFile', filename: './logs/trustnote.log', pattern: '.yyyy-MM-dd', compress: true, level: 'warn',
        },
        error: {
            type: 'dateFile', filename: './logs/trustnote.log', pattern: '.yyyy-MM-dd', compress: true, level: 'error',
        },
        fatal: {
            type: 'dateFile', filename: './logs/trustnote.log', pattern: '.yyyy-MM-dd', compress: true, level: 'fatal',
        },
    },
    categories: {
        default: { appenders: ['out', 'info'], level: 'info' },
        debug: { appenders: ['out', 'debug'], level: 'debug' },
        warn: { appenders: ['out', 'warn'], level: 'warn' },
        error: { appenders: ['out', 'error'], level: 'error' },
        fatal: { appenders: ['out', 'fatal'], level: 'fatal' },
    },
})

// let levels = {
//   trace: log4js.levels.TRACE,
//   debug: log4js.levels.DEBUG,
//   info: log4js.levels.INFO,
//   warn: log4js.levels.WARN,
//   error: log4js.levels.ERROR,
//   fatal: log4js.levels.FATAL,
// };

function info(infoMessage) {
    const logger = log4js.getLogger()
    logger.info(infoMessage)
}

function debug(debugMessage) {
    const logger = log4js.getLogger('debug')
    logger.debug(debugMessage)
}

function warn(warnMessage) {
    const logger = log4js.getLogger('warn')
    logger.warn(warnMessage)
}

function error(errorMessage) {
    const logger = log4js.getLogger('error')
    logger.error(errorMessage)
}

function fatal(errorMessage) {
    const logger = log4js.getLogger('fatal')
    logger.fatal(errorMessage)
}

exports.info = info
exports.debug = debug
exports.warn = warn
exports.error = error
exports.fatal = fatal
