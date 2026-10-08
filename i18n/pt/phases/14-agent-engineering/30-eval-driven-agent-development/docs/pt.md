# Eval 驱动的代理 开发

> A orientação antropológica: Começa com um simples prompt, com uma avaliação integral para otimizá-los, e apenas quando necessário adicionar vários passos ao sistema. A avaliação não é o último passo.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## Objectivo de aprendizagem
- Explicar três níveis de avaliação:
- 解释评价者-optimizer 紧密循环──
- Descrição das melhores práticas para 2026:evals e code put together, in CI 中运行,并作为 PR gateways──
- Cada aula da Fase 14 está ligada ao caso de avaliação que gerou.

## 问题
Os agentes podem passar por demonstrações. Eles falham na produção de forma improvável. Os padrões respondem que o modelo tem uma capacidade ampla?

## 概念
### Três níveis de avaliação

1. **Static benchmarks** Utilizado para código de SWE-bench Verificado(Lessão 19) 、 para browsing / 桌面的 WebArena/OSWorld(Lessão 20) 、 para GAIA generalista(Lessão 19) 、 para uso de ferramentas de BFCL V4(Lessão 06)  Para usar através de modelos comparativos e de regressão por portas。 contaminação é real existência:SWE-bench+ 发现 32.67% de solução fugação。始终报告 Verificado / +-auditado 分数。

2. **Custom offline evals** Seu produto forma:
   - LLM como juiz ((Langfuse、Fenix、Opik  Lição 24)。
   - Execução baseada em patch, check check test)
   - Baseada em trajetória, ações de sequências de ação em relação ao ouro, OSWorld-Human mostram os principais agentes de ouro em 1.4-2.7x)

3. **Online evals** 生产:
   - Repetições de sessão (Langfuse)
   - Guardrail 触发的告警(Lessão 16、21)
   - 单步成本 / 延迟跟踪 (Lessão 23 é uma lição de tempo)

### Otimizador de avaliação (Antropic)

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

1. Proponente 生成输出──
2. Avalador  fazer a avaliação¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
3. Refinar até que o avaliador passe.

É o auto-refinamento de uma forma geral. Leção 05.

### 2026 melhores práticas

- Evals e código colocados juntos.
- Em cada PR, através de CI 运行.
-  Baseado em pontuações de avaliação, a porta se funde, por exemplo,  relativa à principal não permite regressão > 5%)
- Cada guarda está em um caso de avaliação.
- Cada regra de aprendizagem (Reflexão, regra de aprendizagem pro-fluxo de trabalho) é um caso de falha.

### Vai fazer a fase 14

Cada aula da fase 14 gerará casos de avaliação:

| Lesson | 它生成的 Eval case |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted、infinite-loop guard |
| 02 ReWOO | 当 tool 失败时，Planner 能正确 replans |
| 03 Reflexion | 学到的 reflections 会在 retry 时应用 |
| 05 Self-Refine/CRITIC | Judge 通过 refined output |
| 06 Tool Use | Argument coercion 生效；unknown tools 被拒绝 |
| 07-10 Memory | Retrieval citations 与 sources 匹配；stale facts 失效 |
| 12 Workflow Patterns | 每种 pattern 都产生正确输出 |
| 13 LangGraph | Resume 精确复现 state |
| 14 AutoGen Actors | DLQ 捕获 crashed handlers |
| 16 OpenAI Agents SDK | Guardrail 在正确输入上触发 |
| 17 Claude Agent SDK | Subagent results 返回 orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score、WebArena success rate、OSWorld efficiency |
| 21 Computer Use | Per-step safety 捕获 injected DOM |
| 23 OTel | Spans 发出 required attributes |
| 26 Failure Modes | Detectors 标记 known failures |
| 27 Prompt Injection | PVE 拒绝 poisoned retrievals |
| 28 Orchestration | Supervisor 路由到正确 specialist |
| 29 Runtime Shapes | DLQ 处理 N% failure |

Se a sua suite de avaliação cobre cada um dos itens, já cobriu a Fase 14.

### Eval  Drive Development Conference em que falha

- **没有 baseline。**没有最后知名好的 evals 无法解读──储存基线──
- **LLM-judge 没有 grounding。**Jueiros também vão alucinar. Patrão CRITICO. Lição 05: Jue os juízes com base em ferramentas externas.
- **过拟合 evals。**Para avaliar a melhor utilização da produção, os casos de reversão são:
- **Flaky evals。**Casos de incerteza causarão falsos alarmes.


```figure
ae-eval-three-layers
```

## Construí-lo
`code/main.py`É um arsenal de avaliação de dados:

- 带 categorias de casos (referência, costumes, on-line)
- Um agente com guião em teste.
- Localização do avaliador-optimizador: propor, julgar, refinar até passar ou atingir as rodadas máximas.
- Portão CI: taxa de passagem de汇总 + com a regressão da linha de base.

- Não .

```
python3 code/main.py
```

输出: cada caso de passagem/falha, bandeira de regressão, veredicto da porta CI.

## Use-o
- Em repo de análises com o código do agente, escrever casos de avaliação.
-  através de CI em cada PR 
- Em regressão, deixe construir o fracasso.
- A taxa de aprovação varia com o tempo.
- Cada falha de produção está ligada a um novo caso.

## Entrega-o
`outputs/skill-eval-suite.md`Para um produto agente construir três níveis de avaliação, contendo portões CI e rastreamento de regressão.

## 练习
1. Tome um dos seus falhas de produção... escreva um caso de avaliação que possa ser reproduzido... o seu agente pode passar agora?
2. Para o seu domínio, construir uma rubrica de juízes de LLM que contenha três dimensões (factual, tone, scope) e 50 sessões.
3. A avaliação de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados
4. Adicione métrica de trajetória-eficácia: agente Comparado com a trajetória do ouro 走过多少步?
5. Mapear cada aula da Fase 14 em um caso de avaliação da sua suite.

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Static benchmark | “Off-the-shelf eval” | SWE-bench、GAIA、AgentBench、WebArena、OSWorld |
| Custom offline eval | “Domain eval” | 面向你的产品形态的 LLM-as-judge / exec / trajectory |
| Online eval | “Production eval” | Session replay、guardrail alerts、cost/latency tracking |
| Evaluator-optimizer | “Propose-judge-refine” | 迭代直到 judge 通过 |
| CI gate | “Merge blocker” | 在 eval regression 时让 build 失败 |
| Baseline | “Last-known-good” | 用于检测 regression 的 reference score |
| Trajectory efficiency | “Steps over gold” | Agent step count 除以 human expert minimum |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)   desde simples começando, usando avaliações   optimização 
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选 referência
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) Indicador de referência de utilização de ferramentas
- [Langfuse docs](https://langfuse.com/) 实践中的 evals + replay de sessão
