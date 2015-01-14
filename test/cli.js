var path     = require('path');
var should   = require('chai').should();
var expect   = require('chai').expect;
var avisynth = require('../main');
var system   = require('../code/system');
var my       = require('../package.json');

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
        if (typeof expectedOut === 'string') {
            expect(stdout).to.equal(expectedOut);
        } else {
            expect(expectedOut(stdout)).to.equal(true);
        }
        if (typeof expectedErr === 'string') {
            expect(stderr).to.equal(expectedErr);
        } else {
            expect(expectedErr(stderr)).to.equal(true);
        }

        doneCallback();
    });
}

describe('Command-line interface', function() {
    this.timeout(10000); // All tests here shouldn't fail because of timeouts.

    describe('avisynth-js version', function() {
        it('should print the version number', function(done) {
            testCli(done, ['version'], null, 0, my.version + '\n', '');
        });
    });

    describe('avisynth-js help', function() {
        it('should print the help without warnings', function(done) {
            testCli(done, ['help'], null, 0, function(text) {
                var lines = text.split(/\r?\n/);
                var ok = true;
                lines.forEach(function(line) {
                    if (/^Bad argument: /.test(line)) ok = false;
                });
                if (!/^Usage: /.test(lines[4])) ok = false;
                return ok;
            }, '');
        });

        it('should print help with warnings when a bad command is used', function(done) {
            testCli(done, ['feminism'], null, 1, function(text) {
                var lines = text.split(/\r?\n/);
                var ok = true;
                if (lines[4] !== 'Bad argument: "feminism"') ok = false;
                if (!/^Usage: /.test(lines[6])) ok = false;
                return ok;
            }, '');
        });
    });

    describe('avisynth-js info', function() {
        it('should return expected info (NTSC broadcast example)', function(done) {
            // Let's cook up a NTSC broadcast example.
            var script = new avisynth.Script();
            script.colorBarsHD(640, 480);
            script.assumeFPS('ntsc_film');
            script.trim(1, 1438);
            script.code('AudioDub(Tone(54.321, 432, 44056, 1))');
            script.convertAudioTo16bit();
            script.convertToYV12();
            script.assumeFieldBased();
            script.assumeTFF();

            var info = {
                width         : 640,
                height        : 480,
                ratio         : '4:3',
                fps           : 23.976,
                fpsFraction   : '24000/1001',
                videoTime     : 59.9766,
                frameCount    : 1438,
                colorspace    : 'YV12',
                bitsPerPixel  : 12,
                interlaceType : 'field-based',
                fieldOrder    : 'TFF',
                channels      : 1,
                bitsPerSample : 16,
                sampleType    : 'int',
                audioTime     : 54.321,
                samplingRate  : 44056,
                sampleCount   : 2393166,
                blockSize     : 2
            };

            var args = ['info', script.getPath()];
            var infoJson = JSON.stringify(info, undefined, 4);
            testCli(done, args, null, 0, infoJson + '\n', '');
        });

        it('should return expected info (1080p production example)', function(done) {
            // Let's cook up a 1080p "production-grade" example.
            var script = new avisynth.Script();
            script.colorBarsHD(1920, 1080);
            script.assumeFPS(60);
            script.trim(1, 3600);
            script.code('AudioDub(Tone(60, 528, 48000, 6))');
            script.convertAudioToFloat();
            script.convertToYUY2();
            script.assumeFrameBased();

            var info = {
                width         : 1920,
                height        : 1080,
                ratio         : '16:9',
                fps           : 60,
                fpsFraction   : '60/1',
                videoTime     : 60,
                frameCount    : 3600,
                colorspace    : 'YUY2',
                bitsPerPixel  : 16,
                interlaceType : 'frame-based',
                fieldOrder    : 'BFF',
                channels      : 6,
                bitsPerSample : 32,
                sampleType    : 'float',
                audioTime     : 60,
                samplingRate  : 48000,
                sampleCount   : 2880000,
                blockSize     : 24
            };

            var args = ['info', script.getPath()];
            var infoJson = JSON.stringify(info, undefined, 4);
            testCli(done, args, null, 0, infoJson + '\n', '');
        });
    });
});
