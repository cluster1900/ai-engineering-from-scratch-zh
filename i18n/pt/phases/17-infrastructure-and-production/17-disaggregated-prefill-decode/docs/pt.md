# Preenchimento/Decodificação desagregada  NVIDIA Dynamo 和 llm-d

> Prefill é computacional; decode é memória-ligado. Em um mesmo bloco de GPU, o Planner Switch + SLA Planner irá operar automaticamente em uma das duas partes, em que o processo de desagregação irá dividir-as em recursos independentes, e passar pelo NIXL. RDMA/InfiniBand ou TCP fallback) entre elas, transmitindo KV cache. Nvidia Dynamo. GTC 2025  GTC 1.0  GA) localizado em vLLM/SGLang/TRT-LLM, seu Planner Switch + SLA Planner irá gastar um dos recursos.$2M 级别推理支出上节省 30–40%（即 $600-800K/ano); esse específico $2M→$600-800K números é interno composto, não é um único caso publicado estudo, deve ser considerado como um nível numérico de pontos, em vez de referência.

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## Objectivo de aprendizagem

- Explica por que prefill e decode há diferentes GPUs de distribuição, e quantificação colocação.
- draw out desagregada arquitetura:prefill pool、decode pool、 através de transferência KV 、router de NIXL、
- Dizer desagregação Não planejar condições
- 区分 NVIDIA Dynamo (stack-over) e Ilm-d (Kubernetes-native),并把它们匹配对应的运维场景──

## 问题

Você está em 8 blocos H100 上运行 Llama 3.3 70B. Em um trabalho mixado (incluindo: 长提示 + 短输出) ,GPU em decodificação 期间空,因为大部分计算已经花在预填上. Em outro tipo de trabalho (incluindo: 短提示 + 长输出) ,情况相反.

Budget Impact:20-40% de GPU Time Waste on erroneous resource── Você está comprando um computador H100 para executar um decodificador com memória, ou comprando uma largura de banda H100 HBM para executar um pre-reempimento computacional── ambas são custos altos.

Disagregação 会把 prefill 和 decode 拆分到独立资源池,并按各自瓶进行尺寸化──KV cache 通过高带宽互连从prefill pool 传输到decode pool──

## 概念

### Por que é diferente?

**Prefill** Para o prompt de entrada completa  executa uma vez o transformador para a frente―Multiplicações de matriz  ocupam a principal função; ligado à computação―H100 FP8 可提供约2000 TFLOPS的有效吞吐──Batch efficiency 很好,一次前可处理许多代币―

**Decode** 一次生成一个代币,每次代都读取完整重量──memória-bandwidth-bound──HBM3 提供约3TB/s──Batch efficiency 只有在高 concurrency下才好,因为重量读读会在批上分摊──

Colocar: você compra simultaneamente para duas GPUs optimizadas. H100 são bons, mas não importa qual seja o custo de uso.

### Arquitetura

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL é o transporte inter-nodo da NVIDIA. O transporte inter-nodo é o transporte de NIXL.

### Dinamo vs. llm-d

**NVIDIA Dynamo**(GTC 2025 发布,1.0 GA):
- Como orquestrador, está em VLLM, SGLang, TRT-LLM.
- Planner Profiiler 测量工作负载,SLA Planner Automatic Configuration prefill:decode 比例。
- Núcleo de rugos, extensão de Python.
- 吞吐提升:NVIDIA 报告称,在 GB200 NVL72 + Dynamo 上,DeepSeek-R1 MoE 在中等延迟区间达到6x(developer.nvidia.com,2025-06);社区关于全黑威尔 + 迪纳莫 + DeepSeek-R1 stacks 多达30x 的报告缺少单一主要来源,应视为方向性信息──
- GB300 NVL72 + Dynamo: segundo Dynamo 产品页(developer.nvidia.com,未注明期),相比霍珀,MOE 吞吐最高可可达50x──

**llm-d**(Red Hat + AWS,Kubernetes nativo):
- Preencher / decodificar / rotear 作为独立 Kubernetes Services。
- Por função HPA 使用 queue depth (profile) / KV utilization (decode)
- `topologyConstraint packDomain: rack`Vou colocar as cliques de prefill + decode  na mesma prateleira, para conseguir a transferência de KV de alta banda larga 
- Ilm-d 0.5(2026):descarga de KV hierárquica, roteamento de LoRA consciente de caché, rede UCCL, escala a zero,

Se você quiser um orquestrador de pila superior, use Dynamo. Se você quiser primitivos nativos Kubernetes, e já está em CNCF 生态, use llm-d.

### 经济性

内部 composite ( não é um único estudo de caso publicado, apenas como um número de pontos):

- O gasto de serviços colocados é de US$ 2 milhões por ano.
- 切换到使用 Dinamo's porção desagregada。
- O mesmo volume de solicitação, o mesmo SLA de latência P99.
- 報告节省:$600K–$800K/ano (reduzido 3040%)
- Não há novos hardware.

Nós recebemos esse número de vários relatórios de clientes, e não de um único estudo de caso citável; o ponto de dados mais próximo é o roteamento Dynamo KV de Baseten, que traz um TTFT 2x mais rápido / 61% de maior rendimento.

### Não se desagregue

- Instruções < 512 tokens 且输出 < 200 tokens:传输税主导收益。
- 小型集群 ((< 4 GPUs): não há diversidade suficiente em piscina。
- 团队无法运维两个GPU pool并进行每个角色规模:Dynamo 会有帮助,但并非无复杂性.
- 没有 RDMA fabric:TCP transfer tax 更重──

### Roteador e Fase 17 · 11 集成

Roteadores desagregados são KV-cache-aware(Fase 17 · 11)。 solicitação vai cair até o grupo de decodificação de seus prefixos; se não estiverem em conformidade, vamos preencher → decodificar。

### O MoE de Blackwell é o único lugar numérico.

GB300 NVL72 + Dynamo mostrou a comparação entre as linhas de base Hopper 50x de MoE 吞吐──MoE roteamento especialista em preenchimento acima computação-pesado, mas em decodificação acima memória-pesado(experto caches), portanto, a desagregação é o modelo de fronteira de 2026 ano servindo 以 MoE 为主----DeepSeek-V3、未来 GPT-5 variantes)──

### Você deve lembrar-se de números

A lista de referências é de:

- GB200 NVL72 + Dynamo 上的DeepSeek-R1:中等延迟区间相相比基线约 ~6x 吞吐(developer.nvidia.com,2025-06);社区关于全黑威尔 + 迪纳摩堆高达30x的说法是方向性聚合,没有单一的首发来源──
- GB300 NVL72 + Dynamo:相比 Hopper,MoE 吞吐最高可达 50x(developer.nvidia.com,未注明期)
- 节省点(内部 composite, não é um estudo de caso único):$2M 年度支出中节省 $600-800K/ano.
- Prazo de desagregação:comunações > 512 tokens + saídas > 200 tokens。
-  através de transferência de KV de NIXL: 70B FP8  4K-prompt KV  necessita de 20-80 ms


```figure
prefill-decode-split
```

## Use-o

`code/main.py`模拟 colocated versus disaggregated serving── relatório de throughput、cost per request, bem como crossover de longo prazo──

## Entrega-o

本课会产出 `outputs/skill-disaggregation-decider.md` Dadas cargas de trabalho e grupos, o que se deve fazer é desagregar-se.

## 练习

1. 运行 `code/main.py`Em que tempo rápido, a desagregação será melhor do que a colocação?
2. Para um P99 de comprimento prefixo para 8K, saída para 300 de RAG serviço
3. Dynamo vs llm-d:为一家纯Kubernetes shop 选择一个方案,且没有Python runtime 偏好。
4. 計算 KV transfer cost:70B FP8 上 4K prefill = ~500 MB KV──在 RDMA 100 GB/s 下, transfer = 5 ms──在 TCP 10 GB/s 下 = 50 ms── qual vai afetar o seu SLA?
5. O roteamento de especialistas do MOE irá alterar os padrões de acesso ao KV.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “split prefill/decode” | 为每个阶段使用独立 GPU pools |
| NIXL | “NVIDIA transport” | Dynamo 的 inter-node KV transfer（RDMA/TCP） |
| NVIDIA Dynamo | “the orchestrator” | vLLM/SGLang/TRT-LLM 的 stack-above coordinator |
| llm-d | “Kubernetes native” | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | “Dynamo auto-config” | 测量工作负载，配置 pool ratios |
| SLA Planner | “Dynamo policy” | 自动按速率匹配 prefill:decode 以满足 SLOs |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放在同一 rack 上以实现快速 KV |
| UCCL | “unified collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “expert per token” | DeepSeek-V3 pattern；disaggregation 有帮助 |

## 延伸阅读

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
