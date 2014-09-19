
// The idea is not only to make the API simple, but also extending this module.
// Ideally, it will be clear to any newcomer how to go about adding features.
// If not, file an issue on GitHub :)

// Currently it's an object. In the future it may be a function-object or something.
var avisynth = {}

// Script constructor, required as necessary.
avisynth.Script = function() {
    return new require('./code/script')();
}

module.exports = avisynth;