# SpeaKids Pronunciation Engine

## What actually works

FastAPI multipart endpoint, bounded WAV decode/resampling, energy/clipping checks, phone CTC inference adapter, real Viterbi alignment and acoustic margins, Indonesian deterministic feedback, auth/rate limiting, existing Flutter Android WebView microphone capture/upload/stop/replay and assisted progression.

**This is an uncalibrated acoustic research baseline, not a validated child pronunciation grader.** Model confidence is not converted into percentages. Every baseline inference returns uncertain, null pronunciation scores, and can_pass=false. Model absent returns model_unavailable. Phones come only from loaded acoustic inference; no fabricated production results. Normal ASR matching no longer controls microphone progression. Teacher assistance remains available and does not award game speaking stars.

## Run locally (Python 3.11 recommended)

From pronunciation_backend:
```sh
python -m venv .venv
# Linux: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements-model.txt
# Linux: apt install espeak-ng libsndfile1
python ml/download_model.py --output model_cache/phoneme
# Set MODEL_PATH to that directory; no automatic startup downloads.
```

Development API without auth, loopback ONLY:
```sh
DEV_NO_AUTH=true uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Windows PowerShell: `$env:DEV_NO_AUTH='true'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
Without weights server starts, /health returns 200, /ready returns 503 and assessments explicitly report model_unavailable. Model weights, eSpeak installation and inference are independent of HTTP service readiness.

### Official checkpoint in PyTorch format

The checked upstream revision `ae45363bf3413b374fecd9dc8bc1df0e24c3b7f4` supplies `pytorch_model.bin` (1,263,535,127 bytes), not safetensors. For these trusted weights, use `python ml/download_model.py --output model_cache/phoneme --allow-reviewed-pickle` and set `MODEL_ALLOW_PICKLE=true`. Default remains safetensors-only. Do not enable this option for untrusted checkpoints.

On Windows, install eSpeak NG and set `PHONEMIZER_ESPEAK_LIBRARY` to its `libespeak-ng.dll`, typically `C:\Program Files\eSpeak NG\libespeak-ng.dll`. The Python `espeakng` package alone does not install this library. Use a persistent virtual environment and model directory rather than relying on temporary caches.

Latest local verification: model loading returned `ready=True`; target `three` produced token IDs `[52, 27, 30]`. The subsequent audio inference check could not run because the temporary Python environment was no longer available. Model loading is verified; end-to-end acoustic inference and child accuracy are not yet verified.

Endpoints: GET /health, GET /ready, GET /api/v1/models/info, POST /api/v1/pronunciation/assess.
```sh
curl -F audio=@sample.wav -F target_text=three -F exercise_type=word http://127.0.0.1:8000/api/v1/pronunciation/assess
```
Supported upload: WAV PCM16 mono/stereo, 8–48 kHz, .25–12 seconds, <=2 MB. Normalized in memory to mono 16 kHz float waveform (PCM16 source). No MP3/WebM conversion. Client emits PCM16 WAV. Empty, corrupt, silent, clipped or weak audio never passes. Energy checks are not a validated noise/VAD classifier; noisy speech may yield uncertain acoustic evidence, never a negative pronunciation diagnosis.

## Existing Flutter integration

App architecture is Flutter shell + Kotlin WebView + HTML/JS learning screens. No new state framework. lib/main.dart supplies dart-define through platform-view creation params. Kotlin WebChromeClient handles audio permission only for appassets.androidplatform.net. assets/app/pronunciation.js records PCM, stops at 10 seconds or user stop, uploads, retries and retains one in-memory replay blob until next attempt/navigation. No raw audio is put into localStorage or progress history.

```sh
flutter run --dart-define=PRONUNCIATION_API_URL=https://your-server.example
```
Browser: set window.SPEAKIDS_PRONUNCIATION.baseUrl in assets/app/config.js; run node server.js. Android emulator reaches host via 10.0.2.2; physical HP requires reachable LAN hostname/IP or server DNS. WebView origin is HTTPS, so use a trusted HTTPS reverse proxy for development too; plain HTTP can be blocked as mixed content. Do not hardcode LAN IP into production. CORS must allow exact browser origin and https://appassets.androidplatform.net.

Connected: Vocabulary, Simple Sentences, Alphabet guided practice, Bicara & Skor. Daily was removed before this task and remains absent. Bottom navigation, pastel layout, levels and rewards remain. Two small recording actions use existing button styles. Uncertain/error does not increment score or finish pronunciation mission; explicit existing parent/teacher confirmation remains the alternative.

## Production auth and deployment

Use Supabase asymmetric JWT signing (ES256/RS256) and enable Anonymous Sign-Ins for a no-login student flow. Populate existing public Supabase config. Client requests an anonymous user session only for assessment and sends short-lived access token; refresh tokens remain under existing client storage policy. Never embed server secret/API key. Configure issuer, audience and JWKS URL in .env. Anonymous users are technical identities, not human verification; enable Supabase abuse protections. If anonymous signup is disabled, client shows retry/assistance; it does not bypass auth.

Copy .env.example to .env, populate it, provision reviewed model files into model_cache/phoneme, then `docker compose up --build -d`. Linux image includes eSpeak. Persistent weights are read-only host-mounted; restart does not download. One worker/one inference avoids uncontrolled concurrent RAM use. Reverse proxy terminates HTTPS, limits requests to 2 MB and rate-limits IPs; app also limits per subject (12/minute). In-memory limiter is single-instance; use shared gateway/Redis limits before scaling workers. Do not trust arbitrary X-Forwarded-For. Disable access body/header logging; do not log bearer tokens, target exercise identifiers or audio. Temporary multipart files are closed after processing and /tmp is ephemeral. Revoke development auth bypass in production.

Docker health checks liveness; /ready checks model loaded. CPU default. GPU deployment needs NVIDIA runtime and CUDA-enabled PyTorch, MODEL_DEVICE=cuda; supplied Compose is CPU. Docker/GPU and real child microphone tests must be verified on target server/devices.

## Tests and limits

`python -m pytest -q` tests API schemas, auth absence, rate limits, bounded invalid audio, silent/long recordings, alignment repeats, feedback and missing-model behavior. Synthetic signals/logits only in tests. Real model adapter is never replaced with mocks in production.

ML research/license/evaluation details: ml/README.md. No child calibration, accepted-variant lexicon, trained scoring head, phoneme-error classifier, human agreement study or automatic mastery thresholds shipped. These are substantive remaining research tasks, not hidden behind invented scores.
