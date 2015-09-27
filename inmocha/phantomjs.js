/**
 * @file Executable to run synchronous phantomjs
 *    This executable is meant to communicate with the parent process via
 *    https://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle
 *    So far {'action': 'open', 'url': 'http://...'} must be sent before
 *    {'action': 'run', 'testsuite': {}}.
 * @module phantomjs
 * @requires jinder/path
 * @requires peerigon/phridge
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

"use strict";

// dependencies
var path = require('path');
var phridge = require('phridge');

var eventsModule = require(path.resolve(__dirname, '../lib/events.js'));
var EventHandler = eventsModule.EventHandler;

/**
 * A PhantomJSRunner starts a phantomjs synchronously
 * @param {EventHandler} events - an event handler listening for events
 *               ['browserStarted', 'browserFinished', 'browserFailed']
 * @constructor
 **/
var PhantomJSRunner = function (events) {
  var _events = events || new EventHandler("phantomjs-runner",
      ['browserStarted', 'browserFinished', 'browserFailed']);

  /**
   * Open `url` in browser, inject Javascript `injectFiles` files
   * and call `resolve` (success) or `reject` (error) once the blocking
   * execution of phridge has terminated.
   *
   * Be aware this is a custom process this function is executed in.
   * Parameters `url` and `injectFiles` are JSON.stringified and sent
   * to this process via stdin. Either `resolve` or `reject` must be
   * called; otherwise timeout will be triggered.
   *
   * @param {string} url - the URL to open
   * @param {Array) injectFiles - filepaths to Javascript files to inject
   * @param {object} testsuite - the testsuite object
   * @param {function} resolve - callback if execution was successful.
   * @param {function} reject - callback if execution failed.
   */
  var pageStart = function (url, injectFiles, testsuite, resolve, reject) {
    var page = this;

    page.onCallback = function (data) {
      switch (data[0]) {
        case 'polling':
          console.log('{debug} polling received');
          return JSON.stringify(['polling', 404]);

        case 'testsuite':
          var msg = data[1];

          if (msg.state === 'started') {
            console.log("[browser] testsuite started");
            return JSON.stringify(['testsuite', 'ok']);
          } else if (msg.state === 'nextTestcase') {
            var tc = msg.tc ? " " + msg.tc : "";
            console.log("[browser] next testcase" + tc + " in testsuite starting");
            return JSON.stringify(['testsuite', 'ok']);
          } else if (msg.state === 'finished') {
            console.log("[browser] testsuite finished");
            if (msg.success)
              resolve('testsuite finished');
            else
              reject('testsuite finished with error');
          } else {
            console.error("{TODO} Unknown testsuite message: " + data[1]);
          }
          break;

        case 'report':
          console.log("{TODO} Report received: " + JSON.stringify(data[1]));
          break;
      }
    };

    page.onAlert = function (msg) {
      console.warn("[browser] alert popped up: " + JSON.stringify(msg));
    };
    page.onClosing = function (page) {
      console.info("[browser] WebPage is about to get closed" + page);
    };
    page.onConfirm = function (msg) {
      console.error("[browser] confirm: " + msg);
      return true; // TODO
    };
    page.onConsoleMessage = function (msg, lineNum, sourceId) {
      if (lineNum)
        console.log("[browser] console.log at line " + lineNum + ": " + JSON.stringify(msg));
      else if (lineNum && sourceId)
        console.log("[browser] console.log in " + sourceId + " at line " + lineNum + ": " + JSON.stringify(msg));
      else
        console.log("[browser] console.log: " + JSON.stringify(msg));
    };
    page.onError = function (msg, trace) {
      console.error("[browser] An error was thrown: " + msg);
      console.error(("" + trace).replace(/\n/g, "\n  "));
    };
    page.onFilePicker = function (oldFile) {
      console.error("[browser] file picker selected");
      console.error(oldFile);
      return '/etc/passwd'; // TODO
    };
    page.onInitialized = function () {
      console.info("[browser] browser is initialized");
    };
    page.onLoadFinished = function (status) {
      console.info("[browser] browser loading finished with " + status);
    };
    page.onLoadStarted = function () {
      console.info("[browser] URL loading started");
    };
    page.onNavigationRequested = function (url, type, willNavigate, main) {
      console.info("[browser] navigation element selected");
      console.info("            url          = " + url);
      console.info("            type         = " + type);
      console.info("            willNavigate = " + willNavigate);
      console.info("            main         = " + main);
    };
    page.onPageCreated = function (newPage) {
      console.info("[browser] page creation finished: " + newPage);
    };
    page.onPrompt = function (msg, defaultVal) {
      console.info("[browser] a prompt was invoked: " + msg);
      return defaultVal; // TODO
    };
    page.onResourceError = function (resourceError) {
      console.error("[browser] a resource error occured:" + resourceError);
    };
    page.onResourceReceived = function (response) {
      console.info("[browser] a resource was received: url=" + response.url + " status=" + response.status);
    };
    page.onResourceRequested = function (requestData, networkRequest) {
      console.info("[browser] a resource was requested: " + requestData.url);
    };
    page.onResourceTimeout = function (request) {
      console.warn("[browser] a resource request timed out: " + request);
    };
    page.onUrlChanged = function (targetUrl) {
      console.info("[browser] URL has changed: " + targetUrl);
    };

    for (var f = 0; f < injectFiles.length; f++)
      page.injectJs(injectFiles[f]);

    page.open(url, function (status) {
      if (status !== "success")
        return reject('[phantomjs] opening the webpage failed');

      page.evaluate(function (ts) {
        window.testsuiteBus.send(ts)
      }, testsuite);
    });
  };

  /**
   * Start the browser and pass over the given parameters.
   *
   * This will block, open a WebPage object and return once the `resolve`
   * or `reject` functions will be called by the handler.
   *
   * @param {string} url - the URL to open
   * @param {Array) injectFiles - filepaths to Javascript files to inject
   * @param {object} testsuite - the testsuite object
   * @param {object} phantomjsOptions - options for phantomjs
   * @param {function} resolve - callback if execution was successful.
   * @param {function} reject - callback if execution failed.
   */
  var browserStart = function (url, injectFiles, testsuite, phantomjsOptions) {
    if (url === undefined)
      throw new Error("URL, to start phantomJS with, must not be empty");

    phridge
      .spawn(phantomjsOptions)
      .then(function (phantom) {
        return phantom.createPage();
      })
      .then(function (page) {
        _events.dispatchEvent('browserStarted', url);
        return page.run(url, injectFiles || [], testsuite || {}, pageStart);
      })
      .finally(phridge.disposeAll)
      .done(
        function (msg) { _events.dispatchEvent('browserFinished', msg); },
        function (err) { _events.dispatchEvent('browserFailed', err); }
      );
  };

  return {
    run: function (url, files, testsuite, phOptions) {
      browserStart(url, files, testsuite, phOptions);
    }
  };
};

/**
 * Parse the given command line args to a map of phantomJS settings.
 * Compare with http://phantomjs.org/api/webpage/property/settings.html
 *
 * @param {Map} args - the arguments to parse
 * @return {Map} a map of phantomJS settings
 */
var parsePhantomJSArguments = function (args) {
  var conv = function (val) {
    if (val === 'true')
      return true;
    else if (val === 'false')
      return false;
    else if (val.match(/^\d+$/))
      return parseInt(val);
    else
      return val;
  };

  var params = [];
  var expect = false;

  for (var opt in args)
    if (args[opt].substr(0, 2) === '--') {
      if (expect)
        params.push(true);
      params.push(args[opt].substr(2));
      expect = true;
    } else {
      if (expect) {
        params.push(conv(args[opt]));
        expect = false;
      } else
        throw new Error("Unassigned command line parameter: '" + args[opt] + "'");
    }
  if (expect)
    params.push(true);

  var phOptions = {};
  for (var arg = 0; arg < params.length; arg = arg + 2) {
    phOptions[params[arg]] = params[arg + 1];
  }

  return phOptions;
};



// global objects
var e = new EventHandler('general', ['browserStarted', 'browserFinished', 'browserFailed']);
e.addEventListener('browserStarted', function (url) {
  console.log("[phantomjs] Browser is about to start with url=" + url);
  process.send({ state: 'browserStarted' });
});
e.addEventListener('browserFinished', function (msg) {
  console.log("[phantomjs] browser has finished: " + msg);
  process.send({ state: 'browserFinished', message: msg });
});
e.addEventListener('browserFailed', function (err) {
  console.log("[phantomjs] browser has emitted a failure: ", err.stack);
  process.send({ state: 'browserFailed', error: err });
});

var runner = new PhantomJSRunner(e);
var url = '';


// listen for parent process messages
process.on('message', function (m) {
  switch (m.action) {
    case 'open':
      // order of injected files is important!
      var injectFiles = [
        // the whole lib(rary)
        path.resolve(__dirname, '../lib/events.js'),
        path.resolve(__dirname, '../lib/queue.js'),
        path.resolve(__dirname, '../lib/set.js'),
        // all js-for-browser files
        path.resolve(__dirname, '../inbrowser/contentloaded.js'),
        path.resolve(__dirname, '../inbrowser/browser.js'),
        path.resolve(__dirname, '../inbrowser/bus.js'),
        path.resolve(__dirname, '../inbrowser/init.js')
      ];
      for (var i = 0; m.injectFiles !== undefined && i < m.injectFiles.length; i++)
        injectFiles.push(m.injectFiles[i]);
      url = m.url;
      break;

    case 'run':
      var args = parsePhantomJSArguments(process.argv.slice(2));
      runner.run(url, injectFiles, m.testsuite, args);
      break;
  }
});