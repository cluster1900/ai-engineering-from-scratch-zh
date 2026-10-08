# Agno et Mastra: production Le temps d'exécution

> Agno (Python) 和 Mastra (TypeScript) est une production de 2026 ans Runtime 组合。Agno 目标是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于 Vercel AI SDK 底层, fournit des agents、outils、 workflows、统一模型 routing 和复合存储。

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## Objectif de l'apprentissage
- Identifier les objectifs de performance d'Agno, ainsi que ces objectifs dans quelles situations sont importants.
- Il y a trois primitifs de Mastra: agents, outils, flux de travail, adaptateurs de serveurs.
- Expliquer pourquoi il n'y a pas de statut ⋅ la mise en œuvre rapide de l'API à l'échelle de la session est le chemin de développement de l'Agno ⋅
- Selon la pile de données 选择 Agno 或 Mastra(Python-first vs TypeScript-first)。

##  problématique
LangGraph、AutoGen、CrewAI sont très lourds en matière de cadres. Ils veulent être plus rapides, plus rapides, et dans mon équipe de fonctionnement, ils choisissent Agno (Python) ou Mastra (TypeScript).

## 概念
### Agno

- Python Runtime, qui est Phi-data.
-  pas de graphiques  chaînes ou mode complexe   seulement python 
- Objectif de performance: environ 2μs Agent 实例化、 chaque Agent 约3.75 KiB de mémoire、 environ 23 fournisseurs de modèles。
- 生产路径:无状态、session-scoped FastAPI backend。 chaque demande ont démarré un nouvel Agent; état de session 存在 DB中。
- Orig生 Multimodal (text,image,audio,vidéo,fichier) et RAG agencé

Quand vous avez des milliers de courts cycles de vie par seconde, ces objectifs sont importants.

### Mastra

- TypeScript, construit sur le SDK de l'IA Vercel
- Trois primitifs:**Agents**- Je suis là.**Tools**(Types de zone)**Workflows**Il y a une autre.
- Modèle unifié routeur  跨 94 个供应商 的 3,300+ models(2026 年 3 月) ⋅
- Le stockage composé: mémoire, flux de travail, observabilité
- Apache 2.0, source code du code`ee/`Actuellement, l'entreprise est autorisée à utiliser une licence de source.
- 支持 Express、Hono、Fastify、Koa's serveurs adaptateurs; pour Next.js 和 Astro 提供一级集成──
- 提供 Mastra Studio(host local:4111) pour le débogage
- 1.0 版本时(2026 年 1 月) Il y a 22k+ GitHub stars、300k+ téléchargements npm chaque semaine。

### Positionnement

Les deux ne sont pas destinés à devenir LangGraph.

- **Language fit.**Agno 面向 Python-first 团队;Mastra 面向 TypeScript-first。
- **Runtime ergonomics.**Agno = presque nul; Mastra = 与 Vercel écosystème 集成──
- **Observability.**两者都集成 Langfuse/Phoenix/Opik(L'enseignement 24), mais le studio Mastra est le premier parti。

### Quand choisir chacun

- **Agno** Python backend 大量短生命周期 Agent 强性能要求 FastAPI 团队
- **Mastra** TypeScript backend、Next.js / Vercel déployer、统一 multi-provider modèle de routage、Zod-typed outils。
- **LangGraph**(Létion 13)  Lorsque l'état durable et le raisonnement graphique explicite sont plus importants que la vitesse initiale 
- **OpenAI / Claude Agent SDK** Quand tu veux un fournisseur 产品化后的形态时(Léctions 1617)。

### Ce modèle est facile à trouver

- **Perf-for-perf's-sake.**Parce que ça ne semble pas mal de choisir Agno, mais la charge de travail est pour chaque demande, un appel d'agent lent.
- **Ecosystem lock-in.**L'intégration vercel-flavorée de Mastra est possible à l'intérieur du Vercel, à l'extérieur, à l'extérieur.
- **Enterprise license confusion.**Le maître de la maison`ee/`Le code est source-disponible, pas Apache 2.0... si vous prévoyez de le faire, lisez les licences...


```figure
wb-runtime-spawn
```

## - Je le construis.
Cette classe est principalement comparative                                                                                                                                                                                                                                                            `code/main.py`Le jeu de côté et d'autre: un minimum de fonctionnement Agent、 flux de sortie、 session 流程, réalisé deux fois ((une fois en forme d'Agno, une fois en forme de Mastra)

Je vais le faire.

```
python3 code/main.py
```

Je verrai deux traces de structures différentes mais fonctionnelles.

## Utilisez-le
- **Agno** 需要速度和 FastAPI 形态的Python后台──
- **Mastra** 拥有多个供应商和工作流原始的TypeScript后台──
- 两者都提供第一方可观度──两者都集成 Langfuse──

## Je le livre.
`outputs/skill-runtime-picker.md`La mise en œuvre de la stratégie de développement durable (SDK) est une stratégie de développement durable (SDK) de la société.

## 练习
1. 阅读 Agno's docs──把 stdlib ReAct loop(Lesson 01) porté à Agno──Qu'est-ce qui a disparu?Qu'est-ce qui est resté?
2. 阅读Mastra's docs──把同一个循环 移植到Mastra──outil de typage Qu'est-ce qui a changé dans le système de typage ?
3. Benchmark: Mesurer votre pile de l'agent  Exemple de latence── 2μs d'Agno pour votre charge de travail  important ?
4. Si vous avez toujours travaillé dans Python, CrewAI, migrer vers Agno 会破坏什么?
5. 阅读 Mastra de `ee/`Quelles restrictions vont affecter le fourchette open source ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | “Fast Python agents” | 无状态、session-scoped 的 Agent Runtime |
| Mastra | “TypeScript agents on Vercel AI SDK” | Agents + Tools + Workflows + Model Router |
| Unified Model Router | “Multi-provider access” | 跨 94 个 providers、面向 3,300+ models 的单一 client |
| Composite storage | “Multiple backends” | Memory/workflows/observability 分别接入不同 store |
| Mastra Studio | “Local debugger” | 用于 introspecting Agents 的 localhost:4111 UI |
| Source-available | “Not OSS” | License 允许阅读 source，但限制 commercial use |

## 延伸阅读
- [Agno Agent Framework docs](https://www.agno.com/agent-framework)  performance Objectives  intégration rapide de l'API
- [Mastra docs](https://mastra.ai/docs) primitifs  adaptateurs serveurs  Modèle routeur
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) état-pluriel 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) Integrations de mastres 引用的 observabilité comparations
