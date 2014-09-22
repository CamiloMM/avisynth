var fs   = require('fs');
var path = require('path');

// This is a map of absolute filename to 'script'/'plugin'.
exports.references = {};

// Loads a plugin or script globally.
// What this means is that it creates a reference to this plugin/script and loads it
// for all scripts ran in the future (even ones created in the past).
// The references parameter is for internal use only.
exports.load = function(file, ignoreErrors, references) {
    file = path.resolve(file);
    references = references || exports.references;

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
