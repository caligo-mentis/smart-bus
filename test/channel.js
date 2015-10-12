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
      number: 1,
      device: device
    });
  });

  describe('level', function() {
    it('should send command and wait for response', function(done) {
      var send = simple.mock(device, 'send').callback();

      channel.level(100, function(err, response) {
        should(send.lastCall.args[0]).equal(0x0031);
        should(send.lastCall.args[1]).eql({ time: 0, level: 100, channel: 1 });

        should(response).eql({ channel: 1, success: true, level: 100 });

        done(err);
      });

      device.emit(0x0032, { channel: 1, success: true, level: 100 });
    });

    it('should accept time option', function(done) {
      var send = simple.mock(device, 'send').callback();

      channel.level(100, { time: 5 }, function(err, response) {
        should(send.lastCall.args[0]).equal(0x0031);
        should(send.lastCall.args[1]).eql({ time: 5, level: 100, channel: 1 });

        should(response).eql({ channel: 1, success: true, level: 100 });

        done(err);
      });

      device.emit(0x0032, { channel: 1, success: true, level: 100 });
    });

    it('should not wait response on error', function(done) {
      var send = simple.mock(device, 'send').callbackWith(new Error());

      channel.level(100, function(err, response) {
        should(err).be.instanceOf(Error);
        should(response).not.be.ok();

        should(send.lastCall.args[0]).equal(0x0031);
        should(send.lastCall.args[1]).eql({ time: 0, level: 100, channel: 1 });

        should(device.listenerCount(0x0032)).be.exactly(0);

        done();
      });
    });
  });
});
