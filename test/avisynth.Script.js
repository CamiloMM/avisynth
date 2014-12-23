var path          = require('path');
var fs            = require('fs');
var os            = require('os');
var crypto        = require('crypto');
var should        = require('chai').should();
var expect        = require('chai').expect;
var avisynth      = require('../main');
var Script        = require('../code/script');
var loader        = require('../code/loader');
var pluginSystem  = require('../code/plugins');
var AvisynthError = require('../code/errors').AvisynthError;

describe('avisynth.Script', function() {
    var baseRefs = loader.references;
    var fakePluginsDir = path.resolve(__dirname, 'plugins');
    var scriptPath = path.resolve(fakePluginsDir, 'colors_rgb.avsi');
    var pluginPath = path.resolve(fakePluginsDir, 'DeDup.dll');
    var textFile   = path.resolve(fakePluginsDir, 'colors_rgb.txt');
    var missing    = path.resolve(fakePluginsDir, 'non-existent.dll');
    var rand = Math.random(); // Guess what, initializing it takes ~260ms for me on Win7.

    it('should be a Script construtor', function() {
        avisynth.Script.should.be.a('function');
        (new avisynth.Script).should.be.instanceof(Script);
    });

    it('should accept omitting the "new" operator', function() {
        avisynth.Script().should.be.instanceof(Script);
    });

    describe('instances', function() {
        it('should accept a code parameter, and include it as a property', function() {
            var code = '\nVersion()\n\nSubtitle("' + rand + '")';
            avisynth.Script(code).rawCode.should.equal(code);
        });

        it('should have empty code if no code was provided', function() {
            avisynth.Script().rawCode.should.equal('');
        });

        it('should integrate with the plugins by prototypal inheritance', function() {
            var script = new avisynth.Script();
            Object.getPrototypeOf(script).should.equal(pluginSystem.pluginPrototype);
        });

        describe('.load', function() {
            it('should load scripts and plugins from given paths', function() {
                var script = avisynth.Script();
                script.load(scriptPath);
                script.load(pluginPath);
                script.references[scriptPath].should.equal('script');
                script.references[pluginPath].should.equal('plugin');
            });

            it('should throw an error for an invalid path', function() {
                var script = avisynth.Script();
                var directory = fakePluginsDir;
                script.load.bind(script,  textFile).should.throw(AvisynthError);
                script.load.bind(script,   missing).should.throw(AvisynthError);
                script.load.bind(script, directory).should.throw(AvisynthError);
            });

            it('should not throw errors if told to ignore them', function() {
                var script = avisynth.Script();
                var directory = fakePluginsDir;
                script.load.bind(script,  textFile, true).should.not.throw();
                script.load.bind(script,   missing, true).should.not.throw();
                script.load.bind(script, directory, true).should.not.throw();
            });

            it('should throw error if the path contains an invalid character', function() {
                var script = avisynth.Script();
                var invalid = path.resolve(__dirname, 'zettai-ryōiki/invalid-path.avs');
                script.load.bind(avisynth, invalid).should.throw(AvisynthError);
            });
        });

        describe('.autoload', function() {
            it('should load plugins and scripts from a given directory', function() {
                var script = avisynth.Script();
                script.autoload(fakePluginsDir);
                script.references[scriptPath].should.equal('script');
                script.references[pluginPath].should.equal('plugin');
            });

            it('should throw an error if the directory does not exist', function() {
                var script = avisynth.Script();
                var invalid = path.resolve(__dirname, 'non-existant');
                script.autoload.bind(script, invalid).should.throw(AvisynthError);
            });

            it('should throw error if the path contains an invalid character', function() {
                var script = avisynth.Script();
                var invalid = path.resolve(__dirname, 'zettai-ryōiki');
                script.autoload.bind(avisynth, invalid).should.throw(AvisynthError);
            });
        });

        describe('.allReferences', function() {
            it('should initially return the global references', function() {
                avisynth.Script().allReferences().should.deep.equal(baseRefs);
            });

            it('should be updated when loading or autoloading', function() {
                var script = avisynth.Script();
                expect(script.allReferences()[scriptPath]).to.be.undefined;
                script.load(scriptPath);
                script.allReferences()[scriptPath].should.equal('script');
                expect(script.allReferences()[pluginPath]).to.be.undefined;
                script.load(pluginPath);
                script.allReferences()[pluginPath].should.equal('plugin');
                script = new avisynth.Script;
                expect(script.allReferences()[scriptPath]).to.be.undefined;
                expect(script.allReferences()[pluginPath]).to.be.undefined;
                script.autoload(fakePluginsDir);
                avisynth.Script().allReferences().should.deep.equal(baseRefs);
                script.allReferences()[scriptPath].should.equal('script');
                script.allReferences()[pluginPath].should.equal('plugin');
            });
        });

        describe('.fullCode', function() {
            it('should be a function that returns a string', function() {
                avisynth.Script().fullCode.should.be.a('function');
                avisynth.Script().fullCode().should.be.a('string');
            });

            it('should embed code to load all initial plugins/scripts', function() {
                var expected = '';
                Object.keys(baseRefs).forEach(function(v) {
                    expected += 'LoadPlugin("' + v + '")\n';
                });
                avisynth.Script().fullCode().should.equal(expected);
            });

            it('should also embed code to load further plugins/scripts', function() {
                var script = avisynth.Script();
                script.load(scriptPath);
                script.load(pluginPath);
                var expected = '';
                Object.keys(baseRefs).forEach(function(v) {
                    expected += 'LoadPlugin("' + v + '")\n';
                });
                expected += 'Import("' + scriptPath + '")\n';
                expected += 'LoadPlugin("' + pluginPath + '")\n';
                script.fullCode().should.equal(expected);
            });

            it('should moreover include any code passed to the construtor', function() {
                var code = 'Version()\nSubtitle("' + rand + '")';
                var script = avisynth.Script(code);
                script.load(scriptPath);
                script.load(pluginPath);
                var expected = '';
                Object.keys(baseRefs).forEach(function(v) {
                    expected += 'LoadPlugin("' + v + '")\n';
                });
                expected += 'Import("' + scriptPath + '")\n';
                expected += 'LoadPlugin("' + pluginPath + '")\n';
                expected += code + '\n';
                script.fullCode().should.equal(expected);
            });
        });

        describe('.code', function() {
            it('should be a function that allows adding code', function() {
                var code = '\nVersion()\n\nSubtitle("'+rand+'")\nSharpen(1)';
                var lines = code.split('\n');
                var script = new avisynth.Script(code);
                lines.forEach(function(line) {
                    script.code(line);
                });
                script.code(code);
                script.rawCode.should.equal(code + '\n' + code + '\n' + code + '\n');
                script.rawCode.should.equal([code, code, code, ''].join('\n'));
            });
        });

        describe('.getPath', function() {
            it('should create and keep a script file', function() {
                var script = avisynth.Script('ColorBars()');
                var base = os.tmpdir() + '/avisynth.js-' + process.pid + '/scripts/';
                var location = base + script.md5() + '.avs';
                fs.existsSync(location).should.be.false;
                script.getPath();
                fs.existsSync(location).should.be.true;
                expect(location).to.equal(script.getPath());
            });
        });

        describe('.renderFrame', function() {
            it('should allow rendering a script to a file', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script('ColorBarsHD()');
                // We're using BMP as a format because it can be consistently hashed.
                var bmp = os.tmpdir() + '/avisynth-test ' + rand + '.bmp';
                var expected = '6be6eacc299e3ee146aeb016c33970b7'; // MD5
                script.renderFrame(bmp, function(err) {
                    if (err) {
                        done(err);
                    } else if (fs.existsSync(bmp)) {
                        var bytes = fs.readFileSync(bmp);
                        var actual = crypto.createHash('md5').update(bytes).digest('hex');
                        fs.unlinkSync(bmp);
                        if (actual !== expected) {
                            done(new Error('md5 mismatch: ' + expected + ' vs ' + actual));
                        } else {
                            done(err);
                        }
                    } else {
                        done(new Error('file not created'));
                    }
                });
            });

            it('should allow rendering specific frames', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script('ColorBarsHD()');
                // Animating so that a particular frame can be identified as such.
                // ShowFrameNumber is problematic because then we rely on precise
                // font rendering, and that's not reliably hashable in this case.
                script.animate(0, 100, 'Levels', 
                               0, 1, 255,   0, 255, 
                               0, 1, 255, 255, 255);
                var bmp = os.tmpdir() + '/avisynth-test ' + rand + '.bmp';
                var expected = '8c3e13b37151b371f99f354408356a71';
                script.renderFrame(2.5, bmp, function(err) {
                    if (err) {
                        done(err);
                    } else if (fs.existsSync(bmp)) {
                        var bytes = fs.readFileSync(bmp);
                        var actual = crypto.createHash('md5').update(bytes).digest('hex');
                        fs.unlinkSync(bmp);
                        if (actual !== expected) {
                            done(new Error('md5 mismatch: ' + expected + ' vs ' + actual));
                        } else {
                            done(err);
                        }
                    } else {
                        done(new Error('file not created'));
                    }
                });
            });

            it('callback is optional', function(done) {
                this.timeout(3100); // This is scheduled.
                var script = new avisynth.Script('ColorBarsHD()');
                var bmp = os.tmpdir() + '/avisynth-test-2 ' + rand + '.bmp';
                script.renderFrame(bmp);
                setTimeout(done, 3000);
            });
        });
    });
});
