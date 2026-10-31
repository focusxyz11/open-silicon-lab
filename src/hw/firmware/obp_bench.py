# Open Bench Protocol (OBP/0) firmware for MicroPython boards: ESP32 (all kinds), Raspberry Pi Pico
# and Pico 2, and any other board that runs MicroPython. Part of Open Silicon Lab (MIT License).
#
# What it does: the board becomes a pin driver on the lab's bench (https://focusxyz11.github.io/
# open-silicon-lab/#bench). It sets the input pins of a chip you wired up (for example a 74HC00 with
# four NAND gates on a breadboard), reads the chip's output pins, and answers the lab over USB.
#
# Install: copy this file to the board as main.py (Thonny, mpremote, or the bench's "Install the
# bench program" button). It starts by itself at power-up. Press Ctrl-C in a terminal to get the
# Python prompt back. The full protocol is docs/HARDWARE.md in the repository.
#
# SAFETY: ESP32 and Pico pins are 3.3 V and NOT 5 V tolerant. Power the chip under test from the
# board's 3V3 pin, never from 5 V. 74HC chips work from 2 V to 6 V, so they are fine at 3.3 V.

import sys

VERSION = 0

# Which GPIO drives each input of the chip (ui_in[0], ui_in[1], ...) and which GPIO reads each of
# its outputs (uo_out[0], ...). Chosen to avoid pins boards need for starting up, flash memory and
# USB. Check your board's pinout and edit a line if your board differs.
PROFILES = {
    'pico':    {'ui': [0, 1, 2, 3, 4, 5, 6, 7], 'uo': [8, 9, 10, 11, 12, 13, 14, 15], 'clk': 16, 'rst': 17},
    'esp32s3': {'ui': [4, 5, 6, 7, 15, 16, 17, 18], 'uo': [8, 9, 10, 11, 12, 13, 14, 21], 'clk': 1, 'rst': 2},
    'esp32':   {'ui': [4, 13, 14, 18, 19, 21, 22, 23], 'uo': [25, 26, 27, 32, 33, 34, 35, 36], 'clk': None, 'rst': None},
    'esp32c3': {'ui': [0, 1, 3, 4], 'uo': [5, 6, 7, 10], 'clk': None, 'rst': None},
}
PROFILE = None   # set to one of the names above to override the automatic choice


def detect():
    """Pick a pin profile from the chip MicroPython reports."""
    try:
        import os
        m = os.uname().machine.upper()
    except Exception:
        return 'pico'
    if 'RP2040' in m or 'RP2350' in m:
        return 'pico'
    if 'ESP32C3' in m or 'ESP32-C3' in m:
        return 'esp32c3'
    if 'ESP32S3' in m or 'ESP32-S3' in m:
        return 'esp32s3'
    if 'ESP32' in m:
        return 'esp32'
    return 'pico'


def demo_74hc00(ui):
    """A pretend 74HC00 inside the firmware: y_k = NOT (a_k AND b_k), with a_k, b_k on ui bits 2k, 2k+1.
    Lets you check the connection before wiring anything."""
    uo = 0
    for k in range(4):
        a = (ui >> (2 * k)) & 1
        b = (ui >> (2 * k + 1)) & 1
        uo |= (0 if (a and b) else 1) << k
    return uo


class Bench:
    """The protocol, separate from the hardware so it can be tested on a computer.
    make_pin(gpio, output) returns an object with value() and value(v)."""

    def __init__(self, board, profile, make_pin):
        self.board = board
        self.ui_pins = [make_pin(g, True) for g in profile['ui']]
        self.uo_pins = [make_pin(g, False) for g in profile['uo']]
        self.clk = make_pin(profile['clk'], True) if profile.get('clk') is not None else None
        self.rst = make_pin(profile['rst'], True) if profile.get('rst') is not None else None
        if self.rst:
            self.rst.value(1)          # reset is active low: 1 = run
        self.ui = 0
        self.design = 'pins'
        self.set_in(0)

    def set_in(self, v):
        self.ui = v & 255
        for i, p in enumerate(self.ui_pins):
            p.value((self.ui >> i) & 1)

    def get_out(self):
        if self.design == 'demo-74hc00':
            return demo_74hc00(self.ui) & ((1 << len(self.uo_pins)) - 1)
        v = 0
        for i, p in enumerate(self.uo_pins):
            v |= (p.value() & 1) << i
        return v

    def handle(self, line):
        line = line.strip()
        if not line:
            return ''
        parts = line.split()
        cmd = parts[0].upper()
        arg = parts[1] if len(parts) > 1 else None
        if cmd == 'HELLO':
            return 'OK OBP/%d board=%s in=%d out=%d%s' % (VERSION, self.board, len(self.ui_pins), len(self.uo_pins), ' clk=1' if self.clk else '')
        if cmd == 'IN':
            try:
                v = int(arg, 16)
            except Exception:
                return 'ERR IN needs a hex value 00-FF'
            if not 0 <= v <= 255 or len(arg) > 2:
                return 'ERR IN needs a hex value 00-FF'
            self.set_in(v)
            return 'OK'
        if cmd == 'OUT?':
            return 'OK %02X' % self.get_out()
        if cmd == 'CLK':
            try:
                n = 1 if arg is None else int(arg)
            except Exception:
                n = 0
            if not 1 <= n <= 1000000:
                return 'ERR CLK needs a count 1-1000000'
            if self.clk:
                for _ in range(n):
                    self.clk.value(1)
                    self.clk.value(0)
            return 'OK'
        if cmd == 'RST':
            if self.rst:
                self.rst.value(0)
                self.rst.value(1)
            return 'OK'
        if cmd == 'LIST?':
            return 'OK pins demo-74hc00'
        if cmd == 'SEL':
            if arg in ('pins', 'demo-74hc00'):
                self.design = arg
                return 'OK'
            return 'ERR no design %s' % arg
        return 'ERR unknown command %s' % cmd


def machine_pin(gpio, output):
    import machine
    if output:
        return machine.Pin(gpio, machine.Pin.OUT)
    try:
        return machine.Pin(gpio, machine.Pin.IN, machine.Pin.PULL_DOWN)
    except Exception:            # some pins (ESP32 GPIO 34-39) have no pull resistors
        return machine.Pin(gpio, machine.Pin.IN)


def serve(bench, read_line=None, write=None):
    """Answer one line at a time until the input ends (or forever, on a board)."""
    read_line = read_line or sys.stdin.readline
    write = write or (lambda s: sys.stdout.write(s))
    while True:
        line = read_line()
        if not line:
            break
        reply = bench.handle(line)
        if reply:
            write(reply + '\n')
            try:
                sys.stdout.flush()
            except Exception:
                pass


def main():
    name = PROFILE or detect()
    serve(Bench(name, PROFILES[name], machine_pin))


if __name__ == '__main__' and sys.implementation.name == 'micropython':
    main()
