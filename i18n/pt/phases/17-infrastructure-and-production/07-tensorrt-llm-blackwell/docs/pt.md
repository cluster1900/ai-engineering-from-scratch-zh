# Em Blackwell, usando FP8 e NVFP4

> TensorRT-LLM  apenas para NVIDIA, mas é em Blackwell  上胜出──                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       $0.012，而 H100 + vLLM 为 $Esta pilha é a única que pode ser usada para o processamento de dados de computador. Esta pilha é a única que pode ser usada para o processamento de dados de computador. Esta pilha é a única que pode ser usada para o processamento de dados de computador. Esta pilha é a única que pode ser usada para o processamento de dados de computador.

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**Fase 17 · 04 (vLLM Servings Internals), Fase 10 · 13 (Quantização)
**Time:** ~75 分钟

## Objectivo de aprendizagem

- Explicação de porquê usar o NVFP4,FP8 para cache KV 和 Atenção  ainda é importante.
- 計算境界模型 在 BF16、FP8 和 NVFP4 下的HBM footprint,并推理节省来自哪里──
- Explicar o TRT-LLM utilizado de Blackwell características especiais ((day-0 FP4、MTP、desagregado servindo、todos para todos primitivos)
- 判断什么时候 TRT-LLM's NVIDIA-lock 值得交换对 Hopper 上 vLLM's 7x 成本差距──

## 问题

2026 ano de pressão econômica da linha de frente é o que o dólar pode produzir em quatro níveis. A resposta depende de quatro níveis de seleção: hardware代际(Hopper H100/H200 vs Blackwell B200/GB200) 精度(BF16 → FP8 → NVFP4) ✓ motor de serviço(vLLM vs SGLang vs TRT-LLM)

Em Hopper + vLLM 上,120B MoE de custo de operação cerca de por milhão de tokens ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0,012,便宜 7x── parte da diferença é de hardware(Blackwell's Single GPU LLM 吞吐相对Hopper 高 11-15x)── a outra parte é de pilha:FP4 权重、MTP draft、disaggregated prefill/decode, bem como para uso em comunicação de especialistas do MoE NVLink 5 tudo-a-todo──

Não pode ser reconstruído fora da pilha NVIDIA. É assim que se faz: com transferência de recursos.

## 概念

### Por que FP8 ainda é o fundo do cache KV

Um erro comum de 2026 é: supõe que NVFP4 possa ser aplicado em todos os lugares. O fato não é assim.

NVFP4(2025-2026) aplica-se ao peso e ao valor de atividade.

典型 Blackwell 配置:

- 权重:NVFP4 ((4 bits de microscálise) ⋅
- 激活值:NVFP4──
- Caches de KV:FP8。
- Acumulador de atenção:FP32 ((softmax 稳定性) ⋅

### TRT-LLM utiliza Blackwell características primitivas

- **Day-0 FP4 weights**Modelo fornecedor de publicação direta FP4 权重;TRT-LLM 无需后培训转换即可加载;;FP4 不需要 AWQ / GPTQ 步骤;;
- **Multi-token prediction (MTP)**A fase 17 é a mesma, mas é integrada na construção do TRT-LLM.
- **Disaggregated serving**:prefill 和 decode 位于 GPU pools independentes,KV cache 通过 NVLink或InfiniBand 传输──与Dynamo(Phase 17 · 20)
- **All-to-all communication primitives**A NVLink 5 irá reduzir a latência de comunicação de especialistas em MoE em 3x em comparação com Hopper.
- **NVFP4 + MXFP8 microscaling**: Blackwell Tensor Cores 上的硬件加速尺度-factor 处理──

### Você deve lembrar-se de números

- HGX B200  através de TRT-LLM em GPT-OSS-120B                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
- GB200 NVL72 通过Dynamo (TRT-LLM) alcançar $0.012/M Token。
- H100 + vLLM em carga de trabalho comparável acima de US $ 0,09 / M Token.
- TRT-LLM 更新三月带来 2.8x 吞吐增益(2026)。
- Blackwell comparado com Hopper's Single GPU LLM 吞吐为11-15x──
- MLPerf Inference v6.0(2026 年 4 月):Blackwell 主导每个提交任务──

### FP4 em qualidade real preço

NVFP4  muito ativado. Em pesada carga de trabalho de raciocínio ([[catena de pensamento]], matemática]], 长上下文代码-gen) ,FP4 权重会明显退化──Per-block calibração pode ser aliviada, mas não pode ser eliminada── os grupos de modelos de raciocínio geralmente usam FP8 权重 + FP4 激活值作为折中, ou persistir em H200 上全程使用 FP8──

规则: 始终在你的评估设上验证任务质量. 始终在你的评估设上验证任务质量. 规则: 始终在你的评估设上验证任务质量.

### Por que é que é uma NVIDIA-bloqueio  decisão

TRT-LLM é C++ + CUDA + kernels de código fechado。 o modelo precisa de um SKU específico de GPU 编译。 não suporta AMD, não suporta Intel, não suporta ARM。 se sua infra-estratégia é multi-vendor, então TRT-LLM é impossível para o nível servido TRT-LLM; você ainda pode usar o vLLM em hardware misturado。 se for apenas NVIDIA, então 7x 差距足以为锁付。

### 2026 ano de utilização prática

 Para uma contabilidade de cálculo anual de US$ 100 milhões, a operação Hopper + vLLM 会留下 7-10x 的优化空间──把成本主导型工作负载 迁移到Blackwell + TRT-LLM + Dynamo──把实验层保留在H100 + vLLM 上,以获得模型代速度──每个 NVFP4转换模型上生产前必须验证质量──

### Bónus de desagregação

A distribuição desagregada do TRT-LLM ([[分离的预填和解码池]]) estará na fase 17 · 20 中深入讲解──在Blackwell 上,乘数会叠加:FP4 权重 × MTP speedup × desagregada colocação × cache-aware routing──7x 数字假设使用的是这套完整堆──


```figure
pipeline-parallel
```

## Use-o

`code/main.py`会为三种堆 计算模型的HBM footprint、decode throughput(memória-bound regime) 和 $/M-token:H100 + BF16 + vLLM、H100 + FP8 + vLLM、B200 + NVFP4/FP8 + TRT-LLM──运行它,观察复合效应,以及每个变化贡献了差距中的哪一部分──

## Entrega-o

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md` Dado o volume de tokens anual, ele vai julgar se a pilha Blackwell + TRT-LLM vale a pena NVIDIA-lock.

## 练习

1. 运行 `code/main.py` Para um parâmetro ativo é 30% de 120B MoE, calcula H100 BF16、H100 FP8 e B200 NVFP4/FP8 em alta capacidade de decodificação com limite de largura de banda de memória― o maior aumento vem de onde?
2. 某客户每年在H100 + vLLM 上花费2M$. Considerando a 7x 经济差距, eles precisam comprar quantas GPUs Blackwell para transferir a troca de troca em 12 meses para o custo de TRT-LLM?
3. NVFP4 权重转换后, você em MATH 上看到准确率下降 3 个点──说出两条恢复路径:一条质量第一(保留 FP8 权重),一条成本第一(使用域内数据做校准)──
4. 阅读MLPerf v6.0 resultados de inferência ― Qual é a menor diferença entre Blackwell-over-Hopper e quê?
5. 計算 405B 模型在 NVFP4 权重 + FP8 KV cache、128k contexto 下所需的HBM──它能装进单个GB200 NVL72 节点吗?

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
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) NVLink 5 tudo para tudo com os núcleos MoE。
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方 engine 文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) Orquestração desagregada sobre TRT-LLM 之。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
