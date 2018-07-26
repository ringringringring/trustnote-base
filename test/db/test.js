// Replace this with your target module file.

// const db = require('../../db/dataManager')
const mocha = require('mocha');
const assert = require('assert');

mocha.describe('Array', () => {
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
    mocha.it('10 should be not string instance', () => {
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
