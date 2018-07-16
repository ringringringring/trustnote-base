/* jslint node: true */
/* eslint no-underscore-dangle: ["off", { "allow": ["foo_", "_bar"] }] */

if (global._bTrustNoteCommonLoaded) {
    throw Error(`Looks like you are loading multiple copies of TrustNoteCommon, which is not supported.\n
        Runnung 'npm dedupe' might help.`)
}

global._bTrustNoteCommonLoaded = true
