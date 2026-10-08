# Porque é que precisamos de Multidimensional?

> Um agente bateu contra uma parede. A prática inteligente não é fazer um agente maior, mas usar mais agentes.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## Objectivo de aprendizagem

- Identificar o limite de um único agente ((contexto sobrefluxo]], experiência misturada, garganta de engarrafamento), e explicar quando separar em vários agentes 才是正确选择
- Comparar padrões de orquestração (pipeline, paralelo, fan-out, supervisor, hierarquica), e em conjunto,
- Designar um sistema multi-agente com um papel claro, fronteira, estado compartilhado e contrato de comunicação
-  análise da complexidade multi-agente latencia  custo  dificuldade de depuração de erros) e da simplicidade de um único agente 

## 问题

Você construiu um único agente na Fase 14.[5] Ele pode trabalhar.[6] Ele pode ler documentos, executar ordens, convocar APIs, e fazer inferências com base nos resultados.[7] Então você o direciona para uma base de código real:

Este agente está preso. Não porque o LLM não é inteligente, mas porque esta tarefa ultrapassa um ciclo de agente que pode ser processado.

É o teto de um agente único. Quando uma missão precisa de o seguinte, você vai encontrá-la.

- **超出一个 window 容量的 context**- 读取 50 文件会轻松超过200k tokens
- **不同阶段需要不同 expertise**- a necessidade de investigação é diferente da geração de código
- **可以并行发生的工作**- Porque é que vais ler três documentos em ordem, e não simultaneamente?

## 核心概念

### Tesouro de agente único

Um único agente é um loop, uma janela de contexto, um sistema de instruções.

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

Três coisas surgem:

1. **Context saturation**- resultados da ferramenta Incontínuo acumulação. Até a 30a rodada, o agente já consumiu 150 mil tokens.

2. **Role confusion**- Uma escrita que você é pesquisador, codificador, revisor e testeiro, produzirá um prompt de sistema que apenas faz metade da pesquisa, metade da codificação e nunca poderá completar a revisão.

3. **Sequential bottleneck**- agente 先读文件 A,再读文件 B,再读文件 C──三次串行 LLM chamada──三次串行工具执行──没有并行性──

### Multidistribuição  solução

拆分工作── dar a cada agente uma tarefa, uma janela de contexto, bem como um sistema de instrução para a tarefa:

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

Cada agente tem:
- Um sistema de controlo de foco. Você é um revisor de código.
-  própria janela de contexto ((( não será contaminada por outros agentes)
- 清晰的输出/输入合同 (contrato de entrada/saída)

### Isso é o que faz o sistema real.

**Claude Code subagents**- Quando Claude Code `Task`Quando se torna um subagente, ele cria um agente infantil com tarefa de alcance.

**Devin**- Operador de planejamento agente, agente de codificação e agente de navegador, planejador vai dividir o trabalho em passos, código, código, navegador, documentos, conteúdo, conteúdo e conteúdo.

**Multi-agent coding teams (SWE-bench)**- Na SWE-bench 上表现最好的系统使用研究员 读取代码基础,planner 设计修复方案,coder 实现修复──single-agent systems 的分更低──

**ChatGPT Deep Research**- E gerar vários agentes de busca, cada uma explorar de diferentes ângulos, e então combinar os resultados.

### O que é o que é?

Multi-agente não é um segundo seleção. É uma espectrosfera:

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

**Single agent**- Um loop, um prompt... para uma simples tarefa...

**Subagents**- pai 为聚焦的子任务 生成孩子── pai 维护计划──孩子 回报结果──这是克劳德代码的做法──

**Pipeline**- agentes 按顺序运行──Agent A's输出成为 Agent B's输入──适合分阶段 workflows:research -> code -> review -> test──

**Team**- agentes  através de um bus de mensagens compartilhadas 并行运行── cada um tem um papel──orquestrador 负责协调── adaptar-se ao mesmo tempo às necessidades de diferentes habilidades──

**Swarm**- Massas iguais ou quase iguais de agentes, estado comum, não há orquestrador fixo, agentes, que vão de fila para a cotação de trabalho, adaptados a tarefas de alta pronóstico e execução.

### 4 tipos de padrões multi-agentes

#### Modelo 1: oleoduto

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

Cada agente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

#### Padrão 2: Fan-out / Fan-in

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

O trabalho será dividido em agentes de e-mail, e depois os resultados serão combinados.

#### Modelo 3: Orquestra-Trabalhador

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

Um orquestrador inteligente decide o que fazer, envia os trabalhadores, e produz resultados globais.

#### Patrão 4: Escolha de pares

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

没有中心调整器──agentes 以同龄人通讯方式──决策从交互中涌现──更难调整,但可以扩展到大量的代理──

### 什么时候不要使用多代理

Multicílio irá aumentar a complexidade. Cada mensagem entre os agentes é um ponto de falha potencial.

**以下情况应保持 single-agent：**
- 任务能放进一个背景窗口(工作数据低于约100k tokens)
- Você não precisa de usar diferentes instruções de sistema para diferentes fases
- 顺序执行已经足够快
- As tarefas são simples, o custo é maior do que o valor.

**复杂性成本：**
- Cada limite de agente é uma vez com um comprimento: o contexto completo do agente A será resumido para a mensagem do agente B
- A lógica de coordenação ((谁做什么什么什么时候做什么按什么顺序做) em si mesma é a fonte de bug
- Aumento da latência: N 个代理意味着至少N 次串行LLM电话,如果它们需要回来交流则更多
- Custo 成倍增加: cada agente cidade tokens de consumo independente

經驗法则: Se uma tarefa for menor que 20 vezes chamada de ferramenta, e pode colocar 100k tokens, mantenha-se um único agente.


```figure
swarm-messages
```

## Construí-lo

### Passo 1: Agente único

Abaixo está um único agente de tentar incluir tudo. Ele tem um enorme sistema de prompt, bem como uma janela de contexto para simultaneamente acomodar pesquisa, código e avaliações:

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

Esta é a questão da prática:
- O fenômeno contextual irá crescer com cada fase. Até a revisão.
- O sistema de execução é generalizado. Não pode ser modificado em cada fase.
- Não há nada que aconteça.

### 步骤 2: Agentes especializados

Agora, desmantelem-no. Cada agente só tem uma tarefa:

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

Cada especialista tem um prompt focado. Cada um tem uma janela de contexto limpa, que só contém as entradas necessárias.

### 步骤 3: 通过 Messages 协调

Usando mensagem de passagem, coloque especialistas  conectá-los:

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

Cada agente só recebe e envia suas próprias mensagens. Não há contaminação de contexto. Pesquisador.

### 步骤 4: Em relação

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

Multidistribuição  versão utiliza mais tokens gerais ((três agentes, três vezes chamadas LLM independentes), mas o contexto de cada agente permanece em funcionamento.

## Use-o

O presente curso produz um prompt repetivel, para decidir quando adotar multi-agente.`outputs/prompt-multi-agent-decision.md`- Não.

## 练习

1. Adicione um quarto especialista: um agente "tester", ele recebe o código do codificador, recebe feedback do revisor, e depois escreve testes.
2. Modificar o pipeline, deixar o revisor pode enviar feedback  enviar de volta o codificador, formar o ciclo de revisão ((mais de 2 轮)
3. Vai fazer o pipeline de ordem  transformar em fan-out: fazer o pesquisador de operações e um agente "analista de requisitos", e depois em transmitir para o codificador  antes de juntar-se a sua saída

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- padrões multi-agentes 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- Microsoft multi-agente framework de conversação
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- Código Claude  como utilizar a tarefa  executar
- [CrewAI documentation](https://docs.crewai.com/)- quadro multiagente baseado em funções
