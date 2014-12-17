var os    = require('os');
var fs    = require('fs');
var path  = require('path');
var utils = require('./utils');

// Determines whether system functionality has been initialized.
var initialized = false;

// Ensures that the system-related functionality has been initialized.
var init = exports.init = function() {
    if (initialized) return;
    initializeTempStorage();
    initialized = true;
};

// Cleans up everything done by system features initialization.
var cleanUp = exports.cleanUp = function() {
    // Only clean up if initialized.
    if (!initialized) return;
    utils.removeDirectory(tempStoragePath());
    initialized = false;
}

// Checks if a sub-path exists within the temporary directory for this session.
// If it exists, it will return the absolute path for the sub-path given.
// If it doesn't, it returns false.
exports.temp = function(sub) {
    init();
    var path = tempStoragePath(sub);
    if (fs.existsSync(path)) {
        return path;
    } else {
        return null;
    }
};

// Writes content to a file sub-path from the temp directory.
// It returns the full path to which the content was written.
exports.tempWrite = function(sub, content) {
    init();
    var path = tempStoragePath(sub);
    fs.writeFileSync(path, content);
    return path;
};

// Returns the full PATH variable that running scripts should use.
exports.buildPATH = function() {
    init();
    var original = process.env.PATH.split(path.delimiter);
    var additions = [path.resolve(__dirname, '../bin')];
    var result = original.concat(additions).join(path.delimiter);
    return result;
};

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

// We'll clean up before exiting. Taken from http://stackoverflow.com/a/14032965
process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) cleanUp();
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

// Do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup:true}));

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
