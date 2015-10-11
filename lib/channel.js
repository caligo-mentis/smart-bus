module.exports = Channel;

function Channel(device, number) {
  this.device = device;
  this.number = number;
}

/**
 * Set channel level
 *
 * @param  {Number}   value
 * @param  {Number}   options.time  Running time
 * @param  {Function} callback
 */
Channel.prototype.level = function(value, options, callback) {
  if (typeof options === 'function') callback = options, options = null;

  options = options || {};

  var device = this.device;
  var data = {
    time: options.time || 0,
    level: value,
    channel: this.number
  };

  device.once(0x0032, done);

  device.send(0x0031, data, function(err) {
    if (!err) return;

    device.removeListener(0x0032, done);
    callback(err);
  });

  function done(data) {
    callback(null, data);
  }
};
