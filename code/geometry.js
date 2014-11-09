var newPlugin = require('./plugin-definition-system').newPlugin;

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
