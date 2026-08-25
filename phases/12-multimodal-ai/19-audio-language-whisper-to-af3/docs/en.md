# Audio-Language Models：从 Whisper 到 Audio Flamingo 3 的演进

> Whisper（Radford 等，2022 年 12 月）让语音识别尘埃落定：68 万小时弱监督多语言语音、一个简单的 encoder-decoder Transformer、一个让之后每个 ASR 发布都要引用它的 benchmark。但识别不是推理。询问“这段录音里有哪些乐器”或“说话者表达了什么情绪”或“第 3 分钟发生了什么”，需要的是音频理解，而不是转写。Qwen-Audio、SALMONN、LTU，以及 NVIDIA 的 Audio Flamingo 3（AF3，2025 年 7 月）逐步搭建了这套栈：保留 Whisper 级别的 encoder，接上 Q-former，在 audio-text instruction data 上训练，加入 chain-of-thought 推理。本课会讲清这条演进路径。

**类型：** Build
**语言：** Python (stdlib, log-Mel spectrogram + audio Q-former skeleton)
**前置要求：** Phase 6 (Speech and Audio), Phase 12 · 03 (Q-Former)
**时间：** 约 180 分钟

## 学习目标
- 从 waveform 计算 log-Mel spectrogram：windowing、FFT、filter banks、log transform。
- 比较 encoder 选项：Whisper encoder、BEATs、AF-Whisper hybrid。理解各自何时胜出。
- 构建 audio Q-former：让 N 个可学习 queries 对 spectrogram patches 做 cross-attending。
- 解释 cascaded（Whisper-then-LLM）vs end-to-end audio-LLM 训练：为什么 end-to-end 更适合扩展到推理能力。

## 问题
语音识别已经被 Whisper 解决。音频的 OCR 已经商品化。但“商品化”止步于转写。如果模型无法对它听到的内容进行推理：时间点、说话者、情绪、音乐结构、环境声音，那么仅靠转写无法支撑产品功能。

三条明显路线：

1. Cascade：Whisper 转写，LLM 对 transcript 推理。适用于纯语音场景。对音乐、环境音频、多说话人重叠、情绪会失败。

2. End-to-end audio-LLM：audio encoder 将 audio tokens 直接输入 LLM，跳过转写。保留声学信息（情绪、说话者、环境）。需要新的训练数据。

3. Hybrid：audio encoder + text decoder，既能转写也能推理。Qwen-Audio 和 Audio Flamingo 选择这条路线。

## 概念
### Log-Mel spectrogram：输入特征

每个 audio encoder 都从同一种特征开始：log-Mel spectrogram。

1. Resample 到 16 kHz。
2. 使用 25ms window、10ms hop 做 short-time Fourier transform。
3. 取 FFT 结果的 magnitude。
4. 应用 Mel filter banks（通常是 80 个在 0-8000 Hz 上按 log 间隔分布的 filters），映射到感知频率。
5. 用 log compress（log(1 + x)）处理 dynamic range。

结果：形状为 (T, 80) 的 2D array，其中 T 是 time frames 数量。对于 100 Hz frame rate 的 30 秒 clip：形状为 (3000, 80)。

### Whisper 的 encoder

Whisper 的 encoder 是一个 12-layer ViT-style Transformer，将 log-Mel spectrogram 作为 time frames 序列处理。输出：每个 time frame 一个 hidden-state vector。

对于 ASR，Whisper 的 decoder 是一个 cross-attention Transformer，它在 encoder output 条件下生成 text tokens。标准 encoder-decoder。

对于 ALMs（audio-LLMs），你希望把 encoder output 作为输入交给另一个 LLM。模式是：Whisper encoder frozen，Q-former trainable，LLM frozen 或 tuned。

### BEATs 和音频专用 encoders

Whisper 训练于以语音为主的数据。它在音乐和环境音频上较弱。

BEATs（Chen 等，2022）是一个在 AudioSet 上训练的 self-supervised Transformer。在相同参数量下，它比 Whisper 更好地捕捉音乐和环境声音。

AF-Whisper（Audio Flamingo 3 的 hybrid）：将 Whisper + BEATs features concat 作为音频输入。Whisper 携带语言信号，BEATs 携带声学信号。

### Audio Q-former

与 BLIP-2 的 visual Q-former 模式相同。固定数量的 learnable queries（常见为 32 或 64）对 audio encoder 的 output frames 做 cross-attend。这些 queries 变成供 LLM 消费的 audio tokens。

训练对齐阶段：只训练 Q-former，在 audio-text pairs（AudioCaps、Clotho）上使用 contrastive + captioning losses。Instruction 阶段：end-to-end，unfreeze LLM，在 instruction data 上训练。

### 这条演进路径：SALMONN、Qwen-Audio、AF3

SALMONN（Tang 等，2023）：Whisper + BEATs + Q-former + LLaMA。第一个具备严肃推理能力的 open audio-LLM。MMAU benchmark 上 composite 约 0.55。

Qwen-Audio（Chu 等，2023）：架构类似，训练数据集更丰富，针对 multi-turn dialogue 调优。MMAU 约 0.60。

LTU — Listen, Think, Understand（Gong 等，2023）：显式 reasoning data，专注于音频 clip 上的 chain-of-thought。规模更小但更聚焦。

Audio Flamingo 3（Goel 等，2025 年 7 月）：当前 open SOTA。8B LLM backbone（Qwen2 7B）、Whisper-large encoder concat BEATs、64-query Q-former，在 100 万+ audio-text instruction pairs 上训练。MMAU 0.72，在部分 sub-tasks 上匹配 proprietary frontier。

AF3 还引入了音频的 on-demand chain-of-thought：模型可以在最终答案前可选地输出 thinking tokens（“let me identify the instruments first: ...”）。启用 thinking 后，复杂推理任务的准确率提升 3-5 个点。

### Cascaded vs end-to-end

Cascaded pipeline：

1. Whisper 将音频转写为文本。
2. LLM 对文本推理。

对于“总结这个 podcast”非常有效。对于以下情况会失败：
- “这首歌是什么 mood？”——mood 在声音里，不在文字里。
- “谁在说话，Alice 还是 Bob？”——需要 speaker identification。
- “爆炸发生在第几秒？”——temporal grounding 在文本中丢失。
- “这是真实音频还是生成音频？”——deepfake detection 需要声学特征。

End-to-end 保留声学信号。Qwen-Audio 和 AF3 能原生处理音乐、环境和情绪。

### 2026 production recipe

对于新的音频理解产品：

- Cascaded if：目标是转写，没有音乐，没有情绪推断。
- AF3 / Qwen-Audio-family if：音乐、情绪、多说话人，或复杂音频推理。

Cascaded 更便宜、更简单。End-to-end 能力更强。

### MMAU：音频推理 benchmark

MMAU（Massive Multimodal Audio Understanding）是 2024-2025 音频推理 benchmark：

- 10,000 个跨语音、音乐、环境声音的 audio-text QA pairs。
- 覆盖 classification、temporal reasoning、causal reasoning、open-ended QA。
- 测试 cascaded pipelines 系统性遗漏的能力。

Open SOTA（AF3）为 0.72；proprietary frontier 约 0.78（Gemini 2.5 Pro、Claude Opus 4.7）。这个差距小于 VideoMME 的 open-vs-closed delta，说明 audio-LLMs 正在成熟。

```figure
audio-text-ctc
```

## 使用它
`code/main.py`：

- 用 stdlib 实现 log-Mel spectrogram 计算：windowing、naive DFT、Mel filter-bank。
- Audio Q-former skeleton：给定 encoder output frames，计算 Q、K、V、attention，并输出 N 个 tokens。
- 在一个 toy task 上比较 cascaded-vs-end-to-end。

## 交付它
本课会产出 `outputs/skill-audio-llm-pipeline-picker.md`。给定一个音频任务（transcription、music tagging、emotion inference、multi-speaker diarization、environment classification），它会选择 cascaded、end-to-end AF3，或 hybrid。

## 练习
1. 对于一个 16kHz、25ms window、10ms hop、80 Mel bins 的 30 秒 clip，计算 log-Mel spectrogram 维度。在 48kHz 下会如何变化？

2. 为什么 Whisper 在音乐上表现较弱？BEATs 捕捉了哪些 Whisper 没有捕捉的音频特征？

3. 64 queries vs 32 queries 的 Audio Q-former：在什么任务复杂度下 64 值得？32 为哪些任务节省 compute？

4. 阅读 AF3 Section 4 关于 on-demand thinking 的内容。提出三个 chain-of-thought 最有帮助的音频任务。

5. 使用 AF3 的输出实现一个最小 diarization pipeline。你如何标记说话人变化？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Log-Mel spectrogram | “Mel features” | 经过 Mel filter banks 后得到的 log-magnitude values 的 2D（time, frequency）array |
| Audio Q-former | “Audio Perceiver” | 从 audio encoder output 到 fixed-length queries 的 cross-attention bottleneck，供给 LLM |
| Cascaded | “ASR-then-LLM” | Whisper 转写后由 text LLM 推理的 pipeline；会丢失声学信息 |
| End-to-end | “Audio-LLM” | 音频特征通过 Q-former 直接进入 LLM；保留声学信号 |
| BEATs | “Audio AudioSet encoder” | 在 AudioSet 上训练的 SSL Transformer；擅长音乐 + 环境声音 |
| MMAU | “Audio reasoning bench” | 跨语音、音乐、环境的 10k QA pairs；2024 eval standard |
| On-demand thinking | “Audio CoT” | 模型可以在最终答案前可选地输出 reasoning tokens，将准确率提升 3-5 pts |

## 延伸阅读
- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)
