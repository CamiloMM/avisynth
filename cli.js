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
    case 'lint':
        showLint(script);
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
    exit(exitCode);
}

// Shows the module's version and exits.
function showVersion() {
    console.log(my.version);
    exit(0);
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
        return exit(2);
    }

    if (!fs.existsSync(script)) {
        console.log('Script not found: "' + script + '"');
        return exit(3);
    }

    var pwd = path.dirname(script);
    avisynth.Script.info(script, pwd, function(error, info) {
        if (error) {
            console.log('Avisynth script could not be processed:\n' + error.message);
            return exit(4);
        }
        console.log(JSON.stringify(info, undefined, 4));
        exit();
    });
}

// Shows script's lint result and exits.
function showLint(script) {
    if (!script) {
        console.log('An Avisynth script path must be provided.');
        return exit(2);
    }

    if (!fs.existsSync(script)) {
        console.log('Script not found: "' + script + '"');
        return exit(3);
    }

    var pwd = path.dirname(script);
    avisynth.Script.lint(script, pwd, function(error) {
        var lint = {
            valid: !error,
            message: error ? error.message.replace(/\r\n/g, '\n') : ''
        };
        console.log(JSON.stringify(lint, undefined, 4));
        exit(error ? 5 : 0);
    });
}

// Taken from https://github.com/cowboy/node-exit
// I'm still having trouble to accept that this horrible dirty hack is an
// acceptable solution to the underlying problem of node's STDOUT as a pipe
// on Windows being async while it's not async with files and consoles/TTYs.
function exit(exitCode, streams) {
    if (!streams) { streams = [process.stdout, process.stderr]; }
    var drainCount = 0;
    // Actually exit if all streams are drained.
    function tryToExit() {
        if (drainCount === streams.length) {
            process.exit(exitCode);
        }
    }
    streams.forEach(function(stream) {
        // Count drained streams now, but monitor non-drained streams.
        if (stream.bufferSize === 0) {
            drainCount++;
        } else {
            stream.write('', 'utf-8', function() {
                drainCount++;
                tryToExit();
            });
        }
        // Prevent further writing.
        stream.write = function() {};
    });
    // If all streams were already drained, exit now.
    tryToExit();
    // In Windows, when run as a Node.js child process, a script utilizing
    // this library might just exit with a 0 exit code, regardless. This code,
    // despite the fact that it looks a bit crazy, appears to fix that.
    process.on('exit', function() {
        process.exit(exitCode);
    });
};
