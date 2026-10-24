---
id: audio-generation-alms
title: Music Generation and Audio-Language Models
code: MG
subtitle: Codec token、MusicGen、音频编码器与投影器、Thinker 与 Talker、TTFAB 预算以及音频常见陷阱。
hue: 285
sources: phases/06-speech-and-audio/09-music-generation, phases/06-speech-and-audio/10-audio-language-models, phases/08-generative-ai/11-audio-generation, phases/12-multimodal-ai/19-audio-language-whisper-to-af3, phases/12-multimodal-ai/20-omni-models-thinker-talker
source_hash: 453110680f89bafa
---

## 音频变成 codec token
type: architecture
from: phases/08-generative-ai/11-audio-generation/docs/en.md

```arch
node | wave | 1,1 | Waveform | 16-48 kHz | client
node | enc | 2,1 | Encoder conv | per-timestep vector | process
node | rvq | 3,1 | RVQ | 8 codebooks at 75 Hz | store
node | gen | 3,2 | Generator | token-AR or diffusion | model
node | dec | 2,2 | Codec decoder | tokens to audio | process
node | out | 1,2 | Audio out | |
edge | wave | enc |
edge | enc | rvq | vectors
edge | rvq | gen | indices
edge | gen | dec | new tokens
edge | dec | out |
```

## 关键数字
type: concepts
from: phases/08-generative-ai/11-audio-generation/docs/en.md, phases/06-speech-and-audio/09-music-generation/docs/en.md, phases/12-multimodal-ai/19-audio-language-whisper-to-af3/docs/en.md, phases/12-multimodal-ai/20-omni-models-thinker-talker/docs/en.md

- **Codec 速率**：8 个 RVQ 码本、75 Hz，得到 600 tokens/sec。
- **流式下限**：75 tokens/second 时，每个用户需生成 ≥75 tokens/sec。
- **Talker 下限**：50 Hz 的语音 token 要求 Talker 达到 ≥50 tok/s。
- **码本**：通常为 1024 或 2048 个条目。
- **MusicGen codec**：32 kHz 的 EnCodec，4 个码本。
- **Log-Mel 形状**：30 s、100 Hz 帧率，得到 (3000, 80)。
- **往返延迟**：低于 500ms 时，用户就察觉不到滞后。

## 两类生成器
type: concepts
from: phases/08-generative-ai/11-audio-generation/docs/en.md, phases/06-speech-and-audio/09-music-generation/docs/en.md

- **Token 自回归**：在展平的 RVQ token 上运行的 decoder-only transformer。
- **延迟并行**：MusicGen 输出 K 条码本流，每条流有各自的偏移。
- **VALL-E**：根据文本提示和 3 秒的声音样本生成语音 token。
- **潜空间扩散**：Stable Audio Open 在压缩后的音频上工作。适合做循环片段。
- **Flow matching**：Stable Audio 2.5 在连续音频潜变量上使用它。
- **趋势**：音乐领域 flow matching 胜出。语音领域以 token 自回归为主。

## MusicGen、旋律与 FAD
type: annotated-code
lang: python
from: phases/06-speech-and-audio/09-music-generation/docs/en.md

```python
from audiocraft.models import MusicGen
model = MusicGen.get_pretrained("facebook/musicgen-small")  # 300M, fast
model.set_generation_params(duration=10)  # seconds of audio
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)  # 32 kHz output
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(  # keeps the tune, swaps timbre
    ["jazz piano cover"], melody.squeeze(), sr)
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()  # VGGish embedding distance
fad.get_fad_score("generated_folder/", "reference_folder/")  # lower is better
```

## 音频-语言模型模板
type: flow
from: phases/06-speech-and-audio/10-audio-language-models/docs/en.md

1. **音频编码器**：由 Whisper 编码器、BEATs、CLAP 或 WavLM 生成特征。
2. **投影器**：线性层或 MLP 把特征映射到 LLM 的嵌入空间。
3. **LLM**：解码器读取交错的文本与音频 token，输出文本。
4. **阶段 1**：冻结编码器和 LLM。用 ASR 或音频描述数据训练投影器。
5. **阶段 2**：在指令式音频任务上做全量或 LoRA 微调。
6. **阶段 3**：可选。加一个语音解码器，实现语音输入与语音输出。

## 投影器与音频 Q-former
type: annotated-code
lang: python
from: phases/06-speech-and-audio/10-audio-language-models/docs/en.md, phases/12-multimodal-ai/19-audio-language-whisper-to-af3/code/main.py

```python
class AudioProjector(nn.Module):
    def __init__(self, audio_dim=1280, llm_dim=4096):
        super().__init__()
        self.down = nn.Linear(audio_dim, llm_dim)  # audio to LLM width
        self.act = nn.GELU()
        self.up = nn.Linear(llm_dim, llm_dim)
    def forward(self, audio_features):
        return self.up(self.act(self.down(audio_features)))
qf = QFormer(n_queries=8, hidden=20)  # N=8 queries
tokens = qf.forward(frames)  # 99 frames in, 8 tokens out
```

## Log-Mel 与编码器设置
type: defaults
from: phases/12-multimodal-ai/19-audio-language-whisper-to-af3/docs/en.md, phases/12-multimodal-ai/19-audio-language-whisper-to-af3/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| 采样率 | 16 kHz | 先重采样 |
| 窗长 | 25ms | `win_ms: int = 25` |
| 帧移 | 10ms | `hop_ms: int = 10` |
| Mel 滤波器 | 80 | 0-8000 Hz |
| 对数压缩 | `math.log(1 + x)` | 动态范围 |
| Q-former 查询数 | 32 或 64 | AF3 使用 64 |
| Whisper 编码器 | 12-layer | 在 ALM 模式中冻结 |

## Thinker 与 Talker
type: architecture
from: phases/12-multimodal-ai/20-omni-models-thinker-talker/docs/en.md

```arch
node | mic | 1,1 | Mic and VAD | speech tokens | client
node | think | 2,1 | Thinker | 7B-80B, TMRoPE | model
node | talk | 3,1 | Talker | 200M-1B | model
node | dec | 3,2 | Speech decoder | SNAC, MoVQGAN | process
node | spk | 2,2 | Speakers | audio samples | client
edge | mic | think | audio tokens
edge | think | talk | text tokens
edge | talk | dec | RVQ indices
edge | dec | spk | stream
```

## 7B 下的 TTFAB 预算
type: defaults
from: phases/12-multimodal-ai/20-omni-models-thinker-talker/docs/en.md, phases/12-multimodal-ai/20-omni-models-thinker-talker/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| 麦克风到音频 token | 40-80ms | 流式 |
| 预填充 | 100-200ms | 70B 时多得多 |
| Thinker 首个文本 token | 40ms | 随 Thinker 规模增长 |
| Talker 处理首个文本 token | 20ms | 课程模型中至少 15ms |
| 首批语音 token 提交 | 40ms | 在残差 VQ 解码之前 |
| 残差 VQ 解码 | 30ms | `rvq_decode = 30` |
| 语音波形解码 | 50-80ms | `wave_decode = 70` |
| TTFAB 合计 | 320-490ms | 70B 时 600-900ms |

## 故障排查
type: troubleshooting
from: phases/06-speech-and-audio/09-music-generation/docs/en.md, phases/06-speech-and-audio/10-audio-language-models/docs/en.md, phases/08-generative-ai/11-audio-generation/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 音乐超过 30 s 后开始循环 | 自回归模型会循环 | 交叉淡化，或使用 ACE-Step |
| 节奏偏离 BPM | 模型会漂移 | BPM 标签，librosa `beat_track` |
| 唱词含糊不清 | 开源模型歌词能力弱 | 商业 API 或微调 |
| 静音时产生幻觉 | Whisper 编码器的问题 | 用 VAD 把关 |
| 超过 10 分钟后说话人混淆 | 长音频质量退化 | 先做说话人分离，再做摘要 |
| 多音频任务准确率接近 25% | 相当于随机水平 | 不要信任“哪一段”类任务 |
| RVQ 第 1 层的错误扩散 | RVQ 误差累积 | 更高层使用 temperature 0 |
| 片段拼接处出现伪影 | 交叉淡化边界 | 仔细做重叠相加 |

## 代码中的任务
type: task-table
span: 2
from: phases/06-speech-and-audio/10-audio-language-models/docs/en.md, phases/06-speech-and-audio/10-audio-language-models/code/main.py, phases/12-multimodal-ai/19-audio-language-whisper-to-af3/code/main.py, phases/12-multimodal-ai/20-omni-models-thinker-talker/code/main.py, phases/08-generative-ai/11-audio-generation/code/main.py, phases/08-generative-ai/11-audio-generation/docs/en.md

| 任务 | 代码 |
|---|---|
| 加载 ALM 处理器 | `AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B")` |
| 生成回答 | `model.generate(**inputs, max_new_tokens=200)` |
| 加载 MMAU-Pro | `load_dataset("gamma-lab-umd/MMAU-Pro", split="test")` |
| 按官方方式给 MMAU-Pro 评分 | `evaluate_mmau_pro_comprehensive.py` |
| 把音频切成帧 | `window_frames(wave, 16000, 25, 10)` |
| 列出 TTFAB 各部分 | `ttfab(cfg)` |
| 采样 codec token | `generate(counts, style, start, length, rng, temperature=1.0)` |

## 问答
type: qa
from: phases/12-multimodal-ai/19-audio-language-whisper-to-af3/docs/en.md, phases/12-multimodal-ai/20-omni-models-thinker-talker/docs/en.md

- **什么时候级联就够了？** 目标是转写，且不涉及音乐和情绪。
- **什么时候需要端到端？** 音乐、情绪、多说话人或复杂的音频推理。
- **级联会丢失什么？** 情绪、说话人身份、时间信息和深度伪造线索。
- **为什么用小 Talker？** 7B 的 Talker 达不到 50 tok/s 的下限。
- **为什么用 TMRoPE？** 它给每个 token 一个绝对时间戳，让视觉、音频和文本对齐。
- **半双工还是全双工？** Qwen2.5-Omni 默认半双工。Moshi 支持全双工。

## 提示
type: tips
from: phases/06-speech-and-audio/09-music-generation/docs/en.md, phases/06-speech-and-audio/10-audio-language-models/docs/en.md, phases/08-generative-ai/11-audio-generation/docs/en.md

- 想安全上线，只生成纯器乐。
- 给每次生成打上水印和元数据。
- 分别报告每个 MMAU-Pro `category`。
- 先检查 codec，它决定了输出质量的上限。DAC 是目前最好的开源选择。
- 做声音克隆时，加上滥用检测和退出名单。
