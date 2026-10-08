# Neden Multi-Agent gerekiyor?

> Bir ajan duvara çarpıyor. Akıllı bir yöntem daha büyük bir ajan yapmak değil, daha fazla ajan kullanmak.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## Öğrenme hedefi

- 识别单代理天井 ((文本溢出、混合专业知识、序列瓶),并解释什么时候分分为多代理 才是正确选择
- Görevsel ve düzenli bir şekilde düzenlenmiş ve düzenli olarak düzenlenmiş olan bir sistem.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- 分析 multi-agent karmaşıklığı  latency  cost  debugging difficulty) ve single-agent simplicity  arasındaki ağırlık

## 问题

14. aşamada tek bir ajan oluşturur. Çalışabilir. Dosyaları okuyabilir, emirleri yürütür, API'leri düzenleyebilir ve sonuçlara dayanarak düşünceler yapılır. Sonra onu gerçek bir kod tabanına yönlendirir: 200 dosya, üç dil, altyapıya bağlı testler ve kod yazmadan önce dış API'leri araştırmak gerekir.

Bu ajan 卡住了── LLM yeterince zeki olmadığı için değil, ama bu görev bir ajan döngüsünün 能处理的范围之外的任务而已──文本窗被文件内容填满──agent 忘了40次工具通话 之前读过的内容──它试图同时成为研究员、编码者和评论员,结果三件事都做不好──

Bu tek ajan tavanı. Her görev aşağıdaki içeriği gerektirdiğinde, sen de karşılaşırsın.

- **超出一个 window 容量的 context**- 50 dosya kolayca 200 bin tokenden fazla olacak .
- **不同阶段需要不同 expertise**- araştırma ın gereklilikleri  cod generasyon ile farklı
- **可以并行发生的工作**- Neden üç dosyayı sıradan okuyorsun, aynı anda okuyorsun?

## 核心概念

### Tek Ajanlı Tavan

Tek bir ajan, bir döngü, bir bağlam penceresi, bir sistem sorgulaması, düşünün:

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

Üç şey ortaya çıktı:

1. **Context saturation**- Araç sonuçları sürekli toplanmaktadır. 30. turuna kadar, ajan 150 bin token kullanmış. Dosya içeriği, emir çıkışı ve ön düşünceler. 5. turdaki önemli ayrıntılar kaybedilmiştir.

2. **Role confusion**- Bir yazın Seniz araştırmacı kodlayıcı reviewçi  ve tester  sistem prompt, sadece yarı araştırma  yarı kodlama yapıp asla tamamlayamaz bir inceleme ajanı üretir.

3. **Sequential bottleneck**- ajan önce okuyucu dosya A, tekrar okuyucu dosya B, tekrar okuyucu dosya C──三次串行LLM çağrıları──三次串行工具執行──没有并行性──

### Çoklu Ajanlar  çözüm

拆分工作──Bütün ajanlara bir görev, bir bağlam penceresi ve bu görev için bir sistem sorgulaması ver:

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

Her ajanın bir tane var:
- Bir sistem açar. Sen bir kod inceleyicisisin. Tek görevin hata bulmak.
-  kendi bağlam penceresi ((( başka ajanların tarafından iş 污染)
- 清晰的输出/输入合同(接收研究笔记,输出代码)

### Bunu yapmak için gerçek sistem.

**Claude Code subagents**- 当 Claude Code 使用 `Task`生成一个 subagent 时,它会创建一个带有目标任务的儿童代理──家长──保持自己的背景──干净──child 执行聚焦工作并回归总结──

**Devin**- 运行规划器代理、编码器代理 和浏览器代理──planner 将工作分为步骤──编码器 编写代码──浏览器 研究文档──每个都有独立的背景──

**Multi-agent coding teams (SWE-bench)**- SWE-bençinde  上表现最好的系统使用研究员 读取代码基础,planner 设计修复方案,coder 实现修复──单代理系统的得分更低──

**ChatGPT Deep Research**- ve birden fazla arama ajanı üretmek için, her biri farklı açılardan araştırmak, sonra sonuçları birleştirmek.

###  光谱

Çoklu ajanı değil iki seçeneği.

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

**Single agent**- Bir döngü, bir çabuklık.

**Subagents**- ebeveynler için fokus alt görevler. Çocuklar yetiştirmek.

**Pipeline**- ajanlar 按顺序运行──Agent A'nın输出成为 Agent B'ın输入──适合分阶段工作流:研究 -> code -> review -> test──

**Team**- ajanlar paylaşılmış mesaj otobüsü ve çalışmaları ile birlikte.

**Swarm**- Büyük miktarda aynı veya yakın aynı ajan ortaklık durumu.

### Çeşitli Ajanlı Şablonlar

#### Şekil 1: Pipeline

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

Her ajan  转换数据并向前传递──易推理──某一阶段失败会阻塞后阶段──

#### Şekil 2: Fan Out / Fan In

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

İşleri birleştirme ajanlarına ayırır, sonra birleştirme sonuçlarını oluşturur.

#### Model 3: Orkestratör-işçi

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

Bir akıllı orkeströr ne yapması gerektiğini karar verir, işçilere görevlendirir,并综合结果── orkeströr kendisi de bir ajan, işçilerin üretimi araçlarına sahiptir──

#### Dörtüncü örnek: Arkadaşlar

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

没有中心管家──代理 以同等方式通信──决策从交互中涌现──更难调解,但可以扩展到大量的代理──

### 什么时候不要使用多代理

Çoklu ajanlar arasındaki her mesajın karmaşıklığı artıyor. Ajanlar arasındaki her mesajın başarısızlık noktası olduğunu fark ediyoruz.

**以下情况应保持 single-agent：**
- 任务能放入一个文本窗口(工作数据低于约100k代币)
- farklı sistem isteklerini farklı aşamada kullanmak zorunda değilsiniz .
- 顺序执行已经足够快
- 任务足够简单,分开带来的开销比价值大

**复杂性成本：**
- Her ajanın sınırı bir kez bozulmuş bir kısaltma: A ajanın bütün bağlamı B ajanın mesajına bir şekilde bağlanır
- Koordinasyon mantığı ((谁做什么什么什么时候做 按什么顺序做) kendiliğinden bir hata kaynağıdır.
- Gecikme  artı: N 个代理 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个代表 个 个 个代表 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 
- Maliyet giderleri artıyor: her ajan bağımsız tüketim jetonları

経験法: Bir görev 20 kere daha az araç çağrısı yaparsa ve 100k token yerleştirebilirse tek ajan olarak kalır.


```figure
swarm-messages
```

## Yapın onu.

### Adım 1: Tek Ajanın Yüklenmesi

Aşağıda, her şeyi kapsayan tek bir ajan var. Büyük bir sistem promptı ve aynı zamanda araştırma, kod ve incelemeleri içeren bir bağlam penceresi vardır:

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

Bu tür bir uygulama sorunu:
- Konekst penceresi, her aşamada büyüme ile birlikte olacaktır.
- Sistem prompt'u genelleştirmek mümkün değil.
- Hiçbir şey yok, hiçbir şey yok.

### 步骤 2: Uzman ajanlar

Şimdi onu sökün. Her ajan sadece bir görevde.

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

Her uzmanın odaklı bir ipucu vardır. Her biri sadece ihtiyaç duyduğu girişleri içeren temiz bir bağlam penceresine ulaşır.

### 步骤 3: 通过 Messages 协调

Açık mesajla geçiyor, uzmanları bağlayın:

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

Her ajan sadece kendi mesajlarını alır, içerikli bir kirlilik yoktur. Araştırmacı, 50 bin tokenin ortaya çıkmasını asla gözden geçirmeyenin içerikliğine girmez.

### 4 adım: karşılaştırma

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

Multi-agent  versiyon kullanmak daha fazla toplam token( üç ajan, üç kez bağımsız LLM çağrıları), ama her ajanın bağlamı 干净──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

## Kullan

Bu ders, çoklu ajan kullanmanın ne zaman kullanılacağını belirlemek için tekrarlanabilir bir anket oluşturur.`outputs/prompt-multi-agent-decision.md`- Evet.

## 练习

1. Dördüncü uzman ekle: bir "tester" ajanı, kodlayıcıdan kod alır, inceleyiciden yorum yorumunu alır ve sonra testleri düzenler.
2. 修改 pipeline, let reviewer can can can feedback 发送回编码器, form revision loop(最多 2 轮)
3. Bu yüzden, bu programın bir parçası olarak, bir "requirements analyzer" aracı ile birlikte, bir "requirements analyzer" aracı olarak, bir "coder"e aktarılmasını sağlar.

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- çoklu ajanlı modeller 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- Microsoft'un çoklu ajan sohbet çerçevesini
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- Claude Code  nasıl kullanılır Görev  yürütülür
- [CrewAI documentation](https://docs.crewai.com/)- Rol tabanlı çoklu ajan çerçevesini
