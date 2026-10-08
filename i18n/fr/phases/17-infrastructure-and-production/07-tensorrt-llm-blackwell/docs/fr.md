# Dans Blackwell, utilisez FP8 et NVFP4 pour la fonction TensorRT-LLM

> TensorRT-LLM  est uniquement réservé à NVIDIA, mais il est également disponible sur Blackwell                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     $0.012，而 H100 + vLLM 为 $Cette pile est la principale, car elle possède la gamme de fonctionnalités dont elle a besoin; NVFP4 (microscalage à 4 bits) traitement du poids et de la valeur d'activation; prédiction multi-token (MTP) et pré-remplissage/décode désagrégé. Elle augmente également 2-3x.

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**Phase 17 · 04 (VLLM Serving Internals), phase 10 · 13 (Quantification)
**Time:** ~75 分钟

## Objectif de l'apprentissage

- 解释为什么即便权重使用NVFP4,FP8对KV缓存 和 Attention 仍然关键──
- 計算境界模型 在 BF16、FP8 和 NVFP4 下的HBM footprint,并推理节省来自哪里──
- Il est également possible de trouver des solutions de traitement de la maladie de la peau.
- 判断什么时候 TRT-LLM's NVIDIA-lock 值得使用的交换对 Hopper 上 vLLM 的 7x 成本差距──

##  problématique

La réponse dépend de la fournière de la sélection:硬件代际(Hopper H100/H200 vs Blackwell B200/GB200) 精度(BF16 → FP8 → NVFP4) ✓ serveur de moteur(vLLM vs SGLang vs TRT-LLM)

Dans Hopper + vLLM 上,120B MoE de coûts de fonctionnement environ pour chaque million de jetons ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0,012,便宜 7x── une partie de la différence provient de hardware(Blackwell's Single GPU LLM 吞吐相对Hopper 高 11-15x)── une autre partie provient de la pile:FP4 权重、MTP drapeau、décomposé pré-remplissage/décode, ainsi que du tout-à-tout NVLink 5 de communication par experts MoE──

Vous ne pouvez pas le reproduire en dehors de la pile NVIDIA. C'est le point de départ: utiliser la stack portable pour changer l'économie.

## 概念

### Pourquoi FP8 est toujours la base de la cache KV

Une erreur commune de 2026 est: supposer que NVFP4 puisse être appliqué partout. Fait n'est pas le cas. Le cache KV a besoin de FP8 (point flottant de 8 bits), car il est stocké avec des clés d'attention et des valeurs de rangement très large.

NVFP4 (en anglais: NVFP4 (en anglais: NVFP4 (en anglais: NVFP4)) est utilisé pour le poids et la valeur activée.

典型 Blackwell 配置:

- 权重:NVFP4 ((microscalage à 4 bits)
- 激活值:NVFP4──
- Le cache KV:FP8。
- Accumulateur d'attention:FP32 ((softmax 稳定性) ⋅

### TRT-LLM utilisée par Blackwell avec des primitifs

- **Day-0 FP4 weights**Le modèle fournit une mise en ligne directe de la FP4 权重;TRT-LLM 无需后培训转换即可加载;;FP4 不需要 AWQ / GPTQ 步骤;;
- **Multi-token prediction (MTP)**La phase 17 est la même, mais intégrée à la construction TRT-LLM.
- **Disaggregated serving**: préfill 和 décode 位于 des pools GPU indépendants, cache KV  via NVLink ou InfiniBand 传输──与 Dynamo(Phase 17 · 20)
- **All-to-all communication primitives**: NVLink 5 réduira la latence de communication des experts MoE par rapport à Hopper  Réduire 3x ⋅ TRT-LLM ⋅ MoE kernels ⋅ Afin de cela, des ajustements ont été effectués ⋅
- **NVFP4 + MXFP8 microscaling**Le système de traitement des cores de tenseur Blackwell

### Tu devrais te rappeler le nombre

- HGX B200  via TRT-LLM en GPT-OSS-120B atteint le jeton de 0,02 $ / M
- GB200 NVL72 通过Dynamo (TRT-LLM) atteint le Token de 0,012/M$
- H100 + vLLM dans la charge de travail comparable
- TRT-LLM 更新三月带来 2.8x 吞吐增益(2026)。
- Blackwell comparé à Hopper's GPU LLM 吞吐为11-15x
- MLPerf Inference v6.0(2026 年 4 月):Blackwell 主导每个提交任务──

### FP4 sur la qualité

NVFP4 很激进──在推理-heavy workload ((chain-of-thought、math、长上下文 code-gen) 上,FP4 权重会明显退化──Per-block calibration peut être atténuée, mais ne peut pas être éliminée── Équipe de lancement de modèles de raisonnement utilisent généralement FP8 权重 + FP4 激活值作为折中, ou persistent dans H200 上全程使用 FP8──

Règlement: en promettant d'utiliser NVFP4 权重前,始终在你的评估设上验证任务质量──

### Pourquoi est-ce un NVIDIA-blocage ?

TRT-LLM est C++ + CUDA + noyaux de source fermée。 le modèle doit être utilisé pour un GPU spécifique SKU 编译。不支持 AMD,不支持 Intel,不支持 ARM。 si votre stratégie de base est multi-vendor, alors TRT-LLM est indispensable pour le niveau de service TRT-LLM; vous pouvez toujours utiliser le service vLLM sur des matériels mixtes。 si vous êtes uniquement NVIDIA, alors 7x 差距足以为锁付。

### 2026 année de mise en œuvre

Pour des calculs annuels de 100 M$+, la mise en œuvre de Hopper + vLLM 会留下 7-10x de l'optimisation de l'espace.

### Bonus de désagrégation

Le service décomposé de TRT-LLM (à la phase 17 · 20 en profondeur) sera décomposé dans les pools de pré-remplissage et de décode.


```figure
pipeline-parallel
```

## Utilisez-le

`code/main.py`Le modèle HBM est utilisé pour la décomposition de données (en fonction de la taille de la carte de référence) et de la valeur de la valeur de la carte de référence (en fonction de la taille de la carte de référence).

## Je le livre.

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md` Donnée la charge de travail  Modèle taille et volume annuel des jetons, il jugera si Blackwell + TRT-LLM stack vaut la peine de verrouillage NVIDIA 

## 练习

1. 运行  référencement`code/main.py` Pour un paramètre actif de 30% de 120B MoE, calcul H100 BF16、H100 FP8 et B200 NVFP4/FP8 sur le débit de décode limité de la mémoire à bande passante― le plus grand saut provient de qui ?
2. 某客户每年在H100+vLLM上花费2M$. Considering 7x 经济差距, they need to buy how many Blackwell GPUs 才能在12个月内摊销迁移到TRT-LLM的成本?
3. NVFP4 权重转换后, vous en MATH 上看到准确率下降 3 个点──说出两条恢复路径:一条质量第一(保留FP8 权重),一条成本第一(使用域内数据做校准)──
4. Les résultats de l'inférence MLPerf v6.0...
5. 计算 405B 模型在 NVFP4 权重 + FP8 KV cache、128k contextes 下所需的HBM──它能装进单个GB200 NVL72 节点吗?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) 2026 年 4 月 MLPerf 结果──
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) NVLink 5 tout-à-tout avec les noyaux MoE
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方 engine 文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) Orchestration décomposée sur le TRT-LLM 之──
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
