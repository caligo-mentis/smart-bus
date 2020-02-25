var util = require('util');
var EventEmitter = require('events');

module.exports = Device;

function Device(bus, options) {
  if (!options) options = {};

  this.id = parseInt(options.id);
  this.subnet = parseInt(options.subnet);

  this.bus = bus;
  this.type = options.type;

  EventEmitter.call(this);
}

util.inherits(Device, EventEmitter);

Object.defineProperty(Device.prototype, 'address', { get: address });

/**
 * Send command from device
 *
 * @param  {String|Device} options.target        Target device address
                                                 or instance
 * @param  {Number}        options.command       Command code
 * @param  {Buffer}       [options.data]
 * @param  {Buffer}       [options.payload]
 * @param  {Function} callback
 */
Device.prototype.send = function(options, callback) {
  if (typeof options === 'function') callback = options, options = {};

  this.bus.send({
    sender: this,
    target: options.target,

    command: options.command,

    data: options.data,
    payload: options.payload
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
