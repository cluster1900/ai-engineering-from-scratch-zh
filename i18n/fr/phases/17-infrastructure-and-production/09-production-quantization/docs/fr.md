# Quantisation de la production  AWQ, GPTQ, GGUF K-quants, FP8, MXFP4/NVFP4

> Le format de quantification n'est pas un choix général, mais une fonction du moteur de hardware, du serveur et de la charge de travail. Le GGUF Q4_K_M ou Q5_K_M 通过 llama.cpp 和 Ollama 交付, occupant le CPU 和 edge 场景。 GPTQ dans vLLM 内部胜出, adapté à la situation où vous devez exécuter plusieurs LORA sur la même base。 Avec AWQ des noyaux Marlin-AWQ sur le modèle de classe 7B peut atteindre environ 741 tok/s, et dans le modèle INT4  have the best pass@1, 2026 year datacenter production par défaut                                                                                                                                                                                

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## Objectif de l'apprentissage
- Il existe six formats de quantification de la production en 2026 et ses meilleurs scénarios d'utilisation.
- Dans le cadre de la mise en œuvre de la stratégie de gestion des données, les données sont fournies par le système d'exploitation et les données sont fournies par le système d'exploitation.
- 计算选型节省的重量内存, ainsi que le cache KV non affecté
- Il est également possible de trouver des modèles quantifiés dans le trafic de domaine.

##  problématique
La quantification va réduire la mémoire et la bande passante HBM, alors que c'est exactement ce dont il faut décoder. Un modèle FP16 70B a 140 Go de poids.

Mais la quantification n'est pas gratuite. La quantification de l'énergie réduit la qualité, en particulier dans les tâches de raisonnement lourd.

## 概念
### Les six formats

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/edge 默认选择

GGUF est un format de fichier, en soi, il n'est pas un schéma quantifié, il utilise des variantes K-quantum ((Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0) enveloppées dans un conteneur.

Dans le vLLM, le débit est de 7B, ce format n'est pas destiné aux noyaux de GPU.

### GPTQ  vLLM 中的多洛拉

GPTQ est un algorithme de quantification post-entraînement, avec un passage d'étalonnage.

Il a des avantages uniques: GPTQ-Int4 dans vLLM supportent des adaptateurs LoRA。 si vous voulez servir un modèle de base avec 10 à 50 variantes finement ajustées(chacun comme un LoRA), GPTQ est votre cheminement。 jusqu'au début de l'année 2026, NVFP4 ne supporte pas encore LoRA。

### AWQ  GPU du centre de données 默认选择

Quantisation du poids conscient de l'activation, la quantité de protection est d'environ 1% le plus important poids.

À part cela, vous avez besoin de plusieurs LORA (GPTQ) ou de Blackwell FP4 (NVFP4) activé, sinon le nouveau service de GPU 选择 AWQ。

### FP8  Un milieu de travail fiable

Le point flottant de 8 bits──近似无损──支持广泛──Hopper Tensor Cores 原生加速FP8──Blackwell 继承这一点──当质量不可妥协时(理性、医学、代码-gen),FP8 est une option préconisée de sécurité pour 2026──Mémoire économisée est la moitié de l'INT4, mais le risque de qualité est beaucoup plus faible──

### MXFP4 / NVFP4  Blackwell 激进选择

La micro-élargissement FP4── chaque bloc de poids a son propre facteur d'échelle── activation, mais dans les Blackwell Tensor Cores, il y a une accélération du matériel── par rapport à FP8, le nombre de bits par jeton sera réduit de moitié, ce qui est la phase 17 · 07 du processus économique.

Attention:
- Il n'y a pas encore de soutien de l'ARL.
- Les charges de travail lourdes sont considérables.
- Il faut que tu l'examines de façon précise.

### Le piège d'étalonnage

AWQ et GPTQ  nécessitent un ensemble de données d'étalonnage, généralement C4 ou WikiText。 pour les modèles de domaine (((code, médical, juridique), en utilisant le texte Web général pour effectuer l'étalonnage, permettra à l'algorithme de prendre des décisions erronées concernant les droits qui devraient être protégés。HumanEval 上的 Pass@1 可能下降几个点。

修复方式: utiliser des données dans le domaine faire une calibration. 〇100 échantillons de domaine sont habituellement suffisants.

### Le piège de cache KV

AWQ Placez le poids réduit à 4 bits.

- Poids: environ 35 Go (à partir de 140 Go)
- 128 并发 × 2k contexte 下的 KV cache: environ 20 Go.
- Activations: environ 5 Go.
- Total: environ 60 Go, on peut mettre dans H100 80 Go.

J'ai mis le modèle à 4 Go, j'ai oublié de le faire avec 30 à 50 Go.

En outre, la quantification cache de KV (FP8 KV ou INT8 KV) est une autre option, avec ses propres compromis, elle affectera directement la précision de l'attention, pas les bénéfices gratuits.

### AWQ INT4 pour le raisonnement

La chaîne de pensée, mathématiques, longs contextes de code-gen, ces tâches sont manifestement affectées par la quantification de la charge.

### Guide de sélection 2026

- Le service de bord du processeur: GGUF Q4_K_M──完成──
- La GPU sert à chat de routine sans LoRA.
- Le GPU sert multi-LoRA: avec le GPTQ de Marlin.
- Charge de travail de raisonnement:FP8。
- Le centre de données Blackwell 质量已验证:NVFP4 + FP8 KV
- Il n'est pas clair: pour chaque candidat, une évaluation de 1000 échantillons est effectuée.


```figure
gpu-memory-breakdown
```

## Utilisez-le
`code/main.py`Il s'agit d'une série de modèles de taille, calculant six types de forme de l'empreinte mémoire (poids + KV + activations) et de débit relatif.

## Je le livre.
本课会产出 `outputs/skill-quantization-picker.md` Donnée la taille du matériel, du modèle, du type de charge de travail et de la tolérance qualité, elle choisit un format et génère un plan d'étalonnage/validation.

## 练习
1. 运行  référencement`code/main.py`Pour le modèle 70B de 128 et 2K de contexte, calculer le total de chaque format HBM. Quel format peut vous permettre de mettre un H100 80GB?
2. Vous avez un modèle de codage 7B. Choisissez un format et expliquez pourquoi. Si vous avez tort à la tolérance de la qualité, quel est le chemin de récupération ?
3. 计算为医学领域模型 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校) 校校校) 校校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 
4. 阅读 Marlin-AWQ kernel paper 或 release notes。用三句话解释为什么 AWQ atteint 741 tok/s en 7B, alors que le GPTQ brut est d'environ 712。
5. Comment faire pour que les poids AWQ soient plus raisonnables que les poids KV en FP8 ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant variants 的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；production GGUF 默认选择 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-train INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；Marlin kernels；INT4 下最佳 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernels；10x speedup |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上的安全 precision 默认选择 |
| MXFP4 / NVFP4 | “microscaling four” | Blackwell 4-bit FP，带 per-block scale factors |
| Calibration dataset | “cal data” | 用于选择 quantization parameters 的输入文本；必须匹配 domain |
| KV cache quantization | “KV INT8” | 与 weights 分开的选择；影响 Attention accuracy |

## 延伸阅读
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) À l'égard du point de référence
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的吞吐量 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南──
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗子──
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) Originaire de la formule AWQ
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) Originaire de la formule GPTQ
