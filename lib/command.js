var commands = require('./commands');

var isBuffer = Buffer.isBuffer;

module.exports = Command;

function Command(code, options) {
  options = options || {};

  this.code = code;
  this.sender = options.sender;
  this.target = options.target;

  var command = commands[code];

  if (command) {
    this.parser = command.parser;
    this.encoder = command.encoder;
  }
}

/**
 * Default data parser
 *
 * @param {Buffer} data
 */
Command.prototype.parser = function(data) {
  return data;
};

/**
 * Default data encoder
 *
 * @param  {Object} data
 * @return {Buffer}
 */
Command.prototype.encoder = function() {
  throw new Error('Data encoder for command ' + this + ' not implemented');
};

/**
 * Parse buffer
 *
 * @param {Buffer} data
 */
Command.prototype.parse = function(data) {
  this.data = this.parser(data);
};

/**
 * Encode data object to buffer
 *
 * @param  {Object|Buffer} data
 * @return {Buffer}
 */
Command.prototype.encode = function(data) {
  return isBuffer(data) ? data : this.encoder(data);
};

/**
 * Return compiled command message
 *
 * @param  {Object|Buffer} data
 * @return {Buffer}
 */
Command.prototype.message = function(data) {
  var sender = this.sender;
  var target = this.target;
  var header = new Buffer(9);
  var content = this.encode(data);

  header.writeUInt8(content.length + 11, 0);
  header.writeUInt8(sender.subnet, 1);
  header.writeUInt8(sender.id, 2);
  header.writeUInt16BE(sender.type, 3);
  header.writeUInt16BE(this.code, 5);
  header.writeUInt8(target.subnet, 7);
  header.writeUInt8(target.id, 8);

  return Buffer.concat([header, content]);
};

/**
 * Return human readable command code
 *
 * @return {String}
 */
Command.prototype.toString = function() {
  return '0x' + ('0000' + this.code.toString(16)).slice(-4).toUpperCase();
};
