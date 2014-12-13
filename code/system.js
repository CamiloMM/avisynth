var os    = require('os');
var fs    = require('fs');
var utils = require('./utils');

// Determines whether system functionality has been initialized.
var initialized = false;

// Ensures that the system-related functionality has been initialized.
var init = exports.init = function init() {
    if (initialized) return;
    initializeTempStorage();
    initialized = true;
};

// Sets up the temp storage if it's not there.
function initializeTempStorage() {
    utils.ensureDirectory(tempStorageName());
    utils.ensureDirectory(tempStorageName('scripts'));
}

// Gets a name for the temp storage folder. This is a deterministic name,
// made from the pid, such as '/tmp/avisynth.js-1234'.
// Passing a "sub" parameter will return a sub-path like '/tmp/avisynth.js-1234/fooBar'.
function tempStorageName(sub) {
    var extra = sub ? '/' + sub : '';
    return os.tmpdir() + '/avisynth.js-' + process.pid + extra;
}

// Cleans up everything done by system features initialization.
function cleanUp() {
    utils.removeDirectory(tempStorageName());
}
