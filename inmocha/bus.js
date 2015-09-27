/**
 * @file In-mocha message bus
 * @module mochabus
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

"use strict";

// dependencies
var queueModule = require(path.resolve(__dirname, '../lib/queue.js'));
var Queue = queueModule.Queue;
var eventsModule = require(path.resolve(__dirname, '../lib/events.js'));
var EventHandler = eventsModule.EventHandler;


/**
 * A global registry to hold all receivers
 */
var receivers = {};

/**
 * A queue of objects to send eventually.
 */
var objects = new Queue();

/**
 * page.onCallback callback
 * @param {*} data - JSON-marshable data received from to the browser
 * @return {*} JSON-marshable data meant to be sent to the browser
 */
var receiveObject = function (data) {
  var component = data[0];
  var obj = data[1];

  // polling messages are just to return messages
  if (component === 'polling')
    return objects.dequeue();

  // otherwise send message to appropriate receiver
  if (typeof receivers[component] !== 'undefined') {
    receivers[component].dispatchEvent('messageReceived', obj);
    return objects.dequeue();
  } else {
    console.warn("Message received, but not receiver '" + component
      + "' listens: " + JSON.stringify(obj));
    return undefined;
  }
};

/**
 * Send object to browser. `obj` must be JSON-marshable.
 * @param {string} component - the component sending this message
 * @param {*} obj - an object to send to browser
 */
var sendObject = function (component, obj) {
  if (component === undefined)
    throw new Error("Cannot send message from unknown component");
  objects.enqueue([component, obj]);
};

/**
 * Add a receiver to the global registry of receivers and call `clbk`
 * whenever an object for `component` is received.
 * @param {string} component - the component to listen for
 * @param {function} clbk - the callback invoked when messages are received
 * @return {EventHandler} the receiver handling messages received for this component
 */
var registerReceiver = function (component, clbk) {
  if (receivers[component] === 'undefined')
    receivers[component] = new EventHandler(component, ['messageReceived']);

  receivers[component].addEventListener('messageReceived', clbk, undefined, Infinity);
  return receivers[component];
};

// module export
exports = module.exports = {
  'onCallback': receiveObject,
  'registerReceiver': registerReceiver
};
