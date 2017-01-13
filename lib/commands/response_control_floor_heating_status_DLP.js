/**
 * Created by Y on 12.01.2017.
 */
exports.parser = function(data) {
    var arr = [];
    for (var i = 1; i < data.length; i++){
        arr.push(data.readUInt8(i));
    }
    return {
        success: status(data.readUInt8(0)),
        data: arr
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(0);

    return buffer;
};

function status(data) {
    switch (data) {
        case 0xF8: return true;
        case 0xF5: return false;
    }
}
