/**
 * @file Initialize browser to be used for testing
 * @module init
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

"use strict";

/**
 * @function
 */
function initialize() {
  if (typeof window.testsuiteBus === 'undefined')
    throw new Error("Testsuite Message Bus unavailable. Problem with browser setup detected!");
  else {
    window.testsuiteRunner = new TestSuiteRunner();
    window.testsuiteBus.addEventListener('messageReceived', window.testsuiteRunner.dispatch);
  }

  window.testsuiteBus.addEventListener('messageReceived', function (obj) {
    if (obj === 'ok')
      window.testsuiteBus.send('finished');
  })
  window.testsuiteBus.send('started');
}


/**
 * Called when DOM is ready.
 */
contentLoaded(window, initialize);