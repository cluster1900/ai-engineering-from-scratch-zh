# 工具使用和函数调用

> 工具former (Schick等人,2023) 开创了自主监督工具注释――伯克利函数调用排名板 V4 (Patil等人,2025) 设定了2026年标准:40%的代理性、30%的多转、10%的现实、10%的非现实、10%的幻觉──单转已经解决了──记忆、动态决策和长视线工具链还没有解决──

**Type:** Build
**Languages:** Python (stdlib)
**前置要求:**阶段14 · 01 (代理循环),阶段13 · 01 (职能调用深潜)
**Time:** ~60 分钟

## 学习目标
- 解释 Toolformer 的自主监督训练信号:只有当执行能降低下一个代码损失时,才保留工具注释──
- 描述BFCL V4的五个评估类别,以及每个类别的衡量什么.
- 实现一个stdlib工具登记,包含方案验证,论点强制和执行沙盒.
- 诊断2026年三个开放问题:长视野工具链,动态决策和记忆.

## 问题
早期工具使用 问的是:模型能否预测一个正确的功能调用?现代工具使用 问的是:模型能否跨40个步骤链式调用工具,具备记忆,处理部分可观察性,从工具故障中恢复,并且不幻觉不存在的工具?

工具制造商建立了基线:模型可以通过自我监督 学会何时调用工具.

## 概念
### 工具former (Schick等人,NeurIPS 2023)

思路:让模型使用候选人API调用标记自己的预训练体. 对每个候选人执行它.只有当包含工具结果 能降低一个标记上的损失时,才保留该注释.

覆盖的工具:计算器,QA系统,搜索引擎,翻译者,日历,自监信号 纯粹关注工具 是否有助于预测文本,不需要人类标签

规模结果:工具使用会在规模足够时涌现.较小的模型会因工具注释受损;较大的模型会受益.这就是为什么2026年边界模型内置强大的工具使用能力,而大多数7B模型需要显而易见的工具使用细节调整才可靠.

### 伯克利函数调用排名表 V4 (帕蒂尔等人,ICML 2025)

根据"2026年事实上的评估"的规定,

- **Agentic (40%)** 完整的代理轨迹:记忆,多轮决策,动态决策.
- **Multi-Turn (30%)** 带工具链的交互式对话──
- **Live (10%)** 用户提交的真实提示 (更难的分布)
- **Non-Live (10%)**合成试验例──
- **Hallucination (10%)**检测何时不应调用工具──

 V3 引入了基于状态的评估:在工具序列之后,检查API的实际状态 (例如文件是否已创建?),而不是匹配工具的 AST──V4 增加了网页搜索、记忆和格式敏感性类别──

2026年关键发现:单轮函数调用 基本已解决了――失败集中在记忆中(跨轮 携带背景) 、动态决策的方法(基于先前结果选择工具) 、长视线链(20+步骤 后漂移) 和幻觉检测(没有合适的工具 时拒调用) 。

### 工具方案

每个提供商都有不同的方案,但它们都具有相同的形状:

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

直接使用`input_schema`◎ 开放AI 使用`function.parameters`△两者都接受JSON方案. 描述 承担关键作用,模型会读取它们来选择正确的工具.

### 证据验证

没有任何工具的呼叫.

1. **Type coercion.**模型可能在 schema 要求 int 的地方返回字符串 `"5"`如果明确无歧义就强迫;否则拒绝
2. **Enum validation.**如果图案是写的`status in {"open", "closed"}`输出`"in_progress"`没有任何问题,
3. **Required fields.**缺少所需的字段 -> 立即把错误观察 返回模型,而不是崩──
4. **Format validation.**通过具体的解析器验证,而不是回复.

每次验证失败都应返回结构化观察,让模型能够使用正确的形状重试.

### 并行工具调用

现代提供商支持在一个助理转中并行工具调用.

1. 模型发出3个工具电话,每个都有不同的电话.`tool_use_id`,我知道.
2. 运行时间 执行它们 (如果彼此独立则并行)
3. 每个结果都作为`tool_result`封锁回归,并通过`tool_use_id`关联:

工程规则:把相关性ID 当作关键约束――把它们交换,就会导致错误工具到错误结果路由――

### 沙盒

工具执行是沙盒的边界――详情见09课――简短版:每个工具都应指定阅读/写面――网络访问时间,内存限制――通用`run_shell(cmd)`是危险信号;具体的`git_status()`更安全.


```figure
tool-routing
```

## 构建它
`code/main.py`实现一个生产形状工具登记库:

- 通过JSON Schema的子集验证器 (仅仅是dlib)
- 工具注册,包含描述,输入方案,时间限和执行器.
- 论证强制和证实性.
- 带相关性ID的并行工具发送――
- 作为结构化字符串的错误观察.

运行它:

```
python3 code/main.py
```

追踪一个迷你代理在一个转换中调用三个工具,其中一个故意错误的调用会被拒绝,并返回模型可以根据此操作的描述性错误.

## 使用它
每个提供商都有自己的工具方案:人类化,OpenAI,Gemini,Bedrock. 如果需要多个提供商,请使用翻译层.

## 交付它
`outputs/skill-tool-registry.md`会为给定任务域 生成工具目录、方案和注册表──包含描述质量检查(每个工具的描述 是否告诉模型何时使用它?)。

## 练习
1. 添加一个"无操作"工具,让模型显然拒绝使用任何其他工具――在类似BFCL的幻觉测试上测量――
2. 为了实现引证的强制性. 强制性从哪里开始掩盖真实的错误?
3. 增加每工具的时间和电路打断器(连续失败 3 次后,在60年代内拒绝该工具) ――这将如何改变模型的恢复方式?
4. 阅读BFCL V4描述──选择一个类别(例如"多转"),并让你的代理运行10个例子提示──报告通过率──
5. 们还没有抓到什么玩具?

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Function calling | "Tool use" | 使用 validated schema 的 structured-output tool invocation |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — 保留那些结果能降低 next-Token Loss 的 tool calls |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination |
| Tool schema | "给 model 的 function signature" | name、description、arguments 的 JSON Schema |
| tool_use_id | "Correlation ID" | 将 tool call 与其 result 绑定；对 parallel dispatch 至关重要 |
| Hallucination detection | "知道何时不调用" | V4 category：没有合适 tool 时拒绝调用 |
| Argument coercion | "String-to-int repair" | 针对可预测 schema mismatch 的窄修复；如果有歧义则 reject |
| Sandboxing | "Tool execution boundary" | 每个 tool 的 read/write surface、network、timeout、memory cap |

## 延伸阅读
- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761)自主监督工具注释
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html)2026年评估基准
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Agent SDK 中的生产工具方案
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/)功能工具类型 和 护
