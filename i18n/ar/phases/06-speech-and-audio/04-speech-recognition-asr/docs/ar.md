# التعرف على الكلام (ASR)  CTC، RNN-T، الاهتمام

> 语音识别 هو إجراء كل مرحلة من مراحل الفصول الصوتية، ثم من خلال نموذج تسلسل من فهم اللغة الإنجليزية والصوتية يربطها معا.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

## 问题

لديك 10 ثوانٍ ∼16 كيلوهرتز في شريط الصوت. تريد أن تحصل على شريط: "افتح أضواء المطبخ".

يمكن حل هذه المشكلة بثلاث طرق:

1. **CTC (Connectionist Temporal Classification)。**输出每的代币 概率,包括一个特殊的 *空白*──在解码时折叠重复项和空白──非自归,速度快──wav2vec 2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**شبكة مشتركة في حالة تحديد رمز 和先前 Token 预测下一个 Token──可流式处理── Google's端侧 ASR、NVIDIA Parakeet 使用它──
3. **Attention encoder-decoder。**رمز الرمز 将音频压缩为隐藏状态,decoder 通过交叉服务自归生成 Token──Whisper、SeamlessM4T 使用它──

بحلول عام 2026، كانت النسبة المرتفعة في اختبار ليبري سبيشة (LibriSpeech test-clean) 1.4% (Parakeet-TDT-1.1B، NVIDIA) و 1.58% (Whisper-Large-v3-turbo)

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让编码 输出 `T`个级分布,覆盖 `V+1`个标志(V 个字符 + فارغ) ∙对于长度为 `U < T`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `y`، أيّة معزول بعد الحصول عليه`y` على كل الحسابات.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

优点:非自归、可流式处理、零前──缺点:* افتراض الاستقلال الشروطى*, أي كل预测彼此独立, لذلك لا يوجد نموذج لغوي داخلي。可通过光束搜索或浅融合 接入外部LM 来修正。

**RNN-T 直觉。**添加一个 *预测器*网络 来嵌入符号 历史,并添加一个 *joiner*,将预测器状态与编码器 组合成一个覆盖 `V+1`------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`+1`هو null / no-emit) ―― ظاهري إنشاء CTC 忽略的条件依赖――它可流式处理,因为每一步只依赖过去和过去的代币――

优点:可流式处理 + 内部 LM。缺点: تدريب أكثر تعقيداً وأكثر استهلاكًا للذاكرة(شبكة الخسارة الثلاثية الأبعاد);RNN-T النواة الخسارة 本身就是一完整库类──

**Attention encoder-decoder。**مُعدّل (مُعدّل) (عاملة) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُعدّل) (مُدّل) (مُعدّل) (مُدّل) (مُدّل) (مُدّلُدّل) (مُدّلُدّل) (مُدّلُو) (مُدّلُدّلُو) (مُدّلُو) (مُدّلُو) (مُو) (مُدّلُو) (مُو) (مُدّلُو) (مُو) (مُو) (مُو) (مُو) (مُو) (مُو) (مُو) (مُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (ُو) (

优点:离线 ASR 质量最高,易用标准 seq2seq 工具训练──缺点:自归延迟与输出长度成正比;没有工程改造就无法流式处理──

### (وير): رقم واحد

**Word Error Rate**= `(S + D + I) / N`، من بينها S=بدل، D= حذف، I=插入، N= مرجع文文本词数──它对应词级 Levenshtein edit distance──越低越好──WER أعلى من 20% عادة لا يمكن استخدامها؛ أقل من 5% للوصول إلى مستوى البشرية──2026年标准基准 数字:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

هذه كلها مبنية على إكودر-ديكودر أو RNN-T── نظام CTC خالص ((wav2vec 2.0) في اختبار نظيف 上大约为 1.8-2.1%──


```figure
ctc-collapse
```

## بناءها

### الخطوة 1: طموحة إصدارات المعلومات

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

两条规则:折叠连续重复项,丢弃空白.`a a _ _ a b b _ c``a a b c`.

### 步骤 2:البحث عن الأشعة

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

生产环境使用带 LM fusion  البحث عن شعاع الأشجار

### 步骤 3: WER

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

### الخطوة الرابعة:

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

هذا هو أفضل نظام ASR عام 2026 في 24 جيجابايت في GPU

### الخطوة 5: استخدام Parakeet أو wav2vec 2.0

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

التدفق ASR  بحاجة إلى إشعار مفصلة الاهتمام 和 الحالة الحمولة؛ استخدام دعم مخزنها(用于 Parakeet 的 NeMo,或带 `chunk_length_s``transformers`خط الأنابيب)

## استخدمها

2026 سنة:

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## 2026 سَيَبْقىُ أَنْ يُصْدرَ حفرةَ الإنتاجِ

- **没有 VAD。**في静音上运行 فسّر 会产生幻觉 (("شكراً على مشاهدتكم!")
- **字符 vs 词 vs subword WER。**في الطبيعية ((小写、去标点) * بعد* تقرير كلمة درجة WER。
- **Language ID drift。**سيقوم الـ Whisper LID بتحويل شريط الضجيج إلى اللغة اليابانية أو الـ ويلزية، عندما تحدد اللغة، يجب عليك`language="en"`.
- **长片段不做 chunking。*** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *`chunk_length_s=30, stride=5`.

## 交付 it

保存为 `outputs/skill-asr-picker.md` لتحديد الهدف لتنفيذ عملية التركيب

## التدريب

1. **Easy。**运行 `code/main.py` سوف تقوم بتشغيل المعلومات المباشرة من خلال المعلومات المباشرة
2. **Medium。**صحيح تحقيق الخطوة 2 في البحث عن شعاع الشجرة المسبقة (نظري قاعدة الاندماج الفارغ)
3. **Hard。**في[LibriSpeech test-clean](https://www.openslr.org/12)上 استخدام `whisper-large-v3-turbo`△ حسابات △ 100 条 تعليقات WER♦ مع عدد تم إصدارها مقارنة♦

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

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 论文。
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 论文。
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022 سنة القنوني 论文;v3-turbo 扩展 نشر في 2024 年。
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) 2026 افتتاح قائمة إدارة الإدارة الصينية 榜首──
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 覆盖 25+ نماذج 
