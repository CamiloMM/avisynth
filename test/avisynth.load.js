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

    it('should be used to load all the initial plugins', function() {
        loader.getReferences().should.deep.include.keys(Object.keys(baseRefs));
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

    it('should load plugins from a given folder', function() {
        avisynth.autoload(fakePluginsDir);
        baseRefs[path.resolve(fakePluginsDir, 'colors_rgb.avsi')] = 'script';
        baseRefs[path.resolve(fakePluginsDir, 'DeDup.dll'      )] = 'plugin';
        loader.getReferences().should.deep.equal(baseRefs);
    });
});
