# 综合项目 14  Descódigo especulativo 推理服务器

> EAGLE-3 em vLLM 0.7 em tráfego real trouxe 2,5-3x 吞吐量──P-EAGLE (AWS 2026)  mais avançou especulação paralela──SGLang's SpecForge fez um treinamento em larga escala para o projeto de cabeça──Red Hat's Speculators hub                                                                                                                                                                                                                                                                                                                                                                                                                                                 

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 小时

## 问题
A descodificação especulativa em 2026 tornou-se mercadoria. O EAGLE-3 chefe de projeto baseado em modelo-alvo  treinamento em estado oculto,并预测未来 N 个 Token; o modelo-alvo em passagem única será verificado. 60-80% da taxa de aceitação será transformada em 2-3x da capacidade de produção de extremo a extremo. VLLM 0.7 原生集集集成了这一能力. SGLang + SpecForge 提供训练管线.

关键技术不在模型,而在服务运营――接受率会随流量分布漂移(ShareGPT vs code vs domain data)  ocorre rejeição 时的尾延率比不使用猜测更差, portanto, você deve relatar vários tamanhos de lote 下的 p99,而不能只报告稳定状态代币/sec──

## 概念
A descodificação especulativa tem dois níveis.**draft**Modelo (((AGLE-3 head、ngram, or even smaller of target-aligned model)) em cada passo propõe um token 个候选人**target**modelo em uma passagem 中验证全部 k 个 Token; qualquer prefixo aceito irá substituir o caminho ganancioso.

EAGLE-3 em maioria dos tráfego é superior ao draft ngram. P-EAGLE para um projeto mais profundo.

Deployment Using Kubernetes。vLLM 0.7 Cada GPU ou tensor-parallel shard 运行一个复制──HPA 基于队等而不是CPU自动扩缩容量──FP8 (Marlin) 和 INT4 (AWQ) quant 会让 GPU memory 保持在H100 / H200 的范围内──端到端报告包括吞吐量、接受率、批次 1/8/32 下的p50/p99,以及 $/1M Token──

## Arquitetura
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术
- Servidores: vLLM 0,7 ou SGLang 0,4
- Métodos especulativos: cabeças de projeto EAGLE-3  Especulação paralela P-EAGLE  regressão de gramas
- Formação em projeto: SpecForge (SGLang) ou Red Hat Speculators
- Modelos de alvo: Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- Quantização: FP8 (Marlin) ∞INT4 AWQ
- Implementação: Kubernetes + NVIDIA dispositivo plugin; baseado em HPA de metrica de espera na fila
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval, para medir a taxa de aceitação entre domínios
- Referência: TensorRT-LLM descodificação especulativa, como linha de base do fornecedor


```figure
cf-spec-decode
```

## Construí-lo
1. **Target model prep.**选择 Llama 3.3 70B── através de Marlin quantize até FP8──在 1xH100(或 2x tensor-parallel) 上用 vLLM 0.7 部署──

2. **Draft source.**Desde Red Hat Speculators 拉取 alinhado EAGLE-3 chefe de projeto(或通过 SpecForge 训练一个) ⋅加载到 vLLM 的猜测解码配置 中──

3. **Baseline numbers.**Em especulação 之前:batch 1/8/32 下的代币/s、p50/p99 latency、GPU utilization──发布结果──

4. **Enable EAGLE-3.**切换 config;重新运行同一基准――报告速度化、接受率、p99尾延迟三角点――

5. **P-EAGLE.**Activar especulação paralela; medir a diferença entre a árvore de projeto mais profunda e a série EAGLE-3                                                                                                                                                                                                                                                

6. **Domain traffic.**A distribuição de dados e dados sobre o tráfego de um domínio é uma das principais características do tráfego de dados.

7. **Second target model.**Em Qwen3-Coder-30B MoE 上运行同一管道──Draft 更棘手(MoE routing noise)──報告結果──

8. **K8s HPA.**Em K8s, em baixo, em baixo, em baixo, em baixo.`queue_wait_ms`◊ mostrar a escala de carga em três vezes a escala de tempo

9. **Cost comparison.**Em comparação com o Antropic Claude Sonnet 4.7 e OpenAI GPT-5.4

## Use-o
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## Entrega-o
`outputs/skill-inference-server.md`描述 deliverable──一个经过测量的、带投机式解码的服务堆,一个完整的基准报告,以及一个K8s部署──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

## 练习
1. Quando o projeto é projetado em comparação com o objetivo 落后一个版本时 (por exemplo, Llama 3.3 -> 3.4 deriva), medir a degradação da taxa de aceitação.

2.  Realizando a queda de ngram: se a taxa de aceitação da EAGLE-3 for inferior a um limiar, é necessário mudar para o projecto de ngram.

3. 运行一个受控MoE experiment:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音 两种情况对比──测试草案接受敏感性──

4.  expandido para H200 (141 GB) ⋅ relatório para cada réplica ⋅ obtenção de um modelo de tamanho de cabeçalho, bem como se pode servir um Llama 3.3 70B não quantizado ⋅

5. Em um mesmo hardware H100, o TensorRT-LLM descodifica especulativo é comparado ao vLLM.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) Estaca de serviço de referência
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) papel paralelo de descodificação especulativa + integração
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) Projeto de formação de cabeças
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) centro de projeto alinhado
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) Alternativa de fornecedor
- [Fireworks.ai serving architecture](https://fireworks.ai/blog)Referência comercial
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840)Papel de método
- [vLLM repository](https://github.com/vllm-project/vllm) código e referências
