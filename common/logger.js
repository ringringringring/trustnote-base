/*jslint node: true */
"use strict";

var log4js = require('log4js');

log4js.configure({
    replaceConsole: true,        // whether or not to replace console.log
    appenders: {
        out: {type: 'console'},
        info: {type: 'dateFile', filename: './logs/infos.log', pattern: '.yyyy-MM-dd', compress: true , level: 'info'},
        debug: {type: 'dateFile', filename: './logs/debugs.log', pattern: '.yyyy-MM-dd', compress: true , level: 'debug'},
        warn: {type: 'dateFile', filename: './logs/warns.log', pattern: '.yyyy-MM-dd', compress: true , level: 'warn'},
        error: {type: 'dateFile', filename: './logs/errors.log', pattern: '.yyyy-MM-dd', compress: true, level: 'error'}
    },
    categories: {
        default: {appenders: ['out', 'info'], level: 'info'},
        debug: {appenders: ['out', 'debug'], level: 'debug'},
        warn: {appenders: ['out', 'warn'], level: 'warn'},
        error: {appenders: ['out', 'error'], level: 'error'}
    }
});

var levels = {
    'trace': log4js.levels.TRACE,
    'debug': log4js.levels.DEBUG,
    'info': log4js.levels.INFO,
    'warn': log4js.levels.WARN,
    'error': log4js.levels.ERROR,
    'fatal': log4js.levels.FATAL
};

function info(info){
    var logger = log4js.getLogger();
    logger.info(info);
}

function debug(debug){
    var logger = log4js.getLogger("debug");
    logger.debug(debug);
}

function warn(warn){
    var logger = log4js.getLogger("warn");
    logger.warn(warn);
}

function error(errorMessage){
    var logger = log4js.getLogger("error");
    logger.error(errorMessage);
}

exports.info = info;
exports.debug = debug;
exports.warn = warn;
exports.error = error;
