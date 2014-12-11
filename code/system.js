var os = require('os');
var fs = require('fs');

// TODO: this file will contain system helpers.

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
    var path = os.tmpdir() + '/' + tempStorageName();
    fs.mkdirSync(path);
}

// Gets a name for the temp storage folder. This is a deterministic name,
// made from the pid, such as 'avisynth.js-1234'.
function tempStorageName() {
    return 'avisynth.js-' + process.pid;
}
