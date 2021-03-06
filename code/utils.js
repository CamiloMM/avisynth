var path = require('path');
var fs   = require('fs');

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

// Checks if something is an object, courtesy of Lo-Dash.
exports.isObject = function(value) {
    var objectTypes = {
        'boolean'   : false,
        'function'  : true,
        'object'    : true,
        'number'    : false,
        'string'    : false,
        'undefined' : false
    };
    // check if the value is the ECMAScript language type of Object
    // http://es5.github.io/#x8
    // and avoid a V8 bug
    // http://code.google.com/p/v8/issues/detail?id=2291
    return !!(value && objectTypes[typeof value]);
};

exports.isNumeric = function(value) {
    if (value === '') return false;
    if (typeof value === 'object') return false;
    if (typeof value === 'boolean') return false;
    if (Math.abs(value) === Infinity) return false;
    return +value == value;
};

// Checks that a value is not null or undefined.
exports.isDefined = function (value) {
    return typeof value !== 'undefined' && value !== null;
};

// Ensures that a directory exists, synchronously.
exports.ensureDirectory = function(path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        if (e.code != 'EEXIST') throw e;
    }
};

// Recursively remove a directory. Taken from https://gist.github.com/tkihira/2367067
var removeDirectory = exports.removeDirectory = function(dir) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);
        
        if(stat.isDirectory()) {
            // rmdir recursively
            removeDirectory(filename);
        } else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);
};

// Creates an object from an array of keys and an array of values.
exports.zipObject = function (keys, values) {
    var result = {};

    for (var i = 0; i < keys.length; i++) {
        result[keys[i]] = notEmptyString(values[i]);
    }

    return result;
};

// Converts empty strings to undefined.
function notEmptyString(value) {
    return value === '' ? undefined : value;
}
