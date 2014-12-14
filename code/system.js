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

// Checks if a sub-path exists within the temporary directory for this session.
// If it exists, it will return the absolute path for the sub-path given.
// If it doesn't, it returns false.
exports.temp = function(sub) {
    var path = tempStoragePath(sub);
    if (fs.existsSync(path)) {
        return path;
    } else {
        return null;
    }
}

// Writes content to a file sub-path from the temp directory.
exports.tempWrite = function(sub, content) {
    var path = tempStoragePath(sub);
    fs.writeFileSync(path, content);
}

// Sets up the temp storage if it's not there.
function initializeTempStorage() {
    utils.ensureDirectory(tempStoragePath());
    utils.ensureDirectory(tempStoragePath('scripts'));
}

// Gets a path for the temp storage folder. This is a deterministic path,
// made from the pid, such as '/tmp/avisynth.js-1234'.
// Passing a "sub" parameter will return a sub-path like '/tmp/avisynth.js-1234/fooBar'.
function tempStoragePath(sub) {
    var extra = sub ? '/' + sub : '';
    return os.tmpdir() + '/avisynth.js-' + process.pid + extra;
}

// Cleans up everything done by system features initialization.
function cleanUp() {
    utils.removeDirectory(tempStoragePath());
}
