var Bus = require('../lib/bus');
var should = require('should');
var simple = require('simple-mock');
var Device = require('../lib/device');
var Command = require('../lib/command');
var EventEmitter = require('events');

describe('Bus', function() {
  var bus;

  beforeEach(function(done) {
    bus = new Bus({ gateway: '192.0.2.100' });

    bus.socket.on('listening', done);
  });

  afterEach(closeSocket);

  describe('initialization', function() {
    describe('open socket', function() {
      // Close previous bus object socket
      beforeEach(closeSocket);

      it('should set properties', function() {
        bus = new Bus({ gateway: '192.0.2.100' });

        should(bus).have.properties({
          port: 6000,
          gateway: '192.0.2.100',
          address: new Buffer([0, 0, 0, 0])
        });
      });

      it('should create instance with default port', function(done) {
        bus = new Bus({ gateway: '192.0.2.100' });

        bus.socket.on('listening', function() {
          should(bus.socket.address()).have.property('port', 6000);

          done();
        });
      });

      it('should open socket on given port', function(done) {
        bus = new Bus({ port: 6500, gateway: '192.0.2.100' });

        var socket = bus.socket;

        socket.on('listening', function() {
          should(socket.address()).have.property('port', 6500);

          done();
        });
      });

      it('should parse connection string', function() {
        bus = new Bus('hdl://192.0.2.100:7000');

        should(bus).have.properties({
          port: 7000,
          gateway: '192.0.2.100'
        });
      });

      it('should reuse same socket address', function(done) {
        var calls = 0;

        bus = new Bus('hdl://192.0.2.100:6200');

        bus.socket.on('listening', checkPort);

        var secondBus = new Bus('hdl://192.0.2.100:6200');

        secondBus.socket
          .on('listening', checkPort)
          .on('error', done)
          .on('close', done);

        function checkPort() {
          should(this.address()).have.property('port', 6200);

          if (++calls === 2) secondBus.socket.close();
        }
      });
    });

    it('should inherit from event emitter', function() {
      should(bus).be.an.instanceOf(EventEmitter);
    });

    it('should close socket on error and emit event', function(done) {
      var bus = new Bus('hdl://192.0.2.100:6300');
      var error = new Error('Something went wrong');

      bus.on('error', function(err) {
        should(err).equal(error);

        bus.on('close', done);
      });

      bus.socket.emit('error', error);
    });

    it('should emit listening event', function(done) {
      var bus = new Bus('hdl://192.0.2.100:6300');

      bus.on('listening', function() {
        bus.socket.on('close', done);

        bus.socket.close();
      });
    });

    it('should close socket', function(done) {
      var bus = new Bus('hdl://192.0.2.100:6300');
      var spy = simple.mock(bus.socket, 'close');
      var callback = function() {};

      bus.socket.on('close', function() {
        should(spy.callCount).equal(1);
        should(spy.lastCall.arg).equal(callback);

        done();
      });

      bus.close(callback);
    });

    it('should emit close event', function(done) {
      var bus = new Bus('hdl://192.0.2.100:6300');

      bus.on('close', done);

      bus.close();
    });

    it('should set broadcast flag on socket', function(done) {
      var bus = new Bus('hdl://192.0.1.255:6000');
      var spy = simple.mock(bus.socket, 'setBroadcast');

      bus.on('listening', function() {
        bus.setBroadcast(true);

        should(spy.callCount).equal(1);
        should(spy.lastCall.arg).equal(true);

        bus.on('close', done);

        bus.close();
      });
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
      device = bus.device({ subnet: 1, id: 35 });

      should(device).be.an.instanceOf(Device);
      should(device).have.properties({
        id: 35,
        subnet: 1,

        bus: bus
      });
    });

    it('should intialize device with address option', function() {
      device = bus.device({ address: '1.50' });

      should(device).be.an.instanceOf(Device);
      should(device).have.properties({
        id: 50,
        subnet: 1,

        bus: bus
      });
    });

    it('should initialize device with custom type', function() {
      device = bus.device({ address: '1.50', type: 0xFFFE });

      should(device).be.an.instanceOf(Device);
      should(device).have.properties({
        id: 50,
        subnet: 1,

        type: 0xFFFE,

        bus: bus
      });
    });

    it('should cache device instance', function() {
      should(bus.device({ subnet: 1, id: 25 })).equal(device);
    });
  });

  describe('controller', function() {
    var controller;

    beforeEach(function() {
      controller = bus.controller('1.50');
    });

    it('should create device with type 0xFFFE', function() {
      should(controller).be.instanceOf(Device);
      should(controller.type).eql(0xFFFE);
    });

    it('should cache controller instance', function() {
      should(bus.device('1.50')).equal(controller);
    });

    it('should get address from options', function() {
      controller = bus.controller({ address: '1.45' });

      should(controller.subnet).eql(1);
      should(controller.id).eql(45);
    });

    it('should get subnet and id from options', function() {
      controller = bus.controller({ subnet: 1, id: 42 });

      should(controller.subnet).eql(1);
      should(controller.id).eql(42);
    });

    it('should ignore type option', function() {
      controller = bus.controller({ address: '1.46', type: 0xFFFF });

      should(controller.type).eql(0xFFFE);
    });
  });

  describe('send', function() {
    var send, sender;

    beforeEach(function() {
      send = simple.mock(bus.socket, 'send').callback();

      sender = bus.device({ address: '1.50', type: 0xFFFE });
    });

    it('should send command to device by address', function(done) {
      bus.send({
        sender: '1.50',
        target: '1.40',
        command: 0x0031,
        data: { channel: 1, level: 100 }
      }, function(err) {
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
      var target = bus.device({ subnet: 1, id: 30 });

      bus.send({
        sender: sender,
        target: target,
        command: 0x0031,
        data: { channel: 5, level: 100 }
      }, function(err) {
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
      bus.send({
        sender: sender,
        target: '1.23',
        command: 0x0031,
        data: new Buffer('01640000', 'hex')
      }, function(err) {
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

    it('should accept payload buffer', function(done) {
      bus.send({
        sender: sender,
        target: '1.23',
        command: 0x0031,
        payload: new Buffer('01640000', 'hex')
      }, function(err) {
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
      bus.send({
        sender: sender,
        target: '1.23',
        command: -1,
        data: { channel: 5 }
      }, function(err) {
        should(err).have.property('message',
          'Data encoder for command 0x00-1 is not implemented');

        done();
      });
    });

    it('should send command without additional data', function(done) {
      bus.send({
        sender: sender,
        target: '1.23',
        command: 0x0004
      }, function(err) {
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

    it('should ignore message from another gateway by default', function() {
      should(bus.parse(new Buffer('C0A801FA48444C4D495241434C45AAAA0E010202' +
        '690032FFFF06F864B5A9', 'hex'))).equal(undefined);
    });

    it('should accept message from any gateway when broadcasting', function(done) {
      var bus = new Bus('hdl://192.168.1.255:6000');

      bus.on('listening', function() {
        bus.setBroadcast(true);

        var message = new Buffer('C0A801FA48444C4D495241434C45AAAA0E0' +
          '10202690032FFFF06F864B5A9', 'hex');

        should(bus.parse(message)).have.properties({
          code: 0x0032,
          sender: bus.device('1.2'),
          target: bus.device('255.255')
        });

        bus.on('close', done);

        bus.close();
      });
    });

    it('should ignore message from another gateway if broadcast is off', function(done) {
      var bus = new Bus('hdl://192.168.1.255:6000');

      bus.on('listening', function() {
        bus.setBroadcast(false);

        should(bus.parse(new Buffer('C0A801FA48444C4D495241434C45AAAA0E0' +
          '10202690032FFFF06F864B5A9', 'hex'))).equal(undefined);

        bus.on('close', done);

        bus.close();
      });
    });

    it('should initialize device type after parsing', function() {
      var device = bus.device('1.2');

      should(device.type).equal(undefined);

      bus.parse(new Buffer('C000026448444C4D495241434C45AAAA0E010202' +
        '690032FFFF06F864B5A9', 'hex'));

      should(device.type).eql(0x0269);
    });

    it('should overwrite device type after parsing', function() {
      var device = bus.device({
        address: '1.2',
        type: 0xFFFE
      });

      should(device.type).equal(0xFFFE);

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
        data: { channel: 4, level: 100, time: 3 },
        payload: new Buffer('0464000300', 'hex')
      });

      should(handler.calls[1].arg).have.properties({
        code: 0x0032,
        sender: bus.device('1.2'),
        target: bus.device('255.255'),
        data: { channel: 6, success: true, level: 100 },
        payload: new Buffer('06F864', 'hex')
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
        data: { channel: 6, success: true, level: 100 },
        payload: new Buffer('06F864', 'hex')
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
        data: { channel: 4, level: 100, time: 3 },
        payload: new Buffer('0464000300', 'hex')
      });
    });

    it('should emit event on sender device', function() {
      var device = bus.device('1.2');

      device.on(0x0032, handler);

      emitEvents();

      should(handler.callCount).be.exactly(1);

      should(handler.lastCall.arg).have.properties({
        code: 0x0032,
        sender: device,
        target: bus.device('255.255'),
        data: { level: 100, channel: 6, success: true },
        payload: new Buffer('06F864', 'hex')
      });
    });

    it('should handle invalid message', function() {
      should(function() {
        bus.socket.emit('message', new Buffer('invalid'));
      }).not.throw();
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
