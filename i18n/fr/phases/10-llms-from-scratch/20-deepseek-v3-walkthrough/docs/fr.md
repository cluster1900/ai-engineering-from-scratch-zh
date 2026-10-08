# Résumé de l'article

> La phase 10 · Leçon 14 nomme chaque modèle ouvert tous les six cycles d'architecture réglementés. DeepSeek-V3(12月, 2024 année, paramètre total 671B, paramètre actif 37B) réglementé tous les six cycles, et ajouté à quatre:Multi-Head Latent Attention、 sans perte de charge auxiliaire Equilibre、Prédition multi-token, ainsi que DualPipe formation.

**类型：**Apprendre à apprendre
**语言：**Python(stdlib, paramètres de calcul)
**先修要求：**La phase 10 · 14(Open Modèle讲解) 、Phase 10 · 17(NSA) 、Phase 10 · 18(MTP) 、Phase 10 · 19(DualPipe)
**时间：**À environ 75 minutes.

## Objectif de l'apprentissage

- De haut en bas, lire la configuration de DeepSeek-V3, et utiliser six GPT-2 et quatre DeepSeek spéciaux pour expliquer chaque passage.
- 推导总参数(671B)、活跃参数(37B), ainsi que leurs composants
- 計算 128k context 下 MLA's KV cache 占用,并与一个活跃参数相同、使用 GQA's dense model 需要付出的价格进行比较──
- Il a mentionné quatre éléments de DeepSeek, notamment MLA, MTP, routage sans perte auxiliaire, DualPipe, et a souligné quelles parties de chaque élément sont destinées à l'architecture ou à la formation de stack.

##  problématique

DeepSeek-V3 est la première structure à avoir des différences de fond avec Llama. Llama 3 405B est la première à avoir réglé les six cycles de GPT-2🏼 DeepSeek-V3 est GPT-2 avec les six cycles, en plus de rejoindre les quatre cycles. Llama 3 config est la première à avoir lu le corps chaud de la config, mais sa structure de fond, la forme du bloc d'attention, la route, la logique, l'objectif de formation, est déjà assez différent, il faut donc un seul détail.

L'apprentissage de ses avantages est: DeepSeek-V3 des poids ouverts  publié a changé la signification de la capacité de frontière  dans le modèle ouvert  cette structure est de nombreuses années de formation 2026  en cours de réalisation 蓝图.

## 核心概念

### Le cœur du changement, regarde encore une fois

DeepSeek-V3 est toujours autorégressif. Il est encore en train de compiler des blocs de décodeur. Chaque bloc contient encore Attention, MLP, RMSNorm. Il utilise encore SwiGLU dans les MLP. Il utilise encore RoPE.

### 转折:用 MLA 取代 GQA

Depuis la phase 10 · 14 Vous savez déjà, GQA 通过让多组 Q heads 共享 K 和 V 来缩小 KV cache──Multi-Head Latent Attention(MLA)`kv_lora_rank`), puis en calcul en temps de tête 解压──KV cache seulement stockée latente, généralement par jeton Chaque couche 512 个浮点数, plutôt que 8 x 128 = 1024 个浮点数──

Dans le contexte 128k, utilisez DeepSeek-V3 de MLA pour chaque jeton, chaque couche, un partage latent `c^{KV}`;K et V sont allées à travers la projection ascendante de cette latente période, tandis que ces projections ascendantes peuvent être absorbées jusqu'à la phase suivante:

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

Une hypothèse de GQA 基线(Llama 3 70B 形状,8 头KV,头 dim 128) nécessite:

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

Dans le contexte 128k, MLA est 4 fois plus important que Llama-3-70B.

Le poids est: MLA en attente par jour  calcul augmenter le poids de la dépression .

### Réglage: équilibrage de la charge sans perte auxiliaire

Les routeurs MoE décident de chaque jeton par les meilleurs experts  Traiter  Router simple 会把多多工作集中到少数专家上,导致其他专家 置──标准修复方法是添加一个辅助损失项,用于惩罚负载不均衡──

DeepSeek-V3 introduit un programme sans perte auxiliaire. Donne des logits de routeur.`e`Je suis en train de tomber.`bias_e`Si la charge est insuffisante, on l'améliore.

L'impact de la perte de main: indétectable.

### MTP: plus d'entraînement + 免费草案

Depuis la phase 10 · 18 vous savez déjà, DeepSeek-V3 a augmenté le module MTP de D=1, utilisé pour prévoir les deux prochaines positions.

Paramètres: augmentation de 14B par rapport à 671B principaux

### 训练:DualPipe

Depuis la phase 10 · 19 vous savez déjà, DualPipe est une sorte de pipeline bi-directionnelle, qui va aller de l'avant et des morceaux arrière avec des traversées de tous les points de communication.

### Config,逐字段解析

La version suivante est la configuration de DeepSeek-V3:

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

解析如下:

- `hidden_size=7168`: Embedding 维度。
- `num_hidden_layers=61`Le bloc de profondeur
- `first_k_dense_layers=3`Il est également utilisé dans les autres domaines de la technologie.
- `num_attention_heads=128`Je suis en train de vous poser des questions.
- `kv_lora_rank=512`:K 和 V sont compressés à cette dimension latente, et ne sont pas pressés à la tête.
- `num_experts=256, num_experts_per_tok=8`Chaque bloc MoE compte 256 experts, en utilisant le top-8 de l'itinéraire.
- `shared_experts=1`: Outre 256 experts en route, il y a un expert toujours en place qui contribuera à chaque token.
- `moe_intermediate_size=2048`: chaque expert de MLP est de taille cachée― c'est plus dense que MLP petit, parce qu'il y a 256 experts―

### 参数核算

完整计算在 `code/main.py`Le résultat final:

- Embedding:`vocab * hidden = 129280 * 7168 = ~0.93B`Il y a une autre.
- Précédent 3 个 denses blocs:带 MLA 的注意(per bloc 约144M) + denses MLP(per bloc 约260M) + normes。总计约1.2B。
- 58 blocs de MoE: avec attention des MLA (environ 144M) + 256 experts (environ 30M) + 1 expert partagé (environ 30M) + norme (environ 30M) ⋅ selon tous les experts ⋅ calcul, par bloc ⋅ total 7.95B⋅ 58 blocs de MoE ⋅ total 461B⋅
- Module MTP:14B:

总计:core architecture 约476B + 14B MTP; et publié 671B 数字还会单独计入额外结构参数(bias tensors、expert-specific components、shared expert scaling等) ⋅ Nous avons dans le calculateur une différence de 3 à 5% entre les chiffres répertoriés et les valeurs publiées, différence provenant de DeepSeek 报告 Section 2 appendice 中记录的细粒度核算──

Parmi les éléments actifs de chaque événement:

- Attention: chaque couche 144M * 61 = 8,8B
- MLP actif:前 3 層密集(3 * 260M = 780M),58 个 MoE strati 中每层激活 8 个路由 + 1 个共享 +路由上费――每层active MLP 约 260M──总计:3 * 260M + 58 * 260M = ~15.9B──
- Intégration + normes: 1.2B。
- 总活跃: environ 26B de base + 14B MTP(entraînement en utilisant, mais la mise en œuvre n'est pas toujours possible)≈ 37B。

### 671B / 37B par exemple

Le taux de réaction de la recherche en profondeur est de 5,5% pour les poids ouverts. Le taux de réaction de la recherche en profondeur est de 28%, le taux de réaction de la recherche en profondeur est de 4,25%.

### Localisation de DeepSeek-V3

| 模型 | 总参数 | 活跃参数 | 比例 | Attention | 新想法 |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN 扩展 |

### 后续: R1、V4

DeepSeek-R1(2025) est une première course de formation de raisonnement sur la colonne vertébrale de V3 et non pas sur la formation préalable.

DeepSeek-V4 (si publié) prévoit de conserver MLA + MoE + MTP,并加入 DSA (en anglais seulement)


```figure
moe-routing
```

## Utilisez-le

`code/main.py`Il est spécialement adapté à DeepSeek-V3 形状参数计算器──运行它,将输出与论文中的数字进行比较,并用它测试假设变体(256 experts vs 512、top-8 vs top-16、MLA rank 512 vs 1024)──

需要关注:

- 总参数对已发布的671B──
- 活跃参数 vs 已发布的37B──
- Le contexte de 128k, qui est le cas de MLA vs GQA,
- 按层的解解, pour observer les paramètres budgétaires réellement dépensés en

## Je le livre.

本课会生成 `outputs/skill-deepseek-v3-reader.md` Donner un modèle de famille DeepSeek (V3、R1, ou tout futur variant), il génère un résultat de lecture de l'architecture par composant, nomme chaque élément de la configuration, par composant, et identifie le modèle utilisant quatre innovations spécifiques de DeepSeek.

## 练习

1. 运行  référencement`code/main.py` Comparer les estimations de la composition totale du calculateur avec les 671B publiés, et identifier les différences provenant de la section 2.

2.  Modifier la configuration, modifier le rang des MLA de 512   modifier à 256 ⋅ calculer 128k contexte                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

3. Comparer DeepSeek-V3 avec un hypothèse de 256 experts, top-8) en route avec un hypothèse de 512 experts, top-8) en variations.

4. 阅读DeepSeek-V3 technical report ((arXiv:2412.19437) Section 2.1 关于MLA的内容──用三句话解释为什么K 和 V 的解压矩阵可以在推理效率上被吸收到后续matmul中──

5. DeepSeek-V3 est utilisé pour la plupart des opérations en utilisant la formation FP8[6]. Compte avec la formation FP8 vs BF16  stockage des poids 671B[6].

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MLA | “Multi-Head Latent Attention” | 将 K 和 V 压缩到共享低秩 latent（kv_lora_rank，通常为 512），并按 head on-the-fly 解压；KV cache 只存储 latent |
| kv_lora_rank | “MLA compression dim” | K 和 V 共享 latent 的大小；DeepSeek-V3 使用 512 |
| First k dense layers | “早期 layers 保持 dense” | 前几个 MoE-model layers 跳过 MoE router，并运行 dense MLP 以提高稳定性 |
| num_experts_per_tok | “Top-k routing” | 每个 token 会触发多少个 routed experts；DeepSeek-V3 使用 8 |
| Shared experts | “Always-on experts” | 无论 routing 如何都会处理每个 token 的 experts；DeepSeek-V3 使用 1 |
| Auxiliary-loss-free routing | “Bias-adjusted load balance” | 在训练期间调整按 expert 的 bias 项，以在不添加 Loss 项的情况下保持 expert 负载均衡 |
| MTP module | “额外 prediction head” | 从 h^(1) 和 E(t+1) 预测 t+2 的 Transformer block；更密集训练，免费的 speculative-decoding draft |
| DualPipe | “Bidirectional pipeline” | 将 forward/backward 计算与跨节点 all-to-all 重叠的 training schedule |
| Active parameter ratio | “Sparsity” | active_params / total_params；DeepSeek-V3 达到 5.5% |
| FP8 training | “8-bit training” | 使用 FP8 存储训练数据，并在许多 compute ops 中使用 FP8；相比 BF16 大约内存减半，质量代价很小 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report（arXiv:2412.19437）](https://arxiv.org/abs/2412.19437)                                                                                                                                                                                                                                                              
- [Hugging Face 上的 DeepSeek-V3 model card](https://huggingface.co/deepseek-ai/DeepSeek-V3) config 文件与部署说明
- [DeepSeek-V2 paper（arXiv:2405.04434）](https://arxiv.org/abs/2405.04434) 引入 MLA's précédent modèle
- [DeepSeek-R1 paper（arXiv:2501.12948）](https://arxiv.org/abs/2501.12948) 基于 V3 架构的推理培训 后继模型
- [Native Sparse Attention（arXiv:2502.11089）](https://arxiv.org/abs/2502.11089) Profonde recherche de la famille Attention de l'avenir direction
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) référence au programme de formation
