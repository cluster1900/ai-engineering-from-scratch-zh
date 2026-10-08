# 音频评价  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布. 本课为每种音频任务命名. 2026 年的指标:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## 问题

每个音频任务都有多个指标,每个指标衡量不同维度. 使用错误指标,将让你发布一个在仪表板上看起来很棒,但在生产环境中表现很差.

| Task | Primary | Secondary |
|------|---------|-----------|
| ASR | WER | CER · RTFx · first-token latency |
| TTS | MOS / UTMOS | SECS · WER-on-ASR-round-trip · CER · TTFA |
| Voice cloning | SECS (ECAPA cosine) | MOS · CER |
| Speaker verification | EER | minDCF · FAR / FRR at operating point |
| Diarization | DER | JER · speaker confusion |
| Audio classification | top-1 · mAP | macro F1 · per-class recall |
| Music generation | FAD | CLAP · listening panel MOS |
| Audio language model | MMAU-Pro | LongAudioBench · AudioCaps FENSE |
| Streaming S2S | latency P50/P95 | WER · MOS |

## 概念

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### 标志性指标

**WER (Word Error Rate)。** `(S + D + I) / N`△评分前先转小写、除标点、规范化数字──使用 `jiwer`或开放AI 的`whisper_normalizer`语音达到人类水平.

**CER (Character Error Rate)。**相同公式,字符级别. 用于调音语言.

**RTFx (inverse real-time factor)。**每个墙钟处理的音频秒数――越高越好――子-TDT 达到3380×――语-大v3 约为 ~30×――

**First-token latency。**从音频输入到第一个转录代币的墙钟时间.

### 标签

**MOS (Mean Opinion Score)。**五个人工评分: 金标准,但速度慢. 每个样本收集20+ 听众,每一个模型100+ 样本.

**UTMOS (2022-2026)。**训练得到的MOS 预测器──在标准基准上与人工MOS的相关性约为 ~0.9──F5-TTS:UTMOS 3.95;基础真相:4.08──

**SECS (Speaker Encoder Cosine Similarity)。**用于语音克隆. 参考音频与克隆输出之间的ECAPA嵌入 cosine.

**WER-on-ASR-round-trip。**在 TTS 输出上运行 语,并对输入文本计算 WER──用于捕捉可理解度回归──2026 SOTA:&lt;2% CER──

**TTFA (time-to-first-audio)。**端到端延迟──科科罗-82M:~100 ms;F5-TTS:~1秒──

### 语音克隆专用指标

**SECS + MOS + CER**作为三元组──SECS高但MOS低的克隆,说明音色正确但不自然;反过来说明声音自然但说话人不反对──

### 扬声器验证

**EER (Equal Error Rate)。**假接受率等于假拒绝率的值──ECAPA 在 VoxCeleb1-O 上:0.87%──

**minDCF (min Detection Cost)。**在选择运营点 (通常是FAR=0.01) 上的权力成本增加.

### 腹化

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time`◎ 漏检语音 + 误报语音 + 说话人混,每项都是占比.

**JER (Jaccard Error Rate)。**对于短片段偏差更稳健.

### 音频分类

多标签:所有类别上**mAP (mean Average Precision)**◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎

互斥多类:**top-1、top-5 accuracy**◎语音命令 v2:99.0% 顶-1

类别不平衡:**macro F1**其他**per-class recall**△每类报告,汇总准确性 会掩盖哪些类型失败――

### 音乐产生的

**FAD (Fréchet Audio Distance)。**真实音频与生成音频的VGGish-Embedding 分布之间的距离──音乐Gen-small 在 MusicCaps 上:4.5──音乐LM:4.0──越低越好──

**CLAP Score。**使用CLAP嵌入的文本-音频对齐分数──&gt; 0.3 = 合理对齐──

**Listening panel MOS。**对于消费级音乐来说,仍是最终的判断.

### 音频语言基准指标

**MMAU (Massive Multi-Audio Understanding)。**现在,我们在车上.

**MMAU-Pro。**1,800个困难条目,四类:语音/音声/音乐/多音频──4 选1 的随机水平为25%──Gemini 2.5 Pro 总体约60%;所有模型在多音频上约22%──

**LongAudioBench。**听起来很像一个小小时,

**AudioCaps / Clotho。**标题标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签:

### 流通语音

**Latency P50 / P95 / P99。**从用户话语结束到第一个可听响应的墙钟时间.

**WER / MOS**为了输出.

**Barge-in responsiveness。**从用户打断到助手静音的时间──目标&lt;150 ms──

### 2026 排行榜

| Leaderboard | Tracks | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | English + multilingual + long-form | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | English TTS | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO from paired votes | `artificialanalysis.ai/speech` |
| MMAU-Pro | LALM reasoning | `mmaubenchmark.github.io` |
| SpeakerBench / VoxSRC | Speaker recognition | `voxsrc.github.io` |
| MMAU music subset | Music LALM | (within MMAU) |
| HEAR benchmark | Self-supervised audio | `hearbenchmark.com` |


```figure
sp-wer-align
```

## 构建

### 步骤1:带规范化的WER

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip

transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(
    truth="Please turn on the lights.",
    hypothesis="please turn on the light",
    truth_transform=transform,
    hypothesis_transform=transform,
)
# ~0.17
```

### 步骤2:TTS回路 WER

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### 步骤3:用于语音克隆的SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### 步骤4:用于音乐生成的FAD

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### 步骤5:用于演讲者验证的EER(与第6课相似代码)

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        frr = sum(1 for s in same_scores if s < t) / len(same_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

## 使用

为了每次部署配套一个固定的评估,并每次模型更新时运行.

1. **评分前先规范化。**转小写、去标点、展开数字――报告规范化规则――
2. **报告分布，而不是平均值。**延迟报 P50/P95/P99──分类报 报每类回忆──MMAU 报每类──
3. **运行一个标准公开 benchmark。**即使你的生产数据不同,在开放的ASR/TTS竞技场/MMAU上报告也能让评审做与口径比较.

## 陷

- **UTMOS 外推。**它在VCTK风格的干净语音上训练;对杂 / 克隆 / 情绪化音频评分较差.
- **MOS panel 偏差。**亚马逊机械土耳其工人 ≠ 20 个目标用户.
- **FAD 依赖参考集。**跨模型比较时,必须使用相同的参考分布.
- **Aggregate WER。**总体 5% WER 可能掩盖口音语音上的 30% WER──根据人口统计分数 报告──
- **公开 benchmark 饱和。**大多数边界模型在标准基准上已经接近上限.

## 发布

保存为`outputs/skill-audio-evaluator.md`△为任意音频模式 发布选择指标、基准和报告格式──

## 练习

1. **Easy。**运行`code/main.py`△在玩具中 输入上计算 WER / CER / EER / SECS / FAD-ish / MMAU-ish──
2. **Medium。**构建一个TTS回路WER带――将你的Kokoro或F5-TTS输出送进声――对50个提示 计算WER――标记WER&gt;10%的提示――
3. **Hard。**在MMAU-Pro演讲+多音频子集 (各50条目) 上评测你在10课中选择的 LALM──报告每类的准确性,并与已发布的数字比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| WER | ASR 分数 | 规范化后 word 级别的 `(S+D+I)/N`。 |
| CER | Character WER | 用于声调语言或 char-level 系统。 |
| MOS | 人类意见 | 1-5 评分；20+ 听众 × 100 样本。 |
| UTMOS | ML MOS 预测器 | 训练得到的 model；与人工 MOS 相关性约 ~0.9。 |
| SECS | Voice-clone 相似度 | 参考音频与克隆音频之间的 ECAPA cosine。 |
| EER | Speaker verif 分数 | FAR = FRR 的阈值。 |
| DER | Diarization 分数 | (FA + Miss + Confusion) / total。 |
| FAD | Music-gen 质量 | VGGish Embedding 上的 Fréchet distance。 |
| RTFx | 吞吐量 | 每个 wall-clock 秒处理的音频秒数。 |

## 延伸阅读

- [jiwer](https://github.com/jitsi/jiwer)带规范化工具的WER/CER库
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152) 训练得到的MOS预测器.
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466)音乐类标准――
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) LALM推理 排行榜
- [HEAR benchmark](https://hearbenchmark.com/)音频SSL基准――
