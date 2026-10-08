# Décodage spéculatif  Définition  Vérification  Répétez

> Le décoding autorégressif est en série. Chaque jeton doit attendre le précédent jeton. Le décoding spéculatif a brisé cette chaîne: un modèle bon marché d'abord projet N 个 jeton, un modèle cher de vérifier toutes les N 个 jeton en une seule fois.

**Type:** Build
**Languages:** Python
**先修要求:**Phase 7 · 07 (MG de causalité de la TPT), phase 7 · 12 (KV cache et attention flash)
**Time:** ~60 minutes

##  problématique

Un projet de loi 70B dans H100 上采采样一个代币 需要约30 ms.一个3B草案模型 需要约3 ms.`5×3 + 30 = 45 ms`, le plus acceptable 5 Tokens; et la génération directe est nécessaire `5×30 = 150 ms`︎ Voilà le point de vente complet du décoding spéculatif: avec une petite quantité de mémoire GPU supplémentaire (modèle de projet) en échange de 24× plus bas latence de décoding︎

关键在于必须保留分布──Leviathan et al. (2023) ainsi que Chen et al.**完全相同**Il n'y a pas de fracture de qualité.

D'ici 2026, quatre catégories de vérificateurs de projet

1. **Vanilla speculative (Leviathan 2023)。**独立草案模型 (exemple: Llama 3 1B) + vérificateur (exemple: Llama 3 70B)
2. **Medusa (Cai 2024)。**Dans le vérificateur, ajoutez plusieurs têtes de décoding, et faites des prédictions.`t+1..t+k`◊ Ne nécessite pas de modèle de projet indépendant
3. **EAGLE family (Li 2024, 2025)。**复用验证器 hidden states 的轻量草案; taux d'acceptation par rapport à la vanille 更接近; typiquement 34×。
4. **Lookahead decoding (Fu 2024)。**Iteration Jacobi; totalement pas besoin de modèle de projet.

Chaque pile de production de la classe d'inférence de 2026 est destinée à fournir des décodage spéculatif.

## 核心概念

### 核心算法

给定一个验证器 `M_q`Et un projet moins cher.`M_p`- Le numéro de la liste:

1. Pour faire`x_1..x_k`Pour avoir décodé le préfixe:
2. **Draft**: utiliser `M_p`autorégressivement 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`, pour résoudre les projets de probabilités`p_1..p_N`Il y a une autre.
3. **并行 verify**Dans le`x_1..x_k, d_{k+1}, ..., d_{k+N}`Une fois de plus.`M_q`Je suis en position .`k+1..k+N+1`                    `q_1..q_{N+1}`Il y a une autre.
4. **从左到右 accept/reject 每个 draft token**Pour chacun`i`, en général`min(1, q_i(d_i) / p_i(d_i))`- Je le sais.
5. À la place`j`Première réfutation: répartition "résiduelle" de la réintégration`(q_j - p_j)_+`Dans le même ordre d'idées`t_j`Il y a une autre.`j`Tous les projets ont été abandonnés.
6. Si tout le monde`N`个都被接受: depuis `q_{N+1}`采样一个额外Token `t_{N+1}`(bonus gratuit)

Cette technique consiste à faire une distribution de sortie et de sortie.`M_q`Il y a une approche mathématique parfaitement cohérente.

### Qu'est-ce qui décide de l' accélérer ?

Pour faire`α`= taux d'acceptation de chaque projet de jeton `c`= rapport coût entre projet et vérificateur──

- Génération naïve Chaque jeton a besoin d'un appel de modèle.
- - Je suis là .`α`- Je suis très bien.`(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`Il faut un coup de fil de modèle.

Dans le`α = 0.75`且 `N = 5`时,典型经验法则是:big-model call 减少 3×──Draft cost is 5× cheap──总体墙-clock 约下降 2.5×──

**α 取决于：**

- Le niveau de rapprochement du projet de vérificateur avec les données familiales/formation sera considérablement amélioré.
- Stratégie de décoding. ◊ Projet avide contre vérificateur avide:α 高。 Prise d'échantillons de température:更难匹配; acceptation 下降。
- Type de tâche──Code et sortie structurée 接受更多(更可预测);自由形式创意写作接受更少──

### Medusa  没有草案模型 的草案

Medusa Utiliser le vérificateur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `t`- Le numéro de la liste:

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

Chaque tête sort ses propres logits. En inférence, vous obtenez un échantillon de chaque tête dans la séquence de candidature, puis utilisez un passage à l'avant et un système d'attention à l'arbre.

优点:没有第二个模型──缺点: augmenter les paramètres entraînables; nécessiter une mise à jour supervisée 阶段(约1B Token); taux d'acceptation 比使用优秀草案的香

### L' AIGLE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

EAGLE-1/2/3 (Li et coll., 20242025) va concevoir un modèle de projet conçu pour un très petit transformateur (habituellement 1 couche), en introduisant des états cachés de dernière couche du vérificateur.

EAGLE-3 (2025)  a rejoint la recherche d'arbres pour la continuation des candidats.

### Danser à cache KV

La vérification`N`个草案代币 在一次前进通中给验证器──这将将验证器的KV缓存扩展 `N`Si certains projets sont rejetés, vous devez mettre le cache de retour à la longueur du préfixe accepté.

Produit réalisé`--speculative-model`、TensorRT-LLM's LookaheadDecoder) en grattant les tampons KV 处理这个事──先写入,接受时再 commit──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

## - Je le construis.

Je vous en prie .`code/main.py` Nous utilisons les composants suivants pour réaliser l'algorithme de prélèvement spéculatif de base:

- Un "grand modèle", il est déterministe-softmax sur la distribution manuscrite, de sorte que vous pouvez résoudre l'acceptation mathématique)
- Un "modèle de projet", c'est une version perturbée du grand modèle.
- Une boucle d'acceptation/déni, générée par le prélèvement direct de la même distribution marginale.

### 步骤 1: étape de rejet

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`C'est un nombre aléatoire uniforme.`q_prob`C'est un vérificateur de la probabilité de jeton rédigé.`p_prob`Le théorème de Léviathan indique que cette décision de Bernoulli, ainsi que le rejet de l'échantillon résiduel, peut être strictement conservé en fonction de la distribution du vérificateur.

### 步骤 2: répartition des résidus

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

Œuvres de l'homme`q`À la fin`p`, clampera la valeur négative à zéro, puis re-regroupe. Tout rejet est de là.

### Étape 3: Une étape spéculative

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个奖金 → 一次验证通过 生成六个代币──

### 步骤 4: Mesurer le taux d'acceptation

Dans différents projets de qualité 水平下运行 10,000 个投机步骤――绘制接受率与草案和验证器 分布 KL divergence relation――你应该看到清晰的单调关系――

### Étape 5: Égalité de distribution des certificats

 تجرب验证:circuit spéculatif 生成 Token 直方图应匹配直接从验证器采样得到的直方图――这是实践中的利维雅坦定理――Chi-square test 会确认差异在样本错误范围内――

## Utilisez-le

Produit:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

Jusqu'en 2026 année, TensorRT-LLM possède le plus rapide chemin de Méduse.`faster-whisper`Pour le grand sourire, le décodage spéculatif de la petite ébauche.

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- Il suffit de générer 15 个 Token de génération de séquence unique.
- 极具创意 / Prîmes à haute température ((α 会下降)
- Les déploiements limités par la mémoire (dépôt de modèle)

## Je le livre.

Je vous en prie .`outputs/skill-spec-decode-picker.md`◊ cette compétence 会为新推断工作负载 选择一种 stratégie de décoding spéculative (vannille / méduse / Eagle / lookahead) ainsi que des paramètres de réglage (N、température de projet) ◊

## 练习

1. **Easy。**运行  référencement`code/main.py` Confirmer que la distribution de jetons spéculatifs correspond à la distribution de l'échantillon direct du vérificateur, et que le p = 0,05 ⋅
2. **Medium。**Pour le`α = 0.5, 0.7, 0.85`, dessiner la vitesse de chaque grand modèle à l' avance de la numérotation des jetons)`N`Les changements sont possibles.`N`◊(Instruction: chaque fois vérifier l'appel ∞`(1 - α^{N+1}) / (1 - α)`◊)
3. **Hard。**实现一个小的梅杜萨:取课14的顶石GPT,添加3个额外的LM头,分别预测位置 t+2、t+3、t+4──在小摇钱树上用联合多头损失训练──与通过截断同一个模型得到的香草草比较接受率──
4. **Hard。**实现 rollback: de un préfixe KV cache de 10 jetons 开始,入 5 个草案代币,模拟在位置 3 rejet──验证下一轮代时你的缓存 读取结果正确匹配 "prefixe + 2 premiers projets acceptés"──

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等式定理──
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出;清晰的Bernoulli-rejectation 证明──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) Medusa 论文; attention à l'arbre 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) EAGLE-1; basé sur le projet de conditions de l'état caché 
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) AGLE-2; profondeur dynamique de l'arbre
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) Eagle-3:
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057)- Je suis un peu déçu.
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html)                                                                                                                                                                                                                                                              
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) Résumé du projet de loi de la Commission européenne sur les droits de l'homme
