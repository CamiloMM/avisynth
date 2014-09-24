var expect       = require('chai').expect;
var should       = require('chai').should();
var avisynth     = require('../main');
var pluginSystem = require('../code/plugin-system');

describe('Plugin system', function() {
    it('should be exposed as an avisynth.addPlugin reference', function() {
        avisynth.addPlugin.should.equal(pluginSystem.addPlugin);
    });

    it('should allow adding plugins and getting them later', function() {
        avisynth.addPlugin('foo', function() {});
        expect(pluginSystem.plugins['foo']).to.exist;
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
});
