var word = {
  parse: function(buffer, offset) {
    return buffer.readUInt8(offset) * 256 + buffer.readUInt8(offset + 1);
  },

  encode: function(buffer, value, offset) {
    buffer.writeUInt8(Math.floor(value / 256), offset);
    buffer.writeUInt8(value % 256, offset + 1);
  }
};

var status = {
  parse: function(buffer, offset) {
    switch (buffer.readUInt8(offset)) {
      case 0xF8: return true;
      case 0xF5: return false;
    }
  },

  encode: function(buffer, value, offset) {
    buffer.writeUInt8(value ? 0xF8 : 0xF5, offset);
  }
};

/*
  Commands as decribed in "Operation Code of HDL Buspro v1.111.pdf"
  from http://hdlautomation.com

  All of these commands was tested on the real hdl installation
 */
module.exports = {
  /* 4.1 Scene */

  // 4.1.1 Scene Control
  // FIXME: copy-paste from 0x0000
  0x0002: {
    parse: function(buffer) {
      return {
        area: buffer.readUInt8(0),
        scene: buffer.readUInt8(1)
      };
    },

    encode: function(data) {
      return new Buffer([data.area, data.scene]);
    },

    response: 0x0003
  },

  // 4.1.2 Scene Control Response
  0x0003: {
    parse: function(buffer) {
      var data = {
        area: buffer.readUInt8(0),
        scene: buffer.readUInt8(1),

        channels: new Array(buffer.readUInt8(2))
      };

      var channels = data.channels;

      for (var i = 3, length = buffer.length; i < length; i++) {
        var byte = buffer.readUInt8(i);
        var offset = i - 3;

        for (var n = 0; n < 8 && (offset * 8) + n < channels.length; n++)
          channels[offset + n] = {
            number: offset + n + 1,
            status: !!(byte & (1 << n))
          };
      }

      return data;
    },

    encode: function(data) {
      var channels = data.channels || [];
      var length = channels.length;
      var bytes = Math.ceil(length / 8);
      var buffer = new Buffer(3 + bytes);

      buffer.writeUInt8(data.area, 0);
      buffer.writeUInt8(data.scene, 1);
      buffer.writeUInt8(length, 2);

      for (var i = 0; i < bytes; i++) {
        var byte = 0;

        for (var n = 0; n < 8 && i + n < length; n++)
          if (channels[i + n].status) byte |= 1 << n;

        buffer.writeUInt8(byte, i + 3);
      }

      return buffer;
    }
  },

  // 4.1.3 Read Status of Scene
  0x000C: {
    parse: function(buffer) {
      return {
        area: buffer.readUInt8(0)
      };
    },

    encode: function(data) {
      return new Buffer([data.area]);
    },

    response: 0x000D
  },

  // 4.1.4 Response Read Status of Scene
  0x000D: {
    parse: function(buffer) {
      return {
        area: buffer.readUInt8(0),
        scene: buffer.readUInt8(1)
      };
    },

    encode: function(data) {
      return new Buffer([data.area, data.scene]);
    }
  },

  // 4.1.5 Broadcast Status of Scene
  // Documentation is wrong
  0xEFFF: {
    parse: function(buffer) {
      var data = { areas: [], channels: [] };

      var areas = data.areas;
      var channels = data.channels;

      var i;
      var length = buffer.readUInt8(0);

      for (i = 0; i < length; i++) areas.push({
        number: areas.length + 1,
        scene: buffer.readUInt8(i + 1)
      });

      length = buffer.readUInt8(i++);

      for (i = i + 1, length = buffer.length; i < length; i++) {
        var byte = buffer.readUInt8(i);

        for (var n = 0; n < 8 && channels.length + 1 < length; n++)
          channels.push({
            number: channels.length + 1,
            status: !!(byte & (1 << n))
          });
      }

      return data;
    },

    encode: function(data) {
      var areas = data.areas || [];
      var channels = data.channels || [];
      var length = channels.length;
      var bytes = Math.ceil(length / 8);
      var buffer = new Buffer(2 + areas.length + bytes);

      buffer.writeUInt8(areas.length, 0);

      var i;

      for (i = 0; i < areas.length; i++)
        buffer.writeUInt8(areas[i].scene, i + 1);

      buffer.writeUInt8(length, ++i);

      for (var j = 0; j < bytes; j++) {
        var byte = 0;

        for (var n = 0; n < 8 && j + n < length; n++)
          if (channels[j + n].status) byte |= 1 << n;

        buffer.writeUInt8(byte, i + 1 + j);
      }

      return buffer;
    }
  },

  // 4.1.6 Read Area Information
  0x0004: {
    response: 0x0005
  },

  // 4.1.7 Response Read Area Information
  0x0005: {
    parse: function(buffer) {
      var data = {
        device: {
          type: word.parse(buffer, 0),
          subnet: buffer.readUInt8(2),
          id: buffer.readUInt8(3)
        },

        // Total areas count
        // FIXME: undocumented
        areas: buffer.readUInt8(4),

        channels: []
      };

      var channels = data.channels;

      for (var i = 5, length = buffer.length; i < length; i++)
        channels.push({
          number: channels.length + 1,
          area: buffer.readUInt8(i)
        });

      return data;
    },

    encode: function(data) {
      var device = data.device;
      var channels = data.channels;
      var length = channels.length;
      var buffer = new Buffer(5 + length);

      word.encode(buffer, device.type, 0);
      buffer.writeUInt8(device.subnet, 2);
      buffer.writeUInt8(device.id, 3);

      var areas = Math.max.apply(Math, channels.map(function(channel) {
        return channel.area;
      }));

      // Total areas count
      // FIXME: undocumented
      buffer.writeUInt8(areas, 4);

      for (var i = 0; i < length; i++)
        buffer.writeUInt8(channels[i].area, i + 5);

      return buffer;
    }
  },

  // 4.1.8 Read Scene Information
  0x0000: {
    parse: function(buffer) {
      return {
        area: buffer.readUInt8(0),
        scene: buffer.readUInt8(1)
      };
    },

    encode: function(data) {
      return new Buffer([data.area, data.scene]);
    },

    response: 0x0001
  },

  // 4.1.9 Read Scene Information Response
  0x0001: {
    parse: function(buffer) {
      var data = {
        area: buffer.readUInt8(0),
        scene: buffer.readUInt8(1),
        time: word.parse(buffer, 2),

        channels: []
      };

      var channels = data.channels;

      for (var i = 4, length = buffer.length; i < length; i++)
        channels.push({
          number: i - 3,
          level: buffer.readUInt8(i)
        });

      return data;
    },

    encode: function(data) {
      var channels = data.channels || [];
      var length = channels.length;
      var buffer = new Buffer(4 + length);

      buffer.writeUInt8(data.area, 0);
      buffer.writeUInt8(data.scene, 1);

      word.encode(buffer, data.time, 2);

      for (var i = 0; i < length; i++)
        buffer.writeUInt8(channels[i].level, i + 4);

      return buffer;
    }
  },

  // 4.1.10 Modify Scene Information
  // Documentation is wrong
  0x0008: {
    response: 0x0009
  },

  // 4.1.11 Response Modify Scene Information
  0x0009: {
    parse: function(buffer) {
      return {
        success: status.parse(buffer, 0)
      };
    },

    encode: function(data) {
      var buffer = new Buffer(1);

      status.encode(buffer, data.success, 0);

      return buffer;
    }
  },

  /* 4.2 Sequence */

  // 4.2.1 Sequence Control
  0x001A: {
    parse: function(buffer) {
      return {
        area: buffer.readUInt8(0),
        sequence: buffer.readUInt8(1)
      };
    },

    encode: function(data) {
      return new Buffer([data.area, data.sequence]);
    },

    response: 0x001B
  },

  // 4.2.2 Response Sequence Control
  0x001B: {
    parse: function(buffer) {
      return {
        area: buffer.readUInt8(0),
        sequence: buffer.readUInt8(1)
      };
    },

    encode: function(data) {
      return new Buffer([data.area, data.sequence]);
    }
  },

  // 4.2.3 Read Status of Sequence
  0xE014: {
    parse: function(buffer) {
      return { area: buffer.readUInt8(0) };
    },

    encode: function(data) {
      return new Buffer([data.area]);
    },

    response: 0xE015
  },

  // 4.2.4 Response Read Status of Sequence
  0xE015: {
    parse: function(buffer) {
      return {
        area: buffer.readUInt8(0),
        sequence: buffer.readUInt8(1)
      };
    },

    encode: function(data) {
      return new Buffer([data.area, data.sequence]);
    }
  },

  // 4.2.5 Broadcast Status of Sequence
  0xF036: {
    parse: function(buffer) {
      var length = buffer.length;
      var data = { areas: new Array(length) };

      for (var i = 0; i < length; i++)
        data.areas[i] = { number: i + 1, sequence: buffer.readUInt8(i) };

      return data;
    },

    encode: function(data) {
      var areas = data.areas || [];
      var length = areas.length;
      var buffer = new Buffer(length);

      for (var i = 0; i < length; i++)
        buffer.writeUInt8(areas[i].sequence, i);

      return buffer;
    }
  },

  /* 4.3 Channels */

  // 4.3.1 Single Channel Control
  0x0031: {
    parse: function(buffer) {
      return {
        channel: buffer.readUInt8(0),
        level: buffer.readUInt8(1),
        time: word.parse(buffer, 2),
      };
    },

    encode: function(data) {
      var buffer = new Buffer(4);

      buffer.writeUInt8(data.channel, 0);
      buffer.writeUInt8(data.level, 1);

      word.encode(buffer, data.time, 2);

      return buffer;
    }
  },

  // 4.3.2 Response Single Channel Control
  0x0032: {
    parse: function(buffer) {
      return {
        channel: buffer.readUInt8(0),
        success: status.parse(buffer, 1),
        level: buffer.readUInt8(2)
      };
    },

    encode: function(data) {
      var buffer = new Buffer(3);

      buffer.writeUInt8(data.channel, 0);
      status.encode(buffer, data.success, 1);
      buffer.writeUInt8(data.level, 2);

      return buffer;
    }
  },

  // 4.3.3 Read Status of Channels
  0x0033: {
    respose: 0x0034
  },

  // 4.3.4 Response Read Status of Channels
  0x0034: {
    parse: function(buffer) {
      var length = buffer.readUInt8(0);
      var data = { channels: new Array(length) };

      for (var i = 0; i < length; i++)
        data.channels[i] = { number: i + 1, level: buffer.readUInt8(i + 1) };

      return data;
    },

    encode: function(data) {
      var channels = data.channels || [];
      var length = channels.length;
      var buffer = new Buffer(length + 1);

      buffer.writeUInt8(length, 0);

      for (var i = 0; i < length; i++)
        buffer.writeUInt8(channels[i].level, i + 1);

      return buffer;
    }
  },

  // 4.3.5 Read Current Level of Channels
  0x0038: {
    response: 0x0039
  },

  // 4.3.6 Response Read Current Level of Channels
  // FIXME: same as 0x0034
  0x0039: {
    parse: function(buffer) {
      var length = buffer.readUInt8(0);
      var data = { channels: new Array(length) };

      for (var i = 0; i < length; i++)
        data.channels[i] = { number: i + 1, level: buffer.readUInt8(i + 1) };

      return data;
    },

    encode: function(data) {
      var channels = data.channels || [];
      var length = channels.length;
      var buffer = new Buffer(length + 1);

      buffer.writeUInt8(length, 0);

      for (var i = 0; i < length; i++)
        buffer.writeUInt8(channels[i].level, i + 1);

      return buffer;
    }
  },

  /* 5. Logic */

  // 5.1.1 Logic Control
  // 0xF116

  // 5.1.2 Response Logic Control
  // 0xF117

  // 5.1.3 Read Status of Logic Control
  // 0xF112

  // 5.1.4 Response Read Status of Logic Control
  // 0xF113

  // 5.1.5 Broadcast Status of Status of Logic Control
  // 0xF12F,

  // 5.1.6 Read System Date and Time
  // 0xDA00

  // 5.1.7 Response Read System Date and Time
  // 0xDA01

  // 5.1.8 Modify Read System Date and Time
  // 0xDA02

  // 5.1.9 Response Modify Read System Date and Time
  // 0xDA03

  // 5.1.10 Broadcast System Date and Time (Every Minute)
  // 0xDA44

  /* 6. Universal Switch */

  // 6.1.1 UV Switch Control
  0xE01C: {
    parse: function(data) {
      return {
        switch: data.readUInt8(0),
        status: Boolean(data.readUInt8(1))
      };
    },

    encode: function(data) {
      var buffer = new Buffer(2);

      buffer.writeUInt8(data.switch, 0);
      buffer.writeUInt8(data.status ? 255 : 0, 1);

      return buffer;
    }
  },

  // 6.1.2 Response UV Switch Control
  0xE01D: {
    parse: function(data) {
      return {
        switch: data.readUInt8(0),
        status: Boolean(data.readUInt8(1))
      };
    },

    encode: function(data) {
      var buffer = new Buffer(2);

      buffer.writeUInt8(data.switch, 0);
      buffer.writeUInt8(data.status ? 1 : 0, 1);

      return buffer;
    }
  }

  // 6.1.3 Read Status of UV Switch
  // 0xE018

  // 6.1.4 Response Read Status of UV Switch
  // 0xE019

  // 6.1.5 Broadcast Status of Status of UV Switches
  // 0xE017
};
