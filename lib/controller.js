const devicemapping = require("./devices")

module.exports.scan = function scan(bus, timeout, callback) {

  const devices = [];

  bus.on("command", function(command) {

    var deviceId = `${command.sender.subnet}.${command.sender.id}`
    knownDevices = devicemapping[command.sender.type]
    foundDevice = {
      info: knownDevices,
      hdlKind: command.sender.type,
      id: deviceId,
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
