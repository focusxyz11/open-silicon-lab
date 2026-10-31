# Runs the MicroPython bench firmware on a computer, for tests. The board's pins are pretend pins
# wired to a pretend 74HC00 (four NAND gates): chip input k is driven by ui pin k, and output pin k
# reads gate k. With --broken, gate 2's output is stuck at 0, like a damaged chip.
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'hw', 'firmware'))
import obp_bench as fw

broken = '--broken' in sys.argv
profile = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'pico'
drive = {}


class Pin:
    def __init__(self, gpio, output):
        self.gpio, self.output = gpio, output

    def value(self, v=None):
        if v is not None:
            drive[self.gpio] = v
            return None
        p = fw.PROFILES[profile]
        k = p['uo'].index(self.gpio)
        if k >= 4:
            return 0
        a = drive.get(p['ui'][2 * k], 0) if 2 * k < len(p['ui']) else 0
        b = drive.get(p['ui'][2 * k + 1], 0) if 2 * k + 1 < len(p['ui']) else 0
        y = 0 if (a and b) else 1
        return 0 if (broken and k == 2) else y


fw.serve(fw.Bench('host-' + profile, fw.PROFILES[profile], Pin))
