#!/usr/bin/env node
// Command-line helper for avisynth.js - https://github.com/CamiloMM/avisynth

var path = require('path');
var fs = require('fs');
var avisynth = require('./main.js');
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
    case 'info':
        showInfo(script);
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
    console.log('Commands:');
    console.log('    help    : Show this help and exit.');
    console.log('    version : Show the version number and exit.');
    console.log('    info    : Return info from a script in json format.');
    process.exit(exitCode);
}

// Shows the module's version and exits.
function showVersion() {
    console.log(my.version);
    process.exit(0);
}

// Shows the "banner".
function showBanner() {
    console.log(my.name + ' ' + my.version + ' by ' + my.author.name);
    console.log(my.description);
    console.log(my.homepage + '\n');
}

// Shows script info and exits.
function showInfo(script) {
    if (!script) {
        console.log('An Avisynth script path must be provided.');
        return process.exit(2);
    }

    if (!fs.existsSync(script)) {
        console.log('Script not found: "' + script + '"');
        return process.exit(3);
    }

    var pwd = path.dirname(script);
    avisynth.Script.info(script, pwd, function(error, info) {
        if (error) {
            console.log('Avisynth script could not be processed:\n' + error.message);
            return process.exit(4);
        }
        console.log(JSON.stringify(info, undefined, 4));
        process.exit();
    });
}
