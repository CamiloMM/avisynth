var fs       = require('fs');
var path     = require('path');
var should   = require('chai').should();
var avisynth = require('../main');
var loader   = require('../code/loader');

describe('avisynth.autoload', function() {
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
        avisynth.autoload.should.be.a('function');
    });

    it('should be used to load all the initial plugins', function() {
        loader.getReferences().should.deep.equal(baseRefs);
    });

    it('should load plugins from a given folder', function() {
        loader.getReferences().should.deep.equal(baseRefs);
        avisynth.autoload(fakePluginsDir);
        baseRefs[path.resolve(fakePluginsDir, 'colors_rgb.avsi')] = 'script';
        baseRefs[path.resolve(fakePluginsDir, 'DeDup.dll'      )] = 'plugin';
        loader.getReferences().should.deep.equal(baseRefs);
    });

    it('should throw an error if the directory does not exist', function() {
        var invalid = path.resolve(__dirname, 'non-existant');
        avisynth.autoload.bind(avisynth, invalid).should.throw(Error);
    });
});
