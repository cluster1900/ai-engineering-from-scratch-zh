# Capstone 01  终端原生 Agent de codage

> En 2026, la forme de codeur est déjà déterminée. Un harnais TUI, un plan en état, une surface d'outil en boîte, un cycle responsable de planification, d'action, d'observation, de récupération.

**类型：**Capstone
**语言：**TypeScript / Bun (harness), Python (écritures égaliques)
**先修要求：**La phase 11 (ingénierie de la LLM), la phase 13 (outils et protocoles), la phase 14 (agents), la phase 15 (systèmes autonomes), la phase 17 (infrastructure)
**覆盖阶段：**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：**35 minutes

##  problématique
En 2026, les agents de codage sont devenus les principaux acteurs de l'IA dans les applications de classe. Le code Claude (Anthropic) 带 Composer 2 和 Agent Tabs  Cursor 3 (Cursor)  Amp (Sourcegraph)  OpenCode (112k stars)  Factory Droids et Google Jules ont publié différentes variantes de la même structure: un harnais terminal  une surface d'outil dotée de pouvoirs  une boîte à sable, ainsi qu'un modèle de plan-acte de surveillance de la construction autour de la frontière  Le modèle de coordonnées  L'agent Opus 4.5 utilise un système de fichiers très étroit  Live-SWE  L'opération sur le banc SWE  Verifié atteint 79,2%  Mais le processus est très large  La plupart des modèles de défaillance ne sont pas des erreurs  Ils sont un système de texte instable  Déconstruction  Controle  Détruction  Traitement  Traitement  Détruction 

Vous ne pouvez pas comprendre ces agents de l'extérieur. Vous devez construire un, observer la boucle dans la 47e ronde de ripgrep, retourner 8MB de correspondance et s'effondrer, puis reconstruire la tranche.

## 概念
Le harnais a quatre surfaces.**Plan**维护一个 TodoWrite 风格的状态对象, par modèle 每一轮重写──**Act**分发 appels à l'outil (lire, modifier, exécuter, rechercher, git)**Observe**捕获 stdout / stderr / exit codes, effectuer une coupe,并把摘要反回去──**Recover**Œuvre de traitement des erreurs d'outil, tout en évitant la fenêtre de contexte ou le cycle illimité.**hooks**Il y a une autre.`PreToolUse`- Je suis là .`PostToolUse`- Je suis là .`SessionStart`- Je suis là .`SessionEnd`- Je suis là .`UserPromptSubmit`- Je suis là .`Notification`- Je suis là .`Stop`, et `PreCompact` Ce sont des points d'expansion configurables, l'opérateur peut y insérer des politiques, télémétrie et barreaux.

Sandbox utilise E2B ou Daytona。 chaque tâche est réalisée dans un nouveau décontenteur, et est montée sur un git de travail qui peut être lu. Harness ne touchera jamais le système de fichiers hôte. Worktree est détruit.

## 架构
```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 技术
- Durée de fonctionnement du harnais: Bun 1.2 + Ink 5 (réaction en terminal)
- Modèle 访问:OpenRouter 统一 API, support Claude Sonnet 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5(pour les tâches les plus difficiles)
- Transports d'outils: modèle de protocole contextuel StreamableHTTP (révision du MCP 2026)
- Sandbox: boîtes de sable E2B (JS SDK) ou conteneurs de développement Daytona
- Recherche de code: sous-processus ripgrep, parser de garde d'arbre pour 17 langues (précompilé)
- Isolement: `git worktree add`par tâche, nettoyage sur le succès / échec
- Harnais égal: SWE-bench Pro (sous-ensemble vérifié) + Terminal-Bench 2.0 + votre propre détenteur de 30 tâches
- Observabilité: SDK OpenTelemetry avec `gen_ai.*`semconv → Langfuse hébergée par elle-même
- Publication de relations publiques: GitHub App Utilisez des jetons à grains fins, portée  limitez dans l'objectif repo


```figure
ce-agent-loop
```

## - Je le construis.
1. **TUI and command loop.**搭建一个使用墨的 Bun 项目──接收 `agent run <repo> "<task>"`△打印一个分屏视图:plan pane(顶部)、工具调用流(中部)、Token budget(底部)。添加 Ctrl-C 取消逻辑,在退出前触发 `SessionEnd`Je suis un crochet.

2. **Plan state.**定义一个带类型的 TodoWrite schema(包含 pendants / in_progress / done items 和 notes) ――model Chaque round passant par l'outil appelle 重写完整状态不要让它增量修改──将计划 持久化到`.agent/state.json`On peut reprendre après l'effondrement.

3. **Tool surface.**Définir six outils:`read_file`- Je suis là .`edit_file`(Band diff prévisualisation), `ripgrep`- Je suis là .`tree_sitter_symbols`- Je suis là .`run_shell`(avec une pause),`git`(état / diff / commit / push) ―― par MCP StreamableHTTP 暴露, faire usage avec le transport 解── chaque outil 都返回截断后的输出(每次调用最多 4k Tokens)──

4. **Sandbox wrapping.**Chaque mission démarre une boîte à sable E2B.`git worktree add -b agent/$TASK_ID`Créer une nouvelle branche. Tous les appels à l'outil sont dans la zone de sable.

5. **Hooks.**实现全部八种2026 hook 类型──至少接入四个用户编写的 hooks:(a)`PreToolUse`Garde de commandement destructeur, empêche le travail.`rm -rf`,(b) `PostToolUse`Comptabilité des jetons, c)`SessionStart`Initialisation budgétaire,`Stop`写入 le dernier paquet de traces。

6. **Eval loop.**Clone un SWE-bench Pro Python 子集── pour chaque problème 运行你的 Harness──与迷你-swe-agent(minimum baseline)`eval/results.jsonl`Il y a une autre.

7. **Cost control.**- Je suis en train de faire une série de tests.`PreCompact`Le cran dans les 150k 处将较早的转转摘要为前状态块,为新观测 出空间,同时不丢失计划

8. **PR posting.**Après le succès, la dernière étape est`git push`, puis appeler GitHub API  ouvrir une relation publique, et contenir un plan et un résumé différent en vrac.

## Utilisez-le
```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## Je le livre.
compétences de livraison 位于 `outputs/skill-terminal-coding-agent.md`△ donne un chemin de référencement et une description de tâche, il fonctionnera dans la boîte à sable dans la boucle complète du plan-acte-observer,并返回 PR URL 和 trace bundle──本 capstone:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## 练习
1. Pour ce qui est de la mise en œuvre de la méthode de calcul de la valeur de l'échantillon, il est nécessaire de calculer les coûts de la mise en œuvre de la méthode de calcul de la valeur de l'échantillon.

2. - Je suis là.`reviewer`Les sous-agents, en publiant des publicités, peuvent demander une boucle de révision. Mesurer les avis faux positifs

3. 压测 sandbox:编写一个尝试 `curl`Externel URL de la tâche, ainsi qu'une tentative d'écrire dans l'arbre de travail Externel de la tâche.

4. Utilisation de modèle plus petit (Haiku 4.5)  réalisation `PreCompact`Résumé: la mesure est en 3x de compaction.

5. Pour le transport MCP StreamableHTTP 替换为 stadio──Bachmark cold-start 和 per-call latency──为本地使用选择胜者──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | “agent loop” | 围绕 model 的代码，负责分发 tools、维护 plan state，并强制执行 budgets |
| Hook | “Agent event listener” | 由 harness 在八种 lifecycle events 之一上运行的用户编写脚本 |
| Worktree | “Git sandbox” | 位于独立路径的 linked git checkout；可以丢弃而不触碰 main clone |
| TodoWrite | “Plan state” | model 每轮都会重写的 typed list，包含 pending/in-progress/done items |
| StreamableHTTP | “MCP transport” | 2026 MCP revision：具备双向 streaming 的 long-lived HTTP connection；取代 SSE |
| Token ceiling | “Context budget” | 对 input+output Tokens 设置的每轮或每 session 上限；触发 compaction 或 termination |
| pass@1 | “Single-attempt pass rate” | SWE-bench tasks 在第一次运行中解决的比例，不包含 retry 或 test-set peeking |

## 延伸阅读
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) provenant de l' arsenal de référence Anthropic
- [Cursor 3 changelog](https://cursor.com/changelog) Agents Tabs 和 Composer 2 notes de produit
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) Baseline minimale de la comparaison de la banquette de la SWE
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) Utilisation Opus 4.5 sur le banc SWE vérifié atteint 79,2%
- [OpenCode](https://opencode.ai) Harness ouvert, 112 000 étoiles
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本 面向的评估
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) Méta-données de capacité
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) appels à l' outil 和 schéma d' utilisation des jetons
