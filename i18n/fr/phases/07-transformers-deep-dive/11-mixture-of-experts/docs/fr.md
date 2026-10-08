# Le groupe d'experts (MoE)

> Un transformateur dense 70B sera utilisé pour chaque jeton  activer tous les paramètres―un 671B MoE Pour chaque jeton, il n'y a que 37B  paramètres activés, mais dans tous les indicateurs de référence, il est surmonté.

**Type:** Build
**Languages:** Python
**先修要求:**La phase 7 · 05 (transformateur complet), la phase 7 · 07 (GPT)
**Time:** ~45 minutes

##  problématique

En déduisant les FLOPs de la transformateur dans les déductions , il est possible de calculer les FLOPs de la transformateur .............................................................................................................................................................................................................................................

Un mélange d'experts a brisé ce lien.`E`个独立专家 + 一个为每个代币 选择 `k`个专家的路由器──总参数 = `E × FFN_size`◊ la quantité active de chaque jeton = `k × FFN_size` Configuration typique pour l'année 2026:`E=256`- Je suis désolé .`k=8`◊ stockage avec`E`扩展,计算随 `k`- Je suis en train de me lancer.

La frontière de 2026 est presque entière: MoE:DeepSeek-V3(671B total / 37B actif) 、Mixtral 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss。

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 替换

bloc de transformateur dense:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

Bloc de la moée:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

Chaque expert est un FFN indépendant (habituellement SwiGLU) ― routeur est un niveau unique― chaque jeton  choisir son propre `k`个专家,并获得它们输出门的混合──

### équilibre de charge 问题

Si le routeur 让90% de Token 经过专家3, les autres experts 会被饿死――

1. **Auxiliary load-balancing loss**(Switch Transformer、Mixtral) ◦ Ajouter un avec expert utilisation des taux de différence de correction ◦
2. **Expert capacity + token dropping**(Mécanisme de mise en place)  Chaque expert,`C × N/E`个 Token;溢出的 Token 跳过该层──会损害质量──
3. **Auxiliary-loss-free balancing**(DeepSeek-V3)── Ajouter un biais par expert pouvant être appris, utilisé pour déplacer le haut de la ligne de routeur 选择──bias en train de perdre de l'entraînement  外部更新──不对主目标添加惩罚──这是2024年重要突破──

Pratique de DeepSeek-V3: après chaque étape de formation, chaque expert doit vérifier si son taux d'utilisation est élevé ou faible.`±γ`微调 bias──选择时使用 `scores + bias` Les probabilités d'expertise utilisées pour le gateing  encore utilisées `scores` This will routing with expression 解──

### Des experts partagés

DeepSeek-V2/V3 aussi des experts divisés en *shared* et *routed*── chaque token ville traversé tous les experts partagés──Experts partagés 通过 top-k 选择──Experts partagés 捕获通用知识;experts partagés 负责专门化──V3 运行 1 expert partagé,加上 256 专家中 top-8──

### Des experts en grains fins

经典 MoE(GShard、Switch): chaque expert 和完整FFN 一样宽──`E`较小(8-64),`k`Je suis un peu plus jeune que toi.

现代 MoE à grains fins DeepSeek-V3、Qwen-MoE): chaque expert 更狭`E`Il y a plus de 256 personnes.`k`Les composants sont les mêmes, mais le nombre de composants est plus rapide.`C(256, 8) = 400 trillion`种可能的每代币 专家 ──质量提升,延迟 保持不变──

### 成本图片

Chaque jeton, chaque couche:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 dans presque tous les points de référence 上都胜过 Llama 3 70B (densité), simultanément**每个 Token 使用更少的活跃 FLOPs**△更多参数 = 更多知识──更多活跃 FLOPs = Chaque jeton 更多计算──MoE将它们解──

### 代价: mémoire

Quels que soient les experts qui sont touchés, tous les experts doivent être installés sur le GPU. Un modèle 671B nécessite environ 1,3 TB de VRAM pour stocker des poids fp16.


```figure
expert-routing
```

## - Je le construis.

参见 `code/main.py`                                                                                                                                                                                                                                                              

- `n_experts=8`个近似 SwiGLU 的专家(为了说明,每个只有一个线性)
- en route de haut-k=2
- poids de fermeture normalisé à la hauteur de la douceur maximale
- À travers le biais par expert  Réaliser un équilibre sans perte auxiliaire

### 步骤 1: routeur

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

Le biais  affecte la sélection, sans affecter le poids de la porte― c'est la technique de DeepSeek-V3: le biais dans le cas de prévision de modèle non guidée modifie l'inégalité de charge―.

### 步骤 2: Faites 100 个 jetons par le routeur

Suivre les experts                                                                                                                                                                                                                                                             `-γ`, utilisation insuffisante`+γ`) plus tard, le taux d'utilisation sera réparti entre les générations suivantes.

### 步骤 3: Parmi les paramètres

打印一个 MoE config 的 density equivalent──DeepSeek-V3 形状:256 routed + 1 shared,8 active,d_model=7168──总参数非常惊人──活跃参数只有密度 Llama 3 70B 的七分之一──

## Utilisez-le

Elle est en train de se faire avaler.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

Les résultats de la production de 2026: vLLM Orig生支持MoE routing──SGLang 拥有最快的专家-parallel path──两者都会自动处理顶级选项和专家平行──

**何时选择 MoE：**
- Vous souhaitez obtenir une qualité de bord avec un coût inférieur par jeton.
- Vous disposez d'une infrastructure VRAM / parallèle d'experts.
- Votre charge de travail est lourde en tokens, et non pas lourde en contexte.

**何时不要选择 MoE：**
- Déploiement de bord: vous paierez le coût de stockage complet pour tout FLOP actif.
- Service à utilisateur unique critique de latence: routage d'experts 会增加 Overhead。
- 小模型(<7B):Le MoE de la qualité de l'avantage ne se produit que dans le cas où il dépasse un certain seuil de calcul (environ 6B paramètres actifs)

## Je le livre.

参见 `outputs/skill-moe-configurator.md`◊ cette compétence sera basée sur le budget paramétrique, les jetons de formation et l'objectif de déploiement, pour un nouveau MoE 选择 E、k 和 partagé-expert layout。

## 练习

1. **Easy.**运行  référencement`code/main.py`◊ Observer l'utilisation de l'expert en 50 fois 中拉平
2. **Medium.**Utilisez le routeur basé sur le hash (( détermination、无需学习) pour remplacer le routeur appris.
3. **Hard.**实现 GRPO-style rollout-matched routing(DeepSeek-V3.2 技巧): enregistrer l'inférence 期间 quels experts sont touchés, 期间 Gradient 计算 期间强制使用相同路由──在一个玩具政策-gradient设置 上测量效果──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) Cette idée est de la source.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961)- Je suis un peu déprimé.
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) Mixtral 8×7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + MoE sans perte auxiliaire + MTP。
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664)  基于偏见的平衡论文──
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒+共享专家分区──
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的共享专家论文──
