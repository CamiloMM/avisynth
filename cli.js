#!/usr/bin/env node
// Command-line helper for avisynth.js - https://github.com/CamiloMM/avisynth

var path = require('path');
var my = require('./package.json');

// The first argument is the command.
// Currently, the second will always be a path to a script, if any.
var name = path.basename(process.argv[1]);
var command = process.argv[2];
var script = process.argv[3];

switch (command) {
    case '-h':
    case '--help':
    case 'help':
    case '/?': // ewww
    case '':
    case undefined:
        showHelp();
        break;
    case '-v':
    case '--version':
    case 'version':
        showVersion();
        break;
    default:
        showHelp(command);
}

// Shows a help message and exits.
function showHelp(badArgument) {
    showBanner();
    var exitCode = 0;
    if (badArgument !== undefined) {
        console.log('Bad argument: "' + badArgument + '"\n');
        exitCode = 1;
    }
    console.log('Usage: ' + name + ' <command> [path]\n');
    console.log('commands:');
    console.log('    help    : show this help and exit.');
    console.log('    version : show the version number and exit.');
    process.exit(exitCode);
}

// Shows the module's version.
function showVersion() {
    console.log(my.version);
}

// Shows the "banner".
function showBanner() {
    console.log(my.name + ' ' + my.version + ' by ' + my.author.name);
    console.log(my.description);
    console.log(my.homepage + '\n');
};
