/* jslint node: true */

require('./singleton.js')

const { EventEmitter } = require('events')

const eventEmitter = new EventEmitter()
eventEmitter.setMaxListeners(20)
