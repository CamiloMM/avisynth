avisynth
========

<img align="right" width="160" height="256" src="logo.png">

*[Avisynth] bindings for [NodeJS] with a strong focus on ease-of-use.*

[![AppVeyor badge][appveyor-badge]][appveyor-link] [![CodeClimate badge][codeclimate-badge]][codeclimate-link] [![coverage badge][coverage-badge]][codeclimate-link] [![dependencies badge][dependencies-badge]][dependencies-link]

A node module that you can use to process videos, images and sound with Avisynth, in a self-contained package.

* *No dependencies*
* *Top code quality*
* *100% code coverage for all files down to branches and statements*

It currently only works in Windows (like Avisynth itself), but it may be possible, in theory, to add Linux support via Wine.

install
=======

```sh
npm install -g avisynth
```

usage
=====

It can be used both by scripts as well as from command line (also not requiring Avisynth to be installed, and possibly helpful for shell scripts in other languages).

#### Node usage:

```js
var avisynth = require('avisynth');
var script = new avisynth.Script(); // Omitting "new" is also ok
script.code = 'Version()'; // Can also be passed to the constructor
script.sharpen(1); // Direct plugin and built-in calls
script.renderFrame('foo.png', function(err) { // Time offset optional.
    console.log(err || 'foo.png saved!'); // Easy frame rendering.
});
script.run(function(err) {}); // Runs the script (with no output).
script.lint(function(err) {}); // Validates the Avisynth code.
// Still planning on adding more API, specifically video encoding.
```

#### Command-line usage:

```sh
avisynth-js info path/to/script.avs # Returns video info as JSON
avisynth-js lint path/to/script.avs # Validates a script, also JSON
```

Sample output for `info`:

```json
{
    "width": 1280,
    "height": 720,
    "ratio": "16:9",
    "fps": 29.97,
    "fpsFraction": "30000/1001",
    "videoTime": 3600,
    "frameCount": 107892,
    "colorspace": "YV12",
    "bitsPerPixel": 12,
    "interlaceType": "field-based",
    "fieldOrder": "TFF",
    "channels": 2,
    "bitsPerSample": 32,
    "sampleType": "float",
    "audioTime": 3600,
    "samplingRate": 48000,
    "sampleCount": 172799827,
    "blockSize": 8
}
```

docs
====

At the moment I'm working on [a Wiki][wiki] so soon there'll be docs there.

[Avisynth]:           http://avisynth.nl/
[NodeJS]:             http://nodejs.org/
[travis-badge]:       http://img.shields.io/travis/CamiloMM/avisynth.svg?style=flat
[travis-link]:        https://travis-ci.org/CamiloMM/avisynth
[appveyor-badge]:     https://img.shields.io/appveyor/ci/camilomm/avisynth.svg?style=flat
[appveyor-link]:      https://ci.appveyor.com/project/CamiloMM/avisynth
[codeclimate-badge]:  http://img.shields.io/codeclimate/github/CamiloMM/avisynth.svg?style=flat
[codeclimate-link]:   https://codeclimate.com/github/CamiloMM/avisynth
[coverage-badge]:     http://img.shields.io/codeclimate/coverage/github/CamiloMM/avisynth.svg?style=flat
[dependencies-badge]: https://david-dm.org/CamiloMM/avisynth.svg?style=flat
[dependencies-link]:  https://david-dm.org/CamiloMM/avisynth
[wiki]:               https://github.com/CamiloMM/avisynth/wiki
