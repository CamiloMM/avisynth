
// Avisynth script constructor.

module.exports = function Script(code) {
    this.code = code || '';
    this.load = function load() {};
    this.autoload = function autoload() {};
}
