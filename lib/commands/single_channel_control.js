exports.parser = function(data) {
  return {
    channel: data.readUInt8(0),
    level: data.readUInt8(1),
    time: data.readUInt8(2) * 256 + data.readUInt8(3),
  };
};

exports.encoder = function(data) {
  var buffer = new Buffer(4);

  buffer.writeUInt8(data.channel, 0);
  buffer.writeUInt8(data.level, 1);

  var time = data.time;

  buffer.writeUInt8(Math.floor(time / 256), 2);
  buffer.writeUInt8(time % 256, 3);

  return buffer;
};
