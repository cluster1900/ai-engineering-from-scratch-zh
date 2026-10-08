# 为什么需要多代理?

> 一个代理人撞到墙上.聪明的做法不是做一个更大的代理人,而是使用更多的代理人.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## 学习目标

- 识别单个代理的天花板 文本溢出 混合专业知识 序列瓶),并解释什么时候分为多个代理 才是正确的选择
- 比较管道,并行风扇,监督者等级),并为给定任务结构选择合适模式
- 设计一个具有明确角色边界,共享状态和通信合同的多代理系统
- 分析多代理复杂性 (延迟,成本,调试难度) 与单代理简单性之间的权衡

## 问题

你在14期构建一个单个代理. 它可以工作. 它可以读取文件,运行命令,调用API,并根据结果进行推理. 然后你将它指向一个真实的代码库:200 文件,三种语言,依赖基础设施测试,并且在编写代码之前还需要研究外部API.

这位代理已经被卡住了. 不是因为LLM不够聪明,而是因为这个任务超出了代理循环的范围.

每次任务需要以下内容,你都会碰到它:

- **超出一个 window 容量的 context**- 读取50个文件将轻松超过200万个代币
- **不同阶段需要不同 expertise**- 需要的研究与代码生成不同
- **可以并行发生的工作**- 为什么要顺序读三个文件,而不是同时读?

## 核心概念

### 单机机顶

一个单个代理就是一个循环,一个文本窗口,一个系统提示.

```
┌─────────────────────────────────────────┐
│            SINGLE AGENT                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         Context Window            │  │
│  │                                   │  │
│  │  research notes                   │  │
│  │  + code files                     │  │
│  │  + test output                    │  │
│  │  + review feedback                │  │
│  │  + API docs                       │  │
│  │  + ...                            │  │
│  │                                   │  │
│  │  ██████████████████████ FULL ███  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  One system prompt tries to cover       │
│  research + coding + review + testing   │
│                                         │
│  Result: mediocre at everything         │
└─────────────────────────────────────────┘
```

问题发生了三件事:

1. **Context saturation**据了解,在第30轮时,代理已经消耗了15万个代币的文件内容,命令输出和前推论.

2. **Role confusion**- 一个写你是研究员,编码者,评论者和测试者,会产生一个只做一半研究,一半编码的代理,永远无法完成审查.

3. **Sequential bottleneck**- 代理先读文件 A,再读文件 B,再读文件 C──三次串行LLM电话──三次串行工具执行──没有并行性──

### 多代理解决方案

拆分工作.给每个代理一个任务,一个文本窗口,以及一个为该任务调整的系统提示:

```
┌──────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│                                                          │
│  "Build a REST API for user management"                  │
│                                                          │
│         ┌──────────┬──────────┬──────────┐               │
│         │          │          │          │               │
│         ▼          ▼          ▼          ▼               │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │RESEARCHER│ │  CODER   │ │ REVIEWER │ │  TESTER  │  │
│   │          │ │          │ │          │ │          │  │
│   │ Reads    │ │ Writes   │ │ Checks   │ │ Runs     │  │
│   │ docs,    │ │ code     │ │ code     │ │ tests,   │  │
│   │ finds    │ │ based on │ │ quality, │ │ reports  │  │
│   │ patterns │ │ research │ │ finds    │ │ results  │  │
│   │          │ │ + spec   │ │ bugs     │ │          │  │
│   └─────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│         │           │            │             │         │
│         └───────────┴────────────┴─────────────┘         │
│                          │                               │
│                     Merge results                        │
└──────────────────────────────────────────────────────────┘
```

每个代理都有:
- 你是代码检查员. 你的唯一任务是找错误.
- 自己的背景窗口 (不会被其他代理的工作污染)
- 清晰的输出/输入合同

### 实际上,我们做了这样.

**Claude Code subagents**- 当克劳德代码 使用 `Task`生成一个子女,它会创建一个有目标任务的孩子代理──父母 保持自己的背景 干净──孩子 执行聚焦工作并回归摘要──

**Devin**运行规划器代理、编码器代理 和浏览器代理──规划器将工作分为步骤──编码器 编写代码──浏览器 研究文档──每个都有独立的背景──

**Multi-agent coding teams (SWE-bench)**- 在SWE-bench上表现最好的系统使用研究人员 读取代码基础,规划者 设计修复方案,编码实现修复――单代理系统的得分更低――

**ChatGPT Deep Research**- 并行生成多个搜索代理,每个搜索不同的角度,然后综合结果.

### 光谱

多元选择不是二元选择.

```
SIMPLE ──────────────────────────────────────────── COMPLEX

 Single        Sub-         Pipeline      Team         Swarm
 Agent         agents

 ┌───┐       ┌───┐        ┌───┐───┐    ┌───┐───┐    ┌─┐┌─┐┌─┐
 │ A │       │ A │        │ A │ B │    │ A │ B │    │ ││ ││ │
 └───┘       └─┬─┘        └───┘─┬─┘    └─┬─┘─┬─┘    └┬┘└┬┘└┬┘
               │                │        │   │       ┌┴──┴──┴┐
             ┌─┴─┐          ┌───┘───┐    │   │       │shared │
             │ a │          │ C │ D │  ┌─┴───┴─┐    │ state │
             └───┘          └───┘───┘  │  msg   │    └───────┘
                                       │  bus   │
 1 loop      Parent +      Stage by    │       │    N peers,
 1 context   child tasks   stage       └───────┘    emergent
                                       Explicit      behavior
                                       roles
```

**Single agent**简单任务适合.

**Subagents**孩子们的教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育,教育等.

**Pipeline**根据运行序列,Agent A 的输出成为B 的输入.

**Team**- 经过共享信息公交并行运行.每个人都有角色.

**Swarm**- 大量相同或近似相同的代理 共享状态――没有固定管弦乐器――代理从队列中获取工作――适合高吞吐并行任务――

### 四种多代理模式

#### 模式1:管道

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

每个代理 转换数据并向前传递. 简单推理. 一个阶段失败会阻下一个阶段.

#### 模式2: 风/风

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

将工作分为并行代理,然后合并结果.

#### 模式3:乐团主持人

```
                    ┌──────────┐
                    │  Orch.   │
                    └──┬───┬───┘
                  task │   │ task
                 ┌─────┘   └─────┐
                 ▼               ▼
           ┌──────────┐   ┌──────────┐
           │ Worker A │   │ Worker B │
           └──────────┘   └──────────┘
```

一个智能的管弦乐器决定要做什么,委托给工人,并综合结果――管弦乐器本身也是一个代理,拥有生产工人的工具――

#### 模式4: 同龄人群

```
         ┌───┐ ◄──── msg ────▶ ┌───┐
         │ A │                  │ B │
         └─┬─┘                  └─┬─┘
           │                      │
      msg  │    ┌───────────┐     │ msg
           └───▶│  Shared   │◄────┘
                │  State    │
           ┌───▶│  / Queue  │◄────┐
           │    └───────────┘     │
      msg  │                      │ msg
         ┌─┴─┐                  ┌─┴─┐
         │ C │ ◄──── msg ────▶ │ D │
         └───┘                  └───┘
```

没有中心主管. 代理以同行通信方式. 决策从交互中涌现.

### 什么时候不要使用多代理

多代理会增加复杂性. 代理之间的每条消息都是潜在的失败点.

**以下情况应保持 single-agent：**
- 任务能放进一个文本窗口 (工作数据低于约100万代币)
- 你不需要为不同阶段使用不同的系统提示
- 顺序执行已经足够快
- 任务很简单,分开的开销比价值大

**复杂性成本：**
- 每个代理界限都是一次有损压缩:A代理的完整背景将总结为B代理的信息
- 协调逻辑 (谁做什么什么什么时候做什么按什么顺序做)本身就是错误源
- 延迟增加:N 个代理人至少连续N次进行LLM电话,如果它们需要回来交流则更多
- 成本 成倍增加:每个代理都会独立消耗代币

经验法则:如果一个任务少于20次的工具调用,并且可以放入100万个代币,就保持单个代理.


```figure
swarm-messages
```

## 构建它

### 步骤1: 过载单独的代理人

下面是一个试图包一切的单个代理. 它有一个巨大的系统提示,以及一个同时容纳研究,代码和评论的文本窗口:

```typescript
type AgentResult = {
  content: string;
  tokensUsed: number;
  toolCalls: number;
};

async function singleAgentApproach(task: string): Promise<AgentResult> {
  const systemPrompt = `You are a full-stack developer. You must:
1. Research the requirements
2. Write the code
3. Review the code for bugs
4. Write tests
Do ALL of these in a single conversation.`;

  const contextWindow: string[] = [];
  let totalTokens = 0;
  let totalToolCalls = 0;

  const research = await fakeLLMCall(systemPrompt, `Research: ${task}`);
  contextWindow.push(research.output);
  totalTokens += research.tokens;
  totalToolCalls += research.calls;

  const code = await fakeLLMCall(
    systemPrompt,
    `Given this research:\n${contextWindow.join("\n")}\n\nNow write code for: ${task}`
  );
  contextWindow.push(code.output);
  totalTokens += code.tokens;
  totalToolCalls += code.calls;

  const review = await fakeLLMCall(
    systemPrompt,
    `Given all previous context:\n${contextWindow.join("\n")}\n\nReview the code.`
  );
  contextWindow.push(review.output);
  totalTokens += review.tokens;
  totalToolCalls += review.calls;

  return {
    content: contextWindow.join("\n---\n"),
    tokensUsed: totalTokens,
    toolCalls: totalToolCalls,
  };
}
```

这种做法的问题:
- 文本窗口会随着每个阶段的增长而成.
- 系统快速是泛化的.
- 没有任何事情并行运行.

### 步骤2:专业代理人

现在把它拆开. 每个特工只负责一个任务:

```typescript
type SpecialistAgent = {
  name: string;
  systemPrompt: string;
  run: (input: string) => Promise<AgentResult>;
};

function createSpecialist(name: string, systemPrompt: string): SpecialistAgent {
  return {
    name,
    systemPrompt,
    run: async (input: string) => {
      const result = await fakeLLMCall(systemPrompt, input);
      return {
        content: result.output,
        tokensUsed: result.tokens,
        toolCalls: result.calls,
      };
    },
  };
}

const researcher = createSpecialist(
  "researcher",
  "You are a technical researcher. Read documentation, find patterns, and summarize findings. Output only the facts needed for implementation."
);

const coder = createSpecialist(
  "coder",
  "You are a senior TypeScript developer. Given requirements and research notes, write clean, tested code. Nothing else."
);

const reviewer = createSpecialist(
  "reviewer",
  "You are a code reviewer. Find bugs, security issues, and logic errors. Be specific. Cite line numbers."
);
```

每个专家都有一个聚焦提示. 每个都得到了干净的文本窗口,其中只包含它需要的输入.

### 步骤3: 通过信息 协调

用明显的消息传递 把专家 连接起来:

```typescript
type AgentMessage = {
  from: string;
  to: string;
  content: string;
  timestamp: number;
};

async function multiAgentApproach(task: string): Promise<AgentResult> {
  const messages: AgentMessage[] = [];
  let totalTokens = 0;
  let totalToolCalls = 0;

  const researchResult = await researcher.run(task);
  messages.push({
    from: "researcher",
    to: "coder",
    content: researchResult.content,
    timestamp: Date.now(),
  });
  totalTokens += researchResult.tokensUsed;
  totalToolCalls += researchResult.toolCalls;

  const coderInput = messages
    .filter((m) => m.to === "coder")
    .map((m) => `[From ${m.from}]: ${m.content}`)
    .join("\n");

  const codeResult = await coder.run(coderInput);
  messages.push({
    from: "coder",
    to: "reviewer",
    content: codeResult.content,
    timestamp: Date.now(),
  });
  totalTokens += codeResult.tokensUsed;
  totalToolCalls += codeResult.toolCalls;

  const reviewerInput = messages
    .filter((m) => m.to === "reviewer")
    .map((m) => `[From ${m.from}]: ${m.content}`)
    .join("\n");

  const reviewResult = await reviewer.run(reviewerInput);
  messages.push({
    from: "reviewer",
    to: "orchestrator",
    content: reviewResult.content,
    timestamp: Date.now(),
  });
  totalTokens += reviewResult.tokensUsed;
  totalToolCalls += reviewResult.toolCalls;

  return {
    content: messages.map((m) => `[${m.from} -> ${m.to}]: ${m.content}`).join("\n\n"),
    tokensUsed: totalTokens,
    toolCalls: totalToolCalls,
  };
}
```

每个代理只收到发送自己的信息――没有环境污染――研究人员阅读文档 产生50万代币永远不会进入评论者的环境――

### 步骤4:对比

```typescript
async function compare() {
  const task = "Build a rate limiter middleware for an Express.js API";

  console.log("=== Single Agent ===");
  const single = await singleAgentApproach(task);
  console.log(`Tokens: ${single.tokensUsed}`);
  console.log(`Tool calls: ${single.toolCalls}`);

  console.log("\n=== Multi-Agent ===");
  const multi = await multiAgentApproach(task);
  console.log(`Tokens: ${multi.tokensUsed}`);
  console.log(`Tool calls: ${multi.toolCalls}`);
}
```

许多代理商使用更多总代币,但每个代理商的背景都保持干净.

## 使用它

本课会产出一个可复用提示,用于决定何时采用多代理.`outputs/prompt-multi-agent-decision.md`,我知道.

## 练习

1. 添加第四个专家:一个"测试者"代理,它从编码器接收代码,并从审查者接收评论反,然后编写测试
2. 修改管道,让评论员可以把反 发送回编码器,形成修改循环(最多2轮)
3. 将顺序管道转换为风扇:并行运行研究人员和一个"要求分析器"代理,然后在传递给编码器之前合并它们的输出

## 关键术语

| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|----------------|----------------------|
| Swarm | “一群 AI agents 的 hive mind” | 一组共享 state、没有固定 leader 的 peer agents。行为从局部交互中涌现。 |
| Orchestrator | “boss agent” | 一个 tools 包含生成和管理其他 agents 的 agent。它负责规划和委派，但可能不执行实际工作。 |
| Coordinator | “traffic cop” | 一个 non-agent component（通常只是代码，而不是 LLM），根据规则在 agents 之间路由 messages。 |
| Consensus | “agents 达成一致” | 一种 protocol，要求多个 agents 在继续之前达成一致。用于需要解决冲突输出的情况。 |
| Emergent behavior | “agents 自己弄明白了” | 由 agent interactions 产生、但没有被显式编程的 system-level patterns。可能有用，也可能有害。 |
| Fan-out / fan-in | “agents 的 map-reduce” | 将一个任务拆分给并行 agents（fan-out），然后合并它们的结果（fan-in）。 |
| Message passing | “agents 彼此交谈” | agents 之间的通信机制：从一个 agent 发送到另一个 agent 的 structured data，用来替代 shared context windows。 |

## 延伸阅读

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- 多代理模式综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- 微软的多代理对话框架
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- 克劳德代码 如何使用任务 进行委派
- [CrewAI documentation](https://docs.crewai.com/)-基于角色的多代理框架
