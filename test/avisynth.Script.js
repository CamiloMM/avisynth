var should   = require('chai').should();
var expect   = require('chai').expect;
var avisynth = require('../main');
var Script   = require('../code/Script');

describe('avisynth.Script', function() {
    var rand = Math.random(); // Guess what, initializing it takes ~260ms for me on Win7.

    it('should be a Script construtor', function() {
        avisynth.Script.should.be.a('function');
        (new avisynth.Script).should.be.instanceof(Script);
    });

    it('should accept omitting the "new" operator', function() {
        avisynth.Script().should.be.instanceof(Script);
    });

    describe('Script instances', function() {
        it('should accept a code parameter, and include it as a property', function() {
            var code = '\nVersion()\n\nSubtitle("' + rand + '")';
            avisynth.Script(code).code.should.equal(code);
        });

        it('should have empty code if no code was provided', function() {
            avisynth.Script().code.should.equal('');
        });

        describe('.load', function() {
            it('should be a function', function() {
                avisynth.Script().load.should.be.a('function');
            })
        });

        describe('.autoload', function() {
            it('should be a function', function() {
                avisynth.Script().autoload.should.be.a('function');
            })
        });
    });
});
