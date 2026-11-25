import io
import math
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

class AudioProblem(ValueError):
    def __init__(self, status, reason):
        self.status, self.reason = status, reason
        super().__init__(reason)

class AudioPreprocessor:
    """Decode bounded PCM WAV only. No shell commands or persistent recordings."""
    def process(self, data: bytes, max_seconds: float = 12):
        try:
            with sf.SoundFile(io.BytesIO(data)) as f:
                if f.format != 'WAV' or f.subtype != 'PCM_16' or f.channels not in (1, 2):
                    raise AudioProblem('invalid_audio', 'wav_pcm16_required')
                if not 8000 <= f.samplerate <= 48000 or not .25 <= f.frames / f.samplerate <= max_seconds:
                    raise AudioProblem('invalid_audio', 'duration_or_rate')
                samples = f.read(dtype='float32', always_2d=True).mean(axis=1)
                rate = f.samplerate
        except AudioProblem:
            raise
        except (RuntimeError, ValueError, sf.LibsndfileError) as e:
            raise AudioProblem('invalid_audio', 'decode_failed') from e
        if not np.isfinite(samples).all():
            raise AudioProblem('invalid_audio', 'non_finite')
        if rate != 16000:
            gcd = math.gcd(rate, 16000)
            samples = resample_poly(samples, 16000 // gcd, rate // gcd).astype(np.float32)
        return samples

class SpeechQualityAnalyzer:
    """Conservative recording checks, not a speech/noise classifier or accuracy model."""
    def check(self, samples):
        rms = float(np.sqrt(np.mean(samples ** 2)))
        if rms < .002:
            raise AudioProblem('no_speech', 'low_energy')
        if float(np.mean(np.abs(samples) >= .99)) > .03:
            raise AudioProblem('uncertain', 'clipped_audio')
        frames = samples[:len(samples)//320*320].reshape(-1, 320)
        energy = np.sqrt(np.mean(frames**2, axis=1))
        # Continuous energy can be fan noise, music or speech: refuse a quality judgement.
        if np.percentile(energy, 90) < .008:
            raise AudioProblem('uncertain', 'weak_signal')
        return {'rms': rms}
