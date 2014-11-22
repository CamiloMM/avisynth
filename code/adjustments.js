var newPlugin = require('./plugins').newPlugin;

// Color conversion and adjustment filters. See definitions.js.

var matrices = 'Rec601, PC.601, Rec709, PC.709, AVERAGE';
var showTypes = 'RGB24, RGB32, YUY2, YV12, Y8';

var convertParams = 't:matrix, b:interlaced, q:ChromaInPlacement, q:chromaresample';
var mergeParams = 'rv:, rv:, d:weight';

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
newPlugin('GreyScale(q:matrix)');
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
