var fs   = require('fs');
var path = require('path');

// This is a map of absolute filename to 'script'/'plugin'.
var references = {};

// Loads a plugin or script globally.
// What this means is that it creates a reference to this plugin/script and loads it
// for all scripts ran in the future (even ones created in the past).
exports.load = function(file, ignoreErrors) {
    file = path.resolve(file);

    // if path does not exist or is not a file, throw.
    var isFile = false;
    try {
        if (!(isFile = fs.lstatSync(file).isFile())) {
            if (!ignoreErrors) throw new Error(file + ' is not a file!');
            return;
        }
    } catch (e) {
        if (!ignoreErrors) throw e;
        return;
    }

    if (/^\.avsi?$/i.test(path.extname(file))) return references[file] = 'script';
    if (/^\.dll$/i.test(path.extname(file))) return references[file] = 'plugin';
    if (!ignoreErrors) throw new Error(file + ' is of unknown type!');
};

// Get-only accessor.
exports.getReferences = function() {
    return references;
};
