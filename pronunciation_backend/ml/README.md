# Model research and development

## Selection

Selected: facebook/wav2vec2-lv-60-espeak-cv-ft. Model card checked before any weight download: https://huggingface.co/facebook/wav2vec2-lv-60-espeak-cv-ft (Apache-2.0, Common Voice phonetic labels, 16 kHz). Uses eSpeak en-us tokenization, not character ASR. CPU supported; large model needs several GB memory. GPU uses MODEL_DEVICE=cuda with matching PyTorch/CUDA installation. Reference accent is American English; alternate acceptable pronunciations are not yet enumerated. Consequently no automated rejection or accent correction is issued.

Wav2Vec2/XLS-R are acoustic backbones, not trained pronunciation raters. Selected checkpoint gives real frame-level phone posteriors. CTC Viterbi aligns canonical phones, then computes mean target log posterior minus strongest competing non-special phone posterior. This GOP-inspired diagnostic is not classical Kaldi GOP, not a calibrated percentage, and not proof of correctness. Returned only as acoustic_log_margin; all score fields remain null and status uncertain.

GOPT was reviewed: https://github.com/YuanGongND/gopt . It needs the matching 84-dimensional Kaldi GOP feature pipeline, canonical phone IDs and padding. Public checkpoint performance cannot be reproduced by feeding arbitrary Wav2Vec2 scores. GOPT is NOT included, nor are its weights licensed for production here. Repository documents an inference bug; code/weight license and pipeline must be independently resolved before adoption. Its reported SpeechOcean performance is not evidence for Indonesian children.

Forced alignment alone cannot establish pronunciation. Ordinary ASR/Whisper text similarity is not used. TargetVerifier intentionally returns unknown without a separately validated word verifier. Letter names and phonics return guided-practice unsupported, never word scores. There is no phoneme-specific correction until supervised calibration justifies it.

## Licenses

SpeaKids custom code is separate from third-party weights. Wav2Vec2 checkpoint: Apache-2.0; PyTorch BSD-style; Transformers Apache-2.0; phonemizer GPL-3.0 and eSpeak NG GPL-3.0-or-later require license/source compliance when distributing containers. Do not label third-party weights as solely owned by SpeaKids. Review dependencies and notices before redistributing.

SpeechOcean762: upstream OpenSLR 101 lists CC BY 4.0 and human phone/word/utterance labels. https://www.openslr.org/101/ . L2-ARCTIC: review exact release license at https://psi.engr.tamu.edu/l2-arctic-corpus/ before obtaining; phone error annotations are not universal continuous quality ratings. Common Voice terms vary by release; transcripts are not pronunciation-quality labels. No datasets are downloaded by these scripts.

## Reproducible development plan

1. Record dataset provenance, release hash, license, consent and retention requirements before ingestion. Split by speaker into train/dev/test; keep Indonesian-child evaluation speakers isolated.
2. Normalize PCM with app.services.audio.AudioPreprocessor. Preserve original labels and accent variants; map phone inventory explicitly to selected tokenizer, report unmapped symbols rather than substituting.
3. Export real aligned margins plus phone IDs, model revision, timestamps and human ratings to JSONL. Retain no student recordings by default. Collect research recordings only through a separate consented workflow.
4. Fine-tuning acoustic model is technically supported via Wav2Vec2ForCTC and labelled phone sequences. It improves phone recognition, not automatically pronunciation scoring. A supervised scoring head/calibration must be trained against human ratings with independent validation before replacing PronunciationScorer. No training run or calibration artifact currently exists.
5. Run evaluate.py on held-out predictions with training speaker IDs. Report coverage/abstention, PCC, false acceptance/rejection, phone errors, noise/child groups and latency. Missing scores stay missing. Threshold selection belongs to development data; freeze before test evaluation.
6. Store immutable checkpoint hash, tokenizer, preprocessing, dataset manifests and calibration version together. No universal passing threshold is shipped.

Download command (explicit, license checked, pinned upstream revision):
`python ml/download_model.py --output model_cache/phoneme`

Safetensors is the default. Upstream revision ae45363bf3413b374fecd9dc8bc1df0e24c3b7f4 provides pytorch_model.bin instead. Downloading that format requires --allow-reviewed-pickle; loading requires MODEL_ALLOW_PICKLE=true. Only use trusted, reviewed weights. Set MODEL_PATH only after assets and eSpeak are installed. Real inference smoke test: start backend and submit a consented local PCM WAV using curl as documented in main README. A synthetic tone is not evidence of pronunciation accuracy.
