var path          = require('path');
var AvisynthError = require('./errors').AvisynthError;
var pluginSystem  = require('./plugin-system');
var colors        = require('./colors');
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
// q: quoted (string).
// p: file path (resolved to absolute), implies q.
// r: required field. Lack of it is an error.
// f: forced file path, implies p and r.
// n: not a path (actually, not a string). Throws if a string is given.
// t: a type, this is checked against options.types. Implies q.
// b: field is cast to boolean.
// d: field is cast to a decimal number (integer or float).
// i: field is cast to integer, rounded as necessary. Implies d.
// v: a variable name (unquoted string), checked for syntactic validity.
// c: a color variable, can be a number, name or string (0x123ABC, 0, 'red', 'F0F', 'FF00FF').
function coreFilter(name, options, types) {

    // Lazyness taken to new heights. First parameter can succintly describe some filters.
    // If combined with defining the second parameter, that will represent the types.
    if (name.indexOf('(') !== -1) {
        var matches = name.match(/([^() ]*)\s*(\((.*)\))?/);
        name = matches[1];
        if (options) types = options;
        options = matches[3];
    }

    // Conveniently cast options/types from string to array, for the condition below.
    if (typeof options === 'string') options = options.split(/\s*,\s*/);
    if (typeof types   === 'string') types   =   types.split(/\s*,\s*/);

    // If options is an array instead of object, it is treated as options.params.
    // Optionally, options.types can be inlined too, by passing a second array.
    if (options && isDefined(options.length)) {
        options = {params: options, types: types};
    }

    // If options is still not defined, default it.
    if (!isDefined(options)) options = {};

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
                if (m && /b/.test(m)) value = !!value;
                if (m && /di/.test(m)) value = +value;
                if (m && /i/.test(m)) value = Math.round(value);
                if (m && /c/.test(m)) value = colors.parse(value);
                if (m && /v/.test(m)) if (!/[a-z_][0-9a-z_]*/i.test(value)) {
                    throw new AvisynthError('bad syntax for variable name "' + value + '"!');
                }

                params.push((definition.identifier ? definition.identifier + '=' : '') + value);
            }
        }

        // Ensure all required arguments are provided.
        for (var i = 0; i < definitions.length; i++) {
            var def = definitions[i];
            if (def.modifier && !isDefined(arguments[i])) {
                if (/[f]/.test(def.modifier)) throw new AvisynthError('filename is a required argument!');
                if (/[r]/.test(def.modifier)) throw new AvisynthError('a required argument is missing!');
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

// Below here are the actual definitions of the syntax for the core filters.
// As clarification for whoever reads this in the future: I'm using a custom ad-hoc syntax
// that describes how they work, this allows me to define a whole filter in a single line.

// Shared type definitions.
var imgTypes = 'Y8, RGB24, RGB32';
var dssTypes = 'YV24, YV16, YV12, YUY2, AYUV, Y41P, Y411, ARGB, RGB32, RGB24, YUV, YUVex, RGB, AUTO, FULL';
var aviTypes = 'YV24, YV16, YV12, YV411, YUY2, RGB32, RGB24, Y8, AUTO, FULL';
var matrices = 'Rec601, PC.601, Rec709, PC.709, AVERAGE';
var showTypes = 'RGB24, RGB32, YUY2, YV12, Y8';
var overlayModes = 'Blend, Add, Subtract, Multiply, Chroma, Luma, Lighten, Darken, SoftLight, HardLight, Difference, Exclusion';

// Shared parameter lists.
var imgParams = 'f:, ni:start, i:end, d:fps, b:use_DevIL, b:info, t:pixel_type';
var dssParams = 'f:, nd:fps, b:seek, b:audio, b:video, b:convertfps, b:seekzero, i:timeout, t:pixel_type, i:framecount, p:logfile, i:logmask';
var aviParams = 'mf:, b:audio, t:pixel_type, q:fourCC';
var convertParams = 't:matrix, b:interlaced, q:ChromaInPlacement, q:chromaresample';
var mergeParams = 'rv:clip1, rv:clip2, d:weight';

// Media file filters
newPlugin('AviSource', aviParams, aviTypes);
newPlugin('OpenDMLSource', aviParams, aviTypes);
newPlugin('AviFileSource', aviParams, aviTypes);
newPlugin('WavSource(mf:)');
newPlugin('DirectShowSource', dssParams, dssTypes);
newPlugin('ImageSource', imgParams, imgTypes);
newPlugin('ImageReader', imgParams, imgTypes);
newPlugin('ImageSourceAnim(f:, nd:fps, b:info, t:pixel_type)', imgTypes);
newPlugin('ImageWriter(f:, i:start, i:end, q:type, b:info)');
newPlugin('SegmentedAviSource(mf:, b:audio, t:pixel_type)', aviTypes);
newPlugin('SegmentedDirectShowSource(mf:, d:fps, b:seek, b:audio, b:video, b:convertfps, b:seekzero, i:timeout, t:pixel_type)', dssTypes);
newPlugin('SoundOut');

// Color conversion and adjustment filters
newPlugin('ColorYUV(d:gain_y, d:off_y, d:gamma_y, d:cont_y, d:gain_u, d:off_u, d:gamma_u, d:cont_u, d:gain_v, d:off_v, d:gamma_v, d:cont_v, q:levels, q:opt, b:showyuv, b:analyze, b:autowhite, b:autogain, b:conditional)');
newPlugin('ConvertBackToYUY2(t:matrix)', matrices);
newPlugin('ConvertToRGB', convertParams, matrices);
newPlugin('ConvertToRGB24', convertParams, matrices);
newPlugin('ConvertToRGB32', convertParams, matrices);
newPlugin('ConvertToYUY2', convertParams, matrices);
newPlugin('ConvertToY8(t:matrix)', matrices);
newPlugin('ConvertToYV411', convertParams, matrices);
newPlugin('ConvertToYV12', convertParams + ', q:ChromaOutPlacement', matrices);
newPlugin('ConvertToYV16', convertParams, matrices);
newPlugin('ConvertToYV24', convertParams, matrices);
newPlugin('FixLuminance(i:intercept, i:slope)');
newPlugin('Greyscale(q:matrix)');
newPlugin('Invert(q:channels)');
newPlugin('Levels(ri:input_low, rd:gamma, ri:input_high, ri:output_low, ri:output_high, b:coring, b:dither)');
newPlugin('Limiter(i:min_luma, i:max_luma, i:min_chroma, i:max_chroma, t:show)', 'luma, luma_grey, chroma, chroma_grey');
newPlugin('MergeARGB(rv:clipA, rv:clipR, rv:clipG, rv:clipB)');
newPlugin('MergeRGB(rv:clipR, rv:clipG, rv:clipB, t:pixel_type)', 'RGB24, RGB32');
newPlugin('Merge', mergeParams);
newPlugin('MergeChroma', mergeParams);
newPlugin('MergeLuma', mergeParams);
newPlugin('RGBAdjust(d:red, d:green, d:blue, d:alpha, d:rb, d:gb, d:bb, d:ab, d:rg, d:gg, d:bg, d:ag, b:analyze, b:dither)');
newPlugin('ShowAlpha(t:pixel_type)', showTypes);
newPlugin('ShowBlue(t:pixel_type)', showTypes);
newPlugin('ShowGreen(t:pixel_type)', showTypes);
newPlugin('ShowRed(t:pixel_type)', showTypes);
newPlugin('SwapUV(v:clip)');
newPlugin('UToY(v:clip)');
newPlugin('VToY(v:clip)');
newPlugin('UToY8(v:clip)');
newPlugin('VToY8(v:clip)');
newPlugin('YToUV(rv:clipU, rv:clipV, v:clipY)');
newPlugin('Tweak(d:hue, d:sat, d:bright, d:cont, b:coring, b:sse, d:startHue, d:endHue, d:maxSat, d:minSat, d:interp, b:dither)');

// Overlay and Mask filters
newPlugin('Layer(rv:base_clip, rv:overlay_clip, t:op, i:level, i:x, i:y, i:threshold, b:use_chroma)', 'add, subtract, lighten, darken, fast, mul');
newPlugin('Mask(rv:, v:mask_clip)');
newPlugin('ResetMask(v:clip)');
newPlugin('ColorKeyMask(c:color, i:tolB, i:tolG, i:tolR)');
newPlugin('MaskHS(i:startHue, i:endHue, i:maxSat, i:minSat, b:coring)');
newPlugin('Overlay(rv:overlay, i:x, i:y, v:mask, d:opacity, t:mode, b:greymask, q:output, b:ignore_conditional, b:pc_range)', overlayModes);
newPlugin('Subtract(rv:clip1, rv:clip2)');

// Geometric deformation filters
newPlugin('AddBorders(ri:left, ri:top, ri:right, ri:bottom, c:color)');
newPlugin('Crop(ri:left, ri:top, ri:width, ri:height, b:align)');
newPlugin('CropBottom(ri:count)');
newPlugin('FlipHorizontal');
newPlugin('FlipVertical');
newPlugin('Letterbox(ri:top, ri:bottom, i:x1, i:x2, c:color)');
newPlugin('HorizontalReduceBy2');
newPlugin('VerticalReduceBy2');
newPlugin('ReduceBy2');
newPlugin('SkewRows(ri:skew)');
newPlugin('TurnLeft');
newPlugin('TurnRight');
newPlugin('Turn180');
newPlugin( 'BicubicResize(ri:target_width, ri:target_height, d:b, d:c, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('BilinearResize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('BlackmanResize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin(   'GaussResize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height, d:p)');
newPlugin( 'LanczosResize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin('Lanczos4Resize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin(   'PointResize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin(    'SincResize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin('Spline16Resize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('Spline36Resize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('Spline64Resize(ri:target_width, ri:target_height, d:src_left, d:src_top, d:src_width, d:src_height)');

// Pixel restoration filters
newPlugin('Blur(rd:, d:, b:)');
newPlugin('Sharpen(rd:, d:, b:)');
