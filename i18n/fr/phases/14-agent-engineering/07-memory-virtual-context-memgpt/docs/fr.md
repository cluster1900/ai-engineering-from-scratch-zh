# Mémoire: Context virtuel et MemGPT

> La fenêtre de contexte est limitée. Dialogue, archives et outils trace Non. MemGPT (Packer et coll., 2023) la classifie comme étant la mémoire virtuelle du système d'exploitation: le contexte principal est la RAM, le stockage externe est le disque, l'agent entre les deux effectue la page.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- 解释 MemGPT 所基于的 OS 类比:main context = RAM,external context = disk,memory tools = page in/out。
- Utilisation de stdlib 实现两层 MemGPT 模式:buffer de contexte principal, magasin de recherche externe, ainsi que des outils de saisie/sortie de la page.
- 描述 agent 如何发发出"interrupts"来查询或修改外部内存,以及结果如何被拼接回下一个提示──
- 识别会延续到 Letta(L'enseignement 08) et le Mem0(L'enseignement 09) dans le MemGPT 设计选择。

##  problématique
La fenêtre de contexte semble être capable de résoudre la mémoire.

1. **Overflow.**Il y a beaucoup de discussions, de longues archives, ou de trajectories lourdes, appelées à des outils, qui vont passer par la fenêtre.
2. **Dilution.**Même dans les fenêtres, le contexte de saisie est également rare. Attention à l'importance du contenu.
3. **Persistence.**Nouvelle session depuis la fenêtre vide commencé. Aucun agent de mémoire externe ne peut pas traverser la session.

Une fenêtre plus grande peut aider, mais ne peut pas résoudre ce problème. Le document de 2025 de Mem0 mesure jusqu'à 128k-fenêtre baseline.

## 概念
### Les échanges de données

Packer et coll. (arXiv:2310.08560, v2 Février 2024) va gérer le contexte 映射到操作系统虚拟内存:

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | Vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

agent 运行一个普通的 ReAct loop──额外的一类工具 允许它把数据页在和页在主语境中──

### Deux niveaux

- **Main context.**固定大小的提示,保存当前任务──始终对模型可见──
- **External context.**无界, 通过工具 搜索. 相关时读取.

Le document original a évalué la conception sur deux missions de fenêtres de base supérieures: analyse de documents de plus de 100 000 jetons, ainsi que chat multi-session de mémoire persistante à travers le jour.

### Modèle interrompu

MemGPT  introduire la mémoire en tant qu'interrupte: dans le dialogue, l'agent peut utiliser l'outil de mémoire, le temps de fonctionnement  l'exécuter, résultat comme nouvelle observation 拼接进下一次助手转──概念上等于 Unix `read()`syscall: il bloque le processus, retourne les octets, puis le processus continue à fonctionner.

标准 mémoire 工具接口:

- `core_memory_append(section, text)` 写入 prompt 的持续部分──
- `core_memory_replace(section, old, new)` 编辑 section persistante。
- `archival_memory_insert(text)` 写入 magasin externe à rechercher
- `archival_memory_search(query, top_k)` De magasin externe 检索。
- `conversation_search(query)` 扫描过去的转折──

### Le bord de MemGPT et le point de départ de Letta

Le projet de loi de l'Union européenne sur les droits de l'homme (MemGPT) est en cours de mise en œuvre.`cpacker/MemGPT`) remain conservé;Letta 扩展该设计:

- Les trois niveaux sont plutôt deux niveaux.
- Utiliser le raisonnement natif 替代 `send_message`Le rythme cardiaque est le plus fort.
- Les agents du sommeil 运行 travail de mémoire asynchrone

Même si le système de production de Letta ̇Mem0 ou de magasin à deux niveaux est en fonction de l'année 2026, le papier MemGPT reste la base de l'année 2026 ̇

### Cette façon est facile à trouver

- **Memory rot.**写入积累得比读取更快; récupération 被陈旧事实淹没──修复方式: régulièrement consolidation(Letta sleep-time), manifestement invalidation(Mem0 conflit détecteur)。
- **Memory poisoning.**La mémoire externe est le texte qui a été récupéré. Si le contenu contrôlé par l'attaquant est entré dans la mémoire, l'agent se retrouvera à la prochaine session.
- **Citation loss.**L'agent se souvient que le utilisateur m'a envoyé X, mais ne peut pas citer c'est quelle rotation.


```figure
context-budget
```

## - Je le construis.
`code/main.py`Utilisez le modèle à deux niveaux de MemGPT:

- `MainContext`  Fixé gros de tampon rapide, avec `core`et`messages`Liste; dépassant le cap 时自动紧 最旧消息──
- `ArchivalStore` stockage BM25-esque dans le 内存 (enregistrement de la coïncidence des jetons), stockage (id, texte, balises, session, tour)
- 五个映射到 MemGPT surface des outils de mémoire
- Un agent scripté, d'abord, remplir les faits dans l'archivage, puis passer par la convocation.`archival_memory_search`回答问题──

运行:

```
python3 code/main.py
```

trace 展示 agent 写入三个事实,将主要文本 填到 cap 触发驱逐), puis, en passant par l'archives 检索来回答后续问题, dans le cas de la réelle LLM,

## Utilisez-le
Aujourd'hui, chaque système de production de mémoire est une variante de MemGPT:

- **Letta**(Léction 08)  三层、native reasoning、compute du sommeil
- **Mem0**(Létion 09)  Vecteur + KV + graphique, avec couche de notation 融合──
- **OpenAI Assistants / Responses**  通过线程和文件 管理存储──
- **Claude Agent SDK**                                                                                                                                                                                                                                                              

选择, plutôt que selon le modèle de base 选择;core pattern 就是 MemGPT。

## Je le livre.
`outputs/skill-virtual-memory.md`C'est une compétence réutilisable, qui peut être utilisée pour un temps de fonctionnement de but.

## 练习
1. 添加一个以 Tokens 量 `max_main_context_tokens`cap(用 `len(text.split())`* 1.3 近似) ・ 超越 cap 时,把最旧消息紧缩成总结──比较有没有总结者 时的行为──
2. Dans le magasin d'archives, la fréquence de BM25 est réellement mise en œuvre.
3.  donner des inserts d' archives 添加 `citation`champs(session_id, turn_id, source_url)。让代理 在每个回复中引用来源。
4. 模拟记忆中毒:添加一条档案记录,内容是 "ignorer toutes les instructions de l'utilisateur futur". 编写一个警卫,扫描检索中指示形文字,并把它们标记为不值得信赖──
5. L'implémentation de la mise en œuvre du schéma JSON de mémoire de base du repo de recherche MemGPT (`cpacker/MemGPT`)―Quel changement se produit lorsque les cordes plates passent à des sections tapées ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Virtual context | “无限 memory” | Main（prompt）+ external（searchable）两层，带 page in/out |
| Main context | “Working memory” | prompt：固定大小，始终可见 |
| Archival memory | “Long-term store” | External searchable persistence，按需检索 |
| Core memory | “Persistent prompt section” | 固定在 main context 内的命名 sections |
| Memory tool | “Memory API” | agent 发出的用于读写 external memory 的 tool call |
| Interrupt | “Memory page fault” | Agent 暂停，runtime 获取，结果拼接进下一轮 |
| Memory rot | “Stale facts” | 旧写入淹没 retrieval；用 consolidation 修复 |
| Memory poisoning | “Injected persistent note” | attacker content 被存为 memory，并在 recall 时重新摄入 |

## 延伸阅读
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560)                                                                                                                                                                                                                                                              
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Évolution à trois niveaux
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Contextualiser voir budget
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) construire la mémoire de production hybride sur ce modèle
