var path = require('path');

// Various utilities used by code in other places.

// Check if a given path (or current working directory) contains only "safe" characters.
// The safeness is determined by AviSynth, so " is forbidden (it is by Windows, already)
// and so are all characters outside the ANSI range.
// If AviSynth allowed character escapes or something (or plain supported Unicode),
// that would be great, but it doesn't, and we can only accept this fact and throw errors
// if the world is not conforming to AviSynth's special needs.
exports.isValidPath = function(p) {
    var absolute = path.resolve(p || '');
    // Now, realistically speaking, I don't think many of these characters will be used.
    // But they don't break AviSynth, so I plan to leave them. CJK characters, for example,
    // seem like something people would like to use, but AviSynth would choke on.
    var valid = /^[ !$&'()+,-.\/0-9:=@A-Z\[\\\]\^_`a-z{}~€‚ƒ„‰Š‹ŒŽ‘’“”•–—™š›œžŸ¡¢£¤¥¦§©ª«¬®°²³´µ·¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]+$/;
    return valid.test(absolute);
};
