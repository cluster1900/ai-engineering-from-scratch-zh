# 音频语言模型  Qwen2.5-Omni,音频弗拉明戈,GPT-4o音频

> 2026年的音频语言模型可以对语音+环境声音+音乐进行推理. 在MMAU-Pro上Qwen2.5-Omni-7B达到GPT-4o音频水平. 在LongAudioBench上超过双子 2.5 Pro.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

## 问题

你有5秒音频:狗叫,有人大喊"停止!",然后是沉默.

- **转写。**"说了什么?"这是ASR的领域.
- **语义推理。**"这个人有危险吗?"需要共同理解狗叫叫 + 呼叫 + 沉默.
- **音乐推理。**"哪些乐器在演奏旋律?"
- **长音频检索。**"在这90分钟的讲座里,讲师在哪里解释了渐进的下降?"

一个可以用同一个提示来回答所有这些问题的模型就是**audio-language model**没有简单的转录.

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### 三组件模板

每个2026年的LALM都会有相同的骨架:

1. **Audio encoder.**语编码器 · BEATs · CLAP · WavLM · 或每个模型自定义的编码器──
2. **Projector.**线性或MLP,把音频编码功能 桥接到LLM的代币嵌入空间.
3. **LLM.**基于Llama / Qwen / Gemma 的解码器──接收交错的文本 + 音频代币;生成文本──

训练:

- **Stage 1.**结编码器 + LLM;只在ASR /字幕写 数据上训练投影机.
- **Stage 2.**在指示后的音频任务上进行完整 / LoRA细节调 (QA、推理、音乐理解)
- **Stage 3（可选）。**语音入/声外会添加语音解码器──Qwen2.5Omni 和 AF3-聊天会这样做──

### 2026 模型地图

| Model | Backbone | Audio encoder | Output modality | Access |
|-------|----------|---------------|-----------------|--------|
| Qwen2.5-Omni-7B | Qwen2.5-7B | Custom + Whisper | text + speech | Apache-2.0 |
| Qwen3-Omni | Qwen3 | Custom | text + speech | Apache-2.0 |
| Audio Flamingo 3 | Qwen2 | AF-CLAP | text | NVIDIA non-commercial |
| Audio Flamingo Next | Qwen2 | AF-CLAP v2 | text | NVIDIA non-commercial |
| SALMONN | Vicuna | Whisper + BEATs | text | Apache-2.0 |
| LTU / LTU-AS | Llama | CAV-MAE | text | Apache-2.0 |
| GAMA | Llama | AST + Q-Former | text | Apache-2.0 |
| Gemini 2.5 Flash/Pro (closed) | Gemini | proprietary | text + speech | API |
| GPT-4o Audio (closed) | GPT-4o | proprietary | text + speech | API |

### 现实检查(2026)

**MMAU-Pro.**1,800个QA对,覆盖语音/声音/音乐/混合──包含多音频子集──

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**4 选 1 多选题的随机概率 = 25%;大多数模型就在这个水平附近.

### 长达2026年适合哪里使用

- **呼叫中心录音的合规审计。**"坐席是否提到了必要的披露说明?"
- **无障碍。**向聋人用户描述声音事件 (不只是转写)
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文──
- **播客 / 会议章节划分。**语义摘要,而不仅仅说话者转而来.
- **音乐目录分析。**"找出带有B部分的曲目转调.

### 它们还不适合在哪里使用

- 细粒度乐理 (低于和弦层级)
- 长对话进行带话人归属推 (超过10分钟后退化)
- 更多的音频比较 (比较22-26%),
- 实时流式推理 (大多数是离线批量推理)


```figure
v4-alm-tokens
```

## 构建它

### 步骤1:查询Qwen2.5-Omni

```python
from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Omni-7B", torch_dtype="auto")

audio, sr = load_wav("clip.wav", sr=16000)
messages = [{
    "role": "user",
    "content": [
        {"type": "audio", "audio": audio},
        {"type": "text", "text": "What sounds do you hear, and what's happening?"},
    ],
}]
inputs = processor.apply_chat_template(messages, tokenize=True, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=200)
print(processor.decode(output[0], skip_special_tokens=True))
```

### 步骤2:投影机模式

```python
import torch.nn as nn

class AudioProjector(nn.Module):
    def __init__(self, audio_dim=1280, llm_dim=4096):
        super().__init__()
        self.down = nn.Linear(audio_dim, llm_dim)
        self.act = nn.GELU()
        self.up = nn.Linear(llm_dim, llm_dim)

    def forward(self, audio_features):
        return self.up(self.act(self.down(audio_features)))
```

在ASR对(音频 →转录) 上训练它,就是阶段-1的借口任务.

### 步骤3: 基准MMAU / 长音频基准

```python
from datasets import load_dataset
mmau = load_dataset("MMAU/MMAU-Pro")

correct = 0
for item in mmau["test"]:
    answer = call_model(item["audio"], item["question"], item["choices"])
    if answer == item["correct_choice"]:
        correct += 1
print(f"Accuracy: {correct / len(mmau['test']):.3f}")
```

分别报告每个类别的语 / 声音 / 音乐 / 多音频) 聚合数字会掩盖模型在哪里失败――

## 使用它

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## 陷

- **过度信任 multi-audio。**如果你的任务需要"哪个剪辑有X",接近随机水平的性能是现实的.
- **长音频退化。**超过10分钟后,大多数模型的演讲者属性 会崩――先日记化(第6课),再总结――
- **沉默上的幻觉。**使用Whisper编码器的 LALMs 会继承同类Whisper-style 问题──使用VAD-gate──
- **Benchmark cherry-picking。**销售商博客文章 会突出最佳类别――自运行MMAU-Pro多音频子集――

## 交付它

保存为`outputs/skill-alm-picker.md`〔为给定的音频理解任务选择 LALM +基准子集 +输出模式(文字与语音) 』

## 练习

1. **简单。**运行`code/main.py`查看一个玩具投影机模式 + 假 LALM 对 (音频嵌入,文本代码) →输出代码的路由
2. **中等。**在100个MMAU-Pro演讲项目上给Qwen2.5Omni-7B打分――与报纸的数字比较――
3. **困难。**构建最小的音频标题基线:BEAT编码器+2层投影机+结的Llama-3.2-1B──只在AudioCaps上进行细调投影机──与Clotho-AQA上进行 SALMONN比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| LALM | Audio ChatGPT | Audio encoder + projector + LLM decoder. |
| Projector | Adapter | 将音频特征映射到 LLM Embedding 空间的小型 MLP。 |
| MMAU | 这个 benchmark | 覆盖 speech、sound、music 的 10k audio-QA 对。 |
| MMAU-Pro | 更难的 MMAU | 1800 个 multi-audio / reasoning-heavy 问题。 |
| LongAudioBench | 长形式 eval | 带语义查询的多分钟片段。 |
| Voice-in / voice-out | Speech-native | 模型接收语音并输出语音，不绕经文本。 |

## 延伸阅读

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) 参考架构──
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B)说话中说话
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128)开放长音频领先者──
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) 长音响    
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289)双码码先驱――
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) 2026 实时排名──
