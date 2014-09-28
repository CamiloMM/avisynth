var fs            = require('fs');
var path          = require('path');
var should        = require('chai').should();
var avisynth      = require('../main');
var loader        = require('../code/loader');
var AvisynthError = require('../code/errors').AvisynthError;

describe('avisynth.autoload', function() {
    var oldRefs, baseRefs;
    var pluginsDir = path.resolve(__dirname, '../bin/plugins');
    var fakePluginsDir = path.resolve(__dirname, 'plugins');

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

    it('should be used to load all the initial plugins', function() {
        loader.references.should.deep.equal(baseRefs);
    });

    it('should load plugins and scripts from a given directory', function() {
        loader.references.should.deep.equal(baseRefs);
        avisynth.autoload(fakePluginsDir);
        baseRefs[path.resolve(fakePluginsDir, 'colors_rgb.avsi')] = 'script';
        baseRefs[path.resolve(fakePluginsDir, 'DeDup.dll'      )] = 'plugin';
        loader.references.should.deep.equal(baseRefs);
    });

    it('should throw an error if the directory does not exist', function() {
        var invalid = path.resolve(__dirname, 'non-existant');
        avisynth.autoload.bind(avisynth, invalid).should.throw(AvisynthError);
    });

    it('should throw error if the path contains an invalid character', function() {
        var invalid = path.resolve(__dirname, 'zettai-ryōiki');
        avisynth.autoload.bind(avisynth, invalid).should.throw(AvisynthError);
    });
});
