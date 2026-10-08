# 序列到序列 模型

> 两个RNN假装自己是翻译器.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## 问题
类别将变长序列 映射到单个标签――翻译将变长序列 映射到另一个变长序列――输入和输出位于不同的词汇库中,可能是不同语言,并且不保证长度一致――

架构 (Sutskever, Vinyals, Le, 2014) 用一个刻意简单的配方解决了这个问题.

这值得学习有两个原因. 第一,文本向量瓶是NLP中最有教学价值的失败. 它解释了注意和变革者擅长的一切.

## 概念
**Encoder.**读取源句的RNN──它的最终隐藏状态是**context Vector**对整个输入的固定大小摘要.据说除了本机来源,

**Decoder.**另一个用语境的向量初始化的RNN──在每一步,它以前一次生成的代币作为输入,并产生目标词汇上的分布──通过样本或 argmax 选择下一个代币──再把它回去──重复,直到产生`<EOS>`标志或达到最大长度.

**Training:**在每个解码器步骤中计算跨进体损失,并沿着序列求和――通过两个网络做标准的时间回――

**Teacher forcing.**在训练期间,解码器在步骤中`t`的输入是位置`t-1`没有它,早期错误会级联,模型永远不会学会. 推理时,你必须使用模型自己的预测,所以火车/推理分布差距 始终存在. 这个差距被称为**exposure bias**,我知道.

**The bottleneck.**编码学到的关于源头的一切,都必须被挤进一个背景中 矢量――长句会丢细节――罕见词会被模糊掉――重排序(聊天黑人与黑猫) 必须被记住,而不是被计算出来――

注意(10课) 通过让解码器查看 *每一个*编码器隐藏状态,而不仅仅是最后一个,来修复这个问题――这是完整的卖点――


```figure
lstm-gates
```

## 构建它
### 步骤1:一个编码器

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

`outputs`的形状是`[batch, seq_len, hidden_dim]`每个输入位置都处于一个隐藏状态.`hidden`的形状是`[1, batch, hidden_dim]` 最后一步──第08课说的是对输出做分组以进行分类──这里我们保留最后的隐藏状态 作为文本矢量,并忽略每一步的输出──

### 步骤 2:一个解码器

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

解码器 每次调用一步──输入:一批单个标记 和当前隐藏状态──输出:下一个标记的词汇记录,以及更新后的隐藏状态──

### 步骤3:教师强迫的培训循环

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

两个值得命名的旋──`ignore_index=0`跳过装标记上的损失.`teacher_forcing_ratio`是使用真实代币而不是模型预测的概率. 从 1.0 开始,在训练过程中,将其扩大到0.5 左右,以缩小暴露偏差.

### 步骤 4:推断循环 (贪)

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

贪的解码在每一步选择最高概率的代币.**Beam search**我会保留上层...`k`个部分序列,最后选择最高的完整序列.

### 步骤 5: 瓶,证明

在玩具复制任务上训练模型:来源 `[a, b, c, d, e]`目标`[a, b, c, d, e]`△增加序列长度──观察准确性──

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个GRU隐藏状态 无法无损记住40代码输入信息存在于每个编码器步骤,但解码器只看到最后一个状态. 注意 直接修复这一点.

## 使用它
鱼提供`nn.Transformer`基于`nn.LSTM`的后二后三模板──着脸的`transformers`图书馆提供完整的编码-解码模型,它们在数十亿代币上训练而成.

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

现代编码器-解码器 已经使用变压器取代了RNN──高层形状码器、解码器、个个代币 生成) 与2014年的第二次纸完全相同──每个区块内部的机制不同──

### 什么时候仍然选择基于RNN的后续

对于新项目来说,几乎永远不应该这样做.

- 流媒体翻译需要有界内存一次消费一个输入代币.
- 变压器内存成本过高.
- 了解编码和解码瓶,是理解变革者为什么胜出最快的路径.

### 暴露偏见及其缓解方法

- **Scheduled sampling.**训练期间的老师强迫比率,让模型学会从自己的错误中恢复.
- **Minimum risk training.**使用句子级蓝色分数而不是代币级跨体积 进行训练――更接近你真正想要的目标――
- **Reinforcement Learning fine-tuning.**用量度 奖励序列生成器──用于现代LLM RLHF──

这三种仍然适用于基于变压器的生成.

## 交付它
保存为`outputs/prompt-seq2seq-design.md`其他:

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
1. **Easy.**实现玩具复制任务──在目标等于源的输出输入对上训练GRU seq2seq──测量长度5、10、20的精度──复现瓶──
2. **Medium.**添加束宽度 3 的束搜索解码──在小型平行体上对比贪测量 BLEU──记录束搜索胜出的地方(通常是最后几个标志) 以及它没有差异的地方──
3. **Hard.**在10k对对语法数据集上细调`facebook/bart-base`△比较精细调节模型的beam-4输出与基本模型在持久输出上面的输出――报告 BLEU,并挑选10个质量例子――

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
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) 原始后二后二纸──四页──
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078)引入了GRU和编码解码器框架.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)注意力论文──读完本课后立刻阅读──
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 可构建的后二后二+注意 代码──
