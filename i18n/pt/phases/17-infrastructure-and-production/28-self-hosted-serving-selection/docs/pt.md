# Servidores autogestidos 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> 2026 ano, quatro motores orientados para a inferência de autotúdio.**llama.cpp**Em CPU  modelo 支持最广,对量化和 threading 拥有完全控制──**Ollama**É um programa de instalação de comando desenvolvido em blocos de computadores, em comparação com llama.cpp 慢约15-30% ((Go + CGo + HTTP serialization), em classe de produção 差 3x **TGI 于 2025 年 12 月 11 日进入维护模式** Apenas se fazem correções de bugs, o rendimento bruto é de cerca de 10% mais lento que o vLLM, mas no passado, em termos de observabilidade e integração do ecossistema HF, geralmente é o nível de topo.**vLLM**É uma versão de um novo PyTorch 2.10  RTX Blackwell SM120  H200 otimização.**SGLang**É muito mais rápido que o computador, mas não é muito mais fácil de usar. É muito mais fácil de usar. É muito mais fácil de usar.

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## Objectivo de aprendizagem
- Em dados hardware ((CPU / AMD / NVIDIA Hopper / Blackwell) √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √
- Explicar o estado do TGI em 2026 (em 2025), bem como por que vai fazer com que os novos projetos se orientem para o VLLM ou SGLang.
- 描述全程使用相同 GGUF或 HF weights 的 dev/staging/prod pipeline。
- Explicação de por que apenas a CPU vai forçar o uso de llama.cpp, enquanto a AMD vai excluir o TRT-LLM.

## 问题
Sua equipe iniciou um novo projeto de LLM autônomo. Um engenheiro diz Ollama, outro diz VLLM, terceiro diz TGI não é de caixa aberta?

Em 2026, a seleção de árvores é importante: primeiro ver hardware, depois ver escala, depois ver carga de trabalho.

## 概念
### 5 motores

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件 decisão prioritária

**仅 CPU**→ llama.cpp──Ollama também pode usar, mas mais lentamente── não há outro motor na CPU que tenha competência──

**AMD GPU**→ vLLM(AMD ROCm 支持)。SGLang também pode ser usado。TRT-LLM 被 NVIDIA 锁定,所以排除──

**NVIDIA Hopper (H100 / H200)**→ VLLM ou SGLang ou TRT-LLM──三者都是顶级──

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM é o líder de produção (Fase 17 · 07)。vLLM 和 SGLang 紧随其后。

**Apple Silicon (M-series)**→ llama.cpp(Metal) ・ Ollama foi fechado em relação a ele

###  规模其次决策

**1 个用户 / local dev**→ Ollama。一条命令,数秒内 primeiro-token。

**10-100 个用户 / 小团队**→ VLLM single-GPU。

**100-10k 个用户 / production**→ estaca de produção de VLLM (Fase 17 · 18) ou SGLang。

**10k+ 个用户 / enterprise**→ VLLM produção-pilha + desagregada(Fase 17 · 17) + LMCache(Fase 17 · 18)。

### Carga de trabalho III. Decisão

**General chat / Q&A**→ vLLM в широком мёрдовом сценарию в победе

**Agentic multi-turn（tools、planning、memory）**→ SGLang's RadixAttention(Fase 17 · 06) 占优。

**带有大量 prefix reuse 的 RAG**→ SGLang。

**Code generation**→ vLLM pode;SGLang está em cache 上略好。

**Long context (128K+)**→ VLLM + preenchimento em pedaços; SGLang + KV em camadas。

### TGI 维护陷

Hugging Face TGI 于 2025 年 12 月 11 日进入维护模式  之后只做bug fixes──过去:顶级可观测性、同类最佳HF 生态系统集成(model cards、安全工具),raw throughput 略落后于vLLM──

Para o novo projeto de 2026: evitar o TGI.

### Pipeline 模式

Dev(Ollama)→ encenada(llama.cpp)→ prod(vLLM)。全程使用相同的GGUF或HF weights──工程师在笔记本上快速代;encenada 镜像生产量化;prod 是服务 目标──

### Ollama Notas

Ollama  muito adequado para dev── não é adequado para produção compartilhada: Vai serialização HTTP 会增加开销, gestão de moeda 比 vLLM 更简单,OpenTelemetry 支持滞后──把 Ollama 用在它擅长的地方  一个用户、一条命令  然后在共享场景切换到 vLLM──

### Autotestamento vs gerenciado é outra decisão

Fase 17 · 01(hiperscalers gerenciados) 、· 02(plataformas de inferência) 覆盖 managed。本课假设你已经决定自托管──自托管的理由:data residency、custom fine-tune、规模化后的总成本所有、托管服务上不可用域名模型──

### Você deve lembrar-se de números

- TGI 维护模式:2025 年 12 月 11 日。
- VLLM v0.15.1:2026 年 2 月;PyTorch 2.10;Blackwell SM120 支持──
- SGLang 生产足迹: 400.000+ GPUs
- O rendimento de Ollama é de 15-30% lento, a produção é de 3x.


```figure
data-parallel
```

## Use-o
`code/main.py`É um caminhador de árvore de decisão: given determined hardware + scale + workload, choose one engine并解释原因──

## Entrega-o
本课产 出 `outputs/skill-engine-picker.md`❖ Fornecer restrições, escolher um motor e escrever um plano de mudança.

## 练习
1. Usar o seu hardware / escala / carga de trabalho 运行 `code/main.py`O que é que o seu intuito diz?
2. Sua infra é 12 ZAN H100 e 8 ZAN MI300X AMD... com que motor?
3. Uma equipa pensa em usar o TGI em 2026, porque é algo que estamos familiarizados com.
4. Ollama dev até vLLM prod: quantização, configuração e observabilidade
5. RAG 产品的P99 prefix length 为 8K,并且租户间复用率很高──选择一个引擎,并结合阶段17 · 11 + 18 组成堆──

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
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) notas de liberação。
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
