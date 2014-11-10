var newPlugin = require('./plugins').newPlugin;

// Conditional and other meta filters. See definitions.js.

var operators = 'equals, greaterthan, lessthan, =, >, <, =='

newPlugin('ConditionalFilter(rv:, rv:, rq:, rt:, rq:, b:show)', operators);
newPlugin('ConditionalSelect(rq:, rmv:, b:show)');