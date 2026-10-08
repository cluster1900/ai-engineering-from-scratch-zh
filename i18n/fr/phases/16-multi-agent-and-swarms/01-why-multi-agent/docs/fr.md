# Pourquoi avoir besoin de multi-agent ?

> Un agent est en train de se heurter à un mur. La pratique intelligente n'est pas de faire un agent plus grand, mais d'utiliser plus d'agents.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## Objectif de l'apprentissage

- 识别 single-agent ceiling ((context overflow]], expertise mixte, goulets d'étranglement séquentiels),并解释什么时候分为多代理 才是正确选择
- Comparer les modèles d'orchestration avec des systèmes de pipeline, de ventilateur parallèle, de superviseur, de hiérarchie, et de sélection de la structure de tâches
-  concevoir un système multi-agent doté d'un rôle clair, de frontières, d'un état partagé et d'un contrat de communication
- analyse de la complexité multi-agent  latence, coût, difficulté de débogage) et de la simplicité d'un agent 

##  problématique

Vous construisez un seul agent dans la phase 14. Il peut travailler. Il peut lire des fichiers, exécuter des commandes, modifier des API, et faire des raisonnements sur la base des résultats. Ensuite, vous le dirigez vers une véritable base de code: 200 fichiers, trois langues, tests de dépendance à l'infrastructure, et avant de rédiger le code, vous devez également étudier des API externes.

Cet agent est resté en vie. Ce n'est pas parce que le LLM n'est pas assez intelligent, mais parce que cette tâche dépasse la portée d'un boucle d'agent à traiter.

C'est le plafond d'un seul agent. Chaque fois que la tâche nécessite le contenu suivant, vous y rencontrez:

- **超出一个 window 容量的 context**- 读取 50 文件会轻松超过200k jetons
- **不同阶段需要不同 expertise**- recherche  nécessité de stimulation diffère de la génération de code
- **可以并行发生的工作**- Pourquoi lire trois documents en ordre et pas en même temps ?

## 核心概念

### Plafond à agent unique

Un seul agent est une boucle, une fenêtre de contexte, un prompt système.

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

Il y a trois choses qui se posent:

1. **Context saturation**- les résultats des outils continuent à se rassembler. À la 30e ronde, l'agent a déjà consommé 150 000 jetons.

2. **Role confusion**- un écrit qui vous fait un chercheur, un codeur, un critique et un testeur, produira un prompt de système qui ne fera que la moitié de la recherche, la moitié du codage et ne pourra jamais terminer l'examen.

3. **Sequential bottleneck**- agent de première lecture du dossier A, de deuxième lecture du dossier B, de deuxième lecture du dossier C,.. trois fois en série de LLM appels,.. trois fois en série d'exécutions d'outils,..

### Les solutions multi-agents

拆分工作── donner à chaque agent une tâche, une fenêtre de contexte, ainsi qu'une demande de système pour améliorer cette tâche:

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

Chaque agent a:
- Un système de mise à jour rapide, vous êtes un réviseur de code. Votre seule tâche est de trouver des bugs.
-  propre fenêtre de contexte ((( ne sera pas contaminé par d'autres agents)
- 清晰的输出/输入合同(recevoir des notes de recherche, code de sortie)

### C'est le système réel.

**Claude Code subagents**- Quand Claude Code`Task`Il est également un agent de l'enfant avec une tâche de but.

**Devin**- 运行规划器代理、编码器代理 和浏览器代理──planner 将工作分为步骤──编码器 编写代码──浏览器 研究文档──每个都有独立的背景──

**Multi-agent coding teams (SWE-bench)**- Dans le cadre de la SWE-bench, le meilleur système utilisé par les chercheurs 读取 codebase, planner 设计修复方案, coder 实现修复──

**ChatGPT Deep Research**- et générer plusieurs agents de recherche, chacun explorer sous différents angles, puis compléter les résultats.

### L'écriture

Multi-agent n'est pas un choix de deux.

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

**Single agent**- Une boucle, une mise à jour.

**Subagents**- parents pour les sous-tâches de focalisation.

**Pipeline**- agents 按顺序运行──Agent A's输出成为 Agent B's输入──适合分阶段 workflows:research -> code -> review -> test──

**Team**- les agents à travers le bus de messages partagés 并行运行── chacun a un rôle──orchestre 负责协调── adaptés simultanément aux besoins de différentes compétences──

**Swarm**- Masse des mêmes ou presque identiques agents, état commun, absence d'orchestre fixe, agents, tâches de prise de vue dans la file d'attente, adaptation à des tâches de haute densité et de mise en œuvre.

### 4 types de modèles multi-agents

#### Modèle 1: Pipeline

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

Chaque agent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

#### Modèle 2: Fan-out / Fan-in

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

Le travail sera divisé en agents de répartition, puis le résultat sera combiné.

#### Modèle 3: Orchestreur-travailleur

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

Un orchestrateur intelligent décide de ce qu'il doit faire, enverra les ouvriers, et il obtiendra des résultats complets.

#### Modèle 4: Les pairs

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

没有中心管家──agents 以同行通信方式──决策从交互中涌现──更难调试,但可以扩展到大量的代理──

### 什么时候不要使用多代理

Multi-agent augmentera la complexité. Chaque message entre les agents est un point de défaillance potentiel. Déboguer.

**以下情况应保持 single-agent：**
- 任务能放进一个背景窗口(工作数据低于约100k代币)
- Vous n'avez pas besoin pour différentes étapes d'utiliser différentes instructions système
- 顺序执行已经足够快
- Les tâches sont assez simples, les dépenses dégagées sont plus importantes que la valeur.

**复杂性成本：**
- Chaque frontière d'agent est une fois compressée: le contexte complet de l'agent A sera résumé par le message de l'agent B
- La logique de coordination (qui fait quoi, quand fait quoi, selon le ordre de ce que fait) est elle-même source de bug.
- La latence augmente: N 个代理意味着至少 N 次串行LLM calls, si elles doivent revenir pour communiquer alors plus
- Coût: chaque agent a des jetons de consommation indépendants

經驗法: si une tâche est inférieure à 20 fois appel à l'outil, et peut mettre 100k jetons, garder un seul agent.


```figure
swarm-messages
```

## - Je le construis.

### Pas 1: Transporter un seul agent

Voici un seul agent de tout essayer de comprendre. Il a un énorme système de prompt, ainsi qu'une fenêtre contextuelle permettant de contenir des recherches, des codes et des critiques:

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

Ce type de pratique:
- La fenêtre de contexte se développe à chaque étape de la croissance.
- Le système rapide est généralisé.
- Il n'y a rien à faire.

### 步骤 2: Agents spécialisés

Maintenant, débranchez-le. Chaque agent est responsable d'une seule tâche.

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

Chaque spécialiste a un prompt de mise au point. Chacun a une fenêtre contextuelle propre, qui ne contient que les entrées dont il a besoin.

### 步骤 3: 通过 Messages 协调

Avec un message clair de passage, les spécialistes se connectent:

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

Chaque agent ne reçoit que ses propres messages. Il n'y a pas de pollution de contexte.

### Étape 4: Par rapport

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

Les différents types de logiciels sont utilisés dans le cadre de la mise en œuvre de la stratégie de gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de

## Utilisez-le

Le cours est créé avec un prompt réutilisable, pour décider quand utiliser un multi-agent.`outputs/prompt-multi-agent-decision.md`Il y a une autre.

## 练习

1. 添加第四个专家: un agent "tester", il reçoit du codeur 接收代码,并从评论员 接收评论反, puis rédiger des tests
2. Modifier le pipeline, laisser le critique peut donner des commentaires  envoyer de nouveau coder, former une boucle de révision ((最多 2 轮)
3. Pour le coder, il faut faire une mise en œuvre de la méthode de production de l'équipement.

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

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- modèles multi-agents 综述
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- Le cadre de conversation multi-agents de Microsoft
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- Code Claude  comment utiliser la tâche  effectuer des tâches
- [CrewAI documentation](https://docs.crewai.com/)- cadre multi-agents fondé sur les rôles
