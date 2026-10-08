# Tại sao cần nhiều đại lý?

> Một đại lý đâm vào tường. Cách thông minh không phải là làm một đại lý lớn hơn, mà sử dụng nhiều đại lý hơn.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## Học mục tiêu

- 识别单代理天花板 ((context overflow]], mixed expertise, sequential bottleneck),并解释什么时候分为多代理 才是正确选择
- So sánh các mô hình dàn nhạc (pipeline, parallel fan-out, supervisor, hierarchical),并为给定任务结构选择合适模式
- Thiết kế một hệ thống đa đại lý có vai trò rõ ràng, biên giới, nhà nước chung và hợp đồng giao tiếp
- 分析 phức tạp của nhiều đại lý trễ n phí n khó khăn trong việc giải quyết lỗi) và đơn giản của một đại lý 

## 问题

Bạn xây dựng một đại lý duy nhất trong giai đoạn 14. Nó có thể làm việc. Nó có thể đọc các tập tin, chạy lệnh, điều chỉnh API, và dựa trên kết quả được đưa ra suy luận. Sau đó bạn chỉ ra nó đến một cơ sở mã thực tế: 200 文件 三种语言, dựa trên các thử nghiệm cơ sở hạ tầng, và trước khi viết mã cũng cần nghiên cứu các API bên ngoài.

Trưởng lý này đã bị mắc kẹt. Không phải vì LLM không đủ thông minh, mà vì nhiệm vụ này vượt ra ngoài phạm vi của vòng tròn của một đại lý có thể xử lý.

Đó là giới hạn đơn vị. Mỗi khi nhiệm vụ cần những nội dung sau, bạn sẽ gặp phải nó:

- **超出一个 window 容量的 context**- 读取 50 文件会轻松超过200k token
- **不同阶段需要不同 expertise**- nghiên cứu 需要的促与代码生成不同
- **可以并行发生的工作**- Sao phải đọc 3 tập đơn theo trật tự chứ không phải cùng lúc?

## 核心概念

### Đường thượng đơn tác nhân

Một đại lý đơn lẻ là một vòng lặp, một cửa sổ ngữ cảnh, một hệ thống nhắc.

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

Có 3 vấn đề:

1. **Context saturation**- kết quả công cụ không ngừng tích lũy. Đến vòng 30, đại lý đã tiêu thụ 150k mã thông báo.

2. **Role confusion**- Một người viết rằng bạn là nhà nghiên cứu, lập trình viên, đánh giá và kiểm tra viên, sẽ tạo ra một trung gian chỉ làm một nửa nghiên cứu, một nửa lập trình, và sẽ không bao giờ hoàn thành đánh giá.

3. **Sequential bottleneck**- đại lý trước đọc tài liệu A, tái đọc tài liệu B, tái đọc tài liệu C,...

### Các giải pháp đa tác nhân

拆分工作──给每个代理一个任务、一个背景窗口,以及一个系统提示调整任务:

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

Mỗi đại lý đều có:
- Một hệ thống tập trung nhanh chóng. Bạn là một kiểm tra mã. Nhiệm vụ duy nhất của bạn là tìm ra lỗi.
- 自己的背景窗口(不会被其他代理的工作污染)
- 清晰的输出/输入合同(接收研究笔记,输出代码)

### Làm như vậy là một hệ thống thực sự.

**Claude Code subagents**- 当 Claude Code 使用 `Task`生成一个 subagent 时, nó sẽ tạo ra một con đại lý với nhiệm vụ có mục tiêu.

**Devin**- 运行规划器代理、编码器代理 和浏览器代理──规划器将工作分为步骤──编码──编码──浏览器 研究文档──每个都有独立的背景──

**Multi-agent coding teams (SWE-bench)**- Trong SWE-bench 上表现最好的系统使用研究员 读取代码基础,规划师 设计修复方案,代码实现修复──单代理系统的分更低──

**ChatGPT Deep Research**- và tạo ra nhiều đại lý tìm kiếm, mỗi tìm kiếm theo góc độ khác nhau, sau đó tổng hợp kết quả.

### 光谱

Multi-agent không phải là lựa chọn. Nó là một quang phổ:

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

**Single agent**- Một vòng, một cú thôi.

**Subagents**- phụ huynh 为聚焦的子任务 生成孩子── phụ huynh 维护计划──孩子 回报结果──这是克劳德码的做法──

**Pipeline**- đại lý 按顺序运行──Agent A 的输出成为 Agent B 的输入──适合分阶段工作流:研究 -> 代码 -> 审查 -> 测试──

**Team**- đại lý thông qua shared message bus 并行运行. Mỗi người có một vai trò.

**Swarm**- Tỷ lệ đại lý tương tự hoặc gần giống nhau chia sẻ trạng thái. Không có nhà dàn nhạc cố định.

### 4 kiểu mẫu đa tác nhân

#### Mô hình 1: đường ống dẫn

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

Mỗi đại lý chuyển đổi dữ liệu và chuyển tiếp.

#### Mô hình 2: Fan-out / Fan-in

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

Để phân chia công việc cho các đại lý và kết quả, sau đó kết hợp kết quả.

#### Mô hình 3: Người làm nhạc cụ

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

Một nhạc công thông minh quyết định phải làm gì, ủy nhiệm cho công nhân,并综合结果―― một nhạc công tự thân cũng là một đại lý, có các công cụ để tạo ra công nhân――

#### Mô hình 4: Nhóm đồng nghiệp

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

Không có tổ chức trung tâm. Các đại lý 以 peer-to-peer 方式通信.

### 什么时候不要使用多代理

Nhiều đại lý sẽ tăng độ phức tạp. Mỗi tin nhắn giữa các đại lý đều là điểm thất bại tiềm tàng.

**以下情况应保持 single-agent：**
- 任务能放进一个背景窗口(工作数据低于约100k token)
- Bạn không cần phải dùng các lệnh hệ thống khác nhau cho giai đoạn khác nhau
- 顺序执行已经足够快
- 任务足够简单, chia ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra ra.

**复杂性成本：**
- Mỗi ranh giới của đại lý đều là một lần bị mất: toàn bộ bối cảnh của đại lý A sẽ được kết luận vào thông điệp của đại lý B
- logic phối hợp (Who does what?,什么时候做?,按什么顺序做) chính nó là nguồn lỗi
- Sự trễ tăng:N 个代理 nghĩa là ít nhất N lần liên tiếp LLM gọi, nếu chúng cần đến lại để giao tiếp thì nhiều hơn
- Chi phí tăng gấp đôi: Mỗi đại lý thành phố tiêu thụ độc lập token

经验法则: Nếu một nhiệm vụ ít hơn 20 lần gọi công cụ, và có thể đặt vào 100k token, hãy giữ một đại lý.


```figure
swarm-messages
```

##  xây dựng nó

### Bước 1: Chuyên viên độc lập

Dưới đây là một cố gắng bao gồm tất cả các đại lý đơn lẻ. Nó có một hệ thống lớn, cũng như một cửa sổ ngữ cảnh cùng thời chứa nghiên cứu, mã và đánh giá:

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

Vấn đề về việc làm:
- cửa sổ ngữ cảnh 会 theo từng giai đoạn tăng trưởng.
- Hệ thống nhanh chóng là phổ biến. Nó không thể được điều chỉnh cho mỗi giai đoạn.
- Không có gì xảy ra.

### 步骤 2: Các đặc vụ chuyên nghiệp

Giờ thì hãy tháo nó ra. Mỗi đại lý chỉ có một nhiệm vụ.

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

Mỗi chuyên gia có một cú chỉ dẫn tập trung. Mỗi người đều có một cửa sổ ngữ cảnh sạch, trong đó chỉ chứa các mục nhập cần thiết.

### 步骤 3: 通过 Thông điệp 协调

Với thông điệp hiển nhiên thông qua, đưa chuyên gia  kết nối lên:

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

Mỗi đại lý chỉ nhận được gửi cho bản tin của mình. Không có ô nhiễm ngữ cảnh.

### Bước 4: Đối với

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

Multi-agent  phiên bản sử dụng nhiều hơn tổng token ((3 đại lý, 3 lần gọi LLM độc lập), nhưng ngữ cảnh của mỗi đại lý đều giữ sạch.

## Sử dụng nó

本课会产出一个可复用提示,用于 quyết định khi nào áp dụng đa đại lý.`outputs/prompt-multi-agent-decision.md`

## 练习

1. Thêm chuyên gia thứ tư: một đại lý "tử nghiệm", nó nhận mã từ coder, nhận từ nhà phê bình nhận phản hồi đánh giá, sau đó biên soạn các bài kiểm tra
2. 修改 pipeline, để người xem có thể đưa ra phản hồi  gửi lại coder, hình thành vòng lặp sửa đổi (最多 2 轮)
3. 将顺序管道 转换为风扇:并行运行研究员和一个" yêu cầu phân tích viên" đại lý, sau đó chuyển giao cho coder 之前合并它们的输出

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- các mô hình đa tác nhân 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- Microsoft của đa đại lý hội thoại khung
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- Claude Code  làm thế nào để sử dụng nhiệm vụ  thực hiện
- [CrewAI documentation](https://docs.crewai.com/)- khung đa tác nhân dựa trên vai trò
