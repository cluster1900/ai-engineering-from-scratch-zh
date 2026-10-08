# Claude Agent SDK:Subagents 和 Sessions Store

> Claude Agent SDK est un ensemble de logiciels de Claude Code. Il est utilisé pour l'isolement de contexte.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## Objectif de l'apprentissage
- 解释区别 entre le SDK du client anthropic (API cru) et le SDK de l'agent Claude (forme de harnais)
- 描述 subagents:parallélisation et isolement de contexte, ainsi que comment les utiliser.
- Dites-moi la surface de la boutique de session du SDK Python`append`- Je suis là .`load`- Je suis là .`list_sessions`- Je suis là .`delete`- Je suis là .`list_subkeys`) ainsi que `--session-mirror`Le rôle de la société
- 实现 un harnais stdlib, contenant des outils intégrés 带隔离的背景的 subagent spawning 生命周期 hooks 和 session store ⋅

##  problématique
L'API de LLM Raw ne vous donne qu'une seule fois aller-retour. L'agent de production a besoin d'exécution des outils, des serveurs MCP, des crochets de cycle de vie, de reproduction subbagente, de persistance des séances, de propagation des traces.

## 概念
### SDK client contre SDK agent

- **Client SDK (`anthropic`).**API de messages bruts. Vous êtes vous-même responsable de la boucle.
- **Agent SDK (`claude-agent-sdk`).**L'exécution intégrée de l'outil, les connexions MCP, les crochets, la reproduction sous-jacente, le magasin de sessions, etc.

### Des outils intégrés

SDK 开箱附附10+ outils:lecture/écriture de fichiers,shell,grep,glob,web retrieve etc.

### Les sous-gants

Anthropic a enregistré deux utilisations:

1. **Parallelization.**Il s'agit de 20 tâches parallèles.
2. **Context isolation.**Les subagents utilisent leur propre fenêtre de contexte; seulement les résultats retournent à l'orchestre.

Les nouveaux projets de Python SDK:`list_subagents()`- Je suis là.`get_subagent_messages()`, pour la lecture de transcriptions subagentes

### Boutique de séances

Parité de protocole avec TypeScript:

- `append(session_id, message)`J'ai fait un tour.
- `load(session_id)`- Je veux reprendre la conversation.
- `list_sessions()`Je suis un homme.
- `delete(session_id)` 带有对 subagent sessions de cascade
- `list_subkeys(session_id)` 列出 subagents clés。

`--session-mirror`(Flag CLI) sera diffusé en streaming en transcription  en miroir vers des fichiers externes, pour faciliter le débogage

### Les crochets

Vous pouvez vous inscrire à des crochets de cycle de vie:

- `PreToolUse`- Je suis là .`PostToolUse` porte ou appel à l'outil d'audit;;
- `SessionStart`- Je suis là .`SessionEnd`- Je vais le faire.
- `UserPromptSubmit` Dans le modèle voir les commentaires des utilisateurs 之前采取行动──
- `PreCompact` 在 context compaction 之前运行。
- `Stop` agent de sortie 时 nettoyage。
- `Notification` Alertes de canal latéraux。

Les crochets sont pro-flux de travail (références du programme de cours de la phase 14) et des systèmes similaires pour ajouter des comportements transversaux.

### Contextes de traces W3C

调用方上活跃的OTel spans 会通过W3C trace contextes header 传播到CLI subprocess──整个多进程 trace 会在你的后台中显示为一个跟踪──

### Claude gérait les agents

Hosted 替代方案 `managed-agents-2026-04-01`■■ travail de synchronisation à long terme•créditation rapide intégrée•compaction intégrée•contrôle 换取 géré infrastructure¬

### Ce modèle est facile à trouver

- **Subagent over-spawn.**Pour 100 petites tâches, 100 sous-gents sont générés.
- **Hook creep.**Chaque équipe ajoute des crochets; le temps de démarrage  expansion ⋅ chaque saison de revue de crochets ⋅
- **Session bloat.**Les séances 持续累积;size 增长──使用 `list_sessions`+ politique d'expiration de la loi.


```figure
ae-subagent-isolation
```

## - Je le construis.
`code/main.py`Utilisez la forme du SDK:

- `Tool`- Je suis là .`ToolRegistry`, contient intégré `read_file`- Je suis là .`write_file`- Je suis là .`list_dir`Il y a une autre.
- `Subagent` contexte privé ‧exécution isolée ‧ résultats de retour 
- `SessionStore` ajouter, charger, supprimer, sous-clés
- `Hooks` `pre_tool_use`- Je suis là .`post_tool_use`- Je suis là .`session_start`- Je suis là .`session_end`Il y a une autre.
- Un démo: l'agent principal génère en parallèle 3 sous-gents, chacun isolé, les résultats sont regroupés, et la session persiste.

运行:

```
python3 code/main.py
```

Trace 会展示 subagent context isolation(dimension du contexte de l'orchestre 保持 bounded) 、exécution de crochet 和 persistance de la session。

## Utilisez-le
- **Claude Agent SDK**Utilisé pour la première fois dans les produits Claude Code.
- **Claude Managed Agents**Utilisé pour l'hébergement de travail de synchronisation à long terme.
- **OpenAI Agents SDK**(Létion 16) Pour les premières contreparties OpenAI:
- **LangGraph + custom tools**Si vous voulez une machine d'état en forme de graphe...

## Je le livre.
`outputs/skill-claude-agent-scaffold.md`L'échafaudage une application SDK Claude Agent, contenant des sous-gants, des crochets, des magasins de session, des fiches de serveurs MCP et de la propagation des traces W3C.

## 练习
1. 添加一个子弹器,把20 个任务批 成每组5 个平行子弹器──衡量乐队员背景大小与一个任务对比──
2.  réaliser un `PreToolUse`- Je suis en train de vous dire.`write_file`Les appels sont effectués à un rythme limité (à chaque session, à 5 minutes par minute).
3.  connexion `list_subkeys`Un arbre sous-jacent... un nid profond.
4. Pour que ce jouet soit réel.`claude-agent-sdk`Le paquet Python. L'enregistrement des outils.
5. Vous allez passer de l'hébergement à la gestion ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Code 库形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) Mode de production
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) hébergé 替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) contrepartie
