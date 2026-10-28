# L' analyse parallèle à la bulle

> Parallélisme de tension Placez la matrice multipliée à plusieurs niveaux de niveau, placez le modèle à plusieurs niveaux, placez chaque niveau à une étape, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à plusieurs niveaux, placez le modèle à un niveau, placez le modèle à plusieurs niveaux, placez le modèle à un niveau, placez le modèle à un niveau, placez le modèle à un niveau, placez le modèle à un niveau, placez le modèle à un niveau, placez le modèle à un niveau, placez le modèle à un niveau, placez le modèle à un niveau.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 分钟

## Objectif de l'apprentissage

- Mettez un modèle de séquence décomposé en N 个 étape, et en N 个 rangée 上模拟前沿管道。
- Utilisez le GPipe 调度(First only do forward 填满,再回落) Faites passer M 个 microbatch 管,并计算泡 比例。
- Avec Megatron-LM、PipeDream Utilisation de la communication 1F1B
- 论证 stage 分配: chaque étape 算力相等, est plus important que chaque étape 参数相等.

##  problématique

Le modèle de paramètres 70B de la série Fp16, le paramètre lumineux doit être de 140 Go.$\log(N)$跳──pipeline parallèle 换一条路:把模型切成 N 个阶段,每个阶级 放一个──Layer 1 的前进 在阶级 0 做完,把激活张量交给阶级 1;rank 1 跑层 2 再交给阶级 2;以此类推──Retour en arrière 反向流回──内存近似线性下降,因为每个阶级只有一阶段;计算是串行的,这就是泡泡 问题──

La bulle est un pipeline 开头的空(等第一个微巴赫到最后阶段) 和结尾的空(等最后一个微巴赫 回抽) ⋅M个微巴赫、N个阶段 时,每阶段的泡 比如是$(N-1)/(M+N-1)$◦M=8、N=4 时是27%;M=64、N=4 时是4.5%──Cette étape de microbatch 越多,bubble 越小, ce qui signifie la taille de chaque microbatch.

## 概念

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe 调度

Préutiliser tout M 个 microbatch Placez le pipeline en avant 填满, recommencer à l'arrière; puis revers vers l'arrière 排空。 chaque activation du microbatch doit rester en arrière, de sorte que l'内存 augmente avec M 线性.$(N-1)/(M+N-1)$◊把 M 取得远大于 N,就能把泡藏起来──

### 1F1B 调度

交错: une microbatch est en avance, une à la dernière étape, on commence immédiatement à la revenir en arrière et on la fait revenir en arrière.

### Pourquoi chaque étape est importante ?

Si l'étape 0 nécessite 50 ms, l'étape 1 nécessite 100 ms, chaque cycle sera chargé à l'étape 1 上。 autre étape Chaque cycle vacant équivaut à 50 ms, équivaut à l'étape 1 放行。 Les paramètres sont équilibrés par l'attention de chaque étape, plus MLP, qui inclut de nombreux paramètres mais moins de puissance.

### Microbatch et lot

Pipeline 跑 M 个、每个大小为 B 的微包――有效批量是 $M \cdot B$◊ Un pas de pipeline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       $M \cdot B$个样本的梯度──Bubble 比例取决于M;$M \cdot B$△调 M,就是在泡 (M) △大则更低) △与每微包内存 (GPipe 下 M) △大则激活内存更高) △

```figure
cd-pipeline-bubble
```

## - Je le construis.

`code/main.py`实现:

- `PipelineStage`Une petite`nn.Module`, possède une étape de paramètres,并暴露 `forward(activation)`Il y a une autre.
- `Pipeline(stages, num_microbatches)`: en phase de mise en scène 上用每一阶段 的模拟墙钟编排 GPipe 调度。
- `bubble_fraction(num_stages, num_microbatches)`: closed式公式 $(N-1)/(M+N-1)$Il y a une autre.
- Une démonstration en 4 étapes: imprimer sur le trajet du microbatch, ainsi que la bulle testée, par exemple.

运行:

```bash
python3 code/main.py
```

输出: par étape×microbatch de Gantt 图, ainsi que par rapport à la bulle de la prédiction fermée 百分比──

## Pratique dans le milieu de production

Trois modes permettent de rendre le pipeline parallèle à la durcissement de la ligne.

**Activation checkpointing 与 pipeline 搭配。**GPipe 上有M 个微巴赫 在飞时,激活内存是单个微巴赫的M 倍──Activation checkpointing 在后期 重算前期,使用算力换内存;两者结合,长序列上的管道才可行──

**Stage 均衡靠测量，不靠假设。**Le groupe de production va d'abord faire un cycle de profilage, tester les calculs réels sur les objets cibles, les FLOP et les cloches, puis les résultats de mesure selon les zones de mesure.`--num-layers-per-stage`Accepter la liste afin que chaque étape ait un nombre de niveaux différents en fonction des coûts de chaque étape.

**Send/recv 调度必须避免死锁。**Si chaque étape doit envoyer un recueil, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en ligne, en

## Utilisez-le

Utilisation dans le produit:

- **Megatron-LM。**L'utilisation de 1F1B,并支持 tensor + pipeline + data parallel 组合──
- **DeepSpeed Pipeline。**Avec ZeRO 集成; ZeRO-1 + pipeline est la plus grande fréquence de nombreux modèles open source.
- **PyTorch Pipe。**PyTorch original résultant de l'équipement de pipeline`torch.distributed.pipeline.sync.Pipe`Il y a une autre.

## Je le livre.

Section 80 课把每阶段的参数分片存进分片检查点──第 81 课在端到端演示里组合 DDP + ZeRO + pipeline精神(上如此;演示为了运行而仍保持管道为模拟)

## 练习

1. 实现 1F1B, test bubble 比例与GPipe 一致,但激活内存有上界──
2. Dans un modèle plus profond, analyse la réalité à chaque étape du temps, et rééquilibre la phase de la mise à jour.
3.  à travers le pipeline microbatch faire la gradience accumulation, la gradience d'inspection égale à la gradience de l'avancement du lot entier 
4. ∆ donner à la pipeline 配上 activation de contrôle, mesure de la réserve de données et des coûts de calcul 
5. Pour les autres, il est nécessaire de mettre en place des systèmes de gestion de données et de gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Pipeline | “沿深度的模型并行” | 每个 rank 一个 stage，激活逐 stage 流动 |
| Bubble | “Pipeline 空闲时间” | 首尾各 (N-1) 步，部分 stage 没有工作 |
| Microbatch | “Batch 的切片” | 一次 forward/backward 单元；M 增大则 bubble 缩小 |
| GPipe | “先填满再排空” | M 次 forward 全部完成后再 backward；激活内存高 |
| 1F1B | “交错调度” | 每 stage 一次 forward 一次 backward；激活内存有界 |

## 延伸阅读

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- Phase 19 Leçon 76 - les primitives envoi/recv utilisées par le calendrier
- L'étude 78 - ZeRO est orthogonale à la pipeline et souvent combinée
