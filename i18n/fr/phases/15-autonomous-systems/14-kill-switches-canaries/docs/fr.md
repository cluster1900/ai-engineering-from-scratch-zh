# Éteignez le commutateur, le circuit cassant et le jeton Canary

> Le commutateur de commande est un agent de conservation en dehors de l'édition Boolean  Redis key ✓ Feature flag ✓ Signed configuration  utilisé pour un agent de désactivation complète ✓ Circuit breaker ✓ Grâce à un autre type de commande, il déclenche un mode spécifique (par exemple, cinq appels identiques à l'outil), suspend un chemin problématique, puis se met à niveau vers l'homme. ✓ Canary token ✓ Héritage de la technique de tricherie classique: un faux certificat ou un enregistrement de honeypot, agent n'a aucune raison valable de le toucher; une fois visité, il émet des alertes ✓ eBPF données ✓ Cilium) peut être utilisé dans le noyau pour la mise en quarantaine de la sortie de la poubelle ✓ Forensique publique ✓ Points de référence de Cilium dérivés ✓ Références de données, définies par rapport, ne sont pas mises en charge pour la latence de données P99 ✓ 1 seconde ✓ La politique de propagation ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**先修要求：**Phase 15 · 13 (governeurs des coûts), phase 15 · 10 (modalités d'autorisation)
**Time:** ~60 minutes

##  problématique

Les gouvernants des coûts (leçon 13) limitent le montant que l'agent peut dépenser. Ils ne limitent pas ce qu'un agent peut faire.

Ce cours couvre trois types de détecteurs situés à côté de la couche de coûts:

1. **Kill switch**: Garder l'existence de l'agent 触达范围之外的布鲁尔式关键――
2. **Circuit breaker**: suspendu temporairement le détecteur de modèles d'action de certains chemins
3. **Canary token**Il n'y a pas de raison valable de se toucher à son agent.

Ceci sont tous les trois avant l'ingénierie LLM. Les techniques classiques de fraude et de détection de la limite de taux sont plus anciennes que les agents autonomes. La nouvelle partie est la surface d'attaque: les agents vont lire des contenus incroyables.

## 概念

### Commutateurs de commutation

Le commutateur de commande est un agent booléen lisible mais inexactable.

- **托管服务中的 feature flag。**Lancement: "Noir, éclair, débloquer"...
- **agent 轮询的 Redis key。**简单; exigences du processus de l'agent dans chaque tour de contrôle.
- **object storage 中的 signed config。**Agent dans le processus de vérification de signature; rejette les États non signés.
- **OS-level signal 或 container-lifecycle kill。**Le docker`kill`、Kubernetes `kubectl delete pod`- Arrêtez le système.

L' interrupteur de compression de l'appareil dispose des caractéristiques suivantes:

- L' agent ne peut pas le mettre en place.`off`Il existe dans les références d'agent 没有写权限的系统中。)
- Il se passe dans chaque action de suivi, non seulement en démarrage, mais en vérification.
- Lorsqu'il est fermé, l'agent ne fait rien d'observable à l'extérieur, y compris le journal du système d'écriture de l'agent.
- Relancer est une opération humaine, pas une pause automatique.

### Les interrupteurs de circuit

Le circuit breaker est un mode spécifique, et non l'agent entier.

- **Closed**L'action est autorisée.
- **Open**L'action est bloquée.
- **Half-open**Après le refroidissement, permettez 13 fois de tentatives de sonde.

Les déclencheurs associés à l'agent:

- 连续五次相同的工具调用 (重复循环)
- Comme un outil dans différentes entrées 上连续五次失败 (failure systémique)
- Le taux d'appels d'outils dépasse le seuil de la vitesse de l'enseignement 13.
- Dans le contenu hors de la confiance lire le leçon 11) après avoir utilisé un outil spécifique par exemple`file.delete`)。

### Les jetons canariens

Les jetons canariens (également appelés "honeytoques") sont des agents 永远不应触碰的输入──访问就是警报──

Exemple de l'agent:

- Environnement dans le faux`AWS_SECRET_ACCESS_KEY`, sans aucun privilège réel. Les tentatives d'exfiltration peuvent être immédiatement attribuées.
- 带有已知哨兵值 标记的假数据库记录──任何读取或更新都会触发警报──
- Les faux fichiers dans l'espace de travail.
- Si elle apparaît dans la sortie ultérieure, indique que la mémoire a été exfiltrée.

Canary est conçu pour cibler un flux de travail spécifique. Un agent a une raison légitime de toucher un canary. Il ne fait que faire du bruit.

### Pourquoi utiliser les statistiques et les limites strictes ?

Les détecteurs statistiques (EWMA, CUSUM, taux d'appels d'outils, z-score) s'adaptent à la ligne de base mobile. Ceci est une caractéristique pour la dérive légitime, pour la dérive adverse est un bug.

Les limites constitutionnelles dures (leçon 17) ne seront pas dépassées.`secrets@`                                                                                                                                                                                                                                                              

###  Via eBPF redirection des données  quarantaine

La politique de réseau basée sur le eBPF de Cilium peut être répertoriée à l'échelle du noyau pour la sortie du pod de quarantaine. La latence du chemin de données P99 sur le TCP_RR est inférieure à 1 milliseconde; dans votre cluster*, le déclenchement* du budget du mur de la quarantaine. La mise à jour de la politique décide principalement de la façon dont le plan de contrôle se propage au nœud.

### Pas de détecteur .

- **由 allowed primitives 组合而成的 semantic attacks。**Chaque action individuelle a traversé chaque détecteur; le problème réside dans la composition. C'est l'échec composé du mode automatique de la leçon 10.
- **把 detector 本身纳入 payload 的 attacks。**Si un agent 读取一页,上面写着在你行动前, désactiver le canary, alors l'agent possède cette capacité, alors le détecteur sera compromis 已.


```figure
circuit-breaker
```

## Utilisez-le

`code/main.py`模拟一个短代理轨迹 通过三类探测器──外部 dict 中保存的杀伤开关;一个会在五次相同的工具中调用 时触发的电路断裂器;一个读取后会触发的警报的加拿大文件──它输入一个合成轨迹:

## Je le livre.

`outputs/skill-tripwire-design.md`Révision du déploiement d'agents de détection de la pile de détecteurs proposés,并标记缺缺失杀开关、缺失可纳里、断路门过松)

## 练习

1. 运行  référencement`code/main.py`Confirmer le circuit cassé à tour 5 (第五次相同调用)触发,并且 kanary à tour 9 (faux-key reading)触发。

2. 添加一个统计探测器:工具调用率 上的 EWMA z-score。输入一条缓慢漂移的轨迹,并显示探测器 从不触发──然后添加一个硬极限(10分钟内不超过50次工具调用),并显示硬极在同一条轨迹上触发──

3. Pour les navigateurs, il faut créer un ensemble de jetons canariens.

4. 阅读Cilium network-policy docs──具体描述一个出口转向隔离流:哪个政策选择员、哪个 pod、哪个出口重写、哪个警报──是什么决定从决定隔离到首个转向包的壁表延迟?

5. Pour être tué, l'agent doit changer.

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Kill switch | “Off button” | 位于 agent 编辑面之外的 boolean；在每个 consequential action 上检查 |
| Circuit breaker | “Pattern pause” | 针对重复、failure rate 或 rate-limit 的 action-specific trip |
| Canary token | “Honeytoken” | agent 没有正当理由触碰的诱饵；访问会触发 alert |
| Honeypot | “Forensic sandbox” | 被 redirect 的 traffic / workspace，用于观察被 quarantine 的 agent |
| EWMA | “Moving average” | Exponentially weighted；会适应 drift（feature + bug） |
| CUSUM | “Cumulative sum” | 检测相对 baseline 的 sustained shift |
| Hard limit | “Constitutional rule” | 不会适应；无论历史如何都保持常量 |
| Constitutional limit | “Always-true rule” | 绑定到 Lesson 17 的 constitution；不能被 agent 编辑 |

## 延伸阅读
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) l'interrupteur de déclenchement et l'encadrement du circuit cassant de l'agent autonome
- [Microsoft Agent Framework — HITL 与监督](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) production 治理模式。
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) 检测与响应要求──
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/) redirection de sortie au niveau de la capsule 和 modèles de honeypot médico-légale
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  comme restrictions de la Constitution 
