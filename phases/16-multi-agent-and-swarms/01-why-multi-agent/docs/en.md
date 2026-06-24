# 为什么需要 Multi-Agent？

> 一个 agent 撞上了墙。聪明的做法不是做一个更大的 agent，而是使用更多 agents。

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## 学习目标

- 识别 single-agent ceiling（context overflow、mixed expertise、sequential bottleneck），并解释什么时候拆分为多个 agents 才是正确选择
- 比较 orchestration patterns（pipeline、parallel fan-out、supervisor、hierarchical），并为给定任务结构选择合适模式
- 设计一个具备清晰角色边界、shared state 和 communication contract 的 multi-agent system
- 分析 multi-agent complexity（latency、cost、debugging difficulty）与 single-agent simplicity 之间的权衡

## 问题

你在 Phase 14 中构建了一个 single agent。它能工作。它可以读取文件、运行命令、调用 APIs，并基于结果进行推理。然后你把它指向一个真实 codebase：200 个文件、三种语言、依赖基础设施的 tests，并且在写代码之前还需要研究外部 APIs。

这个 agent 卡住了。不是因为 LLM 不够聪明，而是因为这个任务超出了一个 agent loop 能处理的范围。context window 被文件内容填满。agent 忘记了 40 次 tool calls 之前读过的内容。它试图同时成为 researcher、coder 和 reviewer，结果三件事都做得不好。

这就是 single-agent ceiling。每当任务需要以下内容时，你都会碰到它：

- **超出一个 window 容量的 context** - 读取 50 个文件会轻易超过 200k tokens
- **不同阶段需要不同 expertise** - research 需要的 prompting 与 code generation 不同
- **可以并行发生的工作** - 为什么要顺序读取三个文件，而不是同时读取？

## 核心概念

### Single-Agent Ceiling

一个 single agent 就是一个 loop、一个 context window、一个 system prompt。想象一下：

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

三件事会出问题：

1. **Context saturation** - tool results 不断堆积。到第 30 轮时，agent 已经消耗了 150k tokens 的文件内容、命令输出和先前推理。第 5 轮中的关键细节会丢失。

2. **Role confusion** - 一个写着“你是 researcher、coder、reviewer 和 tester”的 system prompt，会产生一个只做一半 research、一半 coding，并且永远无法完成 review 的 agent。

3. **Sequential bottleneck** - agent 先读文件 A，再读文件 B，再读文件 C。三次串行 LLM calls。三次串行 tool executions。没有并行性。

### Multi-Agent 解决方案

拆分工作。给每个 agent 一个任务、一个 context window，以及一个为该任务调优的 system prompt：

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

每个 agent 都有：
- 一个聚焦的 system prompt（“你是 code reviewer。你的唯一任务是找 bugs。”）
- 自己的 context window（不会被其他 agents 的工作污染）
- 清晰的 input/output contract（接收 research notes，输出 code）

### 这样做的真实系统

**Claude Code subagents** - 当 Claude Code 使用 `Task` 生成一个 subagent 时，它会创建一个带有 scoped task 的 child agent。parent 保持自己的 context 干净。child 执行聚焦工作并返回 summary。

**Devin** - 运行 planner agent、coder agent 和 browser agent。planner 将工作拆分为步骤。coder 编写代码。browser 研究文档。每个都有独立的 context。

**Multi-agent coding teams (SWE-bench)** - 在 SWE-bench 上表现最好的系统使用 researcher 读取 codebase，planner 设计修复方案，coder 实现修复。Single-agent systems 的得分更低。

**ChatGPT Deep Research** - 并行生成多个 search agents，每个探索不同角度，然后综合结果。

### 光谱

Multi-agent 不是二元选择。它是一个光谱：

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

**Single agent** - 一个 loop、一个 prompt。适合简单任务。

**Subagents** - parent 为聚焦的 subtasks 生成 children。parent 维护 plan。children 回报结果。这就是 Claude Code 的做法。

**Pipeline** - agents 按顺序运行。Agent A 的输出成为 Agent B 的输入。适合分阶段 workflows：research -> code -> review -> test。

**Team** - agents 通过 shared message bus 并行运行。每个都有一个角色。orchestrator 负责协调。适合同时需要不同技能的情况。

**Swarm** - 大量相同或近似相同的 agents 共享 state。没有固定 orchestrator。agents 从 queue 中领取工作。适合高吞吐并行任务。

### 四种 Multi-Agent Patterns

#### Pattern 1: Pipeline

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

每个 agent 转换数据并向前传递。容易推理。某一阶段失败会阻塞后续阶段。

#### Pattern 2: Fan-out / Fan-in

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

将工作拆分给并行 agents，然后合并结果。适合可以分解为独立 subtasks 的任务。

#### Pattern 3: Orchestrator-Worker

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

一个智能 orchestrator 决定要做什么，委派给 workers，并综合结果。orchestrator 本身也是一个 agent，具备生成 workers 的 tools。

#### Pattern 4: Peer Swarm

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

没有中心 orchestrator。agents 以 peer-to-peer 方式通信。决策从交互中涌现。更难 debug，但可以扩展到大量 agents。

### 什么时候不要使用 Multi-Agent

Multi-agent 会增加复杂性。agents 之间的每一条 message 都是潜在的失败点。debugging 会从“阅读一个 conversation”变成“追踪五个 agents 之间的 messages”。

**以下情况应保持 single-agent：**
- 任务能放进一个 context window（工作数据低于约 100k tokens）
- 你不需要为不同阶段使用不同 system prompts
- 顺序执行已经足够快
- 任务足够简单，拆分带来的开销大于价值

**复杂性成本：**
- 每个 agent boundary 都是一次有损压缩：agent A 的完整 context 会被总结成给 agent B 的 message
- Coordination logic（谁做什么、什么时候做、按什么顺序做）本身就是 bug 来源
- Latency 增加：N 个 agents 意味着至少 N 次串行 LLM calls，如果它们需要来回交流则更多
- Cost 成倍增加：每个 agent 都会独立消耗 tokens

经验法则：如果一个任务少于 20 次 tool calls，并且能放进 100k tokens，就保持 single-agent。


```figure
swarm-messages
```

## 构建它

### 步骤 1： 过载的 Single Agent

下面是一个试图包揽一切的 single agent。它有一个巨大的 system prompt，以及一个同时容纳 research、code 和 reviews 的 context window：

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

这种做法的问题：
- context window 会随着每个阶段增长。到 review 步骤时，它包含 research notes、code 和先前推理。
- system prompt 是泛化的。它无法针对每个阶段进行调优。
- 没有任何事情并行运行。

### 步骤 2： Specialist Agents

现在把它拆开。每个 agent 只负责一个任务：

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

每个 specialist 都有一个聚焦的 prompt。每个都拿到干净的 context window，其中只包含它需要的输入。

### 步骤 3： 通过 Messages 协调

用显式 message passing 把 specialists 连接起来：

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

每个 agent 只接收发给自己的 messages。没有 context pollution。researcher 阅读文档产生的 50k tokens 永远不会进入 reviewer 的 context。

### 步骤 4： 对比

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

multi-agent 版本使用更多总 tokens（三个 agents，三次独立 LLM calls），但每个 agent 的 context 都保持干净。每个阶段的质量会提升，因为 system prompt 是专门化的。

## 使用它

本课会产出一个可复用 prompt，用于决定什么时候采用 multi-agent。见 `outputs/prompt-multi-agent-decision.md`。

## 练习

1. 添加第四个 specialist：一个 "tester" agent，它从 coder 接收 code，并从 reviewer 接收 review feedback，然后编写 tests
2. 修改 pipeline，让 reviewer 可以把 feedback 发送回 coder，形成 revision loop（最多 2 轮）
3. 将顺序 pipeline 转换为 fan-out：并行运行 researcher 和一个 "requirements analyzer" agent，然后在传给 coder 之前合并它们的输出

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977) - multi-agent patterns 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155) - Microsoft 的 multi-agent conversation framework
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code) - Claude Code 如何使用 Task 进行委派
- [CrewAI documentation](https://docs.crewai.com/) - role-based multi-agent framework
