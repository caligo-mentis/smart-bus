var should = require('should');
var simple = require('simple-mock');
var Command = require('../lib/command');
var commands = require('../lib/commands');

describe('Command', function() {
  var code, command, sender, target, data, payload;

  beforeEach(function() {
    code = 0x0031;
    data = { level: 100 };
    sender = { subnet: 1, id: 3 };
    target = { subnet: 1, id: 10 };
    payload = new Buffer([1, 2, 3]);

    simple.mock(sender, 'toString').returnWith('1.3');
    simple.mock(target, 'toString').returnWith('1.10');
  });

  afterEach(function() {
    simple.restore();
  });

  describe('initialization', function() {
    it('should set properties on initialization', function() {
      command = new Command(code, {
        sender: sender,
        target: target
      });

      should(command).have.properties({
        code: code,
        sender: sender,
        target: target
      });
    });

    it('should set payload object', function() {
      command = new Command(code, {
        payload: payload
      });

      should(command).have.properties({
        payload: payload
      });
    });

    it('should skip empty payload', function() {
      command = new Command(code, {
        payload: new Buffer([])
      });

      should(command).have.properties({
        data: undefined
      });
    });

    it('should have string representation', function() {
      command = new Command(code);

      should(command.toString()).eql('X.X -> X.X 0x0031');
    });
  });

  describe('described command', function() {
    var parse, encode;

    beforeEach(function() {
      var command = simple.mock(commands, code, {});

      parse = simple.mock(command, 'parse').returnWith(data);
      encode = simple.mock(command, 'encode').returnWith(payload);
    });

    it('should parse data payload', function() {
      command = new Command(code, {
        payload: payload
      });

      should(parse.callCount).eql(0);

      should(command).have.properties({
        data: data
      });

      should(parse.firstCall.arg).eql(payload);
    });

    it('should set parser and encoder', function() {
      command = new Command(code);

      should(command).have.properties({
        parse: parse,
        encode: encode
      });
    });

    it('should encode message', function() {
      command = new Command(code, {
        sender: sender,
        target: target,

        data: data
      });

      var message = new Buffer('0E010300000031010A010203', 'hex');

      should(encode.firstCall.arg).eql(data);
      should(command.message).eql(message);
    });

    it('should encode message without data', function() {
      command = new Command(code, {
        sender: sender,
        target: target
      });

      var message = new Buffer('0B010300000031010A', 'hex');

      should(command.message).eql(message);
    });

    it('should have string representaion with payload', function() {
      command = new Command(code, {
        sender: sender,
        target: target,

        payload: payload
      });

      should(command.toString()).eql('1.3 -> 1.10 0x0031: 010203 { level: 100 }');
    });

    it('should have string representation without payload', function() {
      command = new Command(0x0004, {
        sender: sender,
        target: target
      });

      should(command.toString()).eql('1.3 -> 1.10 0x0004');
    });

    it('should have string representation with erroneous payload', function() {
      command = new Command(code, {
        sender: sender,
        target: target,

        payload: payload
      });

      simple.restore(command, 'parse');

      simple.mock(command, 'parse')
        .throwWith(new Error('Attempt to access memory outside buffer bounds'));

      should(command.toString()).eql('1.3 -> 1.10 0x0031: 010203 PARSE ERROR: Attempt to access memory outside buffer bounds');
    });
  });

  describe('unknown command', function() {
    beforeEach(function() {
      simple.mock(commands, code, undefined);
    });

    it('should not parse payload', function() {
      command = new Command(code, {
        payload: payload
      });

      should(command).have.properties({
        data: undefined
      });
    });

    it('should encode message', function() {
      command = new Command(code, {
        sender: sender,
        target: target,

        payload: payload
      });

      var message = new Buffer('0E010300000031010A010203', 'hex');

      should(command.message).eql(message);
    });

    it('should throw error if data is an object', function() {
      should(function() {
        command = new Command(code, {
          data: data
        });
      }).throw('Data encoder for command 0x0031 is not implemented');
    });

    it('should have string representation', function() {
      command = new Command(code, {
        sender: sender,
        target: target,

        payload: payload
      });

      should(command.toString()).eql('1.3 -> 1.10 0x0031: 010203');
    });
  });
});
