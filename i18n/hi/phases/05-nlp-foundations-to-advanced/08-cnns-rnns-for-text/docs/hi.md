# लेख के लिए सीएनएन और आरएनएन

> अभिसरण सीखें n-ग्राम। पुनरावृत्ति 负责记忆──两者都受到关注 取代──两者在受限硬件上仍然重要──

**Type:** Build
**Languages:** Python
**先修要求：**चरण 3 · 11 (PyTorch 入门), चरण 5 · 03 (शब्द एम्बेडिंग), चरण 4 · 02 (निरंतर से परिवर्तित)
**Time:** ~75 分钟

## 问题

TF-IDF और Word2Vec  उत्पन्न होते हैं 平 वेक्टर 忽略词序的平 वेक्टर `dog bites man`和 `man bites dog`词序有时承载信号──

ट्रांसफार्मर आने से पहले, दो प्रकार के वास्तुकला इस रिक्त स्थान को भरने के लिए थे।

**用于文本的 Convolutional nets（TextCNN）。**शब्द एम्बेडिंग में 1D घुमावों को लागू करने की क्रमशः--- चौड़ाई के 3 फ़िल्टर एक सीखने योग्य त्रिकोण डिटेक्टर हैः यह तीन शब्दों के पार होकर एक अंश संख्या का उत्पादन करता है--- विभिन्न चौड़ाई के साथ संचयी होता है---2、3、4、5) बहुआयामी मॉडल का परीक्षण करने के लिए।

**Recurrent nets（RNN、LSTM、GRU）。**एक बार एक टोकन को संसाधित करना, उसे आगे प्रसारित करने की जानकारी के छिपे हुए राज्य में रखना।

इस वर्ग में दो प्रकार के निर्माण होंगे, फिर ध्यान देने के लिए ध्यान देने की आवश्यकता होगी।

## 概念

**TextCNN**(किम, 2014) ◊ टोकन ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊                                                                                                                                                                                                                                                                                `k`का 1D संभलण में连续 `k`-ग्राम के एम्बेडिंग 上滑动 फ़िल्टर,生成 फ़ीचर मैप──对该地图做全球最大聚合会选出最强激活──把多个过器宽度的最大聚合 输出拼接起来──送进分类器头──

क्यों प्रभावी है एक फ़िल्टर एक सीखने योग्य n-ग्राम है। अधिकतम-पूलिंग स्थिति अपरिवर्तित है, इसलिए "अच्छा नहीं" एक ही सुविधा को संचालित करता है। तीन फ़िल्टर चौड़ाईएँ हैं, प्रत्येक 100 फ़िल्टर आपको 300 सीखने योग्य n-ग्राम डिटेक्टर प्रदान करते हैं। प्रशिक्षण समवर्ती है; कोई अनुक्रमिक निर्भरता नहीं है।

**RNN。**प्रत्येक समय कदम में `t`, छिपे हुए राज्य `h_t = f(W * x_t + U * h_{t-1} + b)`                                                                                                                                                                                                                                                              `W``U``b` समय `T`                                                                                                                                                                                                                                                              `h_1 ... h_T`上做 pooling(max、mean या अंतिम)

सादा आरएनएन गायब हो रहे ग्रेडिएंट का सामना करेंगे।**LSTM** बढ़ाना गेट  भूलना  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या  क्या                                                                                                                                                                                                                             **GRU**LSTM को दो गेटों में सरल बनाना; पैरामीटर कम और प्रदर्शन के निकट है।

**Bidirectional RNNs**एक आरएनएन सीधे चल रहा है, दूसरा विपरीत चल रहा है, फिर छिपे हुए राज्यों को लिखता है। प्रत्येक टोकन का प्रतिनिधित्व दोनों ही पक्षों के संदर्भ में देखा जा सकता है।


```figure
rnn-unroll
```

##  इसे निर्माण

### 步骤 1: PyTorch 中的 TextCNN

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, n_classes, filter_widths=(2, 3, 4), n_filters=64, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, n_filters, kernel_size=k)
            for k in filter_widths
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids).transpose(1, 2)
        pooled = []
        for conv in self.convs:
            c = F.relu(conv(x))
            p = F.max_pool1d(c, c.size(2)).squeeze(2)
            pooled.append(p)
        h = torch.cat(pooled, dim=1)
        return self.fc(self.dropout(h))
```

`transpose(1, 2)``[batch, seq_len, embed_dim]`变形为 `[batch, embed_dim, seq_len]`, क्योंकि `nn.Conv1d`मध्य अक्ष को चैनल के रूप में संरेखित किया जाता है।

### 步骤 2: LSTM वर्गीकरण

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_classes, bidirectional=True, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=bidirectional)
        factor = 2 if bidirectional else 1
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * factor, n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids)
        out, _ = self.lstm(x)
        pooled = out.max(dim=1).values
        return self.fc(self.dropout(pooled))
```

क्रम पर अधिकतम पूल बनाएं, अंतिम-राज्य पूल के बजाय। वर्गीकरण के लिए, अधिकतम-पूलिंग आमतौर पर अंतिम छिपे हुए राज्य की तुलना में बेहतर होता है, क्योंकि लंबी क्रम के अंत में जानकारी अक्सर अंतिम राज्य पर हावी होती है।

### 步骤 3: गायब हो रहा ग्रेडिएंट 演示(直觉)

没有 gating 的 सादा RNN 无法学习长距离依赖性──考虑一个玩具任务:预测代币 `A`यदि कोई भी स्थान पर यह क्रम में दिखाई दिया है।`A`स्थिति 1 में, जबकि क्रम की लंबाई 100 टोकन है, तो हानि के ग्रेडिएंट को पुनरावर्ती भार के 99 गुना से गुजरना होगा ताकि इसे वापस प्रसारित किया जा सके। यदि वजन 1 से कम है, तो ग्रेडिएंट गायब हो जाएगा। यदि 1 से अधिक है, तो यह विस्फोट होगा।

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

एलएसटीएम 通过 **cell state**修正 इस समस्या: यह केवल अतिरिक्त बातचीत के तरीके से नेटवर्क के माध्यम से होता है  भूलने के गेट से इसे गुणा करने के तरीके से संकुचित किया जाएगा, लेकिन ग्रेडिएंट्स  अभी भी "हाईवे" के साथ चल सकते हैं )  GrUs कम से कम पैरामीटर के साथ ऐसा करते हैं  दोनों 100+ चरण अनुक्रमों के प्रशिक्षण को स्थिर कर सकते हैं 

### चरण 4: यह अभी भी पर्याप्त क्यों नहीं है

यहां तक कि एलएसटीएम भी हैं, तीन समस्याएं अभी भी मौजूद हैं।

1. **Sequential bottleneck。**1000 की क्रमशः लंबाई में प्रशिक्षण RNN  1000  आगे / पीछे की पंक्ति चरणों  की आवश्यकता होती है  समय के साथ नहीं किया जा सकता 
2. **Encoder-decoder setups 中的固定大小 context vector。**डिकोडर केवल एन्कोडर की अंतिम छिपी हुई स्थिति को देख सकता है, जबकि यह पूरे इनपुट को संपीड़ित करता है।
3. **Distant-dependency accuracy ceiling。**एलएसटीएम सामान्य आरएनएन से बेहतर हैं, लेकिन 200+ चरणों के पार करना अभी भी मुश्किल है  विशिष्ट जानकारी का प्रसार करना

ध्यान दो इन तीनों समस्याओं को हल किया गया है। ट्रांसफार्मरों ने पुनरावृत्ति को पूरी तरह से हटा दिया है।

## इसका उपयोग करें

पिटॉर्च की `nn.LSTM``nn.GRU`和 `nn.Conv1d`已生产准备──训练代码是标准的──

गले चेहरे  प्रदान पूर्व प्रशिक्षित एम्बेड, आप उन्हें इनपुट परत के रूप में डाल सकते हैंः

```python
from transformers import AutoModel

encoder = AutoModel.from_pretrained("bert-base-uncased")
for param in encoder.parameters():
    param.requires_grad = False


class BertCNN(nn.Module):
    def __init__(self, n_classes, filter_widths=(2, 3, 4), n_filters=64):
        super().__init__()
        self.encoder = encoder
        self.convs = nn.ModuleList([nn.Conv1d(768, n_filters, kernel_size=k) for k in filter_widths])
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, input_ids, attention_mask):
        with torch.no_grad():
            out = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        x = out.transpose(1, 2)
        pooled = [F.max_pool1d(F.relu(conv(x)), kernel_size=conv(x).size(2)).squeeze(2) for conv in self.convs]
        return self.fc(torch.cat(pooled, dim=1))
```

适用约束 चेकलिस्ट。

- **Edge / on-device inference。**带 GloVe एम्बेडमेंट्स का TextCNN比 трансформаटर 小 10-100x── यदि आपका डिप्लोय लक्ष्य है मोबाइल, तो यह है उपयोग करने योग्य स्टैक──
- **Streaming / online classification。**RNN एक बार एक टोकन को संसाधित करना;ट्रांसफॉर्मर्स  पूर्ण प्रक्रिया की आवश्यकता है।
- **用于 baselines 的 tiny models。**नई कार्य पर तेजी से代── CPU पर 5 मिनट प्रशिक्षण एक पाठCNN──
- **有限数据下的 Sequence labeling。**BiLSTM-CRF (पाठ 06) 1k-10k 标注句子 के लिए, अभी भी उत्पादन-ग्रेड वास्तुकला है

 बाकी सब कुछ ट्रांसफार्मर को दिया गया है

## 交付 यह

保存为 `outputs/prompt-text-encoder-picker.md`:

```markdown
---
name: text-encoder-picker
description: Pick a text encoder architecture for a given constraint set.
phase: 5
lesson: 08
---

Given constraints (task, data volume, latency budget, deploy target, compute budget), output:

1. Encoder architecture: TextCNN, BiLSTM, BiLSTM-CRF, transformer fine-tune, or "use a pretrained transformer as a frozen encoder + small head".
2. Embedding input: random init, GloVe / fastText frozen, or contextualized transformer embeddings.
3. Training recipe in 5 lines: optimizer, learning rate, batch size, epochs, regularization.
4. One monitoring signal. For RNN/CNN models: attention mechanism absence means they miss long-range deps; check per-length accuracy. For transformers: fine-tuning collapse if LR too high; check train loss.

Refuse to recommend fine-tuning a transformer when data is under ~500 labeled examples without showing that a TextCNN / BiLSTM baseline has plateaued. Flag edge deployment as needing architecture-before-everything.
```

## अभ्यास

1. **Easy。**एक 3-वर्ग खिलौना डेटासेट में ऊपर प्रशिक्षण TextCNN(आप खुद ही विकसित डेटा) ―― सत्यापन फ़िल्टर चौड़ाई(2、3、4) के औसत F1 优于单一宽度(3)。
2. **Medium。**为了 LSTM वर्गीकरण 实现 अधिकतम पूल、मीडियम पूल 和 अंतिम-राज्य पूलिंग──在一个小数据集上比较;记录哪种pooling 获胜,并假设原因──
3. **Hard。**构建 BiLSTM-CRF NER tagger(结合课06 和本课) ⋅在 CoNLL-2003 上训练──与课06 के CRF-Alone बेसलाइन以及BERT-फाइन-ट्यून 比较──报告训练时间、记忆 和 F1──

## 关键术语
| Term | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| TextCNN | 用于文本的 CNN | 在 word embeddings 上堆叠 1D convolutions，并使用 global max-pool。Kim (2014)。 |
| RNN | Recurrent net | 在每个 time step 更新 hidden state：`h_t = f(W x_t + U h_{t-1})`。 |
| LSTM | Gated RNN | 增加 input / forget / output gates + 一个 cell state。能在长序列中稳定训练。 |
| GRU | 更简单的 LSTM | 两个 gates 而不是三个。准确率相近，参数更少。 |
| Bidirectional | 两个方向 | Forward + backward RNN 拼接。每个 token 都能看到其 context 的两侧。 |
| Vanishing gradient | 训练信号消失 | Plain RNNs 中反复乘以 <1 的 weights，会让早期 step 的 gradients 实际上变为零。 |

## 延伸阅读
- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) पाठCNN 论文──八页──可读──
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) LSTM 论文──出乎意料地清晰──
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)  LSTM सभी के लिए आसानी से समझने योग्य हों।
