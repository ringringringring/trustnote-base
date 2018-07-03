/*jslint node: true */
"use strict";

if (global._bTrustNoteCommonLoaded)
	throw Error("Looks like you are loading multiple copies of TrustNoteCommon, which is not supported.\nRunnung 'npm dedupe' might help.");

global._bTrustNoteCommonLoaded = true;
