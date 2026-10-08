# 编排模式:监督者,群体,层次

> 2026年框架中反复出现四种管弦模式:监督员工,群众/同行,等级,辩论,人类的指导原则是:关键在于为您的需求构建正确的系统.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**阶段14 · 12 (工作流程模式),阶段14 · 25 (多代理辩论)
**Time:** ~60 分钟

## 学习目标
- 描述四种反复出现的管弦乐模式以及每种适合场景.
- 描述2026年兰格链的建议:基于工具调用的监督,而不是监督图书馆.
- 解释人类的构建正确系统规则以及它如何约束拓学选择
- 基于一个脚本化的LLM实现全部四种模式.

## 问题
团队常常在真正需要之前急于使用多代理──四种模式会在不同的框架中反复出现;一旦你能说出它们,就能选择正确的种子,或者完全跳过拓──

## 概念
### 监督员工

- 一个中心将LLM分派任务给专业代理人.
- 决策包括:回到自己的循环,转交给专家,终止.
- 专家们彼此不沟通,所有路由都经过监督.

框架:长度图`create_supervisor`‧人类管家工作者‧机组人员的等级过程──

**2026 LangChain 建议：**通过直接工具调用做监督,而不是使用`create_supervisor`,你可以精确决定每个专家看什么.

### 群体/同行

- 通过共享工具表面直接移动.
- 没有中心路由器.
- 延迟低于监督员.
- 没有单一控制点.

框架:长图群地图类型"",OpenAI代理"SDK交付 (当所有代理都可以交付给所有其他代理)

### 层次性

- 监督管理子监督,子监督 再管理员工──
- 在LangGraph中实现为嵌套子图;在CrewAI中实现为嵌套船员.
- 能扩展到大规模代理群体,但成本更高运营复杂性.

需要什么时间:当单个监管人的背景预算 无法容纳所有专家的描述时.

### 辩论

- 代交叉批评 (课 25)
- 严格来说不是编排,更像验证,但在框架中经常作为一个拓学出现.

### 机组人员与流动

机组人员的部署模式有两种:

- **Flow**通过确定性的事件驱动自动化 (生产环境推起点)
- **Crew**基于自主角色的合作.

这与上述四种模式正确相交,但会映射到拓:流程通常是监督或层次;工作人员通常是带着LLM路由器的监督者.

### 人类的指导

LLM领域的成功不在于构建最复杂的系统,而在于构建正确的系统,以满足您的需求.

决策顺序:

1. 单个代理+工作流程模式 (课 12) 从这里开始.
2. 监督员工 时你有2~4名专家
3.   当延迟比推理清晰度更重要时
4. 层次化  只有当监管环境预算 不足时――
5. 辩论  当准确率比成本更重要时――

### 这个模式很容易出错的地方

- **Topology-first thinking.**在识别多代理解决什么问题之前,就说我们需要多代理.
- **Bouncing handoffs in swarm.**计器使用──
- **Fake hierarchy.**实际上只有两个团队.


```figure
orchestration-pattern
```

## 构建它
`code/main.py`通过使用Stdlib,基于脚本的LLM实现全部四种模式:

- `Supervisor` 中心路由器──
- `Swarm` 带直接的交付.
- `Hierarchical`监督员的监督员――
- `Debate` 并行建议 +批评──

每种模式处理相同的三意图任务 (回报/错误/销售)  痕迹形状不同.

运行:

```
python3 code/main.py
```

输出:每种模式的痕迹+运算――监督员 最清晰;群 最短;层次 最深;辩论 最贵――

## 使用它
- **LangGraph**用于监督和层次的嵌子图)
- **OpenAI Agents SDK**作为工具的手柄,以监督者形状.
- **CrewAI Flow**为了确定性生产环境.
- **Custom**为了辩论,或者当你想要精确控制时.

## 交付它
`outputs/skill-orchestration-picker.md`选择一个拓物,并实现它.

## 练习
1. 通过移动路由器,把一个监督员工转换为群众.
2. 给群众 添加跳计:3次交付 后拒绝. 它能捕捉 A->B->A 的反复跳转吗?
3. 为了一个12个专业领域 构建两级层次系统.
4. 在接近生产模式的工作负载上表 四种模式――哪种在什么指标上胜出(延迟,成本,准确性,可调试性)?
5. 阅读人类的 构建有效代理 文章 文章 把你的每一个生产流程 映射到四种模式之一 有没有无法干净映射的?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | “Router + specialists” | 中心 LLM 分派给 specialists；它们彼此不通信 |
| Swarm | “Peer-to-peer” | 通过共享 tools 直接 handoffs；没有中心 router |
| Hierarchical | “Supervisors of supervisors” | 面向大规模群体的 nested subgraphs |
| Debate | “Proposer + critique” | 并行 proposers，cross-critique（Lesson 25） |
| Tool-call-based supervision | “Supervisor without a library” | 将 supervisor 实现为直接 tool calls，以控制 context |
| Crew | “Autonomous team” | CrewAI 的 role-based collaboration 模式 |
| Flow | “Deterministic workflow” | CrewAI 的 event-driven production 模式 |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 五种模式 + 代理与工作流程
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)监管者,群体,等级
- [CrewAI docs](https://docs.crewai.com/en/introduction)机组人vs流量
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325)辩论模式
