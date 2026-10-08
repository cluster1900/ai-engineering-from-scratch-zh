# Capstone 10  Équipe d'ingénierie logicielle multi-agents

> L'architecte responsable de la planification, des codeurs en train de travailler dans des arbres de travail, l'examenateur responsable de la porte, le testeur responsable de l'évaluation, les arbres de travail, la transformation du mur en un débit de partage de données et des protocoles de délivrance, est devenu une surface d'échec.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

##  problématique
 Les utilisateurs de codeurs d'agents différents rencontrent des limites dans les grandes tâches.  La raison n'est pas qu'un seul agent  est faible, mais un contexte de 200k-Token  ne peut pas supporter simultanément un plan d'architecture  4 et même parties de code  commentaires et sorties de test  Les usines multi-agents  seront divisées en plusieurs parties: architecte  responsable du plan, codeur  responsable de la réalisation, réviseur  responsable de la mise en œuvre, testeur  responsable de la vérification  l'architecture "factorielle" de SWE-AF  les rôles de MetaGPT  le graphique d'acteurs typié d'AutoGen, ces trois types de cadres décrivent le même état de fait.

L'architecte a planifié des codeurs  incapables de réaliser le contenu。 Les codeurs  génèrent des conflits entre eux。 Le critiqueur  a approuvé une solution hallucinée。 Le testeur et le codeur toujours en cours d'écriture  ont fait une course。 Vous allez construire une équipe de ce type, dans 50 éditions SWE-bench Pro 上运行它, suivre chaque fois que vous faites une délivrance,并发布后死em。

## 概念
Les rôles sont des agents de type.**Architect**(Claude Opus 4.7) 读取 issue,编写计划,并将其分为带有显式界面的子任务──**Coders**(Claude Sonnet 4.7, N 个并行实例, chaque instance dans un `git worktree`+ Daytona sandbox 中) 独立实现子任务──**Reviewer**(GPT-5.4) 读取合并后的差异,并批准或请求具体修改──**Tester**(Gemini 2.5 Pro) Dans une suite de tests de fonctionnement dans un environnement isolé, il n'utilise pas d'objets

通信通過共享タスクボード ([[fichier-backed-or Redis]])完成──每个角色 消费它被允许处理的任务──Handoffs sont des messages de type A2A-protocol──协调问题包括:

L'amplification des jetons est un coût caché. Chaque limite de rôle augmente les commentaires et le contexte de remise. Une course à 40 tours à un seul agent se transforme en 160 tours de quatre rôles.

## 架构
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
- Orchestration: LangGraph avec état partagé + sous-graphes par agent
- Messagerie: protocole A2A (Google 2025) pour les messages entre agents typés
- Modèles: Opus 4.7 (architecte), Sonnet 4.7 (codeur), GPT-5.4 (réviseur), Gemini 2.5 Pro (testeur)
- Isolement des arbres de travail: `git worktree add`par codeur + sable de Daytona
- Coordinateur de fusion: fusion trilatérale sur mesure + résolution de conflits médiée par la LLM
- Eval: SWE-bench Pro (50 éditions), scénarios SWE-AF, HumanEval++ pour les essais unitaires
- Observabilité: Langfuse avec des délais de roulement, comptabilité des jetons par agent
- Déploiement: K8s, chaque rôle, un déploiement indépendant,并 basé sur le backlog  configurer HPA


```figure
ce-team-handoff
```

## - Je le construis.
1. **Task board.**JSONL avec support de fichier, contenant des messages typés:`plan_request`- Je suis là.`subtask`- Je suis là.`diff_ready`- Je suis là.`review_needed`- Je suis là.`test_needed`- Je suis là.`approved`- Je suis là.`rejected`- Je suis là.`replan_needed` Agents 订阅 tags

2. **Architect.**读取 GitHub issue, using带有计划模板的 Opus 4.7, exige des interfaces de sous-tâches apparentes(触及的文件、公共功能、测试影响)`plan_request`Il y a une autre.

3. **Coders.**N 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 `git worktree add`Une branche et une sable de Daytona, réaliser la sous-tâche, émettre un patch + test delta.`diff_ready`Il y a une autre.

4. **Merge coordinator.**Lorsque tous les codeurs 完成后,将 N 个分支 通过三向合并 合并到阶段分支 ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎

5. **Reviewer.**GPT-5.4 读取合并后的差异──不能批准它自己编写的差异──发出 `approved`(no-op) ou avec des demandes de changement spécifiques `review_feedback`,并路由回相关编码器──

6. **Tester.**Gemini 2.5 Pro dans une boîte à sable propre`test_passed`Ou `test_failed`◊ Les tests de défaillance se retournent vers le codeur de posséder une sous-tâche de défaillance.

7. **Handoff accounting.**Chaque message traversant les frontières de rôle dans Langfuse obtient une durée, un modèle de chargement et de l'utilisation.

8. **Eval.**Dans 50 éditions de SWE-bench Pro, il sera passé@1 et $-par-émission résolue avec une base d'agent unique, dans une Sonnet 4.7, dans un seul arbre de travail, comparison:

9. **Post-mortem.**Pour chaque problème de défaillance, identifier les manœuvres de défaillance: plan trop vague, conflit de fusion, faux approbation du critique, défaillance du testeur, générer un histogramme de manœuvre de défaillance.

## Utilisez-le
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

## Je le livre.
`outputs/skill-multi-agent-team.md`Il est livrable. Il est donné un problème URL et niveau de parallélisme, ce groupe générera un PR prêt à fusion, et fournit par rôle de la comptabilité des jetons.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## 练习
1. En route vers la différence, il y a un bug visible.`return None`)。 taux de fausse approbation de l'examenneur de la mesure―调优 examen rapide, jusqu'à ce que la fausse approbation soit inférieure à 5%―

2. 减少到两个编码器 (architecte +编码器 + réviseur + testeur,编码器 顺序运行两个子任务) ⋅ comparer avec un mur-horloge 和 un taux de réussite⋅

3. Utiliser la contrainte de compositeur unique 替换 merge coordinator ️ sous-tâches 触及不相交的文件集) ️ Charge de planification de l'architecte de mesure ️

4. Il est également possible de modifier le taux de fausse approbation et de détecter les coûts des jetons.

5. 添加第五个角色:documenter (Haiku 4.5) ・review 之后, il générera une entrée de changelog。 Mesurer la qualité de la documentation

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
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) Réalisation de la référence de l'usine multi-agents de 2026
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) Un cadre multi-agents basé sur le rôle
- [AutoGen v0.4](https://github.com/microsoft/autogen) Le cadre d'acteurs de type de Microsoft
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai)  autre type de produit de référence
- [Google A2A protocol](https://developers.google.com/agent-to-agent) spécifications de messagerie interagentes
- [git worktree documentation](https://git-scm.com/docs/git-worktree) substrat d'isolation
- [SWE-bench Pro](https://www.swebench.com) Objectif d'évaluation
