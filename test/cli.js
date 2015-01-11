var path   = require('path');
var should = require('chai').should();
var expect = require('chai').expect;
var system = require('../code/system');

// Since testing a command line script is a bunch of boilerplate, I'll abstract it.
function testCli(doneCallback, args, stdin, expectedCode, expectedOut, expectedErr) {
    // Note that while we use a shebang in the cli script and npm can wrap it in
    // shell scripts automatically, in this case we're running it by itself and
    // in Windows shebangs don't count. So we must explicitely run it through node.
    var cli = path.resolve(__dirname, '../cli.js');
    var args = [cli].concat(args);
    // Also note that we're reusing system's spawn because we're not masochists.
    system.spawn('node', args, __dirname, true, function(returnCode, stdout, stderr) {
        expect(returnCode).to.equal(expectedCode);
        // Note how expectedOut and expectedErr can be strings or validator functions.
        var targets = {stdout: 'expectedOut', stderr: 'expectedErr'};
        for (var i in targets) {
            if (typeof targets[i] === 'string') {
                expect(i).to.equal(targets[i]);
            } else {
                expect(targets[i](i)).to.equal(true);
            }
        }
    });
}

describe('Command-line interface', function() {
    describe('avisynth-js version', function() {
        ;
    });
});
