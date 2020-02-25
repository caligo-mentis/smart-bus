var util = require('util');
var commands = require('./commands');

var format = util.format;
var inspect = util.inspect;

var isBuffer = Buffer.isBuffer;

module.exports = Command;

function Command(code, options) {
  options = options || {};

  var command = commands[code];

  for (var key in command) this[key] = command[key];

  Object.defineProperty(this, 'message', { get: encode });

  Object.defineProperty(this, 'data', {
    get: function() {
      var payload = this.payload;

      if (payload && payload.length)
        return this.parse(payload);
    },

    set: function(data) {
      this.payload = isBuffer(data) ? data : this.encode(data);
    }
  });

  this.code = code;
  this.sender = options.sender;
  this.target = options.target;

  var data = options.data;
  var payload = options.payload;

  if (data) this.data = data;
  if (payload) this.payload = payload;
}

/**
 * Default payload parser
 *
 * @param {Buffer} payload
 */
Command.prototype.parse = function(/* payload */) {
  // no-op by default
};

/**
 * Default data encoder
 *
 * @param  {Object} data
 * @return {Buffer}
 */
Command.prototype.encode = function(/* data */) {
  throw new Error('Data encoder for command ' +
    hex(this.code) + ' is not implemented');
};

/**
 * Return human readable command code
 *
 * @return {String}
 */
Command.prototype.toString = function() {
  var code = hex(this.code);
  var target = this.target ? this.target.toString() : 'X.X';
  var sender = this.sender ? this.sender.toString() : 'X.X';
  var payload = this.payload;

  var command = format('%s -> %s %s', sender, target, code);

  if (payload && payload.length) {
    command += ': ' + payload.toString('hex').toUpperCase();

    try {
      var data = this.data;

      if (data) command += ' ' + inspect(this.data);
    } catch (err) {
      command += ' PARSE ERROR: ' + err.message;
    }
  }

  return command;
};

/**
 * Return compiled command message
 *
 * @param  {Object|Buffer} data
 * @return {Buffer}
 */
function encode() {
  var length = 11;
  var sender = this.sender;
  var target = this.target;
  var header = new Buffer(9);
  var payload = this.payload;

  if (payload) length += payload.length;

  header.writeUInt8(length, 0);
  header.writeUInt8(sender.subnet, 1);
  header.writeUInt8(sender.id, 2);
  header.writeUInt16BE(sender.type, 3);
  header.writeUInt16BE(this.code, 5);
  header.writeUInt8(target.subnet, 7);
  header.writeUInt8(target.id, 8);

  return payload ? Buffer.concat([header, payload]) : header;
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
