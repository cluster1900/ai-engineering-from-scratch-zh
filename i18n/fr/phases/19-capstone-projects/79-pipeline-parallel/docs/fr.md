# 管道并行和气泡分析

> 张量并行性将矩阵乘法跨等级分化――管道并行性将模型跨等级分化,每个等级一个阶段――微批次流经管道――开始和结束的空时间就是泡;最小化它是整个过程――

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 19 期 Track C 课程 42-49
**Time:** ~90 分钟

## Objectif de l'apprentissage

- Le modèle de séquence sera divisé en N 个阶段, et se déroulera à travers N 个阶级的前向管道.
- Utilisation de la pipeline 计划通过管道安排 M 个微批次(仅向前填充,然后向后)并计算气泡分数──
- Comparer les échanges utilisés entre la bulle et Megatron-LM et PipeDream
- Défense de la répartition des étapes: le nombre de phases de chaque étape est plus important que le nombre de phases de chaque étape.

##  problématique

Le modèle de paramètres 70B de fp16 ne nécessite que 140 Go de paramètres. Aucun GPU de consommation ne peut le supporter. ZeRO-3 跨级分片参数, mais il faut toujours que chaque niveau soit utilisé pour chaque étape de collecte complète, chaque étape de paiement log ((N) 跳.

La boue est le temps vide du tuyau quand il commence (à attendre la première petite partie pour atteindre la dernière étape) et quand il se termine (à attendre la dernière petite partie pour revenir à la dernière étape). Pour les M et N, chaque étape est composée de boues (N-1) / M+N-1).

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

### GPipe 时间表

Avant de commencer toute opération, utilisez tous les M 个微批次向前填充管道; puis reverse倒流. Chaque micro批次的激活必须保持到后,因此内存随着M 线性增长.

### 1F1B 时间表

交错: une fois que les petits lots de l'avant arrivent à la dernière étape, on commence à l'arrière et on le fait revenir. Le calendrier de chaque étape du changement est toujours N-1, mais l'actif est limité par la profondeur du tube, et non par le nombre de petits lots.

### Pourquoi l'égalité de calcul de chaque étape est importante

Si la phase 0 a besoin de 50 ms, la phase 1 a besoin de 100 ms, alors chaque cycle est dans la phase 1 上门控。 les autres phases de chaque cycle sont vides 50 ms, attendent la phase 1 释放。 le même nombre de paramètres est l'axe de l'erreur: le calcul du transformateur est principalement axé sur l'attention ajoutée à chaque niveau de la MLP, tandis que l'emballage a beaucoup de paramètres mais la quantité de calcul est très faible。 la distribution de phases devrait équilibrer le FLOP de chaque phase, et non le poids de chaque phase.

### Micro-parts et lots

Le nombre de boues dépend de M; l'optimisateur voit que M*B。 ajustement M signifie boue


```figure
cd-pipeline-bubble
```

## - Je le construis.

`code/main.py`实现:

- `PipelineStage`Une petite .`nn.Module`, conserver les paramètres d' une phase et s' ouvrir`forward(activation)`Il y a une autre.
- `Pipeline(stages, num_microbatches)`: utilisez chaque étape de la mise en place de la mise en place de la mise en place de la mise en place de la mise en place de la mise en place de la mise en place de la mise en place de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en.
- `bubble_fraction(num_stages, num_microbatches)`Il est également possible de faire une demande de règlement.
- 4 阶段演示, imprimé pour chaque petit lot de signalisation et de mesure du nombre de bulles de

Je vais le faire.

```bash
python3 code/main.py
```

输出: petit échantillon de graphes et des bulles de gaz par rapport à la prédiction de fermeture

## 野外生产模式

Trois modes permettent de rendre les tuyaux plus simples et plus durcis que suffisamment pour le transport.

**激活检查点与管道配对。**Lorsque GPipe 上 fonctionne M 个微批次时, l'activation de l'invite est un petit lot de M 倍次;; point de contrôle activé dans le temps suivant recalculé vers le temps suivant, pour calculer le changement de l'invite; cette combinaison permet au tuyau de traiter de longues séquences;;

**阶段平衡是测量出来的，而不是假设的。**Le groupe de production effectue un processus d'analyse, mesure chaque couche de calcul réelle sur le matériel de l'objectif de mesure (FLOP 和挂钟), puis selon les résultats de cette mesure, une division est effectuée.`--num-layers-per-stage`L'étiquette est une liste de l'établissement de la liste de l'établissement de la liste de l'établissement de la liste de l'établissement de la liste de l'établissement de la liste de l'établissement de la liste de l'établissement de la liste de l'établissement de l'étiquette.

**发送-接收调度必须避免死锁。**Chaque étape est en ligne pour la réception et l'envoi de tuyaux.

## Utilisez-le

Mode de production:

- **Megatron-LM。**Résumé des opérations de même type de pipeline à grande échelle ⋅ adoption de 1F1B, soutien à la quantité de données ⋅ plus de pipeline ⋅ plus de données ⋅
- **DeepSpeed Pipeline。**Avec ZeRO 集成; le pipeline ZeRO-1 + est le plus grand ensemble de modèles ouverts.
- **PyTorch Pipe。**PyTorch 原生管道包装器, basé sur `torch.distributed.pipeline.sync.Pipe`La construction.

## 发货

Le programme de l'exposition est composé de DDP + ZeRO + tubes (en nature; l'exposition est en cours de fonctionnement et maintient le tube en forme).

## 练习

1. 实现 1F1B并验证气泡分数与GPipe 匹配,但激活内存有限──
2. Dans un modèle plus profond, analysez chaque étape du temps réel, et passez par la mesure de la période de rééquilibrage.
3. Ajouter la concentration de la température des petits lots du tube et vérifier si la température est égale à celle de l'ensemble des lots en avant.
4. Le couplage des tuyaux avec les points de contrôle actifs, la réduction de la mémoire et la relation des coûts de calcul.
5. La mise en œuvre de la révision des données de chaque niveau de tuyau est effectuée en 2D.

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|----------------|------------------------|
|管道| “模型沿深度平行” |每个等级一个阶段，激活逐级流动|
|泡泡| “管道空闲时间”|开始+结束时的 (N-1) 个步骤，其中某些阶段没有工作 |
|微批次| “批次切片”|前进/后退各1个；随着 M 的增大，气泡会缩小 |
| G管道| “填充然后排水” |所有 M 都在任何后退之前前进；高激活记忆|
| 1F1B | “交错时间表” |每级一前一后；有界激活记忆|

##  ultérieur

- [Huang 等人，GPipe：巨型神经网络的高效训练](https://arxiv.org/abs/1811.06965)
- [Narayanan 等人，PipeDream：DNN 训练的广义管道并行性](https://arxiv.org/abs/1806.03377)
- [Megatron-LM 管道并行文档](https://github.com/NVIDIA/Megatron-LM)
- Section 19 阶段 第 76 课 - 调度使用的发送/接收原语
- Section 19 阶段 第 78 课 - ZeRO et les conduites sont en bonne communication et se composent régulièrement
