## SmartBus [![Build Status](https://travis-ci.org/caligo-mentis/smart-bus.svg)](https://travis-ci.org/caligo-mentis/smart-bus)

Node.js implementation of HDL SmartBus protocol http://hdlautomation.com

❗️ Read [migration guide](#v0x---v06) before upgrading to `v0.6`

## Contents

- [Initialization](#initialization)
- [Receive Commands](#receive-commands)
- [Send Commands](#send-commands)
- [Complete example](#complete-example)
- [Graceful Shutdown](#graceful-shutdown)
- [Debugging](#debugging)
- [Upgrading](#upgrading)

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

  // Buffer with command payload
  command.payload;

  // Object with decoded data from payload
  // if it could be parsed automatically
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

#### Command payload

This library has built-in parses and encoders for payload of some HDL commands.
You can find it with examples in [`fixtures`](test/fixtures/commands.js).

Parser-function will be invoked on access to `command.data` property:

```js
bus.on(0x0032, function(command) {
  command.payload; // => <Buffer 0a f8 64>

  command.data; // => { channel: 10, level: 100, success: true }
});
```

`command.data` is a short-hand getter for `command.parse(command.payload)`.

Most of these parsers was built refering to official document
"Operation Code of HDL Buspro v1.111", tested on real HDL setup
and should work out-of-the-box with your installation.

But this is unofficial library and you could get errors when
accessing `command.data` property due to malformed command payload or
undocumented features.

In case if you expiriencing unexpected errors on access to `command.data`
property, you can fallback to parse `command.payload` manually:

```js
bus.on(0x0032, function(command) {
  var data;

  try {
    data = command.data;
  } catch(err) {
    // Parse command.payload manually in case of error
  }
});
```

Feel free to make a PR with your fix or Issue with example of malformed
command payload and other details.

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

Use `payload` param if you need to send raw buffer as command payload:

```js
var sender = bus.device('1.50');
var dimmer = bus.device('1.4');

bus.send({
  sender: sender,
  target: dimmer,

  command: 0x0031,
  payload: new Buffer('04640190', 'hex')
}, function(err) { /* ... */ });
```

### Complete example

Usually modifier HDL commands have corresponding response commands.
Use them to keep an actual state of HDL devices:

```js
// Create UDP socket with HDL IP gateway
var bus = new SmartBus('hdl://192.168.1.250:6000');

// Initialize virtual controller device to send commands
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

// Use controller to send "Single Channel Control" command to dimmer
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

### Upgrading

#### v0.x -> v0.6

`v0.6` is a transitional version before upgrading min version of nodejs to v6,
it includes correct UDP Socket utilization, stability improvements, new methods signatures to provide more flexiliblity and other features.

In `v0.6` "sender" device extracted from `Bus` class and must be
initialized separately. This change transforms logic of `device.send()` method
and implies appropriate changes in signatures of all other methods.

Before `v0.6` `device.send()` method was used to send command *to* device,
now it means "send message *from* device".

Check [`CHANGELOG.md`](CHANGELOG.md#060) to see complete set of changes.

Update to `v0.6` from previous versions requires a lot of change

- Update initialization of `bus` instance:

  ```js
  /* Before v0.6 */

  var bus = new SmartBus({
    device: '1.50',
    gateway: '192.168.1.250',
    port: 6000
  });
  ```

  ```js
  /* v0.6 */

  var bus = new SmartBus({ gateway: '192.168.1.250', port: 6000 });

  var controller = bus.controller('1.50');
  ```

- Update `bus.send()` calls:

  ```js
  /* Before v0.6 */

  bus.send('1.4', 0x0031, { channel: 1, level: 100 },
    function(err) { /* ... */ });

  bus.send('1.4', 0x0031, new Buffer('0164', 'hex'),
    function(err) { /* ... */ });
  ```

  ```js
  /* v0.6 */

  controller.send({
    target: '1.4',
    command: 0x0031,
    data: { channel: 1, level: 100 }
  }, function(err) { /* ... */ });

  controller.send({
    target: '1.4',
    command: 0x0031,
    payload: new Buffer('0164', 'hex')
  }, function(err) { /* ... */ });
  ```

- Update `device.send()` calls:

  ```js
  /* Before v0.6 */

  var logic = bus.device('1.10');

  logic.send(0xE01C, { switch: 1, status: 1 }, function(err) { /* ... */ });
  ```

  ```js
  /* v0.6 */
  var logic = bus.device('1.10');

  controller.send({
    target: logic,
    command: 0xE01C,
    data: { switch: 1, status: 1 }
  }, function(err) { /* ... */ });
  ```

- Update signature of device event handlers:

  ```js
  /* Before v0.6 */

  var sensor = bus.device('1.20');

  sensor.on(0x1647, function(data, target) { /* ... */ });
  ```

  ```js
  /* v0.6 */

  var sensor = bus.device('1.20');

  sensor.on(0x1647, function(command) {
    var data = command.data;
    var target = command.target;

    /* ... */
  });
  ```

- Replace `device.channel()` abstraction with custom listener:

  ```js
  /* Before v0.6 */

  var dimmer = bus.device('1.4');
  var spotlights = dimmer.channel(2);

  spotlights.on('status', function() {
    console.log('Spotlights level is %s', spotlights.level);
  });

  spotlights.control(100, { time: 5 }, function(err) { /* ... */ });
  ```

  ```js
  /* v0.6 */

  var dimmer = bus.device('1.4');

  dimmer.on(0x0032, function(command) {
    var data = command.data;

    if (!data.success) return;

    var level = data.level;
    var channel = data.channel;

    console.log('Channel #%d level is %d', channel, level);
  });

  controller.send({
    target: dimmer,
    command: 0x0031,
    data: { channel: 1, level: 100, time: 5 }
  }, function(err) { /* ... */ });
  ```
