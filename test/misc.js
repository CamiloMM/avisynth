var path     = require('path');
var os       = require('os');
var avisynth = require('../main');
var utils    = require('../code/utils');
var should   = require('chai').should();
var expect   = require('chai').expect;

// Misc tests.

describe('Environment', function() {
    it('should not have unsupported characters in the path', function() {
        path.resolve().should.satisfy(utils.isValidPath);
    });
});

describe('avisynth.utils', function() {
    it('should reference utils.js', function() {
        avisynth.utils.should.equal(utils);
    });

    describe('.isValidPath', function() {
        it('should allow all characters AviSynth supports', function() {
            var horrible = 'C:/ !$&\'()+,-./0-9:=@A-Z[\\]^_`a-z{}~€‚ƒ„‰Š‹ŒŽ‘’“”•–—™š›œžŸ¡¢£¤¥¦§©ª«¬®°²³´µ·¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ.avs';
            horrible.should.satisfy(avisynth.utils.isValidPath);
        });

        it('should not allow characters AviSynth does not support', function() {
            var zettaiRyōiki = 'C:/zettai ryōiki.avs';
            zettaiRyōiki.should.not.satisfy(avisynth.utils.isValidPath); // Unfortunately.
        });

        it('should consider current path as valid', function() {
            expect(undefined).to.satisfy(avisynth.utils.isValidPath);
        });
    });

    describe('.isObject', function() {
        it('should check if something is an object', function() {
            avisynth.utils.isObject({}          ).should.be.true;
            avisynth.utils.isObject([]          ).should.be.true;
            avisynth.utils.isObject(function(){}).should.be.true;
            avisynth.utils.isObject(true        ).should.be.false;
            avisynth.utils.isObject(undefined   ).should.be.false;
            avisynth.utils.isObject(null        ).should.be.false;
            avisynth.utils.isObject(123         ).should.be.false;
            avisynth.utils.isObject('abc'       ).should.be.false;
        });
    });

    describe('.isNumeric', function() {
        it('should check if something looks like an usable number', function() {
            avisynth.utils.isNumeric("-10"       ).should.be.true;
            avisynth.utils.isNumeric(16          ).should.be.true;
            avisynth.utils.isNumeric(0xFF        ).should.be.true;
            avisynth.utils.isNumeric("0xFF"      ).should.be.true;
            avisynth.utils.isNumeric("8e5"       ).should.be.true;
            avisynth.utils.isNumeric(3.1415      ).should.be.true;
            avisynth.utils.isNumeric(-10         ).should.be.true;
            avisynth.utils.isNumeric(0144        ).should.be.true;
            avisynth.utils.isNumeric(0           ).should.be.true;
            avisynth.utils.isNumeric(""          ).should.be.false;
            avisynth.utils.isNumeric({}          ).should.be.false;
            avisynth.utils.isNumeric([]          ).should.be.false;
            avisynth.utils.isNumeric(function(){}).should.be.false;
            avisynth.utils.isNumeric(NaN         ).should.be.false;
            avisynth.utils.isNumeric(null        ).should.be.false;
            avisynth.utils.isNumeric(true        ).should.be.false;
            avisynth.utils.isNumeric(Infinity    ).should.be.false;
            avisynth.utils.isNumeric(undefined   ).should.be.false;
        });
    });

    describe('.ensureDirectory', function() {
        it('should not throw if directory exists', function() {
            avisynth.utils.ensureDirectory(os.tmpdir());
        });

        it('should throw if directory path is invalid', function() {
            var call = utils.ensureDirectory.bind(utils, os.tmpdir() + '/\0');
            expect(call).to.throw(Error);
        });
    });
});
