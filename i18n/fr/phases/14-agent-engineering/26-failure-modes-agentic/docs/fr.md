# Les modes d'échec: les agents pourquoi vont-ils échouer ?

> MASFT (Berkeley, 2025) va regrouper 14 modes d'échec d'agents différents en 3 catégories. La taxonomie de Microsoft a enregistré les défaillances d'IA existantes.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**先修要求：**Phase 14 · 05 (auto-réfigurabilité et critique), phase 14 · 24 (observabilité)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- Expliquer les trois catégories d'échecs du MASFT et décrire au moins quatre modèles spécifiques dans chaque catégorie.
- Expliquer pourquoi l'échec de l'agent va augmenter les modes de défaillance de l'IA actuels.
- Décrire les cinq types de modes de réapparition et les méthodes de réduction de la réaction.
- 实现 un détecteur de stdlib, avec des étiquettes en mode défaillance 标注代理痕迹──

##  problématique
Les agents publiés par l'équipe sont à 90% des traces de la tâche. Les 10% restants ne sont pas des échecs de bruit aléatoire, mais se retrouvent dans une minorité de catégories récurrentes.

## 概念
### Les résultats de l'enquête ont été obtenus au cours de la première année de l'enquête.

Taxonomie des défaillances de systèmes multi-agents 聚类为 3 个类别──Inter-annotator Cohen's Kappa 为 0.88,说明这些类别可以被可靠地区分──

核心主张: les défaillances sont des défaillances fondamentales de conception dans le système de plusieurs agents, plutôt que de mieux adapter les modèles de base 修复 LLM 限制──

### Taxonomie de Microsoft du mode d'échec dans les systèmes d'IA agencés

- Il y a des défaillances d'IA                                                                                                                                                                                                                                                         
- Les nouveaux échecs de l'autonomie: action involontaire à grande échelle, utilisation abusive des outils, dérive de mission.
- Ce livre blanc est un registre des risques des produits agencés.

### Caractériser les défauts de l'IA agentique (arXiv:2603.06847)

- Échecs de l'orchestration, évolution de l'état interne et interaction environnementale
- Il ne s'agit pas seulement de mauvais code ou de mauvais modèles de sortie.

### Enquête sur les hallucinations d'agents de la LLM (arXiv:2509.18970)

两种主要表现:

1. **Instruction-following Deviation** L'agent 没有遵循系统提示──
2. **Long-range Contextual Misuse** Agent oubli ou usage erroné dans le contexte de la première phase 

Erreurs de sous-intention:Omission (s) 漏掉步骤 (s)  Redundancy (s) 重复步骤 (s)  Disorder (s) 步骤顺序错误 (s) 

### 五种行业反复出现的模式

Arize、Galileo、NimbleBrain analyse des résultats de l'année 2024-2026

1. **Hallucinated actions.**L'agent a utilisé un outil qui n'existe pas, ou a inventé des arguments.
2. **Scope creep.**L'agent va étendre sa mission au-delà des exigences de l'utilisateur (réaliser des relations publiques supplémentaires, envoyer des courriels supplémentaires)
3. **Cascading errors.**Une erreur de communication entraîne une hallucination de l'UPS fantôme, entraîne quatre appels API, devient un incident multi-système.
4. **Context loss.**长周期任务忘记早期轮次的约束――
5. **Tool misuse.**Utiliser des arguments erronés 调用正确工具, ou directement调用错误工具──

Les agents ne peuvent pas distinguer que la tâche est impossible à accomplir et qu'ils se trompent souvent dans 400 erreurs.

### Atténuation: chaque étape des portes

Dans chaque étape de la chaîne de raisonnement, la mise en place de passerelles de vérification automatique, l'état de l'environnement de contrôle  la mise en terre factuelle, notamment:

- Chaque étape de la classification de sécurité
- Validation des arguments d'appel à l'outil (leçon 06):
- Le contenu récupéré avec les faits connus 交叉检查(L'enseignement 05, CRITIC)
- 通过重新探测状态 来检测 succès hallucination(文件真的被创建了吗?)。

### surveillance des défaillances  facile de sortir errant

- **Tagging only crashes.**La plupart des échecs d'agents auront une apparence de rendement efficace.
- **No baseline.**Détection de dérive  besoin de la dernière-connue-bon; sans elle, vous ne pouvez pas juger  Ceci est en train de changer ──
- **Over-alerting.**Chaque échec produit une page. Il faut cluster et limiter le taux.


```figure
failure-cascade
```

## - Je le construis.
`code/main.py`实现 un étiquetteur de mode d'échec stdlib:

- Un ensemble de données de traces synthétiques de cinq modes.
- Chaque mode de fonctionnement du détecteur correspond à des appels d'outils, des sorties, des actions répétées, des modèles de signature).
- Un tagger, utilisé pour marquer chaque trace et le mode de distribution du rapport.

Je vais le faire.

```
python3 code/main.py
```

输出: chaque trace de l'étiquette + distribution agrégée, c'est une sorte de faible coût de réaction pour le contenu présenté dans le cluster de traces de Phoenix.

## Utilisez-le
- **Phoenix**Utilisé pour la production de clusters de dérive environnementale (leçon 24)
- **Langfuse**Utilisé pour la lecture de session + annotation.
- **Custom**Utilisé pour la plateforme d'observabilité 无法检测的域特定签名──

## Je le livre.
`outputs/skill-failure-detector.md`生成面向您所在域的故障模式探测器,并连接到追踪商店──

## 练习
1. 添加一个 成功幻觉探测器:Agent 返回成功,但目标状态 没有变化──
2. 标注 100 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条                                                                                                                                                                                                                                                                                                          
3.  réaliser une métrique de rayon de cascade: donné l'échec de la première étape, cela a affecté combien des étapes suivantes ?
4. 阅读 MASFT's 14 modes d'échec 选择──三种适用于您的产品的模式──编写探测器──
5. Pour connecter un détecteur à l'IA: si >=5% des traces sont marquées pour un certain type de mode, alors la construction 失败。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | “Multi-agent failure taxonomy” | Berkeley 14-mode categorization |
| Cascading error | “Ripple failure” | 一个早期错误会通过 N 个步骤传播 |
| Context loss | “Forgot the constraint” | 长周期轮次丢失早期轮次事实 |
| Tool misuse | “Wrong tool / wrong args” | 调用有效，但调用方式错误 |
| Success hallucination | “Faked completion” | Agent 在 400 上声称成功；state 未变化 |
| Scope creep | “Overreach” | Agent 做了超出要求的事 |
| Instruction-following deviation | “Disobedience” | 忽略 system prompt 或用户 constraint |
| Sub-intention errors | “Plan bugs” | plan execution 中的 omission、redundancy、disorder |

## 延伸阅读
- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) 14 modes de défaillance,3 个类别
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) registre des risques
- [Arize Phoenix](https://docs.arize.com/phoenix) 实践中的 clustering de dérive
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) Des modèles plus simples, parfois, on peut éviter ces modèles.
