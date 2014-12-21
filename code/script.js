var crypto        = require('crypto');
var loader        = require('./loader');
var autoload      = require('./autoload');
var pluginSystem  = require('./plugins');
var system        = require('./system');
var utils         = require('./utils');
var spawn         = require('child_process').spawn;
var AvisynthError = require('./errors').AvisynthError;

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
    // The callback, if given, will be executed once the frame is rendered,
    // with an error parameter (null unless an error is encountered).
    this.renderFrame = function(time, path, callback) {
        // Time is optional.
        if (!utils.isNumeric(time)) {
            callback = path;
            path = time;
            time = 0;
        }

        // Path must be absolute.
        path = require('path').resolve(path);

        // Current Working Directory where the script will be ran.
        var cwd = system.temp('scripts');

        // Make a copy of the current env.
        // By the way, this method of cloning is surprisingly the fastest!
        var env = JSON.parse(JSON.stringify(process.env));

        // We'll edit the env before running.
        env.PWD = cwd;
        env.PATH = system.buildPATH();

        // This is the command that will be ran:
        var cmd = system.ffmpeg; // It's not technically in the PATH yet!
        var args = ['-hide_banner', '-loglevel', 'error', '-ss', time,
                    '-i', this.getPath(), '-frames:v', 1, path];

        // We're using spawn instead of exec because it handles arguments better.
        // (In other words, we'd hate having to deal with shell-dependent escaping).
        var ffmpeg = spawn(cmd, args, {cwd: cwd, env: env});

        // The callback is only called once; on success or on first error.
        var called = false;
        function call(err) {
            if (called) return;
            if (callback) callback(err);
            called = true;
        }

        // We collect stderr data so errors can be gathered from it.
        var stderr = '';
        ffmpeg.stderr.on('data', function (data) { stderr += data.toString(); });

        ffmpeg.on('error', call);

        ffmpeg.on('close', function (code) {
            var err;
            if (code) err = new AvisynthError(stderr);

            // A callback, if passed, will be called with or without error.
            call(err);
        });
    };
};

Script.prototype = pluginSystem.pluginPrototype;

module.exports = Script;
