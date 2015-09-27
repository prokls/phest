"use strict";

var assert = require('assert');
var Set = require('../lib/set.js');

var testSet = function (elems) {
  for (var start = 0; start < elems.length; start++) {
    for (var end = start; end < elems.length; end++) {
      var selected = elems.slice(start, end);
      var s = new Set(selected);

      for (var i = 0; i < elems.length; i++) {
        if (start <= i && i < end) {
          assert(s.has(elems[i]), selected + " should contain " + elems[i]);
        } else {
          assert(!s.has(elems[i]), selected + " must not contain " + elems[i]);
        }
      }
    }
  }
};






describe('Set', function() {
  describe('#numbers', function() {
    it('should work', function() {
      //[1,2,3].indexOf(5).should.equal(-1);
      testSet([1, 90, 7, 9, 15, 49, 546, 92, 356]);
    });
  });

  describe('#strings', function () {
    it('should work', function() {
      testSet([
        'browserStarted',
        'beforeScenario',
        'afterScenario',
        'onConsoleMessage',
        'testsuiteFinished',
        'browserFinished',
        'testsuiteStarted'
      ]);
    });
  })
});
