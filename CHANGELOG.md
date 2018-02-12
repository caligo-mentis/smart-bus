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
