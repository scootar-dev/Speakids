import json
from pathlib import Path
from .audio import AudioPreprocessor, SpeechQualityAnalyzer, AudioProblem
from .model import TargetVerifier
from ..schemas import Assessment, Feedback

class PronunciationScorer:
    # No human-calibration artifact exists yet. Never map model confidence to mastery.
    def score(self, phones): return None, False

class FeedbackEngine:
    def __init__(self):
        self.hints = json.loads(Path(__file__).with_name('hints.json').read_text(encoding='utf-8'))

    def feedback(self, status):
        if status in ('invalid_audio', 'no_speech'):
            return Feedback(title='Coba sekali lagi, ya!', message='Suaramu belum terdengar jelas. Coba lagi, ya!')
        if status in ('model_unavailable', 'processing_error'):
            return Feedback(title='Latihan tetap bisa dilanjutkan', message='Penilai suara belum tersedia. Coba lagi atau berlatih bersama pendamping.', suggested_action='retry_or_assist')
        return Feedback(title='Yuk, berlatih bersama!', message='Dengarkan contoh, lalu coba lagi atau minta bantuan pendamping.', suggested_action='replay_or_assist')

class AssessmentService:
    def __init__(self, settings, model):
        self.settings, self.model = settings, model
        self.audio, self.quality = AudioPreprocessor(), SpeechQualityAnalyzer()
        self.feedback, self.scorer = FeedbackEngine(), PronunciationScorer()

    def result(self, target, status, reason=None, **kwargs):
        return Assessment(assessment_status=status, target_text=target,
            model_version=self.settings.model_version, feedback=self.feedback.feedback(status), reason=reason, **kwargs)

    def assess(self, data, target, mode):
        try:
            samples = self.audio.process(data, self.settings.max_seconds)
            self.quality.check(samples)
        except AudioProblem as error:
            return self.result(target, error.status, error.reason)
        if mode in ('letter_name', 'phonics'):
            return self.result(target, 'unsupported', 'isolated_sound_requires_guided_practice')
        if not self.model.ready:
            return self.result(target, 'model_unavailable', 'model_not_ready')
        try:
            phones, recognized = self.model.infer(samples, target)
            score, can_pass = self.scorer.score(phones)
            return self.result(target, 'uncertain', 'child_pronunciation_calibration_required',
                phonemes=phones, recognized_phonemes=recognized, overall_score=score,
                can_pass=can_pass, target_match=TargetVerifier().verify())
        except ValueError:
            return self.result(target, 'uncertain', 'alignment_or_target_unsupported')
        except Exception:
            return self.result(target, 'processing_error', 'inference_failed')
