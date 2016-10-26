exports.parser = function(data) {
    return {
        area: data.readUInt8(0),
        sequence: data.readUInt8(1),
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(2);

    buffer.writeUInt8(data.area, 0);
    buffer.writeUInt8(data.sequence, 1);

    return buffer;
};
