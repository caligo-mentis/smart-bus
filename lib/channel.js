var util = require('util');
var EventEmitter = require('events');

module.exports = Channel;

function Channel(device, number) {
  this.level = undefined;
  this.device = device;
  this.number = number;

  EventEmitter.call(this);
}

util.inherits(Channel, EventEmitter);

/**
 * Listen for channel events on device
 * and update device channels statuses
 *
 * @param  {Device} device
 */
Channel.listen = function(device) {
  device.on(0x0032, function(data) {
    if (!data.success) return;

    var level = data.level;
    var channel = device.channel(data.channel);

    channel.level = level;

    channel.emit('status', data);
  });
};

/**
 * Set channel level
 *
 * @param  {Number}   value
 * @param  {Number}   [options.time=0]  Running time
 * @param  {Function} callback
 */
Channel.prototype.control = function(value, options, callback) {
  if (typeof options === 'function') callback = options, options = null;
  if (!options) options = {};

  this.device.send(0x0031, {
    time: options.time || 0,
    level: value,
    channel: this.number
  }, callback);
};
