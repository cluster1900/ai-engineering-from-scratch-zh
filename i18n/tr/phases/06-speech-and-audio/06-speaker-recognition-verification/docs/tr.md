# Konu: İnsan Tanıtı ve Deneyim

> ASR soruları,  ne diyorlar?  Konuşmacı tanıma  soruları  kim diyor?  Matematik biçim aynı görünüyor, yani Embedding + Cosine, ama her üretim kararı tek bir EER sayısına bağlıdır.

**类型：**Yapım
**语言：**Python
**先修要求：**6 · 02 aşaması (spektrogramlar ve mel), 5 · 22 aşaması (eğlenme modelleri)
**时间：**~ 45 dakika

## 问题

User utsa ki: "Bu onların iddia ettiği kişi değil miydi?" "Bu senin kayıt bankasının ilk kişi değil miydi?" "Bu bir bilinmeyen kişi değil miydi?"

2018 yıl önce:GMM-UBM + i-vektorlar。EER 尚可, ancak kanal değişimine karşı (telefon vs dizüstü bilgisayar) 和情绪很脆弱。20182022:x-vektorlar◆Angular margin 训练的 TDNN omurgası◆2022+:ECAPA-TDNN 和 WavLM-large Embedding──2026 yıl, bu alan üç model ve bir gösterge ile yönlendirilir。

Bu işaretçi**EER**,即 平等错误率──设置你的决策值,使 false accept rate = false reject rate──交叉点就是 EER──每篇论文、每名表、每次采购评审都会使用它──

## 概念

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline。**Kayıt:录制目标说话人 530秒音频;计算固定维度 Embedding(ECAPA-TDNN 为 192-d,WavLM-large 为 256-d) ――Türkiye kayıt:获取测试发言的 Embedding;计算 Cosine benzerliği;与值比较──

**ECAPA-TDNN（2020，2026 仍占主导）。**Çanak Dikkat, Yayın ve Toplantı - Zaman Gecikmesi Sinir Ağı──1D konvu blokları,带 squeeze-excitation、multi-head dikkat birleştirme,后接一个线性层 得到192-d──使用Additive Angular Margin loss(AAM-softmax) 在 VoxCeleb 1+2(2,700 个说话人,1.1M 条 utterance) 上训练──

**WavLM-SV（2022+）。**AAM kaybı ince ayar kullan 预训练 WavLM-large SSL omurgası。质量更高但更慢,300+ MB vs. 15 MB。

**x-vector（baseline）。**TDNN + istatistikleri birleştirmek ― klasik方案; в CPU / edge 上仍然有用──

**AAM-softmax。**Hükük alanı içinde `m`                                                                                                                                                                                                                                                              `cos(θ + m)`△强制类别间 açısal ayrım──典型设置为 `m=0.2`, ölçekli `s=30`- Evet.

### Notlama

- **Cosine**Bu nedenle, bu konuda karar vermek için değerlendirme yapılması gerekir.
- **PLDA (Probabilistic LDA)。**Bu, aynı hoparlör ile farklı hoparlör arasındaki gizli alanı 投影 投影 嵌入 投影 嵌入 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投影 投投投投投投投投投投投投投投投投投投 投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投投
- **Score normalization。** `S-norm`Ya da`AS-norm`: Bir grup imposter kohortı ile her puan için                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### Bilmen gereken sayı2026.

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### Diaryizasyon

Bu nedenle, bu konuyla ilgili olarak, bir grup kişiye bir dizi farklı yönlendirmeler yapılması gerekir.`pyannote.audio`3.1, konuşmacı segmentasyonunu + yerleştirmeyi + gruplama yapmayı 封装在一次调用后面──2026 yılının AMI 上的 SOTA DER 约为15%(2022 yılının 23%'inden düşük olarak─


```figure
sp-eer-crossover
```

## Yapın onu.
### 步骤 1: MFCC istatistiklerinden 构建玩具 Embedding

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

离 SOTA 很远, sadece öğretim için kullanılır.`code/main.py`Sinteztik hoparlör verileri olarak kullanın.

### 步骤 2:Kosine benzerliği + eşiğin eşiği

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### 步骤 3: benzerlik çiftlerinden 计算 EER

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

返回 (eer, threshold_at_eer) ⋅ ikisi rapor edilmelidir。

### 步骤 4: SpeechBrain kullanmak için üretim gerçekleştirmek

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### 步骤 5: kullanın pyannote yapmak günlük

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## Kullan
2026 yılının birimi:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## 陷
- **Channel mismatch。**VoxCeleb (WEB video) ≠ telefon görüşmesi sesli.
- **短 utterance。**测试音频低于3秒时,EER 会急剧变差──
- **带噪声的 enrollment。**Bir gürültülü kayıt 会污染アンカー。使用 ≥3 个干净样本并取平均。
- **跨条件固定阈值。**始终在来自目标域的持久的 dev set 上调值──
- **对未归一化 Embedding 使用 Cosine。**Önceden yapın L2 normalleştirmek; yoksa büyüklük 会主导结果。

## - Söyle.
保存为 `outputs/skill-speaker-verifier.md` Seçim modeli, kayıt protokolü, eşiğin ayarlama planı, dolandırıcılık koruma yöntemleri

## 练习
1. **Easy。**运行  İşlem`code/main.py`△ yapay  konuşmacıları( farklı ses profilleri), başvurmayı gerçekleştirmek ve 100 çift deneme listesinde bulunmak 上計算 EER。
2. **Medium。**Bu nedenle, bu programın en iyi yönü, bu programın en iyi yönü ve en iyi yönü, bu programın en iyi yönü ve en iyi yönü.
3. **Hard。**Kullanım`pyannote.audio`构建完整 enroll → diarize → verify pipeline──在 AMI dev seti 上评估 DER──

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
- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 经典 derinlemesine gömülmüş 论文。
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143) 20202026 yıl的主导架构──
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) SV ve günlükleşme için SSL omurgası kullanılmıştır.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) 生产级日记化 + Embedding stack──
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 当前各模型的 EER 排名──
