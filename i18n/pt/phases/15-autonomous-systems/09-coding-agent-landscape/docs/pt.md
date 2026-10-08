# Agente de codificação autônoma 版图(2026)

> SWE-bench Verified em não menos de três anos de 4%  elevação para 80,9%。 o mesmo Claude Sonnet 4.5 em SWE-agent v1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

**类型：**- aprendizagem
**语言：**Python(stdlib,CodeAct vs JSON ferramenta-chamada (para comparar)
**先修要求：**Fase 14 · 07(uso de ferramentas),Fase 15 · 01(agentes de longo horizonte)
**时间：**Cerca de 45 minutos

## 问题

A questão verdadeira é: em uma distribuição de tarefas que corresponde ao meu trabalho, usando um andaime que eu vou operar na produção, como posso obter a confiabilidade de fim em fim?

Entre 2022 e 2026, este campo reconhece o equilíbrio  retorno de camadas  planejador  sandbox  edit-verificar loop  feedback format  é suportar a estrutura  Claude Sonnet 4.5  SWE-bench verificado em SWE-agent v1  Verificado  得分 é 43,2%; o mesmo modelo colocado no equilíbrio autônomo de Cline                                                                                                                                                                                                              

伴随着的问题是基准 和会掩盖退步──SWE-bench Verified 已接近和,而易任务尾(500 个任务中有161 个只需要 ≤2 行) 会拉高顶部分数──真实世界质量更适合在SWE-bench Pro(10+ 行修改)

## 概念

### Usage of understanding SWE-bench

SWE-bench(Jimenez et al.) seleção com patches de verdade baseadas em problemas do GitHub,并要求代理 生成一个补丁,让测试套件通过──SWE-bench Verified(OpenAI,2024) é um conjunto de 500 missões selecionadas artificialmente, removeu含糊和损坏的任务──SWE-bench Pro 是更难的后后版本  任务要求 10+ 行修改, atuais agentes fronteiriços obtêm uma divisão de 2359%──

### 2022 → 2026 曲线真正说明了什么

- **2022**Modelos de investigação:
- **2024**:GPT-4 + andamios de estilo Devin  14%;SWE-agente  12%──
- **2025**O Sonnet em Aider e SWE-agent é de 40 55% 区间──
- **2026**O que é que é o resultado?

Esta tendência vem de três superposição: melhor modelo de base, melhor andamento, melhor esquadrão, melhor código, melhor reflexo, melhor verificação, melhor referência, melhor verificação, melhor eliminação do ruído.

### CodeAct vs JSON 工具调用

OpenHands(All-Hands-AI,arXiv:2407.16741, antev. para OpenDevin) fez uma aposta de uma estrutura específica: não fazer o modelo ser emitido por um host 解码并执行 JSON tool calls, mas fazer o modelo ser emitido Python code,并由 Jupyter-style kernel 在沙盒中运行──它代理可以在一个行动内遍历文件、串联工具,并捕获自己的例外──

权衡如下:

- **JSON tool calls**Cada ação é uma vez; fácil de auditoria; composicionalidade limitada; mais segura, porque cada chamada é feita por um validador.
- **CodeAct**Uma ação pode ser um programa inteiro; possuir composicionalidade; precisar de caixa de areia endurecida(OpenHands usar Docker isolamento); modos de falha incluindo sandbox runtime 允许的任何行为。

两种架构都已用于生产──CodeAct在开放平台中占主导(OpenHands、smolagents)──JSON tool calls 在管理服务中仍占主导(Anthropic Managed Agents、OpenAI Assistants),因为 provedor 控制执行者──

### 2026 版图中的 ascafolds

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### Por que andaimes ?

Uma corrida de codificação é uma trajetória de longo horizonte.

1. **Retrieval**O índice de arquivos do ACI, OpenHands e o repo-map do Aider estão resolvendo este problema.
2. **Verifier loop**Teste de execução, pistas de pilhas, tentativa de novo, no banco SWE, pode trazer 10+ diferências.
3. **Failure containment**O que é um produto de segurança?

### Indicador de referência 和与真实分布

OpenHands Autor y Epoch AI indicaram que o banco SWE Verified existência de uma cauda fácil: 500 个任务中有 161 个只需要12 行修改。高分部分由这个尾 驱动。 O banco SWE Pro 限为10+ 行修改, mesmo em sistemas fronteiriços,分数也只有2359%── sua distribuição de produção quase definitivamente mais próxima do Pro, não verificada。

选择代理的含义是: em seu próprio backlog de bugs 上运行一个类似 Pro 的子集──真正重要的分数, é a porcentagem de tarefas que representa sua entrega real de conteúdo──


```figure
a5-scaffold-delta
```

## Use-o

`code/main.py`Em uma distribuição de mini-tarefa fixa, compare dois andares de agentes de brinquedos:

1. Um .**JSON tool-call**Equipamento, cada vez que se virar, tome uma ação.
2. Um .**CodeAct**Equipamento, cada ação pode ser enviada para um pequeno fragmento de Python.

两者都使用 stub model(reguelas deterministas), portanto, comparar vai colocar o andaime com o modelo质量隔离――输见显示 CodeAct andaime Use更少转 解决更多任务,代价是每个动作的爆炸半径更大――

## Entrega-o

`outputs/skill-scaffold-audit.md` ajudar-vos a adoptar o esquadrão de agentes de codificação proposto  antes de realizar uma auditoria: qualidade de recuperação, presença de verificadores, isolamento de caixa de areia e adequação de referência à distribuição

## 练习

1. 运行 `code/main.py` Em um mesmo conjunto de tarefas, cada andamio necessita de quantas voltas?

2. 阅读OpenHands paper(arXiv:2407.16741)。 O artigo 认为 CodeAct 在复杂任务上优于JSON tool calls──找出纸 承认一个失败模式,并写一句说明该模式 什么时候会在生产中占占主导──

3. De seu backlog de bugs 中选择一个需要跨两个文件 修改 10+ 行的任务──估计边界模型 在 (a) JSON tool calls 和 (b) CodeAct 下的端到端成功概率──说明差距的理由──

4. SWE-bench Verificado há 161  single-file 12 行任务──construir uma eliminação deles 分数──leaderboard 会如何重新排序?

5. 阅读 Introdução de SWE-bench Verified(OpenAI) ――explicação utilizada para a remoção de tarefas ambíguas metodologia específica,并说出一种策略 会漏掉的类别──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) Ori­ginal referência 和 metodologia¬¬
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) subconjunto curado é como construir de
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和事件流 设计──
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的分数──
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) enquadramento de confiabilidade de agentes de codificação de longo horizonte。
