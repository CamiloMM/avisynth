var should = require('chai').should();
var avisynth = require('../main');

describe('avisynth.Script', function() {
    it('should be a function', function() {
        avisynth.Script.should.be.a('function');
    });
});
