/**
 * Created by Y on 12.01.2017.
 */
exports.parser = function(data) {
    var arr = [];
    for (var i = 0; i < data.length; i++){
        arr.push(data.readUInt8(i));
    }
    return {
        data: arr
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(0);

    return buffer;
};