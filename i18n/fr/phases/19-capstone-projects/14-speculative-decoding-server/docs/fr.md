# 综合项目 14  Décodage spéculatif 推理服务器

> EAGLE-3 de vLLM 0.7 a apporté 2,5 à 3 fois la capacité de débit en vrac. P-EAGLE (AWS 2026) a poursuivi la spéculation parallèle. SpecForge de SGLang a fait une formation à grande échelle sur le projet de tête. Red Hat's Speculators hub a publié un projet d'ouverture. TensorRT-LLM a permis au décodage spéculatif de devenir une capacité de première classe sur NVIDIA.

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 小时

##  problématique
Le décoding spéculatif est devenu une marchandise en 2026[6]. EAGLE-3 projet de tête basé sur le modèle cible  entraînement à l'état caché,并预测未来 N 个代币; le modèle cible en cours de validation en un seul passage[6].

关键技术不在模型,而在服务运营中. 接受率会随流量分布漂移 (ShareGPT vs code vs domain data) 发生拒绝 (Réjection) 时的尾延迟比不使用投机更差,因此你必须报告多个批量 下的 p99,而不能只报告稳定状态代币/sec──对Anthropic / OpenAI API的每1M代币 成本,是可信度的杆──

## 概念
Le décoding spéculatif a deux niveaux.**draft**modèle (((ÉGLE-3 tête, gramme, ou modèle aligné sur l'objectif plus petit) à chaque étape proposant un Token de candidature**target**modèle en une seule fois passe 中验证全部 k 个 Token; tout préfixe accepté ville se substituer à la voie avide.

EAGLE-3 sur la plupart des flux est supérieur à ngram drafts。P-EAGLE pour un draf plus profond 运行平行投机──取舍是:P99 latency 拒绝时更高,因为验证通过更大──服务配置 必须报告按批量桶 划分的延迟,以暴露这一点──

Déploiement utilise Kubernetes。vLLM 0.7 Chaque GPU ou shard parallèle tensor 运行一个复制──HPA 基于队等而不是CPU自动扩缩容量──FP8 (Marlin) 和 INT4 (AWQ) quant会让 GPU memory 保持在H100 / H200的范围内──端到端报告包括吞吐量、接受率、批量 1/8/32 下的p50/p99,以及$/1M Token──

## 架构
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
- Servant: vLLM 0,7 ou SGLang 0,4
- Méthodes spéculatives: tête de projet EAGLE-3  spéculation parallèle P-EAGLE  renversement en grammes
- Formation en projet: SpecForge (SGLang) ou Red Hat Speculators
- Modèles cibles: Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- Quantification: FP8 (Marlin) ∞INT4 AWQ
- Déploiement: Kubernetes + NVIDIA plugin de périphérique; basé sur la métrique d'attente de file d'attente
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval, utilisé pour mesurer le taux d'acceptation des distributions à travers les domaines
- Références: Décodage spéculatif TensorRT-LLM, en tant que référence du fournisseur


```figure
cf-spec-decode
```

## - Je le construis.
1. **Target model prep.**选择 Llama 3.3 70B──en utilisant le VLLM 0.7 部署──en utilisant le Llama 3.3 70B, en utilisant le Marlin quantize jusqu'à FP8──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 部署──en utilisant le VLLM 0.7 选择

2. **Draft source.**De Red Hat Speculators 拉取 aligné EAGLE-3 tête de projet(或通过 SpecForge 训练一个) ⋅加载到 vLLM 的投机式解码配置 中──

3. **Baseline numbers.**Dans le cadre de la spéculation, le groupe 1/8/32 a publié des résultats.

4. **Enable EAGLE-3.**切换 config; relancer le même benchmark― report speedup、 acceptation rate、p99 delta de latence de la queue―

5. **P-EAGLE.** Activation de la spéculation parallèle; mesure de la différence entre l'arbre de projet plus profond et le série EAGLE-3  Rapport P-EAGLE de la transformation en point de vue dangereux

6. **Domain traffic.**Pour le partage de GPT, HumanEval et de trafic spécifique au domaine, le trafic est effectué par le même serveur, en fonction du taux de réception des mesures de distribution, et le détail de la dérive est identifié.

7. **Second target model.**Dans le cadre de la mise en œuvre de la directive, les autorités de sécurité et de sécurité des entreprises doivent être soumises à la directive.

8. **K8s HPA.**Dans les K8s, la défense et la police ne sont pas en train de suivre.`queue_wait_ms`◊ démontrer la charge de changement de trois fois l'échelle de temps ◊

9. **Cost comparison.**Dans la même évaluation, $/1M Token,并与人类克劳德索内特4.7 和 OpenAI GPT-5.4比较──发布结果──

## Utilisez-le
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## Je le livre.
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
1. Lorsque le projet est supérieur à l'objectif 落后一个版本时 (par exemple, Llama 3.3 -> 3.4 dérive), mesure la dégradation du taux d'acceptation.

2.  Réalisation du recul des gramme: si le taux d'acceptation de l'EAGLE-3 est inférieur à un certain seuil, il est possible de passer au projet de gramme.

3. 运行一个受控MoE实验:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音 两种情况对比──测试草案接受敏感性──

4.  étendre à H200 (141 Go) ⋅ rapport pour chaque réplique  obtenir de la taille du modèle de la salle de tête, ainsi que si elle peut servir un Llama 3.3 70B non quantifié ⋅

5. Dans le même matériel H100, le décodage spéculatif TensorRT-LLM est mis en évidence.

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
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) pile de service de référence
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) papier de décoding parallèle + intégration
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) L'équipement de formation de la tête de projet
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) centre de projet aligné
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) alternative au fournisseur
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) référence commerciale
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) papier méthodologique
- [vLLM repository](https://github.com/vllm-project/vllm) code et critères de référence
