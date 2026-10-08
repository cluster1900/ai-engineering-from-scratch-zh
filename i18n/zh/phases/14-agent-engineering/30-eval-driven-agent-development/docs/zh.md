# 动态代理 开发

> 人类的指导:从简单的提示开始,全面评估优化它们,并且只需要添加多步骤的代理系统.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## 学习目标
- 描述三个评估层次 静态基准,定制线下生产,以及各自的用途.
- 解释评估者优化器 紧密循环
- 描述2026最佳实践:evals与代码放在一起,在CI中运行,并作为公关门──
- 将14阶段的每一个课程连接到它生成的评估案例.

## 问题
代理人可以通过演示.它们会在生产中以演示的方式失败. 基准标志回答的是,这个模型是否具有广泛的能力?

## 概念
### 三个评估层次

1. **Static benchmarks** 用于代码的SWE-bench验证了(课 19) 、用于浏览 / 桌面的 WebArena/OSWorld(课 20) 、用于一般的 GAIA(课 19) 、用于工具使用的 BFCL V4(课 06) ⋅用于跨模型比较和回归门──污染是真实存在的:SWE-bench+ 发现 32.67% 的解决方案泄漏──始终报告 验证 / + 审计 分数──

2. **Custom offline evals** 你的产品形态:
   - 士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士士
   - 基于执行的运行补丁,检查测试) 』
   - 基于轨迹的行动序列与黄金相比;OS世界-人类显示顶级代理是黄金的1.4-2.7x) ⋅

3. **Online evals** 生产:
   - 会议重播 (长)
   - 警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队的警卫队
   - 单步成本 / 延迟跟踪 (课程23节)

### 评价器优化器 (Anthropic)

密切循环:

1. 提出者 生成输出
2. 评价者 进行判断――
3. 反复精炼,直到评价者通过.

任何你重视的代理流程都可以包装到评估者优化器中,以提高可靠性.

### 2026 年最佳实践

- 和代码一起放下.
- 在每个公关上通过CI运行.
- 根据评估分数,门结合,例如相对主要不允许回归 > 5%)
- 每个护都被映射到一个评估案例.
- 每条学到的规则 (反思,工作流的学习规则) 都反映在一个失败的情况.

### 将第14阶段 连起

在14阶段中每一个课程都会产生评估案例:

| Lesson | 它生成的 Eval case |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted、infinite-loop guard |
| 02 ReWOO | 当 tool 失败时，Planner 能正确 replans |
| 03 Reflexion | 学到的 reflections 会在 retry 时应用 |
| 05 Self-Refine/CRITIC | Judge 通过 refined output |
| 06 Tool Use | Argument coercion 生效；unknown tools 被拒绝 |
| 07-10 Memory | Retrieval citations 与 sources 匹配；stale facts 失效 |
| 12 Workflow Patterns | 每种 pattern 都产生正确输出 |
| 13 LangGraph | Resume 精确复现 state |
| 14 AutoGen Actors | DLQ 捕获 crashed handlers |
| 16 OpenAI Agents SDK | Guardrail 在正确输入上触发 |
| 17 Claude Agent SDK | Subagent results 返回 orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score、WebArena success rate、OSWorld efficiency |
| 21 Computer Use | Per-step safety 捕获 injected DOM |
| 23 OTel | Spans 发出 required attributes |
| 26 Failure Modes | Detectors 标记 known failures |
| 27 Prompt Injection | PVE 拒绝 poisoned retrievals |
| 28 Orchestration | Supervisor 路由到正确 specialist |
| 29 Runtime Shapes | DLQ 处理 N% failure |

如果你的评估套件覆盖了每一个项目,你就覆盖了14阶段.

### 进化动力发展会在哪里失败

- **没有 baseline。**没有最后的知名好的评价 无法解读――存储基线――
- **LLM-judge 没有 grounding。**评委也会幻觉――关键模式――05课评委基于外部工具的基础――
- **过拟合 evals。**为评估优化会偏离实用生产的情况.
- **Flaky evals。**无确定性事件会造成虚假报警.


```figure
ae-eval-three-layers
```

## 构建它
`code/main.py`是一个stdlib eval带:

- 带类别的案例登记.
- 一个经过测试的经纪人.
- 评价者优化循环:提出,判断,精炼,直到通过或达到最大的轮子.
- 汇总通过率+与基线的回归――

运行它:

```
python3 code/main.py
```

输出:每个案例的通过/失败,退出旗,CI门判决.

## 使用它
- 在与代理代码相似的 repo 中编写评估案例.
- 通过CI 在每个 PR 上运行它们.
- 在回归时让建设失败.
- 随着时间的变化.
- 将每一个生产失败 绑定到一个新的案例.

## 交付它
`outputs/skill-eval-suite.md`为一个代理产品构建三层评估套件,包含CI门和回归跟踪.

## 练习
1. 拿一个你的生产失败. 编写一个能复现它的评估案例.
2. 为您的域名构建一个包含三个维度的LLM法官分类,
3. 将评估套件 接入CI──在 >=5%回归时让构建失败──
4. 添加轨迹效率指标:代理 相比黄金轨迹 走了多少步?
5. 现在,我们需要补充这个缺陷.

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Static benchmark | “Off-the-shelf eval” | SWE-bench、GAIA、AgentBench、WebArena、OSWorld |
| Custom offline eval | “Domain eval” | 面向你的产品形态的 LLM-as-judge / exec / trajectory |
| Online eval | “Production eval” | Session replay、guardrail alerts、cost/latency tracking |
| Evaluator-optimizer | “Propose-judge-refine” | 迭代直到 judge 通过 |
| CI gate | “Merge blocker” | 在 eval regression 时让 build 失败 |
| Baseline | “Last-known-good” | 用于检测 regression 的 reference score |
| Trajectory efficiency | “Steps over gold” | Agent step count 除以 human expert minimum |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 从简单开始,用评价优化
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选基准
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html)工具使用基准
- [Langfuse docs](https://langfuse.com/) 实践中的评估+重播会议
