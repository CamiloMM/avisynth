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
// a: auto-type, strings get quoted, numbers and bools not (variables are only supported with an unmatched t).
function coreFilter(name, options, types) {

    // Lazyness taken to new heights. First parameter can succintly describe some filters.
    // If combined with defining the second parameter, that will represent the types.
    if (name.indexOf('(') !== -1) {
        var matches = name.match(/([^() ]*)\s*(\((.*)\))?/);
        name = matches[1];
        if (options) { types = options; }
        options = matches[3];
    }

    // Conveniently cast options/types from string to array, for the condition below.
    if (typeof options === 'string') { options = options.split(/\s*,\s*/); }
    if (typeof types   === 'string') { types   =   types.split(/\s*,\s*/); }

    // If options is an array instead of object, it is treated as options.params.
    // Optionally, options.types can be inlined too, by passing a second array.
    if (options && isDefined(options.length)) {
        options = {params: options, types: types};
    }

    // If options is still not defined, default it.
    if (!isDefined(options)) { options = {}; }

    // We also support shorthands for the options properties.
    if (options.p) { options.params = options.p; }
    if (options.t) { options.types  = options.t; }

    // Similar to a cast above, but for options' properties.
    if (typeof options.params === 'string') { options.params = options.params.split(/\s*,\s*/); }
    if (typeof options.types  === 'string') { options.types  =  options.types.split(/\s*,\s*/); }

    // Utility that processes a parameter, used in core filters. The m variable is the modifier.
    function processParameter(m, value) {
        if (m && /t/.test(m) && !/a/.test(m)) { checkType(value, options.types); }
        if (m && /[fp]/.test(m)) { value = path.resolve(value); }
        if (m && /[fpqt]/.test(m) && !/a/.test(m)) { value = '"' + value + '"'; }
        if (m && /n/.test(m) && typeof value === 'string') {
            throw new AvisynthError('only one path supported!');
        }
        if (m && /b/.test(m) && value !== !!value) {
            throw new AvisynthError('expected boolean, got "' + value + '"');
        }
        if (m && /d/.test(m) && value !== +value) {
            throw new AvisynthError('expected number, got "' + value + '"');
        }
        if (m && /i/.test(m) && value !== Math.round(value)) {
            throw new AvisynthError('expected integer, got "' + value + '"');
        }
        if (m && /c/.test(m)) { value = colors.parse(value); }
        if (m && /v/.test(m)) {
            if (!/^[a-z_][0-9a-z_]*$/i.test(value)) {
                throw new AvisynthError('bad syntax for variable name "' + value + '"!');
            }
        }
        if (m && /a/.test(m)) {
            // Auto-parameters should guess what the value is supposed to mean.
            // If it's a number or boolean, just output it as is.
            if (typeof value === 'number') { value = +value; }
            if (typeof value === 'boolean') { value = !!value; }
            // But if it's a string, it depends on whether it can also be a type.
            if (typeof value === 'string') {
                // Types should not throw errors, but rather become variables if possible.
                if (/t/.test(m)) {
                    try {
                        checkType(value, options.types);
                        value = '"' + value + '"';
                    } catch (e) {
                        if (!/^[a-z_][0-9a-z_]*$/i.test(value)) {
                            throw new AvisynthError('bad syntax for variable name "' + value + '"!');
                        }
                    }
                }
            }
        }
        return value;
    }

    // Here begins the actual creation of the plugin.
    return function() {
        // Construct parameter definitons.
        var definitions = [];
        if (options.params) {
            options.params.forEach(function(param) {
                // Each item in options.params should follow modifier:identifier format.
                var matches = param.match(/^((.*):)?(.*)$/);
                definitions.push({modifier: matches[2], identifier: matches[3]});
            });
        }

        // Construct parameter list.
        var params = [];
        // There are two iterators; "a" is for actual argument, "d" is for definiton.
        // These may progress independently if a definiton accepts multiple arguments.
        for (var a = 0, d = 0; a < arguments.length; a++, d++) {
            var definition = definitions[d];
            if (!definition) { throw new AvisynthError('too many arguments for ' + name); }
            var value = arguments[a];
            if (!isDefined(value)) { continue; }
            var m = definition.modifier;
            if (m && /m/.test(m)) {
                // Multiple parameter modes.
                var multi = [value];
                var type = typeof value;
                while (typeof (value = arguments[++a]) === type) { multi.push(value); } a--;
                multi = multi.map(processParameter.bind(null, m));
                multi.forEach(function(p) { params.push(p); });
            } else {
                value = processParameter(m, value);
                if (definition.identifier) {
                    params.push(definition.identifier + '=' + value);
                } else {
                    // Now we reach a special case, because if the parameter is nameless,
                    // we have to avoid it being ambiguous with a previous one.
                    // This could happen if any previous parameter was omitted (named or not).
                    if (a > params.length) {
                        throw new AvisynthError('a skipped parameter makes ' + value + ' ambiguous!');
                    } else {
                        params.push(value);
                    }
                }
            }
        }

        // Ensure all required arguments are provided.
        for (var i = 0; i < definitions.length; i++) {
            var def = definitions[i];
            if (def.modifier && !isDefined(arguments[i])) {
                if (/f/.test(def.modifier)) { throw new AvisynthError('filename is a required argument!'); }
                if (/r/.test(def.modifier)) { throw new AvisynthError('a required argument is missing!'); }
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
var fpsPresets = 'ntsc_film, ntsc_video, ntsc_double, ntsc_quad, ntsc_round_film, ntsc_round_video, ntsc_round_double, ntsc_round_quad, film, pal_film, pal_video, pal_double, pal_quad';

// Shared parameter lists.
var imgParams = 'f:, ni:start, i:end, d:fps, b:use_DevIL, b:info, t:pixel_type';
var dssParams = 'f:, nd:fps, b:seek, b:audio, b:video, b:convertfps, b:seekzero, i:timeout, t:pixel_type, i:framecount, p:logfile, i:logmask';
var aviParams = 'mf:, b:audio, t:pixel_type, q:fourCC';
var convertParams = 't:matrix, b:interlaced, q:ChromaInPlacement, q:chromaresample';
var mergeParams = 'rv:, rv:, d:weight';

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
newPlugin('FixLuminance(i:, i:)');
newPlugin('Greyscale(q:matrix)');
newPlugin('Invert(q:channels)');
newPlugin('Levels(ri:, rd:, ri:, ri:, ri:, b:coring, b:dither)');
newPlugin('Limiter(i:min_luma, i:max_luma, i:min_chroma, i:max_chroma, t:show)', 'luma, luma_grey, chroma, chroma_grey');
newPlugin('MergeARGB(rv:, rv:, rv:, rv:)');
newPlugin('MergeRGB(rv:, rv:, rv:, t:pixel_type)', 'RGB24, RGB32');
newPlugin('Merge', mergeParams);
newPlugin('MergeChroma', mergeParams);
newPlugin('MergeLuma', mergeParams);
newPlugin('RGBAdjust(d:, d:, d:, d:, d:rb, d:gb, d:bb, d:ab, d:rg, d:gg, d:bg, d:ag, b:analyze, b:dither)');
newPlugin('ShowAlpha(t:pixel_type)', showTypes);
newPlugin('ShowBlue(t:pixel_type)', showTypes);
newPlugin('ShowGreen(t:pixel_type)', showTypes);
newPlugin('ShowRed(t:pixel_type)', showTypes);
newPlugin('SwapUV(v:)');
newPlugin('UToY(v:)');
newPlugin('VToY(v:)');
newPlugin('UToY8(v:)');
newPlugin('VToY8(v:)');
newPlugin('YToUV(rv:, rv:, v:)');
newPlugin('Tweak(d:hue, d:sat, d:bright, d:cont, b:coring, b:sse, d:startHue, d:endHue, d:maxSat, d:minSat, d:interp, b:dither)');

// Overlay and Mask filters
newPlugin('Layer(rv:, rv:, t:op, i:level, i:x, i:y, i:threshold, b:use_chroma)', 'add, subtract, lighten, darken, fast, mul');
newPlugin('Mask(rv:, v:)');
newPlugin('ResetMask(v:)');
newPlugin('ColorKeyMask(c:, i:, i:, i:)');
newPlugin('MaskHS(i:startHue, i:endHue, i:maxSat, i:minSat, b:coring)');
newPlugin('Overlay(rv:, i:x, i:y, v:mask, d:opacity, t:mode, b:greymask, q:output, b:ignore_conditional, b:pc_range)', overlayModes);
newPlugin('Subtract(rv:, rv:)');

// Geometric deformation filters
newPlugin('AddBorders(ri:, ri:, ri:, ri:, c:color)');
newPlugin('Crop(ri:, ri:, ri:, ri:, b:align)');
newPlugin('CropBottom(ri:)');
newPlugin('FlipHorizontal');
newPlugin('FlipVertical');
newPlugin('Letterbox(ri:, ri:, i:x1, i:x2, c:color)');
newPlugin('HorizontalReduceBy2');
newPlugin('VerticalReduceBy2');
newPlugin('ReduceBy2');
newPlugin('SkewRows(ri:)');
newPlugin('TurnLeft');
newPlugin('TurnRight');
newPlugin('Turn180');
newPlugin( 'BicubicResize(ri:, ri:, d:b, d:c, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('BilinearResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('BlackmanResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin(   'GaussResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, d:p)');
newPlugin( 'LanczosResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin('Lanczos4Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin(   'PointResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin(    'SincResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin('Spline16Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('Spline36Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('Spline64Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');

// Pixel restoration filters
newPlugin('Blur(rd:, d:, b:MMX)');
newPlugin('Sharpen(rd:, d:, b:MMX)');
newPlugin('GeneralConvolution(i:bias, q:matrix, d:divisor, b:auto)');
newPlugin('SpatialSoften(ri:, ri:, ri:)');
newPlugin('TemporalSoften(ri:, ri:, ri:, i:scenechange, i:mode)');
newPlugin('FixBrokenChromaUpsampling');

// Timeline editing filters
newPlugin('AlignedSplice(rv:, rv:, mv:)');
newPlugin('UnalignedSplice(rv:, rv:, mv:)');
newPlugin('AssumeFPS(rat:, a:, a:)', fpsPresets);
newPlugin('AssumeScaledFPS(i:multiplier, i:divisor, b:sync_audio)');
newPlugin('ChangeFPS(rat:, a:, a:)', fpsPresets);
newPlugin('ConvertFPS(rat:, a:, a:, a:)', fpsPresets);
newPlugin('DeleteFrame(rmi:)');
newPlugin('Dissolve(rmv:, i:, d:fps)');
newPlugin('DuplicateFrame(rmi:)');
newPlugin('FadeIn(ri:, c:color, d:fps)');
newPlugin('FadeIO(ri:, c:color, d:fps)');
newPlugin('FadeOut(ri:, c:color, d:fps)');
newPlugin('FadeIn0(ri:, c:color, d:fps)');
newPlugin('FadeIO0(ri:, c:color, d:fps)');
newPlugin('FadeOut0(ri:, c:color, d:fps)');
newPlugin('FadeIn2(ri:, c:color, d:fps)');
newPlugin('FadeIO2(ri:, c:color, d:fps)');
newPlugin('FadeOut2(ri:, c:color, d:fps)');
newPlugin('FreezeFrame(ri:, ri:, ri:)');
newPlugin('Interleave(rmv:)');
newPlugin('Loop(i:, i:, i:)');
newPlugin('Reverse(v:)');
newPlugin('SelectEven(v:)');
newPlugin('SelectOdd(v:)');
newPlugin('SelectEvery(ri:, ri:, mi:)');
