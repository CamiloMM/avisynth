var path          = require('path');
var fs            = require('fs');
var os            = require('os');
var system        = require('../code/system');

describe('system-level features', function() {
    it('should create a temporary directory', function() {
        var tmp = path.resolve(os.tmpdir(), 'avisynth.js-' + process.pid);
        system.cleanUp();
        if (fs.existsSync(tmp)) throw new Error('"' + tmp + '" should not exist!');
        system.init();
        if (!fs.existsSync(tmp)) throw new Error('"' + tmp + '" should exist!');
    });
});
