---
id: context-engineering
title: Context Engineering and Agent Memory
code: CE
subtitle: 为上下文窗口做预算、排列上下文顺序、换入换出记忆、融合多个记忆存储并持久化 agent 状态。
hue: 280
sources: phases/11-llm-engineering/05-context-engineering, phases/14-agent-engineering/07-memory-virtual-context-memgpt, phases/14-agent-engineering/08-memory-blocks-sleep-time-compute, phases/14-agent-engineering/09-hybrid-memory-mem0, phases/14-agent-engineering/34-repo-memory-and-state, projects/memory-server
source_hash: de3d6fbb8902e981
---

## 上下文窗口预算
type: architecture
from: phases/11-llm-engineering/05-context-engineering/docs/en.md

```arch
node | sys | 1,1 | System prompt | ~500 tokens, goes first
node | tools | 2,1 | Tool definitions | ~2K-8K tokens
node | ret | 3,1 | Retrieved context | ~2K-10K tokens
node | hist | 4,1 | Conversation history | ~2K-20K tokens
node | shots | 1,2 | Few-shot examples | ~1K-3K tokens
node | query | 2,2 | User query | ~100-500 tokens, goes last
node | gen | 3,2 | Generation budget | ~2K-8K tokens
node | win | 4,2 | Context window | 128K tokens | model
edge | sys | tools |
edge | tools | ret |
edge | ret | hist |
edge | shots | query |
edge | query | gen |
edge | gen | win | fits or truncates
```

## 关键数字
type: concepts
from: phases/11-llm-engineering/05-context-engineering/docs/en.md

- **Lost in the middle**：文档放在最前或最后时准确率为 85-90%。放在 20 个中的第 10 位时为 60-70%。
- **低谷区**：位于上下文 40-70% 位置的内容准确率下降 10-20%。
- **精选胜过堆砌**：10K token 的精选上下文常常胜过 100K token 的堆砌上下文。
- **工具开销**：每个工具 50-200 tokens。50 个工具、每个 150 tokens，共 7,500 tokens。
- **工具裁剪**：可将工具 token 减少 60-80%。
- **历史**：50 轮、每轮 200 tokens，共 10,000 tokens。
- **摘要**：100 tokens 替代原本占 2,000 tokens 的 10 轮。
- **Token 估算**：在 `count_tokens` 中用词数乘以 1.3。

## 按查询组装上下文
type: flow
from: phases/11-llm-engineering/05-context-engineering/docs/en.md, phases/11-llm-engineering/05-context-engineering/code/main.py

1. **分类器**：`classify_intent(query)` 统计每个意图的关键词命中数。没有命中时返回 `["code"]`。
2. **工具选择器**：`select_tools(query, token_budget=2000)` 保留类别匹配的工具。
3. **检索器**：`score_relevance(query, documents)` 按词重叠打分。低于 `threshold` 的文档被丢弃。
4. **重排**：`reorder_lost_in_middle(items, scores)` 把最好的条目放在最前和最后。
5. **历史**：历史超过上限时，`ConversationManager` 把最早的 2 轮做成摘要。
6. **预算**：`ContextBudget` 把每个组件截断到其上限和剩余空间以内。

## ContextEngine.assemble
type: annotated-code
lang: python
from: phases/11-llm-engineering/05-context-engineering/code/main.py, phases/11-llm-engineering/05-context-engineering/docs/en.md

```python
budget = ContextBudget(max_tokens=128000, generation_reserve=4000)
budget.allocate("system_prompt", self.system_prompt, max_tokens=1000)
tools, tool_tokens = select_tools(query, token_budget=2000)
budget.allocate("tools", tool_text, max_tokens=2000)
budget.allocate("retrieved_context", doc_text, max_tokens=3000)
budget.allocate("conversation_history", history_text, max_tokens=5000)
budget.allocate("user_query", query, max_tokens=500)  # query goes last
print(budget.report())  # tokens and percent per component
```

## 记忆工具接口
type: command-table
from: phases/14-agent-engineering/07-memory-virtual-context-memgpt/docs/en.md, phases/14-agent-engineering/07-memory-virtual-context-memgpt/code/main.py, phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/docs/en.md

| 命令 | 作用 |
|---|---|
| `core_memory_append(section, text)` | 写入 prompt 中的固定区段 |
| `core_memory_replace(section, old, new)` | 编辑固定区段 |
| `archival_memory_insert(text)` | 写入可检索的外部存储 |
| `archival_memory_search(query, top_k)` | 把事实换回到下一轮 |
| `conversation_search(query)` | 扫描过去的轮次，包括已被换出的轮次 |
| `block_append(label, text)` | 向记忆块追加文本 |
| `block_replace(label, old, new)` | 编辑记忆块 |
| `block_summarize(label)` | 在记忆块接近上限时压缩它 |

## 记忆设计对比
type: comparison
span: 2
from: phases/14-agent-engineering/07-memory-virtual-context-memgpt/docs/en.md, phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md, phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md

| 因素 | MemGPT 双层 | Letta 记忆块 | Mem0 混合 | 仓库记忆 |
|---|---|---|---|---|
| 存储 | 主上下文加归档 | Core、recall、archival | 向量、KV、图 | 按 schema 存放的 JSON 文件 |
| 写入 | 记忆工具调用 | 块工具与 sleep-time 重写 | `add(text, user_id, metadata)` 写入全部三个 | 先校验，再原子写入 |
| 读取 | `archival_memory_search` | Core 块常驻 prompt | `search(query, user_id)` 融合分数 | 加载并校验 |
| 过时事实 | 整合、失效 | Sleep-time agent 使其失效 | 旧边标记为失效，不删除 | `schema_version` 拒绝未知文件 |
| 主要风险 | 记忆腐化、投毒 | 块膨胀、静默漂移 | Embedding 漂移、图爆炸 | 部分写入 |
| 适用场景 | 数据大于窗口 | 部分事实必须常驻 prompt | 查询混合相似度、查找与关系 | 状态必须比对话活得更久 |

## 代码中的任务
type: task-table
from: phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/code/main.py, phases/14-agent-engineering/09-hybrid-memory-mem0/code/main.py, phases/14-agent-engineering/34-repo-memory-and-state/code/main.py, phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md

| 任务 | 代码 |
|---|---|
| 创建记忆块 | `create(label, description, limit=300)` |
| 检查记忆块是否需要摘要 | `block.near_limit()` |
| 在关键路径之外整合 | `sleep.run(contradictions=[...])` |
| 软删除过时事实 | `self.archival.invalidate(record.rid)` |
| 写入全部三个存储 | `mem.add(text, user_id=..., kv_triples=...)` |
| 融合且限定范围的检索 | `mem.search(query, user_id=..., top_k=3)` |
| 安全地持久化状态 | `atomic_write(path, content)` |
| 拒绝错误写入 | `mgr.commit(state)` 抛出 `SchemaError` |

## 记忆服务器项目
type: command-table
span: 2
from: projects/memory-server/README.md, projects/memory-server/solution/cli.ts

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py memory-server --init <dir>` | 创建你的工作区。全新的 starter 会失败 |
| `python3 scripts/project_test.py memory-server --all --path <dir> --strict` | 为全部四个阶段评分 |
| `node cli.ts --data-dir memory-data --put samples/memory.json` | 追加 `cache-policy` 的修订 1 |
| `node cli.ts --data-dir memory-data --query "cache policy"` | 检索 `docs` 命名空间 |
| `node cli.ts --data-dir memory-data --put samples/memory-updated.json --revision 1` | 追加修订 2。再次提交修订 0 会产生冲突 |
| `node cli.ts --data-dir memory-data --history cache-policy --html history.html` | 打印全部修订并写出对比表 |
| `node cli.ts --data-dir memory-data --serve --port 8788` | 提供 REST 和 MCP 服务。先设置 MEMORY_TOKEN |

## 默认值
type: defaults
from: phases/11-llm-engineering/05-context-engineering/code/main.py, phases/11-llm-engineering/05-context-engineering/docs/en.md, phases/14-agent-engineering/07-memory-virtual-context-memgpt/code/main.py, phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/code/main.py, phases/14-agent-engineering/09-hybrid-memory-mem0/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_tokens` | 128000 | 减去 `generation_reserve` 4000 |
| `max_history_tokens` | 5000 | 超过时把旧轮次做成摘要 |
| `token_budget` | 2000 | 工具定义的上限 |
| 相关度 `threshold` | 0.05 | 课文中的版本用 0.1 |
| `max_messages` | 4 | MemGPT 主上下文。更早的消息进入 `evicted` |
| 记忆块 `limit` | 300 | 字符数。`near_limit` 在 0.8 时触发 |
| `w_relevance` | 0.6 | `w_importance` 0.2，`w_recency` 0.2 |
| `recency_halflife_s` | 86400.0 | 每经过一个半衰期，新近度为 0.5 |

## 故障排查
type: troubleshooting
from: phases/11-llm-engineering/05-context-engineering/docs/en.md, phases/14-agent-engineering/07-memory-virtual-context-memgpt/docs/en.md, phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md, phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 模型忽略了中间的事实 | Lost in the middle | 关键事实放最前，查询放最后。在结尾重复要点 |
| 工具占满窗口 | 每次调用都发送所有工具 | 先分类意图再裁剪工具 |
| 检索被过时事实淹没 | 记忆腐化 | 在 sleep 阶段整合并使其失效 |
| Agent 服从旧的注入笔记 | 记忆投毒 | 把检索到的记忆当作不可信文本 |
| Agent 能回忆但无法引用 | 引用丢失 | 每次写入都存 session ID 和 turn ID |
| 记忆块达到上限 | 块膨胀 | 在会越过上限的那次写入之前先做摘要 |
| 一个用户看到另一个用户的事实 | 范围混用 | 每次写入只选一个范围 |
| 会话在损坏的状态上恢复 | 非原子写入 | 临时文件、`fsync`、`os.replace` |

## 问答
type: qa
from: phases/11-llm-engineering/05-context-engineering/docs/en.md, phases/14-agent-engineering/07-memory-virtual-context-memgpt/docs/en.md, phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md, phases/14-agent-engineering/34-repo-memory-and-state/docs/en.md

- **窗口更大就不需要记忆？** 128k 窗口的基线仍会漏掉长周期事实，而带外部记忆的 4k 窗口 agent 能抓住。
- **为什么用 sleep-time compute？** 主轮次不用等待。Sleep agent 可以用更强、更慢的模型。
- **为什么要三个存储？** 单一存储对三类查询中的两类都不合适。
- **融合如何排序？** 相关度、重要度和新近度的加权和。权重因产品而异。
- **仓库记忆里放什么？** Task id、改动过的文件、假设、阻塞点、下一步动作。不放原始聊天记录。
