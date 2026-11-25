from typing import Protocol
import numpy as np
from .alignment import PhonemeAligner
from ..schemas import Phone

class PronunciationModel(Protocol):
    ready: bool
    def infer(self, samples: np.ndarray, text: str): ...

class PhonemeGenerator:
    def __init__(self, tokenizer): self.tokenizer = tokenizer
    def generate(self, text):
        ids = self.tokenizer(text, add_special_tokens=False).input_ids
        if self.tokenizer.unk_token_id in ids: raise ValueError('unknown_phoneme')
        return ids

class TargetVerifier:
    """No orthographic ASR is installed. Phone recognition is not word verification."""
    def verify(self): return None

class AcousticCTCModel:
    ready = False
    def __init__(self, settings):
        self.settings = settings
        self.reason = 'MODEL_PATH_not_set'
        if not settings.model_path: return
        try:
            import torch
            from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
            self.torch = torch
            self.processor = Wav2Vec2Processor.from_pretrained(settings.model_path, local_files_only=True)
            self.model = Wav2Vec2ForCTC.from_pretrained(settings.model_path, local_files_only=True,
                use_safetensors=not settings.model_allow_pickle).to(settings.device).eval()
            if self.processor.tokenizer.__class__.__name__ != 'Wav2Vec2PhonemeCTCTokenizer':
                raise ValueError('phoneme_tokenizer_required')
            self.generator = PhonemeGenerator(self.processor.tokenizer)
            self.generator.generate('three')  # Verify espeak at readiness, not first student request.
            self.ready = True
            self.reason = None
        except Exception as error:
            self.reason = type(error).__name__

    def infer(self, samples, text):
        torch = self.torch
        ids = self.generator.generate(text)
        inputs = self.processor(samples, sampling_rate=16000, return_tensors='pt')
        with torch.inference_mode():
            logits = self.model(inputs.input_values.to(self.settings.device)).logits[0]
            lp = logits.log_softmax(-1).cpu().numpy()
        tokenizer = self.processor.tokenizer
        blank = self.model.config.pad_token_id
        spans = PhonemeAligner().align(lp, ids, blank)
        allowed = [i for i in range(lp.shape[1]) if i not in tokenizer.all_special_ids and i != blank]
        seconds_per_frame = len(samples) / 16000 / len(lp)
        phones = []
        for token, span in zip(ids, spans):
            competitors = [i for i in allowed if i != token]
            # GOP-inspired log posterior margin on aligned frames, NOT a calibrated GOP score.
            margin = float(np.mean(lp[span, token] - lp[np.ix_(span, competitors)].max(axis=1)))
            phones.append(Phone(phoneme=tokenizer.convert_ids_to_tokens(token),
                start_seconds=span[0]*seconds_per_frame, end_seconds=(span[-1]+1)*seconds_per_frame,
                acoustic_log_margin=margin))
        greedy = []
        previous = None
        for token in lp.argmax(axis=1).tolist():
            if token != previous and token not in tokenizer.all_special_ids:
                greedy.append(tokenizer.convert_ids_to_tokens(token))
            previous = token
        return phones, greedy
