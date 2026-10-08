# T5, BART  एन्कोडर-डेकोडर मॉडल

> एन्कोडर  ज़िम्मेदार समझें.  डिकोडर  ज़िम्मेदार उत्पन्न करें. इन्हें फिर से इकट्ठा करें, तो एक विशेष इनपुट → आउटपुट  टास्क कंस्ट्रक्शन मॉडल प्राप्त करें.

**Type:** Learn
**Languages:** Python
**先修要求:**चरण 7 · 05 (पूर्ण ट्रांसफार्मर), चरण 7 · 06 (BERT), चरण 7 · 07 (GPT)
**Time:** ~45 minutes

## 问题

केवल डीकोडर-जीपीटी और केवल एन्कोडर-BERT सभी अलग-अलग उद्देश्यों के लिए 2017 की संरचना के लिए किया गया है।

- अनुवादः अंग्रेजी → फ्रेंच।
- सारांशः 5,000-टोकन 文章 → 200-टोकन 摘要──
- भाषण पहचान: 音频 टोकन → 文本 टोकन。
- 结构化抽取: 散文 → JSON。

इन कार्यों के लिए, एन्कोडर-डेकोडर सबसे उपयुक्त रूप है। एन्कोडर उत्पन्न स्रोत सामग्री का घनत्व दर्शाता है।

两篇论文定义了现代做法:

1. **T5**(राफेल और अन्य 2019). "टेक्स्ट-टू-टेक्स्ट ट्रांसफर ट्रांसफार्मर।" प्रत्येक एनएलपी 任务都 पुनः व्यक्त किया जाएगा पाठ-इन, पाठ-आउट के लिए।
2. **BART**(Lewis et al. 2019). "बिडायरेक्शनल और ऑटो-रेग्रेसिव ट्रांसफार्मर. " 去噪音 ऑटोकोडर:以多种方式破坏输入(shuffle、mask、delete、rotate),让解码重建原始内容──

2026 तक, एन्कोडर-डेकोडर प्रारूप अभी भी महत्वपूर्ण स्थानों पर मौजूद है।

- विस्फोर (भाषण → पाठ) ।
- गूगल का अनुवाद तकनीक
- कुछ स्पष्ट संदर्भ-और-संपादन 结构的 कोड-पूराकरण / मरम्मत 模型──
- ् ा ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ्

केवल डिकोडर ने एक पॉली लाइट जीता, लेकिन डिकोडर-डिकोडर गायब नहीं हुआ।

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### पूर्ववर्ती चक्र

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

关键在于, प्रत्येक इनपुट के लिए एन्कोडर केवल एक बार चलता है।

### T5 预训练  भ्रष्टाचार की अवधि

随机选择输入中的 span(平均长度 3 个 टोकन,总计 15%) ――唯一的哨兵用 替换每一个跨度:`<extra_id_0>``<extra_id_1>`等等──decoder केवल आउटपुट द्वारा क्षतिग्रस्त अवधि,并带上对应的哨兵前:

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

तुलनात्मक रूप से पूरे क्रम की तुलना में, यह एक अधिक सस्ता संकेत है। टी 5 के शोध के अवतरण में, यह एमएलएम (बीईआरटी) और पूर्वावधि-एलएम (यूएनआईएलएम) के साथ प्रतिस्पर्धा में है।

### BART 预训练  बहु शोर निषेध

BART 尝试了五种噪音功能:

1. टोकन मास्किंग.
2. टोकन हटाने.
3. पाठ भरने ((मास्क एक span,डेकोडर 插入正确长度的内容)
4. वाक्य प्रतिस्थापन।
5. दस्तावेज रोटेशन.

पाठ भरने + वाक्य परमिट के संयोजन ने सबसे अच्छा नीचे का परिणाम उत्पन्न किया।

### 推理

जीपीटी के समान स्व-निष्क्रिय पीढ़ी── लालची / बीम / टॉप-पी नमूनाकरण 都适用── बीम खोज(宽度 45) है अनुवाद और摘要 के मानक अभ्यास, क्योंकि आउटपुट वितरण比聊更窄──

### 2026 साल किस समय विभिन्न प्रकार के परिवर्तनों का चयन करें

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

(क) निर्देश-ट्यून किए गए डिकोडर-केवल एलएलएम किसी भी कार्य में पंचायन के माध्यम से हो सकते हैं, (ख) एक एकल संरचना दो संरचनाओं की तुलना में अधिक आसानी से विस्तारित हो सकती है, (ग) आरएलएचएफ िकल्पना डिकोडर का उपयोग करना 


```figure
encoder-decoder
```

##  इसे निर्माण

见 `code/main.py` हम एक खिलौना कॉर्पस के लिए  T5 风格 के स्पैन भ्रष्टाचार को प्राप्त करते हैं यह इस वर्ग का सबसे उपयोगी एकल भाग है, क्योंकि यह लगभग हर एन्कोडर-डेकोडर में दिखाई देता है 

### 步骤 1: अवधि भ्रष्टाचार

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

लक्ष्य 格式 अनुसरण T5 约定:`<sent0> span0 <sent1> span1 ...`◊ भ्रष्ट इनपुट 会把未改变的 टोकन 与 span 位置 पर Sentinel Token 交错排列──

### 步骤 2: जाँच करें वापसी

给定腐败输入和目标,重建原始句子── यदि आपका भ्रष्टाचार है可逆的, तो आगे पारित करें 就是良定义的── यह एक मानसिकता जाँच वास्तविक प्रशिक्षण कभी ऐसा नहीं करता है, लेकिन इस परीक्षण की लागत बहुत कम है, और यह अवधि के बीच में एक-एक बग को पकड़ सकता है लेखांकन में।──

### 步骤 3: BART शोर

五个函数:`token_mask``token_delete``text_infill``sentence_permute``document_rotate`◊组合 इनमें से दो并 प्रदर्शित परिणाम

## इसका उपयोग करें

गले लगाना 参考:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

T5 का कौशलः एक ही मॉडल दर्जनों कार्यों को संभाल सकता है, क्योंकि प्रत्येक कार्य पाठ-इन, पाठ-आउट है। 2026 तक, यह मॉडल केवल निर्देश-ट्यून किए गए डिकोडर-मात्र मॉडल को सामान्यीकृत कर दिया गया है, लेकिन T5 सबसे पहले इसे विनियमित करेगा।

## 交付 यह

见 `outputs/skill-seq2seq-picker.md` इस कौशल को इनपुट-आउटपुट 结构、延迟和质量 लक्ष्य के आधार पर, एक नए कार्य के लिए एन्कोडर-डेकोडर और केवल डेकोडर के बीच चयन करने के लिए 

## अभ्यास

1. **Easy.**运行 `code/main.py`, एक 30-टोकन 句子 अनुप्रयोग अवधि भ्रष्टाचार के लिए, सत्यापित किया जाएगा गैर-सेंटिनल स्रोत टोकन के साथ डिकोड लक्ष्य अवधि 拼接后可以复现原始句子──
2. **Medium.**实现 BART का `text_infill`शोर: उपयोग एकल `<mask>`टोकन  बदलना  वैकल्पिक अवधि, डेकोडर  सही अवधि  लंबाई और सामग्री ∞ का अनुमान लगाना चाहिए।
3. **Hard.**एक बहुत ही छोटे अंग्रेजी → सूअर लैटिन corpus(200 对) ऊपर ठीक से ट्यून`flan-t5-small`                                                                                                                                                                                                                                                              `Llama-3.2-1B`परिणामों की तुलना की गई।

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | “Seq2seq transformer” | 两个 stack：用于输入的 bidirectional encoder，以及带 cross-attention、用于输出的 causal decoder。 |
| Cross-attention | “源内容与目标内容对话的地方” | decoder 的 Q × encoder 的 K/V。这是 encoder 信息进入 decoder 的唯一位置。 |
| Span corruption | “T5 的预训练技巧” | 用 sentinel Token 替换随机 span；decoder 输出这些 span。 |
| Denoising objective | “BART 的游戏” | 对输入应用 noise function，训练 decoder 重建 clean sequence。 |
| Sentinel token | “`<extra_id_N>` 占位符” | 特殊 Token，用于在 source 中标记被破坏的 span，并在 target 中重新标记它们。 |
| Flan | “Instruction-tuned T5” | 在超过 1,800 个任务上 fine-tuned 的 T5；让 encoder-decoder 在 instruction-following 上具备竞争力。 |
| Beam search | “Decoding strategy” | 在每一步保留 top-k 个 partial sequence；是翻译/摘要的标准做法。 |
| Teacher forcing | “Training-time input” | 训练期间，把真实的前一个输出 Token 喂给 decoder，而不是采样出来的 Token。 |

## 延伸阅读

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) T5──
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461) BART。
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) फ्लेन-टी5──
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) विस्पर,2026 साल का कैनोनिकल एन्कोडर-डेकोडर。
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现。
