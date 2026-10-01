"""Original ambient textures, generated locally for the offline prototype."""
from pathlib import Path
import wave
import numpy as np
rate, seconds = 22050, 24
n = rate * seconds
t = np.arange(n) / rate
rng = np.random.default_rng(121)
frequency = np.fft.rfftfreq(n, 1 / rate)
out = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
out.mkdir(parents=True, exist_ok=True)
def noise(slope, low=70, high=6500):
    spectrum = np.fft.rfft(rng.normal(0, 1, n))
    scale = np.maximum(frequency, low) ** (-slope)
    scale *= np.minimum(frequency / low, 1) ** 2
    scale *= np.exp(-(frequency / high) ** 4)
    sound = np.fft.irfft(spectrum * scale, n=n)
    return sound / max(np.std(sound), 1e-8)
for name in ['rain', 'ocean', 'forest', 'wind', 'fireplace', 'white-noise']:
    if name == 'rain':
        audio = noise(.28) * (.35 + .03 * np.sin(2 * np.pi * t / 12))
    elif name == 'ocean':
        audio = noise(.7, 45, 4000) * (.2 + .25 * (1 + np.sin(2 * np.pi * t / 8)) / 2)
    elif name == 'forest':
        audio = noise(.75, 110, 3200) * .18
        for start, pitch in [(2, 1700), (7, 2400), (13, 1900), (19, 2100)]:
            dt = t - start
            env = np.exp(-((dt - .18) / .12) ** 2)
            audio += .06 * env * np.sin(2 * np.pi * (pitch * dt + 350 * dt**2))
    elif name == 'wind':
        audio = noise(1.1, 50, 2300) * (.3 + .12 * np.sin(2 * np.pi * t / 12))
    elif name == 'fireplace':
        audio = noise(.8, 70, 4500) * .23
        for start in rng.uniform(0, seconds, 90):
            dt = t - start
            audio += .13 * np.exp(-np.maximum(dt, 0) * 190) * (dt >= 0) * rng.normal(0, 1, n)
    else:
        audio = noise(0, 150, 6000) * .3
    audio = np.tanh(audio * .45)
    fade = int(rate * .08)
    audio[:fade] *= np.linspace(0, 1, fade)
    audio[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(str(out / f'{name}.wav'), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(rate)
        f.writeframes((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())
    print(f'Created {name}.wav')
