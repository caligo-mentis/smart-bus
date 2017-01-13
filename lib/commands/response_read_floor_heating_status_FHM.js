/**
 * Created by Y on 12.01.2017.
 */
exports.parser = function(data) {
    var arr = [];
    var channel = data.readUInt8(0);
    for (var i = 1; i < data.length; i++){
        arr.push(data.readUInt8(i));
    }
    return {
        channel: channel,
        data: arr
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(0);

    return buffer;
};