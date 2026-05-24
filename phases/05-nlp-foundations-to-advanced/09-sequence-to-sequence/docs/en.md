# Sequence-to-Sequence 模型

> 两个 RNN 假装自己是翻译器。它们撞上的 bottleneck，正是 Attention 存在的原因。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## 问题
Classification 将变长 sequence 映射到单个 label。Translation 将变长 sequence 映射到另一个变长 sequence。输入和输出位于不同 vocabulary 中，可能是不同语言，并且不保证长度一致。

seq2seq 架构（Sutskever, Vinyals, Le, 2014）用一个刻意简单的 recipe 解决了这个问题。两个 RNN。一个读取 source sentence，并产生一个固定大小的 context Vector。另一个读取该 Vector，并逐 Token 生成 target sentence。就是你在 lesson 08 写过的同一套代码，只是以不同方式粘在一起。

这值得学习有两个原因。第一，context-Vector bottleneck 是 NLP 中最有教学价值的失败。它解释了 Attention 和 transformers 擅长的一切。第二，training recipe（teacher forcing、scheduled sampling、inference 时的 beam search）仍然适用于包括 LLMs 在内的每一个现代生成系统。

## 概念
**Encoder.** 读取 source sentence 的 RNN。它的最终 hidden state 是 **context Vector** — 对整个输入的固定大小摘要。据称除了 source 本身，什么都不会丢。

**Decoder.** 另一个用 context Vector 初始化的 RNN。在每一步，它以前一次生成的 Token 作为输入，并产生 target vocabulary 上的分布。通过 sample 或 argmax 选择下一个 Token。再把它喂回去。重复，直到产生 `<EOS>` Token 或达到 max length。

**Training:** 在每个 decoder step 计算 cross-entropy loss，并沿 sequence 求和。通过两个网络做标准 backprop through time。

**Teacher forcing.** 训练期间，decoder 在 step `t` 的输入是位置 `t-1` 的 *ground-truth* Token，而不是 decoder 自己前一次的预测。这会稳定训练；没有它，早期错误会级联，模型永远学不会。Inference 时，你必须使用模型自己的预测，所以 train/inference distribution gap 始终存在。这个 gap 称为 **exposure bias**。

**The bottleneck.** Encoder 学到的关于 source 的一切，都必须被挤进那一个 context Vector。长句会丢细节。罕见词会被模糊掉。重排序（chat noir vs. black cat）必须被记住，而不是被计算出来。

Attention（lesson 10）通过让 decoder 查看 *每一个* encoder hidden state，而不仅仅是最后一个，来修复这个问题。这就是完整卖点。

## 构建它
### 步骤 1： an encoder

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

`outputs` 的 shape 是 `[batch, seq_len, hidden_dim]` — 每个输入位置一个 hidden state。`hidden` 的 shape 是 `[1, batch, hidden_dim]` — 最后一步。Lesson 08 说的是“对 outputs 做 pool 以进行 classification”。这里我们保留最后的 hidden state 作为 context Vector，并忽略每一步的 outputs。

### 步骤 2： a decoder

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

Decoder 每次调用一步。输入：一批单个 Token 和当前 hidden state。输出：下一个 Token 的 vocabulary logits，以及更新后的 hidden state。

### 步骤 3： training loop with teacher forcing

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

两个值得命名的旋钮。`ignore_index=0` 会跳过 padding Token 上的 loss。`teacher_forcing_ratio` 是每一步使用真实 Token 而不是模型预测的概率。从 1.0（完全 teacher forcing）开始，并在训练过程中 anneal 到约 0.5，以缩小 exposure-bias gap。

### 步骤 4： inference loop (greedy)

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

Greedy decoding 在每一步选择概率最高的 Token。它可能走偏：一旦你承诺了某个 Token，就无法撤回。**Beam search** 会保留 top-`k` 个 partial sequences，并在最后选择得分最高的完整 sequence。Beam width 3-5 是标准设置。

### 步骤 5： the bottleneck, demonstrated

在 toy copy task 上训练模型：source `[a, b, c, d, e]`，target `[a, b, c, d, e]`。增加 sequence length。观察 accuracy。

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个 GRU hidden state 无法无损记住 40-Token 输入。信息存在于每一个 encoder step，但 decoder 只看到最后一个 state。Attention 直接修复了这一点。

## 使用它
PyTorch 提供 `nn.Transformer` 和基于 `nn.LSTM` 的 seq2seq templates。Hugging Face 的 `transformers` library 提供完整的 encoder-decoder models（BART、T5、mBART、NLLB），它们在数十亿 Token 上训练而成。

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

现代 encoder-decoders 已经用 transformers 取代了 RNN。高层形状（encoder、decoder、逐 Token 生成）与 2014 年的 seq2seq paper 完全相同。每个 block 内部的机制不同。

### 什么时候仍然选择 RNN-based seq2seq

对新项目来说，几乎永远不该这样做。具体例外：

- Streaming translation，需要以有界内存一次消费一个输入 Token。
- On-device text generation，transformer 的内存成本过高。
- 教学。理解 encoder-decoder bottleneck，是理解 transformers 为什么胜出的最快路径。

### Exposure bias 及其缓解方法

- **Scheduled sampling.** 训练期间 anneal teacher forcing ratio，让模型学会从自己的错误中恢复。
- **Minimum risk training.** 使用句子级 BLEU score 而不是 Token 级 cross-entropy 进行训练。更接近你真正想要的目标。
- **Reinforcement Learning fine-tuning.** 用 metric 奖励 sequence generator。用于现代 LLM RLHF。

这三者仍然适用于基于 transformer 的生成。

## 交付它
保存为 `outputs/prompt-seq2seq-design.md`：

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

## 练习
1. **Easy.** 实现 toy copy task。在 target 等于 source 的 input-output pairs 上训练 GRU seq2seq。测量长度 5、10、20 的 accuracy。复现 bottleneck。
2. **Medium.** 添加 beam width 3 的 beam search decoding。在小型 parallel corpus 上对比 greedy 测量 BLEU。记录 beam search 胜出的地方（通常是最后几个 Token）以及它没有差异的地方。
3. **Hard.** 在 10k-pair paraphrase dataset 上 fine-tune `facebook/bart-base`。比较 fine-tuned model 的 beam-4 output 与 base model 在 held-out inputs 上的输出。报告 BLEU，并挑选 10 个 qualitative examples。

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
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) — 原始 seq2seq paper。四页。
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078) — 引入了 GRU 和 encoder-decoder framing。
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) — Attention paper。读完本课后立刻阅读。
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) — 可构建的 seq2seq + Attention 代码。
