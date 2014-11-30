var newPlugin = require('./plugins').newPlugin;

// Media file filters. See definitions.js.

var imgTypes = 'Y8, RGB24, RGB32';
var dssTypes = 'YV24, YV16, YV12, YUY2, AYUV, Y41P, Y411, ARGB, RGB32, RGB24, YUV, YUVex, RGB, AUTO, FULL';
var aviTypes = 'YV24, YV16, YV12, YV411, YUY2, RGB32, RGB24, Y8, AUTO, FULL';

var imgParams = 'f:, ni:start, i:end, d:fps, b:use_DevIL, b:info, t:pixel_type';
var dssParams = 'f:, nd:fps, b:seek, b:audio, b:video, b:convertfps, b:seekzero, i:timeout, t:pixel_type, i:framecount, p:logfile, i:logmask';
var aviParams = 'mf:, b:audio, t:pixel_type, q:fourCC';

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
newPlugin('SoundOut'); // Use the named parameters object feature.
