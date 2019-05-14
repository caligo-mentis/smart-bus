const devicemapping = require("./devices")
const commandmapping = require("./commands")

module.exports.sendRequest = function sendRequest( bus, address, command, callback) {

  var device = bus.device(address);
  device.send(command, function(err) {
    if (err) {
      callback(err);
    }
  });

  device.on(commandmapping[command].response, function(data, target) { callback(null, data) })


}
