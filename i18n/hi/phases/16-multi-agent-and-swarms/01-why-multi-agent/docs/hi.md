# क्यों मल्टी एजेंट की जरूरत है?

> एक एजेंट दीवार पर टकराता है। स्मार्ट का तरीका बड़ा एजेंट नहीं बनाना है, बल्कि अधिक एजेंटों का उपयोग करना है।

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## 学习目标

- 识别 एकल एजेंट छत ((संदर्भ अधिशेष, मिश्रित विशेषज्ञता, अनुक्रमिक बोतल गला),并解释什么时候分为多个代理 才是正确选择
- तुलना करें संग्राहण पैटर्न (pipeline, parallel fan-out, supervisor, hierarchical),并为给定任务结构选择合适模式
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- 分析 बहु-एजेंट जटिलता लैटेंसी कॉस्ट डिबगिंग कठिनाई) और एकल-एजेंट सादगी 

## 问题

आप चरण 14 में एक एकल एजेंट का निर्माण करते हैं। यह काम कर सकता है। यह फ़ाइलों को पढ़ सकता है, आदेशों को चला सकता है, एपीआई को संचालित कर सकता है, और परिणामों के आधार पर तर्क कर सकता है। फिर आप इसे एक वास्तविक कोडबेसः 200 फ़ाइलों पर निर्देशित करते हैं।

यह एजेंट 卡住了── यह इसलिए नहीं है क्योंकि LLM 足够聪明, बल्कि इसलिए है क्योंकि यह कार्य एक एजेंट लूप 能处理的范围之外的任务──文本窗口被文件内容填满── एजेंट 忘记了40次工具通话 之前读的内容──它试图同时成为研究员、编码者和评论员,结果三件事都做不好──

यह एक एजेंट की छत है. जब प्रत्येक कार्य में निम्नलिखित सामग्री की आवश्यकता होती है, तो आप इसे पूरा करते हैंः

- **超出一个 window 容量的 context**- 读取 50 文件会轻松超过200k टोकन
- **不同阶段需要不同 expertise**- अनुसंधान आवश्यकता का उत्तेजना कोड निर्माण से भिन्न है
- **可以并行发生的工作**- क्यों तीन दस्तावेजों को क्रमशः पढ़ना चाहिए, एक साथ पढ़ने के बजाय?

## 核心概念

### एकल एजेंट छत

एक एकल एजेंट एक लूप है, एक संदर्भ विंडो है, एक सिस्टम प्रॉम्प्ट है, कल्पना करोः

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

तीन बातें हुईं:

1. **Context saturation**- उपकरण परिणाम लगातार जमा होते हैं। 30 वें दौर तक, एजेंट ने 150 हजार टोकन का फाइल सामग्री, आदेश आउटपुट और पूर्व विचारों का उपभोग किया है।

2. **Role confusion**- एक लेख जो लिखता है कि आप शोधकर्ता, कोडर, समीक्षक और परीक्षक हैं, एक प्रणाली शीघ्रता उत्पन्न होगी, केवल आधा शोध, आधा कोडिंग करेगा, और समीक्षा के एजेंट को कभी पूरा नहीं कर पाएगा।

3. **Sequential bottleneck**- एजेंट पहले पढ़ें फ़ाइलें A, फिर पढ़ें फ़ाइलें B, फिर पढ़ें फ़ाइलें C──三次串行 LLM कॉल──三次串行工具执行──没有并行性──

### बहु-एजेंट  समाधान

拆分工作── प्रत्येक एजेंट को एक कार्य, एक संदर्भ विंडो, तथा उस कार्य के लिए एक प्रणाली संकेत देंः

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

हर एजेंट के पास हैः
- एक फ़्लूज़ सिस्टम प्रॉम्प्ट ((你是代码审查者──你的唯一任务是找错误──)
- स्वयं संदर्भ विंडो ((( नहीं किया जाएगा अन्य एजेंटों के काम污染)
- 清晰的 इनपुट/आउटपुट अनुबंध (अनुसंधान नोट्स प्राप्त करना, आउटपुट कोड)

### ऐसा करने के लिए वास्तविक प्रणाली

**Claude Code subagents**- 当 क्लाउड कोड 使用 `Task`生成一个子干净──孩子 执行聚焦工作并回归摘要──

**Devin**- 运行规划器代理、编码器代理 和浏览器代理──规划器将工作分为步骤──编码──编写代码──浏览器研究文档──每个都有独立的背景──

**Multi-agent coding teams (SWE-bench)**- SWE-bench 上表现最好的系统使用研究员 读取代码基础,规划师 设计修复方案,代码实现修复── एकल-एजेंट प्रणालियों का स्कोर更低──

**ChatGPT Deep Research**- और कई खोज एजेंटों को उत्पन्न करने के लिए, प्रत्येक अलग अलग कोण से खोज, और फिर समग्र परिणामों को।

### प्रकाश संचिका

बहु-एजेंट न है द्वि-विकल्प। यह एक प्रकाश谱 हैः

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

**Single agent**- एक लूप, एक शीघ्रता, सरल कार्य के लिए उपयुक्त है।

**Subagents**- माता-पिता के लिए फोकस के उप-कार्य।

**Pipeline**- एजेंटों के क्रमशः संचालन में प्रवेश करना।

**Team**- एजेंटों के पास एक साझा संदेश बस है और वे इसका संचालन करते हैं। प्रत्येक के पास एक भूमिका है।

**Swarm**- बड़े पैमाने पर समान या समान एजेंटों का समान राज्य साझा करें।

### चार प्रकार के मल्टी-एजेंट पैटर्न

#### पैटर्न 1: पाइपलाइन

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

प्रत्येक एजेंट 转换数据并向前传递――易推理――某一阶段失败会阻塞后续阶段――

#### पैटर्न 2: फैन आउट / फैन इन

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

कार्य को एक साथ करने वाले एजेंटों में विभाजित करें, फिर परिणाम को एक साथ करें।

#### नमूना 3: ऑर्केस्ट्रेटर-वर्कर

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

एक बुद्धिमान ऑर्केस्ट्रेटर यह तय करता है कि क्या करना है, उसे कार्यकर्ताओं को सौंपता है, और परिणामों को पूरा करता है।

#### पैटर्न 4: समकक्षों का झुंड

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

没有中心管家──代理 以同行通信方式──决策从交互中涌现──更难调试,但可以扩展到大量代理──

### 什么时候不要使用多代理

मल्टी-एजेंट  जटिलता बढ़ेगी  एजेंट  के बीच प्रत्येक संदेश  संभावित विफलता बिंदु  है  डिबगिंग  से  एक बातचीत  को पढ़ने  में बदल जाएगा  पांच एजेंट  के बीच संदेश   को ट्रैक करने 

**以下情况应保持 single-agent：**
- 任务能放入一个背景窗口(工作数据低于约100k टोकन)
- आप अलग-अलग सिस्टम संकेतों का उपयोग करने के लिए अलग-अलग चरणों के लिए जरूरत नहीं है
- 顺序执行已经足够快
- 任务足够简单, विभक्त होने से उत्पन्न व्यय मूल्य से बड़ा होता है

**复杂性成本：**
- प्रत्येक एजेंट की सीमा एक बार में एक नुकसान होता हैः एजेंट ए का पूरा संदर्भ एजेंट बी के संदेश को संक्षेप में प्रस्तुत किया जाएगा
- समन्वय तर्क (Who does what?, what时候做?,按什么顺序做) स्वयं ही बग स्रोत है
- लटेंसी  बढ़ाना: एन 个代理 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 
- लागत में वृद्धिः प्रत्येक एजेंट स्वतंत्र खपत टोकन होगा

 अनुभव नियम: यदि एक कार्य 20 बार से कम उपकरण कॉल करता है, और 100k टोकन में रख सकता है, तो एकल एजेंट रखें


```figure
swarm-messages
```

##  इसे निर्माण

### 步骤 1: 过载的单人代理

नीचे एक एकल एजेंट है जो सब कुछ को शामिल करने का प्रयास करता है। इसमें एक विशाल सिस्टम प्रॉम्प्ट है, साथ ही साथ एक संदर्भ विंडो है जिसमें अनुसंधान, कोड और समीक्षाएं शामिल हैंः

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

इस प्रकार के प्रथाओं की समस्याएंः
- संदर्भ विंडो प्रत्येक चरण के साथ बढ़ेगी── समीक्षा 步骤时, इसमें शोध नोट्स、 कोड 和先前推理── शामिल हैं।
- प्रणाली शीघ्रता ही सर्वव्यापी है।
- 没有任何事情并行运行──

### 步骤 2: विशेषज्ञ एजेंट

अब इसे तोड़ो। प्रत्येक एजेंट केवल एक कार्य के लिए जिम्मेदार हैः

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

प्रत्येक विशेषज्ञ के पास एक फोकस प्रॉम्प्ट होता है। प्रत्येक व्यक्ति को एक शुद्ध संदर्भ विंडो मिलती है, जिसमें केवल उस आवश्यकता के लिए प्रवेश होता है।

### 步骤 3: 通过 संदेश 协调

स्पष्ट संदेश पारित करने के साथ विशेषज्ञों को जोड़ें

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

प्रत्येक एजेंट केवल अपने संदेश प्राप्त करता है। कोई संदर्भ प्रदूषण नहीं है। शोधकर्ता 50 हजार टोकन जो रिव्यूर के संदर्भ में कभी प्रवेश नहीं करेगा।

### चरण 4: तुलना

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

बहु-एजेंट  संस्करण अधिक कुल टोकन का उपयोग करते हैं(तीन एजेंट, तीन स्वतंत्र एलएलएम कॉल), लेकिन प्रत्येक एजेंट का संदर्भ शुद्ध रहता है।

## इसका उपयोग करें

इस वर्ग में एक दोहराए जाने योग्य संकेत उत्पन्न हुआ, जिसका उपयोग बहु-एजेंट को कब अपनाया जाए, यह तय करने के लिए किया गया।`outputs/prompt-multi-agent-decision.md`

## अभ्यास

1. 添加第四个专家: एक "टेस्टर" एजेंट, यह कोडर से 接收代码,并从审核者 接收审核反,然后编写测试
2. 修改 पाइपलाइन, रिव्यू करने वाला प्रतिक्रिया भेज सकता है  भेज वापस कोडर, संशोधन लूप बनाने के लिए
3. एक "आवश्यकता विश्लेषक" एजेंट के साथ एक फैन-आउट के लिए क्रम पाइपलाइन को स्थानांतरित करें, फिर कोड को संचरण करने के लिए उन्हें आउटपुट में शामिल करें

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- बहु-एजेंट पैटर्न 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- माइक्रोसॉफ्ट के बहु एजेंट बातचीत ढांचे
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- क्लॉड कोड  कैसे कार्य का उपयोग करें  कार्य करने के लिए
- [CrewAI documentation](https://docs.crewai.com/)- भूमिका आधारित बहु एजेंट ढांचा
