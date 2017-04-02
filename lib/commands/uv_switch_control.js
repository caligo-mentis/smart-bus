exports.parse = function(data) {
  return {
    switch: data.readUInt8(0),
    status: Boolean(data.readUInt8(1))
  };
};

exports.encode = function(data) {
  var buffer = new Buffer(2);

  buffer.writeUInt8(data.switch, 0);
  buffer.writeUInt8(data.status ? 255 : 0, 1);

  return buffer;
};
