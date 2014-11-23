var path          = require('path');
var addPlugin     = require('./plugins').addPlugin;
var colors        = require('./colors');
var utils         = require('./utils');
var AvisynthError = require('./errors').AvisynthError;

// This function creates and adds a new plugin to the plugin system with ease.
// "name" can be either a name, or a combination of name and parameters in parens.
// Such an usage is employed extensively in plugin-definitions.js, serving as example.
// "options" can be an object with options, a parameter list (array or string), or type
// list if the name includes a parameter list. "types", if specified, is a type list
// for the "t" parameter modifier, types can also be in an array or string. Both these
// strings are separated by commas, and trim whitespaces for each item.
// Each parameter can be either a name, or a name with modifiers prefixed, separated by
// a colon, for example "ri:length" means "required int called length". In this usage,
// the name is optional (some avisynth plugins don't even accept some named parameters).
// The full list of modifiers is:
// q: quoted (string).
// p: filesystem path (resolved to absolute), implies q.
// r: required field. Lack of it is an error.
// f: forced file path, implies p and r.
// n: not a path (actually, not a string). Throws if a string is given.
// t: a type, this is checked against options.types. Implies q.
// b: field is cast to boolean.
// d: field is cast to a decimal number (integer or float).
// i: field is cast to integer, rounded as necessary. Implies d.
// v: a variable name (unquoted string), checked for syntactic validity.
// c: a color variable, can be an int, name or string (0x123ABC, 0, 'red', 'F0F', 'FF00FF').
// e: escaped string, currently \n, \\ and " (through """) are supported. Implies q.
// a: auto-type, strings get quoted, numbers and bools not.
//    (variables are only supported in "a" with an unmatched "t" type, and paths with "p").
//
// It might seem like a complicated function but once you see examples you'll notice
// it allows defining complex plugin signatures in a single line.
exports.newPlugin = function(name, options, types) {
    var actualName = name.indexOf('(') !== -1 ? name.match(/[^(]*/)[0] : name;
    addPlugin(actualName, createPlugin(name, options, types));
};

// Checks that a value is one of a set of allowed values, else throwing an AvisynthError.
function checkType(value, allowed) {
    if (value && allowed.indexOf(value) === -1) {
        throw new AvisynthError('bad type (' + value + ')! allowed values: ' + allowed);
    }
}

function createPlugin(name, options, types) {

    // Lazyness taken to new heights. First parameter can succintly describe some filters.
    // If combined with defining the second parameter, that will represent the types.
    if (name.indexOf('(') !== -1) {
        var matches = name.match(/([^() ]*)\s*(\((.*)\))?/);
        name = matches[1];
        if (options) { types = options; }
        options = matches[3];
    }

    // Conveniently cast options/types from string to array, for the condition below.
    if (typeof options === 'string') { options = options.split(/\s*,\s*/); }
    if (typeof types   === 'string') { types   =   types.split(/\s*,\s*/); }

    // If options is an array instead of object, it is treated as options.params.
    // Optionally, options.types can be inlined too, by passing a second array.
    if (options && utils.isDefined(options.length)) {
        options = {params: options, types: types};
    }

    // If options is still not defined, default it.
    if (!utils.isDefined(options)) { options = {}; }

    // These aren't being used, in favor of the cleaner options currently available.
    // I may just drop these options altogether, but I'm still not sure if they
    // can have any use, if we expose this plugin definition system eventually.
    // // We also support shorthands for the options properties.
    // if (options.p) { options.params = options.p; }
    // if (options.t) { options.types  = options.t; }
    //
    // // Similar to a cast above, but for options' properties.
    // if (typeof options.params === 'string') { options.params = options.params.split(/\s*,\s*/); }
    // if (typeof options.types  === 'string') { options.types  =  options.types.split(/\s*,\s*/); }

    // Utility that processes a parameter, used in core filters. The m variable is the modifier.
    var processParameter = parameterProcessor(options);

    return pluginImplementation(name, options, processParameter);
}

// Returns a plugin implementation to be added as a plugin by createPlugin
function pluginImplementation(name, options, processParameter) {
    return function() {
        // Construct parameter definitons.
        var definitions = [];
        if (options.params) {
            options.params.forEach(function(param) {
                // Each item in options.params should follow modifier:identifier format.
                var matches = param.match(/^((.*):)?(.*)$/);
                definitions.push({modifier: matches[2], identifier: matches[3]});
            });
        }

        // Construct parameter list.
        var params = [];
        // There are two iterators; "a" is for actual argument, "d" is for definiton.
        // These may progress independently if a definiton accepts multiple arguments.
        for (var a = 0, d = 0; a < arguments.length; a++, d++) {
            var definition = definitions[d];
            if (!definition) { throw new AvisynthError('too many arguments for ' + name); }
            var value = arguments[a];
            if (!utils.isDefined(value)) { continue; }
            var m = definition.modifier;
            if (/m/.test(m)) {
                // Multiple parameter modes.
                var multi = [value];
                var type = typeof value;
                if (/a/.test(m)) {
                    while (typeof (value = arguments[++a]) !== 'undefined') { multi.push(value); }
                } else {
                    while (typeof (value = arguments[++a]) === type) { multi.push(value); }
                }
                a--;
                multi = multi.map(processParameter.bind(null, m));
                multi.forEach(function(p) { params.push(p); });
            } else {
                value = processParameter(m, value);
                if (definition.identifier) {
                    params.push(definition.identifier + '=' + value);
                } else {
                    // Now we reach a special case, because if the parameter is nameless,
                    // we have to avoid it being ambiguous with a previous one.
                    // This could happen if any previous parameter was omitted (named or not).
                    if (a > params.length) {
                        throw new AvisynthError('a skipped parameter makes ' + value + ' ambiguous!');
                    } else {
                        params.push(value);
                    }
                }
            }
        }

        // Ensure all required arguments are provided.
        for (var i = 0; i < definitions.length; i++) {
            var def = definitions[i];
            if (def.modifier && !utils.isDefined(arguments[i])) {
                if (/f/.test(def.modifier)) { throw new AvisynthError('filename is a required argument!'); }
                if (/r/.test(def.modifier)) { throw new AvisynthError('a required argument is missing!'); }
            }
        }

        return name + '(' + params.join(', ') + ')';
    };
}

// Creates a parameter processor.
function parameterProcessor(options) {
    // "m" is the modifier (assumed to be a string).
    return function(m, value) {
        var param = {m: m, value: value, options: options};
        if (!/a/.test(m)) {
            processType(param);
            processPath(param);
            processString(param);
        }
        processNonPath(param);
        processBoolean(param);
        processDecimal(param);
        processInteger(param);
        processColor(param);
        processVariable(param);
        processAutotype(param);
        return param.value;
    };
}

// The following functions perform the grunt work of the parameter processor.

function processType(param) {
    if (/t/.test(param.m)) {
        checkType(param.value, param.options.types);
    }
}

function processPath(param) {
    if (/[fp]/.test(param.m)) {
        param.value = path.resolve(param.value);
    }
}

function processString(param) {
    if (/[e]/.test(param.m)) {
        param.value = '"""' + param.value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n') + '"""';
    } else if (/[fpqt]/.test(param.m)) {
        param.value = '"' + param.value + '"';
    }
}

function processNonPath(param) {
    if (/n/.test(param.m) && typeof param.value === 'string') {
        throw new AvisynthError('only one path supported!');
    }
}

function processBoolean(param) {
    if (/b/.test(param.m) && param.value !== Boolean(param.value)) {
        throw new AvisynthError('expected boolean, got "' + param.value + '"');
    }
}

function processDecimal(param) {
    if (/d/.test(param.m) && param.value !== +param.value) {
        throw new AvisynthError('expected number, got "' + param.value + '"');
    }
}

function processInteger(param) {
    if (/i/.test(param.m) && param.value !== Math.round(param.value)) {
        throw new AvisynthError('expected integer, got "' + param.value + '"');
    }
}

function processColor(param) {
    if (/c/.test(param.m)) {
        param.value = colors.parse(param.value);
    }
}

function processVariable(param) {
    if (/v/.test(param.m)) {
        if (typeof param.value !== 'string') {
            throw new AvisynthError('variable must be a string!');
        }
        if (!/^[a-z_][0-9a-z_]*$/i.test(param.value)) {
            throw new AvisynthError('bad syntax for variable name "' + param.value + '"!');
        }
    }
}

function processAutotype(param) {
    if (/a/.test(param.m)) {
        // Auto-parameters should guess what the value is supposed to mean.
        // If it's a number or boolean, just output it as is.
        // But if it's a string, it depends on whether it can also be a type.
        if (typeof param.value === 'string') {
            // Types should not throw errors, but rather become variables if possible.
            if (/t/.test(param.m)) {
                try {
                    checkType(param.value, param.options.types);
                    param.value = '"' + param.value + '"';
                } catch (e) {
                    if (!/^[a-z_][0-9a-z_]*$/i.test(param.value)) {
                        throw new AvisynthError('bad syntax for variable name "' + param.value + '"!');
                    }
                }
            } else if (/p/.test(param.m)) {
                // Will be converted to a path.
                param.value = '"' + path.resolve(param.value) + '"';
            } else if (/q/.test(param.m)) {
                // Will be just quoted.
                param.value = '"' + param.value + '"';
            } else {
                if (!/^[a-z_][0-9a-z_]*$/i.test(param.value)) {
                    throw new AvisynthError('bad syntax for variable name "' + param.value + '"!');
                }
            }
        }
    }
}
