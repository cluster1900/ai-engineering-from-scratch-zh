---
id: rag-production
title: Production RAG Chatbots and Freshness
code: PC
subtitle: 过滤、融合、缓存、护栏与引用。保持索引新鲜，并对每次排序变化打分。
hue: 160
sources: phases/19-capstone-projects/02-rag-over-codebase, phases/19-capstone-projects/08-production-rag-chatbot, projects/doc-qa-with-citations, projects/rag-freshness-pipeline, projects/semantic-notes-search, projects/retrieval-evaluation-lab
source_hash: ce31382d60cbd54a
---

## 一次受监管的对话轮次
type: architecture
from: phases/19-capstone-projects/08-production-rag-chatbot/code/main.py, phases/19-capstone-projects/08-production-rag-chatbot/docs/en.md

```arch
node | q | 1,1 | Query | role + jurisdiction | client
node | guard | 2,1 | Input guard | BLOCKED_PATTERNS | process
node | filter | 3,1 | Access filter | role or public, tag or any | process
node | fuse | 4,1 | Hybrid retrieve | dense + BM25, RRF 60 | store
node | layout | 4,2 | PromptLayout | system, policy, context | process
node | cache | 3,2 | PromptCache | cache_key hit or miss | store
node | synth | 2,2 | Synthesize | cite or say unsure | model
node | scrub | 1,2 | PII scrub | email and ssn redacted | process
edge | q | guard |
edge | guard | filter | ok
edge | filter | fuse | eligible
edge | fuse | layout | top 3
edge | layout | cache | sha256 prefix
edge | cache | synth |
edge | synth | scrub | answer
```

## 运行、评分与检查
type: command-table
span: 2
from: projects/doc-qa-with-citations/README.md, projects/rag-freshness-pipeline/README.md, projects/semantic-notes-search/README.md, projects/retrieval-evaluation-lab/README.md, phases/19-capstone-projects/02-rag-over-codebase/code/main.py, phases/19-capstone-projects/02-rag-over-codebase/code/ts/README.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py <project> --init learning-artifacts/<project>` | 创建你的工作区。全新 starter 会失败 |
| `python3 scripts/project_test.py <project> --stage 1 --path learning-artifacts/<project>` | 给你代码的一个阶段评分 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 检查参考解答 |
| `python3 cli.py samples/docs "When does cache expire?" --output answer.json --html answer.html` | 把引用回执写成 JSON 和 HTML |
| `cli.py query orchard-index.json tokens --now 210 --max-age 60` | 查询新鲜度快照 |
| `cli.py <notes> "release replicas" --aliases <aliases.json> --out matches.json` | 搜索一个 markdown 文件夹 |
| `cli.py <baseline> <candidate> <judgments> --out retrieval-diff.json` | 按查询对比两次排序结果 |
| `python main.py` | 离线跑 capstone 脚手架 |

## 感知缓存的对话轮次
type: annotated-code
lang: python
from: phases/19-capstone-projects/08-production-rag-chatbot/code/main.py

```python
ok, reason = llama_guard_input(query)          # regex block list first
hits = retrieve(query, role, jurisdiction, corpus, k=3)
context = [f"[{c.anchor()}] {c.text}" for c, _ in hits]
layout = PromptLayout(system=SYSTEM_PROMPT,   # very stable
    policy=f"role={role} jurisdiction={jurisdiction}",
    context=context, question=query)          # question is not cached
cache_hit = cache.check(layout.cache_key())   # sha256 of prefix, 16 hex
answer = presidio_scrub(answer)               # redacts [email] and [ssn]
cache.hit_rate()                              # hits / (hits + misses)
```

## 代码库混合检索
type: annotated-code
lang: python
from: phases/19-capstone-projects/02-rag-over-codebase/code/main.py

```python
tokens = (tokenize(chunk.symbol) * 4 +        # symbol weight 4
          tokenize(chunk.summary) * 2 +       # summary weight 2
          tokenize(chunk.body))               # body weight 1
dense_hits = dense.search(query, k=10)
sparse_hits = bm25.search(query, k=10)
fused = rrf(dense_hits, sparse_hits)          # k_rrf: int = 60
top = rerank(query, fused, top_k=5)           # 0.3 symbol, 0.1 summary
citations = [c.anchor() for c, _ in top]      # repo/path:start-end
```

## 项目函数
type: task-table
from: projects/doc-qa-with-citations/API.md, projects/doc-qa-with-citations/solution, projects/rag-freshness-pipeline/solution, projects/semantic-notes-search/solution/main.py, projects/retrieval-evaluation-lab/solution/main.py

| 任务 | 代码 |
|---|---|
| 加载带 SHA-256 的文本文件 | `load_documents(root)` |
| 带偏移的分块 | `chunk_document(doc, size=200, overlap=30)` |
| 给模型引用设门 | `answer(question, chunks, model)` |
| 规划索引变更 | `diff(previous, incoming)` |
| 提交一份快照 | `commit(path, documents, expected_version)` |
| 丢掉过期证据 | `retrieve(documents, query, now, max_age=3600, k=3)` |
| 构建 TF-IDF 索引 | `build_index(documents, aliases=None)` |
| 给两个系统打分 | `compare_systems(systems, judgments, k)` |

## 新鲜度摄入与查询
type: flow
from: projects/rag-freshness-pipeline/solution, projects/rag-freshness-pipeline/README.md

1. **normalize**：NFC 文本，CRLF 转 LF，strip，然后对正文做 SHA-256。
2. **diff**：新出现的 id 进入 `insert`。
3. **diff**：哈希变了进入 `update`。只有新的 `updated` 时间才进入 `refresh`。
4. **diff**：完整语料里没有的 id 进入 `delete`。
5. **commit**：flock，比较 `expected_version`，写临时文件，fsync，`os.replace`。
6. **retrieve**：年龄低于 0 或高于 `max_age` 时跳过该文档。
7. **retrieve**：分数是匹配词数除以查询词数。按分数、年龄、id 排序。

## 项目输入、输出与检查
type: comparison
from: projects/doc-qa-with-citations/README.md, projects/doc-qa-with-citations/solution/cli.py, projects/rag-freshness-pipeline/README.md, projects/rag-freshness-pipeline/solution/cli.py, projects/semantic-notes-search/README.md, projects/semantic-notes-search/solution/cli.py, projects/retrieval-evaluation-lab/README.md, projects/retrieval-evaluation-lab/solution/cli.py

| 因素 | Doc QA | Freshness | Notes search | Eval lab |
|---|---|---|---|---|
| 构建 | 引用回执 | 新鲜索引 | 词法 TF-IDF 搜索 | 回归 diff |
| 输入 | .txt 文件夹 | 完整语料 JSON | .md 文件夹 | 3 个 JSON 文件 |
| 输出 | answer.json, answer.html | 快照、变更 | matches.json | retrieval-diff.json |
| 关键字段 | start, end, sha256 | version, age, hash | score, matched | delta_ndcg |
| 状态 | answered、abstained | insert 到 delete | 前 k 条匹配 | regressions 计数 |
| 护栏 | needs_review | 过期版本错误 | k 必须为正 | `--fail-on-regression` |

## 默认值与数字
type: defaults
from: projects/doc-qa-with-citations/API.md, projects/rag-freshness-pipeline/solution/cli.py, projects/semantic-notes-search/solution/cli.py, projects/retrieval-evaluation-lab/solution/main.py, phases/19-capstone-projects/08-production-rag-chatbot/docs/en.md, phases/19-capstone-projects/02-rag-over-codebase/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Doc QA 分块 `size` | 200 | `overlap` 是 30 |
| `--max-age` | 3600 | 更旧的证据会被跳过 |
| `--k` | 3 | Freshness、notes 和 eval CLI |
| 笔记大小上限 | 100 KB | 更大的笔记会报错 |
| 相关性等级 | 0..3 | 只能是整数 |
| 重排池 | top-20 | Top-5 进入 synth |
| 缓存命中目标 | 60-80% | 先放稳定前缀 |
| 漂移告警 | 5% | 每周检索质量下降 |

## 排障
type: troubleshooting
from: projects/doc-qa-with-citations/solution, projects/doc-qa-with-citations/README.md, projects/rag-freshness-pipeline/solution, projects/rag-freshness-pipeline/README.md, projects/semantic-notes-search/solution/cli.py, phases/19-capstone-projects/08-production-rag-chatbot/docs/en.md, phases/19-capstone-projects/02-rag-over-codebase/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "unsupported model answer" | 引用不在被引用的块里 | 返回精确跨度及其块 id |
| `state` 是 needs_review | 引用里没有查询词 | 手工判断相关性 |
| `state` 是 abstained | 检索没有找到块 | 跑题查询时这是预期 |
| "stale index version" | 另一个写入者先提交了 | 读快照，传入它的 version |
| "duplicate document id" | 两条传入文档共用一个 id | 让 id 唯一 |
| 编辑过的政策仍被引用 | 索引落后于源 | 再次摄入完整语料 |
| "symlink notes are not supported" | 笔记是链接 | 在文件夹里用普通文件 |
| 生成代码毒化命中 | 语料里有样板代码 | 标成 "generated" 并降权 |

## 代码中的排序指标
type: concepts
from: projects/retrieval-evaluation-lab/solution/main.py, projects/semantic-notes-search/solution/main.py, projects/doc-qa-with-citations/solution/retrieval.py

- **Precision@k**：前 k 里的相关命中，除以 k。
- **Recall@k**：相关命中除以等级高于 0 的全部文档。
- **RR**：第一个相关文档的 1 / rank，否则为 0。
- **nDCG**：增益为 `2 ** grade - 1` 的 DCG，再除以理想 DCG。
- **Unjudged**：前 k 里没有标签的文档。它们的增益为零。
- **Notes IDF**：`math.log((1 + len(terms)) / (1 + count)) + 1`。
- **Doc QA score**：`(1 + math.log(bag[t]))` 乘以一个 IDF 项再求和。

## 问题
type: qa
from: phases/19-capstone-projects/08-production-rag-chatbot/docs/en.md, phases/19-capstone-projects/02-rag-over-codebase/docs/en.md, projects/doc-qa-with-citations/README.md, projects/rag-freshness-pipeline/README.md

- **为什么先按角色过滤？** 访问策略必须在任何分数之前成立。
- **为什么把问题放在最后？** 系统 prompt 和上下文组成被缓存的前缀。
- **重新索引会动到什么？** 只有文本变了的块。imports 变了时边也会变。
- **有效引用能证明答案吗？** 不能。它仍可能不相关或过时。
- **refresh 是一次重写吗？** 不是。相同内容、更晚的时间只更新时间。

## 提示
type: tips
from: phases/19-capstone-projects/08-production-rag-chatbot/docs/en.md, phases/19-capstone-projects/02-rag-over-codebase/docs/en.md

- 标注 100 个跨仓库问题，并给出金标 file:line 答案。
- 保留 200 题 Q/A 金标集和 50 条对抗 prompt。
- 拒绝任何没有 `(repo/path:start-end)` 锚点的断言。
- 一次 50 文件的 push，在 60 秒内重新索引。
