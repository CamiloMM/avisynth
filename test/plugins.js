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
            code.slice(-3)[0].should.equal('Import("' + scriptPath + '")');
            code.slice(-2)[0].should.equal('LoadPlugin("' + pluginPath + '")');
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
            code.slice(-3)[0].should.equal('Import("' + scriptPath + '")');
            code.slice(-2)[0].should.equal('LoadPlugin("' + pluginPath + '")');
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

    describe('Media file filters', function() {
        it('AviSource', function() {
            // AviSource(string filename [, ... ], [bool audio = true], [string pixel_type = "FULL"], [string fourCC])
            checkPlugin.bind(null, 'AviSource', [], 'AviSource("")').should.throw(AvisynthError);
            checkPlugin.bind(null, 'AviSource', [aviFile, true, 'PG13'], 'AviSource("' + aviFile + '", true, "PG13")').should.throw(AvisynthError);
            checkPlugin('AviSource', ['fake.avi'], 'AviSource("' + path.resolve('fake.avi') + '")');
            checkPlugin('AviSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'AviSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('AviSource', [aviFile, false], 'AviSource("' + aviFile + '", false)');
            checkPlugin('AviSource', [aviFile, true, 'YV24'], 'AviSource("' + aviFile + '", true, "YV24")');
            checkPlugin('AviSource', [aviFile, false, 'YV16', 'PR0N'], 'AviSource("' + aviFile + '", false, "YV16", "PR0N")');
            checkPlugin('AviSource', [aviFile, aviFile, aviFile, aviFile, aviFile, false, 'YV12', 'PR0N'], 'AviSource("' + [aviFile, aviFile, aviFile, aviFile, aviFile].join('", "') + '", false, "YV12", "PR0N")');
        });

        it('OpenDMLSource', function() {
            // OpenDMLSource(string filename [, ... ], [bool audio = true], [string pixel_type = "FULL"], [string fourCC])
            checkPlugin.bind(null, 'OpenDMLSource', [], 'OpenDMLSource("")').should.throw(AvisynthError);
            checkPlugin.bind(null, 'OpenDMLSource', [aviFile, true, 'PG13'], 'OpenDMLSource("' + aviFile + '", true, "PG13")').should.throw(AvisynthError);
            checkPlugin('OpenDMLSource', ['fake.avi'], 'OpenDMLSource("' + path.resolve('fake.avi') + '")');
            checkPlugin('OpenDMLSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'OpenDMLSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('OpenDMLSource', [aviFile, false], 'OpenDMLSource("' + aviFile + '", false)');
            checkPlugin('OpenDMLSource', [aviFile, true, 'YV411'], 'OpenDMLSource("' + aviFile + '", true, "YV411")');
            checkPlugin('OpenDMLSource', [aviFile, false, 'YUY2', 'PR0N'], 'OpenDMLSource("' + aviFile + '", false, "YUY2", "PR0N")');
            checkPlugin('OpenDMLSource', [aviFile, aviFile, aviFile, aviFile, aviFile, false, 'RGB32', 'PR0N'], 'OpenDMLSource("' + [aviFile, aviFile, aviFile, aviFile, aviFile].join('", "') + '", false, "RGB32", "PR0N")');
        });

        it('AviFileSource', function() {
            // AviFileSource(string filename [, ... ], [bool audio = true], [string pixel_type = "FULL"], [string fourCC])
            checkPlugin.bind(null, 'AviFileSource', [], 'AviFileSource("")').should.throw(AvisynthError);
            checkPlugin.bind(null, 'AviFileSource', [aviFile, true, 'PG13'], 'AviFileSource("' + aviFile + '", true, "PG13")').should.throw(AvisynthError);
            checkPlugin('AviFileSource', ['fake.avi'], 'AviFileSource("' + path.resolve('fake.avi') + '")');
            checkPlugin('AviFileSource', [aviFile, 'fake1.avi', aviFile, 'fake2.avi', aviFile], 'AviFileSource("' + [aviFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), aviFile].join('", "') + '")');
            checkPlugin('AviFileSource', [aviFile, false], 'AviFileSource("' + aviFile + '", false)');
            checkPlugin('AviFileSource', [aviFile, true, 'Y8'], 'AviFileSource("' + aviFile + '", true, "Y8")');
            checkPlugin('AviFileSource', [aviFile, false, 'AUTO', 'PR0N'], 'AviFileSource("' + aviFile + '", false, "AUTO", "PR0N")');
            checkPlugin('AviFileSource', [aviFile, aviFile, aviFile, aviFile, aviFile, false, 'FULL', 'PR0N'], 'AviFileSource("' + [aviFile, aviFile, aviFile, aviFile, aviFile].join('", "') + '", false, "FULL", "PR0N")');
        });

        it('WavSource', function() {
            // WavSource(string filename [, ... ])
            checkPlugin.bind(null, 'WavSource', [], 'WavSource("")').should.throw(AvisynthError);
            checkPlugin('WavSource', ['fake.wav'], 'WavSource("' + path.resolve('fake.wav') + '")');
            checkPlugin('WavSource', [wavFile, 'fake1.avi', aviFile, 'fake2.avi', wavFile], 'WavSource("' + [wavFile, path.resolve('fake1.avi'), aviFile, path.resolve('fake2.avi'), wavFile].join('", "') + '")');
            checkPlugin('WavSource', [wavFile, wavFile, wavFile, wavFile, wavFile, false, 'RGB24', 'PR0N'], 'WavSource("' + [wavFile, wavFile, wavFile, wavFile, wavFile].join('", "') + '")');
        });

        it('DirectShowSource', function() {
            // DirectShowSource(string filename [, float fps, bool seek, bool audio, bool video, bool convertfps, bool seekzero, int timeout, string pixel_type, int framecount, string logfile, int logmask])
            checkPlugin.bind(null, 'DirectShowSource', [], 'DirectShowSource("")').should.throw(AvisynthError);
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
            checkPlugin.bind(null, 'ImageSource', [], 'ImageSource("")').should.throw(AvisynthError);
            checkPlugin.bind(null, 'ImageSource', [jpgFile, jpgFile], 'ImageSource("' + jpgFile + '")').should.throw(AvisynthError);
            checkPlugin('ImageSource', ['./fake-%06d.jpg'], 'ImageSource("' + path.resolve('./fake-%06d.jpg') + '")');
            checkPlugin('ImageSource', [jpgFile, 123, 456, 123.456, false, false], 'ImageSource("' + jpgFile + '", start=123, end=456, fps=123.456, use_DevIL=false, info=false)');
            checkPlugin('ImageSource', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'Y8'], 'ImageSource("' + jpgFile + '", pixel_type="Y8")');
            checkPlugin.bind(null, 'ImageSource', [jpgFile, undefined, undefined, undefined, undefined, undefined, 'PG13'], 'ImageSource("' + jpgFile + '", pixel_type="PG13")').should.throw(AvisynthError);
        });

        it('ImageSourceAnim', function() {
            // ImageSourceAnim(string file, float fps = 24, bool info = false, string pixel_type = "RGB32")
            checkPlugin.bind(null, 'ImageSourceAnim', [], 'ImageSourceAnim("")').should.throw(AvisynthError);
            checkPlugin.bind(null, 'ImageSourceAnim', [gifFile, gifFile], 'ImageSourceAnim("' + gifFile + '")').should.throw(AvisynthError);
            checkPlugin('ImageSourceAnim', ['./fake.gif'], 'ImageSourceAnim("' + path.resolve('./fake.gif') + '")');
            checkPlugin('ImageSourceAnim', [gifFile, 123.456, false], 'ImageSourceAnim("' + gifFile + '", fps=123.456, info=false)');
            checkPlugin('ImageSourceAnim', [gifFile, undefined, undefined, 'Y8'], 'ImageSourceAnim("' + gifFile + '", pixel_type="Y8")');
            checkPlugin.bind(null, 'ImageSourceAnim', [gifFile, undefined, undefined, 'PG13'], 'ImageSourceAnim("' + gifFile + '", pixel_type="PG13")').should.throw(AvisynthError);
        });

        it('ImageReader', function() {
            // ImageReader(string file = "c:\%06d.ebmp", int start = 0, int end = 1000, float fps = 24, bool use_DevIL = false, bool info = false, string pixel_type = "RGB24")
            checkPlugin.bind(null, 'ImageReader', [], 'ImageReader("")').should.throw(AvisynthError);
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
            checkPlugin.bind(null, 'ImageWriter', [], 'ImageWriter("")').should.throw(AvisynthError);
            checkPlugin('ImageWriter', ['./%03d', 123, -456, 'png', false], 'ImageWriter("' + path.resolve('./%03d') + '", start=123, end=-456, type="png", info=false)');
        });
    })
});
