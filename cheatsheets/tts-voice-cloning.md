---
id: tts-voice-cloning
title: Text-to-Speech, Voice Cloning and Codecs
code: TV
subtitle: 从文本到音素到 mel 再到波形，在同意与水印下克隆，并用 RVQ codec 把音频分词。
hue: 320
sources: phases/06-speech-and-audio/07-text-to-speech, phases/06-speech-and-audio/08-voice-cloning-conversion, phases/06-speech-and-audio/13-neural-audio-codecs
source_hash: 0c206b955d3a0633
---

## TTS 与克隆流水线
type: architecture
from: phases/06-speech-and-audio/07-text-to-speech/docs/en.md, phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md

```arch
node | text | 1,1 | Text | normalize first | client
node | g2p | 2,1 | Phonemizer | espeak, G2P fallback | process
node | ac | 3,1 | Acoustic model | text to mel, 80 channels | model
node | voc | 4,1 | Vocoder | HiFi-GAN, mel to waveform | model
node | ref | 2,2 | Reference clip | 5 s plus its transcript | store
node | spk | 3,2 | Speaker encoder | speaker embedding | model
node | wm | 4,2 | Watermark | ~32 bits of payload | process
edge | text | g2p |
edge | g2p | ac | phonemes
edge | ac | voc | mel
edge | ref | spk |
edge | spk | ac | embedding
edge | voc | wm | waveform
```

## 代码中的任务
type: task-table
from: phases/06-speech-and-audio/07-text-to-speech/docs/en.md, phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md, phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md, phases/06-speech-and-audio/13-neural-audio-codecs/code/main.py
span: 2

| 任务 | 代码 |
|---|---|
| 转成音素 | `phonemize("Hello world", language="en-us", backend="espeak")` |
| CPU 上的 Kokoro | `KPipeline(lang_code="a")`，然后 `tts(text, voice="af_bella")` |
| 零样本克隆 | `F5TTS().infer(ref_file=<wav>, ref_text=<text>, gen_text=<text>)` |
| 声音转换 | `vc.convert(source=<wav>, target_pool=[<wav>, <wav>])` |
| 嵌入水印 | `sc.embed(wav, sr=24000, message=payload)` |
| 6 kbps 的 EnCodec | `model.set_target_bandwidth(6.0)` |
| Mimi 语义拆分 | `semantic = codes[:, 0]`，`acoustic = codes[:, 1:]` |
| 玩具 RVQ | `rvq_encode(values, codebook_size=8, n_codebooks=4)` |

## 克隆与水印
type: annotated-code
lang: python
from: phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md, phases/06-speech-and-audio/07-text-to-speech/docs/en.md

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(ref_file="my_voice_5s.wav",                    # 5 s reference
    ref_text="The quick brown fox jumps over the lazy dog.",    # must match exactly
    gen_text="Please remind me to water the plants.")
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)  # ~32 bits
detected = sc.detect(watermarked, sr=24000)             # payload bytes
```

## 用 codec 编码
type: annotated-code
lang: python
from: phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md

```python
model = EncodecModel.encodec_model_24khz()
model.set_target_bandwidth(6.0)            # kbps, 8 codebooks
with torch.no_grad():
    encoded = model.encode(wav)
codes, scale = encoded[0]                  # (1, n_codebooks, n_frames)
wav_recon = model.decode([(codes, scale)])
mimi = loaders.get_mimi()                  # from moshi.models
codes = mimi.encode(wav)                   # (1, 8, frames@12.5Hz)
semantic = codes[:, 0]                     # content, WavLM-aligned
acoustic = codes[:, 1:]                    # timbre, prosody, noise
```

## 同意门控
type: flow
from: phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md

1. **门控**：`verify_signature(consent_record)` 必须通过。否则 "Signed consent required"。
2. **说话人**：`consent_record["speaker_id"]` 必须等于 `hash_speaker(ref_audio)`。
3. **克隆**：`tts.infer(ref_file=ref_audio, gen_text=text)`。
4. **打标**：`watermark(wav, payload=consent_record["id"])`。
5. **记录**：把同意记录存入防篡改日志。

## 公式与数字
type: concepts
from: phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md, phases/06-speech-and-audio/13-neural-audio-codecs/code/main.py, phases/06-speech-and-audio/07-text-to-speech/docs/en.md, phases/06-speech-and-audio/07-text-to-speech/code/main.py

- **RVQ**：码本 1 量化编码器输出。每一个后续码本量化残差。
- **解码**：解码器把每帧选中的码求和。
- **词表**：8 个码本、每个 1024 个码，得到 $1024^8 = 10^{24}$。
- **LM token**：$10 \times 12.5 \times 8 = 1000$ 个 token，对应 10 秒的 Mimi。
- **玩具 RVQ 比特**：8 个码是 3 比特。每帧比特数是码本数乘 3。
- **Mel hop**：24 kHz 下 12.5 ms 是 300 个样本。
- **HiFi-GAN**：上采样率 8, 8, 2, 2 得到 256x，从 mel 速率到音频速率。

## Codec 数字
type: defaults
from: phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md, phases/06-speech-and-audio/07-text-to-speech/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| EnCodec-24k 帧率 | 75 Hz | 默认 4 个码本 @ 1.5 kbps |
| DAC-44.1k 帧率 | 86 Hz | 最高保真，全频段 |
| SNAC-24k 粗粒度速率 | ~12 Hz | 细节在 50 Hz |
| Mimi 帧率 | 12.5 Hz | 8 个码本 @ 4.4 kbps |
| 每个码本的码数 | 1024 | 每个码是 0-1023 |
| 码本数量 | 8-12 | 更多会提高保真度并加长序列 |
| Kokoro 输出 | 24 kHz | 给 16 kHz 消费者重采样 |

## 模型
type: concepts
from: phases/06-speech-and-audio/07-text-to-speech/docs/en.md, phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md, phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md

- **Tacotron 2**：自回归 seq2seq。慢，长文本上会晃。
- **FastSpeech 2**：时长预测器，1 次前向，比 Tacotron 快 10×。
- **VITS**：编码器、flow 时长和 HiFi-GAN，端到端训练。25M。
- **F5-TTS**：flow-matching 的扩散 Transformer。从 5 秒克隆。335M。
- **Kokoro**：82M，可在 CPU 上跑，仅 English。
- **KNN-VC**：把每个 WavLM 源帧换成目标池中最近的帧。
- **Mimi**：码本 0 从 WavLM 蒸馏。码本 1-7 是声学的。

## 缩写
type: glossary
from: phases/06-speech-and-audio/07-text-to-speech/docs/en.md, phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md, phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md

- **TTS**：Text-to-Speech。文本前端、声学模型、声码器。
- **VC**：Voice conversion。把 A 的语音改写成 B 的声音。
- **PPG**：Phonetic posteriorgram。每帧 ASR 后验作为内容。
- **RVQ**：Residual Vector Quantization。一串小码本级联。
- **SECS**：speaker embedding cosine。高于 0.70 时多数听者无法区分。
- **UTMOS**：无参考的 MOS 预测器。真值分数为 4.08。
- **CMOS**：Comparative MOS。A 对 B 的偏好。
- **PESQ / ViSQOL**：与 MOS 相关的客观指标。

## 排障
type: troubleshooting
from: phases/06-speech-and-audio/07-text-to-speech/docs/en.md, phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md, phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "Dr." 读成 "Drive" | 没有文本规范化 | 在音素器之前规范化 |
| 专有名词读错 | OOV token | 附带一个兜底 G2P 模型 |
| 输出冲出 ±1.0 | Mel 缩放不匹配 | `np.clip(wav, -1, 1)` |
| 下游出现混叠 | 24 kHz 的 Kokoro 进入 16 kHz 流水线 | 重采样 |
| 克隆对齐断开 | 参考文本与音频不一致 | 精确匹配，包括标点 |
| 克隆里有回声 | 带混响的参考 | 近距离干声录制 |
| 法语克隆还带着口音 | 语言泄漏 | XTTS 或 VALL-E X |
| LM 悄悄失败 | 12.5 Hz 的 Mimi，然后 50 Hz 的 EnCodec | 保持一种帧率 |

## 何时用 X
type: tips
from: phases/06-speech-and-audio/07-text-to-speech/docs/en.md, phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md, phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md

- CPU 上实时 English：Kokoro。
- 从 5 秒参考克隆：F5-TTS 或 OpenVoice v2。
- 把语音改写成目标声音：KNN-VC 或 Diff-HierVC。
- 在音频上做生成模型：从 Mimi 或 SNAC 开始。
- 压缩流水线：用 Opus。它按比特取胜。
- 最高保真重建：DAC-44.1k。
- 每一次克隆：水印和同意记录。

## 问题
type: qa
from: phases/06-speech-and-audio/13-neural-audio-codecs/docs/en.md, phases/06-speech-and-audio/08-voice-cloning-conversion/docs/en.md

- **为什么拆开语义 token 和声学 token？** 纯重建 token 从文本得到的语音会发糊。
- **为什么用 RVQ，而不是一个码本？** 一个大码本需要数百万个码。
- **哪个 Mimi 码本最要紧？** 码本 0。丢掉它会摧毁可懂度。
- **克隆还是转换？** 克隆吃文本。转换吃源语音。
- **少样本微调？** 目标声音 5-30 分钟，用 LoRA 训一小时。
