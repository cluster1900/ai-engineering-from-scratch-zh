---
id: orchestration-patterns
title: Orchestration Patterns Compared
code: OP
subtitle: 选择 supervisor、swarm、hierarchical、debate 或普通工作流。课程里的标准库 Python。
hue: 285
sources: phases/14-agent-engineering/28-orchestration-patterns, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern, phases/16-multi-agent-and-swarms/06-hierarchical-architecture, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks, phases/14-agent-engineering/12-anthropic-workflow-patterns
source_hash: c3f552bc4f7bff2a
---

## 四种拓扑并排对比
type: comparison
span: 2
from: phases/14-agent-engineering/28-orchestration-patterns/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md

| 维度 | Supervisor-worker | Swarm | Hierarchical | Debate |
|---|---|---|---|---|
| 谁来路由 | 一个中心 LLM | 无中心路由器 | Supervisor 的 supervisor | 并行提议者 |
| Agent 如何交谈 | 只通过 supervisor | 直接交接 | 只有叶子做功 | 交叉批评 |
| 演示轨迹 | 最干净 | 最短 | 最深 | 最贵 |
| 适合 | 2-4 个专家 | 延迟重于推理清晰度 | 大规模 agent 群体 | 准确度重于成本 |
| 弱点 | Supervisor 是瓶颈 | 难以推理 | 分解漂移 | 成本 |
| 框架 | LangGraph `create_supervisor` | LangGraph swarm 拓扑 | 嵌套子图或 crew | 自定义 |

## 决策顺序
type: flow
from: phases/14-agent-engineering/28-orchestration-patterns/docs/en.md

1. **单 agent**：从第 12 课的工作流模式开始。
2. **Supervisor-worker**：当你有 2-4 个专家时。
3. **Swarm**：当延迟比推理清晰度更重要时。
4. **Hierarchical**：仅当 supervisor 上下文预算不够时。
5. **Debate**：当准确度比成本更重要时。

## 带并行 worker 的 Supervisor
type: architecture
from: phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/code/main.py

```arch
node | q | 1,2 | User query | | client
node | plan | 2,2 | Lead.plan | 3 sub-questions | model
node | w0 | 3,1 | Worker 0 | fresh context | process
node | w1 | 3,2 | Worker 1 | fresh context | process
node | w2 | 3,3 | Worker 2 | fresh context | process
node | syn | 4,2 | Lead synthesizes | summaries only | model
edge | q | plan |
edge | plan | w0 | sub_q
edge | plan | w1 | sub_q
edge | plan | w2 | sub_q
edge | w0 | syn | summary
edge | w1 | syn | summary
edge | w2 | syn | summary
```

## 何时用各模式
type: tips
from: phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md, phases/14-agent-engineering/28-orchestration-patterns/docs/en.md

- 能枚举步骤时用工作流。
- 下一步取决于上一步返回值时用 agent。
- 研究用 supervisor：每个 worker 有自己的 200k token 窗口。
- 大量时长不等的独立任务用 swarm。
- 任务真有独立子团队时用 hierarchical。
- 第 2 步需要第 1 步输出时用顺序。
- 审计与回放重于适应性时用静态图。
- 生产起点用 CrewAI Flow。自治角色用 Crew。

## 代码中的五种工作流模式
type: task-table
span: 2
from: phases/14-agent-engineering/12-anthropic-workflow-patterns/code/main.py, phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md

| 任务 | 代码 |
|---|---|
| Prompt chaining：输出 N 喂给调用 N+1 | `prompt_chain(input_text, llm, steps)` |
| Routing：分类后分派 | `route(input_text, classifier, handlers)` |
| Parallelization：N 次运行，多数胜出 | `parallel_vote(prompt, llm, n=5)` |
| Orchestrator-workers：选 worker，再综合 | `orchestrator_workers(task, workers, synth)` |
| Evaluator-optimizer：循环直到 PASS | `evaluator_optimizer(task, proposer, evaluator, max_iter=5)` |
| 未知标签的回退处理器 | `handlers.get(label) or handlers.get("default")` |
| 跑全部五个演示 | `python3 code/main.py` |

## Lead 扇出到线程
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/code/main.py

```python
sub_questions = self.plan(query)                  # 3 sub-questions
results: list[WorkerResult | None] = [None] * len(sub_questions)
threads: list[threading.Thread] = []
for i, sq in enumerate(sub_questions):
    w = Worker(worker_id=i, trace=self.trace)     # fresh worker per sub-question
    th = threading.Thread(target=w.run, args=(sq, results, i))
    threads.append(th)
    th.start()                                    # all workers run at once
for th in threads:
    th.join()                                     # wall time near max, not sum
synthesis = self.synthesize(query, [r for r in results if r is not None])
```

## Swarm worker 从同一队列拉取
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/code/main.py

```python
q: queue.Queue = queue.Queue()
for t in tasks:
    q.put(t)                          # no orchestrator assigns work
def worker(wid: int) -> None:
    while True:
        try:
            task = q.get_nowait()
        except queue.Empty:
            return                    # queue drained, worker exits
        fake_work(task)
        with lock:
            counts[wid] += 1          # fast workers pull more jobs
        q.task_done()
```

## 上限与预算
type: defaults
from: phases/14-agent-engineering/28-orchestration-patterns/code/main.py, phases/14-agent-engineering/28-orchestration-patterns/docs/en.md, phases/14-agent-engineering/12-anthropic-workflow-patterns/code/main.py, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Swarm hops | 3 | `while hops < 3` 阻止 A 到 B 再到 A 的弹跳 |
| `parallel_vote` `n` | 5 | 同一提示，多数票 |
| `max_iter` | 5 | Evaluator-optimizer 尝试 5 次后停止 |
| Tree depth | 2 | 三层会藏起大多数错误 |
| Reconciliation rounds | 2 | 然后顶层经理必须拍板 |
| Worker timeout | 2× median runtime | 杀掉，再重生更窄的或跳过 |
| Worker token cap | 10× | 相对预期综合输入 |
| Supervisor specialists | 2-4 | 决策顺序的第 2 步 |

## 要紧的数字
type: concepts
from: phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/code/main.py, phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md

- **研究收益**：在内部研究评测上相对单 agent Opus 4 提升 +90.2%。
- **Token 份额**：BrowseComp 方差的 80% 单靠 token 用量就能解释。
- **Token 成本**：多 agent 大约是单 agent 的 15× token。
- **工作量缩放**：简单查询用 1 个 agent、3-10 次工具调用。复杂的用 10+ 个 agent。
- **墙钟**：三个 0.3 秒的 worker 约 0.35 秒完成，不是 0.9。
- **Swarm 演示**：8 个任务，4 慢（0.4s）4 快（0.1s），4 个 worker。
- **模式体量**：每种工作流模式大约 10-15 行代码。

## 失败与修复
type: troubleshooting
col: 3
from: phases/14-agent-engineering/28-orchestration-patterns/docs/en.md, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 精确回答了错误问题 | Lead 把计划幻觉出来 | 记录计划，对照查询做 diff |
| 综合被污染 | Worker 探索过度 | 设显式范围边界 |
| 用户看不到冲突 | Lead 静默选了一边 | 再问，或陈述分歧 |
| 分支答错主题 | Manager 给分支标错 | 加一个带原查询的 canary worker |
| 子经理循环 | 共识循环 | 设和解预算 |
| 长任务从不跑 | 队列饥饿 | 带老化的优先级队列 |
| 崩溃后任务跑两次 | Worker 中途崩溃 | 让 worker 幂等，用持久队列 |

## 工作流还是 agent
type: comparison
from: phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md

| 维度 | 工作流 | Agent |
|---|---|---|
| 谁拥有图 | 工程师 | 模型 |
| 步数 | 有界 | 可能螺旋 |
| 调试 | 更容易 | 失败模式更难 |
| 审计 | 审计员读图 | 从轨迹推断 |
| 适合 | 可预测任务 | 开放式研究 |

## 问答
type: qa
from: phases/14-agent-engineering/28-orchestration-patterns/docs/en.md, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md

- **为什么通过工具调用做监督？** 你精确决定每个专家看到什么。
- **为什么 supervisor 在研究上能赢？** 每个子 agent 的新鲜上下文是主要机制。
- **为什么要彩虹发布？** Agent 是长运行且有状态的。蓝绿发布行不通。
- **层级错误在哪里显现？** 在顶层综合处，离人能发现它只差一层。
- **报告为什么不用 swarm？** 一群研究者给出独立事实，而不是连贯报告。
- **怎样调试 swarm？** 给每个任务一个 trace ID。用它记录开始和结束。
