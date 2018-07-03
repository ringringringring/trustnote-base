/*jslint node: true */
"use strict";

var mutex = require('../common/mutex.js');

function test(key){
	var loc = "localvar"+key;
	mutex.lock(
		[key], 
		function(cb){
			console.log("doing "+key);
			setTimeout(function(){
				console.log("done "+key);
				cb("arg1", "arg2");
			}, 1000)
		},
		function(arg1, arg2){
			console.log("got "+arg1+", "+arg2+", loc="+loc);
		}
	);
}

test("key1");
test("key2");
