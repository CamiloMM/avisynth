var newPlugin = require('./plugins').newPlugin;

// Overlay and Mask filters. See definitions.js.

var overlayModes = 'Blend, Add, Subtract, Multiply, Chroma, Luma, Lighten, Darken, SoftLight, HardLight, Difference, Exclusion';

newPlugin('Layer(rv:, rv:, t:op, i:level, i:x, i:y, i:threshold, b:use_chroma)', 'add, subtract, lighten, darken, fast, mul');
newPlugin('Mask(rv:, v:)');
newPlugin('ResetMask(v:)');
newPlugin('ColorKeyMask(c:, i:, i:, i:)');
newPlugin('MaskHS(i:startHue, i:endHue, i:maxSat, i:minSat, b:coring)');
newPlugin('Overlay(rv:, i:x, i:y, v:mask, d:opacity, t:mode, b:greymask, q:output, b:ignore_conditional, b:pc_range)', overlayModes);
newPlugin('Subtract(rv:, rv:)');
