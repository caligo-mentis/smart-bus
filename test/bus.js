var Bus = require('../lib/bus');
var should = require('should');
var simple = require('simple-mock');
var Device = require('../lib/device');
var Command = require('../lib/command');
var EventEmitter = require('events');

describe('Bus', function() {
  var bus;

  beforeEach(function(done) {
    bus = new Bus({
      id: 50,
      subnet: 1,
      gateway: '192.0.2.100'
    });

    bus.socket.on('listening', done);
  });

  afterEach(closeSocket);

  describe('initialization', function() {
    describe('open socket', function() {
      // Close previous bus object socket
      beforeEach(closeSocket);

      it('should set properties', function() {
        bus = new Bus({
          id: 50,
          subnet: 1,
          gateway: '192.0.2.100'
        });

        should(bus).have.properties({
          id: 50,
          port: 6000,
          type: 0xFFFE,
          subnet: 1,
          gateway: '192.0.2.100',
          address: new Buffer([0, 0, 0, 0])
        });
      });

      it('should create instance with default port', function(done) {
        bus = new Bus({
          id: 50,
          subnet: 1,
          gateway: '192.0.2.100'
        });

        bus.socket.on('listening', function() {
          should(bus.socket.address()).have.property('port', 6000);

          done();
        });
      });

      it('should open socket on given port', function(done) {
        bus = new Bus({
          id: 50,
          subnet: 1,
          port: 6500,
          gateway: '192.0.2.100'
        });

        var socket = bus.socket;

        socket.on('listening', function() {
          should(socket.address()).have.property('port', 6500);

          done();
        });
      });

      it('should parse device address', function() {
        bus = new Bus({
          device: '1.60',
          gateway: '192.168.1.250'
        });

        should(bus).have.properties({
          id: 60,
          port: 6000,
          subnet: 1,
          gateway: '192.168.1.250'
        });
      });

      it('should parse connection string', function() {
        bus = new Bus('hdl://1.50@192.0.2.100:7000');

        should(bus).have.properties({
          id: 50,
          port: 7000,
          subnet: 1,
          gateway: '192.0.2.100'
        });
      });
    });

    it('should inherit from event emitter', function() {
      should(bus).be.an.instanceOf(EventEmitter);
    });

    it('should have string representation', function() {
      should(bus.toString()).eql('1.50');
    });
  });

  describe('device', function() {
    var device;

    beforeEach(function() {
      device = bus.device('1.25');
    });

    it('should initialize device with address', function() {
      should(device).be.an.instanceOf(Device);
      should(device).have.properties({
        id: 25,
        subnet: 1,

        bus: bus
      });
    });

    it('should initialize device with subnet and id', function() {
      device = bus.device(1, 35);

      should(device).be.an.instanceOf(Device);
      should(device).have.properties({
        id: 35,
        subnet: 1,

        bus: bus
      });
    });

    it('should cache device instance', function() {
      should(bus.device(1, 25)).equal(device);
    });
  });

  describe('send', function() {
    var send;

    beforeEach(function() {
      send = simple.mock(bus.socket, 'send').callback();
    });

    it('should send command to device by address', function(done) {
      bus.send('1.40', 0x0031, { channel: 1, level: 100 }, function(err) {
        should(send.callCount).be.exactly(1);

        should(send.lastCall.args[0]).eql(new Buffer('0000000048444C4D49524' +
          '1434C45AAAA0F0132FFFE00310128016400000803', 'hex'));
        should(send.lastCall.args[1]).equal(0);
        should(send.lastCall.args[2]).eql(31);
        should(send.lastCall.args[3]).eql(6000);
        should(send.lastCall.args[4]).eql('192.0.2.100');

        done(err);
      });
    });

    it('should send command to device object', function(done) {
      var device = bus.device(1, 30);

      bus.send(device, 0x0031, { channel: 5, level: 100 }, function(err) {
        should(send.callCount).be.exactly(1);

        should(send.lastCall.args[0]).eql(new Buffer('0000000048444C4D49524' +
          '1434C45AAAA0F0132FFFE0031011E056400000399', 'hex'));
        should(send.lastCall.args[1]).equal(0);
        should(send.lastCall.args[2]).eql(31);
        should(send.lastCall.args[3]).eql(6000);
        should(send.lastCall.args[4]).eql('192.0.2.100');

        done(err);
      });
    });

    it('should accept raw buffer as data', function(done) {
      bus.send('1.23', 0x0031, new Buffer('01640000', 'hex'), function(err) {
        should(send.callCount).be.exactly(1);

        should(send.lastCall.args[0]).eql(new Buffer('0000000048444C4D49524' +
          '1434C45AAAA0F0132FFFE00310117016400006114', 'hex'));
        should(send.lastCall.args[1]).equal(0);
        should(send.lastCall.args[2]).eql(31);
        should(send.lastCall.args[3]).eql(6000);
        should(send.lastCall.args[4]).eql('192.0.2.100');

        done(err);
      });
    });

    it('should catch data encoding error', function(done) {
      bus.send('1.23', -1, { channel: 5 }, function(err) {
        should(err).have.property('message',
          'Data encoder for command 0x00-1 is not implemented');

        done();
      });
    });

    it('should send command without additional data', function(done) {
      bus.send('1.23', 0x0004, function(err) {
        should(send.callCount).be.exactly(1);

        should(send.lastCall.arg).eql(new Buffer('0000000048444C4D49524' +
          '1434C45AAAA0B0132FFFE000401175360', 'hex'));

        done(err);
      });
    });
  });

  describe('parse', function() {
    it('should not parse invalid message', function() {
      should(bus.parse(new Buffer('TEST'))).equal(undefined);
    });

    it('should ignore message from another gateway', function() {
      should(bus.parse(new Buffer('C0A801FA48444C4D495241434C45AAAA0E010202' +
        '690032FFFF06F864B5A9', 'hex'))).equal(undefined);
    });

    it('should initialize device type after parsing', function() {
      var device = bus.device('1.2');

      should(device.type).equal(null);

      bus.parse(new Buffer('C000026448444C4D495241434C45AAAA0E010202' +
        '690032FFFF06F864B5A9', 'hex'));

      should(device.type).eql(0x0269);
    });

    it('should return command object', function() {
      var command = bus.parse(new Buffer('C000026448444C4D495241434C45AAAA0E' +
        '010202690032FFFF06F864B5A9', 'hex'));

      should(command).be.an.instanceOf(Command);
      should(command).have.properties({
        code: 0x0032,
        sender: bus.device('1.2'),
        target: bus.device('255.255'),
        data: { channel: 6, success: true, level: 100 }
      });
    });

    it('should return command object without data', function() {
      var command = bus.parse(new Buffer('C000026448444C4D49524' +
          '1434C45AAAA0B0132FFFE000401175360', 'hex'));

      should(command).be.an.instanceOf(Command);
      should(command).have.properties({
        code: 0x0004,
        sender: bus.device('1.50'),
        target: bus.device('1.23'),
        data: undefined
      });
    });
  });

  describe('events', function() {
    var handler;

    beforeEach(function() {
      handler = simple.mock();
    });

    it('should emit command event', function() {
      bus.on('command', handler);

      emitEvents();

      should(handler.callCount).be.exactly(2);

      should(handler.calls[0].arg).have.properties({
        code: 0x0031,
        sender: bus.device('1.5'),
        target: bus.device('1.4'),
        data: { channel: 4, level: 100, time: 3 }
      });

      should(handler.calls[1].arg).have.properties({
        code: 0x0032,
        sender: bus.device('1.2'),
        target: bus.device('255.255'),
        data: { channel: 6, success: true, level: 100 }
      });
    });

    it('should emit broadcast event', function() {
      bus.on('broadcast', handler);

      emitEvents();

      should(handler.callCount).be.exactly(1);
      should(handler.lastCall.arg).have.properties({
        code: 0x0032,
        sender: bus.device('1.2'),
        target: bus.device('255.255'),
        data: { channel: 6, success: true, level: 100 }
      });
    });

    it('should emit event by command code', function() {
      bus.on(0x0031, handler);

      emitEvents();

      should(handler.callCount).be.exactly(1);
      should(handler.lastCall.arg).have.properties({
        code: 0x0031,
        sender: bus.device('1.5'),
        target: bus.device('1.4'),
        data: { channel: 4, level: 100, time: 3 }
      });
    });

    it('should emit event on sender device', function() {
      var device = bus.device('1.2');

      device.on(0x0032, handler);

      emitEvents();

      should(handler.callCount).be.exactly(1);
      should(handler.lastCall.args[0]).have.properties({
        level: 100,
        channel: 6,
        success: true
      });

      should(handler.lastCall.args[1]).equal(bus.device('255.255'));
    });

    function emitEvents() {
      bus.socket.emit('message', new Buffer('C000026448444C4D495241434C45AAA' +
        'A10010504550031010404640003000837', 'hex'));
      bus.socket.emit('message', new Buffer('C000026448444C4D495241434C45AAA' +
        'A0E010202690032FFFF06F864B5A9', 'hex'));
    }
  });

  function closeSocket(done) {
    var socket = bus.socket;

    socket.on('close', done);

    socket.close();
  }
});
