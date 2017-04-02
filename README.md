## SmartBus [![Build Status](https://travis-ci.org/caligo-mentis/smart-bus.svg)](https://travis-ci.org/caligo-mentis/smart-bus)

Node.js implementation of HDL SmartBus protocol http://hdlautomation.com

### Initialization

Create instance of SmartBus connector

```js
var SmartBus = require('smart-bus');

var bus = new SmartBus({
  device: '1.50',           // Connector address in HDL network (subnet.id)
  gateway: '192.168.1.250', // HDL SmartBus gateway IP
  port: 6000                // and port, default: 6000
});
```

Connector address could be defined either as string in `device` property,
or as separate properties `subnet` and `id`. In addition to passing
configuration as an object, you can use a url string:

```js
var bus = new SmartBus('hdl://1.50@192.168.1.250:6000');
```

HDL gateway port also would be used as listening port of udp server
to receive broadcast messages.

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
bus.on('broadcast', function(command) { ... });
bus.on(0x0032, function(command) { ... });
```

Listen for commands from specific device

```js
var sensor = bus.device('1.20');

sensor.on(0x1647, function(data, target) { ... });
```

### Send commands

Use connector to send commands

```js
bus.send('1.4', 0x0004, function(err) { ... });
bus.send('1.4', 0x0031, { channel: 1, level: 100 }, function(err) { ... });
```

Or use device object

```js
var logic = bus.device('1.10');

logic.send(0xE01C, { switch: 1, status: 1 }, function(err) { ... });
```

Both `send` methods accepts raw `Buffer` as data object. In case if
data object can not be encoded error will be passed into callback.

### DSL

Initialize channel object

```js
var dimmer = bus.device('1.4');
var spotlights = dimmer.channel(2);
```
Listen to channel status event

```js
spotlights.on('status', function() {
  console.log('Spotlights level is %s', spotlights.level);
});
```

Set device channel level value to 100 in 5 seconds

```js
spotlights.control(100, { time: 5 }, function(err) { ... });
```

`control` function will send `0x0031` command into bus.
