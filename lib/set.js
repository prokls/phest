/**
 * @file Library for unordered data structures
 * @module set
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

"use strict";

/**
 * An incomplete polyfill for ECMAScript's Set data structure.
 * Can be replaced by something more general like
 * {@link https://github.com/jfriend00/ES6-Set ES6-Set}
 * @constructor
 **/
function Set(initial) {
  var _data = [];

  /**
   * A simple flooring operation for integers.
   * Returns the corresponding discrete value for a continuous number.
   * @param {number} v - the value to round down
   * @returns number - a value between val and val-1 satisfying (val % 1 == 0)
   **/
  var int = function (v) {
    return parseInt(v);
  };

  /**
   * Insertion by lexographical sorting. Returns the index where
   * value shall be inserted. The value exists already if the
   * returned index yields the parameter `val`.
   * @param {*} val - the value to look for
   * @returns number - the index where `val` should be inserted
   *                   keeping sorting invariant
   **/
  var search = function (val) {
    var start = 0;
    var end = _data.length - 1;

    if (_data.length === 0)
      return 0;
    else if (_data[start] >= val)
      return 0;
    else if (_data[end] < val)
      return _data.length;
    else if (val === null || val === undefined)
      throw new Error("Invalid type: cannot store value " + typeof val);

    do {
      var index = int(start + ((end - start) / 2));
      if (_data[index] === val) {
        return index;
      } else if (_data[index] < val) {
        start = index + 1;
      } else if (_data[index] > val) {
        end = index - 1;
      }
    } while (end >= start);

    return start;
  };

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
  function SetIterator(keys, data, format) {
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
   * Add another value to the data structure.
   * @param {*} val - the value to add
   * @returns {boolean} didn't this value already exist?
   **/
  var add = function (val) {
    var index = search(val);
    if (_data[index] === val)
      return false;
    else
      _data.splice(index, 0, val);
    return true;
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
   * @param {*} val - any value to parse
   * @returns {boolean} did this `val` even exist?
   **/
  var del = function (val) {
    var index = search(val);
    if (_data[index] === val) {
      delete _data[index];
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
    var index = search(val);
    return (_data[index] === val);
  };

  /**
   * SetIterator for all values in the data structure
   * @returns {SetIterator} iterator for all values
   */
  var values = function () {
    return new SetIterator(indices(_data), _data, "values");
  };

  /**
   * SetIterator for all keys in the data structure
   * @returns {SetIterator} iterator for all keys
   */
  var keys = function () {
    return new SetIterator(indices(_data), _data, "keys");
  };

  /**
   * Constructor for this data structure.
   * @param {Array} init - initial array values to store
   */
  var constructor = function (init) {
    for (var i = 0; init != undefined && i < init.length; i++)
      add(init[i]);
  };

  constructor(initial);
  return {
    "add" : add,
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
  exports = module.exports = { 'Set': Set };
} else {
  window.Set = Set;
}
