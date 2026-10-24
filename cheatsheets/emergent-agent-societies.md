---
id: emergent-agent-societies
title: Negotiation, Simulation and Agent Economies
code: NS
subtitle: Contract Net、OG-Narrator 议价、Smallville 记忆、心智理论测试、Shapley 贡献分配与第二价格拍卖。
hue: 30
sources: phases/16-multi-agent-and-swarms/16-negotiation-bargaining, phases/16-multi-agent-and-swarms/17-generative-agents-simulation, phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination, phases/16-multi-agent-and-swarms/21-agent-economies
source_hash: 9c7a6188a8e515ae
---

## Contract Net 任务市场
type: flow
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/docs/en.md, phases/16-multi-agent-and-swarms/16-negotiation-bargaining/code/main.py

1. **管理者**：把任务分解成单元。
2. **管理者**：向 worker 广播带任务描述的 `cfp`。
3. **投标者**：返回带 `(price, eta, confidence)` 的 **propose**，或 **refuse**。
4. **管理者**：保留价格在预算内、eta 在截止时间内的投标。
5. **管理者**：选出 conf/price 最大者，发送 **accept-proposal**。
6. **管理者**：向落选者发送 **reject-proposal**。它们去投其他任务。

## 谈判机制
type: concepts
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/docs/en.md

- **OG-Narrator**：由确定性的报价生成器计算价格，LLM 只负责叙述。
- **报价生成器**：针对价格使用 Rubinstein 议价、Zeuthen 策略或以牙还牙。
- **规则**：让 LLM 叙述，不要让 LLM 计算报价。
- **结构化提议**：由 LLM 起草。发送前用 schema 校验。
- **隐藏 CoT**：胜出者私下计算策略。公开通道只展示报价。
- **人设操纵**：“走投无路”的人设能多拿约 20% 的收益。

## 代码中的议价
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/code/main.py

```python
state = BargainState(buyer_max=buyer_max, seller_min=seller_min)
og_narrator_bargain(state, rng, concession=0.35)  # buyer offer
seller_response(state, rng, concession=0.3)       # seller counter
move = max(1, int(concession * (state.seller_offer - prior)))
candidate = min(candidate, state.buyer_max)       # never past own max
naive_llm_bargain(state, rng)          # high variance, often outside ZOPA
bench_deal_rate(buyer_fn, label, trials=1000)     # deal rate in percent
winner = max(feasible, key=lambda b: b.confidence / max(b.price, 1))
```

## 生成式 agent 循环
type: architecture
from: phases/16-multi-agent-and-swarms/17-generative-agents-simulation/docs/en.md, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/code/main.py

```arch
node | obs | 1,1 | Observation | invitation from a neighbor | client
node | stream | 2,1 | Memory stream | append-only log | store
node | retr | 3,1 | Retrieval | top-k by combined score | process
node | refl | 2,2 | Reflection | new belief back into the stream | model
node | plan | 3,2 | Plan | day, hour, action | model
node | act | 4,2 | Act | move to HobbsCafe | process
edge | obs | stream | observe
edge | stream | retr | score
edge | stream | refl | important memories
edge | refl | stream | reflection entry
edge | retr | plan | top-k
edge | plan | act | tick
```

## 记忆检索
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/17-generative-agents-simulation/code/main.py

```python
top = retrieve_top_k(stream, query="party cafe", tick=4, k=3)
recency = math.exp(-0.3 * (tick - m.ts))     # exponential decay by age
importance = m.importance / 10.0              # self-rated 1 to 10
relevance = 0.6 if any(w in m.content.lower() for w in query.lower().split()) else 0.1
score = recency + importance + relevance  # sorted, keep [:k]
a.reflect(tick)          # importance >= 6 in the last 5 ticks
a.update_plan(tick)      # belief adds Plan(tick=5, where="HobbsCafe")
action = a.act(tick)     # move when the plan tick arrives
```

## 心智理论与协调
type: concepts
from: phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination/docs/en.md, phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination/code/main.py

- **零阶**：不对他人建模。agent 只依据自己的观察行动。
- **一阶**：对其他每个 agent 的信念建模。“Alice 相信 X。”
- **二阶**：递归信念。“Alice 相信 Bob 相信 X。”
- **ToM 状态**：`other_models` 属性。保持为 `{agent_id: belief_list}`。
- **Riedl 指标**：与身份关联的分化、目标导向的互补、高阶协同。
- **真实信号**：随时间的互补性，以及在第 T+2 轮前的预判与纠正。
- **演示**：`run_trial(n_agents, n_boxes, tom, seed, max_turns=10)` 统计重复次数。

## 代码中的经济机制
type: task-table
from: phases/16-multi-agent-and-swarms/21-agent-economies/code/main.py, phases/16-multi-agent-and-swarms/21-agent-economies/docs/en.md

| 任务 | 代码 |
|---|---|
| 精确 Shapley，小 N | `shapley_exact(value_fn, agents)` |
| 采样 Shapley | `shapley_sampled(value_fn, agents, samples, rng)` |
| 诚实拍卖 | `second_price(bids)` |
| 胜者付费 | `payment = sorted_bids[1].value` |
| 声誉存储 | `Reputation(alpha=0.95, floor=0.1)` |
| 任务后更新 | `rep.update(agent, quality)` |
| 按声誉路由 | `weighted_choice(agents, rep.weights(agents), rng)` |

## 运行演示
type: command-table
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/docs/en.md, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/docs/en.md, phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination/docs/en.md, phases/16-multi-agent-and-swarms/21-agent-economies/docs/en.md

| 命令 | 作用 |
|---|---|
| 16-16 中的 `python3 code/main.py` | 朴素 LLM 成交约 ~65-75%，OG-Narrator 约 ~85-95% |
| 16-17 中的 `python3 code/main.py` | 5 个 agent 中有 3 个在派对上汇合 |
| 16-18 中的 `python3 code/main.py` | ToM 重复约 ~5%，零阶约 ~35% |
| 16-21 中的 `python3 code/main.py` | 按声誉路由带来 10-20% 的质量提升 |

## 课程代码中的默认值
type: defaults
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/code/main.py, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/code/main.py, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/docs/en.md, phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination/code/main.py, phases/16-multi-agent-and-swarms/21-agent-economies/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_rounds` | 5 | 每次试验的议价轮数 |
| 买方 `concession` | 0.35 | 卖方使用 0.3 |
| 议价 `trials` | 1000 | ToM 基准使用 200 |
| 检索 `k` | 3 | 放入提示词的 top-k 记忆 |
| 反思触发阈值 | 150 | 未处理记忆的重要性之和 |
| `max_turns` | 10 | ToM 收集 token 的预算 |
| `alpha` | 0.95 | 声誉衰减 |
| `floor` | 0.1 | 最低声誉分 |

## 需要记住的数字
type: concepts
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/docs/en.md, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/docs/en.md, phases/16-multi-agent-and-swarms/21-agent-economies/docs/en.md

- **OG-Narrator**：成交率从 26.67% 升到 88.88%。
- **竞赛**：~180k 次谈判。隐藏策略的 agent 胜出。
- **对称配对**：约 40% 的场景出现不公平结果。
- **Smallville**：25 个 agent。其中 24 个原本不知道派对。
- **Shapley 代价**：N=3 有 6 种排列。N=10 有 3.6M 种。
- **Shapley 采样**：100-1000 种排列顺序。

## 失败模式
type: troubleshooting
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/docs/en.md, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/docs/en.md, phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination/docs/en.md, phases/16-multi-agent-and-swarms/21-agent-economies/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 报价超出 ZOPA | 由 LLM 计算价格 | 确定性报价生成器 |
| 对方知道了你的底线 | 保留价格出现在可见的 trace 中 | 使用独立的私有草稿区 |
| agent 走进已关门的商店 | 空间规范错误 | 显式检测规范违例 |
| 检索成本不断增长 | 记忆溢出 | 摘要并剪枝，衰减低重要性记忆 |
| 编造出不存在的关系 | 反思产生幻觉 | 在提示词中放入来源记忆 id |
| 只在演示中能协调 | 只是提示词包装，没有对照 | 设对照条件并使用 `p < 0.05` |
| 信念被绑定到错误的 agent | 时间跨度长，上下文受限 | 显式或外部的 ToM 存储 |
| 某个运营者虚增贡献 | 女巫攻击 | DID 与提高声誉伪造成本 |

## 问答
type: qa
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/docs/en.md, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/docs/en.md, phases/16-multi-agent-and-swarms/21-agent-economies/docs/en.md

- **更大的模型议价更好吗？** 不会。它的语言更好，但策略错误相近。
- **为什么 Contract Net 能扩展到 100 个以上 worker？** 它是广播加响应，而不是同步聊天。
- **Smallville 的哪个部分可以去掉？** 都不能。每次消融都会降低可信度。
- **为什么用第二价格？** 在单调聚合下，agent 会按真实价值出价。
- **什么时候 agent 经济有意义？** 开放网络、可验证的输出、长周期工作。

## 上线检查清单
type: tips
from: phases/16-multi-agent-and-swarms/16-negotiation-bargaining/docs/en.md, phases/16-multi-agent-and-swarms/17-generative-agents-simulation/docs/en.md, phases/16-multi-agent-and-swarms/21-agent-economies/docs/en.md

- 议价限制在 3-5 轮。陷入僵局时上交给调解者。
- 在协议边界上拒绝超出 ZOPA 的报价。
- 记忆只追加。更正以新条目记录。
- 记录驱动每个动作的 top-k 记忆。
- 从声誉开始，而不是从代币开始。
- 先验证，再奖励。
