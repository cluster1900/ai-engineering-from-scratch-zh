---
id: tokenization
title: Tokenization and BPE
code: TB
subtitle: 训练、编码并解码一个字节级 BPE tokenizer，再把 id 流切成训练窗口。
hue: 45
sources: phases/05-nlp-foundations-to-advanced/19-subword-tokenization, phases/10-llms-from-scratch/01-tokenizers, phases/10-llms-from-scratch/02-building-a-tokenizer, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/19-capstone-projects/31-tokenized-dataset-sliding-window
source_hash: 61eb8b567821c32e
---

## 任务
type: task-table
from: phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/code/main.py, phases/10-llms-from-scratch/01-tokenizers/docs/en.md, phases/10-llms-from-scratch/02-building-a-tokenizer/docs/en.md, phases/05-nlp-foundations-to-advanced/19-subword-tokenization/docs/en.md

| 任务 | 代码 |
|---|---|
| 训练字节级 BPE | `train(tokenizer, <corpus>, target_vocab_size=320)` |
| 带特殊 token 编码 | `encode(tokenizer, text, allow_special=True)` |
| 把 id 解码成文本 | `decode(tokenizer, ids)` |
| 先做 Unicode 规范化 | `unicodedata.normalize("NFKC", text)` |
| 用 tiktoken 编码 | `enc = tiktoken.get_encoding("cl100k_base")` 然后 `enc.encode(text)` |
| 用 HF tokenizers 训练 | `tokenizer.train(["corpus.txt"], trainer)` |
| 训练 SentencePiece | `spm.SentencePieceTrainer.train(input="corpus.txt", vocab_size=8000)` |
| 加载模型 tokenizer | `AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B")` |

## Tokenizer 与数据流水线
type: architecture
from: phases/10-llms-from-scratch/02-building-a-tokenizer/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md

```arch
node | raw | 1,1 | Raw Text |
node | norm | 2,1 | Normalize | NFKC
node | pre | 3,1 | Pre-Tokenize | split into chunks
node | bpe | 4,1 | BPE Merge | merge table
node | spec | 4,2 | Special Tokens | fixed IDs
node | ids | 3,2 | Token IDs | flat list of ids
node | ds | 2,2 | PyTorch Dataset | windows of T+1 ids
node | dl | 1,2 | DataLoader | seeded shuffle, B x T
edge | raw | norm |
edge | norm | pre |
edge | pre | bpe |
edge | bpe | spec |
edge | spec | ids |
edge | ids | ds | slice
edge | ds | dl | batch
```

## 训练 BPE 合并
type: annotated-code
lang: python
from: phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/code/main.py

```python
tokenizer.initialize(specials)                 # 256 bytes, then specials
units = _build_initial_units(corpus)           # byte tuple -> word count
while tokenizer.vocab_size < target_vocab_size:
    pairs = _count_pairs(units)                # weighted by word count
    max_count = max(pairs.values())
    candidates = sorted(p for p, c in pairs.items() if c == max_count)
    best = candidates[0]                       # tie break on the pair
    if pairs[best] < 2:
        break                                  # no pair repeats
    new_id = tokenizer._add_token(
        tokenizer.vocab[best[0]] + tokenizer.vocab[best[1]]
    )                                          # next free id
    tokenizer.merges[best] = new_id            # order is the rank
    units = _apply_merge_to_corpus(units, best, new_id)
```

## 编码新文本
type: flow
from: phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/docs/en.md, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/code/main.py

1. **特殊 token**：`allow_special=True` 时，字面特殊字符串拿到预留 id。
2. **预分词**：`_pretokenize` 把文本拆成空白与词段。
3. **字节**：每一块变成其 UTF-8 字节 id。
4. **秩**：找到适用于该块的、秩最低的合并。
5. **合并**：用合并后的 id 替换那一对。
6. **重复**：直到表中没有适用的合并。
7. **拼接**：按顺序连接所有块的 id。

## 滑动窗口数据集
type: annotated-code
lang: python
from: phases/19-capstone-projects/31-tokenized-dataset-sliding-window/code/main.py

```python
usable = num_ids - (context_length + 1)        # count_windows
return 1 + usable // stride                    # 0 when usable < 0
start = index * self.stride                    # __getitem__
end = start + self.context_length + 1          # T+1 ids
window = self.ids[start:end]
return window[:-1].clone(), window[1:].clone()  # input, target
generator = torch.Generator()
generator.manual_seed(base_seed + epoch)       # same order on rerun
inputs, targets = next(iter(loader))           # (B, T) and (B, T)
```

## 算法与公式
type: concepts
from: phases/10-llms-from-scratch/01-tokenizers/docs/en.md, phases/05-nlp-foundations-to-advanced/19-subword-tokenization/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md

- **BPE**：合并最频繁的相邻对，直到目标词表大小。
- **字节级 BPE**：基础词表正好 256 个字节。没有未知 token。
- **WordPiece**：按 `count(AB) / (count(A) * count(B))` 合并。续片带 `##`。
- **Unigram**：从大词表开始，剪掉去掉后最不增加语料对数似然的 token。
- **SentencePiece**：在原始 Unicode 上训练 BPE 或 Unigram。空格是 `▁`。
- **tiktoken**：面向预构建词表的快速编码器。它不训练。
- **朴素编码代价**：一个词是 $O(n \cdot \lvert \text{merges} \rvert)$。
- **窗口数**：对 N 个 id、上下文 T、步长 S，是 `max(0, 1 + (N - (T + 1)) // S)`。

## 默认值与数字
type: defaults
from: phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/docs/en.md, phases/05-nlp-foundations-to-advanced/19-subword-tokenization/docs/en.md, phases/10-llms-from-scratch/01-tokenizers/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| 字节字母表 | 256 | 字节 0x00 到 0xFF 的 id |
| GPT-2 词表 | 50,257 | 256 字节、50,000 次合并、1 个特殊 |
| BERT WordPiece 词表 | 30,522 | `##` 续片前缀 |
| Llama 3 词表 | 128,256 | 字节级 BPE |
| GPT-4o 词表 | 200,019 | `o200k_base` 编码 |
| SentencePiece character_coverage | 0.9995 | 日语用 0.995 |
| SlidingWindowDataset 步长 | context_length | stride 为 None 时使用 |
| make_dataloader num_workers | 0 | 切片内存中的张量 |

## 排障
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/19-subword-tokenization/docs/en.md, phases/10-llms-from-scratch/02-building-a-tokenizer/docs/en.md, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/docs/en.md, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/code/main.py, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 部署后模型输出垃圾 | 在词表 A 上训练，用词表 B 部署 | 在 CI 里检查 tokenizer 文件哈希 |
| "hello" 与 " hello" 得到不同 id | 空白歧义 | 显式设置 `add_special_tokens` 与 `add_prefix_space` |
| 聊天模型给出垃圾 | chat template 与训练不同 | 精确匹配训练格式 |
| 非拉丁文本多花 5-10 倍 token | 偏英语的词表 | 训练更大的多语言词表 |
| `\p{L}` 模式失败 | 标准库 `re` 没有 Unicode 属性转义 | 安装 `regex` |
| 特殊 token 编成字节 | `allow_special` 关闭 | 传 `allow_special=True` |
| `KeyError` 未知 token id | id 不在词表里 | 只解码这个 tokenizer 生成的 id |
| 缺少最后一个窗口 | 尾部短于 T+1 个 id | 预期如此。切片器丢掉它 |

## 术语
type: glossary
from: phases/10-llms-from-scratch/01-tokenizers/docs/en.md, phases/10-llms-from-scratch/02-building-a-tokenizer/docs/en.md, phases/05-nlp-foundations-to-advanced/19-subword-tokenization/docs/en.md

- **BPE**：Byte Pair Encoding。对最频繁对的迭代合并。
- **NFKC**：Unicode 规范化。"fi" 连字变成 "fi"。
- **合并表**：有序的对合并列表。它就是 tokenizer。
- **预分词**：BPE 之前的切分规则，好让合并留在词内。
- **Fertility**：每个词的平均 token 数。1.0 完美。
- **压缩比**：产出的 token 数除以输入字节数。越低越好。
- **Chat template**：从消息到扁平 token 序列的模型特定格式。
- **特殊 token**：绕过 BPE 的预留 id，例如 [BOS]、[EOS]、[PAD]。

## 问题
type: qa
from: phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/docs/en.md, phases/10-llms-from-scratch/01-tokenizers/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md

- **为什么要字节字母表？** 每一个 UTF-8 输入在任何合并之前都装进词表。没有未知 token。
- **为什么要预分词？** 没有它，合并会跨词边界，并用短语填满词表。
- **为什么按秩顺序应用合并？** 编码因此确定，并与训练匹配。
- **大词表还是小词表？** 大词表给出更短序列，但嵌入矩阵更大。
- **为什么给打乱设种子？** 这样只差一个超参的两次运行会看到相同的数据顺序。

## 提示
type: tips
from: phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/docs/en.md, phases/10-llms-from-scratch/01-tokenizers/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md, phases/05-nlp-foundations-to-advanced/19-subword-tokenization/docs/en.md

- 在未见过的文本、一个 emoji 以及字面 <|endoftext|> 上测往返。
- 在留出文本上测压缩比，不要在训练语料上测。
- 构建时编码语料一次，然后切片 id 流。
- 在文档之间插入 <|endoftext|> id。
- 对大语料使用等于上下文长度的步长。
- 按模型定词表大小：不到 1B 参数用 32k，1-10B 用 50-100k。
