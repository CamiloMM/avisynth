var newPlugin = require('./plugins').newPlugin;

// Conditional and other meta filters. See definitions.js.

var operators = 'equals, greaterthan, lessthan, =, >, <, =='

newPlugin('ConditionalFilter(rv:, rv:, rq:, rt:, rq:, b:show)', operators);
newPlugin('ConditionalSelect(rq:, rmv:, b:show)');
newPlugin('ScriptClip(rq:, b:show, b:after_frame)');
newPlugin('FrameEvaluate(rq:, b:)');
newPlugin('ConditionalReader(f:, rv:, b:)');
