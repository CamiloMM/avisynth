var loader       = require('./loader');
var autoload     = require('./autoload');
var pluginSystem = require('./plugins');

// Avisynth script constructor.
// Note that I don't like the overhead of having getters and setters,
// so the coding style here is "KISS". Defensive programming is for afflicted people.
function Script(code) {
    // Raw copy of the code.
    this.code = code || '';

    // These references work like in the loader. See loader.js.
    // This is not intended for direct insertion, using the functions below is safer.
    this.references = {};

    // Similar to avisynth.load, but local to one script.
    this.load = function(file, ignoreErrors) {
        loader.load(file, ignoreErrors, this.references);
    };

    // Similar to avisynth.autoload, but local to one script.
    this.autoload = function(dir) {
        autoload(dir, this.load.bind(this));
    };

    // Get a list of references that apply to this script (global + local).
    this.allReferences = function() {
        var refs = {};
        for (var i in loader.references) refs[i] = loader.references[i];
        for (var i in   this.references) refs[i] =   this.references[i];
        return refs;
    };

    // Gets the full code, including loading of scripts/plugins and all generated code.
    this.fullCode = function() {
        var fullCode = '', refs = this.allReferences();

        for (ref in refs) {
            if (refs[ref] === 'script') fullCode += 'Import("' + ref + '")\n';
            if (refs[ref] === 'plugin') fullCode += 'LoadPlugin("' + ref + '")\n';
        }

        if (this.code.trim()) fullCode += this.code + '\n';
        return fullCode;
    };
};

Script.prototype = pluginSystem.pluginPrototype;

module.exports = Script;