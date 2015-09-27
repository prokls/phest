var Yadda = require('yadda');
var phridge = require('phridge');
var path = require('path');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');

var set = require(path.resolve(__dirname, 'lib/set.js'));
var Set = set.Set;

// scripts for injectJs
// invariant: order of insertion is preserved
var _injectFiles = new Set();

// registered event handlers
var _events = {};
var _knownEvents = new Set(['browserStarted', 'testsuiteStarted',
                            'beforeScenario', 'afterScenario',
                            'beforeStep', 'afterStep',
                            'consoleMessage', 'browserFailed',
                            'testsuiteFinished', 'browserFinished']);

// the phridge/phantomjs page
var _page;



/**
 * Register a given script filepath for injection to the browser
 * @param {string} script - the script filepath to add
 **/
function inject(script)
{
  var abs = path.resolve(__dirname, script);

  fs.exists(abs, function (success) {
    if (!success)
      throw new Error("File not found: " + abs);
    else
      _injectFiles.add(abs);
  });
}


/**
 * Register a callback to be called when the corresponding event happens.
 * @param {string} evt - the event name
 * @param {function} clbk - the callback to use
 * @param {number} max_calls - maximum number of invocations of callback
 **/
function register(evt, clbk, max_calls) {
  max_calls = max_calls || Infinity;  // default value "Infinity"

  // only valid events allowed
  if (!_knownEvents.has(evt))
    throw new Error("Unknown event registered: " + evt);

  // add to map
  if (typeof _events[evt] === 'undefined')
    _events[evt] = [];
  _events[evt].push([clbk, max_calls]);
}


/**
 * Invoke event handlers for a particular event.
 * @param {string} evt - the event name
 * @param {Map} context - the context to invoke callback with
 * @param {Array} params - the parameters to supply
 **/
function invokeEventHandlers(evt, context, params) {
  if (!_knownEvents.has(evt))
    throw new Error("Trying to invoke unknown event: " + evt);
  if (typeof _events[evt] === 'undefined')
    return;  // event without event handlers

  for (var i = 0; i < _events[evt].length; i++) {
    var clbk = _events[evt][i][0];
    clbk.apply(context, params);

    _events[evt][i][1] -= 1;
    if (_events[evt][i][1] === 0)
      _events[evt].splice(i, 1);
  }
}

/**
 * Send a message to the browser.
 * @param {object} msg - The message to send to the browser.
 * The first element should be a dispatching element.
 * The following elements are its parameters.
 **/
function send(msg) {
  if (typeof _page === 'undefined') {
    console.error("Cannot send message to browser. Webpage object is not ready.");
    return;
  }

  _page.evaluate(function (message) {
    window.receiveMessage(message);
  }, msg);
}

/**
 * Open a URL and start the browser.
 * @param {string} url - the URL to open
 * @param {function} callback - the callback called when the browser
 *   has started up (equivalent to browserStarted event)
 **/
function openUrl(url, callback) {
  phantomjs_runner
}
function startBrowser(url, injectFiles, resolve, reject) {
  _page = this;
  console.log("startBrowser invoked");

  _page.onError = function (msg, trace) {
    console.error("An error occured in phantomjs: " + msg);
    trace.forEach(function (item) {
      console.error("  ", item.file, ": line", item.line);
    });
    reject(new Error("JavaScript execution error"));
  };

  _page.onConsoleMessage = function (msg, lineno, sourceid) {
    // TODO: invoked consoleMessage, but is browser context
    if (lineno !== undefined && sourceid !== undefined)
      console.error("console output: " + msg + " (line " + lineno + ") in " + sourceid);
    else
      console.info("console output: " + msg);
  };

  _page.onCallback = function (msg) {

    // setup logging
    var fs = phantom.createFilesystem();
    var c = fs.open('config.json', {'mode': 'r'}); // TODO: overridability with CLI arguments
    var config = JSON.parse(c.read());
    c.close();

    var logfile = fs.open(config.log_path, {'mode': 'a'});
    var lwrite = function (m) { logfile.writeLine(m); logfile.flush(); };
    var lend = function () { logfile.flush(); logfile.close(); };
    var info = function (m) { console.info(m); lwrite(m); };
    var log = function (m) { console.log(m); lwrite(m); };
    var error = function (m) { console.error(m); lwrite(m); };
    var warn = function (m) { console.warn(m); lwrite(m); };

    // error: unknown type
    if (typeof msg['type'] === 'undefined') {
      var err = 'Invalid message received: ' + JSON.stringify(msg);
      lwrite(err);
      lend();
      throw new Error(err);
    }

    var countObjectAttributes = function (obj) {
      var counter = 0;
      for (var _ in obj)
        counter++;
      return counter;
    };

    var msgtype = msg['type'];
    var userInputEventKeys = ['mousemove', 'click', 'mousedown', 'keydown',
      'mouseup', 'keyup', 'keypress']; 

    switch (msgtype) {
      case 'action':
        if (msg['action'][0] === 'screenshot') {
          var suffix = (msg['action'][1])
                          ? ("" + msg['action'][1])
                          : ("" + Date.now());
          _page.render('screenshot-' + suffix + '.png');

        } else if (userInputEventKeys.indexOf(msg['action'][0]) >= 0) {
          _page.sendEvent.apply(this, msg['action']);
        }
        break;

      case 'test':
        var path = 'feature? scenario? check?';  // TODO
        var m = path + ": I expected that '" + msg.test.what + "' '"
              + msg.test.expected + '" and this is '
              + (msg.test.state === 'ok' ? 'fine' : "'" + msg.test.actual + "'") + ".";

        log("level:" + msg.test.state);

        if (msg.test.state === 'ok')
          info(m);
        else
          warn(m);
        break;

      case 'finish':
        resolve("Testsuite terminated.");
        break;

      default:
        var errmsg = "Unknown message type received: " + msg['type'];
        logfile.writeLine(errmsg);
        logfile.close();
        throw new Error(errmsg);
    }
  };

  var onInit = _page.onInitialized;
  _page.onInitialized = function () {
    _page.injectJs('lib/browser.js');
    for (var file in injectFiles)
      _page.injectJs(file);
    console.log("onInitialized");
    onInit();
  };

  // Required. Otherwise loading local resources won't be allowed (Cross-Origin policy)
  _page.settings.webSecurityEnabled = false;

  _page.open(url, function (status) {
    if (status !== 'success')
      return reject(new Error("Failed to load page " + this.url));

    console.log("page opened");
    _page.evaluate(function () {
      window.runner = new TestSuiteRunner();
    });
  });
}

/**
 * Actually run the testsuite.
 * @param {string} workingDir - the working directory to run the testsuite in
 * @param {string} library - the Yadda.Library instance to use for Gherkin
 * @param {Array} featureFiles - the list of feature files to interpret
 **/
function run(library, featureFiles) {
  for (var f in featureFiles) {
    var file = featureFiles[f];
    // TODO Feature. Restrict tested features by command line parameter

    featureFile(file, function(feature) {
      var yadda = new Yadda.Yadda(library);

      invokeEventHandlers('beforeScenario', this, [scenario]);
      scenarios(feature.scenarios, function(scenario) {

        steps(scenario.steps, function(step, done) {
          invokeEventHandlers('beforeStep', this, [step]);
          yadda.yadda(step, done);
          invokeEventHandlers('afterStep', this, [step]);
        });
      });

      invokeEventHandlers('afterScenario', this, [scenario]);
    });
  }
}

// initialize Yadda's StepLevelPlugin we will use to interpret Gherkin files
Yadda.plugins.mocha.StepLevelPlugin.init();

module.exports = {
  'inject': inject,
  'openUrl': openUrl,
  'run': run,
  'register': register,
  'send': send
};
