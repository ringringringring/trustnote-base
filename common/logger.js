/* jslint node: true */

const log4js = require('log4js')
const path = require('path');
const p = path.resolve(__dirname, '../config/log.json');

log4js.configure(p);
const logger = log4js.getLogger('trustnote')

/**
* when running in a production environment, we don't print the debug information
*/
if (process.env.NODE_ENV !== 'production') {
    logger.level = 'debug'
}

module.exports = logger
