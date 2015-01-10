var os            = require('os');
var fs            = require('fs');
var path          = require('path');
var utils         = require('./utils');
var spawn         = require('child_process').spawn;
var AvisynthError = require('./errors').AvisynthError;

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

// The path to binaries has to be specified due to PATH shenanigans.
exports.ffmpeg  = path.resolve(__dirname, '../bin/ffmpeg.exe');
exports.avslint = path.resolve(__dirname, '../bin/avslint.exe');
exports.avsinfo = path.resolve(__dirname, '../bin/avsinfo.exe');

// Generalized method of calling native executables.
// We make the assumption that avisynth/bin must be in the path,
// and that cwd can be relative to the temp directory.
exports.spawn = function(cmd, args, cwd, internal, callback) {
    // Internal calls can make the callback recieve extra info.
    if (!callback) {
        callback = internal;
        internal = false;
    }

    // Current Working Directory where the command will be ran.
    var cwd = exports.temp(cwd);

    // Make a copy of the current env.
    // By the way, this method of cloning is surprisingly the fastest!
    var env = JSON.parse(JSON.stringify(process.env));

    // We'll edit the env before running.
    env.PWD = cwd;
    env.PATH = exports.buildPATH();

    // We're using spawn instead of exec because it handles arguments better.
    // (In other words, we'd hate having to deal with shell-dependent escaping).
    var child = spawn(cmd, args, {cwd: cwd, env: env});

    // The callback is only called once; on success or on first error.
    var called = false;
    function call(err) {
        /* istanbul ignore if: should never happen */ if (called) return;
        called = true; // Putting it before the actual callback because event loop.
        if (callback) {
            if (internal) {
                callback(returnCode, stdout, stderr)
            } else {
                callback(err);
            }
        }
    }

    // We collect stdout/stderr stream data.
    var stdout = '';
    child.stdout.on('data', function (data) { stdout += data.toString(); });
    var stderr = '';
    child.stderr.on('data', function (data) { stderr += data.toString(); });

    child.on('error', call);

    var returnCode = 0xB00B5;
    child.on('close', function (code) {
        var err;
        if (returnCode = code) err = new AvisynthError(stderr);

        // A callback, if passed, will be called with or without error.
        call(err);
    });
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
    var dir = os.tmpdir() + '/avisynth.js-' + process.pid;
    return sub ? path.resolve(dir, sub) : dir;
}

// We'll clean up before exiting. Taken from http://stackoverflow.com/a/14032965
process.stdin.resume(); //so the program will not close instantly

/* istanbul ignore next: this only gets called when the process exits. */
function exitHandler(options, err) {
    if (options.cleanup) cleanUp();
    if (err && err.stack) console.log(err.stack);
    if (options.exit) process.exit();
}

// Do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup:true}));

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
