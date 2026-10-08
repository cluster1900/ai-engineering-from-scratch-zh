# التحدث مع شخصية

> أسر يسأل ماذا يقولون؟ تسأل الاعتراف المتحدث؟ يسأل من يقول؟ شكلها الرياضي يبدو كما هو، أي إدراج زائد كوسين، ولكن كل قرار إنتاج يعتمد على رقم واحد EER.

**类型：**بناء
**语言：**بايثون
**先修要求：**المرحلة 6 · 02 (القطاعات الطيفية & الميل) ، المرحلة 5 · 22 (نموذجات الإدراج)
**时间：**45 دقيقة

## 问题

المستخدم يقول كلمة مرور. هل تعلم: هل هذا الشخص الذي يدعون أنه شخص ((*التحقق* 1:1) ، أو هل هذا أول شخص في بنك التسجيل الخاص بك ((*التعرف* 1:N) ؟ أو هل هذا ليس شخص غير معروف ((*فتح*) ؟

2018 سال قبل:GMM-UBM + i-مجياتها. 尚可, ولكن على التحول القناة (هاتف مقابل جهاز كمبيوتر محمول) و情绪很脆弱.

هذا المؤشر هو**EER**,即 مساوية معدل الخطأ. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

## 概念

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline。**التسجيل:录制目标说话人 530秒音频;计算固定维度 Embedding(ECAPA-TDNN 为 192-d,WavLM-large 为 256-d) ――تحقق: الحصول على اختبار تعبيرات

**ECAPA-TDNN（2020，2026 仍占主导）。**أكد الاهتمام القناة، الانتشار والتكامل - وقت تأخير شبكة العصبية.

**WavLM-SV（2022+）。**استخدام AAM الخسارة التنسيق الدقيق 预训练 WavLM-كبيرة SSL الخلفية──质量更高但更慢,300+ MB مقابل 15 MB──

**x-vector（baseline）。**تجمع إحصائيات TDNN +  النظام الأساسي؛ في CPU / edge 上 لا يزال مفيدا ً

**AAM-softmax。**في الفضاء الزاوي 中加入 هامش `m`                                                                                                                                                                                                                                                              `cos(θ + m)`强制类别间 الانفصال الزاوي‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`m=0.2`، النطاق`s=30`.

### تسجيل النتيجة

- **Cosine**تستخدم مقارنة التسجيل والاختبار إدماجها.
- **PLDA (Probabilistic LDA)。**سوف تضمين 投影 إلى الفضاء الخاطئ، في ذلك نفس المتحدث مقابل المتحدثين مختلفين لديها نسبة احتمالية من شكل مغلق  فوق فوق Cosine 之上,可降低 1020% EER
- **Score normalization。** `S-norm`أو`AS-norm`: استخدام مجموعة من مجموعة من المختلفين من المجموعات و متوسط قيمة std لكل نقطة  إجراء التأثيرات  لتقييم النطاقات المتقاطعة                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

### يجب أن تعرف رقم (2026)

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### الإسهال

في多说话人音频片段中判断谁在什么时候说话──管道:VAD → قطاع → لكل قطاع做嵌入 → مجموعة(إجمالية أو طيفية)→平滑边界──现代堆:`pyannote.audio`3.1 ، فإنه يعد تقسيم المتحدثين + إدراج + تجميع 封装在一次调用后面──2026 سنة AMI 上的 SOTA DER 约为15%(低于2022年的23%)──


```figure
sp-eer-crossover
```

## بناءها
### الخطوة الأولى: من إحصاءات المجلس الدولي للصفقات

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

离 SOTA 很远, فقط للتدريس`code/main.py`تحويلها كمعلومات المتحدثة الاصطناعية

### 步骤 2:شبهة التوجه + عتبة

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### الخطوة الثالثة: من أزواج التشابهات

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

返回 (eer، threshold_at_eer) ⋅ يجب أن تقرر

### الخطوة 4: استخدام SpeechBrain لتحقيق الإنتاج

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### الخطوة 5: استخدام الملاحظة القيام بتجريدة

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## استخدمها
2026 سنة:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## فخ
- **Channel mismatch。**في فوكس سيلب (فيديو) على الانترنت
- **短 utterance。**测试音频低于3秒时,EER 会急剧变差──
- **带噪声的 enrollment。**واحد ضجيج التسجيل 会污染 ancor。 استخدام ≥3 个干净样本并取平均。
- **跨条件固定阈值。**始终在来自目标域的持久的开发集 上调值──
- **对未归一化 Embedding 使用 Cosine。**قبل القيام L2 التطبيع؛ وإلا الحجم 会主导结果。

## 交付 it
保存为 `outputs/skill-speaker-verifier.md` اختيار النموذج، بروتوكول التسجيل، خطة ضبط العدوان، وحماية الاحتيال

## التدريب
1. **Easy。**运行 `code/main.py` بناء المتحدثين الاصطناعيين (ملفات تعريف مختلفة للصوت) ، تنفيذ التسجيل، وتقديم قائمة تجريبية 100 زوجة 上计算 EER。
2. **Medium。**في 30 条 VoxCeleb1 تعبير ((5 个扬声器 × 每人 6 条) 上使用SpeechBrain ECAPA──比较Cosine vs PLDA 的 EER──
3. **Hard。**استخدام `pyannote.audio`构建完整 enroll → diarize → verify pipeline──在 AMI dev 设上评估 DER──

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
- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 经典 عميقة التجميض 论文。
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143) 20202026 سنة的主导架构──
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) باستخدام SV و يوميّة SSL العمود الفقري.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) 生产级日记化 + إدغام كومة
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 当前各模型的 EER 排名──
