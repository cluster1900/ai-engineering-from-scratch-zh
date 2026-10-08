# मशीन अनुवाद

> अनुवाद एनएलपी के लिए अध्ययन करने के लिए 30 दशक का एक कार्य है, और अभी भी इसे जारी रखता है।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 5 · 10 (ध्यान), चरण 5 · 04 (ग्लूव, फास्टटेक्स, सबवर्ड)
**Time:** ~75 minutes

## 问题
एक मॉडल 读取一种语言的句子,并生成另一种语言的句子──长度会变化──词序会变化──有些源语言词会映射到多个目标语言词,反之亦然──习语拒绝对一映射──英语里"मैं तुम्हें मिस करता हूँ"在法语里是"तु मुझे याद आती है" 字面意思是"तु मुझे याद आती है"──没有任何词级配线能在这种情况下保留下来──

मशीन अनुवाद ने एनएलपी को एनकोडर-डेकोडर, ध्यान, ट्रांसफार्मर बनाने के लिए मजबूर किया और अंततः पूरे एलएलएम प्रमेय को आगे बढ़ाया।

इस विषय पर चर्चा की गई है। इस विषय पर चर्चा की गई है। इस विषय पर चर्चा की गई है।

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代 MT 是在平行文上训练的变体编码器-解码器──编码器 读取按其语言代码化 处理后的源──解码器 通过跨重视 (跨重视) 课 10) 编码器 के आउटपुट का उपयोग करके, एक बार एक उपशब्द उत्पन्न करें──解码, बीम खोज का उपयोग करके लालची-解码陷 से बचें── आउटपुट 会被解码化、被删除,并与参考 评分对比──

तीन परिचालन विकल्प वास्तविक दुनिया में एमटी गुणवत्ता को निर्धारित करते हैं।

- **Tokenizer.**वाक्यपीस बीपीई में मिश्रित भाषाओं का शरीर 上 प्रशिक्षण──跨语言 साझा शब्दावली 正是 NLLB 能实现零射语言对的原因──
- **Model size.**एनएलएलबी-200 डिस्टिल 600 एम लेपटॉप पर उपलब्ध है।
- **Decoding.**通用内容使用 बीम चौड़ाई 4-5──使用 लंबाई दंड 避免 output 过短──在需要术语一致性 时使用限制式解码──


```figure
seq2seq-alignment
```

##  इसे निर्माण
### 步骤 1: एक पूर्व प्रशिक्षित एमटी कॉल

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

यहाँ तीन बातें महत्वपूर्ण हैं।`src_lang`告诉 टोकनाइज़र 应用哪种脚本和细分――`forced_bos_token_id`告诉 decoder 生成哪种语言── ये दोनों NLLB- विशिष्ट ट्रिक्स हैं; mBART 和 M2M-100

### 步骤 2: BLEU और chrF

BLEU  माप आउटपुट और संदर्भ  के बीच n-ग्राम ओवरलैप── चार प्रकार के संदर्भ n-ग्राम आकार(1-4) 、 सटीकता के ज्यामितीय औसत, तथा ओवर-शॉर्ट आउटपुट के लिए संक्षिप्तता दंड──分数 सीमा है [0, 100]──常用── व्याख्या अप   30 BLEU "उपयोगी" है; 40 "अच्छी" है; 50 "असाधारण" है; 1 से कम BLEU के अंतर शोर में शामिल हैं──

chrF वर्ण स्तर F-स्कोर को मापने हेतु ️ अधिक संवेदनशील है, क्योंकि BLEU एक रिपोर्ट के साथ कम मूल्यांकन मैचों को कम करेगा️

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用 `sacrebleu`यह मानक टोकनकरण होगा, जिससे कागजातों में                                                                                                                                                                                                                                                        

### तीन स्तरीय मूल्यांकन स्तरीय (2026)

आधुनिक एमटी मूल्यांकन प्रयोग三类互补的 метриक परिवारों──上线时至少使用其中两类──

- **Heuristic**(BLEU, chrF)──快速、参考 आधारित、可解释, लेकिन पैराफ्रेस के प्रति संवेदनशील नहीं──
- **Learned**(COMET, BLEURT, BERTScore) ◊ मानव न्याय में ऊपर प्रशिक्षित तंत्रिका मॉडल; अनुवाद की तुलना स्रोत और संदर्भ के साथ अर्थिक समानता ◊ 2023 से, COMET और MT अनुसंधान के संबंध सबसे अधिक हैं, और गुणवत्ता के मामलों में 2026 के उत्पादन का विसंगति है ◊
- **LLM-as-judge**(संदर्भ मुक्त)  सुझाव एक बड़ा मॉडल  धाराप्रवाहता, पर्याप्तता, स्वर, सांस्कृतिक उपयुक्तता के आधार पर अनुवाद 打分── जब rubric 设计良好时, GPT-4-as-judge के साथ मानव अनुरूपता की अनुकूलन दर लगभग 80% है उपयोग में नहीं आया संदर्भ के लिए खुला अंत सामग्री──

实用2026 स्टैक:用 `sacrebleu`计算 BLEU 和 chrF,用 `unbabel-comet`計算 COMET,并用促 LLM 作为最终面向人类的信号──在信任任何度量 用生产数据 之前,先用50-100 个人标签的例子 进行校准──

संदर्भ मुक्त माप (COMET-QE, BLEURT-QE, LLM-as-judge) आपको संदर्भ के बिना अनुवादों का आकलन करने दें, जो संदर्भ अनुवादों के बिना लंबी पूंछ वाली भाषा जोड़े के लिए बहुत महत्वपूर्ण है।

### 步骤 3: उत्पादन 中会坏在哪里

उपरोक्त कार्य पाइपलाइन 80% में असफलता के तरीके से काम करेगी, जबकि शेष 20% में असफलता के तरीके से काम करेगीः

- **Hallucination.**मॉडल 发明源 中不存在的内容──常见于不熟悉的域名词汇──症状:output 很流,但声称源 没有陈述的事实──调解:域名术语使用限制式解码,受制式内容使用人文审查,并监控输出 是否比输入 长很多──
- **Off-target generation.**मॉडल 翻译成错误语言──NLLB 在稀语言对上尤其容易出现这个问题──Mitiation:验证 `forced_bos_token_id`,并始终使用语言-ID मॉडल चेक 检查输出──
- **Terminology drift.**"सिनॉइन अप" में "s'inscribe" में बदल जाता है, "creer un compte" में बदल जाता है।
- **Formality mismatch.**法语 "तू" vs "तू",日语礼貌 स्तर──model 会选择训练 中更常见的形式──客户面向内容, यह आमतौर पर गलत है──मिटिगेशन: यदि मॉडल 支持, औपचारिकता टोकन 作为快速前सर्ग,或者在正式-मात्र corpora上细调 一个小型──
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于大约5个源代币 时长处罚会突然失效──中和:使用与源长 成比例的硬最大长度盖──

### 步骤 4: 为一个域 进行细节调整

पूर्व प्रशिक्षित मॉडल सामान्यवादी हैं। कानूनी, चिकित्सा या गेम-डायलॉग अनुवाद, डोमेन समानांतर डेटा में अपर फाइन-ट्यूनिंग से स्पष्ट रूप से लाभान्वित होगा।

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

几千个高质量并行例 几十万个噪音的网页剪辑例 几千个高质量并行例 几十万个噪音的网页剪辑例 几十万个网页剪辑例 几十万个高质量并行例 几十万个高质量并行例 几十万个噪音的网页剪辑例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十万个高质量并行例 几十条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条条

## इसका उपयोग करें
2026 के लिए एमटी उत्पादन स्टैकः

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至2026年,LLMs में कुछ भाषा जोड़े 上已经超过了专业 MT मॉडल, विशेष रूप से मौखिक सामग्री और दीर्घ संदर्भ 上。取舍是每代币成本和延迟──当背景长度、スタイリスト一致性或通过促 实现域调比吞吐量 更重要时,选择LLM──

## 交付 यह
保存为 `outputs/skill-mt-evaluator.md`:

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

给定 source text 和 candidate translation，输出：

1. Automatic score estimate。你预期的 BLEU 和 chrF ranges。说明是否有 reference。
2. 五点 human-verifiable check list：(a) content preservation（无 hallucinations），(b) correct language，(c) register / formality match，(d) terminology consistency with glossary if provided，(e) 无 truncation 或 length explosion。
3. 一个需要探查的 domain-specific issue。例如 legal：named entities 和 statute citations。medical：drug names 和 dosages。UI：placeholder variables `{name}`。
4. Confidence flag。"Ship" / "Ship with review" / "Do not ship"。将它与 step 2 中发现的问题 severity 绑定。

如果 output 没有 language-ID check，拒绝 ship translation。除非 user 明确选择 reference-free scoring（COMET-QE, BLEURT-QE），否则拒绝在没有 reference 的情况下 evaluate。标记任何超过 1000 tokens 的内容，因为它很可能需要 chunked translation。
```

## अभ्यास
1. **Easy.**उपयोग `nllb-200-distilled-600M`将一个 5 句英文段落翻译成法语,再翻译回英语――मूल के निकटता के साथ यात्रा-परिवर्तन का माप करना──आपको अर्थशास्त्र संरक्षण देखना चाहिए, साथ ही साथ शब्द-वॉइस-ड्रिफ भी देखना चाहिए──
2. **Medium.**उपयोग `fasttext lid.176`या `langdetect`अनुवाद आउटपुट के लिए भाषा-आईडी जांच को प्राप्त करना। इसे एमटी कॉल में एकीकृत करना, लक्षित से बाहर आने वाली पीढ़ियों को वापस आने से पहले पकड़ा जाना।
3. **Hard.**में आप चुनते हैं 5,000 जोड़े डोमेन कॉर्पस ऊपर ठीक से ट्यून `nllb-200-distilled-600M`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | 带 brevity penalty 的 N-gram precision。[0, 100]。 |
| chrF | Character F-score | Character-level F-score。对形态丰富的语言更敏感。 |
| NMT | Neural MT | 在 parallel text 上训练的 Transformer encoder-decoder。2017+ default。 |
| NLLB | No Language Left Behind | Meta 的 200-language MT model family。 |
| Constrained decoding | Controlled output | 强制特定 tokens 或 n-grams 在 output 中出现 / 不出现。 |
| Hallucination | Invented content | source 不支持的 model output。 |

## 延伸阅读
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) एनएलएलबी पेपर。
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/) क्यों `sacrebleu`यह ब्लू की रिपोर्ट करने का एकमात्र सही तरीका है।
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) chrF कागज
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 实用细节调整 
