# Modelo de supervisor / orquestrador-trabalhador

> Um agente principal 负责规划和委派; especialistas em execução 并回报结果在并行背景中. É o padrão de trás do sistema de pesquisa antropópica.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 问题

A pesquisa é uma tarefa típica dos sistemas de agente único que falharão. Você pergunta: que mudança aconteceu entre os sistemas de agentes múltiplos de 2023 a 2026?

O padrão de supervisor reformou este ponto: um agente principal  planejar pesquisa, enviar cada sub-question comitá-la a um trabalhador, e então realizar a síntese  Cada trabalhador tem um problema estreito para obter sua própria janela de 200k-Token  Lead  nunca verá os trabalhos brutos  apenas ver resumos de trabalhadores 

O sistema de pesquisa de produção de Antropic  relatório称, em avaliações internas 上相比单一Opus 4 提升 +90.2%──同一篇文章指出,BrowseComp 方差的80% 仅由 *Token usage alone* 解释──每个 subagent 拥有新文脈是主要机制──

## 概念

### Este padrão

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

Lider 永远不读原材料── Trabalhadores na síntese de chumbo 之前永远不会见彼此的工作── cada arco é uma entrega de artefactos estreitos──

### Por que é que funciona?

Três mecanismos:

1. **每个 subagent 都有 fresh context。**Explore Fipa-ACL herança Trabalhador não vai levar o chumbo no planejamento de consumo de 40k Tokens── ela obtém uma janela de 200k para resolver um problema──
2. **通过 prompt 实现 specialization。**O impulso de liderança é a decompor e sintetizar, não é a pesquisa.
3. **Parallelism。**Trabalhadores não estão em funcionamento.`max(worker_times) + plan + synthesis`- Não .`sum(worker_times)`- Não.

### Lições de engenharia (Antropic 2025)

Anthropic 文章 listens several articles till 2026 year still relevant production lessons:

- **Scale effort to query complexity.**简单查询:一个代理,3-10次工具调用──复杂查询:10+ agentes──必须由领袖估计这一点,而不是调用者──
- **Broad then narrow.**Primeiro, se dividir em sub-questions amplas, então, em resposta, cada sub-question precisa de profundidade para gerar mais trabalhadores.
- **Rainbow deployments.**Agentes é de longa duração 且州的──传统蓝绿不适用──Antropic 使用 rainbow:逐步推出 新版本,同时让旧版本排水──
- **Token usage dominates.**Multi-agente 大约是单代理的15倍 Tokens──只有当任务值 足以证明成本合理时才运行它──

### LangGraph 转向

O LangGraph publicou um primeiro volume .`create_supervisor`assistente de `langgraph-supervisor`Biblioteca──2025 ano, LangChain vai recomendar a prática de mudar para através de ferramentas chamando 直接实现 supervisor pattern, pois ferramentas chamando 能更好地控制 *supervisor vê o que*(context engineering)── esta biblioteca 仍然可用;doc 现在推工具调用形式──

### Modos de falha

- **Lead hallucinates the plan.**Se as subquestions geradas não resolverem os problemas reais, os trabalhadores irão fazer pesquisas precisas com um objetivo errado.
- **Workers over-explore.**Se não houver limites de âmbito definidos, os trabalhadores vão desviar-se para a subquestionamento, e não contaminar a fase de síntese.
- **Synthesis conflicts.** dois trabalhadores  retornar a fatos contraditórios entre si Líder   deve fazer novas perguntas  aumentar uma rodada  ou 明确标注分歧  silenciar escolher um dos piores falhos: o usuário nunca sabe que ocorreram 分歧

### O supervisor é um erro de escolha .

- **Sequential tasks.**Se o passo 2 确实需要步骤 1的输出,parallelism 没有收益──使用管 line () CrewAI Sequential、LangGraph linear graph) 
- **Simple queries.**O único agente  processá-los mais rápido e mais barato  inspecção  em escala de esforço  de trabalho  de produção  de trabalhadores  de uso de leads 
- **Strict determinism.**Supervisor utiliza delegação selecionada pelo LLM.


```figure
supervisor-hierarchy
```

## Construí-lo

`code/main.py`Utilização `threading` implementar um supervisor de três trabalhadores                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

关键结构:

- `Lead.plan(query)`A consulta será dividida em três sub-questions.
- `Worker.run(sub_q)`返回一个假摘要 (((在生产中可以是任何工具使用代理) ]]
- `Lead.run(query)`Em linha, inicia os trabalhadores, junte-se, depois sintese.

运行:

```
python3 code/main.py
```

Output 会展示计划、带起/末时刻的并行工人痕迹,以及最终合成── você pode ver o relógio de parede 收益:三个 0.3秒工人在约0.35秒内完成,而不是0.9秒──

## Use-o

`outputs/skill-supervisor-designer.md`接收一个用户查询,并产出监督模式设计:lead system prompt、工人角色、subquestion decomposition rules,以及合成模板──在构建新的研究风格代理系统 前使用它──

##  Publicá-lo

Patrão de supervisor da deposição Lista de verificação anterior:

- **Model pairing.**O modelo de nível de raciocínio é o modelo de classe Opus`o3`classe) ――Trabalhadores Utilize更快、更便宜的模型(Sonet、`o4-mini`)。
- **Worker timeout.**Qualquer trabalhador com tempo de execução superior a 2x a média será morto; o líder deve continuar sem o seu tempo de trabalho.
- **Token cap per worker.**Limite duro (por exemplo, 10x entrada de síntese esperada) para evitar o trabalhador fugitivo 爆预算。
- **Observability.**Trace lead's plan ̇ cada trabalhador de ferramentas chamadas, bem como síntese ̇ é a base de qualquer pós-hoc debug ̇
- **Rainbow rollout.**Agentes de longa data de estado precisam de transição de versão passo a passo, em vez de troca de calor.

## 练习

1. 运行 `code/main.py`Depois, modifique o chumbo, para que produzam 5 trabalhadores em vez de 3... observe o efeito do relógio de parede... nesta demonstração, a contagem dos trabalhadores até que horas a despesa sobre a produção excederá as economias paralelas?
2. 实现 worker timeout:kill 任何运行超过0.5秒的 worker,并让 lead synthesis 剩余结果──你需要什么可观察性才能知道某工被切断? 实现 worker timeout:kill 任何运行超过0.5秒的 worker,并让 lead synthesis 剩余结果──你需要什么可观察性才能知道某工被切断?
3. 给领的综合 添加冲突检测步骤: Se dois trabalhadores 返回相互矛盾的答案, lead 标注分歧, em vez de escolher um dos dois, não é necessário usar LLM 时, como você pode verificar a contradição?
4. 阅读Antropic's Research-system engineering post──列出This toy demo                                                                                                                                                                                                                                                      
5. Comparar LangGraph com`create_supervisor`(legacia) e a nova recomendação de chamada de ferramentas. O supervisor pode ver o que?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | “Lead agent” | 一个 orchestrator agent，负责规划、委派和 synthesis。它不亲自执行工作。 |
| Worker | “Subagent” | 由 supervisor 以狭窄 scope 调用的 focused agent，并拥有自己的 context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一件事，不同名称。2026 文献两种说法都会使用。 |
| Fresh context | “Clean window” | Worker 的 context 从它的 system prompt 和分配的问题开始，而不是 lead 的 history。 |
| Rainbow deployment | “Gradual rollout” | Long-running stateful agents 需要 versioned drain-and-replace，而不是 blue-green。 |
| Token dominance | “Context is the variable” | 根据 Anthropic，research-eval 方差的 80% 来自使用的总 Tokens，而不是 model choice。 |
| Scale effort | “Match agent count to complexity” | Lead 估算 query 难度，并据此生成 1 个或 10+ workers。 |
| Synthesis conflict | “Workers disagree” | 两个 workers 返回互相矛盾的 facts；lead 必须暴露分歧，而不是默默选择一方。 |

## 延伸阅读
- [Anthropic engineering — 我们如何构建 multi-agent 研究系统](https://www.anthropic.com/engineering/multi-agent-research-system) Modelo de supervisão de referência de produção
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Supervisor de chamada de ferramentas 现在是推形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) assistente legado, produção de 2026
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents)  baseado em transferência de supervisor 变体
