var newPlugin = require('./plugin-definition-system').newPlugin;

// Pixel restoration filters

newPlugin('Blur(rd:, d:, b:MMX)');
newPlugin('Sharpen(rd:, d:, b:MMX)');
newPlugin('GeneralConvolution(i:bias, q:matrix, d:divisor, b:auto)');
newPlugin('SpatialSoften(ri:, ri:, ri:)');
newPlugin('TemporalSoften(ri:, ri:, ri:, i:scenechange, i:mode)');
newPlugin('FixBrokenChromaUpsampling');
