exports.parser = function(data) {
    return {
        curtain: data.readUInt8(0),
        status: data.readUInt8(1)
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(2);

    buffer.writeUInt8(data.curtain, 0);
    buffer.writeUInt8(data.status, 1);

    return buffer;
};
