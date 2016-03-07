var should = require('should');
var simple = require('simple-mock');
var Channel = require('../lib/channel');
var EventEmitter = require('events');

describe('Channel', function() {
  var device, channel;

  beforeEach(function() {
    device = new EventEmitter();
    channel = new Channel(device, 1);
  });

  it('should create instance', function() {
    should(channel).have.properties({
      level: undefined,
      number: 1,
      device: device
    });
  });

  it('should inherit from event emitter', function() {
    should(channel).be.an.instanceOf(EventEmitter);
  });

  describe('listen', function() {
    var factory;

    beforeEach(function() {
      factory = simple.mock(device, 'channel');

      Channel.listen(device);
    });

    it('should initialize device channel by event', function() {
      factory.callFn(createChannel);

      device.emit(0x0032, { channel: 2, success: true, level: 100 });

      should(channel).have.property('level', 100);
      should(factory.callCount).equal(1);

      function createChannel(number) {
        should(number).equal(2);

        channel = new Channel(device, number);

        return channel;
      }
    });

    describe('channel events', function() {
      beforeEach(function() {
        factory.returnWith(channel);
      });

      it('should update channel level status', function() {
        device.emit(0x0032, { channel: 1, success: true, level: 42 });

        should(channel).have.property('level', 42);
        should(factory.callCount).equal(1);
      });

      it('should not update level without success', function() {
        channel.level = 100;

        device.emit(0x0032, { channel: 1, success: false, level: 42 });

        should(channel).have.property('level', 100);
        should(factory.callCount).equal(0);
      });
    });
  });

  describe('control', function() {
    it('should send channel control command', function(done) {
      var send = simple.mock(device, 'send').callback();

      channel.control(100, function(err) {
        should(send.lastCall.args[0]).equal(0x0031);
        should(send.lastCall.args[1]).eql({ time: 0, level: 100, channel: 1 });

        done(err);
      });
    });

    it('should accept time option', function(done) {
      var send = simple.mock(device, 'send').callback();

      channel.control(100, { time: 5 }, function(err) {
        should(send.lastCall.args[0]).equal(0x0031);
        should(send.lastCall.args[1]).eql({ time: 5, level: 100, channel: 1 });

        done(err);
      });
    });

    it('should pass error', function(done) {
      simple.mock(device, 'send').callbackWith(new Error());

      channel.control(100, function(err) {
        should(err).be.instanceOf(Error);

        done();
      });
    });
  });
});
