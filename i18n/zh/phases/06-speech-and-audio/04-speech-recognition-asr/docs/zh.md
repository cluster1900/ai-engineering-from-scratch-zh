# 语音识别 (ASR) CTC,RNN-T,注意力

> 语音识别是每次进行音频分类的步骤,再由一个懂英语和静音的序列模型把它们粘在一起――CTC、RNN-T 和注意力是实现它的三种方式――选择一种,并理解为什么――

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

## 问题

你有一个10秒、16kHz的音频片段──你想得到一个字符串:"点灯厨房"──挑战在于结构:音频并不会与字符一对齐相符──单词"好吧"可能持续200ms,也可能持续120ms──静音会给话语加上停顿──有些音素比其他音素更长──输出符号的数量无法预测──

形式化方法可以解决这个问题:

1. **CTC (Connectionist Temporal Classification)。**输出每的代币概率,包括一个特殊的 *空白*──在解码时折叠重复项和空白──非自归,速度快──波2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**联合网络 在给定编码器 和先前代币的情况下预测下一个代币――可流式处理――Google端边ASR、NVIDIA 鱼使用它――
3. **Attention encoder-decoder。**编码器将频频压缩为隐藏状态, 解码器通过交叉服务自归生成代币.

到2026年,LibriSpeech测试清洁上升的SOTA为1.4% (Parakeet-TDT-1.1B,NVIDIA) 和1.58% (Whisper-Large-v3-turbo) 差异很小;部署差异很大.

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让编码器输出`T`个级分布,覆盖`V+1`个标志 ((V 个字符 + 空白) ⋅对于长度为 `U < T`的目标字符串`y`任何折叠后得到`y`对于所有这些对齐求和的CTC损失会对所有这些对齐求和的.

优点:非自归、可流式处理、零前──缺点:*条件独立假设*,即每预测彼此独立,因此没有内部语言模型──可通过光束搜索或浅融合 接入外部LM 来修改──

**RNN-T 直觉。**添加一个 *预测器* 网络 来嵌入标志 历史,并添加一个 *连接器*,将预测器状态与编码器 组合成一个覆盖`V+1`的联合分布`+1`是无效/无发行) ⋅显式建模 CTC 忽略的条件依赖――它可流式处理,因为每一步只依赖于过去的和过去的代币――

优点:可流式处理 + 内部LM──缺点:训练更复杂且更耗内存(3D损失网格);RNN-T损失核本身就是一个完整的库类──

**Attention encoder-decoder。**编码器 (编码器) 处理日志-邮件 (编码器) 解码器 (编码器) 交叉等待到编码器 输出,并自归生成代币.没有对齐约束,注意可以查看音频中的任意位置.除非限制注意.

优点:离线ASR 质量最高,易于使用标准seq2seq 工具训练――缺点:自归延迟与输出长度成正比;没有工程改造就无法流式处理――

### 个数字

**Word Error Rate**`(S + D + I) / N`对于读音而言达到人类水平的标准标准值数字:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

这些都是基于编码器-解码器或RNN-T──纯CTC系统 (WV2vec 2.0) 在测试清洁上大约为1.8-2.1%──


```figure
ctc-collapse
```

## 构建它

### 步骤1:贪的CTC解码

```python
def ctc_greedy(frame_logits, blank=0, vocab=None):
    # frame_logits: list of per-frame probability vectors
    preds = [max(range(len(p)), key=lambda i: p[i]) for p in frame_logits]
    out = []
    prev = -1
    for p in preds:
        if p != prev and p != blank:
            out.append(p)
        prev = p
    return "".join(vocab[i] for i in out) if vocab else out
```

两条规则:折叠连续重复项,丢弃空白.`a a _ _ a b b _ c`其他`a a b c`,我知道.

### 步骤2:光线检查CTC

```python
def ctc_beam(frame_logits, beam=8, blank=0):
    import math
    beams = [([], 0.0)]  # (tokens, log_prob)
    for p in frame_logits:
        log_p = [math.log(max(pi, 1e-10)) for pi in p]
        candidates = []
        for seq, lp in beams:
            for t, lpt in enumerate(log_p):
                new = seq[:] if t == blank else (seq + [t] if not seq or seq[-1] != t else seq)
                candidates.append((new, lp + lpt))
        candidates.sort(key=lambda x: -x[1])
        beams = candidates[:beam]
    return beams[0][0]
```

生产环境使用带LM融合的前树束搜索;这是概念骨架──

### 步骤3:WER

```python
def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    dp = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        dp[i][0] = i
    for j in range(len(h) + 1):
        dp[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(r)][len(h)] / max(1, len(r))
```

### 步骤4:对语 执行推断

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

这就是2026年最强大的通用ASR的一行写法.

### 步骤5:使用Parakeet或WAV2vec 2.0 进行流媒体

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

流媒体ASR 需要分片编码器注意和运输状态;使用支持它的库(用于Parakeet的NeMo,或带 `chunk_length_s`的`transformers`管道) 〔

## 使用它

2026 年:

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## 2026年仍将发出生产坑

- **没有 VAD。**在静音上运行 语 会产生幻觉("谢谢你观看!")
- **字符 vs 词 vs subword WER。**在正常化之后,报告词级 WER──
- **Language ID drift。**语的自动LID会把噪音片段错误路由到日语或威尔士语;当你确定语言时,强制`language="en"`,我知道.
- **长片段不做 chunking。**微笑有30秒窗口.`chunk_length_s=30, stride=5`,我知道.

## 交付它

保存为`outputs/skill-asr-picker.md`为了给定部署目标选择模型"",解码策略"",分类和LM融合"",

## 练习

1. **Easy。**运行`code/main.py`△它会对手工构造的CTC输出做贪的解码,并计算对参考文本的WER──
2. **Medium。**正确实现步骤 2 中的前树束搜索 (考虑空结规则) .
3. **Hard。**在[LibriSpeech test-clean](https://www.openslr.org/12)上使用 `whisper-large-v3-turbo`△计算前 100 条 发表的 WER──与已发布的数字比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| CTC | blank-token loss | 对所有 frame-to-token 对齐做 marginal；非 AR。 |
| RNN-T | streaming loss | CTC + next-token predictor；处理词序。 |
| Attention enc-dec | Whisper-style | Encoder + cross-attending decoder；最佳离线质量。 |
| WER | 你报告的数字 | 词级 `(S+D+I)/N`。 |
| Blank | 空白 | CTC 中表示“此帧无发射”的特殊 Token。 |
| LM fusion | 外部 language model | 在 beam search 期间加入加权 LM log-probs。 |
| VAD | 静音门控 | Voice activity detector；裁剪非语音。 |

## 延伸阅读

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) 论文──
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) 论文──
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022年正文论文;v3-turbo 扩展发布于 2024年。
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) 2026年开放的ASR排行榜榜首
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 覆盖25多个模型的实时基准.
