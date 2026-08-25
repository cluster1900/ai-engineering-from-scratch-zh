# Capstone 10 — Multi-Agent 软件工程团队

> 2026 年的 Multi-Agent 工程团队形态已经趋于一致：架构师制定计划，N 个编码 Agent 在并行 worktree 中工作，审核者负责把关，测试者负责验证。SWE-AF 的工厂架构、MetaGPT 的基于角色的 Prompt、AutoGen 0.4 的类型化 actor graph、Cognition 的 Devin，以及 Factory 的 Droids 都各自独立地采用了这一形态。并行 worktree 将实际耗时转化为吞吐量。共享状态和交接协议则成为故障面。本 Capstone 的目标是构建这支团队，使用 SWE-bench Pro 进行 Evaluation，并报告哪些交接会失败以及失败频率。

**Type:** Capstone
**Languages:** Python / TypeScript（Agent）、Shell（worktree 脚本）
**Prerequisites:** Phase 11（LLM 工程）、Phase 13（Tool）、Phase 14（Agent）、Phase 15（自主系统）、Phase 16（Multi-Agent）、Phase 17（基础设施）
**Phases exercised:** P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

## 问题

单 Agent 编码框架在大型任务上会触及上限。原因并不是某个 Agent 本身能力不足，而是一个包含 20 万 Token 的 Context 无法同时容纳架构计划、四个并行代码库切片、审核意见和测试输出。Multi-Agent 工厂会拆分问题：架构师负责计划，编码 Agent 在并行 worktree 中负责实现，审核者负责把关，测试者负责验证。SWE-AF 的“工厂”架构、MetaGPT 的角色、AutoGen 的类型化 actor graph，这三种表述描述的是同一种形态。

故障面位于交接环节。架构师规划了编码 Agent 无法实现的内容。编码 Agent 生成彼此冲突的 diff。审核者批准了虚构的修复。测试者与仍在写入的编码 Agent 发生竞态。你将构建一支这样的团队，让它处理 50 个 SWE-bench Pro issue，跟踪每一次交接，并发布事后分析报告。

## 概念

角色是类型化 Agent。**Architect**（Claude Opus 4.7）读取 issue、编写计划，并将其拆分为具有明确接口的子任务。**Coders**（Claude Sonnet 4.7，N 个并行实例，每个实例位于一个 `git worktree` 和 Daytona sandbox 中）独立实现子任务。**Reviewer**（GPT-5.4）读取合并后的 diff，批准或提出具体修改要求。**Tester**（Gemini 2.5 Pro）在隔离环境中运行测试套件，并附带产物报告通过或失败。

通信通过共享任务板进行，任务板可以由文件或 Redis 支持。每个角色只消费获准处理的任务。交接使用 A2A protocol 类型化消息。协调方面需要关注：合并冲突解决（通过协调者角色或自动 three-way merge）、共享状态同步（编码 Agent 开始工作后计划即被冻结；重新规划属于独立事件），以及审核把关（审核者不能批准自己所做的修改或自己提出的修改）。

Token amplification 是隐藏成本。每个角色边界都会增加摘要 Prompt 和交接 Context。单 Agent 的 40 轮运行会变成四个角色总计 160 轮。评分标准专门衡量相对于单 Agent 基线的 Token 效率，因为真正的问题不是“Multi-Agent 是否有效”，而是“按单位成本计算，它是否更有优势”。

## 架构

```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   读取 issue，生成包含子任务和接口的计划
      |
      v
任务板（文件 / Redis）
      |
   +-- 子任务 1 -----+-- 子任务 2 -----+-- 子任务 3 -----+-- 子任务 4 -----+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          （4 个并行实例）
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           合并协调者（三方合并 + 冲突解决）
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> 通过？ -> 创建 PR
                                     -> 失败？ -> 路由回编码 Agent
```

## 技术栈

- 编排：使用共享状态和每个 Agent 子图的 LangGraph
- 消息传递：使用 A2A protocol（Google 2025）传递类型化 Agent 间消息
- Models：Opus 4.7（架构师）、Sonnet 4.7（编码 Agent）、GPT-5.4（审核者）、Gemini 2.5 Pro（测试者）
- worktree 隔离：每个编码 Agent 使用 `git worktree add` 和 Daytona sandbox
- 合并协调者：自定义 three-way merge，并通过 LLM 协调冲突解决
- Eval：SWE-bench Pro（50 个 issue）、SWE-AF 场景、用于单元测试的 HumanEval++
- 可观测性：使用带角色标签的 span 和按 Agent 统计 Token 的 Langfuse
- 部署：使用 K8s，每个角色作为独立 Deployment，并根据积压量使用 HPA

```figure
ce-team-handoff
```

## 构建它

1. **任务板。** 使用文件支持的 JSONL 和类型化消息：`plan_request`、`subtask`、`diff_ready`、`review_needed`、`test_needed`、`approved`、`rejected`、`replan_needed`。Agent 订阅标签。

2. **架构师。** 读取 GitHub issue，使用要求提供明确子任务接口的计划模板运行 Opus 4.7，包括涉及的文件、公共函数和测试影响。发出一个包含子任务 DAG 的 `plan_request`。

3. **编码 Agent。** N 个并行 worker，每个 worker 从任务板领取一个子任务。每个 worker 创建一个全新的 `git worktree add` 分支和 Daytona sandbox，实现子任务，并发出包含 patch 和测试变化的 `diff_ready`。

4. **合并协调者。** 所有编码 Agent 完成后，将 N 个分支通过 three-way merge 合并到 staging 分支。只有存在文件级重叠时才使用 LLM 协调冲突解决。

5. **审核者。** GPT-5.4 读取合并后的 diff，不能批准自己编写的 diff。发出 `approved`（无操作），或发出包含具体修改要求的 `review_feedback`，并将其路由回相关编码 Agent。

6. **测试者。** Gemini 2.5 Pro 在干净的 sandbox 中运行测试套件并捕获产物。发出 `test_passed`，或发出包含 stacktrace 的 `test_failed`。失败的测试会返回给负责对应失败子任务的编码 Agent。

7. **交接统计。** 每条跨越角色边界的消息都在 Langfuse 中获得一个 span，其中记录 payload 大小和使用的 Model。计算每个子任务的 Token amplification：`(coder_tokens + reviewer_tokens + tester_tokens + architect_share) / coder_tokens`。

8. **Eval。** 在 50 个 SWE-bench Pro issue 上运行。与单 Agent 基线进行比较，包括 pass@1 和每个已解决 issue 的成本。该基线是在单个 worktree 中运行一个 Sonnet 4.7。

9. **事后分析。** 对每个失败的 issue，识别发生故障的交接环节，例如计划过于模糊、合并冲突、审核者错误批准或测试不稳定。生成交接故障直方图。

## 使用它

```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] 计划：4 个子任务（parser、cache、api、migration）
[board]     已分派给并行 worktree 中的 4 个编码 Agent
[coder-A]   子任务 parser  -> 42 行，本地测试通过
[coder-B]   子任务 cache   -> 88 行，本地测试通过
[coder-C]   子任务 api     -> 31 行，本地测试通过
[coder-D]   子任务 migration -> 19 行，本地测试通过
[merge]     three-way merge：0 个冲突
[reviewer]  对 cache 提出意见（线程池大小）；已路由至 coder-B
[coder-B]   修订：92 行；已提交
[reviewer]  已批准
[tester]    全部 412 项测试通过
[pr]        已创建 #3382   4 个编码 Agent，1 次修订，$4.90，18 分钟
```

## 交付它

交付物是 `outputs/skill-multi-agent-team.md`。给定 issue URL 和并行级别，该团队会生成一个可以合并的 PR，并附带按角色统计的 Token 使用量。

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50 个 issue 子集，pass@1 |
| 20 | 并行加速 | 与单 Agent 基线比较实际耗时 |
| 20 | 审核质量 | 注入 bug 探针上的错误批准率 |
| 20 | Token 效率 | 与单 Agent 相比，每个已解决 issue 的 Token 总量 |
| 15 | 协调工程 | 合并冲突解决、交接故障直方图 |
| **100** | | |

## 练习

1. 在运行过程中向 diff 注入一个明显的 bug，例如在主体之前额外添加 `return None`。衡量审核者的错误批准率。调整审核者 Prompt，直到错误批准率低于 5%。

2. 减少为两个编码 Agent（架构师 + 编码 Agent + 审核者 + 测试者，每个编码 Agent 依次运行两个子任务）。比较实际耗时和通过率。

3. 使用单写入者约束替换合并协调者，要求子任务涉及互不重叠的文件集合。衡量架构师承担的规划负担。

4. 将审核者从 GPT-5.4 替换为 Claude Opus 4.7。衡量错误批准率和 Token 成本差异。

5. 添加第五个角色：文档编写者（Haiku 4.5）。审核后，由它生成一条 changelog。衡量文档质量是否值得额外的 Token 开销。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|-----------------|------------------------|
| Parallel worktree | “隔离分支” | 使用 `git worktree add` 为每个编码 Agent 创建一个全新的工作树 |
| Task board | “共享消息总线” | 由文件或 Redis 存储的类型化消息，供 Agent 订阅 |
| Handoff | “角色边界” | 从一个角色的 Context 传递到另一个角色 Context 的任何消息 |
| Token amplification | “Multi-Agent 开销” | 同一任务中所有角色的 Token 总量 / 单 Agent Token 量 |
| A2A protocol | “Agent-to-agent” | Google 于 2025 年发布的类型化 Agent 间消息规范 |
| Merge coordinator | “集成者” | 执行 three-way merge 并协调冲突的组件 |
| False approval | “审核者幻觉” | 审核者批准了包含已知 bug 的 diff |

## 延伸阅读

- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) — 2026 年 Multi-Agent 工厂的参考架构
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) — 基于角色的 Multi-Agent 框架
- [AutoGen v0.4](https://github.com/microsoft/autogen) — Microsoft 的类型化 actor 框架
- [Cognition AI (Devin)](https://cognition.ai) — 参考产品
- [Factory Droids](https://www.factory.ai) — 另一个参考产品
- [Google A2A protocol](https://a2a-protocol.org/latest/) — Agent 间消息规范
- [git worktree documentation](https://git-scm.com/docs/git-worktree) — 隔离基础机制
- [SWE-bench Pro](https://www.swebench.com) — Evaluation 目标
