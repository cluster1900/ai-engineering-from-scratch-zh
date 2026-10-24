---
id: dialogue-systems
title: Chatbots and Dialogue State Tracking
code: CS
subtitle: 路由对话轮次、运行 agent 循环、跨轮追踪槽位并为上下文窗口做预算。代码来自课程中的 Python。
hue: 170
sources: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural, phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking, phases/11-llm-engineering/05-context-engineering
source_hash: e4e39898a4e411b5
---

## 混合路由
type: architecture
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md

```arch
node | in | 1,1 | User input | | client
node | rule | 2,1 | Destructive check | danger words | process
node | flow | 3,1 | Structured flow | confirm first | process
node | faq | 2,2 | FAQ retrieval | threshold 0.6 | store
node | agent | 3,2 | LLM agent loop | RAG and tool calls | model
node | tools | 4,2 | Tools | callable functions | process
node | out | 4,1 | Reply | | client
edge | in | rule |
edge | rule | flow | destructive
edge | rule | faq | else
edge | faq | out | match
edge | faq | agent | None
edge | agent | tools | tool_call
edge | flow | out |
```

## Agent 循环
type: flow
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md

1. **开始**：`history` 中有一条用户消息。循环最多运行 `max_steps` 次。
2. **LLM**：`llm(history, tools=tools)` 返回内容或一个 `tool_call`。
3. **检查**：工具名未知或参数不是 dict 时，加入一条错误消息。循环继续。
4. **工具**：运行 `fn(**args)`。调用及其结果进入 `history`。
5. **停止**：不带 `tool_call` 的回复就是最终答案。
6. **预算**：`max_steps` 之后返回 "I could not complete the task in the step budget."

## 代码中的任务
type: task-table
span: 2
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md, phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/docs/en.md, phases/11-llm-engineering/05-context-engineering/code/main.py

| 任务 | 代码 |
|---|---|
| FAQ 回答或 `None` | `faq_respond(user_input, threshold=0.5)` |
| 检测破坏性请求 | `is_destructive_action(text)` |
| 带步数预算的 agent | `agent_loop(user_message, tools, llm, max_steps=5)` |
| 为追踪器打分 | `joint_goal_accuracy(predicted_states, gold_states)` |
| 为窗口做预算 | `ContextBudget(max_tokens=128000, generation_reserve=4000)` |
| 添加带上限的组件 | `budget.allocate("tools", tool_text, max_tokens=2000)` |
| 按意图裁剪工具 | `select_tools(query, token_budget=2000)` |
| 最好的文档放在首尾 | `reorder_lost_in_middle(items, scores)` |

## 基于规则的状态更新
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/code/main.py

```python
SLOT_EXTRACTORS = {"cuisine": extract_cuisine, "area": extract_area,
                   "price": extract_price, "people": extract_people}

def update_state(state, utterance):
    new_state = dict(state)                    # never reset untouched slots
    for slot, extractor in SLOT_EXTRACTORS.items():
        value = extractor(utterance)
        if value is not None:
            new_state[slot] = value            # a correction overwrites
            continue
        if is_negation(utterance, slot):
            new_state[slot] = None             # "never mind the cuisine"
    return new_state
```

## 带 schema 的 LLM 追踪器
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/docs/en.md

```python
class RestaurantState(BaseModel):
    cuisine: Optional[Literal["italian", "chinese", "indian", "thai", "any"]] = None
    area: Optional[Literal["north", "south", "east", "west", "center"]] = None
    price: Optional[Literal["cheap", "moderate", "expensive"]] = None
    people: Optional[int] = None
    day: Optional[str] = None                  # free-form slot

def llm_dst(history, llm):
    prompt = f"""...{render(history)}...Output only the JSON state."""
    return llm(prompt, response_model=RestaurantState)  # whole state each turn
```

## 按查询组装上下文
type: flow
from: phases/11-llm-engineering/05-context-engineering/docs/en.md, phases/11-llm-engineering/05-context-engineering/code/main.py

1. **System prompt**：放在最前。上限 `max_tokens=1000`。
2. **工具**：先 `classify_intent` 再 `select_tools`。上限 2000。
3. **检索**：`score_relevance` 丢弃低于阈值的文档。上限 3000。
4. **重排**：`reorder_lost_in_middle` 把最好的文档放在开头和结尾。
5. **历史**：摘要加最近几轮。上限 5000。
6. **查询**：放在最后。上限 500。其余是生成预留。

## 范式与 DST 术语
type: concepts
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md, phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/docs/en.md

- **基于规则**：模式、意图与槽位填充。超出范围就失效。
- **基于检索**：最近邻的已存回复。不做生成，所以没有幻觉。
- **神经 seq2seq**：流畅，但回复泛化且事实漂移。
- **LLM agent**：规划、调用工具、观察结果、决定下一步。
- **槽位**：后端需要的具名参数，如菜系或日期。
- **分类式 DST**：对每个槽位和候选值判断是或否。封闭词表。
- **生成式 DST**：把槽位值作为文本生成。开放词表。现代默认做法。
- **JGA**：所有槽位都正确的轮次占比。全对或全错。

## 默认值与数字
type: defaults
from: phases/11-llm-engineering/05-context-engineering/code/main.py, phases/11-llm-engineering/05-context-engineering/docs/en.md, phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_tokens` | 128000 | `ContextBudget` 的窗口大小 |
| `generation_reserve` | 4000 | 为回答预留 2,000-4,000 |
| `max_history_tokens` | 5000 | 超过时把最早的 2 轮做成摘要 |
| `token_budget` | 2000 | 单个查询的工具定义 |
| 相关度阈值 | 0.05 | 课文中用 0.1 |
| Token 估算 | 1.3 | 每个空白分隔词的 token 数 |
| `max_steps` | 5 | Agent 步数预算 |
| FAQ `threshold` | 0.5 | 混合路由用 0.6 |

## 故障排查
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md, phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| Agent 声称做了它没做的操作 | 自信地捏造 | 只信任成功的工具返回 |
| 输入覆盖了 system prompt | Prompt 注入 | 视为不可信输入，PVE，确认破坏性操作 |
| 同一工具被反复调用 | 无限循环 | 步数预算，对工具调用去重 |
| 最早的轮次丢失 | 上下文窗口已满 | 对旧轮次做摘要或检索 |
| 中间的事实被忽略 | Lost in the middle | 关键事实放在最前或最后 |
| 纠正一处却清空了其他槽位 | 未改动的槽位被重置 | 只覆盖被纠正的槽位 |
| "Italian" 与 "italian" 不同 | 大小写 | 处处归一化 |
| 旧训练数据失效 | 后来新增了槽位 | 为 schema 加版本 |

## 缩写
type: glossary
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md, phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md

- **DST**：Dialogue State Tracking。跨轮保存槽位-值字典。
- **JGA**：Joint Goal Accuracy。MultiWOZ 2.4 上的顶尖系统达到 80-83%。
- **MultiWOZ**：多领域 WOZ 数据集。标准 DST 基准。
- **LDST**：LLaMA 加 LoRA，用领域-槽位 prompt 做指令微调。
- **TripPy**：基于复制的 DST，使用 BERT 编码。LLM 之前的标准方案。
- **PVE**：Plan-Verify-Execute。先对照计划检查每个动作。
- **RAG**：检索相关文档，再让回复以其为依据。
- **Lost-in-the-middle**：两端准确率 85-90%，中间 60-70%。

## 问答
type: qa
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md, phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md

- **为什么路由而不是用一个模型？** 没有哪种单一架构能处理好所有请求。
- **为什么支付用规则？** 破坏性操作需要确定性的、经确认的流程。
- **增量更新还是重新生成？** 从历史重新生成整个状态。这样能处理纠正。
- **重新生成的代价？** 总 token 为 $O(n^2)$。设上限或对旧轮次做摘要。
- **窗口更大就够了吗？** 不够。精选的 10K 上下文常常胜过堆砌的 100K。

## 技巧
type: tips
from: phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/docs/en.md, phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/docs/en.md, phases/11-llm-engineering/05-context-engineering/docs/en.md

- 低于 FAQ 阈值时返回 `None` 并升级处理。
- 记录 agent 的每一步。测量偏离任务率。
- 混合自由形式槽位（姓名、时间）与封闭槽位（菜系、区域）。
- 总是传入完整历史，让较早的槽位保持已设置。
- 工具裁剪可将工具 token 减少 60-80%。
- 两三个好的 few-shot 示例常常胜过冗长的指令。
