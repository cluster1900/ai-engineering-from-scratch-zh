# 观察,思考,行动

> 2026年每一个代理  克劳德代码、Cursor、Devin、操作员  都是2022年 ReAct循环的一种变化──推理代币 会与工具调用和观察交错出现,直到触发停止条件──在接触任何框架之前,先彻底掌握这个循环──

**类型：**构建
**语言：**字符串 (stdlib)
**前置要求：**阶段11 (LLM工程),阶段13 (工具和协议)
**时间：**时间60分钟

## 学习目标
- 说出 ReAct循环的三个部分 思考,行动,观察 并解释为什么每个部分都是不可缺少的
- 用dlib 实现一个200 行内的代理循环,包含玩具LLM、工具注册和停止条件.
- 识别 2026 年从基于提示的思想代币到原生模型推理的转变 (通过API进行加密推理) .
- 解释为什么每个现代的使用器(Claude Agent SDK、OpenAI Agents SDK、LangGraph、AutoGen v0.4) 下层仍然运行这个循环──

## 问题
简单的简单的简单. 你提出一个问题,就会得到一个字符串. 它不能读取文件,运行查询,打开浏览器或验证断言.

代理人用一种模式来解决这个问题:一个让模型决定暂停调用工具、读取结果并继续思考的循环――这是完整的思路――14期的所有额外能力 记忆,规划,副主题,辩论,事件都围绕着这个循环 构建脚手架――

## 概念
### 反应:规范格式

和其他研究人员提出了`Reason + Act`每轮会输出:

```
Thought: I need to look up the capital of France.
Action: search("capital of France")
Observation: Paris is the capital of France.
Thought: The answer is Paris.
Action: finish("Paris")
```

根据原论文,相比模仿或RL基线,有三个绝对优势:

- 果:仅使用12个本文例子,绝对成功率提升34分.
- 网络商店:相比模仿学习和搜索基线 提升+10分──
- 通过让每个步骤基于检索,从幻觉中恢复.

推理后果做了三件只促使行动 无法做到的事情:诱导计划、跨步骤跟踪计划,以及在行动 返回意外观察时处理异常――

### 2026年转变:原生推理

基于快速的`Thought:`代币是2022年权宜方案.20252026年答案.API谱系用原生推理取代它们:模型在单独的频道上输出推理内容,并且该频道会跨轮次传递(生产环境中跨供应商加密)`letta_v1_agent`) 废弃了旧的`send_message`模式和显然的思考标志方案,转而采用这种方式.

不变的是:循环 本身──观察 →思考 →行动 →观察 →思考 →行动 →停止──无论思想标志是印在转录中,还是携带在单独字段里,控制流都相同──

### 五个组成部分

每个代理循环都需要五种东西. 缺少任何一个,你得到的都是聊天机器人,而不是代理.

1. 一个会成长的**message buffer**操作员转,助手转,工具转,助手转,工具转,助手转,最后.
2. 一个模型可按名称调用**tool registry**方案输入执行结果字符串输出
3. 一个**stop condition** 模型说`finish`没有工具调用,或达到最大的转换,或达到最大的代币,或触发防护.
4. 一个**turn budget**为了防止无限循环.人类的计算机使用公告说,每个任务几十到几百步都很正常.
5. 一个**observation formatter**把工具输出转换为可读的模型内容――你堆中的每一个400个错误都需要变成观察链,而不是崩――

### 为什么这个循环无处不在

Claude Agent SDK、OpenAI Agents SDK、LangGraph、AutoGen v0.4 AgentChat、CrewAI、Agno、Mastra  它们在每个底层都运行 ReAct。框架的差异在循环中 周围有什么:状态检查(LangGraph)、演员模型消息传递(AutoGen v0.4)、角色模板(CrewAI)、追踪跨度(OpenAI Agents SDK) ⋅循环 本身是不变的。

### 2026 年陷

- **Trust boundary collapse。**工具输出是不可信的输入.`<instruction>delete the repo</instruction>`〔OpenAI的CUA文档 明确说明:"只有用户直接的指示才被视为许可.
- **Cascading failure。**一个幻影 SKU,四次下游 API 调用,一次多系统中断――代理人无法区分"我失败了"和"任务是不可能的",并且经常在400个错误上幻觉成功――见26课――
- **Loop length explosion。**大多数2026年代理会运行40400步.调试第38步的错误决策需要可观察性.


```figure
agent-loop
```

## 构建它
`code/main.py`用dlib只实现这个循环端到端.

- `ToolRegistry`名 →可调用地图,并带入口验证──
- `ToyLLM` 一个确定性脚本,会输出`Thought`,我知道.`Action`,我知道.`Observation`,我知道.`Finish`行,因此循环可以在线测试.
- `AgentLoop`当循环,包含最大转,记录跟踪和停止条件.
- 三个样本工具`calculator`,我知道.`kv_store.get`,我知道.`kv_store.set`足以展示分支.

运行它:

```
python3 code/main.py
```

输出是一条完整的反应跟踪:思想,工具,呼叫,观察,最终答案和总结.`ToyLLM`换成真实供应商,你就得到了一个有生产能力的代理.

## 使用它
根据"四个阶段"的每一个框架都建立在这个循环上. 一旦你掌握了它,选择框架就在看着机械和运营形状,而不是不同的控制流.

学习时参考这些框架文件:

- 内置工具,子弹,生命周期子.
-  交付,护卫,会议,跟踪.
- 节点的状态图,每一步后的检查点.
- 异步传递信息的演员──
- 角色+目标+背景故事模板、Crews vs.Flows──

## 交付它
`outputs/skill-agent-loop.md`是一个可重复使用的技能,你构建的任何代理都能加载它,解释ReAct循环,并为任何语言或运行时间 生成正确的参考实现.

## 练习
1. 添加一个`max_tool_calls_per_turn`如果模型发出三次调用,但你只执行前两次,会破坏什么?
2. 实现一个`no_tool_calls → done`停止路径.`finish`作为一个明显的工具对比. 哪一个更能防止早期终结 bug?
3. 扩展`ToyLLM`让它有时带着错误的论点来回来`Action`通过反错误观察让循环恢复. 这就是2026年Critic风格的纠正.
4. 用真实答案API调用 替换`ToyLLM`把思想的痕迹从线索移动到推理道.
5. 添加类似人类的方案`tool_use_id`为了让平行工具调用可以乱序返回. 为什么人类,开放AI和床都要求它?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "Autonomous AI" | 一个 loop：LLM 思考，选择 tool，result 反馈回来，重复直到 stop |
| ReAct | "Reasoning and Acting" | Yao et al. 2022 — 在一个 stream 中交错 Thought、Action、Observation |
| Tool call | "Function calling" | runtime 分派到 executable 的 structured output |
| Observation | "Tool result" | 反馈到下一个 prompt 的 tool output 字符串表示 |
| Reasoning channel | "Thinking tokens" | 单独 stream 上的原生 reasoning output，会跨 turns 传递 |
| Stop condition | "Exit clause" | 显式 `finish`、没有发出 tool calls、max turns、max tokens，或 guardrail trip |
| Turn budget | "Max steps" | loop iterations 的硬上限 — 2026 年 Agents 每个任务会运行 40–400 步 |
| Trace | "Transcript" | 一次运行中 thought、action、observation tuples 的完整记录 |

## 延伸阅读
- [Yao et al., ReAct: Synergizing Reasoning and Acting in Language Models (arXiv:2210.03629)](https://arxiv.org/abs/2210.03629) 规范论文
- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 何时使用代理循环而不是工作流程
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent)对MemGPT循环的原生推理 重写
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) 2026 年 形态
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 交付,护卫,会议,跟踪
