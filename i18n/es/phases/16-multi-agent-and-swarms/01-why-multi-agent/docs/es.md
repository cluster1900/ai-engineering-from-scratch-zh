# ¿Por qué necesitas multi-agente?

> Un agente se ha golpeado contra un muro. La práctica inteligente no es hacer un agente más grande, sino usar más agentes.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## El objetivo del aprendizaje

- 识别 single-agent ceiling ((contexto sobreflujo]], experiencia mixta, cuello de botella secuencial),并解释什么时候分为多代理 才是正确选择
- Comparar los patrones de orquestación (pipeline, paralelo, supervisor, jerárquico), y para una determinada estructura de tareas seleccionar el modo adecuado
- Diseñar un sistema multiagente con un papel claro, fronteras, estado compartido y contrato de comunicación
-  análisis de la complejidad de múltiples agentes latencia, coste, dificultad para desarmar errores) y la simplicidad de un solo agente 

##  problemas

Usted construye un único agente en la Fase 14 ― puede trabajar ― puede leer archivos, ejecutar órdenes, convocar APIs, y basarse en los resultados para hacer una inferencia ― luego lo dirige a una base de código real: 200 documentos ― tres idiomas ― pruebas de dependencia de la infraestructura, y antes de escribir código también necesita estudiar APIs externas ―

Este agente está en la cárcel. No es porque el LLM no sea inteligente, sino porque esta tarea va más allá de un bucle de agentes que pueden procesar.

Es el techo de un solo agente. Cada vez que una tarea necesita lo siguiente, lo encontrarás:

- **超出一个 window 容量的 context**- 读取 50 文件会轻松超过200k tokens
- **不同阶段需要不同 expertise**- la investigación 需要的促与代码生成不同
- **可以并行发生的工作**- ¿Por qué leer tres documentos en orden y no leerlos al mismo tiempo?

## 核心概念 核心概念 核心概念 核心概念

### Techo de agente único

Un agente único es un bucle, una ventana de contexto, un sistema de instrucciones.

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

Tres cosas se plantean:

1. **Context saturation**- resultados de la herramienta Incontinuous cumulation. Hasta la tercera ronda, el agente ya ha consumido 150 mil tokens. Contenido de los documentos, orden de salida y previa evaluación.

2. **Role confusion**- Un escrito que usted es un investigador, codificador, revisor y probador, producirá un instante de sistema que sólo hace la mitad de la investigación, la mitad de la codificación y nunca podrá completar la revisión agente.

3. **Sequential bottleneck**- agente de primera lectura de documentos A, de segunda lectura de documentos B, de segunda lectura de documentos C,... tres veces en línea LLM llamadas,... tres veces en línea de herramientas ejecuciones,...

### Multidimensional  solución

拆分工作── dar a cada agente una tarea、 una ventana de contexto, así como un sistema de instrucción para la tarea:

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

Cada agente tiene:
- Una respuesta de sistema enfocada. Tu única tarea es encontrar errores.
-  propia ventana de contexto(no será contaminada por otros agentes)
- 清晰的 contrato de entrada/salida (recepción de notas de investigación, código de salida)

### Así es como se hace el sistema real

**Claude Code subagents**- Cuando Claude Código `Task`Cuando se convierte en un subagente, crea un agente infantil con tarea de alcance.

**Devin**- 运行规划员代理、编码员代理 和浏览器代理──planner 将工作分为步骤──编码员 编写代码──浏览器 研究文档──每个都有独立的背景──

**Multi-agent coding teams (SWE-bench)**- En el banco SWE, el mejor sistema de uso del investigador 读取 código base, planificador 设计修复方案, codificador 实现修复──

**ChatGPT Deep Research**- Y se producen varios agentes de búsqueda, cada uno explora desde diferentes ángulos, y luego se componen los resultados.

### La luz

Multi-agente no es una opción de dos tipos.

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

**Single agent**- Un bucle, un instante... para una simple tarea...

**Subagents**- padres 为聚焦的子任务 生成孩子── padres 维护计划── niños 回报结果──这是克劳德码的做法──

**Pipeline**- agentes 按顺序运行──Agent A's输出成为 Agent B's输入──适合分阶段 workflows:research -> code -> review -> test──

**Team**- agentes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

**Swarm**- Massa cantidad igual o casi igual de agentes compartido estado.

### Cuatro tipos de patrones multi-agentes

#### Modelo 1: oleoductos

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

Cada agente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

#### Modelo 2: Descanso / In-fan

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

Se dividirá el trabajo en agentes de la misma dirección, y luego se combinará los resultados.

#### Modelo 3: Orquesta-trabajador

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

Un orquestrador inteligente decide lo que debe hacer, encarga a los trabajadores, y consigue resultados integrales.

#### Patrón 4: El grupo de compañeros

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

没有中心调整器──agentes 以同行通信方式──决策从交互中涌现──更难调整, pero puede extenderse a una gran cantidad de agentes──

### 什么时候不要使用多代理 什么时候不要使用多代理

Multi-agente aumentará la complejidad. Cada mensaje entre los agentes es un punto de fracaso potencial.

**以下情况应保持 single-agent：**
- 任务能放进一个背景窗口(工作数据低于约100k tokens)
- Usted no necesita para diferentes fases de usar diferentes instrucciones del sistema
- 顺序执行已经足够快
- task is simple enough, descompartir el gasto que trae es mayor que el valor

**复杂性成本：**
- Cada límite de agente es una pérdida de compresión: el contexto completo del agente A se sumará a un mensaje del agente B
- La lógica de coordinación (quien hace lo que hace) es la fuente de error.
- La latencia aumenta: N 个代理意味着至少 N次串行LLM llamada, si necesitan volver a intercambiar entonces más
- El costo aumentó por dos veces: cada agente ciudadán tokens de consumo independiente

經驗法则: Si una tarea es menor a 20 veces llamadas de herramienta, y puede colocar 100k tokens, mantener un solo agente.


```figure
swarm-messages
```

## Construirlo

### Paso 1: Agente único

Aquí hay un solo agente de todo lo que intenta incluirse. Tiene un enorme sistema de preguntas, así como una ventana de contexto para la investigación, código y reseñas.

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

Este tipo de problemas de práctica:
- La ventana de contexto se desarrolla con cada etapa de crecimiento.
- El sistema de respuesta es generalizado. No puede realizar cambios en cada etapa.
- No hay nada que haga.

### 步骤 2: Agentes especializados

Ahora lo deshacemos. Cada agente sólo tiene una tarea:

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

Cada especialista tiene un prompt enfocado. Cada uno tiene una ventana de contexto limpia, que solo contiene las entradas que necesita.

### 步骤 3: 通过 Mensajes 协调

Con un mensaje claro pasando, los especialistas se conectan:

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

Cada agente sólo recibe y envía sus propios mensajes. No hay contaminación de contexto.

### Paso 4: En comparación

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

La versión multi-agente utiliza más tokens generales (todos tres agentes, tres llamadas independientes de LLM), pero el contexto de cada agente mantiene su calidad en cada etapa.

## Usalo

Este curso se produce con un prompt replicable, para decidir cuándo adoptar multi-agente.`outputs/prompt-multi-agent-decision.md`¿Qué es eso?

##  ejercicios

1. Añadir un cuarto especialista: un agente "tester", que recibe código del codificador, recibe comentarios de los revisores y luego redacta pruebas.
2. Modificar el pipeline, dejar que el revisor pueda enviar comentarios  enviar de nuevo codificador, formar un ciclo de revisión (((最多 2 轮)
3. Se puede utilizar un equipo de análisis de datos para evaluar los resultados de la investigación y el análisis de los requisitos.

## 关键术语: "El hombre es un hombre"

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- patrones multiagentes 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- Microsoft de multi-agente marco de conversación
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- Código de Claude  cómo utilizar la tarea  llevar a cabo
- [CrewAI documentation](https://docs.crewai.com/)- marco multiagente basado en el papel
