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
                var base = os.tmpdir() + '/avisynth.js-' + process.pid + '/scripts';
                var location = path.resolve(base, script.md5() + '.avs');
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
                var bmp = os.tmpdir() + '/avisynth-test-render ' + rand + '.bmp';
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
                var bmp = os.tmpdir() + '/avisynth-test-frame ' + rand + '.bmp';
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
                var bmp = os.tmpdir() + '/avisynth-test-callback ' + rand + '.bmp';
                script.renderFrame(bmp);
                setTimeout(function() {
                    if (fs.existsSync(bmp)) fs.unlinkSync(bmp); // cleanup
                    done();
                }, 3000);
            });

            it('bad scripts should cause an error', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script('TheSpanishInquisition()');
                var bmp = os.tmpdir() + '/avisynth-test-bad-script ' + rand + '.bmp';
                script.renderFrame(bmp, function(err) {
                    if (err) {
                        if (fs.existsSync(bmp)) fs.unlinkSync(bmp);
                        done();
                    } else {
                        done(new Error('no error created when running a faulty script'));
                    }
                });
            });

            it('bad paths should cause an error', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script('ColorBarsHD()');
                var bmp = os.tmpdir() + '/avisynth-test-bad-path\0 ' + rand + '.bmp';
                script.renderFrame(bmp, function(err) {
                    if (err) {
                        if (fs.existsSync(bmp)) fs.unlinkSync(bmp);
                        done();
                    } else {
                        done(new Error('no error created when running a faulty script'));
                    }
                });
            });

            it('overwriting a file should not throw an error', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script('ColorBarsHD()');
                // We're using BMP as a format because it can be consistently hashed.
                var bmp = os.tmpdir() + '/avisynth-test-overwrite ' + rand + '.bmp';
                // First we write bogus content.
                fs.writeFileSync(bmp, 'testing');
                fs.readFileSync(bmp, {encoding:'utf8'}).should.equal('testing');
                // Now we attempt normal rendering.
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
        });

        describe('.run', function() {
            it('should allow rendering specific frames', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script();
                script.colorBarsHD();
                script.trim(0, 150); // ColorBarsHD is one hour long.
                // Animating so that a particular frame can be identified as such.
                // ShowFrameNumber is problematic because then we rely on precise
                // font rendering, and that's not reliably hashable in this case.
                script.animate(50, 150, 'Levels', 
                               0, 1, 255,   0, 255, 
                               0, 1, 255, 255, 255);
                var bmp = os.tmpdir() + '/avisynth-test-frame ' + rand + '.bmp';
                script.convertToRGB();
                script.imageWriter(bmp, 123, -1, 'bmp');
                var expected = 'e3d37022a3fd06512fc93a183cd181b1';
                script.run(function(err) {
                    bmp += '000123.bmp'; // ImageWriter adds frame number.
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
        });

        describe('.lint', function() {
            it('should raise an error for faulty scripts', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script('FilterThatDoesNotExist()');
                script.lint(function(err) {
                    expect(err).to.be.an.instanceof(AvisynthError);
                    done();
                });
            });

            it('should not raise an error for valid scripts', function(done) {
                this.timeout(10000); // Take your time.
                var script = new avisynth.Script('Version()');
                script.lint(function(err) {
                    expect(err).to.not.be.an.instanceof(AvisynthError);
                    done();
                });
            });
        });

        describe('.info', function() {
            it('should contain expected info (NTSC broadcast example)', function(done) {
                this.timeout(10000);

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

                script.info(function(err, info) {
                    expect(err).to.be.undefined();
                    expect(info).to.be.an('object');
                    // Check that all values are set.
                    expect(info.width        ).to.equal(640);
                    expect(info.height       ).to.equal(480);
                    expect(info.ratio        ).to.equal('4:3');
                    expect(info.fps          ).to.equal(23.976);
                    expect(info.fpsFraction  ).to.equal('24000/1001');
                    expect(info.videoTime    ).to.equal(59.9766);
                    expect(info.frameCount   ).to.equal(1438);
                    expect(info.colorspace   ).to.equal('YV12');
                    expect(info.bitsPerPixel ).to.equal(12);
                    expect(info.interlaceType).to.equal('field-based');
                    expect(info.fieldOrder   ).to.equal('TFF');
                    expect(info.channels     ).to.equal(1);
                    expect(info.bitsPerSample).to.equal(16);
                    expect(info.sampleType   ).to.equal('int');
                    expect(info.audioTime    ).to.equal(54.321);
                    expect(info.samplingRate ).to.equal(44056);
                    expect(info.sampleCount  ).to.equal(2393166);
                    expect(info.blockSize    ).to.equal(2);
                    done(err);
                });
            });
        });
    });
});
