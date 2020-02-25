var should = require('should');
var simple = require('simple-mock');
var Device = require('../lib/device');
var EventEmitter = require('events');

describe('Device', function() {
  var bus, device, target;

  beforeEach(function() {
    bus = {};
    device = new Device(bus, {
      subnet: 1,
      id: 20
    });

    target = new Device(bus, {
      subnet: 1,
      id: 40
    });
  });

  it('should create instance', function() {
    should(device).have.properties({
      id: 20,
      bus: bus,
      subnet: 1
    });
  });

  it('should inherit from event emitter', function() {
    should(device).be.an.instanceOf(EventEmitter);
  });

  it('should send command to bus', function(done) {
    var data = { channel: 1, level: 100 };
    var send = simple.mock(bus, 'send').callback();

    device.send({
      target: target,
      command: 0x0031,
      data: data
    }, function(err) {
      should(send.callCount).equal(1);

      var options = send.lastCall.args[0];

      should(options.sender).equal(device);
      should(options.target).equal(target);
      should(options.command).eql(0x0031);
      should(options.data).equal(data);

      done(err);
    });
  });

  it('should send command with payload', function(done) {
    var payload = new Buffer([1, 2, 3]);
    var send = simple.mock(bus, 'send').callback();

    device.send({
      target: target,
      command: 0x0031,
      payload: payload
    }, function(err) {
      should(send.callCount).equal(1);

      var options = send.lastCall.args[0];

      should(options.sender).equal(device);
      should(options.target).equal(target);
      should(options.command).eql(0x0031);
      should(options.payload).equal(payload);

      done(err);
    });
  });

  it('should send command without data', function(done) {
    var send = simple.mock(bus, 'send').callback();

    device.send({
      target: target,
      command: 0x0004
    }, function(err) {
      should(send.callCount).equal(1);

      var options = send.lastCall.args[0];

      should(options.sender).equal(device);
      should(options.target).equal(target);
      should(options.command).eql(0x0004);

      done(err);
    });
  });

  it('should send command to target by address', function(done) {
    var send = simple.mock(bus, 'send').callback();

    device.send({
      target: '1.30',
      command: 0x0004
    }, function(err) {
      should(send.callCount).equal(1);

      var options = send.lastCall.args[0];

      should(options.sender).equal(device);
      should(options.target).equal('1.30');
      should(options.command).eql(0x0004);

      done(err);
    });
  });

  it('should have an address', function() {
    should(device.address).equal('1.20');
  });

  it('should have string representation', function() {
    should(device.toString()).eql('1.20');
  });

  it('should have string representation for device without address', function() {
    var device = new Device(bus);

    should(device.toString()).eql('X.X');
  });

  it('should create device with custom type', function() {
    var device = new Device(bus, {
      subnet: 1,
      id: 60,
      type: 0xFFFE
    });

    should(device.type).eql(0xFFFE);
  });
});
