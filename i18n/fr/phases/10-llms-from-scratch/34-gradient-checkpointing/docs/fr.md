# Contrôle de degré et recomputation d'activation

> La répartition arrière conservera chaque activation intermédiaire. Dans le contexte de 70B et 128K, chaque rang peut être activé jusqu'à 3 TB.

**Type:** Build
**语言:**Python avec torche optionnelle
**前置要求:**Leur formation est basée sur la formation et la formation.
**Time:** ~70 分钟

##  problématique

訓練變壓器 会為每一層保存後退 中需要求导的每一op的输入:attention 输入、Q/K/V projections、softmax 输出、FFN 输入、norm 输出,以及残流──对隐藏尺寸为`d`、longueur de séquence 为 `L`- Je suis en train de faire un détail.`B`C'est à peu près à chaque couche.`12 * B * L * d`Il y a des points.

Pour le`d=8192, L=8192, B=1`, qui est en BF16 下是800 MB/层。 une valeur d'activation de 64 couches du modèle est de 51 GB, qui n'a pas encore multiplié par la taille du microbatch, ni plus d'attention-softmax intermédiaires( pour chaque tête pour `L^2`), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ),

C'est un système de réinitialisation standard (en anglais: standard modification scheme) qui consiste à mettre en place des valeurs activées en phase de réinitialisation, à la fin de la période de réinitialisation, pour les récupérer.

En effet, en fonction de la sélection intelligente de Korthikanti et al., vous pouvez effectuer un contrôle sélectif en moins de 5% du FLOP 开销下省 5x de mémoire.

## 概念

### Rétrograde  réellement besoin de quoi

`output = layer(input)`✿Retourner 想要 `grad_input`et `grad_params`Pour les calculer, il faut:

- `input`(pour le calcul à niveau en ligne)`grad_params = input.T @ grad_output`)
- Quelques quantités de guides actives intermédiaires ((ReLU/GELU/softmax)

Passer en avant 会在 autograd graphique 中自动保存这些内容──每个 `tensor.retain_grad()`Et chaque op qui a besoin de son entrée conservera un citation.

### 朴素 Contrôle complet

Débrancher le réseau`N`个段――前进 期间, seulement conserver chaque segment de *input*──当后退 需要中间量时,重新运行该段的前进通过 来物化它们,然后再求导──

Example: Transformateur à 32 couches 拆分32 个段,每个段1层──

- La mémoire: 32 个 couche-entrée (小) contre 32 *(
- 额外计算: chaque segment 额外 1 fois en avant, soit le total de FLOP à l'avant 约 33% augmentation 由于 l'arrière est en avant de 2x, l'étape complète de 1 + 2 = 3 个单位变为 1 + 1 + 2 = 4 个单位) 

C' est le premier Chen et collègues de 2016`sqrt(L)`Pour L=64, il y a 8 points de contrôle.

### Le contrôle sélectif (Korthikanti 2022)

Tout le coût de la valeur active n'est pas le même. Attention softmax 输出是 `B*L*L*heads`,并随序列长度 *二次* 增长──FFN activation cachée 是 `B*L*4d`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

Le point de contrôle sélectif Réserve la valeur active du coût de stockage basse, des projections linéaires, des résidus, ne fait que recalculer la partie la plus chère, attention, mais économise la mémoire O (L^2)

Megatron-Core sera réalisé pour la recomputation d'activation sélective. La plupart des entraînements frontaliers de 2024+ sont en cours d'utilisation.

### Déchargement

Réalisation de la fonction de la RAM: entre l'avant et l'arrière, la valeur d'activation est transmise à la RAM du CPU.

FSDP2 va décharger 作为一等选项提供──当GPU受记忆限制,但CPU-GPU转移还有余量时, déchargement表现很好──

### Modèle de coûts de recompte

Chaque jour`k`Le point de contrôle de niveau, une fois, toutes.`L`Les étapes suivantes:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

En utilisant le point de contrôle sélectif, vous ne pouvez que recalculer le noyau d'attention, plutôt que l'ensemble:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Modèle d'épargne de mémoire

Volume d'activation de chaque couche:`A`Pour le`L`层, mémoire de l'activation totale:`L * A`Il y a une autre.

Point de contrôle complet (taille de segment 1):`L * input_volume`(pour le transformateur standard 约为 `L * 1/10 A`)―节省约 `9 * L * A * 1/10`Il y a une autre.

Chaque jour`k`Le point de contrôle de niveau`L/k * A`, réajouter le segment actif`k-1`La quantité de couches.

- Je suis là .`k = sqrt(L)`时, mémoire et calculer le coût de la ville selon `sqrt(L)`缩放, c'est le meilleur poids des couches de coûts uniformes.

### Quelle heure est-ce que tu es au checkpoint ?

- Les étapes de la conduite sont déjà en vol.
- Si les premières et dernières couches ont guidé le calcul de cette étape, alors ne les voyez pas dans les transformateurs.
- 已使用 FlashAttention's attention kernels: Flash 已会快速重新计算 softmax, donc le contrôle de niveau de couche supplémentaire 叠加收益很小──

### Modèles de mise en œuvre

1. **Function wrapper：**- Je veux le faire .`torch.utils.checkpoint.checkpoint(fn, input)`- Je suis en train de vous dire.`input`, en arrière, à recalculer tout le reste de la page.

2. **Decorator-based：**Les couches seront marquées comme contrôlables; le formateur décidera dans le temps de configuration quel segment sera emballé.

3. **Manual explicit recompute：**Je suis en train de faire un pas en arrière.`recompute_forward`, avec la saisie de sauvegarde copier en avant 

Les enveloppes sont des usages standard.

### Échanges avec TP / PP / FP8

- **Tensor parallel：**Les entrées des points de contrôle doivent être collectées ou récupérées lors du recomptage; elles doivent traiter les coûts de communication.
- **Pipeline parallel：**Le modèle typique est le point de contrôle de chaque étape du pipeline, permettant aux micro-batches de commande inverse de réutiliser la mémoire d'activation.
- **FP8 recompute：**Les données de l'analyse de l'analyse de l'analyse de données doivent être complétées à l'échelle de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données.


```figure
activation-recompute
```

## - Je le construis.

### 步骤 1: Modèle de jouet avec des segments

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### 步骤 2: nécessite toutes les activations

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 步骤 3: Point de contrôle-Tous les points de mémoire

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤 4: Modèle de coûts

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤 5: Estimateur de mémoire

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### 步骤 6: Taille optimale du segment

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤 7: Décision sélective du point de contrôle

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## Utilisez-le

- **torch.utils.checkpoint**- Le numéro de la liste:`from torch.utils.checkpoint import checkpoint`,PyTorch 中的规范包装──它包裹一个函数; seulement enregistrer l'entrée, et à l'arrière 时重新计算──
- **Megatron-Core activation recomputation**: support `selective`- Je suis là.`full`et `block`Les modalités de formation à la frontière de 2024+ sont les normes de pratique.
- **FSDP2 offload**:FSDP2 中中 `module.to_empty(device="cpu")` coup de coeur `offload_policy`, va mettre les activations à la CPU, au lieu de recomputer.
- **DeepSpeed ZeRO-Offload**: pour l'optimisation des états et des décharges de CPU des activations, avec le contrôle de point de contrôle 互补──

## Je le livre.

本课会产出 `outputs/prompt-activation-recompute-policy.md`, c'est une demande: il reçoit votre configuration de modèle ((couches, sections, lots) et la mémoire GPU disponible,并输出逐层重计算 policy ((pas de / sélective / plein / déchargement) ").

## 练习

1. 验证正确性──运行 `model_forward`+ `model_backward`(activations complètes)`model_forward_checkpointed`+ `model_backward_checkpointed`Les gradients de paramètre doivent être en parfaite précision.

2. 扫描 taille du segment `k`, de 1 à `L`◊ dessiner FLOP surhead 和 mémoire── trouver des courbes de la ligne

3. 实现 sélective checkpointing: sauvegarder l'entrée du module d'attention, mais pas conserver l'intermédiaire de la quantité.

4. 添加脱载──把段输入 保存到一个模拟的 CPU buffer((((一个单独的列表)──将 PCIe bandwidth 作为字节/时间 测量,并找出脱载与重计算 之间的破解点──

5. Benchmark Un véritable transformateur PyTorch,分別使用和不使用 `torch.utils.checkpoint`◊ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ `torch.cuda.max_memory_allocated`) et le temps de l'étape.

## 关键术语
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- article de contrôle des gradients formalisés
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- recomputation de l'activation sélective et analyse des coûts formalisés
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)--                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- échelle de décharge de l' activation
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准 API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)-- mode sélectif 、full 和 bloc
