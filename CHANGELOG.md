## Unreleased

  * Fix `0x1C5F` Read Floor Heating Status Response parsing, verified
    against captures of a real type 213 module: byte 1 bit `0x20` is the
    control mode flag, now exposed as `heatingPowerMode` (true = "Heating
    power" / PWM, false = normal floor heating); byte 11 is the current
    output percentage, now exposed as `output`

**BREAKING:** 

  * `work.type` removed from `0x1C5F`, `0x1C5C` and `0x1C5D` in favor of
    `heatingPowerMode` (captures show it only mirrored the mode bit)
  * `0x1C5F`: `watering` removed (byte 11 is the output percentage);
    byte 12's meaning is unknown and always observed as `0x00`
  * byte 9 is the current temperature (not a valve flag),
    now exposed as a raw number `temperature.current` (observed `0x80`
    when no sensor is connected)
  * `valve` now reads byte 10 (was byte 9) and `PWD` (byte 10) removed

## 0.10.0

  * Accept the optional timer byte in `0x1946`
  * Add Device Discovery broadcast command (`0x000E`)
  * Add Floor Heating Extended Temperature commands (`0x7262`, `0x7263`)
  * Parse previously ignored fields of 8in1 (DeviceType315) Sensors Status
    response (`0xDB01`): `luxRange` and `uvSwitches`
  * Backward compatible: existing `movement`, `dryContacts` and `delay`
    fields are unchanged

## 0.9.0

  * Add Get Curtain Duration commands (`0xE800`, `0xE801`)
  * Add Dry Contact Multi-Channel Status command (`0x6F00`)
  * Add Dry Contact broadcast status commands (`0x15D0`, `0x15D1`)
  * Fix `0xE3E3` Curtain Status to support optional duration field
  * Add comprehensive test coverage for new commands
  * Maintain 100% backward compatibility with existing implementations

## 0.8.0

  * Update for Node.js v22 compatibility
  * Replace deprecated `new Buffer()` constructors with modern APIs
  * Update minimum Node.js version from >=0.12 to >=12.0.0
  * Update development dependencies (mocha, eslint, should, simple-mock)
  * Replace istanbul with nyc for test coverage

**BREAKING:**

  - Node.js version requirement increased from >=0.12 to >=12.0.0

## 0.7.0

  * Add Read Dry Contact Status commaands (`0x15CE`, `0x15CF`)

## 0.6.0

  * Allow to reuse same UDP address
  * Socket events on `Bus` instance
  * Enable UDP broadcast
  * Add address getter to `Device` instance
  * New API functions signature
  * Sender device decoupled from `Bus` class
  * Events on `Device` provides command object as a payload
  * `Channel` DSL removed
  * Keep command payload
  * Fix channels info for scene status commands (`0x0003`, `0xEFFF`)
  * Fix parsing of "Response Read Sensors Status" (`0x1605`)
  * Add Panel buttons control commands (`0xE012`, `0xE14E`)
  * Add AC Control commands (`0x193A`, `0x193B`)

**BREAKING:**

  - `bus.device()`, `bus.send()` and `device.send()` functions
    have new signature;
  - `device.send()` method now sends command **from** device
    to target;

    Refer to [`Send commands`](README.md#send-commands)
    readme section for details.

  - Now `Bus` object represents only and udp socket,
    sender device could be any device and must be initalized
    separately;

    Refer to [`Initialization`](README.md#initialization)
    readme section for details.

  - Events on `Device` instance have same payload as events on `Bus`;

  - `device.channel()` abstraction removed, listen for events manually;

    Refer to [`Complete example`](README.md#complete-example)
    readme section for details.

## 0.5.2

  * Floor heating parse add timer data only if present (#14)

## 0.5.1

  * Parse only integer part of temperature value for 0xE3E5 (#11)

## 0.5.0

  * Add Logic Control and Date Time commands

## 0.4.0

  * Add commands for Sequence, Scene, Area, Curtain Switch, Floor Heating,
    Panel Control, Sensors and Read Temperature sections of
    system specification
  * Add missing Channels and Universal Switch commands

## 0.3.0

  * URL syntax for configuration
  * Send commands without additional data
  * Outgoing commands logging

## 0.2.0

  * Universal Switch Control command
  * Fix `Bus` object address initialization
  * Reimplement `Channel` class as `EventEmitter`

**BREAKING:** `channel.level` is a simple property now,
use `channel.control` function instead.

## 0.1.1

  * Support old versions of nodejs (>=0.12)

## 0.1.0

  Base features:

  * Receive and send SmartBus commands
  * Simple DSL for "Single Channel Control" command
