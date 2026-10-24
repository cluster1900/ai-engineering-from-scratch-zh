---
id: bert-gpt-t5
title: BERT, GPT and T5 Compared
code: BG
subtitle: encoder-only、decoder-only 与 encoder-decoder 并排对比。训练目标、掩码、模块、解码方式以及各自的选用时机。
hue: 32
sources: phases/07-transformers-deep-dive/05-full-transformer, phases/07-transformers-deep-dive/06-bert-masked-language-modeling, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder
source_hash: 074f078a03208c41
---

## 三大家族并排对比
type: comparison
from: phases/07-transformers-deep-dive/05-full-transformer/docs/en.md, phases/07-transformers-deep-dive/06-bert-masked-language-modeling/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

| 维度 | BERT | GPT | T5 / BART |
|---|---|---|---|
| 堆叠 | 仅编码器 | 仅解码器 | 编码器加解码器 |
| 注意力 | 双向，无掩码 | 因果三角掩码 | 双向编码器，因果解码器 |
| 交叉注意力 | 无 | 无 | Q 来自解码器，K/V 来自编码器 |
| 训练目标 | 对 15% 的 token 做 MLM | 下一个 token，右移一位 | span 破坏或去噪 |
| 预测 | $P(x_{\text{masked}} \mid x_{\text{unmasked}})$ | $P(x_t \mid x_{<t})$ | 目标 span 或干净序列 |
| 生成文本 | 否 | 是，逐 token 生成 | 是，基于编码器输出生成 |
| 最适合 | 分类、检索、NER | 对话、代码、推理 | 翻译、语音转文本 |
| 例子 | BERT, DeBERTa, ModernBERT | GPT, Llama, Qwen | T5, BART, Whisper |

## 模块连接方式
type: architecture
from: phases/07-transformers-deep-dive/05-full-transformer/docs/en.md, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

```arch
node | src | 1,1 | Source tokens | embed + position | client
node | enc | 2,1 | Encoder block | LN, self MHA, LN, FFN | process
node | encout | 3,1 | Encoder output | (N_src, d_model), runs once | store
node | tgt | 1,2 | Target tokens | shift by one | client
node | self | 2,2 | Masked self-attention | sublayer 1 | process
node | cross | 3,2 | Cross-attention | sublayer 2 | process
node | ffn | 4,2 | FFN | sublayer 3 | process
node | logits | 4,1 | Next-token logits | final LN + projection | model
edge | src | enc |
edge | enc | encout |
edge | tgt | self |
edge | self | cross |
edge | encout | cross | K, V
edge | cross | ffn |
edge | ffn | logits |
```

## 一次 encoder-decoder 前向传播
type: flow
from: phases/07-transformers-deep-dive/05-full-transformer/docs/en.md, phases/07-transformers-deep-dive/05-full-transformer/code/main.py, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

1. **嵌入**：token 变成向量。加上 RoPE 或正弦位置信号。
2. **编码器**：每个块先做 pre-norm 自注意力，再做 pre-norm FFN，各带一条残差。
3. **编码器输出**：每个输入只运行一次编码器。长输入时缓存其输出。
4. **解码器自注意力**：带掩码，因此位置 `i` 只能看到不超过 `i` 的位置。
5. **解码器交叉注意力**：编码器信息进入解码器的唯一通道。
6. **解码器 FFN**：之后在输出投影前再做一次最终 LN。
7. **检查**：6 个 token 的源序列和 5 个 token 的目标序列，输出形状为 `(5, vocab)`。

## 课程代码中的任务
type: task-table
from: phases/07-transformers-deep-dive/05-full-transformer/code/main.py, phases/07-transformers-deep-dive/06-bert-masked-language-modeling/code/main.py, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/code/main.py, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/code/main.py

| 任务 | 代码 |
|---|---|
| BERT 80/10/10 掩码 | `create_mlm_batch(tokens, vocab_size)` |
| 整词掩码 | `whole_word_mlm(tokens, spans, vocab_size)` |
| GPT 因果掩码 | `causal_mask(n)` |
| 下一个 token 损失 | `cross_entropy_shifted(logits, target_ids)` |
| T5 span 破坏 | `corrupt_spans(tokens, mask_rate=0.15)` |
| 还原原始序列 | `round_trip(source, target)` |
| 一个编码器块 | `encoder_block(x, p)` |
| 一个解码器块 | `decoder_block(x, enc_out, p)` |

## 加载各家族模型
type: annotated-code
lang: python
from: phases/07-transformers-deep-dive/06-bert-masked-language-modeling/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

```python
tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")
out = model(**inputs).last_hidden_state   # (1, N, 768), embeddings only
model = AutoModelForCausalLM.from_pretrained("<model>")
out = model.generate(**inputs, max_new_tokens=64,
    temperature=0.7, top_p=0.9, do_sample=True)   # sample a reply
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")
inputs = tok("translate English to French: <text>", return_tensors="pt")   # task name in the input
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

## 预训练目标
type: concepts
from: phases/07-transformers-deep-dive/06-bert-masked-language-modeling/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

- **MLM**：选中 15% 的 token。其中 80% 变成 `[MASK]`，10% 换成随机 token，10% 保持不变。
- **标签**：选中位置为原始 token，其他所有位置为 -100。
- **NSP**：预测句子 B 是否接在 A 之后。RoBERTa 证明它有害，现代编码器不再使用。
- **因果语言模型**：输入 `[t1, t2, t3]`，目标 `[t2, t3, t4]`。对各位置的 $-\log P$ 求和。
- **因果掩码**：若 $j \le i$ 则 $M_{ij} = 0$，否则为 $-\infty$。在 softmax 之前加上。
- **Span 破坏**：平均长度为 3 的 span，共占 15%，每个替换为 `<extra_id_0>`、`<extra_id_1>`。
- **T5 目标**：只包含被破坏的 span，每个跟在对应的哨兵 token 之后。
- **BART**：五种加噪函数。解码器重建完整的原始序列。

## 解码策略
type: command-table
from: phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/code/main.py, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

| 命令 | 作用 |
|---|---|
| `sample_greedy(probs)` | 每步取 argmax。代码补全、确定性任务 |
| `sample_temperature(logits, t, rng)` | 把 logits 除以 T。T 越高多样性越大 |
| `sample_top_k(logits, k, rng)` | 只从前 k 个 token 中采样 |
| `sample_top_p(logits, p, rng)` | 累计概率至少为 p 的最小集合 |
| `sample_min_p(logits, min_p, rng)` | 保留满足 `p >= min_p * max_p` 的 token |
| Beam search | 翻译和摘要使用宽度 4 到 5 |
| 投机解码 | 草稿模型提出 N 个 token，大模型验证 |

## 模块：2017 对比 2026
type: comparison
from: phases/07-transformers-deep-dive/05-full-transformer/docs/en.md

| 组件 | 2017 模块 | 2026 模块 |
|---|---|---|
| 归一化 | LayerNorm，post-norm | RMSNorm，pre-norm |
| FFN 激活 | ReLU | SwiGLU |
| FFN 扩张 | 4× | 2.6×（三个矩阵） |
| 位置 | 正弦绝对位置 | RoPE |
| 注意力 | 完整 MHA | GQA（或 MLA） |
| 偏置项 | 有 | 无 |

## 代码中的默认值
type: defaults
from: phases/07-transformers-deep-dive/05-full-transformer/code/main.py, phases/07-transformers-deep-dive/06-bert-masked-language-modeling/code/main.py, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/code/main.py, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `mask_prob` | 0.15 | BERT 选择比例 |
| `IGNORE_INDEX` | -100 | 未选中位置的标签 |
| `mask_rate` | 0.15 | T5 中落在 span 内的 token 比例 |
| `mean_span` | 3.0 | T5 平均 span 长度 |
| `mask_token` | `<mask>` | BART 掩码与填充 token |
| `layer_norm` eps | 1e-5 | 减去均值 |
| `rms_norm` eps | 1e-6 | 不减均值 |
| `temperature` | 1.0 | `softmax`、top-k、top-p、min-p |

## 各家族的选用时机
type: tips
from: phases/07-transformers-deep-dive/05-full-transformer/docs/en.md, phases/07-transformers-deep-dive/06-bert-masked-language-modeling/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

- 分类、嵌入、NER、NLI 和 RAG 重排序用 BERT。它每个 token 的速度比解码器快 5 到 10×。
- 不要用 BERT 做生成。编码器无法自回归地产生 token。
- 生成、对话、代码和推理用 GPT。decoder-only 的扩展性最干净。
- 开源权重模型默认使用 min-p + temperature 0.7。
- 输入是明确的源序列时用 T5 或 BART：翻译、语音、结构化任务。
- encoder-decoder 搭配 beam search。其输出分布比对话更窄。
- 摘要和抽取用 encoder-decoder 或 decoder-only 都可以。

## 故障排查
type: troubleshooting
from: phases/07-transformers-deep-dive/05-full-transformer/docs/en.md, phases/07-transformers-deep-dive/06-bert-masked-language-modeling/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 微调时没有 `[MASK]` 模型就失效 | 训练时 100% 都是 `[MASK]` | 使用 80/10/10 规则 |
| 模型偷看答案作弊 | 没有因果掩码 | 在 softmax 前加上 `-inf` 三角 |
| 未来位置的权重不是严格的零 | softmax 永远不会输出精确的零 | 在未来位置的分数中填入 `-inf` |
| 深层堆叠中梯度消失 | 没有残差连接 | 使用 `x + sublayer(x)` |
| 12 层之后激活值爆炸 | post-norm | 改用 pre-norm |
| 被破坏的 span 无法还原 | span 记账有差一错误 | 运行往返检查 |
| 长输入解码很慢 | 每一步都重新运行编码器 | 缓存编码器输出 |

## 问答
type: qa
from: phases/07-transformers-deep-dive/05-full-transformer/docs/en.md, phases/07-transformers-deep-dive/06-bert-masked-language-modeling/docs/en.md, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/docs/en.md, phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/docs/en.md

- **为什么 BERT 能利用右侧上下文？** 编码器没有因果掩码。
- **为什么 GPT 训练可以并行？** 一次前向就能得到 N 个下一个 token 损失。推理仍是串行的。
- **一个块有多少参数？** MHA 约为 `4 · d²`。SwiGLU FFN 约为 `3rd²`。
- **为什么 T5 预训练比 BART 便宜？** T5 只解码 span，BART 要解码完整序列。
- **嵌入模型是 BERT 吗？** 是。同样的编码器，配对比损失。
