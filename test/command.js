var should = require('should');
var simple = require('simple-mock');
var Command = require('../lib/command');
var commands = require('../lib/commands');

describe('Command', function() {
  var command, sender, target, buffer, object;

  beforeEach(function() {
    buffer = new Buffer([1, 2, 3]);
    object = { test: 'data' };
    sender = { subnet: 1, id: 3 };
    target = { subnet: 1, id: 10 };
    command = new Command(0x0031, { sender: sender, target: target });
  });

  it('should create instance with parser and encoder', function() {
    should(command).have.properties({
      code: 0x0031,
      sender: sender,
      target: target,
      parser: commands[0x0031].parser,
      encoder: commands[0x0031].encoder,
    });
  });

  it('should have string representation', function() {
    should(command.toString()).eql('0x0031');
  });

  it('should compile message', function() {
    var message = new Buffer('0E010300000031010A010203', 'hex');

    should(command.message(buffer)).eql(message);
  });

  describe('parse', function() {
    it('should decode data with parser', function() {
      var parser = simple.mock(command, 'parser')
        .returnWith(object);

      command.parse(buffer);

      should(parser.callCount).equal(1);
      should(parser.lastCall.arg).equal(buffer);

      should(command.data).equal(object);
    });

    it('should set data with default parser', function() {
      command = new Command(-1);

      command.parse(buffer);

      should(command.data).equal(buffer);
    });
  });

  describe('encode', function() {
    it('should encode data', function() {
      var encoder = simple.mock(command, 'encoder')
        .returnWith(buffer);

      should(command.encode(object)).equal(buffer);

      should(encoder.callCount).equal(1);
      should(encoder.lastCall.arg).equal(object);
    });

    it('should not encode buffer', function() {
      should(command.encode(buffer)).equal(buffer);
    });

    it('should throw error with default encoder', function() {
      command = new Command(-1);

      should(function() {
        command.encode(object);
      }).throw('Data encoder for command 0x00-1 not implemented');
    });
  });
});
