---
id: pretraining-data
title: Pre-Training Data Pipelines
code: PP
subtitle: 清洗、去重、下载、分词、分片并对预训练语料做滑动窗口。课程里的 Python。
hue: 28
sources: phases/10-llms-from-scratch/03-data-pipelines, phases/19-capstone-projects/31-tokenized-dataset-sliding-window, phases/19-capstone-projects/42-large-corpus-downloader, phases/19-capstone-projects/43-hdf5-tokenized-corpus
source_hash: 4e29cc278516394f
---

## 任务
type: task-table
from: phases/10-llms-from-scratch/03-data-pipelines/code/main.py, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/code/main.py, phases/19-capstone-projects/42-large-corpus-downloader/code, phases/19-capstone-projects/43-hdf5-tokenized-corpus/code

| 任务 | 代码 |
|---|---|
| 跑课程演示 | `python3 code/main.py` |
| 跑测试 | `python3 -m unittest discover code/tests -v` |
| 丢掉近似重复 | `deduplicate(filtered_docs, threshold=0.8)` |
| 把 id 打包装成序列 | `pack_sequences(token_ids, seq_length, pad_id=0)` |
| 下载一个分片 | `process_shard(plan, downloader, dedup, manifest)` |
| 写 HDF5 分片 | `pipeline.write_corpus(shards)` |
| 检查分片哈希 | `validate_corpus(entries)` |
| 读一段 token 范围 | `store.get_slice(start, stop)` |

## 语料到 batch
type: architecture
from: phases/19-capstone-projects/42-large-corpus-downloader/docs/en.md, phases/19-capstone-projects/43-hdf5-tokenized-corpus/docs/en.md

```arch
node | url | 1,1 | Shard URLs | ShardPlanner | client
node | dl | 2,1 | StreamingDownloader | Range resume | process
node | zst | 3,1 | ZstdDocIterator | one doc per line | process
node | dedup | 4,1 | Dedup | MinHasher + LSHIndex | process
node | man | 4,2 | manifest.json | shard sha256 | store
node | h5 | 3,2 | HDF5ShardWriter | one .h5 per shard | store
node | store | 2,2 | MmapTokenStore | swmr reads | store
node | win | 1,2 | SlidingWindowDataloader | input, target | gpu
edge | url | dl | GET
edge | dl | zst | bytes
edge | zst | dedup | docs
edge | dedup | man | verdicts
edge | man | h5 | JSONL shards
edge | h5 | store | shards.json
edge | store | win | get_slice
```

## 清洗与过滤
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/03-data-pipelines/code/main.py, phases/10-llms-from-scratch/03-data-pipelines/docs/en.md

```python
def clean_text(text):
    text = re.sub(r"<[^>]+>", "", text)  # strip HTML tags
    text = re.sub(r"http\S+", "", text)  # drop URLs
    text = re.sub(r"[^\x20-\x7E\n]", "", text)  # printable ASCII only
    text = re.sub(r"\n{3,}", "\n\n", text)  # collapse blank lines
    text = re.sub(r" {2,}", " ", text)  # collapse spaces
    return text.strip()

def quality_filter(text, min_words=50, max_ratio_caps=0.3, max_ratio_special=0.1):
    ...  # False for stubs, ALL CAPS spam, symbol noise
```

## 清洗阶段
type: flow
from: phases/10-llms-from-scratch/03-data-pipelines/docs/en.md

1. **HTML 剥离**：只保留可见文本。
2. **语言检测**：fastText lid.176.bin。置信度低于 0.8 不是干净英语。
3. **质量过滤**：相对 Wikipedia 模型困惑度高意味着垃圾。
4. **去重**：MinHash 加 LSH。Jaccard 高于 0.8 时去掉一份副本。
5. **PII 去除**：结构化 PII 用正则，姓名用 NER 模型。
6. **分词与打包**：每个文档后追加 `tokenizer.eos_id`。

## 滑动窗口数据集
type: annotated-code
lang: python
from: phases/19-capstone-projects/31-tokenized-dataset-sliding-window/code/main.py

```python
ds = SlidingWindowDataset(ids, context_length=16, stride=8)  # stride None means context_length
SlidingWindowDataset.count_windows(num_ids, context_length, stride)  # 1 + usable // stride
x, y = ds[0]  # window[:-1], window[1:]
loader = make_dataloader(ds, batch_size=4, base_seed=7, epoch=0)
generator.manual_seed(base_seed + epoch)  # same seed, same order
```

## 恢复下载
type: flow
from: phases/19-capstone-projects/42-large-corpus-downloader/code/main.py, phases/19-capstone-projects/42-large-corpus-downloader/docs/en.md

1. **StreamingDownloader**：在 `<shard_id>.zst` 旁读 `<shard_id>.partial.json`。
2. **_verify_partial**：文件大小必须等于 `verified_bytes`。sha256 必须等于 `sha256_prefix_hex`。
3. **不匹配**：删除分片与检查点。从字节零重启。
4. **匹配**：发送 `Range` 为 `bytes={resume_from}-`，并以 `ab` 模式打开分片。
5. **响应检查**：状态必须是 206 且 `Content-Range` 匹配。否则做完整 GET。
6. **每个块**：先 `_write_checkpoint` 用 `os.replace`，再 `out.write(buf)`。

## 去重与过滤默认值
type: defaults
from: phases/10-llms-from-scratch/03-data-pipelines/code/main.py, phases/19-capstone-projects/42-large-corpus-downloader/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `min_words` | 50 | 短页失败 |
| `max_ratio_caps` | 0.3 | 全大写垃圾失败 |
| `max_ratio_special` | 0.1 | 符号噪声失败 |
| `threshold` | 0.8 | 丢掉副本的 Jaccard |
| `num_hashes` | 128 | 签名长度 |
| `bands` | 16 | 第 03 课。第 42 课用 `DEFAULT_BANDS = 32` |
| `DEFAULT_SHINGLE_WIDTH` | 5 | 演示用 `shingle_width=3` |
| `CHUNK_BYTES` | `1 << 16` | 下载读大小 |

## 存储默认值
type: defaults
from: phases/19-capstone-projects/43-hdf5-tokenized-corpus/code/main.py, phases/19-capstone-projects/43-hdf5-tokenized-corpus/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `DEFAULT_CHUNK_SIZE` | 8192 | 演示用 `chunk_size=512` |
| `DEFAULT_WINDOW_SIZE` | 64 | 读 `window_size + 1` 个 token |
| `BOUNDARY_TOKEN_ID` | 0 | 文档之间的分隔符 |
| `TOKEN_DTYPE` | `np.uint16` | 字节 id 偏移一 |
| `maxshape` | `(None,)` | 可调整大小的数据集 |
| `libver` | `"latest"` | 写入端 SWMR 需要 |

## 数字与公式
type: concepts
from: phases/10-llms-from-scratch/03-data-pipelines/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md, phases/19-capstone-projects/42-large-corpus-downloader/docs/en.md, phases/19-capstone-projects/42-large-corpus-downloader/code/main.py

- **窗口数**：对 N 个 id、上下文 T、步长 S，为 `max(0, 1 + (N - (T + 1)) // S)`。
- **步长**：`T // 2` 让数据集翻倍。`1` 让它扩大约 `T` 倍。
- **LSH 碰撞**：`1 - (1 - s^r)^b`，其中 `k = b * r`。
- **LSH 阈值**：接近 `(1/b)^(1/r)`。对 b=32、r=4 接近 s = 0.42。
- **压缩**：英语大约每 token 3-4 个字符。
- **序列利用率**：低于 90% 意味着打包浪费算力。
- **去重收益**：Llama 团队大约去掉了 38% 的网页数据。
- **Chinchilla**：参数与 token 大致等比例扩展。

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/42-large-corpus-downloader/docs/en.md, phases/19-capstone-projects/42-large-corpus-downloader/code/main.py, phases/19-capstone-projects/43-hdf5-tokenized-corpus/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md, phases/10-llms-from-scratch/03-data-pipelines/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 恢复的分片含垃圾 | 偏移与文件不一致 | 先检查 sha256 前缀 |
| 服务器忽略 `Range` | 状态不是 206 | 关掉它，做完整 GET |
| 断电后出现重复后缀 | 检查点前就写了字节 | 先检查点，再写 |
| 模型学会预测零 | 读取器读到了零填充 | 在 `token_count` 截断 |
| "file is locked" | 没有 `libver="latest"` 或 SWMR 过晚 | 先创建数据集，再设 `swmr_mode` |
| 吞吐减半 | 块与窗口不匹配 | 块取 `window_size` 的倍数 |
| 运行无故分叉 | 没有打乱种子 | 每个 epoch 传 `base_seed` |
| `LSHIndex` 抛出 `ValueError` | `bands` 除不尽 `num_hashes` | 选能整除 128 的 bands |

## 问答
type: qa
from: phases/10-llms-from-scratch/03-data-pipelines/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md, phases/19-capstone-projects/42-large-corpus-downloader/docs/en.md, phases/19-capstone-projects/43-hdf5-tokenized-corpus/docs/en.md

- **为什么打包而不是填充？** 填充在教不到东西的 token 上浪费算力。
- **为什么要块对角掩码？** 文档 A 的 token 不能关注文档 B 的 token。
- **切片器对短尾巴做什么？** 丢掉最后一个窗口。
- **为什么在分词前去重？** 分词很贵。不要付两次。
- **为什么用墓碑标记重复？** 清单保留指向保留者的链接。
- **为什么每个源分片一个 HDF5？** 崩溃最多丢一个分片。

## 提示
type: tips
from: phases/19-capstone-projects/42-large-corpus-downloader/docs/en.md, phases/19-capstone-projects/43-hdf5-tokenized-corpus/docs/en.md, phases/19-capstone-projects/31-tokenized-dataset-sliding-window/docs/en.md

- 训练器读 `shards.json`，不是目录列表。
- 信任分片行之前，先核对 `manifest.lock` 里的清单 sha256。
- SWMR 模式下每次调整大小后调用 `dataset.flush()`。
- 把 token 缓冲到块大小，再调整大小。从不一次写一个文档。
- 大多数运行用等于上下文长度的步长。
