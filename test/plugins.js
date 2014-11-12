var path          = require('path');
var expect        = require('chai').expect;
var should        = require('chai').should();
var avisynth      = require('../main');
var pluginSystem  = require('../code/plugins');
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
            var script = new avisynth.Script('Version()\n');
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

    // Checks that a plugin call throws an AvisynthError.
    function checkPluginError(name, params) {
        var script = new avisynth.Script('Version()');
        expect(script[name]).to.be.a.function;
        var methodCall = Function.apply.bind(script[name], script, params);
        methodCall.should.throw(AvisynthError);
    }

    // Auto-tests a filter which takes no parameters.
    it.is = it.is || {};
    it.is.parameterless = function(name) {
        it(name, function() {
            checkPluginError(name, [false]);
            checkPlugin(name, [], name + '()');
        });
    }

    // Auto-tests that a filter requires parameters.
    function requiresParameters(name) {
        checkPluginError(name, []);
    }

    // Auto-tests that a filter does not require parameters (different from parameterless).
    function doesNotRequireParameters(name) {
        checkPlugin(name, [], name + '()');
    }

    describe('Media file filters', function() {
        it('AviSource', function() {
            // AviSource(string filename [, ... ], [bool audio = true], [string pixel_type = "FULL"], [string fourCC])
            requiresParameters('AviSource');
            checkPluginError('AviSource', [aviFile, true, 'PG13']);
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
            checkPluginError('OpenDMLSource', [aviFile, true, 'PG13']);
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
            checkPluginError('AviFileSource', [aviFile, true, 'PG13']);
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
            checkPluginError('DirectShowSource', [aviFile, aviFile]);
            checkPlugin('DirectShowSource', [aviFile], 'DirectShowSource("' + aviFile + '")');
            checkPlugin('DirectShowSource', [aviFile, 123.456], 'DirectShowSource("' + aviFile + '", fps=123.456)');
            checkPlugin('DirectShowSource', [aviFile, 24, false], 'DirectShowSource("' + aviFile + '", fps=24, seek=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, true, false], 'DirectShowSource("' + aviFile + '", seek=true, audio=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, true, false], 'DirectShowSource("' + aviFile + '", audio=true, video=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, true, false], 'DirectShowSource("' + aviFile + '", video=true, convertfps=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, true, false], 'DirectShowSource("' + aviFile + '", convertfps=true, seekzero=false)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, true, 123456], 'DirectShowSource("' + aviFile + '", seekzero=true, timeout=123456)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, 123456, 'RGB'], 'DirectShowSource("' + aviFile + '", timeout=123456, pixel_type="RGB")');
            checkPluginError('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'PG13']);
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'YUVex', 1234567890], 'DirectShowSource("' + aviFile + '", pixel_type="YUVex", framecount=1234567890)');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1234567890, textFile], 'DirectShowSource("' + aviFile + '", framecount=1234567890, logfile="' + textFile + '")');
            checkPlugin('DirectShowSource', ['fake.avi', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'fake.txt'], 'DirectShowSource("' + path.resolve('fake.avi') + '", logfile="' + path.resolve('fake.txt') + '")');
            checkPlugin('DirectShowSource', [aviFile, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, textFile, 32], 'DirectShowSource("' + aviFile + '", logfile="' + textFile + '", logmask=32)');
        });

        it('ImageSource', function() {
            // ImageSource(string file = "c:\%06d.ebmp", int start = 0, int end = 1000, float fps = 24, bool use_DevIL = false, bool info = false, string pixel_type = "RGB24")
            requiresParameters('ImageSource');
            checkPluginError('ImageSource', [jpgFile, jpgFile]);
            checkPlugin('ImageSource', ['./fake-%06d.jpg'], 'ImageSource("' + path.resolve('./fake-%06d.jpg') + '")');
            checkPlugin('ImageSource', [jpgFile, 123, 456, 123.456, false, false], 'ImageSource("' + jpgFile + '", start=123, end=456, fps=123.456, use_DevIL=false, info=false)');
            checkPlugin('ImageSource', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'Y8'], 'ImageSource("' + jpgFile + '", pixel_type="Y8")');
            checkPluginError('ImageSource', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'PG13']);
        });

        it('ImageSourceAnim', function() {
            // ImageSourceAnim(string file, float fps = 24, bool info = false, string pixel_type = "RGB32")
            requiresParameters('ImageSourceAnim');
            checkPluginError('ImageSourceAnim', [gifFile, gifFile]);
            checkPlugin('ImageSourceAnim', ['./fake.gif'], 'ImageSourceAnim("' + path.resolve('./fake.gif') + '")');
            checkPlugin('ImageSourceAnim', [gifFile, 123.456, false], 'ImageSourceAnim("' + gifFile + '", fps=123.456, info=false)');
            checkPlugin('ImageSourceAnim', [gifFile, undefined, undefined, 'Y8'], 'ImageSourceAnim("' + gifFile + '", pixel_type="Y8")');
            checkPluginError('ImageSourceAnim', [gifFile, undefined, undefined, 'PG13']);
        });

        it('ImageReader', function() {
            // ImageReader(string file = "c:\%06d.ebmp", int start = 0, int end = 1000, float fps = 24, bool use_DevIL = false, bool info = false, string pixel_type = "RGB24")
            requiresParameters('ImageReader');
            checkPluginError('ImageReader', [jpgFile, jpgFile]);
            checkPlugin('ImageReader', ['./fake-%06d.jpg'], 'ImageReader("' + path.resolve('./fake-%06d.jpg') + '")');
            checkPlugin('ImageReader', [jpgFile, 123, 456, 123.456, false, false], 'ImageReader("' + jpgFile + '", start=123, end=456, fps=123.456, use_DevIL=false, info=false)');
            checkPlugin('ImageReader', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'Y8'], 'ImageReader("' + jpgFile + '", pixel_type="Y8")');
            checkPluginError('ImageReader', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'PG13']);
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
            doesNotRequireParameters('ColorYUV');
        });

        describe('Convert', function() {
            it('ConvertBackToYUY2', function() {
                // ConvertBackToYUY2(clip [, string matrix])
                checkPluginError('ConvertBackToYUY2', ['invalid']);
                doesNotRequireParameters('ConvertBackToYUY2');
                checkPlugin('ConvertBackToYUY2', ['PC.709'], 'ConvertBackToYUY2(matrix="PC.709")');
            });

            it('ConvertToY8', function() {
                // ConvertToY8(clip [, string matrix])
                checkPluginError('ConvertToY8', ['invalid']);
                doesNotRequireParameters('ConvertToY8');
                checkPlugin('ConvertToY8', ['Rec601'], 'ConvertToY8(matrix="Rec601")');
            });

            ['ConvertToRGB', 'ConvertToRGB24', 'ConvertToRGB32', 'ConvertToYUY2',
            'ConvertToYV411', 'ConvertToYV16', 'ConvertToYV24'].forEach(function(name) {
                it(name, function() {
                    // name(clip [, string matrix] [, bool interlaced] [, string ChromaInPlacement] [, string chromaresample])
                    checkPluginError(name, ['invalid']);
                    checkPlugin(name, [], name + '()');
                    checkPlugin(name, ['AVERAGE', false, 'MPEG2', 'spline36'], name + '(matrix="AVERAGE", interlaced=false, ChromaInPlacement="MPEG2", chromaresample="spline36")');
                });
            });

            it('ConvertToYV12', function() {
                // ConvertToYV12(clip [, string matrix] [, bool interlaced] [, string ChromaInPlacement] [, string chromaresample])
                checkPluginError('ConvertToYV12', ['invalid']);
                doesNotRequireParameters('ConvertToYV12');
                checkPlugin('ConvertToYV12', ['AVERAGE', false, 'MPEG2', 'sinc', 'DV'], 'ConvertToYV12(matrix="AVERAGE", interlaced=false, ChromaInPlacement="MPEG2", chromaresample="sinc", ChromaOutPlacement="DV")');
            });
        });

        it('FixLuminance', function() {
            // FixLuminance(clip clip, int intercept, int slope)
            doesNotRequireParameters('FixLuminance');
            checkPlugin('FixLuminance', [123, 456], 'FixLuminance(123, 456)');
        });

        it('Greyscale', function() {
            // Greyscale(clip clip [, string matrix])
            doesNotRequireParameters('Greyscale');
            checkPlugin('Greyscale', ['rec709'], 'Greyscale(matrix="rec709")');
        });

        it('Invert', function() {
            // Invert(clip clip [, string channels])
            doesNotRequireParameters('Invert');
            checkPlugin('Invert', ['BG'], 'Invert(channels="BG")');
        });

        it('Levels', function() {
            // Levels(clip input, int input_low, float gamma, int input_high, int output_low, int output_high [, bool coring] [, bool dither])
            checkPluginError('Levels', [0, 1, 255, 0]);
            checkPlugin('Levels', [0, 1, 255, 0, 255], 'Levels(0, 1, 255, 0, 255)');
            checkPlugin('Levels', [0, 1, 255, 0, 255, true, false], 'Levels(0, 1, 255, 0, 255, coring=true, dither=false)');
        });

        it('Limiter', function() {
            // Limiter(clip clip [, int min_luma] [, int max_luma] [, int min_chroma] [, int max_chroma] [, string show])
            doesNotRequireParameters('Limiter');
            checkPlugin('Limiter', [1, 2, 3, 4, 'chroma_grey'], 'Limiter(min_luma=1, max_luma=2, min_chroma=3, max_chroma=4, show="chroma_grey")');
            checkPluginError('Limiter', [5, 6, 7, 8, 'bad_option']);
        });

        describe('Merge', function() {
            it('MergeARGB', function() {
                // MergeARGB(clip clipA, clip clipR, clip clipG, clip clipB)
                checkPluginError('MergeARGB', ['foo', 'bar', 'baz']);
                checkPlugin('MergeARGB', ['foo', 'bar', 'baz', 'quux'], 'MergeARGB(foo, bar, baz, quux)');
            });

            it('MergeRGB', function() {
                // MergeRGB(clip clipR, clip clipG, clip clipB [, string pixel_type])
                checkPluginError('MergeRGB', ['foo', 'bar']);
                checkPlugin('MergeRGB', ['foo', 'bar', 'baz'], 'MergeRGB(foo, bar, baz)');
                checkPlugin('MergeRGB', ['foo', 'bar', 'baz', 'RGB24'], 'MergeRGB(foo, bar, baz, pixel_type="RGB24")');
                checkPluginError('MergeRGB', ['foo', 'bar', 'baz', 'PG13']);
            });

            ['Merge', 'MergeChroma', 'MergeLuma'].forEach(function(name) {
                it(name, function() {
                    // name(clip clip1, clip clip2 [, float weight])
                    checkPluginError(name, ['foo']);
                    checkPlugin(name, ['foo', 'bar'], name + '(foo, bar)');
                    checkPlugin(name, ['foo', 'bar', 12.34], name + '(foo, bar, weight=12.34)');
                });
            });
        });

        it('RGBAdjust', function() {
            // RGBAdjust(clip clip [, float red] [, float green] [, float blue] [, float alpha] [, float rb] [, float gb] [, float bb] [, float ab] [, float rg] [, float gg] [, float bg] [, float ag] [, bool analyze] [, bool dither])
            doesNotRequireParameters('RGBAdjust');
            checkPlugin('RGBAdjust', [0.1, 0.2, 0.3, 0.4, 1, -2, 3, -4, 1.2, 3.4, 5.6, 1, true, false], 'RGBAdjust(0.1, 0.2, 0.3, 0.4, rb=1, gb=-2, bb=3, ab=-4, rg=1.2, gg=3.4, bg=5.6, ag=1, analyze=true, dither=false)');
        });

        describe('Show', function() {
            ['ShowAlpha', 'ShowBlue', 'ShowGreen', 'ShowRed'].forEach(function(name) {
                it(name, function() {
                    // name(clip clip, string pixel_type)
                    checkPluginError(name, ['PG13']);
                    checkPlugin(name, [], name + '()');
                    checkPlugin(name, ['Y8'], name + '(pixel_type="Y8")');
                });
            });
        });

        describe('Swap', function() {
            ['SwapUV', 'UToY', 'VToY', 'UToY8', 'VToY8'].forEach(function(name) {
                it(name, function() {
                    // name(clip clip)
                    checkPlugin(name, [], name + '()');
                    checkPlugin(name, ['fooBar'], name + '(fooBar)');
                });
            });

            it('YToUV', function() {
                // YToUV(clip clipU, clip clipV [, clip clipY])
                checkPluginError('YToUV', ['foo']);
                checkPlugin('YToUV', ['foo', 'bar'], 'YToUV(foo, bar)');
                checkPlugin('YToUV', ['foo', 'bar', 'baz'], 'YToUV(foo, bar, baz)');
            });
        });

        it('Tweak', function() {
            // Tweak(clip clip [, float hue] [, float sat] [, float bright] [, float cont] [, bool coring] [, bool sse] [, float startHue] [, float endHue] [, float maxSat] [, float minSat] [, float interp] [, bool dither])
            doesNotRequireParameters('Tweak');
            checkPlugin('Tweak', [0.1, 2.3, 4.5, 6.7, true, false, 8.9, 12.34, 56.78, 0, 123, false], 'Tweak(hue=0.1, sat=2.3, bright=4.5, cont=6.7, coring=true, sse=false, startHue=8.9, endHue=12.34, maxSat=56.78, minSat=0, interp=123, dither=false)');
        });
    });

    describe('Overlay and Mask filters', function() {
        it('Layer', function() {
            // Layer(clip base_clip, clip overlay_clip, string op, int level, int x, int y, int threshold, bool use_chroma)
            requiresParameters('Layer');
            checkPluginError('Layer', ['foo', 'bar', 'overlay']); // Admittedly, overlay should be allowed, it isn't in the docs so I suppose it isn't.
            checkPlugin('Layer', ['foo', 'bar'], 'Layer(foo, bar)');
            checkPlugin('Layer', ['foo', 'bar', 'lighten', 123, 12, -34, 42, true], 'Layer(foo, bar, op="lighten", level=123, x=12, y=-34, threshold=42, use_chroma=true)');
        });

        describe('Mask', function() {
            it('Mask', function() {
                // Mask(clip clip, mask_clip clip)
                requiresParameters('Mask');
                checkPlugin('Mask', ['foo'], 'Mask(foo)');
                checkPlugin('Mask', ['foo', 'bar'], 'Mask(foo, bar)');
            });

            it('ResetMask', function() {
                // ResetMask(clip clip)
                doesNotRequireParameters('ResetMask');
                checkPlugin('ResetMask', ['foo'], 'ResetMask(foo)');
            });

            it('ColorKeyMask', function() {
                // ColorKeyMask(clip clip, int color [, int tolB, int tolG, int tolR])
                doesNotRequireParameters('ColorKeyMask'); // It's actually possible.
                checkPlugin('ColorKeyMask', [0], 'ColorKeyMask(0)');
                checkPlugin('ColorKeyMask', ['F0F'], 'ColorKeyMask(16711935)');
                checkPlugin('ColorKeyMask', ['blue', 10, 20, 30], 'ColorKeyMask(255, 10, 20, 30)');
                checkPluginError('ColorKeyMask', [-1]);
            });

            it('MaskHS', function() {
                // MaskHS(clip [, int startHue, int endHue, int maxSat, int minSat, bool coring])
                doesNotRequireParameters('MaskHS');
                checkPlugin('MaskHS', [10, 20, 30, 0, false], 'MaskHS(startHue=10, endHue=20, maxSat=30, minSat=0, coring=false)');
            });
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
            checkPluginError('Subtract', ['foo']);
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
            checkPluginError('Crop', [1, 2, 3]);
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

        describe('Resize', function() {
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
            checkPlugin('Blur', [0.1, -1.2, true], 'Blur(0.1, -1.2, MMX=true)');
            checkPluginError('Blur', [1, 1, 1]);
            checkPlugin('blur', [1], 'Blur(1)');
        });

        it('Sharpen', function() {
            // Sharpen(clip clip, float amount, bool MMX)
            // Sharpen(clip, float amountH, float amountV, bool MMX)
            requiresParameters('Sharpen');
            checkPlugin('Sharpen', [-0.1, 1.2, false], 'Sharpen(-0.1, 1.2, MMX=false)');
            checkPluginError('Sharpen', [true]);
        });

        it('GeneralConvolution', function() {
            // GeneralConvolution(clip clip, [int bias, string matrix, float divisor, bool auto])
            doesNotRequireParameters('GeneralConvolution');
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
                checkPluginError(name, ['foo']);
                checkPluginError(name, ['foo', 'bar', '3ad']);
                checkPlugin(name, ['foo', 'bar'], name + '(foo, bar)');
                checkPlugin(name, ['foo', 'bar', 'baz', 'quux'], name + '(foo, bar, baz, quux)');
            });
        });

        describe('FPS', function() {
            it('AssumeFPS', function() {
                requiresParameters('AssumeFPS');
                // AssumeFPS(clip clip, float fps [, bool sync_audio])
                checkPlugin('AssumeFPS', [12.34], 'AssumeFPS(12.34)');
                // AssumeFPS(clip clip, int numerator [, int denominator, bool sync_audio])
                checkPlugin('AssumeFPS', [56, 78, false], 'AssumeFPS(56, 78, false)');
                // AssumeFPS(clip clip1, clip clip2 [, bool sync_audio])
                checkPlugin('AssumeFPS', ['foo', true], 'AssumeFPS(foo, true)');
                checkPluginError('AssumeFPS', ['1badparam', true]);
                // AssumeFPS(clip clip1, string preset [, bool sync_audio])
                checkPlugin('AssumeFPS', ['ntsc_round_video'], 'AssumeFPS("ntsc_round_video")');
                checkPlugin('AssumeFPS', ['film', false], 'AssumeFPS("film", false)');
            });

            it('AssumeScaledFPS', function() {
                // AssumeScaledFPS(clip [, int multiplier, int divisor, bool sync_audio])
                doesNotRequireParameters('AssumeScaledFPS');
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
                checkPlugin('ChangeFPS', ['pal_double'], 'ChangeFPS("pal_double")');
                checkPlugin('ChangeFPS', ['ntsc_video', false], 'ChangeFPS("ntsc_video", false)');
                checkPluginError('ChangeFPS', ['ntsc_video', '']);
                checkPlugin('ChangeFPS', ['ntsc_video', 'variable'], 'ChangeFPS("ntsc_video", variable)');
            });

            it('ConvertFPS', function() {
                requiresParameters('ConvertFPS');
                // ConvertFPS(clip clip, float new_rate [, int zone, int vbi])
                checkPlugin('ConvertFPS', [12.34, 56, 78], 'ConvertFPS(12.34, 56, 78)');
                // ConvertFPS(clip clip, int numerator [, int denominator, int zone, int vbi])
                checkPlugin('ConvertFPS', [12, 34, 56, false], 'ConvertFPS(12, 34, 56, false)');
                // ConvertFPS(clip clip1, clip clip2 [,int zone, int vbi])
                checkPlugin('ConvertFPS', ['foo', 12, 34], 'ConvertFPS(foo, 12, 34)');
                // ConvertFPS(clip clip1, string preset [, int zone, int vbi])
                checkPlugin('ConvertFPS', ['ntsc_round_film'], 'ConvertFPS("ntsc_round_film")');
                checkPlugin('ConvertFPS', ['pal_quad', 12, 34], 'ConvertFPS("pal_quad", 12, 34)');
            });
        });

        it('DeleteFrame', function() {
            // DeleteFrame(clip clip, int frame_num [, ...])
            requiresParameters('DeleteFrame');
            checkPluginError('DeleteFrame', [false]);
            checkPlugin('DeleteFrame', [123], 'DeleteFrame(123)');
            checkPlugin('DeleteFrame', [3, 2, 1, 0], 'DeleteFrame(3, 2, 1, 0)');
        });

        it('Dissolve', function() {
            // Dissolve(clip clip1, clip clip2 [,...], int overlap [, float fps])
            requiresParameters('Dissolve');
            checkPlugin('Dissolve', ['foo'], 'Dissolve(foo)');
            checkPluginError('Dissolve', ['foo', false]);
            checkPlugin('Dissolve', ['foo', 'bar', 'baz', 12, 34.56], 'Dissolve(foo, bar, baz, 12, fps=34.56)');
        });

        it('DuplicateFrame', function() {
            // DuplicateFrame(clip clip, int frame_num [, ...])
            requiresParameters('DuplicateFrame');
            checkPluginError('DuplicateFrame', [false]);
            checkPlugin('DuplicateFrame', [123], 'DuplicateFrame(123)');
            checkPlugin('DuplicateFrame', [3, 2, 1, 0], 'DuplicateFrame(3, 2, 1, 0)');
        });

        describe('Fade', function() {
            ['FadeIn', 'FadeIO', 'FadeOut', 'FadeIn0', 'FadeIO0', 'FadeOut0',
            'FadeIn2', 'FadeIO2', 'FadeOut2'].forEach(function(name) {
                it(name, function() {
                    // name(clip clip, int num_frames [, int color] [, float fps])
                    requiresParameters(name);
                    checkPlugin(name, [123, 'Yellow', 45.67], name + '(123, color=16776960, fps=45.67)');
                });
            });
        });

        it('FreezeFrame', function() {
            // FreezeFrame(clip clip, int first-frame, int last-frame, int source-frame)
            checkPluginError('FreezeFrame', [1, 2]);
            checkPlugin('FreezeFrame', [2, 1, 0], 'FreezeFrame(2, 1, 0)');
        });

        it('Interleave', function() {
            // Interleave(clip1, clip2 [, ...])
            requiresParameters('Interleave');
            checkPlugin('Interleave', ['foo', 'bar', 'baz'], 'Interleave(foo, bar, baz)');
        });

        it('Loop', function() {
            // Loop(clip clip [, int times = -1] [, int start_frame = 0] [, int end_frame = inf])
            doesNotRequireParameters('Loop');
            checkPlugin('Loop', [1, 2, 3], 'Loop(1, 2, 3)');
            checkPluginError('Loop', [1, null, 3]);
        });

        it('Reverse', function() {
            // Reverse(clip clip)
            doesNotRequireParameters('Reverse');
            checkPlugin('Reverse', ['foo'], 'Reverse(foo)');
            checkPluginError('Reverse', ['-bar']);
            checkPluginError('Reverse', ['baz', 'quux']);
        });

        describe('Select', function() {
            it('SelectEven', function() {
                // SelectEven(clip clip)
                doesNotRequireParameters('SelectEven');
                checkPlugin('SelectEven', ['foo'], 'SelectEven(foo)');
                checkPluginError('SelectEven', ['1bar']);
            });

            it('SelectOdd', function() {
                // SelectOdd(clip clip)
                doesNotRequireParameters('SelectOdd');
                checkPlugin('SelectOdd', ['foo'], 'SelectOdd(foo)');
                checkPluginError('SelectOdd', ['baz', 'quux']);
            });

            it('SelectEvery', function() {
                // SelectEvery(clip clip, int step-size, int offset1 [, int offset2, ...])
                requiresParameters('SelectEvery');
                checkPlugin('SelectEvery', [2, 0], 'SelectEvery(2, 0)');
                checkPlugin('SelectEvery', [8, 0,1, 2,3,2, 5,4, 7,6,7], 'SelectEvery(8, 0, 1, 2, 3, 2, 5, 4, 7, 6, 7)');
            });

            it('SelectRangeEvery', function() {
                // SelectRangeEvery(clip clip [, int every] [, int length] [, int offset] [, bool audio])
                doesNotRequireParameters('SelectRangeEvery');
                checkPlugin('SelectRangeEvery', [280, 14, 2], 'SelectRangeEvery(every=280, length=14, offset=2)');
                checkPlugin('SelectRangeEvery', [null, null, null, true], 'SelectRangeEvery(audio=true)');
            });
        });

        it('Trim', function() {
            // Trim(clip clip, int first_frame, int last_frame [, bool "pad"])
            // Trim(clip clip, int first_frame, int -num_frames [, bool "pad"])
            // Trim(clip, int first_frame, int "end" [, bool "pad"])
            // Trim(clip, int first_frame, int "length" [, bool "pad"])
            requiresParameters('Trim');
            checkPlugin('Trim', [12, 34], 'Trim(12, 34)');
            checkPlugin('Trim', [0, -1, false], 'Trim(0, -1, pad=false)');
        });
    });

    describe('Interlace filters', function() {
        describe('Parity', function() {
            // name(clip clip)
            var names = ['AssumeFieldBased', 'AssumeFrameBased', 'AssumeBFF', 'AssumeTFF', 'ComplementParity'];
            names.forEach(it.is.parameterless);
        });

        it('Bob', function() {
            // Bob(clip clip [, float b, float c, int height])
            doesNotRequireParameters('Bob');
            checkPlugin('Bob', [1.2, 3.4, 567], 'Bob(b=1.2, c=3.4, height=567)');
        });

        describe('Weave', function() {
            // name(clip clip)
            ['Weave', 'DoubleWeave'].forEach(it.is.parameterless);
            // name(clip clip, int period)
            ['WeaveColumns', 'WeaveRows'].forEach(function(name) {
                it(name, function() {
                    requiresParameters(name);
                    checkPlugin(name, [123], name + '(123)');
                });
            });
        });

        it('PeculiarBlend', function() {
            requiresParameters('PeculiarBlend');
            checkPlugin('PeculiarBlend', [123], 'PeculiarBlend(123)');
        });

        it('Pulldown', function() {
            requiresParameters('Pulldown');
            checkPlugin('Pulldown', [0, 3], 'Pulldown(0, 3)');
        });

        describe('Separate', function() {
            // SeparateFields(clip clip)
            it.is.parameterless('SeparateFields');
            // name(clip, int interval)
            ['SeparateColumns', 'SeparateRows'].forEach(function(name) {
                it(name, function() {
                    requiresParameters(name);
                    checkPlugin(name, [123], name + '(123)');
                });
            });
        });

        it.is.parameterless('SwapFields');
    });

    describe('Audio processing filters', function() {
        it('Amplify', function() {
            // Amplify(clip, float amount1 [, ...])
            // Amplify(clip, float left, float right)
            requiresParameters('Amplify');
            checkPlugin('Amplify', [1.2, 3.4, 5.6, 7.8], 'Amplify(1.2, 3.4, 5.6, 7.8)');
        });

        it('AmplifydB', function() {
            // AmplifydB(clip, float amount1 [, ...])
            // AmplifydB(clip, float left, float right)
            requiresParameters('AmplifydB');
            checkPlugin('AmplifydB', [-0.1], 'AmplifydB(-0.1)');
        });

        it('AudioDub', function() {
            // AudioDub(video_clip, audio_clip)
            requiresParameters('AudioDub');
            checkPlugin('AudioDub', ['foo', 'bar'], 'AudioDub(foo, bar)');
        });

        it('AudioDubEx', function() {
            // AudioDubEx(video_clip, audio_clip)
            requiresParameters('AudioDubEx');
            checkPlugin('AudioDubEx', ['foo', 'bar'], 'AudioDubEx(foo, bar)');
        });

        it('AudioTrim', function() {
            // AudioTrim(clip clip, float start_time, float end_time)
            // AudioTrim(clip clip, float start_time, float -duration)
            // AudioTrim(clip, float start_time, float "end")
            // AudioTrim(clip, float start_time, float "length")
            requiresParameters('AudioTrim');
            checkPlugin('AudioTrim', [1.2, 3.4], 'AudioTrim(1.2, 3.4)');
            checkPlugin('AudioTrim', [0, -0.1], 'AudioTrim(0, -0.1)');
        });

        describe('Samplerate', function() {
            it('AssumeSampleRate', function() {
                // AssumeSampleRate(clip clip, samplerate int)
                requiresParameters('AssumeSampleRate');
                checkPlugin('AssumeSampleRate', [22050], 'AssumeSampleRate(22050)');
            });

            var names = ['ConvertAudioTo8bit', 'ConvertAudioTo16bit', 'ConvertAudioTo24bit', 'ConvertAudioTo32bit', 'ConvertAudioToFloat'];
            // name(clip clip)
            names.forEach(it.is.parameterless);

            it('ResampleAudio', function() {
                // ResampleAudio(clip, int new_rate_numerator [, int new_rate_denominator])
                requiresParameters('ResampleAudio');
                checkPlugin('ResampleAudio', [48000], 'ResampleAudio(48000)');
                checkPlugin('ResampleAudio', [1058400000, 25025], 'ResampleAudio(1058400000, 25025)');
            });

            it('SSRC', function() {
                // SSRC(clip, int samplerate [, bool fast])
                requiresParameters('SSRC');
                checkPlugin('SSRC', [44100], 'SSRC(44100)');
                checkPlugin('SSRC', [22050, false], 'SSRC(22050, false)');
            });
        });

        describe('Channels', function() {
            it.is.parameterless('ConvertToMono');

            it('GetChannel', function() {
                // GetChannel(clip clip, int ch1 [, int ch2, ...])
                // GetChannels(clip clip, int ch1 [, int ch2, ...])
                ['GetChannel', 'GetChannels'].forEach(requiresParameters);
                checkPlugin('GetChannel', [1], 'GetChannel(1)');
                checkPlugin('GetChannels', [5, 6], 'GetChannels(5, 6)');
            });

            it.is.parameterless('GetLeftChannel');

            it.is.parameterless('GetRightChannel');

            it('MergeChannels', function() {
                // MergeChannels(clip1 clip, clip2 clip [, clip3 clip])
                requiresParameters('MergeChannels');
                checkPlugin('MergeChannels', ['foo', 'bar', 'baz'], 'MergeChannels(foo, bar, baz)');
            });

            it('MonoToStereo', function() {
                // MonoToStereo(clip left_channel_clip, clip right_channel_clip)
                requiresParameters('MonoToStereo');
                checkPlugin('MonoToStereo', ['foo', 'bar'], 'MonoToStereo(foo, bar)');
            });
        });

        it('DelayAudio', function() {
            // DelayAudio(clip, float seconds)
            requiresParameters('DelayAudio');
            checkPlugin('DelayAudio', [-0.5], 'DelayAudio(-0.5)');
        });

        it.is.parameterless('EnsureVBRMP3Sync');

        it.is.parameterless('KillAudio');

        it.is.parameterless('KillVideo');

        it('MixAudio', function() {
            // MixAudio(clip clip1, clip clip2, float clip1_factor, float clip2_factor)
            requiresParameters('MixAudio');
            checkPlugin('MixAudio', ['foo', 'bar'], 'MixAudio(foo, bar)');
            checkPlugin('MixAudio', ['foo', 'bar', 0.75, 0.25], 'MixAudio(foo, bar, 0.75, 0.25)');
        });

        it('Normalize', function() {
            // Normalize(clip clip [, float volume] [, bool show])
            doesNotRequireParameters('Normalize');
            checkPlugin('Normalize', [null, true], 'Normalize(show=true)');
            checkPlugin('Normalize', [0.95], 'Normalize(volume=0.95)');
        });

        it('SuperEQ', function() {
            // SuperEq(clip, string filename)
            // SuperEq(clip, float band1 [, float band2, ..., float band18])
            requiresParameters('SuperEQ');
            checkPlugin('SuperEQ', ['fake.feq'], 'SuperEQ("' + path.resolve('fake.feq') + '")');
            var list = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18];
            checkPlugin('SuperEQ', list, 'SuperEQ(' + list.join(', ') + ')');
            checkPluginError('SuperEQ', list.concat(0.19));
        });

        it('TimeStretch', function() {
            // TimeStretch(clip clip [, float tempo, float rate, float pitch, int sequence, int seekwindow, int overlap, bool quickseek, int aa])
            doesNotRequireParameters('TimeStretch');
            checkPlugin('TimeStretch', [100.0001, 100.0002, 100.0003, 82, 28, 12, false, 0], 'TimeStretch(tempo=100.0001, rate=100.0002, pitch=100.0003, sequence=82, seekwindow=28, overlap=12, quickseek=false, aa=0)');
            checkPlugin('TimeStretch', [200, null, null, null, null, null, null, 0], 'TimeStretch(tempo=200, aa=0)');
        });
    });

    describe('Conditional and other meta filters', function() {
        describe('Conditionals', function() {
            it('ConditionalFilter', function() {
                // ConditionalFilter(clip testclip, clip source1, clip source2, string expression1, string operator, string expression2 [, bool "show"])
                requiresParameters('ConditionalFilter');
                checkPlugin('ConditionalFilter', ['foo', 'bar', 'AverageLuma()', 'lessthan', 20, true], 'ConditionalFilter(foo, bar, "AverageLuma()", "lessthan", "20", show=true)');
            });

            it('ConditionalSelect', function() {
                // ConditionalSelect(clip testclip, string expression, clip source0, clip source1, clip source2, ... [, bool "show"])
                requiresParameters('ConditionalSelect');
                // Don't ask me what "chr(13)" is supposed to mean there, it was in the docs like that. I wonder if it shouldn't be a LF instead of VT.
                checkPlugin('ConditionalSelect', ['luma_av = AverageLuma()"+chr(13)+"luma_av < 25 ? (luma_av < 15 ? 2 : 1) : 0', 'foo', 'bar', 'baz'], 'ConditionalSelect("luma_av = AverageLuma()"+chr(13)+"luma_av < 25 ? (luma_av < 15 ? 2 : 1) : 0", foo, bar, baz)');
                checkPlugin('ConditionalSelect', ['AverageChromaU() < 25 ? 1 : 0', 'foo', 'bar', true], 'ConditionalSelect("AverageChromaU() < 25 ? 1 : 0", foo, bar, show=true)');
            });

            it('ScriptClip', function() {
                // ScriptClip(clip clip, string filter [, bool "show"] [, bool "after_frame"])
                requiresParameters('ScriptClip');
                // Again with the VTs.
                checkPlugin('ScriptClip', ['diff = YDifferenceToNext()"+chr(13)+"diff > 2.5 ? Blur(fmin(diff/20,1.5)) : T'], 'ScriptClip("diff = YDifferenceToNext()"+chr(13)+"diff > 2.5 ? Blur(fmin(diff/20,1.5)) : T")');
                checkPlugin('ScriptClip', ['subtitle(string(current_frame))', true, false], 'ScriptClip("subtitle(string(current_frame))", show=true, after_frame=false)');
            });

            it('FrameEvaluate', function() {
                // FrameEvaluate(clip clip, string filter [, bool "after_frame"])
                requiresParameters('FrameEvaluate');
                checkPlugin('FrameEvaluate', ['subtitle(string(current_frame))', false], 'FrameEvaluate("subtitle(string(current_frame))", false)');
            });
        });
    });
});
