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
