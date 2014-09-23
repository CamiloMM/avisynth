avisynth
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

[Avisynth]:  http://avisynth.nl/
[NodeJS]:    http://nodejs.org/
