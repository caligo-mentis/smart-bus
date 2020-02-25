var url = require('url');
var crc = require('crc').crc16xmodem;
var util = require('util');
var debug = require('debug')('smart-bus');
var dgram = require('dgram');
var Device = require('./device');
var Command = require('./command');
var EventEmitter = require('events');

module.exports = Bus;

var Constants = new Buffer(12);

Constants.write('HDLMIRACLE');
Constants.writeUInt16BE(0xAAAA, 10);

function Bus(resource) {
  var config = parse(resource);
  var port = config.port;

  this.address = new Buffer([0, 0, 0, 0]);

  this.port = port ? parseInt(port) : 6000;
  this.gateway = config.gateway;

  this.socket = createSocket(this);

  this.devices = {};

  EventEmitter.call(this);
}

util.inherits(Bus, EventEmitter);

/**
 * Create or find existing device
 *
 * @param  {String|Object|Device} address or options or device instance
 * @param  {String} [options.address]
 * @param  {Number} [options.subnet]
 * @param  {Number} [options.id]
 * @param  {Number} [options.type]
 * @return {Device}
 */
Bus.prototype.device = function(options) {
  if (options instanceof Device) return options;

  var address = options.address;

  if (typeof options === 'string') address = options, options = {};

  if (address) {
    var tuple = address.split('.');

    options.subnet = tuple[0];
    options.id = tuple[1];
  } else if (options.subnet && options.id) {
    address = options.subnet + '.' + options.id;
  }

  var device = this.devices[address] ||
    (this.devices[address] = new Device(this, options));

  if (options.type && device.type !== options.type)
    device.type = options.type;

  return device;
};

/**
 * Create virtual device for sending commands to other devices
 *
 * @param  {String|Object} address or options
 * @param  {String} [options.address]
 * @param  {Number} [options.subnet]
 * @param  {Number} [options.id]
 * @return {Device}
 */
Bus.prototype.controller = function(options) {
  if (typeof options === 'string') options = { address: options };

  options.type = 0xFFFE;

  return this.device(options);
};

/**
 * Send command to device via HDL SmartBus gateway
 *
 * @param  {String|Device}  options.sender   Sender device address or instance
 * @param  {String|Device}  options.target   Receiver device address or instance
 * @param  {Number}         options.command  Command code
 * @param  {Object}        [options.data]    Additional data
 * @param  {Buffer}        [options.payload] Command payload
 * @param  {Function}       callback
 */
Bus.prototype.send = function(options, callback) {
  var content;

  try {
    var command = new Command(options.command, {
      sender: this.device(options.sender),
      target: this.device(options.target),

      data: options.data,
      payload: options.payload
    });

    debug(command.toString());

    content = command.message;
  } catch (err) {
    return callback(err);
  }

  var checksum = new Buffer(2);

  checksum.writeUInt16BE(crc(content), 0);

  var message = Buffer.concat([this.address, Constants, content, checksum]);

  this.socket.send(message, 0, message.length,
    this.port, this.gateway, callback);
};

/**
 * Parse SmartBus message
 *
 * @param  {Buffer} message
 * @return {Command}
 */
Bus.prototype.parse = function(message) {
  if (!this.validate(message)) return;

  message = message.slice(16);

  var code = message.readUIntBE(5, 2);

  var sender = this.device({
    subnet: message.readUInt8(1),
    id: message.readUInt8(2),
    type: message.readUIntBE(3, 2)
  });

  var target = this.device({
    subnet: message.readUInt8(7),
    id: message.readUInt8(8)
  });

  return new Command(code, {
    target: target,
    sender: sender,

    payload: message.slice(9, message.readUInt8(0) - 2)
  });
};

/**
 * Close underlying UDP socket and stop listening on it
 *
 * @param {Function} [callback] - `close` event handler
 */
Bus.prototype.close = function(callback) {
  this.socket.close(callback);
};

/**
 * Set socket broadcast flag
 *
 * @param {Boolean} flag - broadcast flag
 */
Bus.prototype.setBroadcast = function(flag) {
  this.socket.setBroadcast(flag);

  // Check source gateway only when broadcasting is off
  this.validate = flag ? isValid : validateAndCheckGateway;
};

/**
 * Check if message is allowed for Bus instance
 *
 * This function could be changed on instance during
 * runtime with `setBroadcast` method.
 *
 * @param {Buffer} message - HDL message contents
 */
Bus.prototype.validate = validateAndCheckGateway;

function handler(message) {
  var command = this.parse(message);

  if (!command) return;

  var code = command.code;
  var sender = command.sender;
  var target = command.target;

  debug(command.toString());

  this.emit('command', command);

  if (target.subnet === 0xFF && target.id === 0xFF)
    this.emit('broadcast', command);

  this.emit(code, command);
  sender.emit(code, command);
}

function createSocket(bus) {
  var socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  socket.on('message', handler.bind(bus));

  socket.on('error', function(err) {
    // eslint-disable-next-line no-console
    console.error('Error on socket: %s', err.message);

    bus.emit('error', err);

    socket.close();
  });

  socket.on('close', function() {
    bus.emit('close');
  });

  socket.on('listening', function() {
    var address = socket.address();

    bus.address = new Buffer(address.address.split('.'));

    debug('UDP Server is listening on ' + address.address + ':' + address.port);

    bus.emit('listening');
  });

  socket.bind(bus.port);

  return socket;
}

/**
 * Check if buffer is valid Smart Bus command
 *
 * @param  {Buffer} message
 * @return {Boolean}
 */
function isValid(message) {
  if (!Constants.equals(message.slice(4, 16))) return false;

  var checksum = message.readUInt16BE(message.length - 2);

  return checksum === crc(message.slice(16, -2));
}

/**
 * Check if HDL message is valid and source gateway is the
 * same as defined on Bus instance.
 *
 * @param {Buffer} message - HDL message contents
 * @return {Boolean}
 */
function validateAndCheckGateway(message) {
  return isValid(message) && source(message) === this.gateway;
}

/**
 * Return message sender IP address
 *
 * @param  {Buffer} message
 * @return {String}
 */
function source(message) {
  var ip = [];

  for (var i = 0; i < 4; i++) ip.push(message[i]);

  return ip.join('.');
}

/**
 * Parse bus configuration from connection string with following format
 *
 *   hdl://device@gateway[:port]
 *
 * @param  {String|Object} resource - connection string or configutaion
 * @return {Object} - bus connection configuration
 */
function parse(resource) {
  if (typeof resource === 'object') return resource;

  var config = url.parse(resource);

  return {
    port: config.port,
    gateway: config.hostname
  };
}
