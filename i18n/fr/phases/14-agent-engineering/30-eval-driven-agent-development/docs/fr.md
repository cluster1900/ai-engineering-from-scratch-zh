# Eval 驱动的代理 开发

> L'évaluation de l'anthropie n'est pas la dernière étape. Elle est le moteur de tous les autres cycles de choix de la phase 14.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## Objectif de l'apprentissage
- Il existe trois niveaux d'évaluation:
- 解释评价者-optimiser 紧密循环──
- 描述2026 best practice:evals avec code mis ensemble, en fonctionnement au sein de l'IC,并作为PR gateway──
- Chaque cours de la phase 14 sera relié à l'évaluation de l'affaire qu'elle a générée.

##  problématique
Les agents peuvent passer par la démo. Ils échouent de manière imprévisible en production. Les critères de référence répondent que le modèle a-t-il une capacité étendue ?

## 概念
### 3 niveaux d'évaluation

1. **Static benchmarks** Utilisé dans le code SWE-bench Verified(Létion 19) 、 pour la navigation / 桌面的 WebArena/OSWorld(Létion 20) 、 pour le GAIA généraliste(Létion 19) 、 pour l'utilisation d'outils BFCL V4(Létion 06) ⋅ pour le cross-model comparation et le retrait de la porte。 contamination est réelle:

2. **Custom offline evals** Votre produit:
   - Leur rôle est de faire preuve de respect envers les autres.
   - Les tests de test sont effectués en fonction de l'exécution de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de mise en œuvre de mise en œuvre de mise en œuvre de mise en œuvre de mise en œuvre de mise en œuvre.
   - Les séquences d'action basées sur la trajectoire seront comparées à l'or; OSWorld-Human  montrer les meilleurs agents sont 1.4-2.7x de l'or)

3. **Online evals** 生产:
   - Retours de séance
   - Garde-carrière 触发的告警(Léction 16、21)
   - 单步成本 / 延迟跟踪 L'enseignement 23 est ouvert

### Évaluateur-optimisateur (Anthropic)

 cycle étroit:

1. Proposant 生成输出──
2. Évaluateur  effectuer des jugements 
3. Répondre à l'évaluation

C'est la réflexion de l'auto-réfinition post-pénétisation. Tout flux d'agents que vous appréciez peut être intégré dans un optimisateur d'évaluation, pour améliorer la fiabilité.

### 2026 les meilleures pratiques

- Les équations et les codes sont mises ensemble.
- Dans chaque PR, il y a des opérations de communication.
-  Selon les scores d'évaluation, la porte se fusionne (par exemple,  relativement à la principale, non autorisé à régresser > 5%)
- Chaque garde-corps est projeté dans un cas d'évaluation.
- Chaque article de la règle de réflexion (Reflection, Règlement d'apprentissage du flux de travail) est un cas d'échec.

### La phase 14 se lève

Chaque cours de la phase 14 génère des cas d'évaluation:

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

Si votre suite d'évaluation couvre chaque élément, vous couvrez la phase 14.

### Eval 驱动开发会在哪里失败

- **没有 baseline。**没有最后知名好的的评价 无法解读──baseline de stockage──
- **LLM-judge 没有 grounding。**Les juges aussi hallucineront. Le modèle critique.
- **过拟合 evals。**Pour évaluer les cas de rechange, il est préférable de se détourner de la production.
- **Flaky evals。**Les cas d'incertitude provoqueront de fausses alarmes.


```figure
ae-eval-three-layers
```

## - Je le construis.
`code/main.py`Il s'agit d'un harnais d'évaluation stdlib:

- 带 catégories de cas de référence ▌custom ▌en ligne
- Un agent sous test.
- L'évaluation-optimisation: proposer, juger, affiner jusqu'à ce que le passage ou atteindre les tours maximaux.
- Portée CI: taux de réussite de l'échange + régression du baseline.

Je vais le faire.

```
python3 code/main.py
```

输出: chaque cas de passage/échec, drapeau de régression, verdict de la porte CI.

## Utilisez-le
- Dans un repo similaire au code agent, écrivez des cas d'évaluation.
- C'est par CI que les relations publiques fonctionnent.
- En régression, on construit et on ne gagne pas.
- Suivre le taux de réussite  avec le temps 
- Chaque échec de production est lié à un nouveau cas.

## Je le livre.
`outputs/skill-eval-suite.md`Pour un produit agent construire une suite d'évaluation à trois niveaux, comprenant des portes CI et un suivi de régression 

## 练习
1. Prends une de tes erreurs de production... écrive une évaluation de son cas... ton agent peut-il passer ?
2. Pour votre domaine, construisez une rubrique de jurés LLM contenant trois dimensions (factuelle, tonne, champ d'application) et donnez-leur 50 sessions.
3. Pour les résultats de l'évaluation, il est nécessaire de faire une récession de >=5% pour permettre la construction de l'échec.
4. 添加轨道效率指标:agent 相比黄金轨道 走过多少步?
5. Mettre chaque cours de la phase 14 dans votre suite est un cas d'évaluation.

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
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)   de simple à simple, avec des évaluations  优化
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选 référence
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) référence de l'utilisation des outils
- [Langfuse docs](https://langfuse.com/) 实践中的 évaluations + répétition de la session
