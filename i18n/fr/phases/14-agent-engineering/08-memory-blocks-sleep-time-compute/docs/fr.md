# Blocs de mémoire et calcul du temps de sommeil (Letta)

> MemGPT est devenu Letta en 2024[6]. L'évolution de 2026 a ajouté deux idées: le modèle peut éditer directement des blocs de mémoire fonctionnels dispersés, ainsi que l'agent du sommeil de l'agent principal de l'intégration de la mémoire空时异步. C'est la méthode pour étendre la mémoire au-delà d'une seule conversation[6].

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- Il est également possible de trouver des informations sur les différents types de mémoires utilisés par Letta.
- 解释 memory-block pattern:Human block、Persona block, ainsi que des blocs définis par l'utilisateur d'objets de type 1.
- Décrivez ce qu'est le calcul du sommeil, pourquoi il se situe en dehors du chemin critique, et pourquoi il peut fonctionner par rapport à un modèle plus fort que l'agent primaire.
- ¢ réaliser un cycle bi-agent de scripting, dont l'agent principal ¢ fournit une réponse, agent de sommeil ¢ intégrer des blocs entre les cycles ¢

##  problématique
MemGPT (leçon 07) a résolu le flux de contrôle de la mémoire virtuelle.

1. **Latency.**Chaque opération de mémoire est située sur un chemin critique. Si l'agent doit effectuer une coupe, une révision ou une modification pendant l'attente de l'utilisateur, la latence de la queue augmentera considérablement.
2. **Memory rot.**写入会不断累积――被矛盾推翻的事实会留下――检索会被陈旧内容淹没――
3. **Structure loss.**平的档案库 无法表达Human block 总是在提示中;Persona block 总是在提示中;Task block 按会议 交换──

Letta (letta.com) est une version de 2026 de la rédaction de la note.

## 概念
### Trois niveaux

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | 始终可见 | 在 main prompt 内 | Agent tool call + sleep-time rewrites |
| Recall | 对话历史 | 可检索 | 自动轮次日志 |
| Archival | 任意事实 | Vector + KV + graph | Agent tool call + sleep-time ingest |

Le cœur est le cœur de MemGPT。Remember est le tampon de conversation  et son尾部被驱逐──Archive est le magasin externe──This disassembly clears MemGPT's two layers重载──

### Blocs de mémoire

Le bloc est une section de niveau central entre une section de type persistante éditable.

- **Human block** 关于用户的事实(姓名、角色、偏好、目标)
- **Persona block** l'auto-conception de l'agent 

Letta le généralise en blocs définis par l'utilisateur: pour les objectifs actuels `Task`Le bloc, utilisé pour la base de codes`Project`bloc, pour une liaison dure `Safety`Chaque bloc est en train de se construire.`id`- Je suis là.`label`- Je suis là.`value`- Je suis là.`limit`(symbole sur limite)`description`(Laissez le modèle savoir comment l'éditer)

Blocs à travers la surface de l'outil 编辑:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)`                                                                                                                                                                                                                                                              

### Compteur du sommeil

2025年 Letta's newspots: dans le second agent, situé en dehors du chemin critique ⋅ agents du sommeil  traitement des transcriptions de conversation et le contexte de base de code, sera `learned_context`写入共享区块,并整合或作废档案记录──

Les caractéristiques obtenues:

- **No latency cost.**Les réponses primaires ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇   ̇ ̇    ̇ ̇  ̇ ̇ ̇         ̇ ̇          ̇        ̇                                                                                                                                                                         
- **Stronger model allowed.**L'agent du sommeil peut être plus cher, plus lent, car il ne reçoit pas de latence.
- **Natural consolidation window.**Lorsque l'utilisateur n'attend pas, effectuer un dépôt de données, un résumé, un résumé des contradictions.

Cette forme correspond au mode de travail humain: tu fais des tâches, tu dors, tu fais des souvenirs de longue durée pendant la nuit.

### Letta V1 et le raisonnement de l'origine

Letta V1 (`letta_v1_agent`, 2026) abandonné `send_message`/ le battement du cœur et en ligne `Thought:`Les messages de l'API (Anthropic) seront envoyés sur un canal unique, et le processus de transmission se déroulera en deux phases.

### Cette façon est facile à trouver

- **Block bloat.**Il n' y a pas de limite .`block_append`Il est également possible de trouver des solutions de gestion de la situation en matière de gestion des ressources humaines.
- **Silent drift.**L'agent du sommeil a réécrit le bloc, tandis que l'agent principal a fait une différence de trace.
- **Poisoned consolidation.**L'agent du sommeil va traiter le contenu accessible à l'attaquant dans le noyau.


```figure
memory-blocks
```

## - Je le construis.
`code/main.py`实现:

- `Block` id、étiquette、value、limite、description。
- `BlockStore` CRUD + `near_limit(label)`- Je suis un assistant.
- 两个 scripting agents  `PrimaryAgent`- Je suis un homme.`SleepTimeAgent`Dans le même temps,
- Une trace, une démonstration contenant des blocs écrites, ainsi qu'un passage de sommeil, il résume un bloc et fait une révolte.

运行:

```
python3 code/main.py
```

La transcription montre ce décomposition: les virages primaires 很快并产生原始写入; sleep pass 负责压缩和清理。

## Utilisez-le
- **Letta**(letta.com)  comme mise en œuvre de référence──可 self-hosting 或使用 managed cloud──
- **Claude Agent SDK skills** compétence  est un nom 带版本  可检索的说明块,代理 可按需加载
- **Custom builds**适用于希望控制存储后端的团队──使用Letta API contract,以便后续迁移──

## Je le livre.
`outputs/skill-memory-blocks.md`Il est construit en un système de bloc en forme de Letta, avec des crochets de sommeil, y compris les règles de sécurité et le câblage de citation.

## 练习
1. - Je suis là.`block_summarize`outil:当 `near_limit`返回 true 时, using model generated summary 替换 block value──哪个触发值能同时最小化总结调用 和块溢出?
2. Dans l'archivage, le déducteur du temps de sommeil est réalisé: le texte de deux enregistrements a > 90% de coupe-tone lorsqu'il est plié en un seul.
3. Pour blocs 加版本──每次写入都记录旧值和差──暴露 `block_history(label)`Laissez les opérateurs vérifier pourquoi l'agent a oublié X🏼
4. Les agents de sommeil sont considérés comme des écrivains non fiables.
5. L'exemple de transfert sera utilisé par Letta API (`letta_v1_agent`•• Quel est le schéma de blocage ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory block | “可编辑的 prompt section” | Core memory 中 typed、persistent、LLM-editable 的 segment |
| Human block | “用户记忆” | 关于用户的事实，固定在 core 中 |
| Persona block | “Agent 身份” | Self-concept、语气、约束，固定在 core 中 |
| Sleep-time compute | “异步记忆工作” | 第二个 agent 在 critical path 之外执行整合 |
| Core / Recall / Archival | “层级” | 三层记忆拆分：始终可见 / 对话 / external |
| Block limit | “上限” | 每个 block 的字符限制；迫使进行 summarization |
| Native reasoning | “Thinking channel” | Provider-level reasoning output，而不是 prompt-level `Thought:` |
| Learned context | “Sleep output” | Sleep-time agent 写入 shared blocks 的事实 |

## 延伸阅读
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Modèle de blocage
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) 异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) Orig生 raisonner 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 起源
