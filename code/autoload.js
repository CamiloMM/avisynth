var fs     = require('fs');
var path   = require('path');
var loader = require('./loader');

// Since we are using a portable version of AviSynth, we don't have
// the benefit of magic autoloading.
// To cope with that, the user can supply a directory of stuff that must be
// autoloaded, and we'll proceed to load it all whenever we run a script.

module.exports = function autoload(dir) {
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
        var file = path.resolve(dir, files[i]);
        loader.load(file);
    }
};
