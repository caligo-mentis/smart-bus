var util = require('util');
var Channel = require('./channel');
var EventEmitter = require('events');

module.exports = Device;

function Device(bus, options) {
  if (!options) options = {};

  this.id = parseInt(options.id);
  this.subnet = parseInt(options.subnet);

  this.channels = {};

  this.bus = bus;
  this.type = null;

  EventEmitter.call(this);

  Channel.listen(this);
}

util.inherits(Device, EventEmitter);

Object.defineProperty(Device.prototype, 'address', { get: address });

/**
 * Return channel object by its number
 *
 * @param  {Number} number
 * @return {Channel}
 */
Device.prototype.channel = function(number) {
  var channels = this.channels;

  if (!channels[number])
    channels[number] = new Channel(this, { number: number });

  return channels[number];
};

/**
 * Send command from device
 *
 * @param  {Number} options.command       Command code
 * @param  {Object|Buffer} [options.data]
 * @param  {Function} callback
 */
Device.prototype.send = function(options, callback) {
  if (typeof options === 'function') callback = options, options = {};

  this.bus.send({
    target: this,
    command: options.command,
    data: options.data
  }, callback);
};

/**
 * Return device address as string representation
 *
 * @return {String}
 */
Device.prototype.toString = function() {
  return this.address;
};

/**
 * Device address property getter
 *
 * Returns string representation of device address
 *
 * @return {String} - device address
 */
function address() {
  return (this.subnet || 'X') + '.' + (this.id || 'X');
}
