/**
 * Created by Y on 12.01.2017.
 */
exports.parser = function(data) {
    return {};
};

exports.encoder = function(data) {
    var buffer = new Buffer(10);

    buffer.writeUInt8(data.channel, 0);
    for (var i = 0; i < data.data.length; i++) {
        buffer.writeUInt8(data.data[i], i + 1);
    }

    return buffer;
};