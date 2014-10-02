var path          = require('path');
var AvisynthError = require('./errors').AvisynthError;
var pluginSystem  = require('./plugin-system');
var addPlugin     = pluginSystem.addPlugin;

// This file contains an implementation of each of the various core filters
// bundled with AviSynth, to ease their usage in script objects.
// Also, screw code re-use, accounting for the minimal difference between each
// core filter and coming up with an elegant solution would take too much time.

// Shared implementation of a few filters to improve code re-use.
function sharedAviSource(name, disableOptions) {

    // Pixel types supported by this filter.
    var pixelTypes = ['YV24', 'YV16', 'YV12', 'YV411', 'YUY2', 'RGB32', 'RGB24', 'Y8', 'AUTO', 'FULL'];

    return function(filename, audio, pixelType, fourCC) {
        if (typeof filename !== 'string') throw new AvisynthError('filename must be a string!');
        var filenames = [];
        var audioArg, pixelTypeArg, fourCCArg;
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === 'string') {
                filenames.push(path.resolve(arguments[i]));
            } else {
                audioArg     = arguments[i];
                pixelTypeArg = arguments[i + 1];
                fourCCArg    = arguments[i + 2];
                break;
            }
        }
        if (pixelTypeArg && pixelTypes.indexOf(pixelTypeArg) === -1) throw new AvisynthError('bad pixel type (' + pixelTypeArg + ')!');
        var clips = filenames.join('", "');
        if (!disableOptions) {
            if (typeof fourCCArg !== 'undefined') return name + '("' + clips + '", ' + !!audioArg + ', "' + pixelTypeArg + '", "' + fourCCArg + '")';
            if (typeof pixelTypeArg !== 'undefined') return name + '("' + clips + '", ' + !!audioArg + ', "' + pixelTypeArg + '")';
            if (typeof audioArg !== 'undefined') return name + '("' + clips + '", ' + !!audioArg + ')';
        }
        return name + '("' + clips + '")';
    }
}

// DirectShowSource is significantly different from AviSource-like source filters (and more versatile).
function directShowSource(filename, fps, seek, audio, video, convertfps, seekzero, timeout, pixelType, framecount, logfile, logmask) {
    // Perform a couple of sanity checks.
    if (typeof filename !== 'string' || !filename) throw new AvisynthError('filename is a required argument!');
    if (typeof fps === 'string') throw new AvisynthError('only one filename is supported (unlike some other source filters)!');

    // Notice how the pixel types supported differ from the AviSource family.
    var pixelTypes = ['YV24', 'YV16', 'YV12', 'YUY2', 'AYUV', 'Y41P', 'Y411', 'ARGB', 'RGB32', 'RGB24', 'YUV', 'YUVex', 'RGB', 'AUTO', 'FULL'];
    if (pixelType && pixelTypes.indexOf(pixelType) === -1) throw new AvisynthError('bad pixel type (' + pixelType + ')!');

    // Start building the parameter list.
    var params = ['"' + path.resolve(filename) + '"'];
    if (typeof fps        !== 'undefined') params.push('fps='        + fps);
    if (typeof seek       !== 'undefined') params.push('seek='       + seek);
    if (typeof audio      !== 'undefined') params.push('audio='      + audio);
    if (typeof video      !== 'undefined') params.push('video='      + video);
    if (typeof convertfps !== 'undefined') params.push('convertfps=' + convertfps);
    if (typeof seekzero   !== 'undefined') params.push('seekzero='   + seekzero);
    if (typeof timeout    !== 'undefined') params.push('timeout='    + timeout);
    if (typeof pixelType  !== 'undefined') params.push('pixel_type=' + '"' + pixelType + '"');
    if (typeof framecount !== 'undefined') params.push('framecount=' + framecount);
    if (typeof logfile    !== 'undefined') params.push('logfile='    + '"' + path.resolve(logfile) + '"');
    if (typeof logmask    !== 'undefined') params.push('logmask='    + logmask);
    return 'DirectShowSource(' + params.join(', ') + ')';
}

function sharedImageSource(name) {
    return function(file, start, end, fps, useDevIL, info, pixelType) {
        // Perform a couple of sanity checks.
        if (typeof file !== 'string' || !file) throw new AvisynthError('filename is a required argument!');
        if (typeof start === 'string') throw new AvisynthError('only one filename is supported (unlike some other source filters)!');

        // Different pixel type support too.
        var pixelTypes = ['Y8', 'RGB24', 'RGB32'];
        if (pixelType && pixelTypes.indexOf(pixelType) === -1) throw new AvisynthError('bad pixel type (' + pixelType + ')!');

        // Start building the parameter list.
        var params = ['"' + path.resolve(file) + '"'];
        if (typeof start     !== 'undefined') params.push('start='      + start);
        if (typeof end       !== 'undefined') params.push('end='        + end);
        if (typeof fps       !== 'undefined') params.push('fps='        + fps);
        if (typeof useDevIL  !== 'undefined') params.push('use_DevIL='  + useDevIL);
        if (typeof info      !== 'undefined') params.push('info='       + info);
        if (typeof pixelType !== 'undefined') params.push('pixel_type=' + '"' + pixelType + '"');
        return name + '(' + params.join(', ') + ')';
    }
}

function imageSourceAnim(file, fps, info, pixelType) {
    // Perform a couple of sanity checks.
    if (typeof file !== 'string' || !file) throw new AvisynthError('filename is a required argument!');
    if (typeof fps === 'string') throw new AvisynthError('only one filename is supported (unlike some other source filters)!');

    var pixelTypes = ['Y8', 'RGB24', 'RGB32'];
    if (pixelType && pixelTypes.indexOf(pixelType) === -1) throw new AvisynthError('bad pixel type (' + pixelType + ')!');

    // Start building the parameter list.
    var params = ['"' + path.resolve(file) + '"'];
    if (typeof fps       !== 'undefined') params.push('fps='        + fps);
    if (typeof info      !== 'undefined') params.push('info='       + info);
    if (typeof pixelType !== 'undefined') params.push('pixel_type=' + '"' + pixelType + '"');
    return 'ImageSourceAnim(' + params.join(', ') + ')';
}

function imageWriter(file, start, end, type, info) {
    if (typeof file !== 'string' || !file) throw new AvisynthError('filename is a required argument!');

    // Start building the parameter list.
    var params = ['"' + path.resolve(file) + '"'];
    if (typeof start     !== 'undefined') params.push('start='      + start);
    if (typeof end       !== 'undefined') params.push('end='        + end);
    if (typeof type      !== 'undefined') params.push('pixel_type=' + '"' + type + '"');
    if (typeof info      !== 'undefined') params.push('info='       + info);
    return 'ImageWriter(' + params.join(', ') + ')';
}

addPlugin('AviSource', sharedAviSource('AviSource'));
addPlugin('OpenDMLSource', sharedAviSource('OpenDMLSource'));
addPlugin('AviFileSource', sharedAviSource('AviFileSource'));
addPlugin('WavSource', sharedAviSource('WavSource', true));
addPlugin('DirectShowSource', directShowSource);
addPlugin('ImageSource', sharedImageSource('ImageSource'));
addPlugin('ImageReader', sharedImageSource('ImageReader'));
addPlugin('ImageSourceAnim', imageSourceAnim);
addPlugin('ImageWriter', imageWriter);
