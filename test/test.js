/* eslint linebreak-style: ["error", "windows"] */

// This is the test example file, you can get and add examples if you need.

const mocha = require('mocha');
const assert = require('assert');

mocha.describe('This is the test example file, you can get and add examples if you need', () => {
    mocha.before(() => {
    // runs before all tests in this block
    });

    mocha.after(() => {
    // runs after all tests in this block
    });

    mocha.beforeEach(() => {
    // runs before each test in this block
    });

    mocha.afterEach(() => {
    // runs after each test in this block
    });

    // test cases , place all your real cases here
    mocha.it('test case example', () => {
        assert.equal(-1, [1, 2, 3].indexOf(4));
    });

    mocha.it('test async function call ', (done) => {
        const fs = require('fs');
        fs.readFile('./test/test.js', (err) => {
            if (err) {
                done(err);
            } else {
                done();
            }
        });
    });
});
