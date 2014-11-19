var newPlugin = require('./plugins').newPlugin;

// Debug filters. See definitions.js.

var clipTypes = 'RGB24, RGB32, YUY2, YV12, YV16, YV24, YV411, Y8';
var barsTypes = 'YUY2, YV12, YV24, RGB32';
var histModes = 'Classic, Levels, Color, Color2, Luma, Audiolevels, Stereo, StereoOverlay, StereoY8';

newPlugin('Blackness(i:, i:, i:, t:, i:, i:, i:, a:, aq:, c:color, c:color_yuv)', clipTypes);
newPlugin('BlankClip(i:, i:, i:, t:, i:, i:, i:, a:, aq:, c:color, c:color_yuv)', clipTypes);
newPlugin('ColorBars(i:width, i:height, t:pixel_type)', barsTypes);
newPlugin('ColorBarsHD(i:width, i:height, t:pixel_type)', barsTypes);
newPlugin('Compare(rv:, q:channels, p:logfile, b:show_graph)');
newPlugin('Echo(rmv:)');
newPlugin('Histogram(t:, d:)', histModes);
newPlugin('Info(v:)');
newPlugin('MessageClip(rq:, i:width, i:height, b:shrink, c:text_color, c:halo_color, c:bg_color)');
newPlugin('Preroll(i:video, d:audio)');
newPlugin('ShowFiveVersions(rv:, rv:, rv:, rv:, v:)');
newPlugin('ShowFrameNumber(b:scroll, i:offset, d:x, d:y, q:font, i:size, c:text_color, c:halo_color, i:font_width, d:font_angle)');
newPlugin('ShowSMPTE(d:fps, q:offset, i:offset_f, d:x, d:y, q:font, i:size, c:text_color, c:halo_color, i:font_width, d:font_angle)');
newPlugin('ShowTime(i:offset_f, d:x, d:y, q:font, i:size, c:text_color, c:halo_color, i:font_width, d:font_angle)');
