"use strict";

/**
 * This file will be run inside the browser once it has started up.
 * It contains
 * - the implementation of a testsuite runner and
 * - 
 **/
function TestSuiteRunner() {
  var start = function () {};

  var dispatch = function (msg) {
    console.log("Receiving message " + msg);
  };

  return {
    start: start,
    dispatch: dispatch,
    handler: {}
  };
}

