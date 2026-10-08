# لماذا تحتاج إلى وكيل متعدد؟

> عميل واحد يصدم الجدار. الممارسة الذكية ليست أن تكون عميل أكبر، بل استخدام المزيد من العملاء.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## 學习目标

- 识别单代理天花板(上下文溢出、混合专业知识、序列瓶),并解释什么时候分为多代理 才是正确选择
- مقارنة أنماط التنسيق ((بيبلين  المُشجع المتوازي  المشرف  الهرمي) ،并为给定任务结构选择合适模式
- تصميم نظام متعدد الوكلاء مع حدود واضحة المشاركة في الدولة وعقد الاتصالات
- تحليل تعقيد العملاء المتعددين (التأخير، التكلفة، صعوبة إزالة الأخطاء) وسهولة العملاء الواحد

## 问题

يمكنك بناء وكيل واحد في المرحلة 14. يمكن أن تعمل. يمكن أن تقرأ الملفات. يمكن أن تقوم بتشغيل الأوامر. يمكن أن تقوم بتدوين APIs، ويمكن أن تقوم بتحليل النتائج. ثم يمكنك توجيهها إلى قاعدة رمزية حقيقية: 200 ملفات.

هذا الوكيل قد عاش. ليس لأن ماجستير في العلوم ليس ذكيًا بما فيه الكفاية، ولكن لأن هذه المهمة تجاوزت حدود حلقة العميل يمكن معالجتها. نافذة السياق تم ملء الملفات.

هذا هو السقف المفرد. كلما كانت المهمة تتطلب ما يلي، كنت تواجه:

- **超出一个 window 容量的 context**- 读取 50 文件会轻松超过 200k رموز
- **不同阶段需要不同 expertise**- البحث  حاجة التحفيز مختلفة عن توليد الرمز
- **可以并行发生的工作**-لماذا تقرأ ثلاث وثائق بشكل متسلسل بدلاً من قراءتها في وقت واحد؟

## مفهوم الأساسي

### السقف الذي يعمل بمعامل واحد

وكيل واحد هو حلقة واحدة نافذة سياقية واحدة عرض النظام

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

ثلاثة أمور ستأتي

1. **Context saturation**- نتائج الأداة لا تتوقف عن التراكم. في الجولة الثلاثين، تم استهلاك الوكيل من 150 ألف رمز.

2. **Role confusion**- واحد يكتب أنك الباحث، المبرمج، المراجع ومتجرب، نظام تلقاء، سوف تنتج فقط نصف البحث، نصف التبرمج، ويمكنه أبدا أن ينجح وكيل المراجعة.

3. **Sequential bottleneck**- العميل 先读文件 A,再读文件 B,再读文件 C──三次串行 LLM calls──三次串行 tool executions──没有并行性──

### حلول متعددة الوكلاء

拆分工作── أعط كل عميل مهمة  نافذة سياقية، فضلا عن طلب نظام لتعديل المهمة:

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

كل عميل لديه:
- إنّكِ مُراجعة رمز. مهمّتكِ الوحيدة هي إيجاد الحشرات.
-  نافذة السياق الخاص بك ((( لن يتم تصرفها من قبل عملاء آخرين)
- 清晰的输入/输出合同 ((الوصول إلى ملاحظات البحث، رمز النفاذ)

### هذا النظام الحقيقي

**Claude Code subagents**- 当 كلود كود استخدام `Task`生成一个 subagent 时,它会创建一个带有目标任务的孩子代理──父母 保持自己的背景 干净──孩子 执行聚焦工作并回归摘要──

**Devin**- 运行规划器代理、编码代理 和浏览器代理──规划器 将工作分为步骤──编码──编写代码──浏览器研究文档──每个都有独立的背景──

**Multi-agent coding teams (SWE-bench)**- في SWE-البنك 上表现最好的系统使用研究者 读取代码基础,planner 设计修复方案,coder 实现修复──

**ChatGPT Deep Research**- و تُنتج عدة وكلاء بحث، كلّ واحد يبحث عن زاوية مختلفة، ثم يجمع النتائج

### النتائج

الوكيل المتعدد ليس خيار ثنائي.

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

**Single agent**- حلقة واحدة، تلقاء واحد، تتناسب مع مهمة بسيطة

**Subagents**- والدا 为聚焦的子任务 生成孩子们──والد 维护计划──孩子 回报结果──这是克劳德代码的做法──

**Pipeline**- العملاء 按顺序运行──Agent A 的输出成为 Agent B 的输入──适合分阶段工作流:研究 -> 代码 -> 审查 -> 测试──

**Team**- العملاء 通過 مشاركة البريد البس و  并行运行  كل منهم لديه دور  أوركستراتور  مسئول عن تنسيق  تكييف في الوقت نفسه يتطلب مهارات مختلفة 

**Swarm**- الكمية نفسها أو تقريبا نفس العاملين.

### أربعة أنماط متعددة الوكلاء

#### النمط الأول: خط أنابيب

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

كل وكيل  تحويل البيانات  وتقديمها                                                                                                                                                                                                                                                        

#### النمط الثاني: التشغيل / التشغيل

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

سوف تفصل العمل إلى وكلاء المزاد، ثم تجمع النتائج.

#### النمط الثالث: عامل الموسيقى

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

الموسيقي الذكي يقرر ما يجب القيام به، يُرسل إلى العمال، ويتم النتيجة الكاملة.

#### النمط الرابع: مجموعة من الأقران

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

没有中心管家──代理 以同行方式通信──决策从交互中涌现──更难调试,但可以扩展到大量的代理──

### 什么时候不要使用多代理

سيتزايد تعقيد العملاء. كل رسالة بين العملاء ستكون نقطة فشل محتملة. سيتحول التحريف من قراءة محادثة إلى تعقب رسائل بين خمسة عملاء.

**以下情况应保持 single-agent：**
- 任务能放进一个背景窗口(工作数据低于约100k代币)
- أنت لا تحتاج إلى استخدام طلبات النظام المختلفة
- 顺序执行已经足够快
- المهمة بسيطة جداً، التكلفة التي تجلبها أكبر من القيمة

**复杂性成本：**
- كل حد للعميل هو مرة واحدة مع ضغط: السياق الكامل للعميل A سيتم إجماليًا إعطاء رسالة للعميل B
- منطق التنسيق ((من يفعل ماذا 什么时候做 按什么顺序做) نفسه هو البغ المصدر
- زيادة التأخير: يعني أنّ الوكلاء لا يقلون عن N مرات متسلسلة من مكالمات الجامعة، إذا كانت بحاجة إلى العودة للتواصل
- تكلفة: كل وكيل مدينة إشارات استهلاك مستقلة

 تجربة قانون: إذا كانت مهمة أقل من 20 مرة الاتصال الأداة، ويمكن وضع 100K رموز، والاحتفاظ وكيل واحد.


```figure
swarm-messages
```

## بناءها

### الخطوة الأولى:

يحتوي على عجلة نظامية ضخمة، فضلاً عن نافذة سياقية تتضمن البحث والرموز والإستعراضات:

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

هذه المشكلة:
- نافذة السياق 会 مع كل مرحلة نمو.  إلى مراجعة 步骤.
- نظام التسريع هو متعمّد.
- لا شيء ينجح في القيام به

### الخطوة الثانية: العملاء المتخصصين

الآن فلتفكّرها كل عميل يتحمل مهمة واحدة فقط

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

كل متخصص لديه طلب مركز. كل واحد يحصل على نافذة سياقية نظيفة، والتي تحتوي فقط على ما يحتاجه من إدخال.

### 步骤 3: 通过 Messages 协调

مع رسالة واضحة تمرير وضع المتخصصين  وصل:

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

كل عميل فقط يتلقى رسائل له... لا توجد تلوثات سياقية... الباحث ... يقرأ الملفات

### الخطوة الرابعة:

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

وكالة متعددة  إصدار استخدام المزيد من الوهام العامة ((ثلاث وكلاء، ثلاث مرات مستقلة مكالمات الـ LLM) ، ولكن كل وكيل من سياقاتها تم الاحتفاظ干净── كل مرحلة من الجودة سوف ترتفع، لأن النظام سريع هو متخصص──

## استخدمها

هذا المقال يُنتج عن مفكرة قابلة للتكرار، لتحديد متى يتم استخدام وكلاء متعددين.`outputs/prompt-multi-agent-decision.md`.

## التدريب

1. إضافة المختص الرابع: وكيل "مختبر" ، فإنه من المبرمج الوصول إلى الرمز ،并 من المراجعة الوصول إلى تعليقات المراجعة ، ثم كتابة الاختبارات
2. 修改 pipeline,让评论者可以把反 发送回编码器,形成修改循环(最多 2 轮)
3. سوف نترتيب خط الأنابيب  تحويل إلى المروحة: ومفرد الباحثين والعميل "تحليلات المتطلبات" ، ثم في نقل إلى المبرمج  قبل المشاركة في إصدارها

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- أنماط متعددة الوكلاء 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- Microsoft's متعددة وكيل إطار محادثة
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- كود كود  كيفية استخدام المهمة  إجراء اللجنة
- [CrewAI documentation](https://docs.crewai.com/)- إطار متعدد الوكلاء القائم على الأدوار
