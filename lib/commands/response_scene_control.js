var Bits= require('js-bits');

exports.parser = function(data) {
    var area = data.readUInt8(0);
    var scene = data.readUInt8(1);
    var totalChannel = data.readUInt8(2);
    var totalBytes = Math.ceil(totalChannel/8);
    var channels = [];
    var byte;
    for (var i = 3; i < totalBytes + 3; i++) {
        byte = data.readUInt8(i);
        channels = channels.concat(Bits.toArray(byte, 8));
    };
    for (var i = 0; i < channels.length; i++) {
        if (!channels[i]) {
            channels[i] = 0;
        }
    }
    return {
        area: area,
        scene: scene,
        channels: channels
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(2);

    buffer.writeUInt8(data.area, 0);
    buffer.writeUInt8(data.scene, 1);

    return buffer;
};
