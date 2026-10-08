# भाषण पहचान (एएसआर)  सीटीसी, आरएनएन-टी, ध्यान

> 语音识别 प्रत्येक समय चरण में ध्वनि वर्गीकरण का आयोजन करता है, फिर एक समझदार अंग्रेजी और静音 के क्रम मॉडल द्वारा उन्हें एक साथ जोड़ता है।

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

## 问题

आप एक 10 सेकंड, 16 kHz का एक ध्वनि छंद है। आप एक स्ट्रिंग प्राप्त करना चाहते हैंः "किचन लाइट्स चालू करें"।

तीन प्रकार के औपचारिक तरीके इस समस्या को हल कर सकते हैंः

1. **CTC (Connectionist Temporal Classification)。**输出每的 टोकन 概率, एक विशेष *रिक्त*──在解码时折叠重复项和空──非自归,速度快──wav2vec 2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**संयुक्त नेटवर्क में दिए गए एन्कोडर 和先前 टोकन के मामले में预测下一个 टोकन──可流式处理──Google के端侧ASR、NVIDIA Parakeet इसे उपयोग──
3. **Attention encoder-decoder。**एन्कोडर को छिपे हुए राज्यों में संकुचित किया जाएगा, डिकोडर क्रॉस-एटेंडेड से स्वचालित रूप से टोकन उत्पन्न करेगा।

2026 तक, लिबरी स्पीच टेस्ट-क्लीन अप्सार का SOTA 1.4% (पाराकीट-टीडीटी-1.1बी, एनवीआईडीआईए) और 1.58% (विस्पर-लार्ज-वी3-टर्बो) है।

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让编码 输出 `T`个级分布,覆盖 `V+1`个 टोकन(V 个字符 + रिक्त) ⋅对于长度为 `U < T` 的目标字符串 `y`, किसी भी मोड़ के बाद मिलता है `y` सभी गणितीय संख्याओं के लिए  CTC हानि  सभी ऐसे                                                                                                                                                                                                                                                      

优点:非自归、可流式处理、零前──缺点:*शर्त स्वतंत्रता धारणा*, यानी प्रत्येक预测 परस्पर स्वतंत्र, इसलिए कोई आंतरिक भाषा मॉडल नहीं है。可通过束搜索或浅融合 接入外部LM 来修正。

**RNN-T 直觉。**添加一个 *预测器* नेटवर्क 来嵌入符号 历史,并添加一个 *joiner*,将预测器状态与编码器 组合成一个覆盖 `V+1`                                                                                                                                                                                                                                                              `+1`यह शून्य / कोई-प्रसारक नहीं है)  स्पष्ट रूप से निर्माण CTC 忽略的条件依赖── यह प्र流式处理, क्योंकि प्रत्येक कदम केवल अतीत के  और अतीत के टोकन पर निर्भर करता है

优点:可流式处理 + 内部 LM──缺点: प्रशिक्षण अधिक जटिल और अधिक खपत内存(3D हानि जाल);RNN-T हानि कर्नेल 本身就是一个完整的库类别──

**Attention encoder-decoder。**एन्कोडर (३२ लेयर ट्रांसफार्मर) लॉग-मेल (─) को संसाधित करने वाला (३२ लेयर ट्रांसफार्मर) को क्रॉस-एटेंडेड करने वाला (३२ लेयर ट्रांसफार्मर) को एन्कोडर (输出,并自归归生成) तक टोकन (Token) का उत्पादन करता है।

优点:离线 ASR 质量最高,易用标准seq2seq 工具训练──缺点:自归延迟与输出长度成正比;没有工程改造就无法流式处理──

### एक संख्या

**Word Error Rate**= `(S + D + I) / N`, जिसमें S= प्रतिस्थापन, D= हटाने, I=插入, N= संदर्भ文文本词数―― यह应词级 लेवेंसस्टाइन संपादन दूरी──越低越好──WER 20% से अधिक आमतौर पर अपरिहार्य; 5% से कम के लिए朗读语音而达到人类水平──2026 साल मानक बेंचमार्क 数字:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

ये सभी एन्कोडर-डेकोडर या आरएनएन-टी पर आधारित हैं।


```figure
ctc-collapse
```

##  इसे निर्माण

### 步骤 1: लालची सीटीसी डिकोड

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

两条规则: फोल्ड连续重复项,丢弃空白── उदाहरन:`a a _ _ a b b _ c`→ `a a b c`

### 步骤 2: बीम-सर्च सीटीसी

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

生产环境使用带 LM संलयन के पूर्वावलोकन पेड़ बीम खोज; यह अवधारणा है।

### 步骤 3:WER

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

### 步骤 4:对 Whisper  निष्पादन

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

यह 2026 के सबसे मजबूत सामान्य एएसआर का एक पंक्ति लेखन विधि है।

### 步骤 5: Parakeet या wav2vec 2.0 का उपयोग करके स्ट्रीमिंग करें

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

स्ट्रीमिंग एएसआर  आवश्यकता टुकड़ा एन्कोडर ध्यान 和 ले जाने की स्थिति; उपयोग समर्थन के लिए इसका भंडार  के लिए उपयोग किया जाता है Parakeet के NeMo, या带 `chunk_length_s``transformers`पाइपलाइन) 

## इसका उपयोग करें

2026 साल की राशिः

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## 2026 में उत्पादन के लिए एक खाई जारी रहेगी

- **没有 VAD。**"देखने के लिए धन्यवाद!")
- **字符 vs 词 vs subword WER。**                                                                                                                                                                                                                                                              
- **Language ID drift。**विस्पर का स्वचालित एलआईडी ध्वनि का एक भाग गलत तरीके से जापानी या वेल्श भाषा में भेजता है; जब आप भाषा का निर्धारण करते हैं, तो अनिवार्य करें।`language="en"`
- **长片段不做 chunking。**विस्फोर 30 सेकंड विंडो है.`chunk_length_s=30, stride=5`

## 交付 यह

保存为 `outputs/skill-asr-picker.md`■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

## अभ्यास

1. **Easy。**运行 `code/main.py` यह हस्तनिर्मित संरचनाओं के लिए CTC 输出  लोभी डिकोड करता है,并计算对参考文本的 WER
2. **Medium。**सही ढंग से चरण 2 में पूर्वावलोकन-वृक्ष बीम खोज को लागू करें।
3. **Hard。**[LibriSpeech test-clean](https://www.openslr.org/12)上使用 `whisper-large-v3-turbo`△ गणना  条 कथन का WER── से प्रकाशित संख्यात्मक तुलना──

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

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 论文──
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 论文。
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022 साल का कैनोनिकल 论文;v3-turbo 扩展 प्रकाशित किया गया 2024 साल में
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) 2026 ओपन एएसआर लीडरबोर्ड 榜首──
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard)  覆盖 25+ मॉडल का वास्तविक समय बेंचमार्क
