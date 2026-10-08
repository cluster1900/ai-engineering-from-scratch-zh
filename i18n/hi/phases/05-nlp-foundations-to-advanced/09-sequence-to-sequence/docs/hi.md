# अनुक्रम से अनुक्रम 模型

>  दो आरएनएन 假装自己是翻译器──它们碰撞上瓶,正是注意 存在的原因──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## 问题
वर्गीकरण होगा परिवर्तन लंबाई अनुक्रम 映射到单个标签──अनुवाद होगा परिवर्तन लंबाई अनुक्रम 映射到另一个变长序──输入和输出位于不同词汇中,可能是不同语言,并且不保证长度一致──

seq2seq 架构(Sutskever, Vinyals, Le, 2014) एक सोंच सरल नुस्खा के साथ इस समस्या को हल किया गया। दो RNN── एक पढ़िए स्रोत वाक्य, और एक निश्चित आकार का संदर्भ उत्पन्न किया वेक्टर── दूसरा पढ़िए इस वेक्टर,并逐 टोकन उत्पन्न लक्ष्य वाक्य──就是你在课08 写的同一套代码,只是以不同方式粘在一起──

यह सीखने लायक है दो कारणों से है। पहला, संदर्भ-वेक्टर बोतल की खाई एनएलपी में सबसे अधिक शिक्षण मूल्य की विफलता है। यह ध्यान और ट्रांसफार्मर के बारे में सब कुछ अच्छा समझाता है। दूसरा, प्रशिक्षण नुस्खा (शिक्षक मजबूर करना, अनुसूचित नमूनाकरण, अंतरण खोज) अभी भी एलएलएम के भीतर प्रत्येक आधुनिक उत्पादन प्रणाली में लागू है।

## 概念
**Encoder.**读取 स्रोत वाक्य का RNN── इसकी अंतिम छिपी हुई अवस्था है **context Vector** पूरे इनपुट के लिए फिक्स्ड बड़ा छोटा सारांश 

**Decoder.**另一个用语文向量初始化 RNN──在每一步,它以前一次生成的代币 作为输入,并产生目标词汇上的分布──通过样本或 argmax 选择下一个代币──再把它回去──重复,直到产生`<EOS>`टोकन या अधिकतम लंबाई तक पहुँचना

**Training:** प्रत्येक डिकोडर चरण में 计算 क्रॉस-एंट्रोपी हानि,并沿 क्रम 求和──通过两个网络做标准 backprop通过时间──

**Teacher forcing.**प्रशिक्षण के दौरान, डेकोडर चरण में `t`के प्रवेश स्थान है`t-1`का *भू-सत्य* टोकन, बल्कि डिकोडर स्वयं पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमानों के पूर्वानुमानों के पूर्वानुमानों के पूर्वानुमानों के पूर्वानुमानों के पूर्व पूर्व पूर्वानुमानों के पूर्व पूर्व पूर्व पूर्व पूर्व पूर्वानुमानों के पूर्वानुमानों के पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्वानुमानों के पूर्वानुमानों के पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्वानुमानों के पूर्व पूर्व पूर्व पूर्व पूर्वानुमानों के पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्व पूर्वानुमानों का पूर्वानुमानों का पूर्व पूर्वानुमानों का पूर्वानुमानों का पूर्वानुमान**exposure bias**

**The bottleneck.**कोडर सीखने के बारे में स्रोत के बारे में सब कुछ, सभी को उस संदर्भ में बाहर निकाला जाना चाहिए वेक्टर。长句会丢细节。罕见词会被模糊掉。重排序(Chat noir vs. black cat) को याद रखा जाना चाहिए, न कि गणना किया जाना चाहिए。

ध्यान दें(पाठ 10) डिकोडर को डिसीडर करने के माध्यम से देखें * प्रत्येक * एन्कोडर छिपे हुए राज्य में है, केवल अंतिम नहीं है, इस समस्या को ठीक करने के लिए।


```figure
lstm-gates
```

##  इसे निर्माण
### 步骤 1: एक एन्कोडर

```python
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, src_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(src_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)

    def forward(self, src):
        e = self.embed(src)
        outputs, hidden = self.gru(e)
        return outputs, hidden
```

`outputs`का आकार है `[batch, seq_len, hidden_dim]` प्रत्येक प्रवेश स्थान एक छिपा हुआ राज्य `hidden`का आकार है `[1, batch, hidden_dim]` अंतिम चरण── पाठ 08 में कहा गया है कि  आउटपुट के लिए पूल बनाएं ताकि वर्गीकरण किया जा सके── यहाँ हम अंतिम छिपे हुए राज्य को संदर्भ वेक्टर के रूप में रखते हैं,并忽略每一步的 आउटपुट──

### 步骤 2: एक डिकोडर

```python
class Decoder(nn.Module):
    def __init__(self, tgt_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(tgt_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab_size)

    def forward(self, token, hidden):
        e = self.embed(token)
        out, hidden = self.gru(e, hidden)
        logits = self.fc(out)
        return logits, hidden
```

डिकोडर प्रत्येक बार调用一步──输入:一批单个 टोकन 和当前隐藏状态──输出:下一个 टोकन के शब्दावली लॉग,以及更新后的隐藏状态──

### 步骤 3: शिक्षक के साथ प्रशिक्षण लूप

```python
def train_batch(encoder, decoder, src, tgt, bos_id, optimizer, teacher_forcing_ratio=0.9):
    optimizer.zero_grad()
    _, hidden = encoder(src)
    batch_size, tgt_len = tgt.shape
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    loss = 0.0
    loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    for t in range(tgt_len):
        logits, hidden = decoder(input_token, hidden)
        step_loss = loss_fn(logits.squeeze(1), tgt[:, t])
        loss += step_loss
        use_teacher = torch.rand(1).item() < teacher_forcing_ratio
        if use_teacher:
            input_token = tgt[:, t].unsqueeze(1)
        else:
            input_token = logits.argmax(dim=-1)

    loss.backward()
    optimizer.step()
    return loss.item() / tgt_len
```

两个值得命名的旋──`ignore_index=0`मैं कूदने से पहले पैडिंग टोकन ऊपर के नुकसान होगा`teacher_forcing_ratio`यह प्रत्येक चरण वास्तविक टोकन का उपयोग करने के बजाय मॉडल पूर्वानुमान की संभावना है।

### 步骤 4: निष्कर्ष लूप (लाभकारी)

```python
@torch.no_grad()
def greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50):
    _, hidden = encoder(src)
    batch_size = src.shape[0]
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    output_ids = []
    for _ in range(max_len):
        logits, hidden = decoder(input_token, hidden)
        next_token = logits.argmax(dim=-1)
        output_ids.append(next_token)
        input_token = next_token
        if (next_token == eos_id).all():
            break
    return torch.cat(output_ids, dim=1)
```

लोभी डिकोडिंग में प्रत्येक चरण में सबसे अधिक संभावना टोकन चुनें. यह हो सकता है कि यह गलत हो जाएः एक बार जब आप किसी टोकन का वादा करते हैं, तो इसे वापस नहीं लिया जा सकता है.**Beam search**मैं शीर्ष को बनाए रखने के लिए ...`k`个 आंशिक अनुक्रम, और अंतिम में चुनें सर्वाधिक पूर्ण अनुक्रम.

### 步骤 5: बोतल की खाई, दिखाया

में खिलौना कॉपी कार्य 上训练模型: स्रोत `[a, b, c, d, e]`, लक्ष्य `[a, b, c, d, e]`  अनुक्रम की लंबाई बढ़ाएँ  सटीकता का अवलोकन करें

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个GRU छिपे हुए राज्य 无法无损记住 40-Token 输入── प्रत्येक एन्कोडर चरण में जानकारी मौजूद है, लेकिन डिकोडर केवल अंतिम राज्य को देखता है── ध्यान 直接修复这一点──

## इसका उपयोग करें
पिटर्च 提供 `nn.Transformer`और आधारित `nn.LSTM`                                                                                                                                                                                                                                                              `transformers`पुस्तकालय पूरी तरह से एन्कोडर-डेकोडर मॉडल प्रदान करते हैं, जो अरबों टोकन पर प्रशिक्षित और बने हुए हैं

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

आधुनिक एन्कोडर-डेकोडर जाने के लिए ट्रांसफार्मर 取代 RNN──高层形状 एन्कोडर、डेकोडर、 प्रति टोकन 生成) से 2014 के सीक्ड2सेक पेपर 完全相同── प्रत्येक ब्लॉक 内部的机制不同──

### 什么时候仍然选择 RNN आधारित अनुक्रम

नई परियोजनाओं के लिए, यह लगभग हमेशा नहीं किया जाना चाहिए।

- स्ट्रीमिंग अनुवाद, एक बार में एक सीमा में एक प्रवेश टोकन की आवश्यकता है
- डिवाइस पर पाठ उत्पादन,ट्रांसफार्मर की内存 लागत अत्यधिक उच्च है
- सीख―― समझें एन्कोडर-डेकोडर बोतल गला,  समझें ट्रांसफार्मर क्यों जीतने का सबसे तेज़ मार्ग―

### जोखिम पूर्वाग्रह  और इसके缓解方法

- **Scheduled sampling.** प्रशिक्षण के दौरान शिक्षक बल अनुपात, 模型学会 अपनी गलती से पुनर्प्राप्त करें
- **Minimum risk training.**प्रयोग句子级 BLEU स्कोर बजाय टोकन级 पार-एंट्रोपी  अभ्यास करें― अधिक निकट आपके वास्तविक वांछित लक्ष्य―
- **Reinforcement Learning fine-tuning.**उपयोग मेट्रिक  पुरस्कार अनुक्रम जनरेटर。用于现代 LLM RLHF。

यह तीनों अभी भी ट्रांसफार्मर आधारित उत्पादन के लिए लागू हैं।

## 交付 यह
保存为 `outputs/prompt-seq2seq-design.md`:

```markdown
---
name: seq2seq-design
description: 为给定任务设计 sequence-to-sequence pipeline。
phase: 5
lesson: 09
---

给定任务（translation、summarization、paraphrase、question rewrite），输出：

1. 架构。默认使用 pretrained transformer encoder-decoder（BART、T5、mBART、NLLB）。RNN-based seq2seq 只适用于特定约束。
2. Starting checkpoint。命名它（`facebook/bart-base`、`google/flan-t5-base`、`facebook/nllb-200-distilled-600M`）。让 checkpoint 匹配任务和语言覆盖范围。
3. Decoding strategy。Greedy 用于 deterministic output，beam search（width 4-5）用于质量，带 temperature 的 sampling 用于多样性。用一句话说明理由。
4. 发布前要验证的一个 failure mode。Exposure bias 会表现为较长输出上的 generation drift；抽样 20 个位于 90th-percentile length 的输出并目检。

对于少于一百万 parallel examples 的情况，拒绝推荐从头训练 seq2seq。将任何面向用户内容却使用 greedy decoding 的 pipeline 标记为 fragile（greedy 会重复并陷入循环）。
```

## अभ्यास
1. **Easy.**实现 खिलौना कॉपी कार्य──在 लक्ष्य等于 स्रोत के इनपुट-आउटपुट जोड़े 上训练 GRU seq2seq──测量长度 5、10、20 की सटीकता──复现瓶──
2. **Medium.**添加束宽度 3 的束搜索解码──在小型平行体上对比贪心测量 BLEU──记录束搜索 胜出的地方(通常是最后几个代币)以及它没有差异的地方──
3. **Hard.**10k जोड़ी पैराफ्रेसेस डेटासेट में ऊपर बारीक-ट्यूनिंग `facebook/bart-base`◊ अच्छी तरह से समायोजित मॉडल के बीम-4 आउटपुट की तुलना आधार मॉडल में किए गए इनपुटों के ऊपर के आउटपुट से करें।

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder | Input RNN | 读取 source。产生 per-step hidden states 和最终 context Vector。 |
| Decoder | Output RNN | 从 context Vector 初始化。一次生成一个 target Token。 |
| Context vector | 摘要 | 最终 encoder hidden state。固定大小。Attention 要解决的 bottleneck。 |
| Teacher forcing | 使用真实 Token | 训练时喂入 ground-truth previous Token。稳定学习。 |
| Exposure bias | Train/test gap | 在真实 Token 上训练的模型，从未练习过从自身错误中恢复。 |
| Beam search | 更好的 decoding | 每一步保留 top-k partial sequences，而不是 greedy 地直接承诺。 |

## 延伸阅读
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) 原始 seq2seq कागज──四页──
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078)  GRU और एन्कोडर-डेकोडर फ्रेमिंग शुरू की गयी
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) ध्यान पत्र──读完本课后立刻阅读──
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 可构建的 seq2seq + ध्यान 代码──
