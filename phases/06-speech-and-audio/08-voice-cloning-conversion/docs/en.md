# Voice Cloning 与 Voice Conversion

> Voice cloning 会用别人的声音朗读你的文本。Voice conversion 会把你的声音改写成别人的声音，同时保留你说的内容。两者都依赖同一个基本原语：把说话人身份与内容分离。

**Type:** Build
**Languages:** Python
**先修要求:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 minutes

## 问题

到 2026 年，一段 5 秒音频就足以用消费级 GPU 生成某个人声音的高质量 clone。ElevenLabs、F5-TTS、OpenVoice v2、VoiceBox 都已经提供 zero-shot 或 few-shot cloning。这项技术既是福音（无障碍 TTS、配音、辅助语音），也是武器（诈骗电话、政治 deepfake、IP 盗用）。

两个紧密相关的任务：

- **Voice cloning（TTS 侧）：** text + 5 秒参考声音 → 该声音的音频。
- **Voice conversion（speech 侧）：** source audio（A 说 X）+ B 的参考声音 → B 说 X 的音频。

两者都会把 waveform 分解为 (content, speaker, prosody)，然后把一个来源的 content 与另一个来源的 speaker 重新组合。

你在 2026 年交付时必须满足的关键约束：**watermarking 与 consent gate 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）都已成为法律要求**。你的 pipeline 必须输出不可感知的 watermark，并拒绝未经同意的 clone。

## 概念

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。** 把一段 5 秒 clip 传给一个已在数千名说话人上训练过的模型。speaker encoder 会把 clip 映射为 speaker embedding；TTS decoder 会基于该 Embedding 和 text 进行条件生成。

使用者：F5-TTS (2024)、YourTTS (2022)、XTTS v2 (2024)、OpenVoice v2 (2024)。

**Few-shot fine-tuning。** 录制目标声音 5-30 分钟。对 base model 做 1 小时 LoRA fine-tune。质量会从“还可以”跃升到“难以区分”。Coqui 和 ElevenLabs 都支持这种模式；社区也会把它用于 F5-TTS。

**Voice conversion (VC)。** 两大类：

- **Recognition-synthesis。** 运行类似 ASR 的模型来提取内容表示（例如 soft phoneme posteriors、PPGs），然后用目标 speaker embedding 重新合成。对语言和口音都很稳健。KNN-VC (2023)、Diff-HierVC (2023) 使用这种方式。
- **Disentanglement。** 训练一个 autoencoder，在 bottleneck 的 latent space 中分离 content、speaker 和 prosody。推理时替换 speaker embedding。质量较低但速度更快。AutoVC (2019)、VITS-VC 变体使用这种方式。

**基于 Neural codec 的 cloning（2024+）。** VALL-E、VALL-E 2、NaturalSpeech 3、VoiceBox —— 把音频视为来自 SoundStream / EnCodec 的离散 Tokens，并在 codec Tokens 上训练大型 autoregressive 或 flow-matching 模型。短 prompt 上的质量可与 ElevenLabs 相当。

### 伦理部分不是事后附加项

**Watermarking。** PerTh (Perth) 和 SilentCipher (2024) 会在音频中不可感知地 Embed 一个约 16-32 bit 的 ID。它能经受重新编码、流式传输和常见编辑。开源且可用于生产。

**Consent gates。** 必须把每个 cloned output 与可验证的 consent record 配对。“我，Rohit，于 2026-04-22 授权此声音用于 X 目的。”将其存入 tamper-evident log。

**Detection。** AASIST、RawNet2 和 Wav2Vec2-AASIST 都已作为 detector 发布。ASVspoof 2025 challenge 发布的 EER 为 0.8–2.3%，对应 state-of-the-art detectors 对 ElevenLabs、VALL-E 2 和 Bark 输出的检测结果。

### 数字（2026）

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0.70 通常会让大多数听众无法将其与目标声音区分开。

## 构建它

### 步骤 1： 用 recognition-synthesis 进行分解（main.py 中的纯代码 demo）

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

概念上很简单；实现的大部分工作都在 `tts_model` 和 speaker encoder 中。

### 步骤 2： 用 F5-TTS 做 zero-shot clone

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

参考转录必须与音频完全匹配；不匹配会破坏 alignment。

### 步骤 3： 用 KNN-VC 做 voice conversion

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 会运行 WavLM，为 source 和 target pool 提取逐帧 Embeddings，然后把每个 source frame 替换为 pool 中最近的邻居。它是非参数式方法，使用一分钟目标语音即可工作。

### 步骤 4： Embed 一个 watermark

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

约 32 bits payload，在 MP3 重新编码和轻微噪声后仍可检测。

### 步骤 5： Consent gate

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## 使用它

2026 年的 stack：

| Situation | Pick |
|-----------|------|
| 5-sec zero-shot clone, open-source | F5-TTS or OpenVoice v2 |
| Commercial production cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion (rewriting) | KNN-VC or Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 or VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## 常见坑

- **参考 transcript 未对齐。** F5-TTS 和类似模型要求参考文本与参考音频完全一致，包括标点。
- **有混响的 reference。** 回声会毁掉 clone。使用干声、近讲麦克风录制。
- **情绪不匹配。** “欢快”的训练参考会把所有内容都生成成欢快的 clone。让参考情绪匹配目标用途。
- **语言泄漏。** clone 一个英语说话人后要求模型说法语，往往仍会带着口音；使用 cross-lingual models（XTTS、VALL-E X）。
- **没有 watermark。** 从 2026 年 8 月起，在 EU 无法合法交付。

## 交付它

保存为 `outputs/skill-voice-cloner.md`。设计一个带 consent gate + watermark + quality target 的 cloning 或 conversion pipeline。

## 练习

1. **Easy。** 运行 `code/main.py`。通过计算两个“speakers”在 swap 前后的 cosine，演示 speaker-embedding swap。
2. **Medium。** 使用 OpenVoice v2 clone 你自己的声音。测量 reference 与 clone 之间的 SECS。通过 Whisper 测量 CER。
3. **Hard。** 对 20 个 clones 应用 SilentCipher watermark，将它们通过 128 kbps MP3 encode+decode，再检测 payload。报告 bit-accuracy。

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；无需训练。 |
| PPG | Phonetic posteriorgram | 逐帧 ASR posteriors，用作 language-agnostic content rep。 |
| KNN-VC | Nearest-neighbor conversion | 把每个 source frame 替换为最近的 target-pool frame。 |
| Neural codec TTS | VALL-E style | 基于 EnCodec/SoundStream Tokens 的 AR model。 |
| Watermark | 不可感知的签名 | Embed 到音频中的 bits，能经受重新编码。 |
| SECS | Cloning fidelity | target 与 clone speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测合成语音。 |

## 延伸阅读

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) — 开源 SOTA zero-shot cloning。
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111) 和 [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) — neural-codec TTS。
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879) — 基于 disentanglement 的 voice conversion。
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975) — 基于 retrieval 的 VC。
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) — 可用于生产的 32-bit audio watermark。
- [ASVspoof 2025 results](https://www.asvspoof.org/) — detector vs synthesizer 军备竞赛，2026 年更新。
