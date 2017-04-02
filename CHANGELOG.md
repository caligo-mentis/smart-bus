## master

  * URL syntax for configuration
  * Send commands without additional data

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
