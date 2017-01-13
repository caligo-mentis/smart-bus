module.exports = {
  0x0031: require('./single_channel_control'),
  0x0032: require('./response_single_channel_control'),
  0x0033: require('./read_status_of_channels'),
  0x0034: require('./response_read_status_of_channels'),

  0xE01C: require('./uv_switch_control'),
  0xE01D: require('./uv_switch_response'),
  0xE018: require('./uv_switch_read'),
  0xE019: require('./uv_switch_response'),

  0x0000: require('./read_scene_information'),
  0x0001: require('./response_read_scene_information'),
  0x0002: require('./scene_control'),
  0x0003: require('./response_scene_control'),
  0x000C: require('./read_status_of_scene'),
  0x000D: require('./response_read_status_of_scene'),

  0x001A: require('./sequence_control'),
  0x001B: require('./response_sequence_control'),
  0xE014: require('./read_status_of_sequence'),
  0xE015: require('./response_sequence_control'),

  0xE3E0: require('./curtain_switch_control'),
  0xE3E1: require('./response_curtain_switch_control'),
  0xE3E2: require('./read_status_of_curtain_switch'),
  0xE3E3: require('./response_curtain_switch_control'),

  0xE3D8: require('./panel_control'),
  0xE3D9: require('./response_panel_control'),
  0xE3DA: require('./read_status_of_panel_control'),
  0xE3DB: require('./response_panel_control'),

  0x1944: require('./read_floor_heating_status_DLP'),
  0x1945: require('./response_read_floor_heating_status_DLP'),
  0x1946: require('./control_floor_heating_status_DLP'),
  0x1947: require('./response_control_floor_heating_status_DLP'),

  0x1C5E: require('./read_floor_heating_status_FHM'),
  0x1C5F: require('./response_read_floor_heating_status_FHM'),
  0x1C5C: require('./control_floor_heating_status_FHM'),
  0x1C5D: require('./response_control_floor_heating_status_FHM'),

  0xE3E7: require('./read_temperature'),
  0xE3E8: require('./response_read_temperature')
};



// Broadcast Sensors Status Automatically
// 0x1647: function(data) {
//   return {
//     temperature: data.readUInt8(0) - 20,
//     brightness: data.readUInt8(1) * 256 + data.readUInt8(2),
//     motionSensor: data.readUInt8(3),
//     sonic: data.readUInt8(4),
//     dryContact1: data.readUInt8(5),
//     dryContact2: data.readUInt8(6)
//   };
// }

// 0x000E Invoke fast search. Broadcast target (255.255)
// 0xE3E5 Broadcast Temperature
