var utils         = require('./utils');
var AvisynthError = require('./errors').AvisynthError;

// A system for adding "native avisynth functionality" to script objects.
// In other words, calls to avisynth functions from avisynth.Script()s.
// These may depend on plugins, which can be specified.

// Contains a map of plugin names in lowercase to plugin objects.
exports.plugins = {};

// This is the prototype that script objects will inherit to gain plugin functionality.
exports.pluginPrototype = {};

// Adds a plugin. Do not ever add a plugin directly and always use this.
exports.addPlugin = function(name, options, code) {
    if (!code) { code = options; options = {}; }

    // Do not add a plugin twice, and avoid name collisions.
    var lowercase = name.toLowerCase();
    if (exports.plugins[lowercase]) throw new AvisynthError('plugin already exists!');

    // Some names are reserved, to avoid overriding script instance methods.
    var reserved = ['code', 'references', 'load', 'autoload', 'allReferences', 'fullCode'];
    reserved.forEach(function(res) {
        if (res.toLowerCase() === lowercase) throw new AvisynthError('reserved name!');
    });

    // Ensure that load and autoload are arrays ('string' -> ['string'], null -> []).
    var o;
    options.load = typeof (o = options.load) === 'string' ? [o] : o || [];
    options.autoload = typeof (o = options.autoload) === 'string' ? [o] : o || [];

    var plugin = {};
    plugin.code = code;
    plugin.options = options;
    plugin.aliases = [];

    // Generate aliases if needed.
    if (/^[A-Z].*[A-Z]/.test(name)) plugin.aliases.push(name[0].toLowerCase() + name.substr(1));
    if (/^.*[A-Z]/.test(name)) plugin.aliases.push(name);

    exports.plugins[lowercase] = plugin;

    addToPrototype(lowercase, plugin);
};

// Helper to add a plugin to the prototype.
function addToPrototype(name, plugin) {
    var aliases = [name].concat(plugin.aliases);

    // The function added as a plugin wraps the original function, providing
    // loading, autoloading and (TODO).
    var code = function() {
        var context = this;
        plugin.options.load.forEach(function(item) { context.load(item); });
        plugin.options.autoload.forEach(function(item) { context.autoload(item); });
        var returned = plugin.code.apply(context, arguments);
        if (typeof returned === 'string') {
            // Add a newline to avoid breaking stuff, if it's not already there.
            if (this.code[this.code.length - 1] !== '\n') this.code += '\n';
            this.code += returned;
        }
    };

    // The code above will exist for all aliases.
    aliases.forEach(function(alias) {
        exports.pluginPrototype[alias] = code;
    });
}
