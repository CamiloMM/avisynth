var path          = require('path');
var expect        = require('chai').expect;
var should        = require('chai').should();
var avisynth      = require('../main');
var pluginSystem  = require('../code/plugin-system');
var AvisynthError = require('../code/errors').AvisynthError;

var fakePluginsDir = path.resolve(__dirname, 'plugins');
var mediaDir = path.resolve(__dirname, 'media');
var scriptPath = path.resolve(fakePluginsDir, 'colors_rgb.avsi');
var pluginPath = path.resolve(fakePluginsDir, 'DeDup.dll');
var textFile   = path.resolve(fakePluginsDir, 'colors_rgb.txt');
var missing    = path.resolve(fakePluginsDir, 'non-existent.dll');
var aviFile    = path.resolve(mediaDir, 'example.avi');
var wavFile    = path.resolve(mediaDir, 'example.wav');
var jpgFile    = path.resolve(mediaDir, 'example.jpg');
var gifFile    = path.resolve(mediaDir, 'example.gif');
var rand = Math.random(); // Guess what, initializing it takes ~260ms for me on Win7.

describe('Plugin system', function() {

    it('should be exposed as an avisynth.addPlugin reference', function() {
        avisynth.addPlugin.should.equal(pluginSystem.addPlugin);
    });

    it('should allow adding plugins and getting them later', function() {
        avisynth.addPlugin('foo', function() {});
        expect(pluginSystem.plugins['foo']).to.exist;
        pluginSystem.plugins['foo'].code.should.be.a.function;
    });

    it('should allow plugins to be defined with options', function() {
        var script = new avisynth.Script;
        avisynth.addPlugin('HaveOptions', {}, function() {});
        script.haveOptions.should.be.a.function;
    });

    describe('naming and aliases', function() {
        it('should throw an error if adding a plugin with a name collision', function() {
            avisynth.addPlugin('Bar', function() {});
            avisynth.addPlugin.bind(avisynth, 'baR', function() {}).should.throw(AvisynthError);
        });

        it('should throw an error if adding a plugin with a reserved name', function() {
            avisynth.addPlugin.bind(avisynth, 'code'         , function() {}).should.throw(AvisynthError);
            avisynth.addPlugin.bind(avisynth, 'references'   , function() {}).should.throw(AvisynthError);
            avisynth.addPlugin.bind(avisynth, 'load'         , function() {}).should.throw(AvisynthError);
            avisynth.addPlugin.bind(avisynth, 'autoload'     , function() {}).should.throw(AvisynthError);
            avisynth.addPlugin.bind(avisynth, 'allReferences', function() {}).should.throw(AvisynthError);
            avisynth.addPlugin.bind(avisynth, 'fullCode'     , function() {}).should.throw(AvisynthError);
        });

        it('should automatically lowercase plugin names, and generate aliases', function() {
            avisynth.addPlugin('FooBar', function() {});
            pluginSystem.plugins['foobar'].aliases.should.deep.equal(['fooBar', 'FooBar']);
        });

        it('should not generate unnecessary aliases', function() {
            avisynth.addPlugin('pluginOne', function() {});
            pluginSystem.plugins['pluginone'].aliases.should.deep.equal(['pluginOne']);
            avisynth.addPlugin('Plugintwo', function() {});
            pluginSystem.plugins['plugintwo'].aliases.should.deep.equal(['Plugintwo']);
            avisynth.addPlugin('pluginthree', function() {});
            pluginSystem.plugins['pluginthree'].aliases.should.deep.equal([]);
        });

        it('should make plugins available as (aliased) Script methods', function() {
            var script = new avisynth.Script;
            avisynth.addPlugin('pluginfour' , function() {});
            avisynth.addPlugin('pluginFive' , function() {});
            avisynth.addPlugin('Pluginsix'  , function() {});
            avisynth.addPlugin('PluginSeven', function() {});
            script.pluginfour.should.be.a.function;
            script.pluginfive.should.equal(script.pluginFive);
            script.pluginsix.should.equal(script.Pluginsix);
            script.pluginseven.should.be.a.function;
            script.pluginSeven.should.be.a.function;
            script.PluginSeven.should.be.a.function;
        });
    });

    describe('loading and autoloading', function() {
        it('should allow plugins to be exposed with "load" requirements', function() {
            var script = new avisynth.Script;
            avisynth.addPlugin('RequireStuff', {
                load: [scriptPath, pluginPath]
            }, function() {});
            script.requireStuff();
            var code = script.fullCode().split('\n');
            code.slice(-3)[0].should.equal('Import("' + scriptPath + '")');
            code.slice(-2)[0].should.equal('LoadPlugin("' + pluginPath + '")');
        });

        it('should allow plugins to be exposed with "autoload" requirements', function() {
            var script = new avisynth.Script;
            avisynth.addPlugin('RequireDir', {
                autoload: [fakePluginsDir]
            }, function() {});
            script.requireDir();
            var code = script.fullCode().split('\n');
            // Filesystem order might screw things up, so we're sorting the relevant lines.
            code.slice(-3, -1).sort().should.deep.equal([
                'Import("' + scriptPath + '")',
                'LoadPlugin("' + pluginPath + '")'
            ]);
            code.slice(-1)[0].should.equal('');
        });

        it('should allow "load" and "autoload" to be autocasted to array', function() {
            var script1 = new avisynth.Script;
            avisynth.addPlugin('RequireStuff2', {
                load: scriptPath
            }, function() {});
            script1.requireStuff2();
            var code = script1.fullCode().split('\n');
            code.slice(-2)[0].should.equal('Import("' + scriptPath + '")');
            code.slice(-1)[0].should.equal('');

            var script2 = new avisynth.Script;
            avisynth.addPlugin('RequireDir2', {
                autoload: fakePluginsDir
            }, function() {});
            script2.requireDir2();
            var code = script2.fullCode().split('\n');
            // Filesystem order might screw things up, so we're sorting the relevant lines.
            code.slice(-3, -1).sort().should.deep.equal([
                'Import("' + scriptPath + '")',
                'LoadPlugin("' + pluginPath + '")'
            ]);
            code.slice(-1)[0].should.equal('');
        });
    });

    describe('execution facilities', function() {
        it('should run plugin code when an alias is invoked', function() {
            var script = new avisynth.Script;
            var foo = 'bar'
            avisynth.addPlugin('ClosureTest', function() { foo = 'baz'; });
            script.closureTest();
            foo.should.equal('baz');
        });

        it('should insert code returned from plugin into script', function() {
            var script = new avisynth.Script;
            var code = 'Subtitle("' + rand + '")';
            avisynth.addPlugin('RandomSub', function() { return code; });
            script.randomsub();
            var lines = script.fullCode().split('\n');
            lines.slice(-2)[0].should.equal(code);
            lines.slice(-1)[0].should.equal('');
        });

        it('should insert plugin code after previously inserted code', function() {
            var script1 = new avisynth.Script('Version()');
            var script2 = avisynth.Script('Version()');
            var code = 'Subtitle("' + rand + rand + '")';
            avisynth.addPlugin('RandomSubTwice', function() { return code; });
            script1.randomSubTwice();
            script2.RandomSubTwice();
            var lines1 = script1.fullCode().split('\n');
            var lines2 = script2.fullCode().split('\n');
            lines1.slice(-3)[0].should.equal('Version()');
            lines1.slice(-2)[0].should.equal(code);
            lines1.slice(-1)[0].should.equal('');
            lines2.slice(-3)[0].should.equal('Version()');
            lines2.slice(-2)[0].should.equal(code);
            lines2.slice(-1)[0].should.equal('');
        });
    });
});

describe('Base plugin implementations (core filters)', function() {
    // Checks a plugin. Params are optional (and, if present, an array).
    function checkPlugin(name, params, expected) {
        if (!expected) { expected = params; params = []; }
        var script = new avisynth.Script('Version()');
        script[name].apply(script, params);
        var lines = script.fullCode().split('\n');
        lines.slice(-3)[0].should.equal('Version()');
        lines.slice(-2)[0].should.equal(expected);
        lines.slice(-1)[0].should.equal('');
    }

    // Auto-tests a filter which takes no parameters.
    it.is = it.is || {};
    it.is.parameterless = function(name) {
        it(name, function() {
            checkPlugin.bind(null, name, [false], name + '(false)').should.throw(AvisynthError);
            checkPlugin(name, [], name + '()');
        });
    }

    // Auto-tests that a filter requires parameters.
    function requiresParameters(name) {
        checkPlugin.bind(null, name, [], name + '()').should.throw(AvisynthError);
    }

    describe('Media file filters', function() {
        it('AviSource', function() {
            // AviSource(string filename [, ... ], [bool audio = true], [string pixel_type = "FULL"], [string fourCC])
            requiresParameters('AviSource');
            checkPlugin.bind(null, 'AviSource', [aviFile, true, 'PG13'], 'AviSource("' + aviFile + '", audio=true, pixel_type="PG13")').should.throw(AvisynthError);
            checkPlugin('AviSource', ['fake.avi'], 'AviSource("' + path.resolve('fake.avi') + '")');
            checkPlugin('AviSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'AviSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('AviSource', [aviFile, false], 'AviSource("' + aviFile + '", audio=false)');
            checkPlugin('AviSource', [aviFile, true, 'YV24'], 'AviSource("' + aviFile + '", audio=true, pixel_type="YV24")');
            checkPlugin('AviSource', [aviFile, false, 'YV16', 'PR0N'], 'AviSource("' + aviFile + '", audio=false, pixel_type="YV16", fourCC="PR0N")');
            checkPlugin('AviSource', [aviFile, aviFile, aviFile, aviFile, aviFile, false, 'YV12', 'PR0N'], 'AviSource("' + [aviFile, aviFile, aviFile, aviFile, aviFile].join('", "') + '", audio=false, pixel_type="YV12", fourCC="PR0N")');
        });

        it('OpenDMLSource', function() {
            // OpenDMLSource(string filename [, ... ], [bool audio = true], [string pixel_type = "FULL"], [string fourCC])
            requiresParameters('OpenDMLSource');
            checkPlugin.bind(null, 'OpenDMLSource', [aviFile, true, 'PG13'], 'OpenDMLSource("' + aviFile + '", audio=true, pixel_type="PG13")').should.throw(AvisynthError);
            checkPlugin('OpenDMLSource', ['fake.avi'], 'OpenDMLSource("' + path.resolve('fake.avi') + '")');
            checkPlugin('OpenDMLSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'OpenDMLSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('OpenDMLSource', [aviFile, false], 'OpenDMLSource("' + aviFile + '", audio=false)');
            checkPlugin('OpenDMLSource', [aviFile, true, 'YV411'], 'OpenDMLSource("' + aviFile + '", audio=true, pixel_type="YV411")');
            checkPlugin('OpenDMLSource', [aviFile, false, 'YUY2', 'PR0N'], 'OpenDMLSource("' + aviFile + '", audio=false, pixel_type="YUY2", fourCC="PR0N")');
            checkPlugin('OpenDMLSource', [aviFile, aviFile, aviFile, aviFile, aviFile, false, 'RGB32', 'PR0N'], 'OpenDMLSource("' + [aviFile, aviFile, aviFile, aviFile, aviFile].join('", "') + '", audio=false, pixel_type="RGB32", fourCC="PR0N")');
        });

        it('AviFileSource', function() {
            // AviFileSource(string filename [, ... ], [bool audio = true], [string pixel_type = "FULL"], [string fourCC])
            requiresParameters('AviFileSource');
            checkPlugin.bind(null, 'AviFileSource', [aviFile, true, 'PG13'], 'AviFileSource("' + aviFile + '", audio=true, pixel_type="PG13")').should.throw(AvisynthError);
            checkPlugin('AviFileSource', ['fake.avi'], 'AviFileSource("' + path.resolve('fake.avi') + '")');
            checkPlugin('AviFileSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'AviFileSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('AviFileSource', [aviFile, false], 'AviFileSource("' + aviFile + '", audio=false)');
            checkPlugin('AviFileSource', [aviFile, true, 'Y8'], 'AviFileSource("' + aviFile + '", audio=true, pixel_type="Y8")');
            checkPlugin('AviFileSource', [aviFile, false, 'AUTO', 'PR0N'], 'AviFileSource("' + aviFile + '", audio=false, pixel_type="AUTO", fourCC="PR0N")');
            checkPlugin('AviFileSource', [aviFile, aviFile, aviFile, aviFile, aviFile, false, 'FULL', 'PR0N'], 'AviFileSource("' + [aviFile, aviFile, aviFile, aviFile, aviFile].join('", "') + '", audio=false, pixel_type="FULL", fourCC="PR0N")');
        });

        it('WavSource', function() {
            // WavSource(string filename [, ... ])
            requiresParameters('WavSource');
            checkPlugin('WavSource', ['fake.wav'], 'WavSource("' + path.resolve('fake.wav') + '")');
            checkPlugin('WavSource', [wavFile, 'fake1.avi', aviFile, 'fake2.avi', wavFile], 'WavSource("' + [wavFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), wavFile].join('", "') + '")');
        });

        it('DirectShowSource', function() {
            // DirectShowSource(string filename [, float fps, bool seek, bool audio, bool video, bool convertfps, bool seekzero, int timeout, string pixel_type, int framecount, string logfile, int logmask])
            requiresParameters('DirectShowSource');
            checkPlugin.bind(null, 'DirectShowSource', [aviFile, aviFile], 'DirectShowSource("' + aviFile + '")').should.throw(AvisynthError);
            checkPlugin('DirectShowSource', [aviFile], 'DirectShowSource("' + aviFile + '")');
            checkPlugin('DirectShowSource', [aviFile, 123.456], 'DirectShowSource("' + aviFile + '", fps=123.456)');
            checkPlugin('DirectShowSource', [aviFile, 24, false], 'DirectShowSource("' + aviFile + '", fps=24, seek=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, true, false], 'DirectShowSource("' + aviFile + '", seek=true, audio=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, true, false], 'DirectShowSource("' + aviFile + '", audio=true, video=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, true, false], 'DirectShowSource("' + aviFile + '", video=true, convertfps=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, true, false], 'DirectShowSource("' + aviFile + '", convertfps=true, seekzero=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, true, 123456], 'DirectShowSource("' + aviFile + '", seekzero=true, timeout=123456)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, 123456, 'RGB'], 'DirectShowSource("' + aviFile + '", timeout=123456, pixel_type="RGB")');
            checkPlugin.bind(null, 'DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'PG13'], 'DirectShowSource("' + aviFile + '", pixel_type="PG13")').should.throw(AvisynthError);
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'YUVex', 1234567890], 'DirectShowSource("' + aviFile + '", pixel_type="YUVex", framecount=1234567890)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1234567890, textFile], 'DirectShowSource("' + aviFile + '", framecount=1234567890, logfile="' + textFile + '")');
            checkPlugin('DirectShowSource', ['fake.avi', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'fake.txt'], 'DirectShowSource("' + path.resolve('fake.avi') + '", logfile="' + path.resolve('fake.txt') + '")');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, textFile, 32], 'DirectShowSource("' + aviFile + '", logfile="' + textFile + '", logmask=32)');
        });

        it('ImageSource', function() {
            // ImageSource(string file = "c:\%06d.ebmp", int start = 0, int end = 1000, float fps = 24, bool use_DevIL = false, bool info = false, string pixel_type = "RGB24")
            requiresParameters('ImageSource');
            checkPlugin.bind(null, 'ImageSource', [jpgFile, jpgFile], 'ImageSource("' + jpgFile + '")').should.throw(AvisynthError);
            checkPlugin('ImageSource', ['./fake-%06d.jpg'], 'ImageSource("' + path.resolve('./fake-%06d.jpg') + '")');
            checkPlugin('ImageSource', [jpgFile, 123, 456, 123.456, false, false], 'ImageSource("' + jpgFile + '", start=123, end=456, fps=123.456, use_DevIL=false, info=false)');
            checkPlugin('ImageSource', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'Y8'], 'ImageSource("' + jpgFile + '", pixel_type="Y8")');
            checkPlugin.bind(null, 'ImageSource', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'PG13'], 'ImageSource("' + jpgFile + '", pixel_type="PG13")').should.throw(AvisynthError);
        });

        it('ImageSourceAnim', function() {
            // ImageSourceAnim(string file, float fps = 24, bool info = false, string pixel_type = "RGB32")
            requiresParameters('ImageSourceAnim');
            checkPlugin.bind(null, 'ImageSourceAnim', [gifFile, gifFile], 'ImageSourceAnim("' + gifFile + '")').should.throw(AvisynthError);
            checkPlugin('ImageSourceAnim', ['./fake.gif'], 'ImageSourceAnim("' + path.resolve('./fake.gif') + '")');
            checkPlugin('ImageSourceAnim', [gifFile, 123.456, false], 'ImageSourceAnim("' + gifFile + '", fps=123.456, info=false)');
            checkPlugin('ImageSourceAnim', [gifFile, undefined, undefined, 'Y8'], 'ImageSourceAnim("' + gifFile + '", pixel_type="Y8")');
            checkPlugin.bind(null, 'ImageSourceAnim', [gifFile, undefined, undefined, 'PG13'], 'ImageSourceAnim("' + gifFile + '", pixel_type="PG13")').should.throw(AvisynthError);
        });

        it('ImageReader', function() {
            // ImageReader(string file = "c:\%06d.ebmp", int start = 0, int end = 1000, float fps = 24, bool use_DevIL = false, bool info = false, string pixel_type = "RGB24")
            requiresParameters('ImageReader');
            checkPlugin.bind(null, 'ImageReader', [jpgFile, jpgFile], 'ImageReader("' + jpgFile + '")').should.throw(AvisynthError);
            checkPlugin('ImageReader', ['./fake-%06d.jpg'], 'ImageReader("' + path.resolve('./fake-%06d.jpg') + '")');
            checkPlugin('ImageReader', [jpgFile, 123, 456, 123.456, false, false], 'ImageReader("' + jpgFile + '", start=123, end=456, fps=123.456, use_DevIL=false, info=false)');
            checkPlugin('ImageReader', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'Y8'], 'ImageReader("' + jpgFile + '", pixel_type="Y8")');
            checkPlugin.bind(null, 'ImageReader', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'PG13'], 'ImageReader("' + jpgFile + '", pixel_type="PG13")').should.throw(AvisynthError);
        });

        // Screw it, I'm going to be less rigid with these tests.
        // Their implementations are similar enough that a bug would be catched anyway.

        it('ImageWriter', function() {
            // ImageWriter(clip clip, string file = "c:\", int start = 0, int end = 0, string type = "ebmp", bool info = false)
            // ImageWriter(clip clip, string file = "c:\", int start = 0, int -num_frames, string type = "ebmp", bool info = false)
            requiresParameters('ImageWriter');
            checkPlugin('ImageWriter', ['./%03d', 123, -456, 'png', false], 'ImageWriter("' + path.resolve('./%03d') + '", start=123, end=-456, type="png", info=false)');
        });

        it('SegmentedAviSource', function() {
            // SegmentedAviSource(string base_filename [, ... ] [, bool audio] [, string pixel_type])
            requiresParameters('SegmentedAviSource');
            checkPlugin('SegmentedAviSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'SegmentedAviSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('SegmentedAviSource', ['fake1.avi', aviFile, false, 'YV411'], 'SegmentedAviSource("' + [path.resolve('fake1.avi'), aviFile].join('", "') + '", audio=false, pixel_type="YV411")');
        });

        it('SegmentedDirectShowSource', function() {
            // SegmentedDirectShowSource(string base_filename [, ... ] [, float fps, bool seek, bool audio, bool video, bool convertfps, bool seekzero, int timeout, string pixel_type])
            requiresParameters('SegmentedDirectShowSource');
            checkPlugin('SegmentedDirectShowSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'SegmentedDirectShowSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('SegmentedDirectShowSource', ['fake1.avi', aviFile, 123.456, false, true, false, true, false, 123456, 'YUVex'], 'SegmentedDirectShowSource("' + [path.resolve('fake1.avi'), aviFile].join('", "') + '", fps=123.456, seek=false, audio=true, video=false, convertfps=true, seekzero=false, timeout=123456, pixel_type="YUVex")');
        });

        // This is a very complex function. We'll only support its most basic usage.
        // See http://avisynth.nl/index.php/SoundOut
        it.is.parameterless('SoundOut');
    });

    describe('Color conversion and adjustment filters', function() {
        it('ColorYUV', function() {
            // ColorYUV(clip [, float gain_y] [, float off_y] [, float gamma_y] [, float cont_y] [, float gain_u] [, float off_u] [, float gamma_u] [, float cont_u] [, float gain_v] [, float off_v] [, float gamma_v] [, float cont_v] [, string levels] [, string opt] [, boolean showyuv] [, boolean analyze] [, boolean autowhite] [, boolean autogain] [, boolean conditional])
            checkPlugin('ColorYUV', [12.34, 23.45, 34.56, 45.67, 56.78, 67.89, 78.90, 89.01, 90.12, 123.456, 789, 12345.67890, 'TV->PC', 'coring', false, true, false, true, false], 'ColorYUV(gain_y=12.34, off_y=23.45, gamma_y=34.56, cont_y=45.67, gain_u=56.78, off_u=67.89, gamma_u=78.9, cont_u=89.01, gain_v=90.12, off_v=123.456, gamma_v=789, cont_v=12345.6789, levels="TV->PC", opt="coring", showyuv=false, analyze=true, autowhite=false, autogain=true, conditional=false)');
            checkPlugin('ColorYUV', [], 'ColorYUV()');
        });

        it('ConvertBackToYUY2', function() {
            // ConvertBackToYUY2(clip [, string matrix])
            checkPlugin.bind(null, 'ConvertBackToYUY2', ['invalid'], 'ConvertBackToYUY2(matrix="invalid")').should.throw(AvisynthError);
            checkPlugin('ConvertBackToYUY2', [], 'ConvertBackToYUY2()');
            checkPlugin('ConvertBackToYUY2', ['PC.709'], 'ConvertBackToYUY2(matrix="PC.709")');
        });

        it('ConvertToY8', function() {
            // ConvertToY8(clip [, string matrix])
            checkPlugin.bind(null, 'ConvertToY8', ['invalid'], 'ConvertToY8(matrix="invalid")').should.throw(AvisynthError);
            checkPlugin('ConvertToY8', [], 'ConvertToY8()');
            checkPlugin('ConvertToY8', ['Rec601'], 'ConvertToY8(matrix="Rec601")');
        });

        ['ConvertToRGB', 'ConvertToRGB24', 'ConvertToRGB32', 'ConvertToYUY2',
        'ConvertToYV411', 'ConvertToYV16', 'ConvertToYV24'].forEach(function(name) {
            it(name, function() {
                // name(clip [, string matrix] [, bool interlaced] [, string ChromaInPlacement] [, string chromaresample])
                checkPlugin.bind(null, name, ['invalid'], name + '(matrix="invalid")').should.throw(AvisynthError);
                checkPlugin(name, [], name + '()');
                checkPlugin(name, ['AVERAGE', false, 'MPEG2', 'spline36'], name + '(matrix="AVERAGE", interlaced=false, ChromaInPlacement="MPEG2", chromaresample="spline36")');
            });
        });

        it('ConvertToYV12', function() {
            // ConvertToYV12(clip [, string matrix] [, bool interlaced] [, string ChromaInPlacement] [, string chromaresample])
            checkPlugin.bind(null, 'ConvertToYV12', ['invalid'], 'ConvertToYV12(matrix="invalid")').should.throw(AvisynthError);
            checkPlugin('ConvertToYV12', [], 'ConvertToYV12()');
            checkPlugin('ConvertToYV12', ['AVERAGE', false, 'MPEG2', 'sinc', 'DV'], 'ConvertToYV12(matrix="AVERAGE", interlaced=false, ChromaInPlacement="MPEG2", chromaresample="sinc", ChromaOutPlacement="DV")');
        });

        it('FixLuminance', function() {
            // FixLuminance(clip clip, int intercept, int slope)
            checkPlugin('FixLuminance', [], 'FixLuminance()');
            checkPlugin('FixLuminance', [123, 456], 'FixLuminance(123, 456)');
        });

        it('Greyscale', function() {
            // Greyscale(clip clip [, string matrix])
            checkPlugin('Greyscale', [], 'Greyscale()');
            checkPlugin('Greyscale', ['rec709'], 'Greyscale(matrix="rec709")');
        });

        it('Invert', function() {
            // Invert(clip clip [, string channels])
            checkPlugin('Invert', [], 'Invert()');
            checkPlugin('Invert', ['BG'], 'Invert(channels="BG")');
        });

        it('Levels', function() {
            // Levels(clip input, int input_low, float gamma, int input_high, int output_low, int output_high [, bool coring] [, bool dither])
            checkPlugin.bind(null, 'Levels', [0, 1, 255, 0], 'Levels(0, 1, 255, 0)').should.throw(AvisynthError);
            checkPlugin('Levels', [0, 1, 255, 0, 255], 'Levels(0, 1, 255, 0, 255)');
            checkPlugin('Levels', [0, 1, 255, 0, 255, true, false], 'Levels(0, 1, 255, 0, 255, coring=true, dither=false)');
        });

        it('Limiter', function() {
            // Limiter(clip clip [, int min_luma] [, int max_luma] [, int min_chroma] [, int max_chroma] [, string show])
            checkPlugin('Limiter', [], 'Limiter()');
            checkPlugin('Limiter', [1, 2, 3, 4, 'chroma_grey'], 'Limiter(min_luma=1, max_luma=2, min_chroma=3, max_chroma=4, show="chroma_grey")');
            checkPlugin.bind(null, 'Limiter', [5, 6, 7, 8, 'bad_option'], 'Limiter(min_luma=5, max_luma=6, min_chroma=7, max_chroma=8, show="bad_option")').should.throw(AvisynthError);
        });

        it('MergeARGB', function() {
            // MergeARGB(clip clipA, clip clipR, clip clipG, clip clipB)
            checkPlugin.bind(null, 'MergeARGB', ['foo', 'bar', 'baz'], 'MergeARGB(foo, bar, baz)').should.throw(AvisynthError);
            checkPlugin('MergeARGB', ['foo', 'bar', 'baz', 'quux'], 'MergeARGB(foo, bar, baz, quux)');
        });

        it('MergeRGB', function() {
            // MergeRGB(clip clipR, clip clipG, clip clipB [, string pixel_type])
            checkPlugin.bind(null, 'MergeRGB', ['foo', 'bar'], 'MergeRGB(foo, bar)').should.throw(AvisynthError);
            checkPlugin('MergeRGB', ['foo', 'bar', 'baz'], 'MergeRGB(foo, bar, baz)');
            checkPlugin('MergeRGB', ['foo', 'bar', 'baz', 'RGB24'], 'MergeRGB(foo, bar, baz, pixel_type="RGB24")');
            checkPlugin.bind(null, 'MergeRGB', ['foo', 'bar', 'baz', 'PG13'], 'MergeRGB(foo, bar, baz, pixel_type="PG13")').should.throw(AvisynthError);
        });

        ['Merge', 'MergeChroma', 'MergeLuma'].forEach(function(name) {
            it(name, function() {
                // name(clip clip1, clip clip2 [, float weight])
                checkPlugin.bind(null, name, ['foo'], name + '(foo)').should.throw(AvisynthError);
                checkPlugin(name, ['foo', 'bar'], name + '(foo, bar)');
                checkPlugin(name, ['foo', 'bar', 12.34], name + '(foo, bar, weight=12.34)');
            });
        });

        it('RGBAdjust', function() {
            // RGBAdjust(clip clip [, float red] [, float green] [, float blue] [, float alpha] [, float rb] [, float gb] [, float bb] [, float ab] [, float rg] [, float gg] [, float bg] [, float ag] [, bool analyze] [, bool dither])
            checkPlugin('RGBAdjust', [], 'RGBAdjust()');
            checkPlugin('RGBAdjust', [0.1, 0.2, 0.3, 0.4, 1, -2, 3, -4, 1.2, 3.4, 5.6, 1, true, false], 'RGBAdjust(0.1, 0.2, 0.3, 0.4, rb=1, gb=-2, bb=3, ab=-4, rg=1.2, gg=3.4, bg=5.6, ag=1, analyze=true, dither=false)');
        });

        ['ShowAlpha', 'ShowBlue', 'ShowGreen', 'ShowRed'].forEach(function(name) {
            it(name, function() {
                // name(clip clip, string pixel_type)
                checkPlugin.bind(null, name, ['PG13'], name + '(pixel_type="PG13")').should.throw(AvisynthError);
                checkPlugin(name, [], name + '()');
                checkPlugin(name, ['Y8'], name + '(pixel_type="Y8")');
            });
        });

        ['SwapUV', 'UToY', 'VToY', 'UToY8', 'VToY8'].forEach(function(name) {
            it(name, function() {
                // name(clip clip)
                checkPlugin(name, [], name + '()');
                checkPlugin(name, ['fooBar'], name + '(fooBar)');
            });
        });

        it('YToUV', function() {
            // YToUV(clip clipU, clip clipV [, clip clipY])
            checkPlugin.bind(null, 'YToUV', ['foo'], 'YToUV(foo)').should.throw(AvisynthError);
            checkPlugin('YToUV', ['foo', 'bar'], 'YToUV(foo, bar)');
            checkPlugin('YToUV', ['foo', 'bar', 'baz'], 'YToUV(foo, bar, baz)');
        });

        it('Tweak', function() {
            // Tweak(clip clip [, float hue] [, float sat] [, float bright] [, float cont] [, bool coring] [, bool sse] [, float startHue] [, float endHue] [, float maxSat] [, float minSat] [, float interp] [, bool dither])
            checkPlugin('Tweak', [], 'Tweak()');
            checkPlugin('Tweak', [0.1, 2.3, 4.5, 6.7, true, false, 8.9, 12.34, 56.78, 0, 123, false], 'Tweak(hue=0.1, sat=2.3, bright=4.5, cont=6.7, coring=true, sse=false, startHue=8.9, endHue=12.34, maxSat=56.78, minSat=0, interp=123, dither=false)');
        });
    });

    describe('Overlay and Mask filters', function() {
        it('Layer', function() {
            // Layer(clip base_clip, clip overlay_clip, string op, int level, int x, int y, int threshold, bool use_chroma)
            requiresParameters('Layer');
            checkPlugin.bind(null, 'Layer', ['foo', 'bar', 'overlay'], 'Layer(foo, bar, op="overlay")').should.throw(AvisynthError); // Admittedly, overlay should be allowed, it isn't in the docs so I suppose it isn't.
            checkPlugin('Layer', ['foo', 'bar'], 'Layer(foo, bar)');
            checkPlugin('Layer', ['foo', 'bar', 'lighten', 123, 12, -34, 42, true], 'Layer(foo, bar, op="lighten", level=123, x=12, y=-34, threshold=42, use_chroma=true)');
        });

        it('Mask', function() {
            // Mask(clip clip, mask_clip clip)
            requiresParameters('Mask');
            checkPlugin('Mask', ['foo'], 'Mask(foo)');
            checkPlugin('Mask', ['foo', 'bar'], 'Mask(foo, bar)');
        });

        it('ResetMask', function() {
            // ResetMask(clip clip)
            checkPlugin('ResetMask', [], 'ResetMask()');
            checkPlugin('ResetMask', ['foo'], 'ResetMask(foo)');
        });

        it('ColorKeyMask', function() {
            // ColorKeyMask(clip clip, int color [, int tolB, int tolG, int tolR])
            checkPlugin('ColorKeyMask', [], 'ColorKeyMask()'); // It's actually possible.
            checkPlugin('ColorKeyMask', [0], 'ColorKeyMask(0)');
            checkPlugin('ColorKeyMask', ['F0F'], 'ColorKeyMask(16711935)');
            checkPlugin('ColorKeyMask', ['blue', 10, 20, 30], 'ColorKeyMask(255, 10, 20, 30)');
            checkPlugin.bind(null, 'ColorKeyMask', [-1], 'ColorKeyMask(-1)').should.throw(AvisynthError);
        });

        it('MaskHS', function() {
            // MaskHS(clip [, int startHue, int endHue, int maxSat, int minSat, bool coring])
            checkPlugin('MaskHS', [], 'MaskHS()');
            checkPlugin('MaskHS', [10, 20, 30, 0, false], 'MaskHS(startHue=10, endHue=20, maxSat=30, minSat=0, coring=false)');
        });

        it('Overlay', function() {
            // Overlay(clip clip, clip overlay [, int x, int y, clip mask, float opacity, string mode, bool greymask, string output, bool ignore_conditional, bool pc_range])
            requiresParameters('Overlay');
            checkPlugin('Overlay', ['foo'], 'Overlay(foo)');
            checkPlugin('Overlay', ['foo', -1, 0, 'bar', 0.5, 'SoftLight', false, 'YUY2', true, false], 'Overlay(foo, x=-1, y=0, mask=bar, opacity=0.5, mode="SoftLight", greymask=false, output="YUY2", ignore_conditional=true, pc_range=false)');
        });

        it('Subtract', function() {
            // Subtract(clip1 clip, clip2 clip)
            requiresParameters('Subtract');
            checkPlugin.bind(null, 'Subtract', ['foo'], 'Subtract(foo)').should.throw(AvisynthError);
            checkPlugin('Subtract', ['foo', 'bar'], 'Subtract(foo, bar)');
        });
    });

    describe('Geometric deformation filters', function() {
        it('AddBorders', function() {
            // AddBorders(clip clip, int left, int top, int right, int bottom [, int color])
            requiresParameters('AddBorders');
            checkPlugin('AddBorders', [1, 2, 3, 4], 'AddBorders(1, 2, 3, 4)');
            checkPlugin('AddBorders', [10, 20, 30, 40, 'Chocolate'], 'AddBorders(10, 20, 30, 40, color=13789470)');
        });

        it('Crop', function() {
            // Crop(clip clip, int left, int top, int width, int height, bool align)
            // Crop(clip clip, int left, int top, int -right, int -bottom, bool align)
            checkPlugin.bind(null, 'Crop', [1, 2, 3], 'Crop(1, 2, 3)').should.throw(AvisynthError);
            checkPlugin('Crop', [1, 2, 3, -4], 'Crop(1, 2, 3, -4)');
            checkPlugin('Crop', [5, 6, -7, 8, false], 'Crop(5, 6, -7, 8, align=false)');
        });

        it('CropBottom', function() {
            // CropBottom(clip clip, int count)
            requiresParameters('CropBottom');
            checkPlugin('CropBottom', [123], 'CropBottom(123)');
        });

        it.is.parameterless('FlipHorizontal');

        it.is.parameterless('FlipVertical');

        it('Letterbox', function() {
            // Letterbox(clip clip, int top, int bottom [, int x1] [, int x2] [, int color])
            requiresParameters('Letterbox');
            checkPlugin('Letterbox', [1, 2], 'Letterbox(1, 2)');
            checkPlugin('Letterbox', [1, 2, 3, 4, 'darkOliveGreen'], 'Letterbox(1, 2, x1=3, x2=4, color=5597999)');
        });

        it.is.parameterless('HorizontalReduceBy2');

        it.is.parameterless('VerticalReduceBy2');

        it.is.parameterless('ReduceBy2');

        it('SkewRows', function() {
            // SkewRows(clip clip, int skew)
            requiresParameters('SkewRows');
            checkPlugin('SkewRows', [123], 'SkewRows(123)');
        });

        it.is.parameterless('TurnLeft');

        it.is.parameterless('TurnRight');

        it.is.parameterless('Turn180');

        describe('Resizers', function() {
            var filters = ['BicubicResize', 'BilinearResize', 'BlackmanResize', 'GaussResize', 'LanczosResize', 'Lanczos4Resize', 'PointResize', 'SincResize', 'Spline16Resize', 'Spline36Resize', 'Spline64Resize'];
            var taps = ['BlackmanResize', 'LanczosResize', 'SincResize'];
            filters.forEach(function(name) {
                it(name, function() {
                    requiresParameters(name);
                    checkPlugin(name, [123, 456], name + '(123, 456)');
                    if (name === 'BicubicResize') {
                        checkPlugin(name, [123, 456, 1.2, 3.4, 5.6, 7.8, -12.34, -56.78], 'BicubicResize(123, 456, b=1.2, c=3.4, src_left=5.6, src_top=7.8, src_width=-12.34, src_height=-56.78)');
                    } else {
                        checkPlugin(name, [123, 456, 1.2, 3.4, -5.6, -7.8], name + '(123, 456, src_left=1.2, src_top=3.4, src_width=-5.6, src_height=-7.8)');
                        if (name in taps) {
                            checkPlugin(name, [123, 456, null, null, null, null, 90], name + '(123, 456, taps=90)');
                        }
                        if (name === 'GaussResize') {
                            checkPlugin(name, [123, 456, null, null, null, null, 0.9], 'GaussResize(123, 456, p=0.9)');
                        }
                    }
                });
            });
        });
    });

    describe('Pixel restoration filters', function() {
        it('Blur', function() {
            // Blur(clip clip, float amount, bool MMX)
            // Blur(clip, float amountH, float amountV, bool MMX)
            requiresParameters('Blur');
            checkPlugin('Blur', [0.1, -1.2, 1], 'Blur(0.1, -1.2, MMX=true)');
            checkPlugin('blur', [1], 'Blur(1)');
        });

        it('Sharpen', function() {
            // Sharpen(clip clip, float amount, bool MMX)
            // Sharpen(clip, float amountH, float amountV, bool MMX)
            requiresParameters('Sharpen');
            checkPlugin('Sharpen', [-0.1, 1.2, 0], 'Sharpen(-0.1, 1.2, MMX=false)');
        });

        it('GeneralConvolution', function() {
            // GeneralConvolution(clip clip, [int bias, string matrix, float divisor, bool auto])
            checkPlugin('GeneralConvolution', [], 'GeneralConvolution()');
            checkPlugin('GeneralConvolution', [12, '0 0 0 1 0 2 0 0 0', 3.5, false], 'GeneralConvolution(bias=12, matrix="0 0 0 1 0 2 0 0 0", divisor=3.5, auto=false)');
        });

        it('SpatialSoften', function() {
            // SpatialSoften(clip clip, int radius, int luma_threshold, int chroma_threshold)
            requiresParameters('SpatialSoften');
            checkPlugin('SpatialSoften', [5, 10, 20], 'SpatialSoften(5, 10, 20)');
        });

        it('TemporalSoften', function() {
            // TemporalSoften(clip clip, int radius, int luma_threshold, int chroma_threshold [, int scenechange] [, int mode])
            requiresParameters('TemporalSoften');
            checkPlugin('TemporalSoften', [5, 10, 20], 'TemporalSoften(5, 10, 20)');
            checkPlugin('TemporalSoften', [5, 10, 20, 40, 1], 'TemporalSoften(5, 10, 20, scenechange=40, mode=1)');
        });

        it.is.parameterless('FixBrokenChromaUpsampling');
    });

    describe('Timeline editing filters', function() {
        ['AlignedSplice', 'UnalignedSplice'].forEach(function(name) {
            it(name, function() {
                // AlignedSplice(clip clip1, clip clip2 [,...])
                // UnalignedSplice(clip clip1, clip clip2 [,...])
                checkPlugin.bind(null, name, ['foo'], name + '(foo)').should.throw(AvisynthError);
                checkPlugin.bind(null, name, ['foo', 'bar', '3ad'], name + '(foo, bar, 3ad)').should.throw(AvisynthError);
                checkPlugin(name, ['foo', 'bar'], name + '(foo, bar)');
                checkPlugin(name, ['foo', 'bar', 'baz', 'quux'], name + '(foo, bar, baz, quux)');
            });
        });

        it('AssumeFPS', function() {
            requiresParameters('AssumeFPS');
            // AssumeFPS(clip clip, float fps [, bool sync_audio])
            checkPlugin('AssumeFPS', [12.34], 'AssumeFPS(12.34)');
            // AssumeFPS(clip clip, int numerator [, int denominator, bool sync_audio])
            checkPlugin('AssumeFPS', [56, 78, false], 'AssumeFPS(56, 78, false)');
            // AssumeFPS(clip clip1, clip clip2 [, bool sync_audio])
            checkPlugin('AssumeFPS', ['foo', true], 'AssumeFPS(foo, true)');
            // AssumeFPS(clip clip1, string preset [, bool sync_audio])
            checkPlugin('AssumeFPS', ['ntsc_round_video'], 'AssumeFPS("ntsc_round_video")');
            checkPlugin('AssumeFPS', ['film', false], 'AssumeFPS("film", false)');
        });

        it('AssumeScaledFPS', function() {
            // AssumeScaledFPS(clip [, int multiplier, int divisor, bool sync_audio])
            checkPlugin('AssumeScaledFPS', [], 'AssumeScaledFPS()');
            checkPlugin('AssumeScaledFPS', [123, 456, false], 'AssumeScaledFPS(multiplier=123, divisor=456, sync_audio=false)');
        });

        it('ChangeFPS', function() {
            requiresParameters('ChangeFPS');
            // ChangeFPS(clip clip, float fps [, bool linear])
            checkPlugin('ChangeFPS', [12.34], 'ChangeFPS(12.34)');
            // ChangeFPS(clip clip, int numerator [, int denominator, bool linear])
            checkPlugin('ChangeFPS', [56, 78, false], 'ChangeFPS(56, 78, false)');
            // ChangeFPS(clip clip1, clip clip2, bool linear)
            checkPlugin('ChangeFPS', ['foo', true], 'ChangeFPS(foo, true)');
            // ChangeFPS(clip clip1, string preset [, bool sync_audio]) <- error? should be "linear" here?
            checkPlugin('ChangeFPS', ['ntsc_round_video'], 'ChangeFPS("ntsc_round_video")');
            checkPlugin('ChangeFPS', ['film', false], 'ChangeFPS("film", false)');
        });
    });
});
