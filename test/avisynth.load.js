var fs            = require('fs');
var path          = require('path');
var should        = require('chai').should();
var avisynth      = require('../main');
var loader        = require('../code/loader');
var AvisynthError = require('../code/errors').AvisynthError;

describe('avisynth.load', function() {
    var oldRefs, baseRefs;
    var fakePluginsDir = path.resolve(__dirname, 'plugins');
    var pluginsDir = path.resolve(__dirname, '../bin/plugins');
    var scriptPath = path.resolve(fakePluginsDir, 'colors_rgb.avsi');
    var pluginPath = path.resolve(fakePluginsDir, 'DeDup.dll');
    var textFile   = path.resolve(fakePluginsDir, 'colors_rgb.txt');
    var missing    = path.resolve(fakePluginsDir, 'non-existent.dll');

    beforeEach(function() {
        oldRefs = JSON.parse(JSON.stringify(loader.references)); // Quick'n'dirty.
        baseRefs = {};
        var dlls = fs.readdirSync(pluginsDir);
        dlls.forEach(function(dll) {
            baseRefs[path.resolve(pluginsDir, dll)] = 'plugin';
        });
    });

    afterEach(function() {
        loader.references = oldRefs;
    });

    it('should load plugins and scripts from given paths', function() {
        avisynth.load(scriptPath);
        avisynth.load(pluginPath);
        loader.references[scriptPath].should.equal('script');
        loader.references[pluginPath].should.equal('plugin');
    });

    it('should throw an error for an invalid path', function() {
        var directory = fakePluginsDir;
        avisynth.load.bind(avisynth,  textFile).should.throw(AvisynthError);
        avisynth.load.bind(avisynth,   missing).should.throw(AvisynthError);
        avisynth.load.bind(avisynth, directory).should.throw(AvisynthError);
    });

    it('should not throw errors if told to ignore them', function() {
        var directory = fakePluginsDir;
        avisynth.load.bind(avisynth,  textFile, true).should.not.throw;
        avisynth.load.bind(avisynth,   missing, true).should.not.throw;
        avisynth.load.bind(avisynth, directory, true).should.not.throw;
    });

    it('should throw error if the path contains an invalid character', function() {
        var invalid = path.resolve(__dirname, 'zettai-ryōiki/invalid-path.avs');
        avisynth.load.bind(avisynth, invalid).should.throw(AvisynthError);
    });
});
