var path     = require('path');
var avisynth = require('../main');
var utils    = require('../code/utils');

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
    });
});
