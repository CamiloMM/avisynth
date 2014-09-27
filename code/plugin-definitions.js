var pluginSystem = require('./plugin-system');
var addPlugin = pluginSystem.addPlugin;

// This file contains an implementation of each of the various core filters
// bundled with AviSynth, to ease their usage in script objects.

function sharedAviSource(name, disableOptions) {
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
        var clips = filenames.join('", "');
        if (!disableOptions) {
            if (typeof fourCCArg !== 'undefined') return name + '("' + clips + '", ' + !!audioArg + ', "' + pixelTypeArg + '", "' + fourCCArg + '")';
            if (typeof pixelTypeArg !== 'undefined') return name + '("' + clips + '", ' + !!audioArg + ', "' + pixelTypeArg + '")';
            if (typeof audioArg !== 'undefined') return name + '("' + clips + '", ' + !!audioArg + ')';
        }
        return name + '("' + clips + '")';
    }
}

addPlugin('AviSource', sharedAviSource('AviSource'));
addPlugin('OpenDMLSource', sharedAviSource('OpenDMLSource'));
addPlugin('AviFileSource', sharedAviSource('AviFileSource'));
addPlugin('WavSource', sharedAviSource('WavSource', true));
