var newPlugin = require('./plugins').newPlugin;

// Conditional and other meta filters. See definitions.js.

var operators = 'equals, greaterthan, lessthan, =, >, <, =='

newPlugin('ConditionalFilter(rv:, rv:, rq:, rt:, rq:, b:show)', operators);
newPlugin('ConditionalSelect(rq:, rmv:, b:show)');
newPlugin('ScriptClip(rq:, b:show, b:after_frame)');
newPlugin('FrameEvaluate(rq:, b:)');
newPlugin('ConditionalReader(f:, rv:, b:)');
newPlugin('WriteFile(f:, rmq:, b:append, b:flush)');
newPlugin('WriteFileIf(f:, rmq:, b:append, b:flush)');
newPlugin('WriteFileStart(f:, rmq:, b:append)');
newPlugin('WriteFileEnd(f:, rmq:, b:append)');
newPlugin('Animate(ri:, ri:, rq:, qra:, qram:)');
newPlugin('ApplyRange(ri:, ri:, rq:, qram:)');
newPlugin('TCPServer(i:)');
newPlugin('TCPSource(rq:, i:port, t:compression)', 'None, LZO, Huffman, GZip');
