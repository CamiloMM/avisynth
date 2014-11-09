var newPlugin = require('./plugins').newPlugin;

// Interlace filters. See definitions.js.

newPlugin('AssumeFieldBased(v:)');
newPlugin('AssumeFrameBased(v:)');
newPlugin('AssumeBFF(v:)');
newPlugin('AssumeTFF(v:)');
newPlugin('ComplementParity(v:)');
newPlugin('Bob(d:b, d:c, i:height)');
newPlugin('Weave(v:)');
newPlugin('DoubleWeave(v:)');
newPlugin('WeaveColumns(ri:)');
newPlugin('WeaveRows(ri:)');
newPlugin('PeculiarBlend(ri:)');
newPlugin('Pulldown(ri:, ri:)');
newPlugin('SeparateFields(v:)');
newPlugin('SeparateColumns(ri:)');
newPlugin('SeparateRows(ri:)');
newPlugin('SwapFields(v:)');
