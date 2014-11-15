
// This file contains a wrapper of each of the various core filters
// bundled with AviSynth, to ease their usage in script instances.

// As clarification for whoever reads this in the future: I'm using a custom ad-hoc syntax
// that describes how they work, this allows me to define a whole filter in a single line.
// Check the file required above (plugin-definition-system.js) for more info.

// Edit: CodeClimate was complaining that this file was too complex.
// Honestly, I liked how it was, but I'm not sacrificing that 4.0 GPA,
// so this file has been split. See the required files.

require('./media');
require('./adjustments');
require('./blending');
require('./geometry');
require('./convolution');
require('./timeline');
require('./interlacing');
require('./audio');
require('./meta');
require('./debug');
