#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

var mocha = require('mocha');
var path = require('path');
var set = require('../lib/set.js');
var fs = require('fs'); // TODO: level-filesystem as alternative
var minimist = require('minimist');
var Set = set.Set;

/**
 * Interpret CLI parameters assuming phest was invoked by nodejs.
 * @param
 **/
function runPhest(args) {
  var argv = minimist(args);
  var testsuiteName = argv._[0];

  if (!testsuiteName) {
    console.error("Usage: node phest.js <testsuite>");
    var examples = fs.readdirSync("examples");
    examples = examples.filter(function (v) { return v.substr(v.length - 3) !== '.js' });
    if (examples) {
      console.error("  The following testsuites are known:");
      for (var e = 0; e < examples.length; e++)
        console.error("    * examples/" + examples[e]);
    }
    process.exit(9);
  }

  runTestsuite(testsuiteName);
}


/**
 * Run a testsuite by name. This expects a strict file structure
 * specified in the README file.
 * @param {string} name - the name to run the testsuite with
 **/
function runTestsuite(name) {
  var projectBase = path.join(process.cwd(), name);
  var projectSource = path.join(projectBase, 'test.js');

  var runTs = function () {
    var mochaInstance = new mocha({ui: 'bdd', reporter: 'spec', timeout: 20000});

    var oldDir = process.cwd();
    process.chdir(projectBase);

    console.info("Running project " + path.basename(name) + " now...");
    mochaInstance.addFile(projectSource);
    mochaInstance.run(function (fail) {
      process.on('exit', function () {
        process.exit(fail);
      });
    });

    process.chdir(oldDir);
  };

  fs.exists(projectSource, function (success) {
    if (success) {
      fs.exists(projectBase, function (success) {
        if (!success)
          projectBase = process.cwd();
        runTs();
      });
    } else {
      throw new Error("Cannot find testsuite " + name +
            ". Expected it on location " + projectSource);
    }
  });
}

runPhest(process.argv.slice(2));
