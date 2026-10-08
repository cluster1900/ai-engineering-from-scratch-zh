# Capstone 05  Agent de recherche autonome 类)

> L'AI-Scientist-v2 de Sakana a publié un article complet. L'Agent Laboratory a réalisé une expérience. Allen AI a partagé des traces. La forme de l'année 2026 consiste à effectuer une recherche d'arbre sur l'expérience, avec un budget coûteux, une mise en œuvre de code, un rédacteur de vision, ainsi qu'un ensemble d'experts de style NeurIPS automatisé. Cette pierre angulaire est la construction d'un système comme celui-ci, à 30 $ par article, en fonctionnement de bout en bout, et à travers Sakana.

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:**P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 小时

##  problématique
L'agence de recherche autonome de Sakana AI-Scientist-v2 a été publiée sur Nature, les articles générés ont été examinés par des experts de l'atelier ShinkaEvolve (ICLR 2026) vont se développer dans cette direction jusqu'à l'hypothèse de développement.

Vous allez passer dans un domaine étroit pour réaliser un agent comme celui-ci pour apprendre ce cycle (par exemple, dans 100M 参数 Transformer)  faire une ablation de la rareté de l'attention (attention)  la valeur ne dépend pas de la première utilisation pour trouver quelque chose de nouveau  la valeur dépend de l'infrastructure: recherche d'arbre  expérience de sable  cycle de réviseur  rapport de l'équipe rouge  L'équipe de Sakana a enregistré l'échec de sable  votre agent  doit passer par la même équipe rouge 

## 概念
Cet agent est une recherche d'arbre de premier ordre. Le résultat est de la fonction de notation, selon la nouveauté × qualité × budget restant) pour les étapes de la séquence.

Le rédacteur est Multimodal de. Il génère un projet de LaTeX, une version complète de la figure de la version, et le PDF de la version de la version 4.7 de Claude Opus, pour une mise en page critique, une image lisible, ainsi que l'alignement des preuves de revendications.

La sécurité est une structure lourde. Chaque expérience est réalisée sans sortie de réseau, avec des horloges murales limitées, avec des ressources fixes limitées, en E2B ou dans la boîte à sable de Daytona.

## 架构
```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 技术
- Orchestration: avec un point de contrôle et une porte d'homologation
- Recherche d'arbre: basée sur le nœud d'expérience de la définition de soi-même le meilleur-première( provenant de Sakana v2 de style AB-MCTS)
- Sandbox: chaque expérience un E2B, Docker-in-Docker rechute; par cgroups 施加资源 cap
- L'écriture: API de graphes sémantiques + OpenAlex + 本地 FAISS cache abstrait
- Rédacteur: Template LaTeX + Claude Opus 4.7
- Réviseur: 5 个评审的组合(Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max), avec aggregation pondérée
- Cadre d'expérience: utilisé pour l'expérience physique PyTorch 2.5, W&B utilisé pour la logging
- Observabilité: Langfuse utilisé pour la trace d'agent, pour chaque article 30 $ 硬


```figure
ce-experiment-tree
```

## - Je le construis.
1. **Seed and domain scoping.**选取一个种子想法 (exemple: investigate sparsity patterns in attention maps of sub-1B transformers)

2. **Literature pass.**查询 Semantic Scholar + OpenAlex 中最相关且引用最多的 50 篇论文;本地缓存摘要;生成 1 页域名消化──

3. **Tree scaffolding.**Utiliser l'hypothèse de semence initiale racine.`expand(node) -> children`, avec une petite proposition de modification , chaque enfant , un changement de configuration)`score(node)`实现为加权的新奇 × qualité × budget 项──

4. **Sandbox wrapping.**Chaque expérience fonctionne .`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(ou même prix de la politique E2B) ⋅ semences 写入 sandbox; 输出以只读的方式 方式 装回外部──

5. **Plan-execute-verify loop.** `plan`- Je vous propose des enfants.`execute`- Je suis en train de faire une analyse.`verify`Pour le contrôle des unités de fonctionnement des mesures, la perte est-elle descendue? l'ablation est-elle isolée?

6. **Writer.**Le projet de loi de la loi de l'Union européenne sur les droits de l'homme est un projet de loi de l'Union européenne sur les droits de l'homme.

7. **Reviewer ensemble.**五个评委 根据 NeurIPS 风格 rubrique,对草案的(novelty、rigor、clearity、reproducibility、impact)打分──如果意思 <4.0/5,则带批判 返回 writer──3次重写 后硬停止──

8. **Red team.**构建或集成一组针对沙盒的对抗任务:fork bomb、网络脱 filtration attempt、filesystem escape、LLM 写出的 shell metacharacter──确认全部被阻止──写出结论──

9. **Reproducibility.**Chaque article est accompagné d'un arbre de recherche JSON, semence, W&B, lien d'exécution, configuration de la boîte à sable, ainsi qu'un lecteur rédigé à partir du bout du bout.

## Utilisez-le
```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## Je le livre.
`outputs/skill-ai-scientist.md`Il a donné une idée de semence + un domaine + un budget de 30 $, il a réalisé un pipeline complet, a publié un article de révision, ainsi qu'un paquet de reproductibilité.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

## 练习
1. Utiliser le même domaine entre trois idées de semences différentes 运行管道── Comparer quels sont les éléments de la recherche sur les arbres── Identifier la computa­tion du gaspillage.

2. Avant l'exécution de l'expérience, pour une estimation de plus de 5 $ de nœud ajouter une passerelle humaine dans le circuit── mesurer le coût total 

3. L'ensemble des critiques sera transformé en un seul juge.

4. 引入 réseau-exfiltration test de l'équipe rouge: agent 写出尝试 `curl`Codes de l'adresse du ministère`--network=none`La politique de l'arrêter.

5. Comparer votre recherche sur les arbres avec une base aléatoire plate avec le même budget, sans stratégie d'expansion)

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | “AB-MCTS-style expansion” | 用 novelty×quality×budget score 在 experiment node 上进行 best-first exploration |
| Sandbox | “Experiment isolation” | 无 network、CPU/memory 有界、固定 seed、read-only input 的 container |
| Vision critique | “Render-then-read” | 将 paper 编译为 PDF，把 PDF 送回 VLM，用于 layout 和 claim-evidence critique |
| Reviewer ensemble | “Automated peer review” | 多个 LLM judge 使用 NeurIPS rubric 为 paper 打分；weighted aggregate gate 控制 pipeline |
| Novelty score | “Is this new?” | 对接近 50-paper literature cache 的内容施加惩罚的 heuristic |
| Cost ceiling | “$ budget” | 每篇 paper 的总花费硬上限；Langfuse counter + pre-run estimate |
| Red team | “Sandbox-escape audit” | 如果 policy 错误就会逃出 sandbox 的 adversarial task |

## 延伸阅读
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 参考 agent de recherche de la production
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) Méthodologie initiale
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) évolution 扩展
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) Cadre multi-role de laboratoire de recherche
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 参考 couche d'orchestration
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) Recherche de littérature
- [E2B sandboxes](https://e2b.dev)  reference à l'isolement des expériences
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines) ensemble de critiques 编码的 rubrique
