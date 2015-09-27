var phest = require('phest');

// Remark:
//  You can also implement autoloading with npmjs' node-dir package

var tester = new phest.TestSuiteRunner();

// libraries for the browser
tester.inject('utils/video-polyfill.js');
tester.inject('utils/audio-polyfill.js');

// scripts for the browser
tester.inject('browser/dispatch.js');
tester.inject('browser/monkey.js');
tester.inject('browser/utils.js');

// a yadda library interprets steps in Gherkin
var interpreter = require('./steps/steps.js');
var library = interpreter(tester);

// define a callback
tester.register('beforeStep', function (step) { console.log("Before step", step); });
tester.register('afterStep', function (step) { console.log("After step", step); });
tester.register('beforeScenario', function (sc) { console.log("Before scenario", sc); });
tester.register('afterScenario', function (sc) { console.log("After scenario", sc); });

tester.register('testsuiteFinished', function (report) {
  console.log("Testsuite completed.");
  if (report.ok)
    console.log("FAIL  It failed miserably");
  else
    console.log("PASS  Testsuite passed successfully");
});

// define feature files to interpret
tester.source('features/querying.feature');

// run the Gherkin files
tester.run(library);
