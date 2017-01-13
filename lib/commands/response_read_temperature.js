/**
 * Created by Y on 12.01.2017.
 */
exports.parser = function(data) {
    return {
        channel: data.readUInt8(0),
        temperature: data.readUInt8(1),
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(2);

    buffer.writeUInt8(data.channel, 0);
    buffer.writeUInt8(data.temperature, 1);

    return buffer;
};