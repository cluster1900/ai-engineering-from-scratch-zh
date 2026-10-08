# Modèle de routage  comme moyen de base de réduction des coûts

> Un courtier dynamique va évaluer chaque demande (type de tâche, longueur de token, similarité d'intégration, confiance), et faire une simple requête  envoyé à un modèle bon marché, faire une requête complexe  améliorer à un modèle frontalier ‒ aussi appelé modèle en cascade ‒ études de cas de production montrent que, dans les États-Unis/ Royaume-Uni/UE, la qualité des services sous-traitants peut être réduite de 20 à 60%; dans les SaaS à fort trafic, une amélioration de l'efficacité du routage de 30% ‒ Conversion en six chiffres par an ‒ Le contexte de l'année 2026 est LLM ‒ prix inférieur à 10 fois par an: de la fin des années 2022 à 2026 ‒ GPT-4-class Token ‒$20/M 降到约 $La plupart des retombées proviennent de meilleures piles de service (Phase 17 · 04-09), pas du matériel. Le routage est une méthode de réduction de prix qui ne provoque pas de régression du produit.

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**前置要求：**Phase 17 · 01 (plateformes de gestion de la gestion des droits de propriété intellectuelle), phase 17 · 19 (gateways d'IA)
**Time:** ~60 分钟

## Objectif de l'apprentissage

- Expliquer le modèle en cascade: moins cher-premier avec vérification de la confiance, faible confiance 时升级──
- 枚举四个路由信号(classification des tâches、prompte longueur、Embedding similitude à un ensemble connu-difficile、confiance de la première passe)
- Dans le segment de routage cible et la tolérance à la perte de qualité, le coût combiné attendu est calculé.
- Pour les modèles bon marché, il faut prendre en compte les mesures de surveillance de la dérive.

##  problématique

Vous avez besoin de votre analyse pour répondre à des questions très simples: "Quelle heure est-il à Paris?" "Réphrasez cette phrase".

Si vous mettez 70% de route sur un modèle bon marché, 30% sur un modèle cher, la qualité du même produit, votre facturation va baisser d'environ 65%.

## 概念

### Quatre signaux de routage

1. **Task classification**: simple/complexe/codegen/math/chat──可以是基于规则的分类器、小型LLM(Haiku-class,$0.25/M),或到标签的桶的嵌入式相似之──输出:route = pas cher / équilibré / frontière──

2. **Prompt length**:prompts >4K Token habituellement besoin de frontière pour maintenir la cohérence。prompts <500 Token habituellement pas besoin。

3. **Embedding similarity to known-hard set**Si la requête approche un seau de dureté connu, élargissez directement à la frontière.

4. **Self-confidence from first-pass**Si les tests de logs du modèle montrent une faible confiance, ou s'il refuse, ou en sortant un langage de couverture, il faut essayer de nouveau de faire environ 10% du trafic, augmenter la latence de P95, mais dans les autres 90% économiser 50%+.

### 3 modes

**Pre-route**(classificateur de préposition): augmentation de la latence d'environ 5 à 10 ms;

**Cascade**(primaire faible, faible confiance 时升): latence moyenne 约1.2x(lance peu coûteux加验证),escalade 时约2x── qualité de sol 最好──

**Ensemble route**(pour le modèle并行运行廉价 和 frontier,由奖励模型 选择): qualité maximale, coût maximal; seulement pour les A/B clés

###  réaliser

Les passerelles d'IA(Phase 17 · 19) Exposition à l'itinéraire―LiteLLM avec des retombées et des coûts de routage `router`configuration──Portkey avec des gardes + routage──Kong AI Gateway avec un routage basé sur des plugins──OpenRouter's modèle de marché  Exposition Recommandation API──

L'utilisation de l'équipement de navigation est également possible.

### 2026 价格曲线

| Model class | 2022 年末 | 2026 | 变化 |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 便宜 50x |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | 新 tier |

La plupart des améliorations sont issues de l'efficacité de service, c'est-à-dire la phase 17 · 04-09 dans la transformation des cours de base en fournisseurs de services.

### La dérive est vraiment un risque .

Votre route Donnez 40%  Envoyer à un modèle bon marché。 Six mois plus tard, la distribution des tâches  Se produit un changement(Utilisateur plus expérimenté, problème plus long)。 Le routeur  Ne remarque pas, car son classement est basé sur les données de Q1  entraînement。 Qualité  baisse。 Personne ne s'est plaint assez fort。 Vous ne vous êtes pas retrouvé dans le benchmark concurrentiel ∼

Utiliser des métriques de qualité en ligne pour la route 设门:

- Chaque route de l'utilisateur est à la hauteur / à la basse.
- Chaque route 上对持久样品 ((5%) faire automatique LLM-juge
- Taux d'escalade: si la cascade de l'élévation de la route > 30%, il est évident que le modèle bon marché est sur-roué.
- Taux de refus de chaque route:

### Tu devrais te rappeler le nombre

- 2026: économie de routing: études de cas: 20 à 60%
- Réduction des prix du LLM en 2022-2026: environ 10 fois par an.
- GPT-4 niveau 2022 contre 2026: ~$20/M → ~$0,40/M:
- Impact de la latence en cascade: moyenne d'environ 1,2 fois, augmentation d'environ 2 fois (environ 10% du trafic)


```figure
model-cascade-router
```

## Utilisez-le

`code/main.py`Réponse de la Commission à la question de la mise en œuvre de la directive de l'Union européenne sur les mesures de protection des consommateurs

## Je le livre.

本课会产出 `outputs/skill-router-plan.md` la charge de travail et le budget de qualité, la sélection du modèle de routage et des signaux.

## 练习

1. 运行  référencement`code/main.py`Dans quel étage de précision, la cascade va-t-elle gagner avant le trajet ?
2. Votre base d'utilisateurs est de 30% d'entreprises (questions complexes) ‒70% de niveau gratuit (simple) ‒ la division de routage de conception ‒ avec quoi les métriques en ligne ‒ comme passerelle ?
3.  Quelque route 让质量下降2%,但省 40%── devrait-elle être expédiée?
4. Utiliser les tests de logement des API OpenAI / Anthropic pour réaliser la vérification de la confiance.
5. En six mois, le taux d'escalade est passé de 8% à 22%.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Model routing | "cost broker" | 每个 request 动态选择 model |
| Model cascade | "cheap-first escalate" | 先运行 cheap，low confidence 时 fall through 到 frontier |
| Pre-route | "classify first" | 前置 classifier；不重新运行 |
| Ensemble route | "parallel pick" | 运行多个，由 reward-model 选最佳 |
| Escalation rate | "uprouted %" | cascade requests 中被 escalated 的比例 |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | distribution shift 发生但 router 没注意到 |
| Online quality gate | "live check" | 对 live traffic 采样做 automated LLM-judge |

## 延伸阅读

- [AbhyashSuchi — Model Routing LLM 2026 最佳实践](https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) 带 routing primitives  multi-modèle passerelle
