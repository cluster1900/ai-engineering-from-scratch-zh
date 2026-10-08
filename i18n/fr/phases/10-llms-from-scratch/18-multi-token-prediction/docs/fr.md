# Prédiction multi-tokens (MTP)

> De GPT-2 à Llama 3, chaque LLM de retour est basé sur une perte à chaque position. Entraînement: prédiction du prochain Token。DeepSeek-V3 augmente une deuxième perte à chaque position: prédiction du prochain Token。Extrait 14B paramètres(sur le modèle 671B) à travers le flux de Gradient 被蒸回主模型, tandis que de bons têtes MTP ont été retravaillées dans les concepteurs de décoding spéculatif, le taux d'acceptation dépassant 80%―1.8× de résolution de débit est presque gratuit.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04（预训练 mini GPT）、Phase 10 · 15（speculative decoding）
**Time:** ~60 分钟

## Objectif de l'apprentissage

- Il est possible de calculer la profondeur de la perte articulaire.
- 解释 Gloeckle et al. des têtes MTP parallèles(2024) et les modules MTP séquentiels de DeepSeek-V3  entre la différence, ainsi que pourquoi la chaîne causale séquentielle 设计能保留的原因链──
- 计算在预训运行中加入 MTP模块的参数和内存开销──
- De la réalisation à zéro d'un module MTP:intégration partagée, bloc de transformateur par profondeur, projection et tête de sortie partagée.

##  problématique

La prédiction des tokens suivants est l'objectif de formation standard de la LM. Chaque état caché est supervisé pour prévoir une seule chose: le suivi des tokens suivants. C'est un signal étonnamment faible. La plupart des informations du séquence se prolongent à l'extérieur d'un token.

Le problème posé par MTP est que si chaque état caché est surveillé pour une fois prédire plusieurs futurs tokens, comment ?Gloeckle et al. [Meta, 2024) prouvent que cela aide. Leur réalisation est de placer plusieurs têtes de sortie indépendantes sur la colonne vertébrale, chaque tête prédisant différents décomptes.

DeepSeek-V3 (en 2024) va MTP 重新设计为序列模块, dans chaque profondeur de prédiction,`h_i^(0)`预测 `t+1`Puis de l' état caché.`h_i^(1)`预测 `t+2`, et `h_i^(1)`Je suis en train de me faire un petit coup .`h_i^(0)`et `E(t+1)`En effet, les modules MTP ont augmenté de 14B par rapport au poids du modèle principal 671B. Ce 2% de la production a été modifié pour un signal de formation plus intensif, ainsi que le projet de décoding spéculatif réalisé dans le cadre de la théorie.

Le cours est basé sur la conception de modules MTP et la perte de profondeur D.

## 核心概念

### MTP séquentielle 配方

DeepSeek-V3 est ajouté sur le modèle principal`D`个 MTP modules── chaque module `k`(dont `k = 1..D`) pré测 profondité `k`Le signe, c'est que je suis dans une position déterminée.`i`时预测                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `t_{i+k}`Il y a une autre.

Module `k`包含:

- Un bloc de transformateur .`T_k`, avoir son propre attention et MLP
- Une matrice de projection `M_k`, le premier état caché de la profondeur sera intégré à l' embedding du symbole de vérité de la base de la profondeur de la dernière.
- intégration partagée `E`(À la même manière que le modèle principal)
- tête de sortie partagée `Out`(À la même manière que le modèle principal)

                                                                                                                                                                                                                                                              `i`Le préfixe, par état caché de profondeur 为:

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

Prévision par profondeur 为:

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

La perte de profondeur est par rapport à la vérité fondamentale.`t_{i+k}`La transpiration de l'entropie:

```
L_k = CE(logits_{i+k}, t_{i+k})
```

Perte articulaire à travers la profondeur:

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda`C'est un facteur de poids plus faible, Profonde recherche-V3 10% avant l'entraînement Utilisez 0,3, puis utilisez 0,1 ⋅ Perte totale d'entraînement`L_main + L_MTP`Il y a une autre.

### Pourquoi est-ce séquentiel, plutôt que parallèle

Gloeckle a d'abord un MTP parallèle avec des têtes de sortie, chacun directement appliqué à`h_i^(0)`Chaque tête est dans le même état caché.`t_{i+k}`Tu peux t'entraîner normalement, mais ces prédictions ne sont pas mutuellement conditionnées.`head_1`De l'aide à sortir `head_2`Ces têtes sont des éclats de touches.

Le design de DeepSeek-V3 est suivant:`h_i^(k-1)`Plus réellement intégration de jetons suivants `E(t_{i+k})` Construction `h_i^(k)`Ceci a conservé la chaîne de causalité:`t_{i+k+1}`, profondeur `k+1`Le module va voir`t_{i+k}`处的内容── This is in structure on the same way as self-backed decoder 消费 itself output, therefore MTP modules can be directly as speculative-decoding drafters 

推理时:将 `h_i^(k-1)`Et les projets`t_{i+k}`输入 module `k+1`Je suis en train de faire ça .`t_{i+k+1}`C'est un projet de style EAGLE, il suffit d'utiliser un bon module MTP comme un projet de réseau. DeepSeek-V3 rapporte que le taux d'acceptation du premier module MTP est supérieur à 80%, et obtient environ 1,8× 加速──

### 参数核算

Pour le secret`h`、词表为 `V`Le modèle:

- Le modèle principal: des milliards de paramètres, plus un plus petit pour`V * h`La tête de sortie de la
- Tête de sortie partagée: tête du modèle principal à refaire.
- Embedding partagé: répétition du modèle principal.
- Pour chaque module MTP:
  - La projection `M_k`- Le numéro de la liste:`(2h) * h = 2h^2`Il y a une autre.
  - Bloc de transformateur `T_k`Attention !`4h^2`)加 MLP(SwiGLU 且比为8/3 时通常为`8h^2`)― Chaque bloc`12h^2`Il y a une autre.

Paramètres de l'intégralité de chaque module:`~14h^2`Pour DeepSeek-V3`h = 7168`,D = 1 module: papier sur la page est `~14 * 7168^2 = ~720M`Les résultats de DeepSeek-V3 sont 14B, la différence provient principalement des couches d'experts du module MTP et de l'utilisation du MoE.

### Décoder spéculatif 回报

Pendant la formation préalable, les modules MTP vont faire ralentir la formation d'environ 10% (plus de calculs à l'avance, plus de pertes supplémentaires)

1. Les résultats de la recherche en profondeur de V3 ont été positifs et ont augmenté de plusieurs centaines de points.

2. Le module MTP a été entraîné à prévoir les prochains Token. Lorsqu'il sera réutilisé pour le projet de réseau, il peut atteindre un taux d'acceptation de plus de 80% .

### Relation avec l' AIGLE

EAGLE en formation préliminaire après un petit projet de modèle. MTP va faire un projet dans la formation préliminaire. Deux méthodes recevront des taux d'acceptation similaires, mais le pipeline est différent:

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | 预训练之后 | 预训练期间 |
| Backward-compatible with existing weights | 是 | 否（需要重新训练） |
| Draft params | 1-2 个 transformer layers | 1 个 transformer block + projection |
| Acceptance rate | 0.88-0.92 | depth 1 时 0.80+ |
| Benefit beyond speedup | 仅 speculative decoding | 更密集的训练信号 + 加速 |


```figure
multi-token-predict
```

## - Je le construis.

`code/main.py`端到端构建一个MTP模块:shared embedding、projection、transformer block、shared output head──然后它会在一段简短的合成序列上计算每深度交叉输入损失,并按组件印参数──32 个代币的玩具词汇让数字更容易读──

### 步骤 1: table d'intégration partagée

Une .`vocab_size x hidden`Le modèle principal et chaque module MTP de chaque profondeur sont utilisés ensemble.

### 步骤 2: combinaison par profondeur

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

Réellement, DeepSeek-V3 va être le premier vecteur de RMSNorm.`[2h]`, et ne l' utilise pas .`h x 2h`Matrix 投影── Ce jouet 为了 stdlib 简洁, avec Vector加法来代替──

### 步骤 3: profondeur de l'interrupteur de l'interrupteur

Autotanténonciation 加 MLP──在玩具中, un bloc d'attention linéaire à un seul niveau 和 un MLP SwiGLU 让结构可见,同时避免使用 numpy──

### 步骤 4: tête de sortie partagée

复用主模型的输出覆盖词汇的逻辑──

### 步骤 5:perte par profondeur

La valeur de l'offre est de 0,5%`k`处 fondamentale-vérité Token   cross-entropie`lambda / D`缩放因子跨深度 聚合──

### 步骤 6: calcul des paramètres

打印总参数、shared(embedding、head)参数, ainsi que par module 额外参数── afficher MTP 额外参数与主模型大小的比例──

## Utilisez-le

MTP 已集成到DeepSeek-V3(2024 年 12 月)

- DeepSeek  sa propre pile de service 可开箱即用地将 MTP modules 作为投机解码器 使用。
- 截至 2026 年 4 月,vLLM 和 SGLang 已有DeepSeek-V3 MTP 的集成路径──
- Le programme ROCm SGLang de AMD a montré une configuration spéculative de décoding MTP spécifique et a été testé à la barre de contrôle V3 de 1,8× accélération.

Dans le nouveau cadre de la formation, l'utilisation de MTP:

- Vous contrôlez le pipeline complet de formation préalable, et vous souhaitez obtenir un signal d'entraînement plus intensif.
- Vous savez que vous allez servir ce modèle à grande échelle, et vous voulez obtenir gratuitement le décoding spéculatif.
- Les pertes causées par les ventes sont généralement supérieures aux gains.

Scène de non-utilisation:

- Pour le modèle de formation préalable dense, faire un ajustement précis.
- Dans le cadre de l'étude, vous souhaitez avoir une base de données nette pour effectuer des comparaisons.

## Je le livre.

本课会生成 `outputs/skill-mtp-planner.md` Donner une pré-entraînement de fonctionnement de la norme (model size DATA 計算), il reviendra à un programme intégré MTP:`lambda`Le programme, la mise en œuvre de la mise en œuvre de la mise en œuvre de la stratégie de décodage spéculatif, ainsi que le câblage de décodage de la mise en œuvre de la mise en œuvre de la mise en œuvre de la stratégie de décodage.

## 练习

1. 运行  référencement`code/main.py` démontrer avec le signal synthétique 增强, per-depth loss 单调下降── modifier synthétique, faire usage de mode fixe,并验证 depth-1 和 depth-2 loss △

2. 計算一個密集70B 模型 ((hidden 8192,80 層) 在D=1 MTP module 下的参数开销──与DeepSeek-V3 报告的14B 开销进行比较──解释为什么DeepSeek's numbers were higher:MTP transformator block 继承了相同的MoE 结构,从而增加了每模块的参数──

3. Dans le jeu réalisé D=2: Ajouter un deuxième module MTP, recevoir h^(1) 并预测 `t_{i+2}` L'essai de perte commune et le calcul des paramètres avec les équations de DeepSeek papier 19-21 匹配。

4. Pour la version séquentielle, la version séquentielle doit produire une perte de profondeur plus faible, car elle est prévue en milieu de la prédiction.

5. Pour former un bon module MTP, utiliser un projet de style EAGLE:`t_{i+k}` Dans la séquence de détention, mesurer ces jetons de projet par rapport au taux d'acceptation du modèle principal  Si vous atteignez 50%+ dans le jeu, vous avez déjà réussi à obtenir l'expérience de MTP-as-draft 

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | “额外 loss block” | 一个小型 transformer block 加 projection，用来预测主模型前方 `k` 个位置的 Token |
| Prediction depth | “哪个 offset” | 整数 `k`，使得 module `k` 基于截至位置 `i` 的 prefix 预测 `t_{i+k}` |
| Parallel MTP | “Gloeckle-style” | 位于同一个 backbone hidden state 之上的 D 个独立 heads，没有条件链 |
| Sequential MTP | “DeepSeek-V3 style” | 每个 module 都以先前 depth 的 hidden state 加下一个 Token 的 embedding 为条件；保留 causal chain |
| Shared output head | “复用主 head” | MTP modules 调用主模型的 LM head，而不是单独的 output projection |
| Shared embedding | “复用主 table” | 同一个 vocabulary embedding table 在所有地方使用；没有重复参数 |
| Projection matrix M_k | “结合 hidden + next-token” | 一个 `h x 2h` linear layer，将前一个 hidden state 和 target-token embedding 折叠为下一深度的输入 |
| Joint loss L_MTP | “平均额外 losses” | per-depth cross-entropy losses 的算术平均值，并按 `lambda` 缩放 |
| Acceptance rate at depth 1 | “MTP draft 多常正确” | D=1 MTP module 的 top-1 prediction 等于主模型 top-1 prediction 的比例；DeepSeek-V3 上超过 80% |
| Lambda weighting | “额外 loss 的重要性” | per-depth 缩放因子；DeepSeek-V3 在训练开始时为 0.3，之后为 0.1 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 完整的顺序MTP 描述(Section 2.2), y compris les équations de perte articulaire 和推理时的 1.8× 加速
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) DeepSeek 设计所改进's MTP de base parallèle
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 685B 总量(671B principal + 14B MTP),部署说明
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) MTP 所适配的 spéculative-decoding  framework
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) Projet d'architecture 2025 de l'EAGLE, également MTP 竞争对应方案
