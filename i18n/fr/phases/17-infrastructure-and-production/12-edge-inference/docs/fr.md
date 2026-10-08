# L'utilisation de la technologie de pointe est également considérée comme une des principales caractéristiques de la technologie de pointe.

> Le décodage est limité par la mémoire, donc cette différence est décisive. Jusqu'en 2026, la différence est décisive. Apple M4/A18 Neural Engine dans la mémoire unifiée (((pas de CPUNPU) est de 38 TOPS.

**类型：**Apprenez à le faire
**语言：**Python(stdlib, jouet décodage à bande passante liée 模拟器)
**前置要求：**Phase 17 · 04(vLLM Servant interne)
**时间：**- 60 minutes

## Objectif de l'apprentissage

- Expliquer pourquoi l'inference mobile LLM est liée à la mémoire et à la bande passante, tandis que le calcul est un facteur secondaire.
- 列举四个边缘目标(Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson),并将每个目标匹配到一个使用案例──
- Découvrez la pauvreté de couverture WebGPU de 2026 (Firefox Android est en train de se déchiffrer) ainsi que la situation de décalage de Safari iOS 26.
- Pour chaque cible  choisir un format de quantification ANE Utilisez le Core ML INT4 + FP16, l'hexagon Utilisez le QNN INT8/INT4, le navigateur Utilisez le WebGPU Q4, le Jetson Thor Utilisez le NVFP4)。

##  problématique

Un client veut un chatbot sur appareil: voix-première, privée par défaut, disponible en ligne. Dans le MacBook Pro M3 Max, Llama 3.1 8B Q4 avec ~55 tok/s 运行可接受. Dans l'iPhone 16 Pro, le même modèle avec 3 tok/s 运行不可接受. Dans le Snapdragon 8 Gen 3 du terminal Android, il y a 7 tok/s.

La différence de débit n'est pas un problème de portation. Il s'agit d'un décalage de bande passante multiplié par le format de quantification, à nouveau multiplié par NPU si oui ou non il peut être utilisé dans l'espace utilisateur.

## 概念

### La bande passante est la limite maximale

Décodez le nombre de tokens par token 读取完整的重量 集合──一个Q4的7B模型是3.5 GB──以50 GB/s 读取3.5 GB 需要70 ms理论上限约为 ~14 tok/s──在90 GB/s(高端移动DRAM) 下,上限移动到 ~25 tok/s──低于这个数字时,再多计算也没有帮助──

Le centre de données HBM3 以 3 TB/s 读取同样 3.5 GB 需1.2 ms上限是830 tok/s──同型号,同型重量──不同的内存子系统──

### Le moteur neural d'Apple (M4 / A18)

- La mémoire unifiée (CPU et ANE)
-  À travers le Core ML + `.mlmodel`编译模型访问,或通过 PyTorch 经由 Metal Performance Shaders(MPS)访问。
- Llama.cpp Metal backend Utilisez MPS, pas directement en utilisant ANE; native ANE  nécessite une conversion de Core ML。
- Le meilleur chemin de pratique des applications iOS de 2026: utilisation de poids INT4 + activations FP16 de Core ML。

### Qualcomm Hexagon (Snapdragon X Elite / 8 Gen 4)

- Le maximum de 45 TOPS── sont intégrés dans le SoC, avec CPU et GPU, mais avec un domaine de mémoire indépendant──
- QNN(Qualcomm Neural Network)SDK et AI Hub 提供从PyTorch/ONNX的转换──
- Les modèles de chat ✓ Llama 3.2 ✓ Phi-3 ✓ sont publiés comme des objets similaires à AI Hub ✓

### Intel / AMD NPUs (Lunar Lake, Ryzen AI 300)

- 40-50 TOPS──Le logiciel est en retard chez Apple/Qualcomm;OpenVINO est en train de s'améliorer, mais reste un niche──
- Les applications de copilote ARM Windows sont les plus adaptées aux ordinateurs de bureau AMD/Intel.

### L'utilisation de l'appareil

- À travers des shaders de calcul WebGPU dans les modèles de navigateur;
- Dans le M3 Max, Llama 3.1 8B Q4 ≈ 41 tok/s  par le même backend, environ 70% à 80% native 
- WebLLM a 17,6k étoiles GitHub; API JS compatible avec OpenAI; Apache 2.0
- 2026 couverture:Chrome Android v121+、Safari iOS 26 GA,Firefox Android 仍在追赶──总体约为 ~70-75% de la couverture mobile──

### La famille Jetson

- Orin Nano Super(8GB): 可容纳 Llama 3.2 3B、Phi-3,并具有不错的 tok/s。
- AGX Orin: par le biais de VLLM 以 ~40 tok/s 运行 gpt-oss-20b。
- Thor / T4000(JetPack 7.1): performance pour AGX Orin 2x, support EAGLE-3 et NVFP4。
- TensorRT Edge-LLM(2026) support EAGLE-3 décoding spéculatif、Pouches NVFP4、partage pré-remplissageoptimisations du centre de données 已移植到边

### Quantification de chaque cible

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### La longueur du contexte

Le contexte 128K de Llama 3.1 est le fonctionnement du centre de données. Sur les appareils mobiles de 8 Go de RAM, le modèle 4 Go + les jetons 32 Go de 2 Go de cache KV + le coût de l'OS = OOM. Les déploiements Edge vont garder le contexte en 4K-8K, sauf en acceptant une quantification KV activée.

### La voix est une application de tueur

Les agents de voix sont sensibles à la latence (premier jeton < 500 ms)  L'inférence locale va complètement éliminer la latence du réseau  Avec les variantes de la voix-texte (Whisper Turbo)

### Tu devrais te rappeler le nombre

- Apple M4 / A18 ANE:38 TOPS
- Qualcomm Hexagon SD X Elite: 45 sur le dessus
- WebLLM M3 Max:Llama 3.1 8B Q4 上 ~41 tok/s
- AGX Orin: par le biais de VLLM dans le gpt-oss-20b
- L'écart de bande passante entre le centre de données et le bord est de 30 à 50 fois.
- Couverture mobile de la WebGPU: ~70-75%


```figure
edge-bandwidth-pipe
```

## Utilisez-le

`code/main.py`Utiliser des limites de décodage de bande passante limitées par mathématiques pour calculer les objectifs de bord de chaque décodage de décodage de décotage.

## Je le livre.

本课会生成 `outputs/skill-edge-target-picker.md` une plateforme spécifique (iOS/Android/browser/Jetson)  un modèle, ainsi que le budget de latence/mémoire, elle choisit le format de quantification et le pipeline de conversion 

## 练习

1. 运行  référencement`code/main.py`Pour le modèle Q4 7B de la bande passante de Snapdragon 8 Gen 3 ((~77 Go/s), calculer le plafond de décodeur。
2. Pour les navigateurs plus anciens, le WebGPU d'Android a besoin de Chrome v121+.
3. Votre application iOS a besoin de 4K-context streaming. Quel modèle/format vous permet de garder moins de 4 Go de mémoire active sur l'iPhone 16 ?
4. Jetson AGX Orin avec 40 tok/s 运行 gpt-oss-20b―Jetson Nano seulement peut contenir 3B―Si vos produits sont simultanément face à ces deux, comment unis-vous la pile d'inférence?
5. 论证WebLLM dans le 2026 année est-il prêt à la production──引用 couverture, performance, ainsi que Firefox Android gap──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ANE | "Apple neural engine" | M-series 和 A-series 中的 on-device NPU；unified memory |
| Hexagon | "Qualcomm NPU" | Snapdragon NPU；用于访问的 QNN SDK |
| WebGPU | "browser GPU" | W3C-standardized browser GPU API；Chrome/Safari 2026 |
| WebLLM | "browser LLM runtime" | MLC-LLM project；Apache 2.0；OpenAI-compatible JS |
| Jetson | "NVIDIA edge" | Orin Nano / AGX / Thor / T4000 family |
| TRT Edge-LLM | "edge TensorRT" | TensorRT-LLM 的 2026 edge port；EAGLE-3 + NVFP4 |
| Unified memory | "shared pool" | CPU 和 NPU 看到同一块 RAM；没有 copy overhead |
| Bandwidth-bound | "memory limited" | Decode 受读取 weights 的 bytes/sec 限制 |
| Core ML | "Apple conversion" | 用于 ANE-native models 的 Apple framework |
| QNN | "Qualcomm stack" | Qualcomm Neural Network SDK |

## 延伸阅读

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) 格局与基准──
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) Orin / AGX / Thor。
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) 2026 port de bord 公告。
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) 设计与基准──
- [Apple Core ML](https://developer.apple.com/documentation/coreml) Conversion en ANE-native
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) Pour les modèles de transformation préalable en hexagone
