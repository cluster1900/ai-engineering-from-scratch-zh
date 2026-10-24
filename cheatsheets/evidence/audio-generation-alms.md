# Evidence: cheatsheets/audio-generation-alms.md

Abbreviations: L09 = phases/06-speech-and-audio/09-music-generation, L10 = phases/06-speech-and-audio/10-audio-language-models, G11 = phases/08-generative-ai/11-audio-generation, M19 = phases/12-multimodal-ai/19-audio-language-whisper-to-af3, M20 = phases/12-multimodal-ai/20-omni-models-thinker-talker. d = docs/en.md, c = code/main.py.

## 音频变成 codec token (architecture, 6 nodes, 5 edges)
- Waveform 16-48 kHz: G11/d:3
- Encoder conv, per-timestep vector: G11/d:26, 29-30
- RVQ, 8 codebooks at 75 Hz, indices: G11/d:26, 31-34
- Generator token-AR or diffusion: G11/d:18, 39-41
- Codec decoder reverses the encoder: G11/d:26
- Audio out: G11/d:18, 26

## 关键数字 (concepts, 7)
- 8 RVQ codebooks at 75 Hz = 600 tokens/sec: G11/d:26
- ~75 tokens/second, ≥75 tokens/sec per user: G11/d:132
- 50 Hz speech tokens, Talker ≥50 tok/s: M20/d:89
- codebook 1024 or 2048 typical: G11/d:123
- EnCodec 32 kHz, 4 codebooks: L09/d:24, 164
- (3000, 80) for 30 s at 100 Hz: M19/d:38
- below 500ms user stops noticing lag: M20/d:24

## 两类生成器 (concepts, 6)
- token-autoregressive, decoder-only transformer over flattened RVQ tokens: G11/d:39
- delayed parallel, K streams with per-stream offsets: G11/d:39
- VALL-E text prompt plus 3-second voice sample: G11/d:39
- Stable Audio Open latent diffusion on compressed audio, loops: L09/d:30
- Stable Audio 2.5 flow matching on continuous audio latents: G11/d:41
- flow matching wins music, token-AR dominates speech: G11/d:43

## MusicGen、旋律与 FAD (annotated-code, 11 lines)
- import, get_pretrained, set_generation_params, generate, torchaudio.save 32000: L09/d:81-87
- small 300M fast: L09/d:90
- torchaudio.load, generate_with_chroma, melody.squeeze(), sr: L09/d:95-100
- preserves tune, swaps timbre: L09/d:103
- FrechetAudioDistance, get_fad_score: L09/d:108-111
- VGGish distance: L09/d:114. lower is better: L09/d:40

## 音频-语言模型模板 (flow, 6)
1. audio encoder options Whisper, BEATs, CLAP, WavLM: L10/d:29
2. projector linear or MLP into LLM embedding space: L10/d:30
3. LLM decoder, interleaved text + audio tokens, generates text: L10/d:31
4. Stage 1 freeze encoder + LLM, projector on ASR / captioning: L10/d:35
5. Stage 2 full / LoRA fine-tune on instruction tasks: L10/d:36
6. Stage 3 optional speech decoder for voice-in / voice-out: L10/d:37

## 投影器与音频 Q-former (annotated-code, 10 lines)
- AudioProjector class, audio_dim=1280, llm_dim=4096, down/act/up, forward: L10/d:116-124
- QFormer(n_queries=8, hidden=20), N=8 queries: M19/c:114, 117
- qf.forward(frames), 99 frames in, 8 tokens out: M19/c:116, 118-120

## Log-Mel 与编码器设置 (defaults, 7)
- 16 kHz resample: M19/d:32
- 25ms window, win_ms: int = 25: M19/d:33, M19/c:25
- 10ms hop, hop_ms: int = 10, 100 Hz frame rate: M19/d:33, 38, M19/c:25
- 80 Mel filters 0-8000 Hz: M19/d:35
- math.log(1 + x) dynamic range: M19/c:70, M19/d:36
- 32 or 64 queries, AF3 uses 64: M19/d:58, 70
- Whisper encoder 12-layer, frozen in ALM pattern: M19/d:42, 46

## Thinker 与 Talker (architecture, 5 nodes, 4 edges)
- Mic and VAD, speech tokenization: M20/d:19
- Thinker 7B-80B text: M20/d:33. TMRoPE in Thinker: M20/d:48-50
- Talker 200M-1B, discrete speech tokens (residual-VQ indices): M20/d:34
- Speech decoder SNAC, MoVQGAN, audio samples: M20/d:35
- streaming between stages: M20/d:39-44

## 7B 下的 TTFAB 预算 (defaults, 8)
- mic to audio tokens 40-80ms: M20/d:77
- prefill 100-200ms at 7B, more at 70B: M20/d:78
- first Thinker text token 40ms: M20/d:79
- Talker first text token 20ms: M20/d:80
- first speech tokens commit 40ms: M20/d:81
- residual-VQ decode 30ms, rvq_decode = 30: M20/d:82, M20/c:42
- waveform decode 50-80ms, wave_decode = 70: M20/d:83, M20/c:45
- total 320-510ms at 7B, 600-900ms at 70B: M20/d:85

## 故障排查 (troubleshooting, 8)
- loops past 30 s, crossfade or ACE-Step: L09/d:140
- tempo drift, BPM tags, librosa beat_track: L09/d:141
- mushy words, commercial API or fine-tune: L09/d:142
- hallucinations on silence, Whisper encoder, VAD-gate: L10/d:160
- past 10 minutes speaker attribution breaks, diarize first: L10/d:159
- multi-audio random-chance level, 25%: L10/d:66, 158
- RVQ error accumulation, temperature 0 on higher layers: G11/d:89
- artifacts at boundaries, careful overlap-add: G11/d:91

## 代码中的任务 (task-table, 7)
- AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B"): L10/d:95
- model.generate(**inputs, max_new_tokens=200): L10/d:107
- load_dataset("gamma-lab-umd/MMAU-Pro", split="test"): L10/d:133
- evaluate_mmau_pro_comprehensive.py: L10/d:143
- window_frames(wave, 16000, 25, 10): M19/c:77
- ttfab(cfg): M20/c:26
- generate(counts, style, start, length, rng, temperature=1.0): G11/c:45

## 问答 (qa, 6)
- cascade if transcription, no music, no emotion: M19/d:93
- end-to-end for music, emotion, multi-speaker, complex reasoning: M19/d:94
- cascade loses mood, speaker, timing, deepfake cues: M19/d:82-85
- 7B Talker falls behind 50 tok/s: M20/d:89
- TMRoPE absolute timestamps across vision, audio, text: M20/d:50, 125
- Qwen2.5-Omni half-duplex default, Moshi full-duplex: M20/d:65, 67

## 提示 (tips, 5)
- generate instrumental only: L09/d:66
- watermarks + metadata: L09/d:69
- report each category separately: L10/d:144
- codec caps quality, DAC open best: G11/d:88
- abuse detection + opt-out lists: G11/d:93
