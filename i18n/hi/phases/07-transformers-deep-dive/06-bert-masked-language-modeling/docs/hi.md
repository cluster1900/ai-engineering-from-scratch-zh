# BERT  मुखौटा भाषा मॉडलिंग

> GPT 预测下一个词――BERT 预测缺失的词――只差一句话,却带来了半十年的各种嵌入式形――

**类型:**构建
**语言:**पायथन
**先修:**चरण 7 · 05 (पूर्ण ट्रांसफार्मर), चरण 5 · 02 (文本表示)
**时间:**~ 45 मिनट

## 问题

2018 में, प्रत्येक एनएलपी 任务情感分析、NER、QA、entailment都将从头训练自己的模型在自己的标签数据上进行自从训练自己的模型──当时还没有可以精细调的预训练的 理解英语检查点──ELMo (2018) 证明可以使用双向 LSTM预训文本嵌入式;它有帮助,但泛化能力不够──

BERT (Devlin et al. 2018)  ने एक प्रश्न प्रस्तुत कियाः यदि हम एक ट्रांसफार्मर एन्कोडर लेते हैं, तो इंटरनेट पर प्रत्येक वाक्य पर इसे प्रशिक्षित करते हैं, और इसे दो पक्षों के आधार पर मजबूर करते हैं, तो क्या होगा? फिर आपको केवल एक सिर की आवश्यकता होगी।

परिणाम यह है कि 18 个月内,BERT 及其变体 (रोबर्ट, अल्बर्ट, ELECTRA) ने उस समय के सभी एनएलपी लीडरबोर्ड पर शासन किया।

2026 तक, केवल एन्कोडर-मात्र  मॉडल अभी भी वर्गीकरण, पुनर्प्राप्ति और संरचनात्मक निकासी के सही उपकरण हैं वे प्रत्येक टोकन के संचालन की गति को डिकोडर से 快 510×, जबकि उनके एम्बेडिंग प्रत्येक आधुनिक पुनर्प्राप्ति स्टैक की संरचना है

## 核心概念

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### प्रशिक्षण संकेत

取一个句子:`the quick brown fox jumps over the lazy dog`

随机 मुखौटा 15% 的 टोकन:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

訓練模型在被面具的位置预测原始 Token──因为编码器是双向的,所以在位置 1 预测 `[MASK]`时, 可以使用位置 2+ 的`brown fox jumps` यह जीपीटी द्वारा नहीं किया जाने वाला कुछ है

### BERT मास्क 规则

में चुना गया है पूर्वानुमान के लिए प्रयोग किया जाता 15% टोकन मेंः

- 80% प्रतिस्थापित`[MASK]`
- 10% को वैकल्पिक टोकन के लिए प्रतिस्थापित किया गया है।
- 10% 保持不变──

क्यों नहीं हमेशा उपयोग किया जाता है`[MASK]`? क्योंकि `[MASK]`यदि प्रशिक्षण मॉडल 100% की मास्क स्थिति में है तो उम्मीद है।`[MASK]`, पूर्व प्रशिक्षण और ठीक-ठीक  के बीच वितरण विचलन उत्पन्न होगा 10% 随机 + 10% 不变能让模型保持稳健

### अगला वाक्य भविष्यवाणी (NSP)  और क्यों यह हटा दिया गया है

आरंभिक BERT ने एनएसपी को भी प्रशिक्षित कियाः दिए गए दो वाक्य A और B, पूर्वानुमान B यदि नहीं अनुसरण A 后面 में है।

### 2026 साल का बदलाव: मॉडर्नबर्ट

2024 के आधुनिकBERT 论文 के साथ 2026 के बुनियादी घटक ने ब्लॉक का पुनर्निर्माण कियाः

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

और 2018 के स्टैक से अलग, यह मूल रूप से फ्लैश-अटेंशन का समर्थन करता है।

### 2026 साल अभी भी चुनें एन्कोडर का उपयोग

| Task | 为什么 encoder 胜过 decoder |
|------|------------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = 每个 Token 更好的 Embedding 质量 |
| Classification (sentiment, intent, toxicity) | 一次 forward pass；没有生成开销 |
| NER / token labeling | 逐位置输出，天然 bidirectional |
| Zero-shot entailment (NLI) | encoder 顶部的 classifier head |
| Reranker for RAG | Cross-encoder scoring，比 LLM rerankers 快 10x |


```figure
transformer-residual
```

##  इसे निर्माण

### 步骤 1: छिपा तर्क

见 `code/main.py`函数 `create_mlm_batch`接收一个 टोकन ID 列表、语音大小 和 मुखौटा संभावना──返回输入 IDs(已应用 मुखौटा) 和标签(只在面具位置有值,其他位置为 -100这是PyTorch的无视指数 约定) 

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### 步骤 2: एक सूक्ष्म corpus में MLM पूर्वानुमान ऊपर चलाने

20 शब्दों के शब्दावली में 200 वाक्य हैं, जिसमें 2 स्तरों का एन्कोडर + एमएलएम हेड है।

### 步骤 3: तुलना करें मास्क 类型

展示三路规则如何让模型在没有 `[MASK]`उदाहरण के लिए, यह अभी भी उपलब्ध है। बिना मास्क के वाक्य और मास्क वाले वाक्य पर अलग-अलग पूर्वानुमान। दोनों को उचित टोकन वितरण का उत्पादन करना चाहिए, क्योंकि मॉडल में प्रशिक्षण में दो प्रकार के मॉडल देखे गए हैं।

### 步骤 4: ठीक-ट्यूनिंग सिर

एक खिलौना भावना डेटासेट में, वर्गीकरण सिर के साथ MLM सिर को प्रतिस्थापित करें।

## इसका उपयोग करें

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`मध्य `all-MiniLM-L6-v2`इस प्रकार के मॉडल में, विपरीत हानि के साथ प्रशिक्षण BERT  कोडर एक ही  है  परिवर्तन है  हानि 

**Cross-encoder rerankers 也是 fine-tuned BERT。**`[CLS] query [SEP] doc [SEP]`上做 जोड़ी-वर्गीकरण── प्रश्न 和 डॉक  के बीच द्वि-दिशात्मक ध्यान,正是 क्रॉस-एन्कोडर 相比 द्वि-एन्कोडर 具有质量优势的原因──

**2026 年什么时候不该选 BERT。**任何生成式任务──编码器 没有合理方式 autoregressively 生成 Token──另外: किसी भी 1B पैरामीटर निम्न में से 任何一B पैरामीटर 能够以更高灵活性达到相同质量的任务 (Phi-3-Mini, Qwen2-1.5B) 

## 交付 यह

见 `outputs/skill-bert-finetuner.md` यह कौशल नए वर्गीकरण या निकासी के लिए होगा 任务界定 BERT fine-tune के दायरे  बैकबोन 选择、head 规格、数据、eval、停止条件) 

## अभ्यास

1. **Easy.**运行 `code/main.py`, और 10,000 टोकन छापें ऊपर मास्क वितरित किया गया.`[MASK]`
2. **Medium.**实现全字掩饰: यदि एक शब्द को टोकनाइज़र द्वारा 切成字段,则一起掩饰所有字段,或全部不掩饰――衡量这是否能在500-句子 corpus上提升MLM सटीकता――
3. **Hard.**सार्वजनिक डेटासेट से 10,000 个句子 पर प्रशिक्षण एक छोटे से (2-परत, d=64) BERT── के लिए SST-2 भावना ठीक-ट्यून`[CLS]`टोकन ∞ पैरामीटर ∞ के साथ मेल खाता है केवल डेकोडर बेसलाइन तुलना करें ∞ कौन जीतता है?

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| MLM | "Masked language modeling" | 训练信号：随机将 15% 的 Token 替换为 `[MASK]`，预测原始 Token。 |
| Bidirectional | "双向看" | Encoder Attention 没有 causal mask——每个位置都能看到其他所有位置。 |
| `[CLS]` | "The pooler token" | 一个添加到每个 sequence 开头的特殊 Token；它的最终 Embedding 用作句子级表示。 |
| `[SEP]` | "Segment separator" | 分隔成对的 sequence（例如 query/doc、sentence A/B）。 |
| NSP | "Next sentence prediction" | BERT 的第二个 pretraining 任务；在 RoBERTa 中被证明无用，2019 年后被移除。 |
| Fine-tuning | "适配一个任务" | 基本保持 encoder 冻结；在其上训练一个小 head 来完成下游任务。 |
| Cross-encoder | "一个 reranker" | 一个同时接收 query 和 doc 作为输入，并输出相关性分数的 BERT。 |
| ModernBERT | "2024 refresh" | 用 RoPE、RMSNorm、GeGLU、交替 local/global attention、8K context 重建的 encoder。 |

## 延伸阅读

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) 原始论文──
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) 如何正确训练 BERT;移除 NSP──
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555) में एक ही गणना नीचे, प्रतिस्थापित टोकन पता लगाने 胜过MLM。
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) आधुनिकBERT 论文──
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准 एन्कोडर 参考。
