var util = require('util');
var Channel = require('./channel');
var EventEmitter = require('events');

module.exports = Device;

function Device(bus, subnet, id) {
  this.id = id;
  this.subnet = subnet;

  this.channels = {};

  this.bus = bus;
  this.type = null;

  EventEmitter.call(this);
}

util.inherits(Device, EventEmitter);

/**
 * Return channel object by its number
 *
 * @param  {Number} number
 * @return {Channel}
 */
Device.prototype.channel = function(number) {
  var channels = this.channels;

  if (!channels[number]) channels[number] = new Channel(this, number);

  return channels[number];
};

/**
 * Send command from device
 *
 * @param  {Number} code
 * @param  {Object} data
 * @param  {Function} callback
 */
Device.prototype.send = function(code, data, callback) {
  this.bus.send(this, code, data, callback);
};
