/* jslint node: true */
'use strict'

const log4js = require('log4js');
log4js.configure('./config/log.json');
const logger = log4js.getLogger('trustnote');

/**
* when running in a production environment, we don't print the debug information
*/
if (process.env.NODE_ENV !== 'production') {
    logger.level = 'debug'
}

module.exports = logger
