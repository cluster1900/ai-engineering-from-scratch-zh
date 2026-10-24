---
id: asr-whisper
title: Speech Recognition and Whisper
code: SR
subtitle: 解码 CTC，运行并调优 Whisper，用 VAD 把关，交付一条从 WAV 到字幕的流水线。
hue: 265
sources: phases/06-speech-and-audio/04-speech-recognition-asr, phases/06-speech-and-audio/05-whisper-architecture-finetuning, phases/07-transformers-deep-dive/10-audio-transformers-whisper, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking, projects/voice-note-transcriber-pipeline
source_hash: 778a930fb3a9e490
---

## 代码中的任务
type: task-table
from: phases/06-speech-and-audio/04-speech-recognition-asr/code/main.py, phases/06-speech-and-audio/04-speech-recognition-asr/docs/en.md, phases/06-speech-and-audio/05-whisper-architecture-finetuning/code/main.py, phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md, phases/07-transformers-deep-dive/10-audio-transformers-whisper/code/main.py, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/code/main.py
span: 2

| 任务 | 代码 |
|---|---|
| 贪心 CTC 解码 | `ctc_greedy(frame_probs)` |
| 束搜索 CTC 解码 | `ctc_beam(frame_probs, beam_width=8)` |
| 词错误率 | `wer(ref, hyp)` |
| 为 10 分钟音频规划分块 | `chunk_schedule(600.0, chunk_s=30.0, stride_s=5.0)` |
| 轮次结束状态机 | `TurnDetector(silence_hangover_ms=500, min_speech_ms=250)` |
| 在注意力上做 LoRA | `LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"])` |

## Whisper 内部结构
type: architecture
from: phases/07-transformers-deep-dive/10-audio-transformers-whisper/docs/en.md, phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md

```arch
node | audio | 1,1 | Audio | 16 kHz, pad or clip to 30 s | client
node | mel | 2,1 | Log-mel | 80 mels x 3000 frames | process
node | stem | 3,1 | Conv stem | kernel 3, stride 2 | process
node | enc | 4,1 | Encoder | 1500 timesteps | model
node | prompt | 3,2 | Task tokens | language, task, timestamps | store
node | dec | 4,2 | Decoder | causal self-attn + cross-attn | model
node | text | 2,2 | BPE tokens | 51,865-token vocab | client
edge | audio | mel |
edge | mel | stem |
edge | stem | enc | 1500
edge | enc | dec | cross-attn
edge | prompt | dec | prefix
edge | dec | text |
```

## 用 Whisper 转写
type: annotated-code
lang: python
from: phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav",
    language="en",                     # stops LID drift
    task="transcribe",                 # or <|translate|> to English
    temperature=0.0,                   # no sampling fallback
    condition_on_previous_text=False)  # prevents runaway repetition
print(result["text"])
for seg in result["segments"]:         # start, end, text per segment
    print(seg["start"], seg["end"], seg["text"])
```

## 更快的运行时与 VAD
type: annotated-code
lang: python
from: phases/07-transformers-deep-dive/10-audio-transformers-whisper/docs/en.md, phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md
span: 2

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")  # 4x faster
segments, info = model.transcribe("meeting.wav", vad_filter=True)    # VAD gate
from silero_vad import load_silero_vad, get_speech_timestamps
vad = load_silero_vad()
segments = get_speech_timestamps(audio, vad, sampling_rate=16000, threshold=0.5,
    min_speech_duration_ms=250, min_silence_duration_ms=500, speech_pad_ms=300)
```

## ASR 建模方式
type: concepts
from: phases/06-speech-and-audio/04-speech-recognition-asr/docs/en.md, phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md, phases/07-transformers-deep-dive/10-audio-transformers-whisper/docs/en.md

- **CTC**：逐帧 token 加一个空白符。没有内部语言模型。速度快。
- **贪心 CTC**：合并重复、去掉空白。`a a _ _ a b b _ c` 得到 `a a b c`。
- **RNN-T**：预测器加联合器。可流式，带内部语言模型。
- **注意力编解码器**：离线质量最佳。不经工程改造无法流式。
- **WER**：$(S + D + I) / N$。高于 20% 不可用。低于 5% 达到人类水平。
- **Turbo**：4 层解码器（原为 32 层）。快 8×，WER 损失 <1%。
- **提示**：`<|startoftranscript|>` `<|en|>` `<|transcribe|>` 或 `<|translate|>`，然后 `<|notimestamps|>`。

## 默认值
type: defaults
from: phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md, projects/voice-note-transcriber-pipeline/solution/pipeline.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `temperature` | 0.0 | 覆盖回退链 |
| `condition_on_previous_text` | False | 阻止幻觉级联 |
| `no_speech_threshold` | 0.6 | 静音检测 |
| Silero `threshold` | 0.5 | 0.3 较敏感 |
| `min_speech_duration_ms` | 250 | 过滤咳嗽和椅子噪声 |
| 静音拖尾 | 500-800 ms | 较短会打断用户，较长显得迟钝 |
| 预录缓冲 | 300-500 ms | 保住第一个词 |

## 运行项目
type: annotated-code
lang: bash
from: projects/voice-note-transcriber-pipeline/README.md
span: 2

```bash
python3 scripts/project_test.py voice-note-transcriber-pipeline --init my-voice-pipeline
python3 scripts/project_test.py voice-note-transcriber-pipeline --all --solution --strict
cd projects/voice-note-transcriber-pipeline/solution
python3 pipeline.py --input fixtures/repair-note.wav --transcript-file fixtures/reference.json --out voice-output
ffmpeg -i YOUR_NOTE.m4a -ac 1 -ar 16000 -c:a pcm_s16le YOUR_NOTE.wav  # mono 16-bit PCM
python3 pipeline.py --input YOUR_NOTE.wav --endpoint <url> --model YOUR_MODEL --out voice-output
```

## 项目流水线
type: flow
from: projects/voice-note-transcriber-pipeline/solution/pcm.py, projects/voice-note-transcriber-pipeline/solution/activity.py, projects/voice-note-transcriber-pipeline/solution/transcribe.py, projects/voice-note-transcriber-pipeline/solution/provider.py, projects/voice-note-transcriber-pipeline/solution/captions.py, projects/voice-note-transcriber-pipeline/solution/pipeline.py

1. **decode_wav**：仅支持单声道、16 位、未压缩。样本除以 32768。
2. **activity**：仅在 `--segment` 时启用。按 `frame_ms=20` 帧计算 RMS，`threshold=0.02`，合并 `gap_ms=40` 的间隙，丢弃短于 `min_ms=40` 的片段。
3. **transcribe**：对每个片段 `encode_wav`。对 `TimeoutError` 最多重试 `retries=1` 次。每行保留 `audio_sha256` 和 `attempts`。
4. **http_recognizer**：multipart 的 `model` 和 `file` 字段。响应上限 1 MB。超时 30 s。
5. **captions**：`WEBVTT` 头部。字幕时间 `stamp()` 为 hh:mm:ss.mmm。重叠即失败。
6. **export_transcript**：写出 transcript.json、captions.vtt、audio.wav 和 index.html。

## 项目参数
type: command-table
from: projects/voice-note-transcriber-pipeline/solution/pipeline.py, projects/voice-note-transcriber-pipeline/README.md

| 命令 | 作用 |
|---|---|
| `--input <wav>` | 单声道 16 位 PCM WAV，最大 20 MB |
| `--out <dir>` | 输出目录，默认 `voice-output` |
| `--transcript-file <json>` | 与音频 SHA256 绑定的离线参考文本 |
| `--endpoint <url>` | 将 WAV 上传到 audio/transcriptions 端点 |
| `--segment` | 识别前按 RMS 活动切分 |
| `--review-file <json>` | 重新渲染编辑过的 transcript.json |

## 故障排查
type: troubleshooting
from: phases/06-speech-and-audio/04-speech-recognition-asr/docs/en.md, phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md, projects/voice-note-transcriber-pipeline/solution/pcm.py, projects/voice-note-transcriber-pipeline/solution/provider.py, projects/voice-note-transcriber-pipeline/README.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 静音时出现 "Thanks for watching!" | 没有 VAD | 调用 Whisper 前先用 VAD 把关 |
| 嘈杂片段被识别成日语 | 自动语种识别漂移 | 强制 `language="en"` |
| 同一错误在后续窗口中重复 | 前文级联 | `condition_on_previous_text=False` |
| 2 s 片段的填充部分出现文字 | 填充到 30 s | `pad=False` 或用 VAD 把关 |
| 输出近乎随机 | librosa 梅尔谱，统计量不对 | `whisper.audio.log_mel_spectrogram` |
| 智能体打断用户 | 拖尾太短 | 500-800 ms 拖尾，语义端点检测 |
| "16-bit mono PCM required" | 立体声或压缩输入 | 用 `ffmpeg -ac 1 -ar 16000` 转换 |
| "Remote endpoints require HTTPS" | 用 HTTP 访问远程主机 | 使用 HTTPS。HTTP 仅用于回环地址 |

## 问题
type: qa
from: phases/06-speech-and-audio/04-speech-recognition-asr/docs/en.md, phases/06-speech-and-audio/05-whisper-architecture-finetuning/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md

- **何时冻结编码器？** 数据少于 10 小时时。只调解码器。
- **微调需要多少数据？** 10 到 100 小时带转写的目标领域音频。
- **为什么用 CTC 束搜索而不是贪心？** 束搜索支持语言模型融合。CTC 没有内部语言模型。
- **什么是 flush 技巧？** 语音结束时刷新 STT。500 ms 缓冲可在约 125 ms 内结束。
- **生产中用能量 VAD？** 不行。任何高于 -40 dBFS 的噪声都会触发它。
