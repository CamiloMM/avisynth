var AvisynthError = require('./errors').AvisynthError;
var pluginSystem  = require('./plugin-system');
var addPlugin     = pluginSystem.addPlugin;

// This file contains an implementation of each of the various core filters
// bundled with AviSynth, to ease their usage in script objects.

// Shared implementation of a few filters to improve code re-use.
function sharedAviSource(name, disableOptions) {

    // Pixel types supported by this filter.
    var pixelTypes = ['YV24', 'YV16', 'YV12', 'YV411', 'YUY2', 'RGB32', 'RGB24', 'Y8', 'AUTO', 'FULL'];

    return function(filename, audio, pixelType, fourCC) {
        if (typeof filename !== 'string') throw new Error('filename must be a string!');
        var filenames = [];
        var audioArg, pixelTypeArg, fourCCArg;
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === 'string') {
                filenames.push(arguments[i]);
            } else {
                audioArg     = arguments[i];
                pixelTypeArg = arguments[i + 1];
                fourCCArg    = arguments[i + 2];
                break;
            }
        }
        if (pixelTypeArg && pixelTypes.indexOf(pixelTypeArg) === -1) throw new Error('bad pixel type (' + pixelTypeArg + ')!');
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
    var params = ['"' + filename + '"'];
    if (typeof fps        !== 'undefined') params.push('fps='        + fps);
    if (typeof seek       !== 'undefined') params.push('seek='       + seek);
    if (typeof audio      !== 'undefined') params.push('audio='      + audio);
    if (typeof video      !== 'undefined') params.push('video='      + video);
    if (typeof convertfps !== 'undefined') params.push('convertfps=' + convertfps);
    if (typeof seekzero   !== 'undefined') params.push('seekzero='   + seekzero);
    if (typeof timeout    !== 'undefined') params.push('timeout='    + timeout);
    if (typeof pixelType  !== 'undefined') params.push('pixel_type=' + '"' + pixelType + '"');
    if (typeof framecount !== 'undefined') params.push('framecount=' + framecount);
    if (typeof logfile    !== 'undefined') params.push('logfile='    + '"' + logfile + '"');
    if (typeof logmask    !== 'undefined') params.push('logmask='    + logmask);
    return 'DirectShowSource(' + params.join(', ') + ')';
}

addPlugin('AviSource', sharedAviSource('AviSource'));
addPlugin('OpenDMLSource', sharedAviSource('OpenDMLSource'));
addPlugin('AviFileSource', sharedAviSource('AviFileSource'));
addPlugin('WavSource', sharedAviSource('WavSource', true));
addPlugin('DirectShowSource', directShowSource);
