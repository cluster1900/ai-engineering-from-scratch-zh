# Décodage spéculatif et Eagle

> La plupart du temps, un modèle plus petit peut deviner correctement les 3-5 prochains jetons, tandis que le modèle plus grand ne doit que * vérifier* cette devinette.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

##  problématique

Le décodage de chaque modèle de type 70B est généralement de 40 à 80 jetons/seconde. Chaque jeton a besoin d'un seul passage complet, de HBM à lire tous les poids du modèle.

La génération autorégressive semble naturelle.`x_{t+1} = sample(p(· | x_{1:t}))`Mais ici il y a une chance. Si vous avez un prédicteur bon marché, vous pouvez avoir les 4 prochains jetons.**大 model 的单次 forward pass**Je suis en train de vérifier toutes les positions.

Leviathan、Kalai、Matias(2023,Inference rapide des Transformers via Décodage spéculatif) par un choquant acceptation/réjection 规则精确实现这一点,该规则保留目标模型的样本分布──相同的输出分布,速度提升 2-4x──

## 概念

### 双 Modèle  définition

- **Target model** `M_p`Vous voulez vraiment partir du modèle de taille, de température, de haute qualité.`p(x)`Il y a une autre.
- **Draft model** `M_q`Modèle de petite vitesse et de qualité inférieure:`q(x)`Il y a 5 à 30 fois.

Chaque étape:

1. Projet de modèle autorégressivement 提议 `K`个 Token:`x_1, x_2, ..., x_K ~ q`Il y a une autre.
2. Modèle cible pour l'ensemble`K+1`个位置并行运行 一次前进通行,为每提议代币 生成 `p(x_k)`Il y a une autre.
3. 按下面修改后的拒绝-sampling规则 则从左到右接受/拒绝 每个代币──接受最长匹配前──
4. Si un Token est rejeté, alors la distribution de la modification suivante ne s'arrête pas.`p(· | x_1...x_K)`采样一个奖金令牌──

Si le projet correspond parfaitement à la cible, vous pouvez obtenir K+1 Token à chaque cible. Si le projet est en position 1 et que vous avez tort, vous ne pouvez obtenir qu'un Token.

###  précisations

Décodage spéculatif **在 distribution 上可证明等价于从 p 采样** Résistance 规则:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

Parmi eux `(p - q)+`Indiquer la valeur de différence de pointes.`p ≈ q`), acceptation  approximation 1 ⋅ quand elles ne sont pas conformes, la distribution résiduelle sera constituée, de sorte que l'ensemble de l'échantillon  reste précisément conforme `p`Il y a une autre.

**Greedy 情况。**Pour l'échantillonnage à température = 0, il suffit d'inspecter`argmax(p) == x_t`Si oui, acceptez; si non, faites le sort.`argmax(p)`Il ne s'arrête pas.

### 期望 Accélération

Si le taux d'acceptation du modèle de projet de jeton est `α`, alors chaque passe cible-avant 生成的期望令牌数为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

- Je suis là .`α = 0.8, K = 4`- Le numéro de la liste:`(1 - 0.8^5)/(1 - 0.8) = 3.36`个 Token Chaque fois en avant.`cost_q * K + cost_p`(K 个 ébauche étape + une fois vérifier l'objectif)`cost_p >> cost_q * K`Le taux de vitesse de la production est de`3.36× / 1 = 3.36×`Il y a une autre.

Le seul vrai paramètre est`α`C'est un projet de loi, c'est tout.

### 训练 Projet:Destillation

Le modèle de détail de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production est de la production est de la production est de la production est de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la production de la cuisine est de la Union est de la Union est de la Union est de la Union est est est est est est est est est est est est est est est est est est est est devenue.

1. 选择一个小建筑(70B objectif pour une résolution d'environ 1B,7B objectif pour une résolution d'environ 500M)
2. Dans la grande échelle du texte, le modèle cible est utilisé; il est stocké pour les distributions de jetons suivants.
3. Utilisez le projet de divergence KL, en faisant correspondre la distribution de la cible à la place des jetons de vérité de base)

Le résultat est:`α`Dans le codage, il est généralement de 0,6-0,8, dans le chat en langage naturel, il est de 0,7-0,85── la production de vitesses est de 2-3 fois.

### Eagle:Tree Drafting + Réutilisation des caractéristiques

Li、Wei、Zhang、Zhang(2024,AEGLE: L'échantillonnage spéculatif nécessite une réflexion sur les caractéristiques (incertitude) ) observer le standard de décoding spéculatif 中的两个低效点:

1. Le projet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
2. Si le projet peut produire un candidat *arbre*(à chaque élément plusieurs spéculations), le passage unique de la cible peut être effectué à travers le masque d'attention des arbres et vérifié plusieurs articles de cheminement des candidats, et sélectionné la branche la plus longue acceptée。

Évolution de l'ÉGLE-1:
- L'entrée de projet = cible dans l'état caché final de la position t, plutôt que des jetons bruts.
- Projet d'architecture = 1 个 transformer decoder layer ((不是独立的小模型) ⋅
- La sortie = chaque profondeur, il y a 4 à 8 candidats, la profondeur = 4 à 6 arbres.

EAGLE-2(2024) Addition 动态 arbre topologie: dans le projet position non déterminée, arbre 变宽; dans le projet position de confiance, arbre 保持较窄──在不增加验证成本的情况下提高 `α_effective`Il y a une autre.

EAGLE-3(Li et coll. 2025,EAGLE-3: Accélération de l'inférence des grands modèles de langage via Training-Time Test) a éliminé la dépendance à la fonctionnalité de couche supérieure fixe, et a utilisé un nouveau projet de formation test-time simulation perte entraînement, qui consiste à faire correspondre les résultats de la distribution de temps de test cible au lieu de la distribution de formation forcée par les enseignants  प्रशिक्षण.

### Vérifie l'attention des arbres

Lorsque le projet 输出树 时,target model **tree attention mask**Dans un passage à l'avant, vérifiez-le. Le masque d'attention à l'arbre est un type de masque de causalité, il code la topologie de l'arbre, et non la structure de la ligne pure. Chaque jeton ne fait que suivre les ancêtres qui l'entourent dans l'arbre.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

Si `a, b`Les candidats à la première place de la compétition,`c, d, e, f`Les candidats à deuxième jeton sont alors tous les six positions peuvent être vérifiés en une seule fois.

### Quand est-ce que ça marche ? Quand est-ce que ça marche ?

**有效：**
- Chat / complément, et文本可预测(code、常见英语、structuré de sortie)`α`Il est très beau.
- Décode 阶段有未使用GPU compute 的设置(mémoire-bound phase) ――Tree drawing 使用可用FLOPs。

**无效 / 没有收益：**
- Écriture créative à haute température)`α`Je vais voir .`1/|vocab|`Je suis en train de tomber.
- La coïncidence des lots est très élevée, les lots sont déjà remplis, l'espace de vérification des arbres est très petit.
- Très petits modèles cibles, ce projet n'a pas beaucoup de petits.

Les équipes de production rapportent généralement le chat, la vitesse du temps de travail est de 2 à 3 fois supérieure, la génération de code est de 3 à 5 fois supérieure, et l'écriture créative est de presque zéro.


```figure
speculative-decoding
```

## - Je le construis.

`code/main.py`- Le numéro de la liste:

- Une référence à réaliser`speculative_decode(target, draft, prompt, K, temperature)`, il réalise un rejet précis 规则,并验证 il conserve la distribution de la cible (en anglais seulement)
- Un dessinateur d'arbre à style EAGLE, en utilisant des branches de haut-p pour construire un arbre de profondeur K.
- Un constructeur de masques d'attention à l'arbre, pour vérifier le modèle causel correct.
- Une petite poignée de l'acceptation, dans un petit LM 上运行两者(de la cible moyenne GPT-2-destiler une petite GPT-2-)

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## Utilisez-le

- **vLLM**et **SGLang**提供一等 décoding spéculatif 支持──Flags:`--speculative_model`- Je suis là.`--num_speculative_tokens`- Il est en train de mourir.`--spec_decoding_algorithm eagle`Le drapeau 支持。
- **NVIDIA TensorRT-LLM**Les arbres de la Méduse et de l'Aigle.
- **Reference draft models**- Le numéro de la liste:`Qwen/Qwen3-0.6B-spec`(pour les projets de Qwen3-32B)`meta-llama/Llama-3.2-1B-Instruct-spec`(pour les projets 70B)
- **Medusa heads**(Cai et coll. 2024, Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads): pas en utilisant le modèle de projet, mais en ajoutant K 个并行 prédiction de tête à l'objectif 自身──部署更简单,acceptation 略低于EAGLE──

## Je le livre.

本课会产出 `outputs/skill-speculative-tuning.md`, c'est une compétence, pour analyser la charge de travail du modèle cible,并选择:drafts model、K(drafts longueur)、largeur de l'arbre、temperature,以及何時落back à la décode simple。

## 练习

1. 实现精确拒绝 规则并进行实证验证──通过 `speculative_decode`和 simple prélèvement d'échantillons cibles 分别运行 10K échantillons; calculer les distances entre les deux distributions de sortie 电视间――应小于0.01──

2. 计算加速 公式──给定固定 `α`et `K`, dessiner chaque fois l'attente de la cible à l'avant Token numéros.

3. entraînement un petit projet── prendre une cible 124M GPT-2 et mettre 100M jetons  utiliser KL perte distiller un projet 30M GPT-2── mesurer texte tenu `α` préférence: 0,6-0,7

4. 实现Eagle style tree drawing──donc ne pas utiliser la chaîne, mais plutôt faire le dessin dans chaque profondeur 输出 top-3 branches──construire un masque d'attention à l'arbre──验证 target 接受最长正确分支──

5. 测量 failure modes──在 temperature=1.5(高随机性) 下运行 猜测式解码──展示 α 崩塌,并且由于草案上空费,该算法比平面解码更慢──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind 论文
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) projet de modèle 替代方案
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) réutilisation des caractéristiques et dessin d'arbres
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态 Topologie des arbres
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) correspondance entre les heures de train et les heures d'essai
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) Décodage Jacobi/lookahead, un type de décodage qui n'a pas besoin de spéculateur
