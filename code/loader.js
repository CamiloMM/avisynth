var fs   = require('fs');
var path = require('path');

// This is a map of absolute filename to 'script'/'plugin'.
var references = {};

// Loads a plugin or script globally.
// What this means is that it creates a reference to this plugin/script and loads it
// for all scripts ran in the future (even ones created in the past).
exports.load = function(file) {
    file = path.resolve(file);

    // if path does not exist or is not a file, throw.
    if (!fs.lstatSync(file).isFile()) throw new Error(file + ' is not a file!');

    if (/^\.avsi?$/i.test(path.extname(file)) {
        references[file] = 'script';
    } else if (/^\.dll$/i.test(path.extname(file)) {
        references[file] = 'plugin';
    }
};

// Get-only accessor.
exports.getReferences = function() {
    return references;
};
