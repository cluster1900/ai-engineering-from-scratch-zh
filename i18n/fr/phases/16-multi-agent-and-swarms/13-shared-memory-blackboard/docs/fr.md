# Mémoire partagée et tableau noir 模式

> Deux méthodes sont utilisées pour la mise en place d'un système multi-agents en 2026:**message pool**(tous les gens peuvent voir les messages de tous, comme AutoGen GroupChat ou MetaGPT) et**带 subscription 的 blackboard**(Agent 订阅相关事件, comme Context-Aware MCP ou Matrix framework) ⋅ Les deux sont la seule partie en état du système Multi-Agent  Cela signifie que des bugs intéressants sont également cachés dans ⋅ référence défaut mode est ⋅**memory poisoning**Un agent s'imagine un fait, un autre agent le considère comme un contenu vérifié, la précision diminue progressivement, et cette diminution est plus difficile à déboguer que l'effondrement immédiat.

**类型：**Apprendre + construire
**语言：**Python, le plus connu`threading`)
**先修：**Phase 16 · 04(Modèle primitif),Phase 16 · 09(Réseaux de masse parallèle)
**时间：**À environ 75 minutes.

##  problématique

Multi-Agent 系统需要一个地方让代理共享事实―― Une option littérale est de 把所有内容都通过消息传递, mais c'est l'équivalent d'utiliser une copie supplémentaire pour réinventer un état de partage. Une autre option est de  donner à chacun un journal , mais le journal  est un projet illimité, et il est facile à empoisonner.

Lorsque l'un d'eux produit une illusion et l'écrit dans un état partagé, après chaque lecture de cet état, l'agent considère cette illusion comme un fait.

Ceci est l'intoxication de la mémoire. C'est la taxonomie MAST de CEMRI et coll., arXiv:2503.13657) parmi les deux plus enregistrées de la famille de failles, et c'est structurel: aucune provenance et aucun vérificateur de mémoire partagée de la conception, finalement, tous vont se manifester sur ce problème.

## 概念

### 两种主要拓

**Full message pool。**Chaque agent 读取每条消息──AutoGen GroupChat 和 MetaGPT Utilise cette méthode──简单,透明,可检查,但不能扩展到大约10 agents,因为每个代理的上下文都会被其他代理的工作填满──

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**带 subscription 的 Blackboard。**L'agent 声明自己感兴趣的主题; sous-strat seulement路由相关消息;;CA-MCP(arXiv:2601.11595) et le cadre décentralisé de la matrice;;arXiv:2511.21686) utilise cette méthode;;

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### Les scènes de la vie

- **Full pool**适合代理 数量少 ((< 10) 角色异构、对话 est une situation de courte période.
- **Blackboard**适合代理 数量多、角色同质但实例众多(swarms) 、对话长期运行情况──路由能节省代币 成本并减少上下文污染──

生产系统通常混合使用:顶部使用一个小型全池 (一个小满池) (planning layer),下方使用黑板 (一个黑板) (一个工人层) (下方使用黑板) (上部使用一个小型全池) (上部使用一个小满池) (下方使用黑板) (下方使用黑板 (一个工人层) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板) (下方使用黑板)

### Une intoxication de mémoire

Trois agents  exécuter une tâche de recherche. L'agent A est un agent de récupération. L'agent B est un résumé. L'agent C est un analyste.

1. Une page a été trouvée,并向共享状态写入消息:L'étude rapporte une amélioration de la précision de 42%.
2. La page obtenue a effectivement écrit une amélioration de 4,2%.
3. B 读取共享状态后写入:Grande augmentation de l'exactitude de 42% rapportée (source: A).
4. C 读取共享状态后写入: Recommandation d'adoption  42% de l'élévation est transformatrice.
5. Le dernier rapport cite un chiffre de 42% qui n'a jamais existé.

没有 Agent 崩──没有测试失败──系统工作正常── Cette perception, par le biais de l'état de partage, est entrée dans les conclusions de chaque agent de la suite.

### Pourquoi est-ce un problème structurel ?

 Lorsque l'agent A est dans un état de partage, le phénomène de l'agent A reste dans le contexte de l'agent A.  Lorsque l'agent A est dans un état de partage, il est possible qu'il ait été redirigé ou redirigé, il y a des erreurs.

Le problème n'est pas le partage de l'état en soi, mais celui du partage.**没有 provenance，也没有独立 verifier**❖ Trois mesures de réduction peuvent être prises pour traiter ce problème:

1. **每次写入都标注 provenance。**Chaque entrée dans l'état communes sont enregistrées par qui écrit, quand écrit, à quel moment écrit, ainsi que par l'agent qui cite la source.
2. **对写入做 versioning；把它们视为 append-only。**修正 est une nouvelle entrée, utilisée pour remplacer l'ancienne entrée, plutôt que d'être original·更新──audit trail 会被保留──
3. **至少保留一个无法写入共享状态的 Agent。**Lire uniquement l'agent de vérification 抽样输入、重新获取来源,并标记不一致──因为它不能写入池,所以它不会被池毒──

### Le tableau noir 先例 (Hayes-Roth, 1985)

Le Blackboard 模式比LLM agents早了四十年──Hayes-Roth(1985,A Blackboard Architecture for Control) décrit des experts: ils observent un tableau noir à l'échelle mondiale, contribuent à des solutions partielles,并触发其他来源── CA-MCP、Matrix) est le même modèle, il n'y a qu'à utiliser les agents LLM 作为知识来源, à utiliser des blocs JSON 作为部分解决方案── les anciens textes ont déjà enregistré l'écriture, le contrôle opportuniste, la cohérence, tandis que le système moderne les redécouvre──

### Projection par rapport à vue complète

純黒板 会給每名購買者同等的投影 (→ 限定) ∼ 更多激进的设计是 ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼     ∼ ∼                                                                                                                                        **per-agent projection**: chaque agent obtient une vue personnalisée en fonction de son rôle. Les réducteurs d'état de la LangGraph sont la norme de 2026 pour réaliser la fonction de réduction.

La projection par agent est plus forte, mais elle a besoin d'un schéma.

### Contenu écrit 模式

Plusieurs agents sont inscrits dans une concurrence  problème, pas seulement LLM  problème    

- **Sequential writer（single producer）。**Toutes les écritures sont réalisées par un agent de coordination.
- **带 versioning 的 optimistic concurrency。**Chaque entrée a une version; l'auteur en version ne correspond pas 失败并重试──经典数据库技术──
- **Topic partitioning。**Il n'y a pas de différence entre les sujets. Il faut des limites de partition bien conçues.

La plupart des écrivains utilisent des écrits séquentiels, parce que le LLM est assez lent, ce qui rend les discussions très rares, et les effets ne sont pas grands.

### Vérifieur incontournable

Les mesures de réduction les plus importantes sont le vérificateur à lecture seule.

- Vérifieur et équipe de partage de l'état de l'équipe ([[读取 blackboard或 pool) ]]
- Verifiant  Aucun état de partage de la manche d'écriture  seulement peut écrire dans un canal de vérification unique。
- Verifier 独立获取 écrit 中引用的来源──标记分歧──
- Le vérificateur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

 sans cette séparation, le vérificateur de l'entrée en rencontre devient de nouvelles entrées dans la piscine, ce qui signifie que la piscine de poison sera le vérificateur de poison, tandis que le vérificateur sera également le vérificateur de poison de ses propres vérifications


```figure
swarm-blackboard
```

## - Je le construis.

`code/main.py`Avec Python, deux types de détections ont été réalisées, ainsi qu'une attaque d'empoisonnement de jouets et trois mesures de réparation.

- `MessagePool` 线程安全的附录-only log,支持完整读出──
- `Blackboard`  按主题按键的 pub/sub,支持每代理订阅──
- `ProvenanceEntry` Chaque fois que je suis en train de écrire, j'ai écrit un livre.
- `PoisoningScenario` 运行一个三 代理研究任务, dont l'agent A 幻觉出小数点――印印最终报告――
- `Verifier` Un agent à lecture seule, va recueillir les sources et s'identifier à des désaccords.

运行:

```
python3 code/main.py
```

预期输出:
- Retour à l'article 1 (sans vérificateur): 42% de la réaction sera diffusée jusqu'au rapport final.
- Exécuter 2(a vérificateur):verifier 标记不一致,pool 被标记为 旗,最终报告包含撤销──

## Utilisez-le

`outputs/skill-memory-auditor.md`C'est une compétence, utilisée pour vérifier la mémoire partagée de tout système multi-agent, la conception, la vérification de l'origine, la version et la séparation du vérificateur.

##  La publier

Pour toute mémoire partagée:

- Chaque fois que vous écrivez, vous avez des documents de provenance:`(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`Il y a une autre.
- 让日志保持 appendice-only──Corrections sont citées pour être remplacées par les nouvelles entrées──
- 部署 au moins un agent vérificateur à lecture seule ayant un accès source indépendant.
- La sortie du vérificateur sera effectuée par un canal unique, plutôt que partagée.
- Les rapports de sursession dans les écrits en moyenne  Le taux de surclassement par exemple est une preuve précoce des schémas d'hallucinations。

## 练习

1. 运行  référencement`code/main.py`Confirmer que la première course se propage et la seconde la saisir.
2. 添加第二幻觉:agent B 编制一个数据集尺寸──verifier 应该能够捕获两者,而不需要针对任一情况手工调优──
3. 将 plein de piscine 切换为带 les partitions de thèmes(`prices`- Je suis là.`summaries`- Je suis là.`analyses`La partition des sujets va-t-elle rendre les scénarios d'empoisonnement plus difficiles à mettre en œuvre, et celles qui n'ont pas été aidées ?
4. 阅读 Hayes-Roth(1985,A Blackboard Architecture for Control) .
5. 阅读 CA-MCP(arXiv:2601.11595)。将其 Communiqué de contenu Store 映射到 `code/main.py`Quelle classe de message pools ou de tableau noir CA-MCP a ajouté en plus ?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Message pool | “Shared chat history” | 每个 Agent 都会读取的 append-only log。完全透明，但扩展性差。 |
| Blackboard | “Shared workspace” | 按 topic keyed 的 pub/sub。Agent 订阅相关 topics。扩展更远。 |
| Provenance | “谁写了什么” | 每次写入的 metadata：writer、timestamp、prompt、sources。 |
| Memory poisoning | “幻觉在扩散” | 一个 Agent 的错误进入共享状态，下游 Agent 将其当作事实。 |
| Append-only | “没有原地更新” | Corrections 是用来 supersede 的新 entries。保留 audit trail。 |
| Unwritable verifier | “Independent auditor” | read-only Agent，会重新获取 sources 并标记不一致。 |
| Projection | “Scoped view” | 从 global state 计算出的 per-agent view。LangGraph reducers 是规范案例。 |
| Knowledge Source | “Specialist agent” | Hayes-Roth 在 1985 年对 blackboard participant 的称呼。 |

## 延伸阅读

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST taxonomie; intoxication par la mémoire est une défaillance de coordination
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) Utilisé pour coordonner les serveurs MCP du Commerce de Context partagé
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686)  basé sur la file d'attente de messages, pas d'orchestre central
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Projection par agent dans le produit 模式
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Notes de provenance et de vérification du département de production
