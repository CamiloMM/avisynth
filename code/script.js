var crypto       = require('crypto');
var loader       = require('./loader');
var autoload     = require('./autoload');
var pluginSystem = require('./plugins');
var system       = require('./system');

// Avisynth script constructor.
// Note that I don't like the overhead of having getters and setters,
// so the coding style here is "KISS". Defensive programming is for afflicted people.
function Script(code) {
    // Raw copy of the code.
    this.rawCode = code || '';

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

    // Adds one or more lines of code.
    this.code = function(code) {
        if (this.rawCode && this.rawCode[this.rawCode.length - 1] !== '\n') {
            this.rawCode += '\n';
        }
        this.rawCode += code + '\n';
    };

    // Gets the full code, including loading of scripts/plugins and all generated code.
    this.fullCode = function() {
        var fullCode = '', refs = this.allReferences();

        for (ref in refs) {
            if (refs[ref] === 'script') fullCode += 'Import("' + ref + '")\n';
            if (refs[ref] === 'plugin') fullCode += 'LoadPlugin("' + ref + '")\n';
        }

        if (this.rawCode.trim()) fullCode += this.rawCode + '\n';
        return fullCode;
    };

    // Gets the MD5 (in hex) of this script's contents.
    this.md5 = function() {
        var code = this.fullCode();
        var hash = crypto.createHash('md5');
        return hash.update(code).digest('hex');
    };

    // Gets a path to a generated file containing the contents of this script.
    // The path will be located in a temporary directory, and identified by
    // the script fullCode's MD5 hash (all generated scripts will be in the same folder).
    // Note that by the nature of this hash ID mechanism, once you get a path, the
    // file at that path is guaranteed to never change (even if you edit the instance).
    this.getPath = function() {
        var md5 = this.md5();
        var sub = 'scripts/' + md5 + '.avs';
        var path = system.temp(sub);
        if (path) return path;
        var path = system.tempWrite(sub, this.fullCode());
        return path;
    };

    // Renders a frame of the script to a path.
    this.renderFrame = function(time, path) {
        // Time is optional.
        if (!path) {
            path = time;
            time = 0;
        }
        // Current Working Directory where the script will be ran.
        var cwd = system.temp('scripts');
        // Make a copy of the current env.
        // By the way, this method of cloning is surprisingly the fastest!
        var env = JSON.parse(JSON.stringify(process.env));
        // We'll edit the env before running.
        env.PWD = cwd;
        env.PATH = system.buildPATH();
    };
};

Script.prototype = pluginSystem.pluginPrototype;

module.exports = Script;
