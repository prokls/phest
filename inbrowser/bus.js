/**
 * @file In-browser message bus
 * @module browserbus
 * @author meisterluk <admin@lukas-prokop.at>
 * @copyright meisterluk, 2015
 * @license BSD 3-clause
 **/

"use strict";

/**
 * A global registry to hold all receivers
 */
var receivers = {};

/**
 * Send data to yadda. `obj` must be JSON-marshable.
 * @param {string} component - the component sending this message
 * @param {*} obj - an object to send to yadda
 * @throws {Error} onCallback is unavailable, sending impossible
 */
var sendObject = function (component, obj) {
  if (component === undefined)
    throw new Error("Cannot send message from unknown component");
  if (typeof window.callPhantom === 'function') {
    var value = window.callPhantom([component, obj]);
    if (value !== null && typeof value !== 'undefined') {
      var response = JSON.parse(value);
      receiveObject(response[0], response[1]);
    }
  } else
    throw new Error("PhantomJS onCallback not available");
};

/**
 * Receive some data sent from yadda.
 * @param {string} component - the component receiving this message
 * @param {*} obj - the object sent
 */
var receiveObject = function (component, obj) {
  if (typeof receivers[component] !== 'undefined')
    receivers[component].dispatchEvent('messageReceived', obj);
  else
    console.warn("Message received, but not receiver '" + component
      + "' listens: " + JSON.stringify(obj));
};

/**
 * Add a receiver to the global registry of receivers
 * and make it listen to messages received.
 * @param {string} component - the component to listen for
 * @return {EventHandler} the receiver accepting messages when sent
 */
var registerReceiver = function (component) {
  var bus = new EventHandler(component + '-bus', ['messageReceived']);
  bus['send'] = function (msg) { sendObject(component, msg); };
  receivers[component] = bus;
  return bus;
};

/**
 * Setup up polling for data and initial receivers.
 */
var init = function () {
  setInterval(function () { sendObject('polling', undefined); }, 300);

  window.interactionBus = registerReceiver('interaction');
  window.testsuiteBus = registerReceiver('testsuite');
  window.reportBus = registerReceiver('report');

  window.receiveObject = receiveObject;
  console.error("Jep, receiving");
};


// initialize
init();