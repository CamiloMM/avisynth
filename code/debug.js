var newPlugin = require('./plugins').newPlugin;

// Debug filters. See definitions.js.

var clipTypes = 'RGB24, RGB32, YUY2, YV12, YV16, YV24, YV411, Y8';
var barsTypes = 'YUY2, YV12, YV24, RGB32';

newPlugin('Blackness(i:, i:, i:, t:, i:, i:, i:, a:, aq:, c:color, c:color_yuv)', clipTypes);
newPlugin('BlankClip(i:, i:, i:, t:, i:, i:, i:, a:, aq:, c:color, c:color_yuv)', clipTypes);
newPlugin('ColorBars(i:width, i:height, t:pixel_type)', barsTypes);
newPlugin('ColorBarsHD(i:width, i:height, t:pixel_type)', barsTypes);
newPlugin('Compare(rv:, q:channels, p:logfile, b:show_graph)');
