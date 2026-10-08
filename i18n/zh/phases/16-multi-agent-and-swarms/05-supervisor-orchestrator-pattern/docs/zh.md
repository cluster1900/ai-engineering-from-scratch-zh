# 监督员/管弦乐员工作模式

> 一个领导代理负责规划和委派;专门的员工在并行环境中执行并回报结果──这是人类研究系统背后的模式──Claude Opus 4作为领导,Sonnet 4作为子组),在内部研究评估上相比单机Opus 4 升级 +90.2%──Anthropic 的工程文章报告称,BrowseComp 上80%的差距仅仅由代币使用 解释多代理 之所以获胜,主要是因为每个子组都获得了一个全新的背景窗口──本课从原始人 构建监督模式,并覆盖生产从部署的2026个工程课程.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 问题

单个代理系统会失败的典型任务. 你问2023年到2026年间多代理系统发生了什么变化? 单个代理会依次阅读五篇论文,把一半的文本填满文本,然后又必须把它们一起推理.等阅读五篇时,它已经忘记了第一篇.

监督者修复了这一点:一个领导代理 规划搜索,把每个子问题委托给一个工人,然后进行合成――每个工人都为了一个狭窄的问题获得自己的200万代币窗口――领导永远不会看到原材料

报告称,在内部研究评估上相比单个Opus 4 提升了90.2%──同篇文章指出,BrowseComp 差的80%仅由 *单独使用代码* 解释──每个子体 拥有新文本是主要机制──

## 概念

### 这种模式

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

永远不读原材料―― 在合成之前,工人永远不会看到彼此的工作―― 每个箭头都是一张带有狭窄的文物的交付――

### 为什么它有效

三种机制:

1. **每个 subagent 都有 fresh context。**探索FIPA-ACL遗产的工人不会带领在规划上消耗的40k代币.
2. **通过 prompt 实现 specialization。**的提示是分解和合成,不是研究──每个工作者的提示都很窄:找到X的变化.聚焦的提示会产生聚焦的结果──
3. **Parallelism。**工人并发运行―― 时间大致是`max(worker_times) + plan + synthesis`没有什么.`sum(worker_times)`,我知道.

### 工程课程 (人类学2025年)

人类文章列出了几条到2026年仍然相关的生产课程:

- **Scale effort to query complexity.**简单查询:一个代理,3-10次工具调用──复杂查询:10+代理──必须由领先者来估计这一点,而不是调用者──
- **Broad then narrow.**首先将其分解为广泛的子问题,然后在答案需要深度时,
- **Rainbow deployments.**代理是长期的 并且状态的──传统蓝绿不适用──人类使用彩虹:逐步推出 新版本,同时让旧版本排泄──
- **Token usage dominates.**单代理的15倍的多代理代币. 只有当任务值才能证明成本合理,才运行它.

### 转向 长图

长图最初发布了一个带高层`create_supervisor`助手的`langgraph-supervisor`通过工具调用将推改做法 直接实现监督模式,因为工具调用能更好地控制 *监督者看到什么*(文本工程) ⋅这个图书馆 仍然可用;doc 现在推工具调用形式──

### 失败模式

- **Lead hallucinates the plan.**如果导致生成的子问题没有分解真实问题,
- **Workers over-explore.**如果没有明确的范围界限,工人会偏离分配给他们,并污染合成步骤.
- **Synthesis conflicts.**两个工人回复相互矛盾的事实――领导者必须重新询问――增加一轮) 或明确标注分歧――默选择一个是最糟糕的失败:用户永远不知道发生分歧――

### 什么时候监督员是错误选择

- **Sequential tasks.**如果步骤 2 确实需要步骤 1 的输出,并行主义 没有收益.
- **Simple queries.**单机代理 处理它们更快,更便宜.
- **Strict determinism.**监督者使用LLM选中的代表团――当审计/重播比适应性更重要时,静态图更好――


```figure
supervisor-hierarchy
```

## 构建它

`code/main.py`使用 `threading`实现一个由三个并行工作者组成的监督者. 领导将查询分为子问题,工作者并发处理每个子问题,领导 进行合成.

关键结构:

- `Lead.plan(query)`将查询分为3个子问题.
- `Worker.run(sub_q)`返回一个假的摘要 (在生产中可以是任何工具使用的代理)
- `Lead.run(query)`在线中启动工人,加入,然后合成.

运行:

```
python3 code/main.py
```

产品会展示计划、带开始/结束时间标签的并行工人痕迹,以及最终合成――你可以看到墙钟 收益:三个0.3秒工人在0.35秒内完成,而不是0.9秒――

## 使用它

`outputs/skill-supervisor-designer.md`接收一个用户查询,并产出监督模式设计:领导系统提示、工作者角色、子问题分解规则,以及合成模板──在构建新的研究风格代理系统前使用它──

## 发布它

部署监督模式 前的检查列表:

- **Model pairing.**领先使用推理层模型 ((Opus类、`o3`工人使用更快,更便宜的模型`o4-mini`
- **Worker timeout.**任何超过2倍的平均运行时间的工人都会被杀害; 领导要么用更窄的范围重新生殖,要么在没有的情况下继续.
- **Token cap per worker.**强制限制 (例如10x预期合成输入) 防止逃离工人
- **Observability.**追踪领导的计划,每个员工的工具调用,以及合成.
- **Rainbow rollout.**需要逐步的版本转换,而不是热交换.

## 练习

1. 运行`code/main.py`在这个演示中,工人数量到多少时间产生的费用将超过平行节约?
2. 实现工人时间:杀死任何运行超过0.5秒的工人,并让合成 剩余结果――你需要什么可观察性才能知道某个工人被切断?
3. 给领袖的合成 添加冲突检测步骤:如果两个工人回复相互矛盾的答案,领袖标注分歧,而不是选择其中一个――不调用LLM时,你如何检测矛盾?
4. 阅读Anthropic的研究系统工程文章.
5. 与 兰格拉夫相比`create_supervisor`什么让你更好地控制监督者能看到什么?为什么人类明确只把子答案传入合成,而不是原始的工人背景?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | “Lead agent” | 一个 orchestrator agent，负责规划、委派和 synthesis。它不亲自执行工作。 |
| Worker | “Subagent” | 由 supervisor 以狭窄 scope 调用的 focused agent，并拥有自己的 context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一件事，不同名称。2026 文献两种说法都会使用。 |
| Fresh context | “Clean window” | Worker 的 context 从它的 system prompt 和分配的问题开始，而不是 lead 的 history。 |
| Rainbow deployment | “Gradual rollout” | Long-running stateful agents 需要 versioned drain-and-replace，而不是 blue-green。 |
| Token dominance | “Context is the variable” | 根据 Anthropic，research-eval 方差的 80% 来自使用的总 Tokens，而不是 model choice。 |
| Scale effort | “Match agent count to complexity” | Lead 估算 query 难度，并据此生成 1 个或 10+ workers。 |
| Synthesis conflict | “Workers disagree” | 两个 workers 返回互相矛盾的 facts；lead 必须暴露分歧，而不是默默选择一方。 |

## 延伸阅读
- [Anthropic engineering — 我们如何构建 multi-agent 研究系统](https://www.anthropic.com/engineering/multi-agent-research-system)监管模式的生产参考
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)工具调用监督员 现在是推形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor)遗产助手,2026年生产中仍在使用中
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 基于交付的监督者变体
