var commands = require('./commands');

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
      data = isBuffer(buffer) ? this.parse(buffer) : buffer;
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
  throw new Error('Data encoder for command ' + this + ' is not implemented');
};

/**
 * Return compiled command message
 *
 * @param  {Object|Buffer} data
 * @return {Buffer}
 */
function encode() {
  var data = this.data;
  var sender = this.sender;
  var target = this.target;
  var header = new Buffer(9);
  var content = isBuffer(data) ? data : this.encode(data);

  header.writeUInt8(content.length + 11, 0);
  header.writeUInt8(sender.subnet, 1);
  header.writeUInt8(sender.id, 2);
  header.writeUInt16BE(sender.type, 3);
  header.writeUInt16BE(this.code, 5);
  header.writeUInt8(target.subnet, 7);
  header.writeUInt8(target.id, 8);

  return Buffer.concat([header, content]);
}

/**
 * Return human readable command code
 *
 * @return {String}
 */
Command.prototype.toString = function() {
  return '0x' + ('0000' + this.code.toString(16)).slice(-4).toUpperCase();
};
