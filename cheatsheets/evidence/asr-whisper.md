# Evidence: cheatsheets/asr-whisper.md

Abbreviations: P06 = phases/06-speech-and-audio. L04 = P06/04-speech-recognition-asr, L05 = P06/05-whisper-architecture-finetuning, L14 = P06/14-voice-activity-detection-turn-taking, W07 = phases/07-transformers-deep-dive/10-audio-transformers-whisper, PJ = projects/voice-note-transcriber-pipeline. d = docs/en.md, c = code/main.py, S = PJ/solution.

## 代码中的任务 (task-table, 6)
- ctc_greedy(frame_probs): L04/c:16
- ctc_beam(frame_probs, beam_width=8): L04/c:27
- wer(ref, hyp): L04/c:50
- chunk_schedule(600.0, chunk_s=30.0, stride_s=5.0), 10-min clip: L05/c:34, 86-87
- TurnDetector(silence_hangover_ms=500, min_speech_ms=250): L14/c:39-40
- LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"]): L05/d:117-118

## Whisper 内部结构 (architecture, 7 nodes, 6 edges)
- Audio 16 kHz, clip/pad to 30 s: W07/d:28
- Log-mel 80 mels, ~3,000 frames: W07/d:28, L05/d:26
- Conv stem kernel 3, stride 2, 3,000 to 1,500: W07/d:32
- Encoder over 1,500 timesteps: W07/d:36
- Task tokens language, task, timestamps: L05/d:39-41
- Decoder causal self-attn + cross-attn: L05/d:28
- BPE tokens over a 51,865-token vocab: L05/d:29
- prompt as decoder prefix: W07/d:44, 56

## 用 Whisper 转写 (annotated-code, 10 lines)
- import whisper, load_model("large-v3-turbo"): L05/d:83-84
- model.transcribe with language, task, temperature, condition_on_previous_text: L05/d:85-91
- language="en" against LID drift: L04/d:155
- translate task gives English: L05/d:40
- temperature=0.0 overrides the fallback chain: L05/d:97
- prevents runaway repetition: L05/d:90
- result["text"], result["segments"], seg start/end/text: L05/d:92-94

## 更快的运行时与 VAD (annotated-code, 7 lines)
- from faster_whisper import WhisperModel, compute_type="int8_float16": W07/d:148-149
- 4× faster: W07/d:188
- model.transcribe("meeting.wav", vad_filter=True): W07/d:150
- silero_vad import, load_silero_vad(): L14/d:75-77
- get_speech_timestamps(... sampling_rate=16000, threshold=0.5, min_speech_duration_ms=250, min_silence_duration_ms=500, speech_pad_ms=300): L14/d:79-85

## ASR 建模方式 (concepts, 7)
- CTC per-frame tokens plus blank, no internal LM, non-autoregressive fast: L04/d:16, 26-28
- greedy collapse repeats, drop blanks, a a _ _ a b b _ c to a a b c: L04/d:73
- RNN-T predictor + joiner, streamable, internal LM: L04/d:30-32
- attention enc-dec best offline, cannot stream without engineering: L04/d:36
- WER (S + D + I) / N, above 20% unusable, below 5% human parity: L04/d:40
- Turbo 4-layer decoder from 32, 8×, <1% WER hit: L05/d:31
- prompt tokens startoftranscript, en, transcribe/translate, notimestamps: L05/d:36-41

## 默认值 (defaults, 7)
- temperature 0.0, fallback chain: L05/d:97
- condition_on_previous_text False, cascading hallucination: L05/d:97
- no_speech_threshold 0.6 silence detection: L05/d:97
- Silero threshold 0.5 default, 0.3 sensitive: L14/d:34
- min speech 250 ms, coughs or chair noise: L14/d:35, 82
- silence hangover 500-800 ms, too short interrupts, too long sluggish: L14/d:36
- pre-roll 300-500 ms, prevents "hey" being clipped: L14/d:37

## 运行项目 (annotated-code, 6 lines)
- project_test.py --init my-voice-pipeline: PJ/README.md:8
- project_test.py --all --solution --strict: PJ/README.md:10
- cd projects/voice-note-transcriber-pipeline/solution: PJ/README.md:11
- pipeline.py --input fixtures/repair-note.wav --transcript-file fixtures/reference.json --out voice-output: PJ/README.md:12
- ffmpeg -i YOUR_NOTE.m4a -ac 1 -ar 16000 -c:a pcm_s16le YOUR_NOTE.wav: PJ/README.md:32
- pipeline.py --endpoint ... --model YOUR_MODEL: PJ/README.md:24

## 项目流水线 (flow, 6 steps)
1. decode_wav mono, sampwidth 2, comptype NONE, divide by 32768: S/pcm.py:13-29
2. activity frame_ms=20, threshold=0.02, min_ms=40, gap_ms=40, RMS, merge, drop short: S/activity.py:11, 22-34. Only with --segment: S/pipeline.py:115-118
3. transcribe encode_wav per span, retry TimeoutError, retries=1, audio_sha256, attempts: S/transcribe.py:12, 27-44
4. http_recognizer multipart model and file fields, 1 MB response limit, timeout=30: S/provider.py:63, 85, 102-103
5. captions WEBVTT header, stamp hh:mm:ss.mmm, overlapping cue fails: S/captions.py:12-23, 27, 40-41
6. export_transcript writes transcript.json, captions.vtt, audio.wav, index.html: S/pipeline.py:15, 30-32, 53

## 项目参数 (command-table, 6)
- --input, 20 MB: S/pipeline.py:61, 86-87, PJ/README.md:29
- --out default voice-output: S/pipeline.py:62
- --transcript-file bound to audio SHA256: S/pipeline.py:68-72
- --endpoint uploads the selected audio: S/pipeline.py:64-67, PJ/README.md:21
- --segment split by acoustic energy: S/pipeline.py:79-83
- --review-file edited transcript.json: S/pipeline.py:73-77

## 故障排查 (troubleshooting, 8)
- "Thanks for watching!" on silence, VAD-gate: L04/d:153, L05/d:159
- LID drift to Japanese or Welsh, force language="en": L04/d:155
- condition_on_previous_text cascade, set False: L05/d:160
- short clip padded to 30 s, pad=False or VAD-gate: L05/d:161
- librosa mels, whisper.audio.log_mel_spectrogram: L05/d:162
- too-short hangover interrupts, 500-800 ms, semantic endpointing: L14/d:144, 147
- "16-bit mono PCM required": S/pcm.py:20, convert with ffmpeg: PJ/README.md:29-32
- "Remote endpoints require HTTPS", HTTP only for loopback: S/provider.py:54-55, PJ/README.md:27

## 问题 (qa, 5)
- freeze the encoder under 10 hours: L05/d:68
- 10–100 hours of target-domain audio: L05/d:65
- external LM via beam search, CTC has no internal LM: L04/d:28
- flush trick 500 ms buffer in ~125 ms: L14/d:41
- energy gate -40 dBFS fires on any noise, no place in production: L14/d:26, 54
