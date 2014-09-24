
// A system for adding "native avisynth functionality" to script objects.
// In other words, calls to avisynth functions from avisynth.Script()s.
// These may depend on plugins, which can be specified.

// Contains a map of plugin names in lowercase to plugin objects.
exports.plugins = {};

// This is the prototype that script objects will inherit to gain plugin functionality.
exports.pluginPrototype = {};

// Adds a plugin. Do not ever add a plugin directly and always use this.
exports.addPlugin = function(name, code) {
    var plugin = {};
    plugin.code = code;
    plugin.aliases = [];
    if (/^[A-Z].*[A-Z]/.test(name)) plugin.aliases.push(name[0].toLowerCase() + name.substr(1));
    if (/^.*[A-Z]/.test(name)) plugin.aliases.push(name);
    exports.plugins[name.toLowerCase()] = plugin;
};
