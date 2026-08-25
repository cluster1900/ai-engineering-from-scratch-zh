# ReWOO 与 Plan-and-Execute：解耦式规划

> ReAct 在同一数据流中交替执行思考和行动。ReWOO 将它们分开：先制定一个完整计划，再执行。Token 用量减少 5 倍，HotpotQA 准确率提高 4%，而且你可以将 Planner 蒸馏到 7B Model 中。Plan-and-Execute 对这种方式进行了泛化；Plan-and-Act 则将它扩展到了 Web 导航。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop)
**Time:** ~60 分钟

## 学习目标

- 解释为什么与 ReAct 的交错循环相比，ReWOO 的 Planner / Worker / Solver 拆分方式可以节省 Token 并提高稳健性。
- 实现计划 DAG、按依赖顺序运行的 executor，以及组合 Worker 输出的 Solver——全部使用 stdlib。
- 使用 2026 年 Anthropic 提出的“五种 workflow 模式”框架，判断任务应采用先规划后执行，还是交错式 ReAct。
- 识别何时需要 Plan-and-Act 的合成计划数据来处理长时程 Web 或移动端任务。

## 问题

ReAct 的思考—行动—观察交错循环简单而灵活，但每次 Tool 调用都必须携带完整的先前 Context——包括之前的每一个 Thought。Token 用量会随深度呈二次增长。更糟的是，当某个 Tool 在循环中途失败时，Model 必须根据错误 Observation 重新推导整个计划。

ReWOO（Xu 等人，arXiv:2305.18323，2023 年 5 月）注意到了这一点，并作出一个大胆的选择：预先规划整个过程、并行获取证据，最后组合答案。一次 LLM 调用负责规划，N 次 Tool 调用负责获取证据（可以并行），再用一次 LLM 调用求解。这种方式用较低的灵活性（计划是静态的）换取了高得多的 Token 效率和更清晰的故障模式。

## 概念

### 三种角色

```text
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planner 生成一个 DAG。每个节点都会指定一个 Tool、它的参数，以及它依赖哪些先前节点（例如 `#E1`、`#E2` 引用）。Worker 按拓扑顺序执行节点。Solver 将所有内容组合起来。

### 为什么 Token 用量减少 5 倍

ReAct 的 Prompt 长度会随步骤数量线性增长。在第 10 步，Prompt 包含 Thought 1、Action 1、Observation 1、Thought 2、Action 2、Observation 2，依此类推。每个中间步骤还会重复包含原始 Prompt。

ReWOO 的成本是一个较大的 Planner Prompt、N 个较小的 Worker Prompt（每个只包含 Tool 调用，不包含链），以及一个 Solver Prompt。论文测得，在 HotpotQA 上，ReWOO 使用的 Token 约少 5 倍，同时绝对准确率提高 4 个百分点。

### 为什么它更稳健

如果 ReAct 中的 Worker 3 失败，循环必须在执行过程中根据错误继续推理。在 ReWOO 中，Worker 3 会返回一个错误字符串；Solver 能够结合原始计划查看这个错误，并优雅地降低输出质量。故障定位以节点为单位，而不是以步骤为单位。

### Planner 蒸馏

论文的第二项成果是：由于 Planner 看不到 Observation，你可以使用来自 175B 教师 Model 的 Planner 输出对 7B Model 进行 Fine-tuning。小型 Model 负责规划；Inference 时不再需要大型 Model。如今这已成为标准做法——许多 2026 年的生产级 Agent 使用小型 Planner 和大型 executor，或采用相反的组合。

### Plan-and-Execute（2023）

LangChain 团队在 2023 年 8 月发布的文章中，将 ReWOO 泛化为一种名为 Plan-and-Execute 的模式。预先运行的 Planner 输出步骤列表，executor 执行每个步骤，可选的 replanner 可以在观察结果后修改计划。它比 ReWOO 更接近 ReAct（replanner 会将 Observation 重新带入规划过程），但仍保留了 Token 节省优势。

### Plan-and-Act（Erdogan 等人，arXiv:2503.09572，ICML 2025）

Plan-and-Act 将这种模式扩展到长时程 Web 和移动端 Agent。其核心贡献是合成计划数据：带 Label 的轨迹生成器会生成显式包含计划的 Training Data。这些数据用于对 Planner Model 进行 Fine-tuning，使其在类似 WebArena 的任务上执行超过 30–50 个步骤后仍能保持有效，而单条 ReAct 轨迹在这种情况下会失去连贯性。

### 如何选择

| 模式 | 适用场景 |
|---------|------|
| ReAct | 短任务、未知环境、需要响应式异常处理 |
| ReWOO | Tool 已知的结构化任务、对 Token 敏感、证据可并行获取 |
| Plan-and-Execute | 类似 ReWOO，但需要在部分执行后重新规划 |
| Plan-and-Act | 长时程（>30 步）、Web/移动端/computer-use |
| Tree of Thoughts | 搜索带来的价值值得投入相应成本（Lesson 04） |

Anthropic 在 2024 年 12 月给出的建议是：从最简单的方式开始。如果任务只需一次 Tool 调用和一个摘要，就不要构建 ReWOO。如果任务是一项包含 40 个步骤的研究工作，就不要只使用 ReAct。

```figure
rewoo-plan
```

## 动手构建

`code/main.py` 实现了一个玩具 ReWOO：

- `Planner`——一个脚本化策略，根据 Prompt 输出计划 DAG。
- `Worker`——通过注册表分派每个节点的 Tool 调用。
- `Solver`——读取证据并生成最终答案的脚本化组合逻辑。
- 依赖解析——将 `#E1` 等引用替换为先前 Worker 的输出。

该 Demo 使用两步计划回答“法国首都的人口是多少？请四舍五入到百万”：(1) 查找首都，(2) 查找人口，然后求解。

运行：

```bash
python3 code/main.py
```

轨迹会先展示完整计划，然后展示 Worker 结果，最后展示 Solver 的组合过程。将 Token 数量（我们会输出一个粗略的字符数）与 ReAct 风格的交错式运行进行比较——在这类结构化任务中，ReWOO 更胜一筹。

## 实际使用

LangGraph 将 Plan-and-Execute 作为一种 recipe 提供（`create_react_agent` 用于 ReAct，自定义图用于 plan-execute）。CrewAI 的 Flows 直接对这种模式进行编码：你预先定义任务，由 Flow DAG 执行这些任务。Plan-and-Act 的合成数据方法目前仍主要用于研究；其 runtime 模式（显式计划 DAG）则已经通过 LangGraph 和 CrewAI Flows 用于生产环境。

## 交付成果

`outputs/skill-rewoo-planner.md` 会根据用户请求和给定的 Tool 目录生成 ReWOO 计划 DAG。它会先验证计划（无环、每个引用都已解析、每个 Tool 都存在），然后再将其交给 executor。

## 练习

1. 并行执行相互独立的计划节点。对于一个包含 6 个节点和 2 个并行组的 DAG，这能带来什么收益？
2. 添加一个 replanner 节点，在任何 Worker 返回错误时触发。要将 ReWOO 变为 Plan-and-Execute，最小的修改是什么？
3. 使用小型 Model（7B 级别）替换 `Planner`，并让 `Solver` 继续使用 frontier Model。比较端到端质量——这种拆分会在哪里失败？
4. 阅读 ReWOO 论文中关于 Planner 蒸馏的第 4 节。概念性地复现 175B -> 7B 的成果：你需要哪些 Training Data，又该如何评估计划质量？
5. 将这个玩具实现移植为 Plan-and-Act 的轨迹形态：计划是序列，而不是 DAG。相应的权衡会发生哪些变化？

## 关键术语

| 术语 | 人们常说的含义 | 它的实际含义 |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先规划，再并行获取证据，最后求解——规划 Prompt 中不包含 Observation |
| Plan-and-Execute | “LangChain 的 plan-execute 模式” | 在执行后添加可选 replanner 节点的 ReWOO |
| Plan-and-Act | “扩展后的 plan-execute” | 显式拆分 Planner/executor，并使用合成计划 Training Data 处理长时程任务 |
| Evidence reference | “#E1、#E2……” | 分派时由先前 Worker 输出替换的计划节点占位符 |
| Planner distillation | “小型 Planner，大型 executor” | 使用大型教师 Model 的 Planner 轨迹对小型 Model 进行 Fine-tuning |
| Token efficiency | “更少的往返调用” | 论文中，在 HotpotQA 上使用的 Token 比 ReAct 少 5 倍 |
| DAG executor | “拓扑分派器” | 按依赖顺序运行计划节点，并在每一层执行并行处理 |

## 延伸阅读

- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323)——奠基论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572)——使用合成计划扩展 Planner-executor
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview)——框架 recipe
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)——选择能够奏效的最简单模式
