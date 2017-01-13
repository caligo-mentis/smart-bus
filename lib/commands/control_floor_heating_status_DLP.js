/**
 * Created by Y on 12.01.2017.
 */
exports.parser = function(data) {
    return {};
};

exports.encoder = function(data) {
    var buffer = new Buffer(7);

    for (var i = 0; i < data.length; i++) {
        buffer.writeUInt8(data[i], i);
    }

    return buffer;
};