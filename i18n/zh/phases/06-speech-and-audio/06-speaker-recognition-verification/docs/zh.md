# 说话人识别与验证

> 问: ASR 问:他们说什么? 问:说者认可 问:谁说? 数学形式看起来像,即嵌入加 Cosine,但每个生产决策都取决于单个EER数字.

**类型：**建立
**语言：**字符串
**先修要求：**阶段6 · 02 (光谱图和MEL),阶段5 · 22 (嵌入模型)
**时间：**时间45分钟

## 问题

用户说出一个密码短语――你想知道:这是他们声称的那个人吗?

2018年以前:GMM-UBM + i-矢量──EER 尚可,但对频道转移 (手机与笔记本电脑) 和情绪很脆弱──20182022:x-矢量──使用角差距训练的TDNN脊柱──2022+:ECAPA-TDNN 和波浪LM-大嵌入式──到2026年,这个领域由三个模型和一个指标主导──

这个标志是**EER**交叉点就是EER――每篇论文、每一个排名表、每次采购评审都会使用它――

## 概念

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline。**录制目标说话人 530秒音频;计算固定维度嵌入(ECAPA-TDNN 为 192-d,WavLM-大为 256-d) ・验证:获取测试演说的嵌入;计算Cosine相似性;与值比较。

**ECAPA-TDNN（2020，2026 仍占主导）。**强调频道注意力,传播和集成 - 时间延迟神经网络──1D conv 块,带挤压激动、多头注意力聚合,后接一个线性层 得到192d──使用 增量角利损失(AAM-软max) 在 VoxCeleb 1+2(2,700 个说话人,1.1M 条 语句) 上训练──

**WavLM-SV（2022+）。**使用AAM损失细调预训 波LM-大SSL背骨──质量更高但更慢,300+MBvs15MB──

**x-vector（baseline）。**统计数据集成.

**AAM-softmax。**在角空间中加入边缘`m`的标准软度:对正确类别使用 `cos(θ + m)`△强制类别间角分离──典型设置为`m=0.2`规模`s=30`,我知道.

### 评分

- **Cosine**用于比较注册和测试嵌入式.
- **PLDA (Probabilistic LDA)。**将嵌入 投影到隐藏空间,其中相同扬声器与不同的扬声器有封闭形式概率比──叠加在Cosine上,可降低1020%的EER──2020年前是标准做法;现在只在封闭设置中使用──
- **Score normalization。** `S-norm`或`AS-norm`对于每个分数进行归类. 对跨域评估非常关键.

### 你应该知道的数字(2026)

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### 腹化

在多说话人音频片段中判断谁在什么时候说话──管道:VAD →段 → 对每个段做嵌入 →集群(集体或光谱)→平滑边界──现代堆:`pyannote.audio`3.1,它把扬声器细分+嵌入+集群封装在一次调用后面──2026年AMI上升的SOTA DER约为15%──低于2022年的23%.──


```figure
sp-eer-crossover
```

## 构建它
### 步骤1:从MFCC统计数据中构建玩具嵌入

```python
def embed_mfcc_stats(signal, sr):
    frames = featurize_mfcc(signal, sr, n_mfcc=13)
    mean = [sum(f[i] for f in frames) / len(frames) for i in range(13)]
    std = [
        math.sqrt(sum((f[i] - mean[i]) ** 2 for f in frames) / len(frames))
        for i in range(13)
    ]
    return mean + std  # 26-d
```

离SOTA 很远,仅用于教学.`code/main.py`作为合成扬声器数据的概念证明.

### 步骤2:近亲相似性+门

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### 步骤3:从相似性对计算EER

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 1.0, 0.0)  # (fa, fr, threshold)
    for t in thresholds:
        fr = sum(1 for s in same_scores if s < t) / len(same_scores)
        fa = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        if abs(fa - fr) < abs(best[0] - best[1]):
            best = (fa, fr, t)
    return (best[0] + best[1]) / 2, best[2]
```

返回 (eer,门_at_eer) 两个必须报告

### 步骤4:使用SpeechBrain做生产实现

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### 步骤5:使用平笔做日记

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## 使用它
2026 年的堆:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## 陷
- **Channel mismatch。**在VoxCeleb (WEB视频) 上训练的模型 ≠电话电话音频──始终在目标频道上评估──
- **短 utterance。**测试音频低于3秒时,EER 会发生急剧变化.
- **带噪声的 enrollment。**一个杂的报名 会污染.
- **跨条件固定阈值。**始终在来自目标域的持久开发集上调值.
- **对未归一化 Embedding 使用 Cosine。**先做L2正常化;否则大小会主导结果.

## 交付它
保存为`outputs/skill-speaker-verifier.md`选择模型,注册协议,值调整计划和欺诈保障措施.

## 练习
1. **Easy。**运行`code/main.py`△构建合成音箱(不同音调配置),执行注册,并在100对试验列表上计算EER。
2. **Medium。**在 30 条 VoxCeleb1 发言中,5 个扬声器 × 每人 6 条) 上使用SpeechBrain ECAPA──比较Cosin与PLDA的EER──
3. **Hard。**使用 `pyannote.audio`构建完整的注册 →日记 →验证管道──在AMI开发集上评估DER──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| EER | 标题指标 | False Accept = False Reject 时的阈值。 |
| Verification | 1:1 | “这是 Alice 吗？” |
| Identification | 1:N | “是谁在说话？” |
| Open-set | 可能未知 | Test set 可以包含未 enrollment 的说话人。 |
| Enrollment | 注册 | 计算说话人的 reference Embedding。 |
| AAM-softmax | Loss | 带 additive angular margin 的 softmax；强制 cluster separation。 |
| PLDA | 经典 scoring | Probabilistic LDA；在 Embedding 之上做 likelihood-ratio scoring。 |
| DER | Diarization metric | Diarization Error Rate，即 miss + false alarm + confusion。 |

## 延伸阅读
- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 经典深入的论文.
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143)20202026年的主导架构──
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) 用SV和日记化的SSL脊柱.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) 生产级日记化+嵌入堆──
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 当前各模型的EER排名──
