exports.parser = function(data) {
  var channels = [];
  var length = data.readUInt8(0);
  for (var i = 0; i < length; i++){
    channels.push(data.readUInt8(i + 1));
  }
  return {
    channels: channels
  };
};

exports.encoder = function(data) {
  var buffer = new Buffer(0);

  return buffer;
};
