---
id: scaling-laws-pretraining
title: Scaling Laws and Pre-Training
code: SL
subtitle: Chinchilla 公式、过训练、从原始文本到打包 batch 的数据流水线，以及迷你 GPT 训练循环。
hue: 12
sources: phases/07-transformers-deep-dive/13-scaling-laws, phases/10-llms-from-scratch/03-data-pipelines, phases/10-llms-from-scratch/04-pre-training-mini-gpt
source_hash: b09c039a81d2efa9
---

## 数据流水线
type: architecture
from: phases/10-llms-from-scratch/03-data-pipelines/docs/en.md

```arch
node | raw | 1,1 | Raw text | Common Crawl ~250 TB raw | store
node | html | 2,1 | HTML strip | visible text only | process
node | lang | 3,1 | Language detection | lid.176.bin, 0.8 confidence | process
node | qual | 4,1 | Quality filter | perplexity or heuristics | process
node | dedup | 4,2 | Deduplication | MinHash + LSH | process
node | pii | 3,2 | PII removal | regex and NER | process
node | pack | 2,2 | Tokenize + pack | EOS between docs | process
node | load | 1,2 | DataLoader | shuffled batches | queue
edge | raw | html |
edge | html | lang |
edge | lang | qual |
edge | qual | dedup |
edge | dedup | pii |
edge | pii | pack |
edge | pack | load | sequences, masks
```

## 公式
type: concepts
from: phases/07-transformers-deep-dive/13-scaling-laws/docs/en.md, phases/10-llms-from-scratch/03-data-pipelines/docs/en.md, phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md

- **算力**：$C \approx 6 \times N \times D$ FLOPs，用于标准 transformer。
- **Hoffmann 损失**：$L(N, D) = \frac{A}{N^\alpha} + \frac{B}{D^\beta} + E$
- **拟合常数**：$\alpha \approx 0.34$, $\beta \approx 0.28$, $E \approx 1.69$, $A \approx 406$, $B \approx 411$。
- **算力最优**：$N_{\text{opt}} \sim C^{0.5}$, $D_{\text{opt}} \sim C^{0.5}$, $D/N \approx 20$。
- **Jaccard**：共享 shingle 除以全部 shingle。高于 0.8 时去掉一份副本。
- **压缩比**：每个 token 的字符数。英语大约是 3-4。
- **起始损失**：约为 $\ln(V)$。256-token 的字节词表从 5.55 开始。
- **注意力缩放**：除以 $\sqrt{d_k}$。64 维时是 8。

## 模型对照 Chinchilla
type: comparison
from: phases/07-transformers-deep-dive/13-scaling-laws/docs/en.md, phases/10-llms-from-scratch/03-data-pipelines/docs/en.md

| 因素 | GPT-3 | Chinchilla | Llama 3 8B |
|---|---|---|---|
| 参数量 | 175B | 70B | 8B |
| Token 数 | ~300B | 1.4T | 15T |
| 每参数 token 数 | 约 1.7 | 约 20 | 1,875 |
| 判定 | 训练不足 | 按设计算力最优 | 超出最优 94× |
| 原因 | Kaplan 定律：大力推 N | 最小化每 FLOP 损失 | 大规模服务便宜 |

## 算力最优对照过训练
type: comparison
from: phases/07-transformers-deep-dive/13-scaling-laws/docs/en.md, phases/07-transformers-deep-dive/13-scaling-laws/code/main.py

| 因素 | Chinchilla 最优 | 过训练 |
|---|---|---|
| 最小化 | 每个训练 FLOP 的训练损失 | 含推理的总成本 |
| 每参数 token 数 | 约 20 | 100 到 500，按服务量 |
| 付出的成本 | 一次，在训练时 | 额外预训练 FLOPs 一次 |
| 推理成本 | 更高，N 更大 | 更低，N 更小 |
| 代码检查 | `compute_optimal(C)` | `chinchilla_loss(N_under, D_over)` |
| 例子 | Chinchilla 70B 在 1.4T 上 | Llama 3 8B 在 15T 上 |

## 跑数据流水线
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/03-data-pipelines/code/main.py

```python
raw_docs = generate_sample_corpus()
cleaned_docs = [clean_text(doc) for doc in raw_docs]   # strip HTML, URLs, spaces
filtered_docs = [doc for doc in cleaned_docs if quality_filter(doc)]   # length, caps, symbols
deduped_docs, num_removed = deduplicate(filtered_docs, threshold=0.8)   # MinHash + LSH
tokenizer = SimpleTokenizer()
tokenizer.train_bpe(all_text, num_merges=100)
token_ids = tokenize_corpus(deduped_docs, tokenizer)   # adds eos_id after each doc
sequences, masks = pack_sequences(token_ids, seq_length, pad_id=0)   # seq_length 128
loader = PreTrainingDataLoader(sequences, masks, batch_size)   # batch_size 4, shuffled
stats = compute_statistics(deduped_docs, token_ids, sequences, tokenizer.vocab_size())
```

## 一次训练步骤
type: flow
from: phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md, phases/10-llms-from-scratch/04-pre-training-mini-gpt/code/main.py

1. **批次**：取 `seq_len + 1` 个 token。输入丢掉最后一个 token。目标丢掉第一个。
2. **掩码**：`np.triu(np.full((seq_len, seq_len), -1e9), k=1)` 挡住未来位置。
3. **前向**：嵌入、所有块、最终 LayerNorm。Logits 使用 `token_embed.T`。
4. **损失**：`cross_entropy_loss(logits, target_ids)`，带减去最大值的 log-softmax。
5. **反向**：计算所有参数的梯度。
6. **更新**：`block.ffn.W1 -= lr * gW1`，每个张量同样操作。
7. **调度**：GPT-2 在 2,000 步内预热，然后余弦衰减。

## 课程中的函数
type: task-table
from: phases/07-transformers-deep-dive/13-scaling-laws/code/main.py, phases/10-llms-from-scratch/03-data-pipelines/code/main.py, phases/10-llms-from-scratch/04-pre-training-mini-gpt/code/main.py, phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md

| 任务 | 代码 |
|---|---|
| 预测损失 | `chinchilla_loss(N, D)` |
| 求最优 N 和 D | `compute_optimal(C_flops, n_grid=200)` |
| 词 shingle | `get_shingles(text, k=5)` |
| 把签名分桶 | `lsh_buckets(signature, bands=16)` |
| 训练微型 GPT | `train_mini_gpt(corpus, num_steps=200)` |
| GPT-2 家族计数 | `parameter_breakdown()` |
| 权重与 KV 内存 | `memory_estimate()` |

## 默认值
type: defaults
from: phases/10-llms-from-scratch/03-data-pipelines/code/main.py, phases/10-llms-from-scratch/04-pre-training-mini-gpt/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `min_words` | 50 | 丢掉短页 |
| `max_ratio_caps` | 0.3 | 丢掉全大写垃圾 |
| `max_ratio_special` | 0.1 | 丢掉符号噪声 |
| `num_hashes` | 128 | MinHash 签名长度 |
| `bands` | 16 | 更多 band 提高召回 |
| `threshold` | 0.8 | 判定重复的 Jaccard 阈值 |
| `vocab_size` | 50257 | `MiniGPT`，768 维、12 头、12 层 |
| `max_seq_len` | 1024 | GPT-2 上下文窗口 |

## 排障
type: troubleshooting
from: phases/10-llms-from-scratch/03-data-pipelines/docs/en.md, phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 模型逐字复述段落 | 数据中有重复 | MinHash 去重，约占网页数据的 38% |
| 输出含 HTML 标签 | 原始网页文本 | 训练前剥离 HTML |
| 文档互相泄漏 | 打包文档共享注意力 | 使用分块对角掩码 |
| 序列利用率低于 90% | padding 浪费 | 用 EOS 隔开文档再打包 |
| 英语得分置信度低于 0.8 | 不是干净英语 | 过滤掉该文档 |
| 模型早期发散 | 起始学习率过高 | 预热学习率 |
| `exp` 溢出到无穷 | logits 过大 | exp 之前先减去最大值 |
| 梯度在接近第 1 块处消失 | 没有残差路径 | 加上 `x + sublayer(x)` |

## GPT-2 Small 数字
type: concepts
from: phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md

- **总量**：带权重绑定共 124,438,272 个参数。
- **Token 嵌入**：(50257, 768) 是 38,597,376。
- **每块**：7,080,960。注意力 2,359,296，FFN 4,718,592。
- **头**：12 个头，每个 64 维。FFN 从 768 到 3,072。
- **权重绑定**：头复用 token embedding。节省 38M。
- **KV cache**：每个 token 18,432 个值。1024 个 token 在 FP32 下约 75MB。
- **初始化**：权重使用 0.02 标准差。

## 用缩放定律做决策
type: tips
from: phases/07-transformers-deep-dive/13-scaling-laws/docs/en.md, phases/10-llms-from-scratch/03-data-pipelines/docs/en.md

- 基础模型每参数不足 20 个 token 时，微调预计会饱和。
- 当推理占预算大部分时，选更小、训练更久的模型。
- 超过 Chinchilla 最优的 1000× 后，log-loss 变化变成噪声。
- 按连续损失规划预算。基准跳变常常是评分器伪影。
- 更好的数据、Muon 和 MoE 会移动常数，而不是形状。
- 预期存在数据上限：~5 到 10 万亿高质量英语 token。
- Llama 3 配比：50% 网页、25% 代码、13% 书籍和论文、8% 数学、4% 多语言。

## 问题
type: qa
from: phases/07-transformers-deep-dive/13-scaling-laws/docs/en.md, phases/10-llms-from-scratch/03-data-pipelines/docs/en.md, phases/10-llms-from-scratch/04-pre-training-mini-gpt/docs/en.md

- **$E$ 是什么？** 不可约损失。数据本身的熵。
- **为什么过训练？** 训练成本付一次，推理成本永远付。
- **为什么不给每个文档做 padding？** Padding 浪费算力。打包文档并加掩码。
- **为什么 decode 慢？** 它是内存受限的。Prefill 是计算受限的。
