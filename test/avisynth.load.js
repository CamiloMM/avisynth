var fs       = require('fs');
var path     = require('path');
var should   = require('chai').should();
var avisynth = require('../main');
var loader   = require('../code/loader');

describe('avisynth.load', function() {
    var baseRefs;
    var pluginsDir = path.resolve(__dirname, '../bin/plugins');
    var fakePluginsDir = path.resolve(__dirname, 'plugins');

    beforeEach(function() {
        baseRefs = {};
        var dlls = fs.readdirSync(pluginsDir);
        dlls.forEach(function(dll) {
            baseRefs[path.resolve(pluginsDir, dll)] = 'plugin';
        });
    });

    it('should be a function', function() {
        avisynth.load.should.be.a('function');
    });

    it('should load plugins and scripts from given paths', function() {
        var scriptPath = path.resolve(fakePluginsDir, 'colors_rgb.avsi');
        var pluginPath = path.resolve(fakePluginsDir, 'DeDup.dll');
        avisynth.load(scriptPath);
        avisynth.load(pluginPath);
        loader.references[scriptPath].should.equal('script');
        loader.references[pluginPath].should.equal('plugin');
    });

    it('should throw an error for an invalid path', function() {
        var textFile  = path.resolve(fakePluginsDir, 'colors_rgb.txt');
        var missing   = path.resolve(fakePluginsDir, 'non-existent.dll');
        var directory = fakePluginsDir;
        avisynth.load.bind(avisynth,  textFile).should.throw(Error);
        avisynth.load.bind(avisynth,   missing).should.throw(Error);
        avisynth.load.bind(avisynth, directory).should.throw(Error);
    });

    it('should not throw errors if told to ignore them', function() {
        var textFile  = path.resolve(fakePluginsDir, 'colors_rgb.txt');
        var missing   = path.resolve(fakePluginsDir, 'non-existent.dll');
        var directory = fakePluginsDir;
        avisynth.load.bind(avisynth,  textFile, true).should.not.throw();
        avisynth.load.bind(avisynth,   missing, true).should.not.throw();
        avisynth.load.bind(avisynth, directory, true).should.not.throw();
    });
});
