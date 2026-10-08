# 层次结构及其故障模式

> 管理人员在副管理员之上,副管理员在员工之上,员工之上.`Process.hierarchical`是教科书版本:一个 `manager_llm`动态委派任务并验证输出――长图 中的等价形式是`create_supervisor(create_supervisor(...))`,当任务本身是真实的组织图时,这是自然的模式.

**类型：**学习 + 构建
**语言：**字符串 (stdlib)
**前置要求：**阶段16 · 05 (监督者模式)
**时间：**时间60分钟

## 问题

一旦理解了监督模式,自然的下一步是:如果员工本身也是监督者,团队有子团队,公司有部门的部门.

问题在于:LLM管理员和人类管理员不同.人类管理员对下属知道有什么稳定的先验.LLM管理员每轮都根据其背景重新推断内容.

## 概念

### 形态

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

每个内部节点都会计划,委托和合成.

### 适用场景

- **清晰的 org mapping。**如果真实任务是部门式的, 法律审查文件,财务审查文件,工程审查文件,然后总结为 exec,
- **Local summarization。**每个副经理会在顶级经理看之前合成自己团队的输出.

### 失效位置

2026年后测试持续发现三种故障模式:

1. **Task assignment error。**读取目标,幻觉出一个分解,并委托给错误的副经理. 因为副经理会顺从处理收到的任务,错误只会在顶层合成时浮现,距离人类本能发现它的位置已经分开了一层.
2. **Output misinterpretation。**副经理 返回 无法验证X──顶级经理 总结为声称X未确认──含义在每层都会漂移──
3. **Consensus loops。**两个副经理意见不一致;顶级经理要求它们和解;它们向下重新委托;工人重新运行;副经理回归略有不同的答案;循环开始──员工的工作`Process.hierarchical`通过步骤限制, 防止这种情况, 但这个限制现在已经变成了超参数.

### 决策问题

序列性管线)vs等级性:你的任务真的有独立的子团队,还是一个伪装成树的线性流程?如果是后者,使用序列性.如果是前者,使用等级性,但要为明确的和解规则预留预算.

### 机组人员的实现

`Process.hierarchical`将经理 LLM 接在专业人员 之上――经理会:

- 接收最高级别任务,
- 将分派任务给机组人员,
- 评估船员的产出,
- 决定接受重新委托,还是重复.

文档:https://docs.crewai.com/en/introduction（在核心概念 下查找"层次流程")

### 实现LangGraph的实现

长度图使用嵌套的`create_supervisor`对于调试来说,这比CrewAI更清晰,你可以分别通过每个图表,但更难表达树的动态重塑.

参考:https://reference.langchain.com/python/langgraph-supervisor。


```figure
swarm-hierarchy-token
```

## 构建它

`code/main.py`运行一个3级等级的层次:

- 总经理将任务分为"工程"和"法律"分支,
- 工程副经理:分为"前端"和"后端"工人,
- 法律副经理:一个工人

演示对比幸福的道路**perturbed path**后观察错误级联:副经理 顺从地执行财务 工作,顶级合成器 报告财务发现,原始法律问题 没有得到答案.

运行:

```
python3 code/main.py
```

输见展示两条路径,并清晰并排对比被问及和被交付──

## 使用它

`outputs/skill-hierarchy-fitness.md`评估给定任务应使用层次性,顺序性,还是平面监督者――输入:任务描述、org结构、调整预算――输出:模式建议,并包含需要防范的具体故障模式――

## 发布它

如果发布了层次性:

- **将 tree depth 限制在 2。**三层已经从可观见性中隐藏了大多数错误.
- **明确 reconciliation budget。**设置顶级经理必须执行前的最大轮次.
- **每次 synthesis 都要有 provenance。**每个节点的总结必须引用其叶子输出.
- **对 decomposition drift 告警。**记录每个步骤管理器的分解;与用户查询做不同.

## 练习

1. 运行`code/main.py`需要多少层次的管理者交给,最高产量才会完全偏离用户的问题?
2. 添加第三层(上 → 下 → 下 → 工人) ──随着深度 增长,测量扰乱的路径 多常会自我修改,以及多常会完全偏离──
3. 在每个副经理实现一个"加拿大"工人,它始终收到未改变的原始用户问题.
4. 阅读 机组人员的`Process.hierarchical`文档――识别 CrewAI 应用的一个具体的防护车,并描述其针对的故障模式――
5. 与CrewAI等级的LangGraph监督者相比.哪个可以更低成本地检查和解循环?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | supervisors 位于 supervisors 之上；只有叶子节点执行工作。 |
| Manager LLM | "The boss" | 在内部节点执行 decomposes、assigns 和 validates 的 LLM。 |
| Decomposition drift | "The boss lost the plot" | Top manager 的拆分不再覆盖原始问题。 |
| Reconciliation loop | "Endless meetings" | Sub-managers 意见不一致；top re-delegates；workers re-run；循环直到 budget 耗尽。 |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | 经验性 guardrail：3+ 层会让 observability 坍塌。 |
| Canary question | "Ground truth at every level" | 一个始终收到未改动原始 query 的 worker，用于检测 drift。 |
| Provenance chain | "Who said what" | 从每次 synthesis 回溯到产生它的 leaf outputs 的 trace。 |

## 延伸阅读

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) 带有经理LLM的教科书式等级
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor)通过`create_supervisor`实现嵌套监督员
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system)为什么人类有意选择平面监督者而不是层次的
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST分类学;关于协调失败的章节记录了分解漂移
