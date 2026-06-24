# 用于文本的 CNNs 和 RNNs

> Convolutions 学习 n-grams。Recurrences 负责记忆。两者都已被 attention 取代。两者在受限硬件上仍然重要。

**Type:** Build
**Languages:** Python
**先修要求：** Phase 3 · 11 (PyTorch 入门), Phase 5 · 03 (Word Embeddings), Phase 4 · 02 (Convolutions from Scratch)
**Time:** ~75 分钟

## 问题

TF-IDF 和 Word2Vec 产生的是忽略词序的扁平 Vector。基于它们构建的 classifier 无法区分 `dog bites man` 和 `man bites dog`。词序有时承载信号。

在 transformers 到来之前，有两类 architectures 填补了这个空白。

**用于文本的 Convolutional nets（TextCNN）。** 在 word embeddings 序列上应用 1D convolutions。宽度为 3 的 filter 是一个可学习的 trigram detector：它跨越三个词并输出一个分数。堆叠不同宽度（2、3、4、5）来检测多尺度模式。Max-pool 到固定大小的表示。扁平、并行、快速。

**Recurrent nets（RNN、LSTM、GRU）。** 一次处理一个 tokens，维护携带信息向前传播的 hidden state。Sequential、带记忆、支持灵活输入长度。它们在 2014 到 2017 年主导 sequence modeling，随后 attention 出现了。

本课会构建两者，然后指出推动 attention 出现的失败点。

## 概念

**TextCNN**（Kim, 2014）。Tokens 会被 embedded。宽度为 `k` 的 1D convolution 在连续 `k`-grams 的 embeddings 上滑动 filter，生成 feature map。对该 map 做 global max-pooling 会选出最强 activation。把多个 filter widths 的 max-pooled 输出拼接起来。送入 classifier head。

为什么有效。一个 filter 就是一个可学习的 n-gram。Max-pooling 是位置不变的，所以 "not good" 在评论开头或中间都会触发同一个 feature。三个 filter widths、每个 100 个 filters，会给你 300 个学到的 n-gram detectors。训练是并行的；没有 sequential dependency。

**RNN。** 在每个 time step `t`，hidden state `h_t = f(W * x_t + U * h_{t-1} + b)`。在时间维度共享 `W`、`U`、`b`。时间 `T` 的 hidden state 是整个 prefix 的摘要。对于 classification，在 `h_1 ... h_T` 上做 pooling（max、mean 或 last）。

Plain RNNs 会遭受 vanishing gradients。**LSTM** 增加 gates 来决定忘记什么、存储什么、输出什么，从而稳定长序列中的 gradients。**GRU** 将 LSTM 简化为两个 gates；参数更少且表现相近。

**Bidirectional RNNs** 一个 RNN 正向运行，另一个反向运行，然后拼接 hidden states。每个 token 的表示都能看到左右两侧 context。对 tagging tasks 至关重要。


```figure
rnn-unroll
```

## 构建它

### 步骤 1： PyTorch 中的 TextCNN

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

`transpose(1, 2)` 将 `[batch, seq_len, embed_dim]` 变形为 `[batch, embed_dim, seq_len]`，因为 `nn.Conv1d` 会把中间轴当作 channels。无论输入长度如何，pooled 输出都是固定大小。

### 步骤 2： LSTM classifier

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

在序列上做 max-pool，而不是 last-state pool。对于 classification，max-pooling 通常比取最后一个 hidden state 更好，因为长序列末尾的信息往往会主导 last state。

### 步骤 3： vanishing gradient 演示（直觉）

没有 gating 的 plain RNN 无法学习 long-range dependencies。考虑一个 toy task：预测 token `A` 是否曾出现在序列中的任何位置。如果 `A` 在位置 1，而序列长度为 100 个 tokens，那么来自 loss 的 gradient 必须通过 recurrent weight 的 99 次乘法才能回传。如果 weight 小于 1，gradient 会消失。如果大于 1，它会爆炸。

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

LSTMs 通过 **cell state** 修复这个问题：它以仅有加性相互作用的方式穿过网络（forget gate 会以乘法方式缩放它，但 gradients 仍能沿着 "highway" 流动）。GRUs 用更少参数做类似的事。两者都能让 100+ step sequences 的训练稳定。

### 步骤 4： 为什么这仍然不够

即使有 LSTMs，三个问题仍然存在。

1. **Sequential bottleneck。** 在长度为 1000 的序列上训练 RNN 需要 1000 个串行 forward/backward steps。无法沿时间维度并行化。
2. **Encoder-decoder setups 中的固定大小 context vector。** Decoder 只能看到 encoder 的最终 hidden state，而它压缩了整个输入。长输入会丢失细节。Lesson 09 会直接覆盖这一点。
3. **Distant-dependency accuracy ceiling。** LSTMs 优于 plain RNNs，但仍然难以跨 200+ steps 传播特定信息。

Attention 解决了这三个问题。Transformers 完全移除了 recurrence。Lesson 10 是转折点。

## 使用它

PyTorch 的 `nn.LSTM`、`nn.GRU` 和 `nn.Conv1d` 已经 production-ready。训练代码是标准的。

Hugging Face 提供 pretrained embeddings，你可以把它们插入作为 input layer：

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

适用约束 checklist。

- **Edge / on-device inference。** 带 GloVe embeddings 的 TextCNN 比 transformer 小 10-100x。如果你的 deploy target 是手机，这就是该用的 stack。
- **Streaming / online classification。** RNN 一次处理一个 token；transformers 需要完整序列。对于实时输入文本，LSTMs 仍然胜出。
- **用于 baselines 的 tiny models。** 在新任务上快速迭代。在 CPU 上 5 分钟训练一个 TextCNN。
- **有限数据下的 Sequence labeling。** BiLSTM-CRF（lesson 06）对于 1k-10k 标注句子的 NER，仍然是 production-grade architecture。

其他一切都交给 transformer。

## 交付它

保存为 `outputs/prompt-text-encoder-picker.md`：

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

## 练习

1. **Easy。** 在一个 3-class toy dataset 上训练 TextCNN（你自己发明数据）。验证 filter widths（2、3、4）的 average F1 优于单一 width（3）。
2. **Medium。** 为 LSTM classifier 实现 max-pool、mean-pool 和 last-state pooling。在一个小数据集上比较；记录哪种 pooling 获胜，并假设原因。
3. **Hard。** 构建 BiLSTM-CRF NER tagger（结合 lesson 06 和本课）。在 CoNLL-2003 上训练。与 lesson 06 的 CRF-alone baseline 以及 BERT fine-tune 比较。报告 training time、memory 和 F1。

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
- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) — TextCNN 论文。八页。可读。
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) — LSTM 论文。出乎意料地清晰。
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) — 让 LSTMs 对所有人都变得易懂的图解。
