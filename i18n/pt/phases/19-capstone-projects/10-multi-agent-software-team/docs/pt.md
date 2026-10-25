# Capstone 10  Equipa de engenharia de software multi-agente

> A construção de fábrica da SWE-AF  MetaGPT  Impulsão baseada em papéis  AutoGen 0.4  Tipo de ator gráfico  Cognition  Devin, bem como os Droids da Fábrica, todos em 2026 recebidos alcançaram a mesma forma: arquiteto  responsável por planejar, N                                                                                                                                                                                                                                                                                                                                                                                                                                                 

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

## 问题
Agenta única de codificação de artifícios em tarefas grandes vai encontrar um limite. Causa não é qualquer agente único  muito fraco, mas sim contexto de 200k-Token  não pode simultaneamente aceitar o plano de arquitetura  4 slices de código base comentários de revisor output de teste.

A superfície de falha é a entrega. Arquiteto planejou os codificadores. Não conseguiram realizar o conteúdo. Os codificadores geraram conflitos entre si. Revisor aprovou uma solução alucinante. O testeiro e o codificador ainda em inscrição.

## 概念
Os papéis são agentes tipografados.**Architect**(Claude Opus 4.7) 读取 issue,编写计划,并将其分为带有显式界面的子任务――**Coders**(Claude Sonnet 4.7, N 个并行实例, cada instante em um `git worktree`+ Daytona sandbox 中) 独立实现 subtasks。**Reviewer**(GPT-5.4) 读取合并后的差异,并批准或请求具体修改──**Tester**(Gemini 2.5 Pro) 在隔离环境中运行测试套件,并使用文物 报告通过/失败──

通信通過共享タスクボード (→ "Comunicação através de uma tarefa de trabalho") 文件支持或 Redis) 完成──每个角色 消费它被允许处理的任务──Handoffs é A2A-protocol-type messages──协调问题包括:merge-conflict resolution (Rolo de coordenador ou automática de fusão tridimensional) ‧shared-state synchronization (Codeadores 开始后计划 被结;replans 是独立事件),以及 reviewers gatekeeping (Gate-keeping) ‧reviewer 不能批准它自己做出的改进或它提出的改进) ‧

A amplificação de tokens é um custo oculto. Cada limite de papel aumenta os pedidos de resumo e o contexto de entrega. Uma execução de um único agente de 40 voltas irá se transformar em 160 voltas totais de quatro roles.

## Arquitetura
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术
- Orquestração: LangGraph com estado compartilhado + subgrafos por agente
- Mensagens: Protocolo A2A (Google 2025) para mensagens entre agentes digitadas
- Modelos: Opus 4.7 (arquiteto), Sonnet 4.7 (códeros), GPT-5.4 (revisor), Gemini 2.5 Pro (tester)
- Isolamento de árvores de trabalho: `git worktree add`por codificador + caixa de areia Daytona
- Coordenador de fusão: fusão trilateral personalizada + resolução de conflitos mediada pela MLL
- Eval: SWE-bench Pro (50 edições), cenários SWE-AF, HumanEval++ para testes unitários
- Observabilidade: Langfuse com intervalos de roteiros, contabilidade de tokens por agente
- Deployment: K8s, cada papel 一个独立 Deployment,并基于后后集 配置 HPA


```figure
ce-team-handoff
```

## Construí-lo
1. **Task board.**JSONL com arquivo apoiado, contém mensagens digitalizadas:`plan_request`- Não.`subtask`- Não.`diff_ready`- Não.`review_needed`- Não.`test_needed`- Não.`approved`- Não.`rejected`- Não.`replan_needed`Agentes 订阅 tags

2. **Architect.**读取 GitHub issue, using带有计划模板的 Opus 4.7, requiring apparent subtask interfaces(触及的文件、公共功能、测试影响) ――发出一个包含 subtasks DAG 的`plan_request`- Não.

3. **Coders.**N 个并行 trabalhadores, cada trabalhador do conselho Central reivindicar uma subtarefa.`git worktree add`Branch 和一个Daytona sandbox──实现子任务──发发出带有补丁 + test deltas 的 `diff_ready`- Não.

4. **Merge coordinator.**Quando todos os programadores 完成后,将 N 个分公司 通过三向合并 合并到阶段分公司.

5. **Reviewer.**GPT-5.4 读取合并后的差异──不能批准它自己编写的差异──发出 `approved`(no-op) ou com pedidos de alteração concretos `review_feedback`,并路由回相关编码器──

6. **Tester.**Gemini 2.5 Pro está em sandbox de limpeza.`test_passed`Ou `test_failed`◊ teste de fracassos loop de volta até a possuir o código de subtarefa fracassado ◊

7. **Handoff accounting.**Cada linha atravessa o limite de papel de mensagem em Langfuse obtém um espaço, registra o tamanho da carga útil e o modelo de uso.

8. **Eval.**Em 50 SWE-bench Pro issues 上运行──将 pass@1 和 $-per-solved-issue Com base de um único agente(a Sonnet 4.7, em um único worktree) Compare。

9. **Post-mortem.**Para cada problema de falha, identifique o resultado de falha de entrega: plano muito vago, conflitos de fusão, falha de aprovação do revisor, falha do testeiro, gerando um histograma de falha de entrega.

## Use-o
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## Entrega-o
`outputs/skill-multi-agent-team.md`É entregue. Foi dado um problema URL e nível de paralelismo, este grupo gerará um PR pronto para fusão, e fornecerá contabilidade de tokens por papel.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## 练习
1. No meio do caminho para a diferença , entra em um erro evidente .`return None`)。 taxa de falsa aprovação do revisor de medidas。调优 revisor prompt, até que a falsa aprovação 低于5%。

2.  reduzir para dois programadores(arquiteto + 两个编码器 + revisor + tester, cada um 顺序运行两个子任务) ――

3. Utilize restrição de um único escritor  substituir coordenador de fusão  subtarefas 触及不相交的文件集) 测量建筑师的规划负担──

4. O GPT-5.4 foi substituído por Claude Opus 4.7 (Rate of False Approval) e o token cost delta (Delta).

5. 添加第五个角色:documenter (Haiku 4.5) ・ review 之后,它会产生变更日志 entry──衡量文件质量 是否值额外的代币支出──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) Realizamento de referência da fábrica de agentes múltiplos em 2026
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) Framework multi-agente baseado em funções
- [AutoGen v0.4](https://github.com/microsoft/autogen) Framework de atores digitais da Microsoft
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai)  Outro tipo de produto de referência
- [Google A2A protocol](https://developers.google.com/agent-to-agent) Especificações de mensagens entre agentes
- [git worktree documentation](https://git-scm.com/docs/git-worktree) Substrato de isolamento
- [SWE-bench Pro](https://www.swebench.com) Objetivo de avaliação
