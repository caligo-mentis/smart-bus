exports.parser = function(data) {
  return {
    parameter: data.readUInt8(0),
    value: data.readUInt8(1),
    //time: data.readUInt8(2) * 256 + data.readUInt8(3),
  };
};

exports.encoder = function(data) {
  var buffer = new Buffer(4);

  buffer.writeUInt8(data.parameter, 0);
  buffer.writeUInt8(data.value, 1);

  //var time = data.time;

  //buffer.writeUInt8(Math.floor(time / 256), 2);
  //buffer.writeUInt8(time % 256, 3);

  return buffer;
};
