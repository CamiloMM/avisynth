avisynth [![AppVeyor badge][appveyor-badge]][appveyor-link] [![CodeClimate badge][codeclimate-badge]][codeclimate-link] [![coverage badge][coverage-badge]][codeclimate-link] [![dependencies badge][dependencies-badge]][dependencies-link]
========

<img align="right" width="160" height="256" src="logo.png">

*[Avisynth] bindings for [NodeJS] with a strong focus on ease-of-use.*

The idea is to have a node package that you can use to process videos, images and sound with Avisynth, in a self-contained package.

* *No dependencies*
* *Top code quality*
* *100% code coverage for all files down to branches and statements*

Let's discover how feasible this is :)

usage
=====

This is very much work-in-progress, but here's an idea of how it could work:

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
// Still thinking of how the rest of the API will be.
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
