const devicemapping = require("./devices")
const commandmapping = require("./commands")

module.exports.scan = function scan(bus, timeout, callback) {

  const devices = [];

  bus.on("command", function(command) {

    var deviceId = `${command.sender.subnet}.${command.sender.id}`
    knownDevices = devicemapping[command.sender.type]
    foundDevice = {
      info: knownDevices,
      hdlKind: command.sender.type,
      address: deviceId,
    }
    devices.push(foundDevice);


  });

  bus.send("255.255", 0x000e, function(err) {
    if (err) {
      callback(err);
    }
  });

  setTimeout(() => {
    callback(null, devices);
  }, timeout);

}

module.exports.sendRequest = function sendRequest( bus, address, command, callback) {

  var device = bus.device(address);
  device.send(command, function(err) {
    if (err) {
      callback(err);
    }
  });

  device.on(commandmapping[command].response, function(data, target) { callback(null, data) })


}
