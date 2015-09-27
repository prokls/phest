/**
 * @file Public API for phest
 * @module api
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

// dependencies
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var yaddaModule = require('yadda');

var eventsModule = require(path.resolve(__dirname, '../lib/events.js'));
var EventHandler = eventsModule.EventHandler;


var TestSuiteRunner = function () {
  var injectFiles = [];
  var url = '';
  var testsuite = { 'when': [], 'then': [] };
  var events = new EventHandler('public-api',
    ['beforeStep', 'afterStep', 'beforeScenario', 'afterScenario',
     'beforeFeature', 'afterFeature',
     'browserStarted', 'browserFinished', 'browserFailed',
     'testsuiteFinished']
  );
  var sources = [];

  /**
   * Register a javascript file for injection into phantomJS.
   * http://phantomjs.org/api/webpage/method/inject-js.html
   *
   * @param {string} filepath - the filepath to the JS file to inject
   */
  var inject = function (filepath) {
    var abs = path.resolve(__dirname, filepath);

    fs.exists(abs, function (success) {
      if (!success)
        throw new Error("File not found: " + abs);
      else
        injectFiles.push(abs);
    });
  };

  /**
   * Given an arbitrary object, replace strings like "$arg1"
   * with the real argument value provided in `args`.
   *
   * @param {Array} args - a list of arguments
   * @param {*} obj - an arbitrary object to search for replacement strings in
   * @return {*} `obj` with replaced values
   */
  var expand = function (args, obj) {
    if (typeof obj === "undefined" || typeof obj === "boolean")
      return obj;
    else if (typeof obj === "number" || typeof obj === "symbol")
      return obj;
    else if (typeof obj === "function")
      return obj;
    else if (typeof obj === "object")
      for (var p in obj)
        obj[p] = expand(args, obj[p]);
    else if (typeof obj === "string") {
      var regex = new RegExp(/\$arg(\d+)/);
      do {
        var match = regex.exec(obj);
        if (match)
          obj = obj.replace(match[0], args[parseInt(match[1]) - 1]);
      } while (match);
    }
    return obj;
  };

  /**
   * Tell which URL shall be opened when browser starts.
   *
   * @param {string} spec - the URL specification to load
   *                        (will be expanded)
   */
  var openUrl = function (spec) {
    return function () {
      var next = arguments[arguments.length - 1];
      var args = [];
      for (var i = 0; i < arguments.length - 1; i++)
        args.push(arguments[i]);

      url = expand(args, spec);
      next();
    };
  };

  /**
   * Declare a When statement to satisfy.
   *
   * @param {object} obj - an object specifying the when statement
   */
  var when = function (obj) {
    return function () {
      var next = arguments[arguments.length - 1];
      var args = [];
      for (var i = 0; i < arguments.length - 1; i++)
        args.push(arguments[i]);

      expand(args, obj);
      testsuite['when'].push(obj);
      next();
    };
  };

  /**
   * Declare a Then statement to meet.
   *
   * @param {object} obj - an object specifying the then statement
   */
  var then = function (obj) {
    return function () {
      var next = arguments[arguments.length - 1];
      var args = [];
      for (var i = 0; i < arguments.length - 1; i++)
        args.push(arguments[i]);

      expand(args, obj);
      testsuite['then'].push(obj);
      next();
    };
  };

  /**
   * Add a feature file as source file.
   * @param {string} src - filepath to a feature file in Gherkin syntax
   */
  var source = function (src) {
    sources.push(src);
  };

  /**
   * Actually run the testsuite in a subprocess.
   */
  var runTestsuite = function () {
    child = child_process.fork(__dirname + "/phantomjs.js", ['--webSecurityEnabled', 'false']);

    setTimeout(function () { child.send({ action: 'open', url: url }); }, 500);
    setTimeout(function () { child.send({ action: 'run', testsuite: testsuite }); }, 4000);

    child.on('message', function (m) {
      if (m.state === 'browserStarted')
        console.log("Child yields: browser has started");
      else if (m.state === 'browserFinished')
        console.log('Child yields: browser has finished' + m.message);
      else if (m.state === 'browserFailed')
        console.log('Child yields: browser failed: ' + m.error);
      else
        console.log("Unknown message received from child: " + JSON.stringify(m));
    });

    child.on('exit', function() {
      process.exit();
    });
  };

  /**
   * Interpret Gherkin files and call `runTestsuite`.
   *
   * @param {object} lib - a Yadda library object to match Gherkin statements
   */
  var run = function (lib) {
    lib.afterScenario = runTestsuite;

    for (var f in sources) {
      var file = sources[f];
      // TODO Feature. Restrict tested features by command line parameter

      featureFile(file, function (feature) {
        var interpreter = new yaddaModule.Yadda(lib);

        events.dispatchEvent('beforeFeature', [feature.title]);
        if (lib.beforeFeature)
          before(lib.beforeFeature);

        scenarios(feature.scenarios, function (scenario) {
          events.dispatchEvent('beforeScenario', [scenario]);
          if (lib.beforeScenario)
            before(lib.beforeScenario);

          steps(scenario.steps, function (step, done) {
            events.dispatchEvent('beforeStep', [step]);
            if (lib.beforeStep)
              before(lib.beforeStep);

            interpreter.yadda(step, done);

            events.dispatchEvent('afterStep', [step]);
            if (lib.afterStep)
              after(lib.afterStep);
          });

          events.dispatchEvent('afterScenario', [scenario]);
          if (lib.afterScenario)
            after(lib.afterScenario);
        });

        events.dispatchEvent('afterFeature', [feature.title]);
        if (lib.afterFeature)
          after(lib.afterFeature);
      });
    }
  };

  return {
    'inject': inject,
    'openUrl': openUrl,
    'when': when,
    'then': then,
    'source': source,
    'register': events.addEventListener,
    'run': run
  };
}



// initialize Yadda's StepLevelPlugin we will use to interpret Gherkin files
yaddaModule.plugins.mocha.StepLevelPlugin.init();

module.exports = {
  TestSuiteRunner : TestSuiteRunner
};
