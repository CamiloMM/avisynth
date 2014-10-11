var path          = require('path');
var AvisynthError = require('./errors').AvisynthError;
var pluginSystem  = require('./plugin-system');
var addPlugin     = pluginSystem.addPlugin;

// This file contains an implementation of each of the various core filters
// bundled with AviSynth, to ease their usage in script objects.

// We'll first define some methods to improve code re-use.

function isDefined(value) {
    return typeof value !== 'undefined' && value !== null;
}

function checkType(value, allowed) {
    if (value && allowed.indexOf(value) === -1) {
        throw new AvisynthError('bad type (' + value + ')! allowed values: ' + allowed);
    }
}

// This attempts to be a shared implementation that covers most use-cases.
// It returns the function for a core filter, built from a description of "how it works".
// A quick note on modifiers:
// q: quoted.
// p: file path (resolved to absolute), implies q.
// f: forced file path, implies p.
// n: not a path (actually, not a string). Throws if a string is given.
// t: a type, this is checked against options.types. Implies q.
function coreFilter(name, options, types) {

    // Lazyness taken to new heights. First parameter can succintly describe some filters.
    // If combined with defining the second parameter, that will represent the types.
    if (name.indexOf('(') !== -1) {
        var matches = name.match(/([^() ]*)\s*(\((.*)\))?/);
        name = matches[1];
        if (matches[3]) {
            if (options) types = options;
            options = matches[3];
        }
    }

    // Conveniently cast options/types from string to array, for the condition below.
    if (typeof options === 'string') options = options.split(/\s*,\s*/);
    if (typeof types   === 'string') types   =   types.split(/\s*,\s*/);

    // If options is an array instead of object, it is treated as options.params.
    // Optionally, options.types can be inlined too, by passing a second array.
    if (options && isDefined(options.length)) {
        options = {params: options, types: types};
    }

    // We also support shorthands for the options properties.
    if (options.p) options.params = options.p;
    if (options.t) options.types  = options.t;

    // Similar to a cast above, but for options' properties.
    if (typeof options.params === 'string') options.params = options.params.split(/\s*,\s*/);
    if (typeof options.types  === 'string') options.types  =  options.types.split(/\s*,\s*/);

    // Here begins the actual creation of the plugin.
    return function() {
        // Construct parameter definitons.
        var definitions = [];
        if (options.params) options.params.forEach(function(param) {
            // Each item in options.params should follow modifier:identifier format.
            var matches = param.match(/^((.*):)?(.*)$/);
            definitions.push({modifier: matches[2], identifier: matches[3]});
        });

        // Construct parameter list.
        var params = [];
        // There are two iterators; "a" is for actual argument, "d" is for definiton.
        // These may progress independently if a definiton accepts multiple arguments.
        for (var a = 0, d = 0; a < arguments.length; a++, d++) {
            var definition = definitions[d];
            if (!definition) throw new AvisynthError('Too many arguments for ' + name);
            var value = arguments[a];
            if (!isDefined(value)) continue;
            var m = definition.modifier;
            if (m && /m/.test(m)) {
                // Multiple parameter modes.
                var multi = [value];
                var type = typeof value;
                while (typeof (value = arguments[++a]) === type) { multi.push(value); } a--;
                if (/[fp]/.test(m)) multi = multi.map(function(v) { return path.resolve(v); });
                if (/[fpqt]/.test(m)) multi = multi.map(function(v) { return '"' + v + '"'; });
                multi.forEach(function(p) { params.push(p); });
            } else {
                if (m && /t/.test(m)) checkType(value, options.types);
                if (m && /[fp]/.test(m)) value = path.resolve(value);
                if (m && /[fpqt]/.test(m)) value = '"' + value + '"';
                if (m && /n/.test(m) && typeof value === 'string') throw new AvisynthError('Only one path supported!');
                params.push((definition.identifier ? definition.identifier + '=' : '') + value);
            }
        }

        // All filename arguments are required; ensure that.
        for (var i = 0; i < definitions.length; i++) {
            var def = definitions[i];
            if (def.modifier && /[f]/.test(def.modifier) && !arguments[i]) {
                throw new AvisynthError('filename is a required argument!')
            }
        }

        return name + '(' + params.join(', ') + ')';
    };
}

// Utility that eases the inline creation and addition of a core filter.
function newPlugin(name, options, types) {
    var actualName = name.indexOf('(') !== -1 ? name.match(/[^(]*/)[0] : name;
    addPlugin(actualName, coreFilter(name, options, types));
}

// Shared pixel types.
var imgTypes = 'Y8, RGB24, RGB32';
var dssTypes = 'YV24, YV16, YV12, YUY2, AYUV, Y41P, Y411, ARGB, RGB32, RGB24, YUV, YUVex, RGB, AUTO, FULL';
var aviTypes = 'YV24, YV16, YV12, YV411, YUY2, RGB32, RGB24, Y8, AUTO, FULL'

// Shared parameter lists.
var imgParams = 'f:, n:start, end, fps, use_DevIL, info, t:pixel_type';
var dssParams = 'f:, n:fps, seek, audio, video, convertfps, seekzero, timeout, t:pixel_type, framecount, p:logfile, logmask';
var aviParams = 'mf:, audio, t:pixel_type, q:fourCC';

newPlugin('AviSource', aviParams, aviTypes);
newPlugin('OpenDMLSource', aviParams, aviTypes);
newPlugin('AviFileSource', aviParams, aviTypes);
newPlugin('WavSource(mf:)');
newPlugin('DirectShowSource', dssParams, dssTypes);
newPlugin('ImageSource', imgParams, imgTypes);
newPlugin('ImageReader', imgParams, imgTypes);
newPlugin('ImageSourceAnim(f:, n:fps, info, t:pixel_type)', imgTypes);
newPlugin('ImageWriter(f:, start, end, q:type, info)');
newPlugin('SegmentedAviSource(mf:, audio, t:pixel_type)', aviTypes);
newPlugin('SegmentedDirectShowSource(mf:, fps, seek, audio, video, convertfps, seekzero, timeout, t:pixel_type)', dssTypes);
