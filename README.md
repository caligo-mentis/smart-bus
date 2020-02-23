## SmartBus [![Build Status](https://travis-ci.org/caligo-mentis/smart-bus.svg)](https://travis-ci.org/caligo-mentis/smart-bus)

Node.js implementation of HDL SmartBus protocol http://hdlautomation.com

### Initialization

Create instance of SmartBus connector

```js
var SmartBus = require('smart-bus');

var bus = new SmartBus({
  gateway: '192.168.1.250', // HDL SmartBus gateway IP
  port: 6000                // and port, default: 6000
});
```

In addition to passing configuration as an object, you can use an url string:

```js
var bus = new SmartBus('hdl://192.168.1.250:6000');
```

HDL gateway port also would be used as listening port of udp server
to receive broadcast messages.

#### Multiple gateways

If you have several physical HDL gateways create `Bus` instance for each:

```js
var firstGateway = new SmartBus('hdl://192.168.1.250:6000');
var secondGateway = new SmartBus('hdl://192.168.1.251:6000');
```

Alternatively UDP broadcasting can be used if gateways sharing same network.
To do this create `Bus` instance with broadcast address as gateway IP and enable
broadcast mode:

```js
// Bus instance with broadcast address as gateway IP
var bus = new SmartBus('hdl://192.168.1.255:6000');

bus.on('listening', function() {
  bus.setBroadcast(true);
});
```

### Receive commands

Add handler to intercept all commands across bus

```js
bus.on('command', function(command) {

  // Integer with command operation code
  command.code;

  // Device objects
  command.sender;
  command.target;

  // Object with decoded data or raw buffer
  // if data can not be parsed automatically
  command.data;

});
```

Handlers can be added for broadcast messages or specific commands

```js
bus.on('broadcast', function(command) { /* ... */ });
bus.on(0x0032, function(command) { /* ... */ });
```

Listen for commands from specific device

```js
var sensor = bus.device('1.20');

sensor.on(0x1647, function(command) { /* ... */ });
```

### Send commands

There are several ways to send commands into HDL Bus, for all of them
you need to define sender device.

#### Controller

Easiest way to send commands via IP gateway is to create a virtual
HDL device representing nodejs application in HDL environment:

```js
var controller = bus.controller('1.50');

controller.send({ target: '1.4', command: 0x0004 }, callback);

controller.send({
  target: '1.4',
  command: 0x0031,
  data: { channel: 1, level: 100 }
}, callback);

function callback(err) {
  // Command sent...
}
```

`controller` function simply returns device instance
with type `0xFFFE` which means "PC" for HDL Bus and it's
a shortcut for `bus.device()` function described below.

#### Custom device

It's possible to create device object with custom type
or without type at all and use it for sending messages

```js
var sender = bus.device({
  address: '1.42',
  type: 0x0269
});

var logic = bus.device('1.4');

sender.send({
  target: logic,
  command: 0xE01C,
  data: { switch: 1, status: 1 }
}, function(err) { /* ... */ });
```

Optionally both `controller` and `device` methods accepts
`address` param as `subnet` and `id` properties:

```js
bus.device({ subnet: 1, id: 50 });
```

#### Using Bus instance directly

`Bus` instance could be used directly to get full control

```js
bus.send({
  sender: '1.50', // Sender device subnet and id
  target: '1.4',  // Receiver device subnet and id

  command: 0x0031,   // Command code
  data: { channel: 1, level: 100 } // Optional command data
}, function(err) { /* ... */ });
```

`sender` and `target` properties could be a device instances

```js
var sender = bus.device('1.50');
var dimmer = bus.device('1.4');

bus.send({
  sender: sender,
  target: dimmer,

  command: 0x0031,
  data: { channel: 1, level: 100 }
}, function(err) { /* ... */ });
```

In case if data object can not be encoded error will be passed into callback.

Built-in parsers and encoders for command payload with examples
described in [`fixtures`](test/fixtures/commands.js).

Also `send` method accepts raw buffer as command data:

```js
var sender = bus.device('1.50');
var dimmer = bus.device('1.4');

bus.send({
  sender: sender,
  target: dimmer,

  command: 0x0031,
  data: new Buffer('04640190', 'hex')
}, function(err) { /* ... */ });
```

### Complete example

Usually modifier HDL commands have corresponding response commands.
Use them to keep an actual state of HDL devices:

```js
// Create UDP socket with HDL IP gateway
var bus = new SmartBus('hdl://192.168.1.250:6000');

// Initialize controller device
var controller = bus.controller('1.50');

// Initialize dimmer device
var dimmer = bus.device('1.4');

// Setup listener for "Response Single Channel Control" command
dimmer.on(0x0032, function(command) {
  var data = command.data;

  var success = data.success;
  var channel = data.channel;
  var level = data.level;

  if (success) console.log('Channel #%d level is %d', channel, level);
  else console.log('Failed to change level of #%d channel', channel);
});

// Send "Single Channel Control" command to dimmer
controller.send({
  target: dimmer,
  command: 0x0031,
  data: { channel: 1, level: 100, time: 5 }
}, function(err) {
  if (err) console.error('Failed to send command');
  else console.log('Sent command 0x0031 to %s', dimmer);
});
```

Refer to "Operation Code of HDL Buspro" (could be found on the internet)
document for complete list of commands or analyze you own setup using
[`debug`](README.md#debugging) mode.

### Graceful shutdown

Underlying UDP socket can be closed using `close` method:

```js
bus.on('close', function() {
  console.log('HDL Bus is closed');
});

bus.close();
```

`Bus` will close UDP socket on error automatically so it
would be useful to attach `error` event handler and restart
process if needed.

```js
var error;

bus.on('error', function(err) { error = err; });

bus.on('close', function() {
  // Shutdown process with error code
  process.exit(err ? 1 : 0);
});
```

### Debugging

This package uses [`debug`](https://www.npmjs.com/package/debug) utility
and streams all intercepted via HDL IP gateway commands into console when
`DEBUG` environment variable contains `smart-bus` string.

Run your script with defined `DEBUG` environment variable to get output:

```sh
$ DEBUG=smart-bus node your-script.js
```
