var path          = require('path');
var fs            = require('fs');
var os            = require('os');
var system        = require('../code/system');

describe('system-level features', function() {
    it('should create a temporary directory with .init()', function() {
        var tmp = path.resolve(os.tmpdir(), 'avisynth.js-' + process.pid);
        system.cleanUp();
        if (fs.existsSync(tmp)) throw new Error('"' + tmp + '" should not exist!');
        system.init();
        if (!fs.existsSync(tmp)) throw new Error('"' + tmp + '" should exist!');
    });

    it('should remove a temporary directory with .cleanUp()', function() {
        var tmp = path.resolve(os.tmpdir(), 'avisynth.js-' + process.pid);
        system.init();
        if (!fs.existsSync(tmp)) throw new Error('"' + tmp + '" should exist!');
        system.cleanUp();
        system.cleanUp(); // Should not crash or something.
        if (fs.existsSync(tmp)) throw new Error('"' + tmp + '" should not exist!');
    });
});
