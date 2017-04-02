var util = require('util');
var commands = require('./commands');

var format = util.format;
var inspect = util.inspect;

var isBuffer = Buffer.isBuffer;

module.exports = Command;

function Command(code, options) {
  options = options || {};

  var data;
  var command = commands[code];

  for (var key in command) this[key] = command[key];

  Object.defineProperty(this, 'message', { get: encode });

  Object.defineProperty(this, 'data', {
    get: function() { return data; },

    set: function(buffer) {
      data = isBuffer(buffer) ?
        (buffer.length ? this.parse(buffer) : undefined) : buffer;
    }
  });

  this.code = code;
  this.data = options.data;
  this.sender = options.sender;
  this.target = options.target;
}

/**
 * Default data parser
 *
 * @param {Buffer} data
 */
Command.prototype.parse = function(data) {
  return data;
};

/**
 * Default data encoder
 *
 * @param  {Object} data
 * @return {Buffer}
 */
Command.prototype.encode = function() {
  throw new Error('Data encoder for command ' +
    hex(this.code) + ' is not implemented');
};

/**
 * Return human readable command code
 *
 * @return {String}
 */
Command.prototype.toString = function() {
  var data = this.data;
  var code = hex(this.code);
  var target = this.target;
  var sender = this.sender;

  var command = format('%s -> %s %s', sender || 'X.X', target || 'X.X', code);

  if (data) command += ': ' + (isBuffer(data) ?
    data.toString('hex').toUpperCase() : inspect(data));

  return command;
};

/**
 * Return compiled command message
 *
 * @param  {Object|Buffer} data
 * @return {Buffer}
 */
function encode() {
  var data = this.data;
  var length = 11;
  var sender = this.sender;
  var target = this.target;
  var header = new Buffer(9);
  var content = !data || isBuffer(data) ? data : this.encode(data);

  if (content) length += content.length;

  header.writeUInt8(length, 0);
  header.writeUInt8(sender.subnet, 1);
  header.writeUInt8(sender.id, 2);
  header.writeUInt16BE(sender.type, 3);
  header.writeUInt16BE(this.code, 5);
  header.writeUInt8(target.subnet, 7);
  header.writeUInt8(target.id, 8);

  return content ? Buffer.concat([header, content]) : header;
}

/**
 * Return integer value as hex string
 *
 * @param  {Number} value
 * @return {String}
 */
function hex(value) {
  return '0x' + ('0000' + value.toString(16)).slice(-4).toUpperCase();
}
