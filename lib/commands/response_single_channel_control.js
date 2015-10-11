exports.parser = function(data) {
  return {
    channel: data.readUInt8(0),
    success: status(data.readUInt8(1)),
    level: data.readUInt8(2)
  };
};

exports.encoder = function(data) {
  return new Buffer([
    data.channel, data.level, data.success ? 0xF8 : 0xF5
  ]);
};

function status(data) {
  switch (data) {
    case 0xF8: return true;
    case 0xF5: return false;
  }
}
