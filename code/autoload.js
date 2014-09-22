var fs     = require('fs');
var path   = require('path');

// Since we are using a portable version of AviSynth, we don't have
// the benefit of magic autoloading.
// To cope with that, the user can supply a directory of stuff that must be
// autoloaded, and we'll proceed to load it all whenever we run a script.
// The loader parameter is for internal use only.
module.exports = function autoload(dir, loader) {
    loader = loader || require('./loader').load;
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
        var file = path.resolve(dir, files[i]);
        loader(file, true);
    }
};
