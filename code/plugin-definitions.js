var pluginSystem = require('./plugin-system');
var addPlugin = pluginSystem.addPlugin;

// This file contains an implementation of each of the various core filters
// bundled with AviSynth, to ease their usage in script objects.

addPlugin('AviSource', function(filename, audio, pixelType, fourCC) {
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
    var clips = filenames.join('", "');
    if (typeof fourCCArg !== 'undefined') return 'AviSource("' + clips + '", ' + !!audioArg + ', "' + pixelTypeArg + '", "' + fourCCArg + '")';
    if (typeof pixelTypeArg !== 'undefined') return 'AviSource("' + clips + '", ' + !!audioArg + ', "' + pixelTypeArg + '")';
    if (typeof audioArg !== 'undefined') return 'AviSource("' + clips + '", ' + !!audioArg + ')';
    return 'AviSource("' + clips + '")';
});
