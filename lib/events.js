/**
 * @file Library for everything concerning events
 * @module events
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

"use strict";

/**
 * An EventHandler allows to handle events in an Observer pattern.
 * @param {string} component - the component used those events (for improved logging)
 * @param {Array} valid_events_list - a list of events that can be subscribed to
 * @constructor
 **/
var EventHandler = function (component, valid_events_list) {
  // list of events that can be subscribed to
  var valid_events = [];
  // event name to callbacks association
  var events = {};

  /**
   * Does `array` contain `value`? Start search at offset `index`.
   * @example
   * // returns 2
   * inArray('c', ['a', 'b', 'c', 'd'])
   * @example
   * // returns -1
   * inArray('e', ['a', 'b', 'c', 'd'])
   * @example
   * // returns -1
   * inArray('1', [0, 1, 2, 3, 4])
   * @param {any} value - an element to search for with the triple equality operator
   * @param {Array} array - an array to search in
   * @param {number} index - an index to start search at
   * @returns {number} the index of `value` in `array` or -1 if not found
   */
  var inArray = function (value, array, index) {
    if (array) {
      var len = array.length;
      index = index ? index < 0 ? Math.max(0, len + index) : index : 0;

      for (; index < len; index++) {
        if (index in array && array[index] === value)
          return index;
      }
    }

    return -1;
  };

  /**
   * Subscribe to an event `evt` with `callback`. Invoke `callback` with context `ctx`
   * at most `max_calls` times.
   * @param {string} evt - event name
   * @param {function} callback - a callback function; the arguments vary depending
   *    on the dispatchEvent call; must be documented by the application separately
   * @param {Map} ctx - the context to invoke `callback` with
   * @param {number} max_calls - the maximum number of times to call `callback`
   * @throws {Error} Event is unknown
   */
  var addEventListener = function (evt, callback, ctx, max_calls) {
    if (inArray(evt, valid_events) !== -1) {
      max_calls = (parseInt(max_calls) >= 1) ? parseInt(max_calls) : Infinity;
      if (typeof events[evt] === 'undefined')
        events[evt] = [];
      events[evt].push([callback, ctx, max_calls]);
    } else {
      throw new Error("Unknown event " + evt);
    }
  };

  /**
   * Call all callback subscribed to event `evt`.
   * @param {string} evt - event name
   * @returns {boolean} was some callback actually invoked?
   * @throws {Error} Event is unknown
   */
  var dispatchEvent = function (evt) {
    var args = Array.prototype.slice.call(arguments, 1);
    /*console.debug(
      "" + component + "." + evt + " triggered, " +
      args.length + " arguments" +
      (args ? ",      " + Array.prototype.join.call(args, " & ") : "")
    );*/
    if (inArray(evt, valid_events) === -1)
      throw new Error("Unknown event " + evt);
    if (events[evt] === undefined)
      return false;
    for (var i = 0; i < events[evt].length; i++) {
      events[evt][i][2]--;
      events[evt][i][0].apply(events[evt][i][1], args);
      if (events[evt][i][2] === 0)
        events[evt].splice(i, 1);
    }
    return true;
  };

  /**
   * Overwrite the set of events defined for this EventHandler.
   * @param {Array} list_of_valid_events - a list of events
   */
  var setValidEvents = function (list_of_valid_events) {
    valid_events = list_of_valid_events;
  };

  /**
   * Retrieve the set of events, that can be subscribed to
   * @returns {Array} a list of events handled by this EventHandler
   */
  var getValidEvents = function () {
    return valid_events;
  };

  /**
   * Extend the set of events defined for this EventHandler.
   * @param {string} valid_event - the event name to add
   */
  var addValidEvent = function (valid_event) {
    valid_events.push(valid_event);
  };

  /**
   * Constructor to initialize EventHandler.
   * @param {Array} evs - list of events you can subscribe to
   */
  var constructor = function (evs) {
    if (typeof evs === "object")
      setValidEvents(evs);
  };

  constructor(valid_events_list);
  return {
    addEventListener : addEventListener,
    dispatchEvent : dispatchEvent,
    setValidEvents : setValidEvents,
    getValidEvents : getValidEvents,
    addValidEvent : addValidEvent
  };
};


// module export
if (typeof module !== 'undefined') {
  exports = module.exports = { 'EventHandler': EventHandler };
} else {
  window.EventHandler = EventHandler;
}
