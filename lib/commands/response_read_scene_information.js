/**
 * Created by Y on 21.12.2016.
 */
exports.parser = function(data) {
    var area = data.readUInt8(0);
    var scene = data.readUInt8(1);
    var timeHi = data.readUInt8(2);
    var timeLo = data.readUInt8(3);
    var channels = [];
    var length = data.readUInt8(0);
    for (var i = 4; i < data.length; i++){
        channels.push(data.readUInt8(i));
    }
    return {
        area: area,
        scene: scene,
        timeHi: timeHi,
        timeLo: timeLo,
        channels: channels
    };
};

exports.encoder = function(data) {
    var buffer = new Buffer(0);

    return buffer;
};
