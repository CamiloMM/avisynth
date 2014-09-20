var path = require('path');

// The idea is not only to make the API simple, but also extending this module.
// Ideally, it will be clear to any newcomer how to go about adding features.
// If not, file an issue on GitHub :)

// Currently it's an object. In the future it may be a function-object or something.
var avisynth = {};

// "Loads" a plugin/script globally. It actually stores a reference, that will be loaded
// when running each script.
avisynth.load = require('./code/loader.js').load;

// Replacement for the lack of an autoloading system (because we're portable).
avisynth.autoload = require('./code/autoload.js');

// Autoload all the plugins we bundle.
avisynth.autoload(path.resolve(__dirname, 'bin/plugins'));

// Script constructor, note you can safely forget "new".
avisynth.Script = function() {
    return new require('./code/script')();
};

module.exports = avisynth;
