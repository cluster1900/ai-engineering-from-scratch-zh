---
id: prompt-engineering
title: Prompt Engineering
code: PE
subtitle: 写 prompt、加例子与推理、投票，并为上下文窗口定预算。来自课文的 Python。
hue: 230
sources: phases/11-llm-engineering/01-prompt-engineering, phases/11-llm-engineering/02-few-shot-cot, phases/11-llm-engineering/05-context-engineering, phases/11-llm-engineering/15-prompt-caching
source_hash: 3156fd874b6b7119
---

## 窗口里有什么
type: architecture
from: phases/11-llm-engineering/05-context-engineering/docs/en.md

```arch
node | sys | 1,1 | System prompt | about 500 tokens
node | tools | 2,1 | Tool definitions | 2K to 8K tokens
node | ret | 3,1 | Retrieved context | 2K to 10K tokens
node | hist | 4,1 | Conversation history | 2K to 20K tokens
node | shots | 4,2 | Few-shot examples | 1K to 3K tokens
node | query | 3,2 | User query | 100 to 500 tokens
node | gen | 2,2 | Generation budget | 2K to 8K tokens
node | win | 1,2 | Context window | input plus output
edge | sys | tools |
edge | tools | ret |
edge | ret | hist |
edge | hist | shots |
edge | shots | query |
edge | query | gen |
edge | gen | win | total
```

## 按查询组装上下文
type: flow
from: phases/11-llm-engineering/05-context-engineering/code/main.py, phases/11-llm-engineering/05-context-engineering/docs/en.md

1. **ContextBudget**：可用 token 是 `max_tokens` 减去 `generation_reserve`。
2. **系统 prompt**：先分配它，最多 1000 token。
3. **select_tools**：`classify_intent` 选出意图。在 2000 token 内保留匹配的工具。
4. **score_relevance**：保留词重叠不低于 0.05 的文档。
5. **reorder_lost_in_middle**：最好的文档放两端。最多分配 3000。
6. **ConversationManager**：已摘要的旧回合加最近回合，最多 5000。
7. **用户查询**：最后分配，最多 500 token。

## 代码中的任务
type: task-table
from: phases/11-llm-engineering/01-prompt-engineering/code/prompt_engineering.py, phases/11-llm-engineering/02-few-shot-cot/code/advanced_prompting.py, phases/11-llm-engineering/05-context-engineering/code/main.py

| Task | Code |
|---|---|
| 从模式构建 prompt | `build_prompt("persona", <variables>)` |
| 构建多轮消息列表 | `build_multi_turn(<pattern>, <turns>)` |
| 给一次输出打分 | `score_response(<text>, <criteria>)` |
| Few-shot CoT prompt | `build_cot_prompt(question, examples, num_examples=3)` |
| 对样本多数投票 | `self_consistency_solve(question, examples, client, model, n_samples=5)` |
| CoT，再投票，再 ToT | `solve_with_escalation(question, examples, client, model)` |
| 给窗口定预算 | `ContextBudget(max_tokens=128000, generation_reserve=4000)` |
| 按意图剪工具 | `select_tools(query, token_budget=2000)` |

## 自一致性投票
type: annotated-code
lang: python
from: phases/11-llm-engineering/02-few-shot-cot/code/advanced_prompting.py

```python
system, user = build_cot_prompt(question, examples)  # 3 worked examples
answers = []
for _ in range(n_samples):                       # n_samples=5
    text = call_llm(client, model, system, user, temperature=0.7)
    answer = extract_answer(text)                # reads "The answer is <n>"
    if answer is not None:
        answers.append(answer)
vote_counts = Counter(answers)
best_answer = vote_counts.most_common(1)[0][0]   # majority answer
confidence = vote_counts[best_answer] / len(answers)
if confidence >= 0.8 and single_answer == sc_answer:
    ...                                          # accept the vote
tree_of_thought_solve(question, client, model, breadth=3, depth=2)  # else
```

## 选一种推理技术
type: command-table
from: phases/11-llm-engineering/02-few-shot-cot/docs/en.md

| Command | What it does |
|---|---|
| Zero-shot | 简单任务。1 次调用，无开销 |
| Few-shot | 格式匹配。额外 200-500 token |
| Zero-shot CoT | 加上 "Let's think step by step"。50-200 token |
| Few-shot CoT | 最佳单次调用准确率。300-600 token |
| Self-consistency, N=5 | 高风险推理。5 倍 token 成本 |
| Tree-of-Thought | 搜索与规划。10-40+ 次调用 |
| ReAct | 有知识接地的推理。3-10+ 次调用 |
| Prompt chaining | 复杂多步任务。2-5 次调用 |

## Prompt 结构与模式
type: concepts
from: phases/11-llm-engineering/01-prompt-engineering/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md

- **系统消息**：身份、规则与约束。跨回合持久。
- **用户消息**：任务。每回合变化。
- **助手预填**：诸如 `{` 的部分回复，用来定格式。
- **角色**：具体角色收窄输出分布。
- **约束**：否定 "Do NOT"、肯定 "Always"、条件 "If X then Y"。
- **分隔符**：诸如 `<analysis>` 的 XML 标签把各段分开。
- **清晰度**：写明格式、长度、受众、包含与排除、一个例子。
- **Lost in the middle**：首尾准确率 85-90%，中间 60-70%。

## 默认值与数字
type: defaults
from: phases/11-llm-engineering/01-prompt-engineering/docs/en.md, phases/11-llm-engineering/02-few-shot-cot/docs/en.md, phases/11-llm-engineering/02-few-shot-cot/code/advanced_prompting.py, phases/11-llm-engineering/05-context-engineering/code/main.py

| Setting | Default | Note |
|---|---|---|
| Temperature，抽取与代码 | 0.0 | Top-p 1.0。也用于 prompt 测试 |
| Temperature，摘要 | 0.3 | Top-p 0.9 |
| Temperature，一般问答 | 0.7 | Top-p 0.95 |
| Few-shot 例子 | 3-5 | 多标签时每标签一个 |
| `n_samples` | 5 | 在 temperature 0.7。N=3 是最少投票 |
| 接受投票的置信度 | 0.8 | 低于它就升级到 Tree-of-Thought |
| `generation_reserve` | 4000 | 为答案预留的 token |
| 系统 prompt 大小 | 500 tokens | 对大多数任务 |

## 排障
type: troubleshooting
from: phases/11-llm-engineering/01-prompt-engineering/docs/en.md, phases/11-llm-engineering/02-few-shot-cot/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md

| Symptom | Cause | Fix |
|---|---|---|
| 泛泛、中位质量的输出 | 任务含糊、角色笼统 | 给出具体角色、格式、长度、受众 |
| 自信的胡说 | 训练数据里该角色太稀 | 用更不狭窄的角色 |
| 模型遵守一条规则、丢掉另一条 | 指令互相矛盾 | 审计 prompt 里的冲突 |
| 任务质量下降 | 规则有 2,000 词 | 把系统 prompt 保持在 500 token 以下 |
| 用户文本覆盖规则 | Prompt injection | 校验输入、用分隔符、过滤输出 |
| 所有投票相同 | 在 temperature 0.0 采样 | 在 0.7 采样 |
| 投票无法比较 | 没有固定答案格式 | 以 "The answer is [number]" 结尾 |
| 关键事实被忽略 | 事实在长上下文中间 | 放在首或尾，或在末尾重复 |

## 缩写
type: glossary
from: phases/11-llm-engineering/01-prompt-engineering/docs/en.md, phases/11-llm-engineering/02-few-shot-cot/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md

- **CoT**：Chain-of-Thought。最终答案前的推理 token。
- **ToT**：Tree-of-Thought。生成、打分并剪枝推理分支。
- **ReAct**：带工具的 Thought、Action、Observation 循环。
- **Self-consistency**：temperature 高于 0 时采 N 个样本，多数投票。
- **Top-p**：nucleus sampling。累积概率为 p 的最小 token 集合。
- **Few-shot**：prompt 里 2-10 个输入与输出例子。
- **NIAH**：Needle in a Haystack。按长上下文中的位置测回忆。

## 问题
type: qa
from: phases/11-llm-engineering/01-prompt-engineering/docs/en.md, phases/11-llm-engineering/02-few-shot-cot/docs/en.md

- **为什么 CoT 有帮助？** 每一个推理 token 都是下一个的上下文。它加深了计算深度。
- **CoT 何时有害？** 简单回忆与单步分类。它多加 50-200 token。
- **在推理模型上用 CoT？** 不用。它在内部推理。那句话是多余的。
- **为什么先在 temperature 0 测试？** 它把 prompt 质量与采样噪声分开。
- **Temperature 与 top-p 一起用？** 不用。只用一个。它们的交互不可预测。

## 提示
type: tips
from: phases/11-llm-engineering/02-few-shot-cot/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md, phases/11-llm-engineering/15-prompt-caching/docs/en.md

- 选与输入相似的例子。覆盖每一个标签。
- 关键指令放前面，查询放最后。
- 丢掉低于相关性阈值的检索块。坏检索比没有更糟。
- 只包含意图需要的工具。工具 token 可降 60-80%。
- 超过诸如 5,000 token 的阈值后摘要历史。
- 为了 prompt 缓存，把稳定部分放顶部，可变部分放底部。
