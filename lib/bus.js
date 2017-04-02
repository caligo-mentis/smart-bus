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
  var device = config.device ? config.device.split('.') : [];

  var id = config.id || device[1];
  var port = config.port;
  var subnet = config.subnet || device[0];

  this.id = parseInt(id);
  this.type = 0xFFFE;
  this.subnet = parseInt(subnet);
  this.address = new Buffer([0, 0, 0, 0]);

  this.port = port ? parseInt(port) : 6000;
  this.gateway = config.gateway;

  this.socket = createSocket(this);

  this.devices = {};

  EventEmitter.call(this);
}

util.inherits(Bus, EventEmitter);

/**
 * Return device object by its address
 *
 * @param  {Number|String} subnet or address Subnet or address, e.g. '1.4'
 * @param  {Number} [id]                     Device id
 * @return {Device}
 */
Bus.prototype.device = function(address, id) {
  var subnet = address;

  if (typeof address === 'number') address = address + '.' + id;
  else subnet = subnet.split('.'), id = subnet[1], subnet = subnet[0];

  var devices = this.devices;

  if (!devices[address]) devices[address] = new Device(this, subnet, id);

  return devices[address];
};

/**
 * Send command to device via HDL SmartBus gateway
 *
 * @param  {String|Device}  target   Device address or object
 * @param  {Number}         code     Command code
 * @param  {Object|Buffer}  [data]     Additional data
 * @param  {Function}       callback
 */
Bus.prototype.send = function(target, code, data, callback) {
  if (typeof target === 'string') target = this.device(target);
  if (typeof data === 'function') callback = data, data = undefined;

  var content;
  var command = new Command(code, {
    sender: this,
    target: target,

    data: data
  });

  debug(command.toString());

  try {
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
  if (!isValid(message) || source(message) !== this.gateway) return;

  message = message.slice(16);

  var code = message.readUIntBE(5, 2);
  var sender = this.device(message.readUInt8(1), message.readUInt8(2));

  sender.type = message.readUIntBE(3, 2);

  return new Command(code, {
    target: this.device(message.readUInt8(7), message.readUInt8(8)),
    sender: sender,

    data: message.slice(9, message.readUInt8(0) - 2)
  });
};

/**
 * Return bus listener address as string representation
 *
 * @return {String}
 */
Bus.prototype.toString = Device.prototype.toString;

function handler(message) {
  var command = this.parse(message);

  if (!command) return;

  var data = command.data;
  var code = command.code;
  var sender = command.sender;
  var target = command.target;

  debug(command.toString());

  this.emit('command', command);

  if (target.subnet === 0xFF && target.id === 0xFF)
    this.emit('broadcast', command);

  this.emit(code, command);
  sender.emit(code, data, target);
}

function createSocket(bus) {
  var socket = dgram.createSocket('udp4');

  socket.on('message', handler.bind(bus));

  socket.on('error', function(err) {
    console.error('Error on socket: %s', err.message);

    socket.close();
  });

  socket.on('listening', function() {
    var address = socket.address();

    bus.address = new Buffer(address.address.split('.'));

    debug('UDP Server is listening on ' + address.address + ':' + address.port);
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
    device: config.auth,
    gateway: config.hostname
  };
}
