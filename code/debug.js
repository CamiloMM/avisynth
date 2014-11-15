var newPlugin = require('./plugins').newPlugin;

// Debug filters. See definitions.js.

var pixelTypes = 'RGB24, RGB32, YUY2, YV12, YV16, YV24, YV411, Y8';

newPlugin('Blackness(i:, i:, i:, t:, i:, i:, i:, a:, aq:, c:color, c:color_yuv)', pixelTypes);
newPlugin('BlankClip(i:, i:, i:, t:, i:, i:, i:, a:, aq:, c:color, c:color_yuv)', pixelTypes);
