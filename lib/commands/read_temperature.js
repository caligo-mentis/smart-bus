/**
 * Created by Y on 12.01.2017.
 */
exports.parser = function(data) {
    return {};
};

exports.encoder = function(data) {
    var buffer = new Buffer(1);

    buffer.writeUInt8(data.channel, 0);

    return buffer;
};