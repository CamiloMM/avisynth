var crypto        = require('crypto');
var loader        = require('./loader');
var autoload      = require('./autoload');
var pluginSystem  = require('./plugins');
var system        = require('./system');
var utils         = require('./utils');
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

        for (var ref in refs) {
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

        // This is the command that will be ran:
        var args = ['-hide_banner', '-y', '-loglevel', 'error', '-ss',
                    time, '-i', this.getPath(), '-frames:v', 1, path];

        system.spawn(system.ffmpeg, args, 'scripts', callback);
    };

    // "Just runs" the script; this is useful if you want the script to
    // do something but don't care about its output (e.g., writing files).
    this.run = function(callback) {
        var path = this.getPath();
        var args = ['-hide_banner', '-loglevel', 'error', '-i', path, '-f', 'null', '-'];
        system.spawn(system.ffmpeg, args, 'scripts', callback);
    };

    // Lints the script. The callback will be called with an "error" argument
    // where error is an AvisynthError, if any.
    this.lint = function(callback) {
        system.spawn(system.avslint, [this.getPath()], 'scripts', callback);
    };

    // Returns raw info on the running script, in machine-readable form.
    // The callback is called with (error, info).
    this.info = function(callback) {
        var arg = ['-m', this.getPath()];
        system.spawn(system.avsinfo, arg, 'scripts', true, function(code, stdout, stderr) {
            if (code && code !== 2) {
                // This probably means status code 5, which happens on crashes,
                // or a status code I'm not aware of. Either way, it's unexpected.
                // Note that it happens when code does not produce output.
                var message = 'Unexpected condition (' + code + ').\n'
                            + 'This may be cause by a blank script';
                return callback(new AvisynthError(message));
            }

            // This means no output could be analyzed.
            // Unfortunately, audio-only clips will not be analyzed by avsinfo.
            if (!stdout) return callback(undefined, null);

            // If it does not contain audio, the last 7 properties will be undefined.
            var properties = [
                'width',         // Video width in pixels.
                'height',        // Video height in pixels.
                'ratio',         // Aspect ratio, such as '16:9'.
                'fps',           // Frames per second as a number, like 29.97.
                'fpsFraction',   // Frames per second as a fraction, like '30000/1001'.
                'videoTime',     // Video length in seconds, like 123.456.
                'frameCount',    // Frame count.
                'colorspace',    // Colorspace, such as 'RGB' or 'YV12'.
                'bitsPerPixel',  // Number of bits per pixel.
                'interlaceType', // Can be 'field-based' or 'frame-based'.
                'fieldOrder',    // 'TFF' (Top Field First) or 'BFF' (Bottom Field First).
                'channels',      // Number of channels.                   May be undefined.
                'bitsPerSample', // Number of bits per audio sample.      May be undefined.
                'sampleType',    // Sample type can be 'int' or 'float'.  May be undefined.
                'audioTime',     // Audio length in seconds.              May be undefined.
                'samplingRate',  // Sampling rate in Hertz (e.g., 44100). May be undefined.
                'sampleCount',   // Number of samples (time * rate).      May be undefined.
                'blockSize',     // Block size of audio samples in Bytes. May be undefined.
            ];

            // Each of the properties above should correspond to a line in the stdout.
            var values = stdout.split(/\r?\n/); // Windows works in CRLF, remember.
            var info = utils.zipObject(properties, values);

            // Cast some properties to numbers. Without having to type keys twice, hehe.
            info.width         *= 1;
            info.height        *= 1;
            info.fps           *= 1;
            info.videoTime     *= 1;
            info.frameCount    *= 1;
            info.bitsPerPixel  *= 1;
            info.interlaceType *= 1;
            info.fieldOrder    *= 1;
            info.channels      *= 1;
            info.bitsPerSample *= 1;
            info.sampleType    *= 1;
            info.audioTime     *= 1;
            info.samplingRate  *= 1;
            info.sampleCount   *= 1;
            info.blockSize     *= 1;

            // Convert some bools to more identifiable strings.
            var enums = {
                interlaceType: ['frame-based', 'field-based'],
                fieldOrder:    ['BFF'        , 'TFF'        ],
                sampleType:    ['float'      , 'int'        ],
            };

            // If you're confused: info[prop] will either be 0, 1 or undefined.
            for (var prop in enums) info[prop] = enums[prop][info[prop]];

            callback(undefined, info); // No error, and there's your info.
        });
    };
}

Script.prototype = pluginSystem.pluginPrototype;

module.exports = Script;
