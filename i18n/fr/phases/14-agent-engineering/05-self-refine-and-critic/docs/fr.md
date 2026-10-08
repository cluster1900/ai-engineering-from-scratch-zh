# Autorefinition et critique:

> Self-Refine(Madaan et al., 2023) permet à un LLM de jouer dans le cycle trois rôles: générer, feedback, raffiner. Average profit: sur 7 tâches, il est absolument amélioré +20―CRITIC.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 分钟

## Objectif de l'apprentissage

- Il a expliqué pourquoi l'histoire de l'auto-réfinition est importante.
- 解释Critic 的关键洞见: pas de fondation externe 时,LLMs 在自我验证上不可靠──
- 实现一个带历史 和可选外部验证器的 stdlib Self-Refine loop。
- Mettre ce modèle en valeur dans les couloirs de sortie de l'optimisateur-évaluateur de Workflow et du SDK OpenAI Agents.

##  problématique

Un agent a produit une réponse presque exacte. Peut-être une ligne de code a une erreur de syntaxe. Peut-être un résumé.

L'auto-réfinition indique: avec un seul modèle, pas besoin de données de formation, pas besoin de RL, il peut également le faire. Mais il y a un problème: les LLM ne sont pas doués pour les faits difficiles, faire l'auto-vérification.

Ces deux articles définissent ensemble le modèle de mise à niveau de l'année 2026: générer, vérifier, affiner, arrêter, passer par le vérificateur.

## 概念

### Autorefinition (Madaan et al., NeurIPS 2023)

Un LLM, trois rôles:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

Je suis en train de faire une petite histoire.`refine`Il y a une histoire complète, c'est-à-dire toutes les critiques et les critiques précédentes, donc il ne se reproduit pas d'erreur.

Le résultat principal: une augmentation absolue de +20 a été réalisée en moyenne sur 7 tâches (math, code, acronyme, dialogue), y compris GPT-4― sans formation, sans outils externes, sans modèle unique―.

### CRIQUE: le projet de loi de la Commission sur les droits de l'homme (CITRICIQUE)

La réflexion sur la réflexion de l'auteur est un phénomène qui a été décrit comme un phénomène de réflexion.`verify(task, output, tools)` remplacement `feedback(task, output)`, parmi lesquels `tools`Les éléments suivants:

- Utilisé pour les affirmations factuelles.
- Utilisé par l'interprète de code de la correction du code.
- Avec une calculatrice d'arithmétique.
- ☐ les tests de type sont effectués par des équipements de contrôle de type.

vérificateur va générer une critique structurée basée sur les résultats des outils, puis un raffinateur, basé sur cette critique, effectuera une réécriture.

核心结果:CRITIC dans les tâches de fait est supérieur à l'auto-réfinition, parce que la critique a un fondement.

### 停止条件

两种常见形态:

1. **Verifier 通过。**Externe test  retour à succès 有可用条件时首选 Unit tests type checker guardrail assertion)
2. **没有发出 feedback。**Le modèle dit que la sortie est bonne.

2026 默认做法:组合二者──如果验证器通过,或模型说好且转变 >= 2,或转变 >= max_转变,则停止──

### Évaluateur-Optimisateur (Anthropic, 2024)

Anthropic en 2024 en décembre de l'article en l'appelant à cinq types de flux de travail.

- Évaluateur: donne à la production et à la production de critiques.
- Optimisateur: selon la critique 修订输出。

循环直到 evaluator 通过──这就是Anthropic表述中的自我精炼/CRITIC──Anthropic 补充的关键工程细节是:

### Garde-roue de sortie OpenAI Agents SDK

Le SDK OpenAI Agents va utiliser ce modèle comme un gardien de sortie  提供──garderil est en validateur de l'agent, le dernier sortie sur le réseau                                                                                                                                                                                                                                          `OutputGuardrailTripwireTriggered`Les gardiens peuvent utiliser des outils de style critique, ou peuvent être des fonctions pures de style auto-réfiné.

### 2026 année de la fosse

- **Rubber-stamp loops。**Le même modèle avec le même style rapide faire la génération 和 critique, sera reçu jusqu'à  me semble bon── utiliser différentes instructions sur la structure, ou utiliser un modèle plus petit、 plus abordable faire la critique──
- **过度 refine。**Chaque fois que vous passez à la perfection, vous augmentez la latence et les jetons.
- **在 trivial tasks 上使用 CRITIC。**Si vous n'avez pas de vérificateur externe, CRITIC se dédoublera pour l'auto-réfinition; ne payez pas de latence pour le vérificateur de stub.


```figure
self-refine
```

## - Je le construis.

`code/main.py`Dans un jouet, une tâche de mise en œuvre de l'auto-réfinition et de la critique: donner un sujet déterminé, générer une liste de balles courte, vérificateur, vérification de format, trois balles, chacun inférieur à 60 caractères, CRITIC, augmenter un vérificateur de faits externe, pour punir les hallucinations connues,

组件:

- `generate` producteur du scénario
- `feedback` Autoscritie au style de la maîtrise de la loi 
- `verify_external` vérificateur fondé de style CRITIC。
- `refine` 根据历史 改写输出──
- Condition d'arrêt  vérificateur 通过或最多 4次反复──

运行:

```
python3 code/main.py
```

Comparer l'auto-réfigurabilité et les résultats de la mise en œuvre de CRITICS.

## Utilisez-le

L'optimisateur d'évaluation de l'Anthropic est utilisé dans le langage convivial de Claude pour exprimer ce modèle. Les barreaux de sortie de OpenAI Agents SDK sont présentés en forme CRITIC. Les barreaux peuvent être utilisés en mode outil.

## Je le livre.

`outputs/skill-refine-loop.md`La mise en œuvre de la politique de stop-policy, en fonction de la forme de la tâche, de la disponibilité du vérificateur et du budget de l'itération, de la configuration du cycle évaluateur-optimisateur, du générateur de sortie, de l'évaluateur/verificateur et de l'optimisateur.

## 练习

1. Utiliser le plus possible pour faire fonctionner ce jouet.
2. Pour remplacer le vérificateur externe par un vérificateur bruyant, il y a 30% de faux positifs.
3. 实现一个 generator-critic on different models 变体:big model 生成,small model critique──它能胜过同样模型?
4. 阅读Critique Section 3 ((arXiv:2305.11738 v4) 说出三类验证工具类,并为每类给出一个例子──
5. Pour OpenAI Agents SDK `output_guardrails`映射到Critic's verifier role──SDK Faire quoi, faire quoi ?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Self-Refine | “会修复自己的 LLM” | 在一个 model 中执行 Generate -> feedback -> refine loop，并带 history |
| CRITIC | “Tool-grounded verification” | 用外部 verifier（search、code、calc、tests）替换 feedback |
| Evaluator-Optimizer | “Anthropic workflow pattern” | 两个角色：evaluator 打分，optimizer 修订，并循环到收敛 |
| Output guardrail | “Post-hoc check” | OpenAI Agents SDK validator，在 agent 生成输出后运行 |
| Verify step | “Critique phase” | 承重决策点：grounded 还是 self-rated |
| Refine history | “Model 已经尝试过的内容” | 先前 outputs + critiques 被前置到 refine prompt；去掉后质量会崩塌 |
| Rubber-stamp loop | “Self-agreement failure” | 相同 prompt 的 critique 返回 “looks good”；用结构上不同的 prompts 修复 |
| Stop condition | “Convergence test” | Verifier 通过，或没有 feedback 且达到 iteration cap；绝不能只有单一条件 |

## 延伸阅读

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 经典 papier
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) vérification fondée sur des outils
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) modèle de flux de travail évaluateur-optimisateur
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/)  comme gardages de sortie de vérificateurs en forme de CRITIC
