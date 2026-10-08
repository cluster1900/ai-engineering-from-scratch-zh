# 失效模式  MAST、Pensement de groupe、Monoculture、Erres de cascade

> La taxonomie de référence pour l'année 2026 est:**MAST**(Cemri et coll., NeurIPS 2025, arXiv:2503.13657), il est issu de 7 个 state-of-the-art open-source MAS 的 1642 条执行 trace,显示出 **41–86.7% 的失败率**❖ trois catégories:**Specification Problems**(41,77%) 角色歧义、任务定义不清;**Coordination Failures**(36,94%) 通信中断、 désynchronisation de l'état;**Verification Gaps**(21,30%) 缺少验证 缺少质量检查──**Groupthink**Famili(arXiv:2508.05687) complétait:effondrement de la monoculture(Same base model → 相关失败)  biais de conformité(agents 相互强化彼此的错误)  déficient théorie de l'esprit、dynamique mixte-motive、 cascade de défaillances de fiabilité。级联示例: tempêtes de retraite, dont une échec de paiement 触发订单反复,进而触发库存反复,最终压库存服务几秒内 10x load  需要电路断断机)  Poison de mémoire: une hallucination d'un agent 进入共享记忆,下游代理将准其当事率下降;确逐渐,使根原因 诊断变得痛苦──**STRATUS**(NeurIPS 2025) rapporté, par le biais d'agents spécialisés de détection / diagnostic / validation, de réussite de l'atténuation 提升 1.5x──本课把失败模式 视为一等工程目标──

**Type:** 学习
**Languages:** Python (stdlib)
**前置要求:**Phase 16 · 13 (mémoire partagée), phase 16 · 14 (consensus et BFT), phase 16 · 15 (topologie du vote et du débat)
**Time:** ~75 分钟

##  problématique

Les systèmes multi-agents ont un taux d'échec de 41 à 86,7% dans les tâches réelles. Cemri et coll. 2025 en 7 MAS open source.

La pratique de production de 2026 est de mettre en place des modes d'échec lorsque la conception est introduite. Votre architecture ne peut que se concentrer sur chaque catégorie MAST et de dire que lorsque l'atténuation de la déploiement est réalisée, le calcul est suffisamment bon.

## 概念

### Catégories MAST

**Specification Problems（41.77% 的失败）。**Les tâches de l'agent sont définies de manière assez stricte.

- L'ambiguïté du rôle: deux agents se considèrent comme des critiques.
- Les tâches sont sous-définies: l'utilisateur veut un angle spécifique, mais il a simplement dit:
- Critères de réussite implicites: l'agent ne peut pas se juger de son succès.

Les atténuations:
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- Chaque tâche est testée avec des tests d'acceptation.
- Vérifie les spécifications pré-vol: un agent unique à l'expédition

**Coordination Failures（36.94%）。**La communication ou l'état interrompu.

Pour le cas:
- Deux agents ne partagent pas l'état de l'État sans synchronisation.
- Messages entre les agents 丢失(failure de la file d'attente タイムアウト)
- Départ de l'État: l'agent A considère que la tâche est accomplie; l'agent B est toujours en exécution.

Les atténuations:
- 带版本的共享状态, utiliser une concurrence optimiste
- Pour les messages clés faire une reconnaissance manifeste (retry until acked)
- 定期 checkpoints de synchronisation de l'État;尽早检测漂移──

**Verification Gaps（21.30%）。**Pour les exportations, aucune inspection indépendante.

Pour le cas:
- Un agent qui affirme réussir, il n'y a personne pour prouver.
- Une série d'agents ont fait confiance à l'un de leurs clients.
- Pour les comportements composés émergents, la couverture des tests est insuffisante.

Les atténuations:
- 独立验证代理 (leçon 13) ・Lire uniquement, accès à source indépendante。
- Le contrat de livraison est ouvert: A de la sortie doit être passée par le contrôleur C,B 才能开始──
- Pour une analyse post hoc, il est nécessaire de noter les résultats de l'analyse.

### La famille de la pensée de groupe (arXiv:2508.05687)

Lorsque les agents sont assimilés ou imités les uns les autres, il y a cinq types d'échecs:

**Monoculture collapse。**Comme le modèle de base ou les données de formation → 相关错误──当三代理 共享一个LLM时,它们也共享它的幻觉──

**Conformity bias。**Les agents sont les plus forts ou les plus confiants, même si c'est faux.

**Deficient ToM。**Les agents ne peuvent pas se faire croire les uns les autres; la coordination est en train de s'effondrer.

**Mixed-motive dynamics。**Les agents ayant des incitations partiellement cohérentes se déplacent vers un mode de distribution intermédiaire, le résultat qui ne les satisfait pas.

**Cascading reliability failures。**Un modèle d'erreur d'un composant 触发依赖组件中的 erreurs

### Exemple en cascade  la tempête de réessayer

Un classique modèle d'incidents de 2026:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

La modification est une pratique classique:**circuit breakers** Le taux d'erreur dépasse le seuil 时, avec des résultats cachés ou par défaut 短路──再加上每一个请求的限额重试预算──

Les interrupteurs de circuit sont l'une des rares mesures d'atténuation des défaillances multi-agents qui peuvent être utilisées directement à partir de systèmes distribués sans modification.

### Une intoxication de mémoire

De la leçon 13: Une hallucination d'un agent devient un fait de mémoire partagée; les agents suivants sont fondés sur des faits contaminés.

Les symptômes sont de plus en plus faibles. Vous ne serez pas écrasé.

L'atténuation: le log d'origine non écrit est uniquement appliqué.

### STRATUS  agents spécialisés pour la détection des défaillances

STRATUS(NeurIPS 2025) rapporté, lorsque vous déployez les rôles suivants, l'atténuation-succès 提升 1.5x:

- **Detection agent。**监视 symptômes de la maladie ]]
- **Diagnosis agent。**给定症状, de la taxonomie MAST 推断可能根原因──
- **Validation agent。**Dans l'application de l'atténuation, les symptômes du contrôle sont éliminés.

C'est une réponse à des incidents de type SRE appliquée aux systèmes d'agents.

### L'audit en mode défaillance

Les meilleures pratiques pour 2026 sont de réaliser une vérification en mode défaillance par an (ou par majorité):

1. **Trace sample。**收集约1000 条 vrais traces d'exécution
2. **Categorize。**Pour chaque trace de défaillance, carte à MAST + catégories de pensée de groupe
3. **Compute failure-by-category rate。**Quelles sont les catégories qui guident votre système ?
4. **Rank mitigations。**Quel remède peut éliminer le plus de défaillances ?
5. **Pick 2-3 mitigations。**实现;下季度重新审计──

Il n'y a pas de vérification, de défaillance, de bruit, de traitement systématique.

### Quand les systèmes échouent silencieusement

La catégorie de défaillance la plus dangereuse est la défaillance de la correction silencieuse. Un système qui ne fonctionne pas correctement peut être surveillé. Un système qui produit des résultats plausibles mais erronés ne peut pas passer par les journaux d'exception. C'est pourquoi les lacunes de vérification ne représentent que 21,30%, mais elles sont considérées comme les plus chères.

投资于:
- Examen humain basé sur des échantillons.
- Tests de régression de l'ensemble de données doré:
- Pour des exportations importantes, des contrôles interagents sont effectués.

### Échec par rapport à échec lent

Quelques défauts sont immédiats; certains sont lentes. Quelques défauts sont immédiats.

2026 年の工程动作:instrument slow-failure proxies, de sorte que vous pouvez être en dérive 变成可见错误之前捕获它──Accord rate、retry rate、output-length distribution, ainsi que la continuité de la distance entre les versions de l'agent  sont des proxies utiles──


```figure
a5-retry-cascade
```

## - Je le construis.

`code/main.py`实现:

- `FailureTaxonomy` 将模拟事件 分类为 MAST + Groupe de réflexion
- `CircuitBreaker` 经典模式;当错误率 超过门时打开。
- `RetryStormSimulator` 展示 cascade défaillance;切换 circuit breaker en / hors-
- `DetectionAgent` matcheur de symptômes de style STRATUS avec script.

运行:

```
python3 code/main.py
```

预期输出:
- 没有 circuit breaker 的重试暴风雨:erreurs d'inventaire 爆炸式增长(模拟)
- Il existe un circuit cassé: dans le seuil de la couverture, il fournit des réponses en mode dégradé.
- agent de détection 标记该模式并命名 MAST catégorie。

## Utilisez-le

`outputs/skill-mast-auditor.md`Pour le système multi-agent 运行 MAST-style de l'audit de mode de défaillance。Traces → catégorisation → classification de l'atténuation。

##  La publier

Discipline en mode échec:

- **每季度 MAST audit。**Les catégories seront modifiées au fur et à mesure que le système grandira.
- **到处部署 circuit breakers。**Pour chaque appel sortant de tout service dépendant, le seuil d'ouverture par défaut est de 5 à 10% de taux d'erreur.
- **Golden datasets。**Il est également possible de faire des tests de régression hebdomadaires.
- **STRATUS trio。**Détection + Diagnostication + Validation agents  surveillance de la production―, d'abord seulement par agent de détection  commencer; lorsque les symptômes sont bruyants 时再添加诊断―,
- **Failure budget。**Pour la catégorie 统计的失败率 设定显式SLO──超出预算 会触发停止-shipping conversation──

## 练习

1. 运行  référencement`code/main.py`Confirmer le circuit court limité la tempête de réessayer, régler le seuil de défaillance, observer les écarts.
2.  réaliser un **slow-failure proxy**Le taux d'accords entre les agents de même traction: 3 个                                                                                                                                                                                                                                                       
3. 阅读 Cemri et al. 阅读 Cemri et al. 阅读 Cemri et al. 阅读 Cemri et al. 阅读 Cemri et al. 阅读 Cemri et al. 阅读 Cemri et al. 阅读 Cemri et al. arXiv: 2503.13657) 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅
4. 阅读 Groupthink paper(arXiv:2508.05687)。识别五种模式 中哪一种在生产中最难检测──proposer une métrique proxy──
5. Pour que vous compreniez un système multi-agents spécifique, concevez un trio de détection-diagnostic-validation de style STRATUS.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | “2026 taxonomy” | Cemri 2025；3 个根类别 + 14 个 failure sub-types。 |
| Specification Problem | “Role ambiguity” | 任务或角色定义不足；agents 不知道该做什么。 |
| Coordination Failure | “State drift” | agents 之间的通信或同步中断。 |
| Verification Gap | “No one checked” | 输出在没有独立验证的情况下被接受。 |
| Groupthink family | “Homogeneity failures” | Monoculture、conformity、deficient ToM、mixed-motive、cascading。 |
| Monoculture collapse | “Same model, same hallucinations” | 来自共享 base model 或 training data 的相关错误。 |
| Retry storm | “Cascading error amplification” | 一次 failure 触发 retries，进而放大下游 load。 |
| Circuit breaker | “Fail fast on error rate” | 当 error rate 超过 threshold 时打开；用 default 短路。 |
| STRATUS | “Incident response trio” | Detection + diagnosis + validation agents。1.5x mitigation success。 |
| Memory poisoning | “Hallucinations propagate” | Shared-memory fact 被污染；下游 agents 基于 poison 推理。 |

## 延伸阅读
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomie MAST, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) monoculture, conformité et taxonomie des cinq familles
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) Entrée dans la procédure NeurIPS 2025 (détection + diagnostic + validation)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) 经典 disjoncteur 参考
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Notes de défaillance de la production
