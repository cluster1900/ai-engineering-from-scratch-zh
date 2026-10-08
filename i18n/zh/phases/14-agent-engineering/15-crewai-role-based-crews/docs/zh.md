# 基于角色的船员和流动

> 工作人员AI是基于角色的多代理框架. 工作人员,任务,工作人员,过程. 两种顶层形态:工作人员,自主,基于角色协作和流动.

**类型：**学习 + 构建
**语言：**字符串 (stdlib)
**先修：**阶段14 · 12 (工作流程模式),阶段14 · 14 (演员模式)
**时间：**约75分钟

## 学习目标

- 描述了CrewAI的四个基本组成部分 (特工,任务,工作人员,过程) 以及每个组成部分负责什么.
- 区分 序列和计划中的共识过程;为每类工作负载选择一种――
- 区分 工作人员 (基于自主角色) 和事件驱动的确定性 (Flows),并解释文档中的生产建议.
- 使用 `@tool`装饰师和`BaseTool`接入工具;理解结构化输出与自由文本的取舍──
- 描述四种CrewAI记忆类型,以及它们的使用值得的时间.
- 实现一个工作,三 代理团队,研究人员,作家,编辑,产出一份简报.
- 识别三种机组人员失败模式:快速气,管理员,LLM税,短暂的交付.

## 问题

采用多代理框架的团队会撞到同一堵墙. 自主协作在演示中听起来很棒. 然后客户提交错误,你需要确定性重播. 或者财务问一个由LLM路由的团队问每次运行需要花多少钱.

免费形式、由LLM路由的员工都不能干净地回答这些问题――纯 DAG可以回答全部问题,但会失去脑风暴代理 需要的探索形态――

机组人员的分离诚实地面对这个取舍. 机组人员使用协作式,基于角色,探索性的工作. 流动用于事件驱动,代码拥有,可审核的生产.

## 概念

### 四个基本组成部分

机组人员的表面很小.

- **Agent。** `role + goal + backstory + tools + (optional) llm`◎背景故事 很关键──它塑造语气、判断,以及代理 何时停止──工具 是代理 可以调用函数(下面会讲)──
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`△可复用工作单元──`expected_output`是合约的.`context`列出上游任务,其输出遇被传入.`output_pydantic`强制使用结构化形态――
- **Crew。**容器──拥有`agents`列表`tasks`列表`process`及可选的`memory`其他`verbose`其他`manager_llm`设置.
- **Process。**执行策略──序列性、等级性、共识(计划中) ─选择运行的形态──

工作人员不会直接见到彼此. 任务引用代理人. 工作人员对任务进行编排. 过程决定谁选择下一个任务.

> **已针对**根据具体形态,请查看[CrewAI Processes docs](https://docs.crewai.com/concepts/processes),我知道.

### 序列与一致的层次

- **Sequential。**任务按声明顺序运行――任务N的输出可作为 `context`提供给任务N+1──成本最低──最可预测──当顺序固定时使用──
- **Hierarchical。**一个经理代理 (单独的LLM电话) 专家之间路由.`manager_llm`设置或默认配置生成经理――经理 每轮选择下一个任务,并且可以拒绝或重新路由――当你有四个或更多的专家,并且顺序确实依赖于前序输出时使用――
- **Consensus。**计划中,目前的公共API尚未实现. 文件保留该名称用于未来的基于投票的过程.

在每次专业调用中,等级会员每次增加LLM调用经理.

### 机组与流动

这就是2026年文档开篇强调的框架.

- **Crew。**基于LLM的自主化――框架在运行时选择形态――适合:研究、大脑风暴、第一稿,以及路径本身就是答案的一部分场景――难以重复――难以测试――原型成本低――
- **Flow。**你拥有的事件驱动图`@start`标记入口.`@listen(topic)`标记一个步骤,它将在另一个步骤发出这个话题时触发.

文档在2026年的生产建议:从流动开始.`Crew.kickoff()`流动给你审计轨道,机组给你探索.

### 工具 集成

给代理配备工具有三种方法.

1. **`@tool` decorator。**纯函数变成工具――签字是方案;docstring是LLM 看到的描述――最适合一次性辅助者――

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。**基于类的工具,带显式的args schema、async support、retries──当工具有状态(客户端、缓存) 或需要结构化的args 时使用──

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **内置 toolkits。**机组人员提供了第一方适配器:`SerperDevTool`,我知道.`FileReadTool`,我知道.`DirectoryReadTool`,我知道.`CodeInterpreterTool`,我知道.`RagTool`,我知道.`WebsiteSearchTool`一次进口即可接入

结构化输出 使用Pydantic──在任务上传入 `output_pydantic=MyModel`◎ 根据模型验证LLM响应,并进行强迫或重复尝试.`expected_output`字符串配合使用――自由文本输出 适合草稿;结构化输出 才是下游流动 能消费的内容――

### 记忆

机组人员可以同时启用四种类型的内存.

> **已针对**机组人员的信息.`Memory`系统包装了四种商店. 下面的概念模型仍然存在,但在更新版本中,公共类面可能会被收取为单一.`Memory`进入点;请查看[CrewAI memory docs](https://docs.crewai.com/concepts/memory)了解当前的API──

- **Short-term。**单次运行内对话缓冲.
- **Long-term。**跨运行持久化──存储在向量DB 中(默认Chroma,可替换)──按当前任务的相似性检索──
- **Entity。**按实体记录事实──客户X在企业计划中. 按实体关键,而不是按相似度──跨运行保留──
- **Contextual。**组装时检索――在代理需要时拉取相关记忆,而不是预载――

在船员上使用`memory=True`根据类型配置 启用. 由您配置的嵌入式提供商 支(默认开放AI,可替换为本地) ⋅内存是CrewAI相比较薄的框架之一.

### 什么时候适合 机组人员

- 三到六个代理,具名角色和协作工作流程──起草、评论、规划、大脑风暴──
- 对于下一步的判断本身构成价值的路由.
- 团队更愿意读`role + goal + backstory`而不是读图表的定义的场景.

### 什么时候不适合 CrewAI

- 带严格顺序的确定性DAGs──使用LangGraph(课 13)──图形形是正确的抽象;CrewAI的角色框架 会带来摩擦──
- 亚秒级延迟预算――等级会增加回路旅行――即使连续也会序列化包含背景故事和之前的输出提示――
- 单代理循环――跳过框架;一个代理循环(课 1)加工具注册表更短――

经验人员的合作作用.

### 依赖性形状

独立于LangChain──Python 3.10 到 3.13──使用`uv`星数:见[crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)报告其在QA工作负载上相比LangGraph有显著提速,但方法论 (数据集、硬件、评估指标) 未公开,因此框架供应商号码只能作为指导参考――

### 这种模式会在哪里出错

- **Backstories 导致 prompt-bloat。**每个代理一篇2000字的背景故事,再加五个代理的团队,会在第一次工具调用前烧掉文本预算――把背景故事控制在200字内――跨代理 复用短语;不要把房子风格重复五遍――
- **Manager-LLM token tax。**层次流程 会在每个专家电话前增加一个管理员LLM电话――五个任务的员工会从五次LLM电话变成六次,而且管理员电话 携带完整的任务列表加上之前的输出――除非路由依赖输出,否则切换到序列――
- **Brittle handoffs。**任务N 的`expected_output`是一个概要──任务N+1 把它作为`context`读取,并尝试解析三个部分──LLM 生成四个──下游 代理 即兴处理──修复方式在任务 N 上使用 `output_pydantic`让任务N+1 读取类型的对象,而不是自由文本.
- **Crew-as-prod。**自由形式 工作人员在没有流量包装的情况下被发布到生产中. 输出可变性高;无法重播;在调用上无法区别于一次坏运行和一次好运行.


```figure
ae-crew-vs-flow
```

## 构建它

`code/main.py`实现了两种形式的SDLB版本,以及一个三代特工机组.

形态:

- `Agent`,我知道.`Task`根据数据类,匹配 CrewAI的表面.
- `SequentialCrew.kickoff(inputs)`按声明顺序运行任务,并把输出作为`context`传递.
- `HierarchicalCrew.kickoff(topic)`增加一个经理 代理,每轮选择下一个专家,并完成 处停止.
- 带`@start`和 `@listen(topic)`装饰师的`Flow`,一个小的事件循环,以及跟踪.
- `tool(name)`装饰师,镜像 机组人员`@tool`形状
- 带`short_term`,我知道.`long_term`,我知道.`entity`商店的`Memory`笑了对方的相似性 使用笑
- 模拟的 LLM 响应是根据角色加输入前键的硬码字符串――无网络――确定性――

具体演示:研究员,作家,编辑团队,产出一份关于 代理工程2026的简报.

运行它:

```bash
python3 code/main.py
```

追踪覆盖:顺序人员通过`context`串接输出,层次级工作人员 带管理员选择(研究人员,作家,编辑,然后 完成),流动使用显然的主题(`researched`,我知道.`drafted`,我知道.`edited`运行同样三步,工具通话通过`@tool`路由,以及长期记忆在两次球之间保留.

机组人员的排行是流动的;管理者原则上可以重新排序.

## 使用它

- **CrewAI Flow**为了生产.即使流动,只有一步调节.`Crew.kickoff()`△流量提供审计界限
- **CrewAI Crew (Sequential)**为了顺序清晰的协作工作,特别是第一份草案和审查循环.
- **CrewAI Crew (Hierarchical)**路由时取决于输出,并且你有四个或更多的专家使用.
- **LangGraph**它们是用于显式状态机,持久简历,严格订单.
- **AutoGen v0.4**(课 14) 用于演员模型同步和故障隔离.
- **OpenAI Agents SDK**(课6) 用于开放AI的第一产品,带手柄和护.
- **Claude Agent SDK**(课 17) 用于克劳德第一产品,带子料和会议店.

## 发布它

`outputs/skill-crew-or-flow.md`选择机组人与流动,并架架 最小实现――对机组人无背景故事、流动无明确话题、少于三个专家的等级 进行硬拒绝――

## 常见坑

- **把 backstory 当作调味。**它会塑造出口. 每个代理都测试三个变体.
- **跳过 `expected_output`。**没有每个任务的契约,下游任务会得到 LLM 产出的任意内容――工作人员能跑;审计会失败――
- **Memory always-on。**长期每次运行都会写入――矢量DB 增长――恢复 变杂――只在事实上具有持久性时,把写入局限于应对任务――
- **Manager prompt drift。**如果路由变得奇怪,在语法模式下放弃出来阅读.
- **Crews 中 tool side effects。**机组人员可能比预期更多调用工具──POST、DELETE、付款属于流动步骤,绝对不属于机组人员工具──

## 练习

1. 把序列机组 转换为流量――数量一数变化――降低接触点――记录可读性――降低位置――
2. 给船员 添加实体记忆:关于客户的事实 在开端 之间持久化.
3. 实现一个层次性过程:管理者在作者的输出至少有三段之前,拒绝路由到编辑.
4. 为一个笑的网页搜索 接入`BaseTool`类下――比较跟踪形状与`@tool`装饰师 版本――
5. 给编辑任务添加`output_pydantic=Brief`在其中`Brief`有一个`title`,我知道.`summary`,我知道.`sections`让作者任务输出一次错误的JSON;验证 CrewAI 在追踪中的重试行为.
6. 阅读 CrewAI的医生介绍.`crewai`没有任何保证?
7. 现在,你没有什么迹象?

## 关键术语

| Term | 大家常说 | 实际含义 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + optional structured output |
| Crew | “Agent team” | Agents + Tasks + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（计划中） |
| Flow | “Deterministic workflow” | 事件驱动、代码拥有、可测试 |
| Backstory | “Persona prompt” | Agent 的语气与判断塑造器 |
| `@tool` | “Function tool” | 把函数变成 Agent 可调用 tool 的 decorator |
| `BaseTool` | “Class tool” | 带 args schema、retries、async support 的 class-based tool |
| Entity memory | “Per-entity facts” | 限定到某个 customer / account / issue 的 memory |
| Long-term memory | “Cross-run memory” | 在 kickoffs 之间保留的 vector-backed memory |
| Contextual memory | “Just-in-time retrieval” | Agent 需要时才拉取的 memory |
| Manager LLM | “Router agent” | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | “Task contract” | 告诉 Agent（和 audit）要返回什么形态的 string |

## 延伸阅读

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction)概念与推的生产路径
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows)事件驱动形态`@start`,我知道.`@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)其他:`@tool`,我知道.`BaseTool`、内置工具包
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory)短期,长期,实体,背景
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)什么时候有帮助,什么时候没有
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)其他国家机器
