# Servir en auto-hébergement 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> En 2026, quatre moteurs ont été créés pour la sélection des données en fonction du matériel, de la taille et de l'écosystème.**llama.cpp**Dans le modèle de la CPU, le plus rapide, le plus large, le plus large, le plus large, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus grand, le plus, le plus, le plus grand, le plus.**Ollama**Il s'agit d'un programme de mise en place de commandes, qui est lent de 15 à 30% par rapport à llama.cpp.**TGI 于 2025 年 12 月 11 日进入维护模式** Seuls les corrections de bugs sont effectuées, le débit brut est plus lent que le vLLM ≈10%, mais le niveau de l'observabilité et de l'intégration du système de gestion de la HF est généralement le plus élevé.**vLLM**Il est également utilisé pour la production de pyTorch 2.10 RTX Blackwell SM120 H200.**SGLang**Il y a plus de 400 000 GPUs en production dans le secteur de la technologie. Il y a plus de 400 000 GPUs en production dans le secteur de la technologie.

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## Objectif de l'apprentissage
- Dans le cadre de la mise en œuvre de la technologie, les utilisateurs peuvent utiliser des logiciels de gestion de données et de gestion de données.
- Il a été annoncé que le projet de construction de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'é (le d'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'établissement de l'é (le d'établissement de l'établissement de l'é (le d'é) en 20262026 (le) en 2025) et de l'é (le
- 描述全程使用相同 GGUF ou HF weights 的 dev/staging/prod pipeline。
- Expliquer pourquoi le CPU ne doit pas utiliser llama.cpp, alors que le AMD ne doit pas utiliser TRT-LLM.

##  problématique
Votre équipe a lancé un nouveau projet de LLM autonome. Un ingénieur dit Ollama, un autre dit VLLM, un troisième dit TGI n'est-il pas en usage ?

En 2026, le choix du bois est important: d'abord voir le matériel, ensuite voir la taille, ensuite voir la charge de travail.

## 概念
### 5 moteurs

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件 décision prioritaire

**仅 CPU**→ llama.cpp──Ollama peut aussi être utilisé, mais plus lent── il n'y a pas d'autre moteur sur le CPU avec une concurrence―

**AMD GPU**→ vLLM(AMD ROCm 支持)。SGLang 也能用──TRT-LLM 被 NVIDIA 锁定,所以排除──

**NVIDIA Hopper (H100 / H200)**→ VLLM ou SGLang ou TRT-LLM──三者都是顶级──

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM est le leader du débit Phase 17 · 07)。vLLM 和 SGLang 紧随其后。

**Apple Silicon (M-series)**→ Llama.cpp(Metal)

###  规模其次决策

**1 个用户 / local dev**→ Ollama。一条命令,数秒内 premier jeton。

**10-100 个用户 / 小团队**→ VLLM à un seul GPU

**100-10k 个用户 / production**→ vLLM production-stack ((Phase 17 · 18) ou SGLang。

**10k+ 个用户 / enterprise**→ vLLM production-stack + décomposé(Phase 17 · 17)+ LMCache(Phase 17 · 18)。

### Charge de travail

**General chat / Q&A**→ vLLM dans une large mesure de la réussite

**Agentic multi-turn（tools、planning、memory）**→ RadixAttention de SGLang (Phase 17 · 06)

**带有大量 prefix reuse 的 RAG**→ SGLang。

**Code generation**→ vLLM 可以;SGLang 在缓存 上略好。

**Long context (128K+)**→ VLLM + pré-remplissage en morceaux; SGLang + KV à couches

### TGI 维护陷

Hugging Face TGI 于 2025 年 12 月 11 日进入维护模式  之后只做bug fixes──过去:顶级可观性、同类最佳HF 生态系统集成(模型卡、安全工具),raw throughput 略落后于vLLM──

Pour le nouveau projet de 2026: éviter par défaut le TGI.

### L' économie

Dev(Ollama)→ mise en scène(llama.cpp)→ prod(vLLM)。

### Ollama Fait attention

Ollama 很适合 dev. Il ne convient pas à la production de partage:Go HTTP serialization 会增加开销,compensation management比 vLLM 更简单,OpenTelemetry 支持滞后――把 Ollama用在它擅长的地方  一个用户、一条命令  然后在共享场景切换到 vLLM──

### Autonomie et gestion est une autre décision

La phase 17 · 01(hypercalers gérés) 、· 02(plateformes d'inférence) 覆盖 managed。本课假设你已经决定自托管──自托管的理由:data residence、custom fine-tune、规模化后的总成本所有、托管服务上不可用域名模型──

### Tu devrais te rappeler le nombre

- TGI 维护模式:2025 年 12 月 11 日。
- VLLM v0.15.1:2026 年 2 月;PyTorch 2.10;Blackwell SM120 支持──
- SGLang 生产足迹: 400 000+ GPUs
- Débit d'Olama par rapport à celui de llama.cpp: lent 15-30%; production load


```figure
data-parallel
```

## Utilisez-le
`code/main.py`Il s'agit d'un marcheur d'arbre de décision: donner un matériel + une échelle + une charge de travail, choisir un moteur et expliquer la raison.

## Je le livre.
本课产 出 `outputs/skill-engine-picker.md` Donner des conditions, choisir un moteur et rédiger un plan de déménagement

## 练习
1. Avec votre matériel / échelle / charge de travail 运行 `code/main.py`Le produit est-il conforme à votre intuition ?
2. Votre infra est de 12 ZAN H100 et 8 ZAN MI300X AMD... avec quel moteur ? Pourquoi TRT-LLM est-il incontournable ?
3. Un groupe de travail a décidé d'utiliser le TGI en 2026, car c'est quelque chose que nous connaissons.
4. Il y a des changements dans la quantité de l'information, la configuration et l'observabilité.
5. La longueur du préfixe P99 du produit RAG est de 8K, et le taux de réutilisation est très élevé.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | “CPU 那个” | 最广 model 支持，CPU 上最快 |
| Ollama | “笔记本那个” | 一条命令安装，dev-grade throughput |
| TGI | “HF 的 serving” | 自 2025 年 12 月起维护模式 |
| vLLM | “默认选择” | 2026 年广泛生产 baseline |
| SGLang | “agentic 那个” | Prefix-heavy，RadixAttention |
| TRT-LLM | “NVIDIA 锁定” | Blackwell throughput 领先者，仅 NVIDIA |
| GGUF | “llama.cpp 格式” | Bundled K-quant variants |
| Production-stack | “vLLM K8s” | Phase 17 · 18 reference deployment |
| Pipeline pattern | “dev→stage→prod” | 同一 weights 上的 Ollama → llama.cpp → vLLM |

## 延伸阅读
- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) notes de libération。
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
