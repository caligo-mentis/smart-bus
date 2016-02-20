module.exports = {
  '0x0031': {
    data: new Buffer('04640190', 'hex'),
    object: { channel: 4, level: 100, time: 400 }
  },

  '0x0032': [
    {
      data: new Buffer('0AF864', 'hex'),
      object: { channel: 10, level: 100, success: true }
    },
    {
      data: new Buffer('06F532', 'hex'),
      object: { channel: 6, level: 50, success: false }
    }
  ],

  '0xE01C': [
    { data: new Buffer('10FF', 'hex'), object: { switch: 16, status: true } },
    { data: new Buffer('0500', 'hex'), object: { switch: 5, status: false } }
  ]
  ]
};
