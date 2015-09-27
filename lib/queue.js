/**
 * @file Library for FIFO data structures
 * @module queue
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

"use strict";

/**
 * A queue implementation
 * @constructor
 **/
function Queue() {
  var _data = [];

  /**
   * Retrieve all indices (= keys) from the data.
   * @returns {array} An array of keys.
   **/
  var indices = function () {
    var keys = [];
    for (var key in _data)
      keys.push(key);
    return keys;
  };

  /**
   * A set iterator implementation
   * @param {Array} keys - the Array of strings to iterate as keys
   * @param {Map} data - the key to value association to iterate
   * @param {string} format - either "keys" or "values" specifying
   *                          which values will be iterator
   **/
  function QueueIterator(keys, data, format) {
    var index = 0;
    var length = keys.length;

    var next = function() {
      var result = {};

      while (true) {
        if (index < length) {
          result["done"] = false;
          var key = keys[index++];
          var val = data[key];

          if (val === undefined && !hasOwnProp(data, key))
            continue;
          else if (format === "keys")
            result["value"] = val;
          else if (format === "values")
            result["value"] = [val, val];

        } else {
          keys = null;
          data = null;
          result["done"] = true;
        }
        return result;
      }
    };

    return { next: next };
  };

  /**
   * Enqueue another value to the data structure.
   * @param {*} val - the value to enqueue
   * @returns {boolean} was it successful?
   **/
  var enqueue = function (val) {
    _data.unshift(val);
    return true;
  };

  /**
   * Dequeue value from the data structure.
   * @returns {*} dequeued value
   * @throws {Error} if no value is left in queue
   **/
  var dequeue = function () {
    if (_data.length === 0)
      throw new Error("Queue underflow");
    else
      return _data.pop();
  };

  /**
   * Remove all values from the datastructure.
   * @returns {boolean} was it successful?
   **/
  var clear = function () {
    _data = [];
    return true;
  };

  /**
   * Delete some value from the datastructure.
   * If value exists multiple times, delete object added first.
   * @param {*} val - any value to parse
   * @returns {boolean} did this `val` even exist?
   **/
  var del = function (val) {
    for (var v = _data.length - 1; v >= 0; v--)
      if (_data[v] === val) {
        _data.splice(v, 1);
        return true;
      }
    return false;
  };

  /**
   * Iterate with a callback.
   * @param {function} func - a callback(value) called for every value
   */
  var forEach = function (func) {
    if (typeof func !== "function")
      return;
    
    var context = arguments[1];
    var iterator = keys();
    var next;

    while ((next = iterator.next()) && !next.done) {
      var item = next.value;
      func.call(context, item, item, this);
    }
  };

  /**
   * Is `val` stored in the data structure?
   * @param {*} val - the value to search for
   * @returns {boolean} is this value contained?
   */
  var has = function (val) {
    for (var i = 0; i < _data.length; i++)
      if (_data[index] === val)
        return true;
    return false;
  };

  /**
   * QueueIterator for all values in the data structure
   * @returns {QueueIterator} iterator for all values
   */
  var values = function () {
    return new QueueIterator(indices(_data), _data, "values");
  };

  /**
   * QueueIterator for all keys in the data structure
   * @returns {QueueIterator} iterator for all keys
   */
  var keys = function () {
    return new QueueIterator(indices(_data), _data, "keys");
  };

  return {
    "enqueue" : enqueue,
    "dequeue" : dequeue,
    "push" : add,
    "clear" : clear,
    "delete" : del,
    "forEach" : forEach,
    "has" : has,
    "values" : values,
    "entries" : values,
    "keys" : keys
  };
}


// module export
if (typeof module !== 'undefined') {
  exports = module.exports = { 'Queue': Queue };
} else {
  window.Queue = Queue;
}
