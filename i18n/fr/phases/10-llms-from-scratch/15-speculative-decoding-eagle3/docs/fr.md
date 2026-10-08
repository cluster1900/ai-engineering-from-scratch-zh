# Décodage spéculatif et EAGLE-3

> Phase 7 · Leçon 16  prouve la mathématique: Leviathan  rejeter les règles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16（speculative decoding math），Phase 10 · 12（inference optimization）
**Time:** ~75 minutes

## Objectif de l'apprentissage
- Utiliser une phrase pour décrire le théorème de Léviathan, et prouver que la distribution des échantillons de l'échantillon produit est en parfaite harmonie avec celle de l'épreuveur.
- Résumé de la décodation des spécifications de vanille (Leviathan 2023) à l'évolution de l'Eagle Eagle-2 et de l'Eagle-3, et indique les limites exactes de chaque étape de déménagement:
- 根据接受率 `α`和 projet à vérificateur 成本比 `c`计算期望加速,并为每种制度 选择最优草案 长度 `N`Il y a une autre.
- De la réalisation de la boucle spéculative complète: défini­tion, vérification, rejet­échantillon, rejet, ré-roullement du cache KV, acceptation totale, sortie de jeton bonus,

##  problématique
Dans le modèle 70B, le décoding autorégressif est effectué en H100, avec seulement 35 Tokens par seconde.

Le décoding spéculatif va se transformer en un véritable problème de dépôt.`N`Deuxième petit passe avant`N`个 Token──verifier  个证器 在前 加上所有 `N`个草案 上运行一次──如果验证器在位置 `i`La distribution et le projet de loi, une fois de plus, peuvent être modifiés en fonction de la distribution résiduelle.`N+1`个被接受的标志, plutôt que d'un

Le théorème clé de Leviathan, Kalman, Matias (ICML 2023): la distribution de sortie et la distribution obtenue directement de l'échantillon de l'éprouveur sont totalement conformes.

Phase 7 · Leçon 16 给你是数学──本课给你是训练── un bon projet 带来的加速价值比廉价的草案 高 2×──EAGLE、EAGLE-2 和 EAGLE-3 (Li et al., 20242025) 将草案 = 同一模型的小版本转化为一门精确的工程学科──2026年生产推理服务器默认使用EAGLE−3──

## 概念
### 不变量: prélèvement d'échantillons de rejet du léviathan

Pour faire`p(t)`Indiquer la répartition d'un jeton dans un préfixe,`q(t)`Indiquer la distribution de l'étiquette `d ~ p` Dans la probabilité`min(1, q(d) / p(d))` acceptation  refusation  distribution résiduelle `(q - p)_+ / ||(q - p)_+||_1`Dans le cas présent, il est possible de faire une demande de règlement.`q` quoi qu'il en soit `p`Il y a beaucoup de refus, mais le sort est toujours précis.

Je ne sais pas .`N`Suivant la procédure suivante, utilisez un testateur pour la procédure suivante.`prefix + d_1 + ... + d_N` Les vérificateurs vont retourner en même temps `q_1, q_2, ..., q_{N+1}`                                                                                                                                                                                                                                                              `j`La première fois que je refuse,`residual(q_j, p_j)`采样并停止──若全部接受,则从 `q_{N+1}`Comme un jeton bonus.

### Ce qui détermine la vitesse

Pour faire`α`Pour chaque jeton élaboré, le taux d'acceptation est attendu.`c = cost(draft) / cost(verifier)`Pour le coût comparatif, l'attendance de l'avant de chaque testateur pour accepter un jeton est:

```
E[accepted] = (1 - α^(N+1)) / (1 - α)
```

Chaque acceptation de jeton est une attente totale de temps de paroi`(N * c + 1) / E[accepted]`◊ par rapport à `N`Pour le plus petit, on peut obtenir le meilleur point.`α = 0.8, c = 0.05`: le meilleur `N`Il est environ 57, accélération de 3,2 x...`α = 0.95, c = 0.02`: le meilleur `N`C'est environ 810°, accélérer près de 5°.

Le plus grand est le plus grand.`α`                                                                                                                                                                                                                                                              `N = 5`时, de `α = 0.6`(projet de vanille)`α = 0.9`(EAGLE-3), permettra à chaque vérificateur de faire avancer l'attente d'accepter un jeton de 2,2 à 4,1...

### La progression de deux ans

**Vanilla speculative (Leviathan, 2023).**Le modèle de projet est un modèle de formation indépendante dans la même famille.`α ≈ 0.6`C'est mieux, seulement 2 fois plus vite.

**EAGLE-1 (Li et al., 2024).**Le projet est un transformateur de type micro, généralement de 1 à 2 couches, il est utilisé comme un dernier couche de l'émetteur de test dans l'état caché de l'émetteur de test en tant qu'entrée et prédiction directe du prochain jeton.`α`Il est passé à 0,70,8...

**EAGLE-2 (Li et al., 2024).**加入动态草案树:不是提出单条包含 `N`个 Token 的序列, mais de proposer un petit candidat tree, avec un éprouveur à l'avant(l'attention du arbre) pour chaque candidat打分, puis le long du chemin de la plus haute probabilité  Définition 长度会在每一步自适应变化──接受路径 Token 的 `α`Il est passé à 0,85 et plus.

**EAGLE-3 (Li et al., 2025, NeurIPS).**Deux modifications ont également été apportées. Premièrement, la perte de fonctionnalités de prédiction a été complètement éliminée: EAGLE-1/2  entraînement projet de l'état caché de l'équipe d'évaluation, ce qui a limité les bénéfices que plus de données peuvent apporter.

### Retour en arrière du cache KV

验证会在一次通过 中将验证器的KV缓存 扩展 `N`Si vous êtes en position`j`Il y a un rejet, alors.`j-1`后的缓存 内容就是错误的──常见实现有两种:写入 scratch buffer 并在接受时提交(vLLM、TensorRT-LLM),或维护一个物理KV缓存加逻辑长度,并拒绝时截断──无论如何,rollback 成本都是每个层每个头的字节,与前进通过 成本相比可以忽略──

Pour la recherche sur les arbres EAGLE-2, l'équipe de vérification utilisera le masque non-causal du masque de croissance des arbres Attention, mais le calcul est en fait une référence à la mise en garde par flash.

### Projet d'architecture en 2026

| Strategy | Draft type | `α` | Speedup | Training cost |
|----------|-----------|-----|---------|---------------|
| Vanilla | 独立小型 LLM | 0.55-0.70 | 1.8-2.3× | 无（复用现有小模型） |
| Medusa | 验证器上的额外 LM heads | 0.65-0.75 | 2-3× | ~1B SFT tokens |
| EAGLE-1 | hidden states 上的 1-layer transformer | 0.70-0.80 | 2.5-3× | ~60B tokens |
| EAGLE-2 | EAGLE-1 + dynamic draft tree | 0.80-0.88 | 3-4× | ~60B tokens |
| EAGLE-3 | Multi-layer feature fusion + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B tokens |
| Lookahead | 无 draft（Jacobi iteration） | N/A | 1.3-1.6× | 无 |

2026 ann production environnement: vLLM 和 SGLang 在可用时默认使用EAGLE-3,否则使用EAGLE-2──TensorRT-LLM 为 Meta 和 NVIDIA 公开模型提供最快的Medusa 路径──llama.cpp 为CPU 部署提供香草草案──


```figure
l5-spec-decode-eagle
```

## - Je le construis.
Je vous en prie .`code/main.py` Il s'agit d'une boucle spéculative complète de Leviathan, comprenant toutes les composantes: projet de N 、 vérificateur et passe 、 par rejet de position 、 échantillonnage résiduel 、 jeton bonus 、 KV rollback, ainsi que pour vérifier la distribution de sortie et de la distribution directe `q`采样一致的经验检查──

### 步骤 1: Résistant à la règle

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### 步骤 2: répartition résiduelle

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### 步骤 3: une étape spéculative complète

`spec_step`函数 de `p`projet `N`个 Token, puis une fois et puis une fois`q`L'évaluation entraîne la vérification de ces éléments. Elle s'applique à chaque code élaboré, et la première fois qu'il est rejeté, il y a des modifications.`q_{N+1}`输出一个奖金代币──

### 步骤 4: comptabilité de la réouverture de la KV

Un simulateur pour chaque travailleur.`kv_length` Accepter`k`个草案 时,`kv_length += k`    `j`Quand il y a un rejet, le cache est déjà écrit.`j`Mais la longueur logique sera définie.`prefix_length + j + 1`, est le symbole de correction 后一个位置──后续读取将截截至逻辑长度──

### 步骤 5: le contrôle du Léviathan

运行 50,000 个投机步骤――统计被接受 Token 的经验分布――与从 `q`直接采样 50,000 fois effectuer une comparaison  统计量应显著低于关键值  该理论在实践中成立

### 步骤 6: accélération par rapport à α

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `p`Pour le faire`q`, qualité du projet de recherche,`α`, puis dessiner différemment .`α`et `N`                                                                                                                                                                                                                                                              `α ≈ 0.9`) comment débloquer chaque testateur à l'aide de 45 Token

## Utilisez-le
Utilisation de la classe de production de l' EAGLE-3 `vllm serve`- Le numéro de la liste:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

En H100, le décodage en vanille du lot 64 utilise le SGLang de l'EAGLE-3.

适合使用 Spéculative décoding 场景:

- 任何p50 latence par rapport au sommet de la valeur de débit 更多
- 代码生成和结构化输出(JSON、SQL) ・・・`α`Plus de 0,9...
- 长文本生成 ((数千 Token) ∼ La vente de jetons après la vente de jetons continue de gagner ∼

Scène de l'événement:

- 很小的模型(<3B) ――Draft 并不比验证器便宜太多──
- 极小批-1 CPU 部署──Draft model 內存开销可能不值得──
- Une température très élevée.`α`Ça va s'effondrer.

## Je le livre.
本课会生成 `outputs/skill-eagle3-tuner.md` donner une idée de la charge de travail (model, taille de lot, latence cible, profil de tâche), elle suggère des stratégies de décoding spéculatives et des modifications de la famille de projets`N`、profondité des arbres 、interruption de la température)

## 练习
1. 运行  référencement`code/main.py` Confirmer que le chiffre de la distribution des chevaux dans le test de Leviathan est inférieur à 95% de la valeur critique sur les 50 000 échantillons 

2. Dans le`α`Fixée à 0,9 且 `c`固定 pour 0,04 时,将 `N`De 1 à 10 ⋅ tracer chaque fois que le testateur utilise des échantillons et des échantillons.`N`❖ Expliquer la forme du volet

3. Modifier le code pour le modèle EAGLE-2 recherche d'arbre: chaque étape, projet  proposé forme `[2, 2, 2]`Les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats obtenus par les résultats par les résultats obtenus par les résultats par les résultats de la recherche par les résultats obtenus par les résultats obtenus par les résultats par les résultats de la recherche par la recherche par la recherche.`α`L'analyse de la valeur de la chaîne linéaire est basée sur le nombre total de jetons utilisés par chaque testeur.

4. Pour deux séquences de mise en œuvre de la mise en lots de KV de retour 模拟器── Tous les projets de la séquence A sont acceptés; la séquence B en position 2 拒绝── montrer la validité de chaque séquence`kv_length`Toutes les données ont été mises à jour et aucune perte de travail n'a été effectuée.

5. Lire l'article EAGLE-3 Section 4 (Training-Time Test) ⋅ avec deux phrases expliquer pourquoi aucune formation naïve de projet de TTT ne sera pas exposée, ainsi que pourquoi, pendant l'entraînement, le projet de son propre prédiction contre lui donne la capacité de résoudre ce problème ⋅ en le faisant avec la littérature de prélèvement de l'échantillonnage prévu dans la seconde. ⇒

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Leviathan rule | “min(1, q 除以 p)” | 以概率 `min(1, q(d)/p(d))` 进行 Bernoulli accept/reject；当 rejection 时从 residual 中采样，可精确保留验证器分布 |
| Residual distribution | “(q 减 p) 的正部，归一化” | `(q - p)_+` 在零处截断并重新归一化，是 rejection 时应采样的正确分布 |
| Acceptance rate α | “draft 对的频率” | 在拒绝规则下，每个 Token 的期望 Bernoulli 成功概率；支配所有加速数学 |
| EAGLE-1 | “hidden-state draft” | 条件化于验证器 last-layer hidden state 的微型 Transformer draft（Li et al., 2024） |
| EAGLE-2 | “dynamic draft tree” | EAGLE-1 加上一棵候选 continuation 树，并在一次验证器 pass 中用 tree attention 打分 |
| EAGLE-3 | “training-time test” | 去掉 feature-prediction loss，基于直接 Token prediction 训练，并在训练时把 draft 自己的输出反馈给它 |
| Training-time test (TTT) | “exposure bias 修复” | 训练时以 autoregressive 方式运行 draft，使训练和测试输入分布匹配，是 scheduled sampling 的直接类比 |
| KV rollback | “撤销被拒绝的 draft” | rejection 后将验证器 KV cache 重置到已接受 prefix 长度的 bookkeeping |
| Bonus token | “免费的那个” | 当全部 `N` 个 draft 都被接受时，以零额外验证器成本从 `q_{N+1}` 额外采样一个 Token |
| Tree attention | “一次验证许多候选” | 使用尊重 draft tree 拓扑的 non-causal mask 的 Attention；在一次 forward pass 中为树中的每个节点计算 `q_i` |

## 延伸阅读
- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) 基础论文与等价性定理
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318) Les méthodes proposées par l'indépendance, preuve de clarté
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) EAGLE-1, basé sur un projet conditionné par l'État caché
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) recherche dynamique des arbres
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) 2026 année de production
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774) 另一种无草案 方法
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html)  couvrir toutes les stratégies de connexion  autorité de production référence
