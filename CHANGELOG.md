## Unreleased

  * Fix `0x1C5F` Read Floor Heating Status Response parsing, verified
    against captures of a real type 213 module: byte 1 bit `0x20` is the
    control mode flag, now exposed as `heatingPowerMode` (true = "Heating
    power" / PWM, false = normal floor heating); byte 11 is the current
    output percentage, now exposed as `output`
  * **BREAKING:** `work.type` removed (captures show it only mirrored the
    mode bit) and `watering` removed (byte 11 is the output percentage);
    byte 12's meaning is unknown and always observed as `0x00`
  * **BREAKING:** byte 9 is the current temperature (not a valve flag),
    now exposed as a raw number `temperature.current` (observed `0x80`
    when no sensor is connected)

## 0.10.0

  * Accept the optional timer byte in `0x1946`
  * Add Device Discovery broadcast command (`0x000E`)
  * Add Floor Heating Extended Temperature commands (`0x7262`, `0x7263`)
  * Parse previously ignored fields of 8in1 (DeviceType315) Sensors Status
    response (`0xDB01`): `luxRange` and `uvSwitches`
  * Backward compatible: existing `movement`, `dryContacts` and `delay`
    fields are unchanged

## 0.9.0
