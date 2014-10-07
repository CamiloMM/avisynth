avisynth [![Travis badge][travis-badge]][travis-link] [![CodeClimate badge][codeclimate-badge]][codeclimate-link] [![coverage badge][coverage-badge]][codeclimate-link] [![dependencies badge][dependencies-badge]][dependencies-link]
========

*[Avisynth] bindings for [NodeJS] with a strong focus on ease-of-use.*

The idea is to have a node package that you can use to process videos, images and sound with Avisynth, in a self-contained package.

Let's discover how feasible this is :)

usage
=====

This is very much work-in-progress, but here's an idea of how it could work:

```js
var avisynth = require('avisynth');
var script = new avisynth.Script(); // Omitting "new" is also ok
script.code = 'Version()'; // Can also be passed to the constructor
script.sharpen(1); // Direct plugin and built-in calls; working on it at the moment.
// Still thinking of how the rest of the API will be.
```

[Avisynth]:           http://avisynth.nl/
[NodeJS]:             http://nodejs.org/
[travis-badge]:       http://img.shields.io/travis/CamiloMM/avisynth.svg?style=flat
[travis-link]:        https://travis-ci.org/CamiloMM/avisynth
[codeclimate-badge]:  http://img.shields.io/codeclimate/github/CamiloMM/avisynth.svg?style=flat
[codeclimate-link]:   https://codeclimate.com/github/CamiloMM/avisynth
[coverage-badge]:     http://img.shields.io/codeclimate/coverage/github/CamiloMM/avisynth.svg?style=flat
[dependencies-badge]: https://david-dm.org/CamiloMM/avisynth.svg?style=flat
[dependencies-link]:  https://david-dm.org/CamiloMM/avisynth
