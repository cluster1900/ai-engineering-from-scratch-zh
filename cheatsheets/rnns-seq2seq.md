---
id: rnns-seq2seq
title: RNNs, Seq2Seq and N-gram Models
code: RS
subtitle: TextCNN、LSTM 与 GRU，带 teacher forcing 的编码器-解码器，beam search、BLEU、Kneser-Ney，以及注意力为何胜出。
hue: 330
sources: phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text, phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence, phases/05-nlp-foundations-to-advanced/11-machine-translation, phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer, phases/07-transformers-deep-dive/01-why-transformers
source_hash: 534e047c38ab5109
---

## Seq2seq 编码器-解码器
type: architecture
from: phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/docs/en.md

```arch
node | src | 1,1 | Source tokens | src ids | client
node | enc | 2,1 | Encoder GRU | outputs, hidden | model
node | ctx | 3,1 | Context vector | final hidden state | store
node | bos | 1,2 | bos_id token | then the last token | client
node | dec | 2,2 | Decoder GRU | one step at a time | model
node | out | 3,2 | Vocabulary logits | argmax or beam | process
edge | src | enc |
edge | enc | ctx | bottleneck
edge | ctx | dec | init hidden
edge | bos | dec | input_token
edge | dec | out |
edge | out | bos | feed back
```

## 核心公式
type: concepts
from: phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/docs/en.md, phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/docs/en.md, phases/05-nlp-foundations-to-advanced/11-machine-translation/docs/en.md, phases/07-transformers-deep-dive/01-why-transformers/docs/en.md

- **RNN**：$h_t = f(W x_t + U h_{t-1} + b)$。W、U 与 b 跨时间共享。
- **LSTM**：输入、遗忘与输出门，外加细胞状态。梯度稳定。
- **GRU**：两个门。精度相近，参数更少。
- **TextCNN**：宽度为 k 的滤波器是可学习的 k-gram。每个滤波器做全局 max-pool。
- **N-gram**：$P(w \mid \mathrm{ctx}) = \mathrm{count}(\mathrm{ctx}, w) / \mathrm{count}(\mathrm{ctx})$
- **困惑度**：$\exp(-\frac{1}{N} \sum_i \log P(w_i \mid \mathrm{ctx}_i))$。越低越好。
- **Kneser-Ney**：绝对折扣，外加低阶的延续概率。
- **BLEU**：n 为 1 到 4 的 n-gram 精确率，几何平均，简洁惩罚。0 到 100。

## 代码中的任务
type: task-table
span: 2
from: phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/code/main.py, phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/docs/en.md, phases/05-nlp-foundations-to-advanced/11-machine-translation/code/main.py, phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/docs/en.md, phases/07-transformers-deep-dive/01-why-transformers/code/main.py

| 任务 | 代码 |
|---|---|
| N 步后剩下的梯度 | `vanishing_gradient_sim(seq_len, recurrent_weight=0.9)` |
| 不用教师来解码 | `greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50)` |
| 玩具 BLEU | `simple_bleu(hypothesis, reference, max_n=4)` |
| 字符 F 分数 | `chrf(hypothesis, reference, n=6, beta=2)` |
| 计 trigram | `train_ngram(corpus_tokens, n=3)` |
| 平滑的 bigram 模型 | `kneser_ney_bigram_model(corpus_tokens, discount=0.75)` |
| 给留出文本打分 | `perplexity(prob_fn, sentences)` |
| 串行与并行深度 | `rnn_style(xs, decay=0.9)` 对 `attention_style(xs)` |

## 用 teacher forcing 训练
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/docs/en.md

```python
_, hidden = encoder(src)                        # context vector
input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
loss_fn = nn.CrossEntropyLoss(ignore_index=0)   # skip padding
for t in range(tgt_len):
    logits, hidden = decoder(input_token, hidden)
    loss += loss_fn(logits.squeeze(1), tgt[:, t])
    use_teacher = torch.rand(1).item() < teacher_forcing_ratio
    if use_teacher:
        input_token = tgt[:, t].unsqueeze(1)    # ground truth at t-1
    else:
        input_token = logits.argmax(dim=-1)     # own prediction
loss.backward()
```

## TextCNN 前向传播
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/docs/en.md

```python
x = self.embed(token_ids).transpose(1, 2)  # [batch, embed_dim, seq_len]
for conv in self.convs:                    # one per width in (2, 3, 4)
    c = F.relu(conv(x))
    p = F.max_pool1d(c, c.size(2)).squeeze(2)  # strongest activation
    pooled.append(p)
h = torch.cat(pooled, dim=1)               # fixed size for any length
out, _ = self.lstm(x)                      # LSTM classifier instead
pooled = out.max(dim=1).values             # max-pool beats last state
```

## 翻译并打分
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/11-machine-translation/docs/en.md

```python
model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
out = model.generate(**inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),  # target
    num_beams=5, length_penalty=1.0, max_new_tokens=64)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
```

## 默认值与数字
type: defaults
from: phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/docs/en.md, phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/docs/en.md, phases/05-nlp-foundations-to-advanced/11-machine-translation/docs/en.md, phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `teacher_forcing_ratio` | 0.9 | 从 1.0 开始，退火到约 0.5 |
| Beam 宽度 | 3-5 | MT 对一般内容用 4-5 |
| KN `discount` | 0.75 | 从每个 bigram 计数减去 |
| TextCNN 滤波器 | 64 | 宽度 (2, 3, 4)，dropout 0.3 |
| `0.9 ^ 100` | 2.7e-5 | 100 步后剩下的梯度 |
| 长度 40 的复制准确率 | 23% | 长度 5 时 98%。瓶颈 |
| BLEU 档 | 30 | 40 算好，50 算杰出，低于 1 是噪声 |
| Brown 上的 4-gram KN 困惑度 | 140 | transformer LM 得到 15-30 |

## 排障
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/docs/en.md, phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/docs/en.md, phases/05-nlp-foundations-to-advanced/11-machine-translation/docs/en.md, phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 长输出漂移 | 曝光偏差 | 计划采样，退火该比率 |
| 长输入丢掉细节 | 一个固定上下文向量 | 对所有编码器状态做注意力 |
| 普通 RNN 学不到长程 | 梯度消失 | 用 LSTM 或 GRU |
| 贪心输出重复并打环 | 每一步都锁定当前 token | Beam search，宽度 4-5 |
| 输出语言不对 | 脱靶生成 | 检查 `forced_bos_token_id`，跑语言 ID |
| 短输入给出长输出 | 长度惩罚在约 5 个 token 以下 | 按源长度封顶 |
| 流畅输出带新事实 | 幻觉 | 约束解码，人工审查 |
| N-gram 给出概率 0 | 未见过的 n-gram | 用 Kneser-Ney 平滑 |

## 何时用 X
type: qa
from: phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/docs/en.md, phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/docs/en.md, phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/docs/en.md, phases/07-transformers-deep-dive/01-why-transformers/docs/en.md, phases/05-nlp-foundations-to-advanced/11-machine-translation/docs/en.md

- **TextCNN？** 边缘与端侧。它比 transformer 小 10-100 倍。
- **LSTM？** 流式文本，一次一个 token。1k-10k 条标注句用 BiLSTM-CRF。
- **RNN seq2seq？** 几乎从不。仅用于流式翻译或端侧生成。
- **N-gram LM？** 端侧自动补全、重打分，以及任何神经 LM 之前的基线。
- **Transformer？** 其他一切。串行深度是 1，不是 N。内存是 $O(N^2)$。
- **BLEU 还是 chrF？** 两个都报。chrF 对形态丰富的语言计分更准。

## 缩写
type: glossary
from: phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/docs/en.md, phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/docs/en.md, phases/05-nlp-foundations-to-advanced/11-machine-translation/docs/en.md, phases/07-transformers-deep-dive/01-why-transformers/docs/en.md

- **LSTM**：带输入、遗忘与输出门以及细胞状态的门控 RNN。
- **GRU**：带两个门的门控 RNN。
- **NMT**：神经 MT。在平行文本上训练的 Transformer 编码器-解码器。
- **NLLB**：No Language Left Behind。200 语言 MT 模型家族。
- **chrF**：字符级 F 分数。
- **SSM**：状态空间模型。带并行训练的递推。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/11-machine-translation/docs/en.md, phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/docs/en.md

- 始终用 `sacrebleu`。自己的 BLEU 代码给出无法比较的分数。
- 上线时至少用两类指标。质量要紧的地方默认用 COMET。
- 在 50-100 条人工标注例子上校准每个指标。
- 只在相同分词下比较困惑度。
- 几千对干净平行数据胜过几十万对嘈杂数据。
