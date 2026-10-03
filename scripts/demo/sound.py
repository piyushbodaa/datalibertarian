"""Sound for the demo video: a low pad plus effects at the composition's cues.

Usage: python3 sound.py cues.json out.wav
cues.json is {"duration": seconds, "cues": [[time, kind], ...]} as render.mjs writes it.
Standard library only; deterministic (fixed seed).
"""
import json
import math
import random
import struct
import sys
import wave

SR = 44100
random.seed(7)


def main(cue_path, out_path):
    spec = json.load(open(cue_path))
    dur = spec["duration"]
    n = int(dur * SR)
    buf = [0.0] * n

    def add(start, samples):
        i0 = int(start * SR)
        for j, v in enumerate(samples):
            if 0 <= i0 + j < n:
                buf[i0 + j] += v

    end_t = next((t for t, k in spec["cues"] if k == "end"), dur - 4)

    # Pad: D minor, opening to D major at the end card. Detuned pairs for width.
    minor = [73.42, 110.0, 146.83, 174.61, 220.0]
    major = [73.42, 110.0, 146.83, 185.0, 220.0]
    weights = [1.0, .7, .55, .4, .3]
    for i in range(n):
        t = i / SR
        env = min(1, t / 2.5) * min(1, (dur - t) / 2.0)
        swell = 1 + .5 * max(0, min(1, (t - end_t + 1.5) / 1.5))
        k = max(0, min(1, (t - end_t + .5) / 1.0))          # crossfade minor -> major
        lfo = .8 + .2 * math.sin(2 * math.pi * .13 * t)
        s = 0.0
        for f0, f1, w in zip(minor, major, weights):
            f = f0 if k == 0 else (f1 if k == 1 else None)
            if f is None:
                s += w * ((1 - k) * math.sin(2 * math.pi * f0 * t) + k * math.sin(2 * math.pi * f1 * t))
            else:
                s += w * .5 * (math.sin(2 * math.pi * f * t) + math.sin(2 * math.pi * f * 1.003 * t))
        buf[i] += .05 * env * swell * lfo * s

    def noise(length, amp, attack, decay, smooth):
        out, y = [], 0.0
        m = int(length * SR)
        for j in range(m):
            t = j / SR
            e = min(1, t / attack) * math.exp(-max(0, t - attack) / decay)
            y += smooth * (random.uniform(-1, 1) - y)                # one-pole low-pass
            out.append(amp * e * y)
        return out

    def click(amp):
        return [amp * math.exp(-j / (SR * .0015)) * (1 if j % 2 else -1) * .6 + amp * .4 * math.sin(2 * math.pi * 2400 * j / SR) * math.exp(-j / (SR * .004)) for j in range(int(.03 * SR))]

    def thud(amp):
        out, ph = [], 0.0
        for j in range(int(.45 * SR)):
            t = j / SR
            f = 45 + 55 * math.exp(-t / .04)
            ph += 2 * math.pi * f / SR
            out.append(amp * math.exp(-t / .12) * math.sin(ph))
        trans = noise(.06, amp * .5, .001, .015, .5)
        return [a + (trans[j] if j < len(trans) else 0) for j, a in enumerate(out)]

    for t, kind in spec["cues"]:
        if kind == "count":                                          # ticks that slow as the counter settles
            x = 0.0
            while x < 1.25:
                add(t + x, click(.07 * (1 - x / 1.6)))
                x += .035 + .09 * (x / 1.25) ** 2
        elif kind == "tick":
            add(t, click(.12))
        elif kind == "strike":
            add(t, noise(.4, .22, .03, .08, .35))
        elif kind == "swish":
            add(t - .15, noise(.6, .07, .18, .12, .12))
        elif kind == "rule":
            add(t, noise(.7, .045, .2, .2, .08))
        elif kind == "stamp":
            add(t + .22, thud(.55))
        elif kind == "end":
            add(t, thud(.35))

    peak = max(abs(v) for v in buf) or 1
    gain = .7 / peak                                                 # about -3 dBFS
    with wave.open(out_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v * gain)) * 32767)) for v in buf))
    print(f"sound: {out_path} ({dur:.1f}s, peak gain {gain:.2f})")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
