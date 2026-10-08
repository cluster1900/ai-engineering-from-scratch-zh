# 人类的工作流程模式:简单优于复杂

> 施伦茨和张 (Anthropic,2024年 12 月) 区分了工作流程 (预定义路径) 和代理 (动态工具使用) 五种工作流程模式 覆盖大多数情况――从直接的API调用开始――只有当步骤无法预测时才添加代理――

**类型：**学习 + 构建
**语言：**字符串 (stdlib)
**先修要求：**阶段14 · 01 (代理循环)
**时间：**约60分钟

## 学习目标

- 描述人类的五种工作流程模式:快速链接,路由,并行化,乐队员工,评估者优化器.
- 解释代理与工作流程的区别以及各自的工程成本.
- 识别何时选择工作流而不是代理 (反之亦然)
- 针对脚本的LLM实现全部五种模式.

## 问题

团队常常为本,应使用一次函数调用解决问题引入多代理框架.成本是现实存在的:框架会增加层次,遮蔽提示,隐藏控制流,并诱发过早复杂化.

## 概念

### 工作流程与代理人

- **Workflow。**通过预定义代码路径编排的 LLM 和工具――工程师拥有图――
- **Agent。**动态指导自己的工具并采取自己的步骤――模型 拥有图――

两者都有适用场景――工作流更便宜,更快,也更容易调试――代理能解锁开放式问题,但会让失败模式更难推――

### 增强的法定律师管理

五种模式的基础:一个LLM 接入三种能力 搜索(恢复) 、工具(行动) 、记忆(持久性) 。任何API调用都可以使用这些能力──

### 五种模式

1. **Prompt chaining。**调用1的输出作为调用2的输入――适用于任务具有清晰线性分解的情况――步骤之间可添加可选的程序门――

2. **Routing。**选择要调用下游的LLM或工具――适用于类别明显不同的输入需要不同的处理方式的情况(1级支持对退款对错误对销售)

3. **Parallelization。**并发运行 N 个 LLM调用,聚合结果──两种形态:分类(不同部分) 和投票(同样的提示,运行 N 次,多数/合成)

4. **Orchestrator-workers。**管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管家管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管管

5. **Evaluator-optimizer。**一个法师提出答案,另一个法师评估它.

### 工作流程 胜过代理的地方

- **可预测任务。**如果你能举个步骤,就应该举个步骤.
- **受成本约束的任务。**工作流程有界限的步骤数;代理可能失控膨胀.
- **受合规约束的任务。**审计人员希望阅读图,而不是从轨迹中推断它.

### 代理人胜过工作流程的地方

- **开放式研究。**当下一步取决于上一步回归的内容时.
- **可变长度任务。**需要几分钟到几小时, 步骤数量未知的工作.
- **新领域。**当你还不知道正确的工作流程时  先探索,然后再编码――

### 背景工程 配套内容

"人工智能代理人有效的文本工程" (Anthropic 2025) 形式化了相邻学科:200k窗口是预算,不是容器.


```figure
workflow-chain
```

## 构建它

`code/main.py`针对`ScriptedLLM`实现了所有五种工作流程模式:

- `prompt_chain(input, steps)` 顺序执行――
- `route(input, classifier, handlers)`分类+发送――
- `parallel_vote(prompt, n, aggregator)`运行 N 次并聚聚¬¬¬¬¬¬¬¬¬¬
- `orchestrator_workers(task, workers)`管家 选择工人──
- `evaluator_optimizer(task, proposer, evaluator, max_iter)` 循环直到通过.

运行:

```
python3 code/main.py
```

每种模式都会印出自己的痕迹. 每种模式的总代码行数量约为10-15行;框架成本通常以数千行来衡量.

## 使用它

- 大多数任务使用直接的API调用.
- 只有当模式 真正需要持久状态 (长图) 演员模型的同时性 (AutoGen v0.4) 或角色模板 (CrewAI) 时才使用框架.
- 当你想要Cloed Code的使用时,选择Cloed Agent SDK.

## 交付它

`outputs/skill-workflow-picker.md`对于给定任务来说,描述选择正确的模式,包括决定的合理性,以及当工作流程不够时重构为代理的路径.

## 练习

1. 对于Tier-1支持,例如,这个门应该落在哪里?
2. 给我一个`parallel_vote`增加时间.当一个电话挂时会发生什么?你如何在缺少投票的情况下聚会?
3. 让我`evaluator_optimizer`改成强盗:跨代代保证前两输出,这样晚上出现的好结果不会被晚上出现的坏结果覆盖.
4. 将快速链与路由结合:路由器 选择三条链 中一条──衡量代币 成本,并与单个大快速替代方案比较──
5. 选择你的一个生产功能――绘制工作流图――统计步骤数――这里代理 真的会更好吗?

## 关键术语

| 术语 | 人们常说什么 | 它实际意味着什么 |
|------|----------------|------------------------|
| Workflow | "预定义 flow" | Engineer 拥有的 LLM 和 tool calls graph |
| Agent | "Autonomous AI" | Model 拥有的 graph；动态 tool direction |
| Augmented LLM | "带 tools 的 LLM" | LLM + search + tools + memory；原子单元 |
| Prompt chaining | "顺序 calls" | call N 的输出是 call N+1 的输入 |
| Routing | "Classifier dispatch" | 选择由哪条 chain/model 处理输入 |
| Parallelization | "Fan out" | N 个并发 calls；通过 sectioning 或 voting 聚合 |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM 动态选择 specialist LLMs |
| Evaluator-optimizer | "Proposer + judge" | 迭代直到 evaluator 通过；Self-Refine 的泛化 |

## 延伸阅读

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 五种工作流程模式
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 配套方法
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)状态图何时值其成本
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 产品化的管家工人模式
