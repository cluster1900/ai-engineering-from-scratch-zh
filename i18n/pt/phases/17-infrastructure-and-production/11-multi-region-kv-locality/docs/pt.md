# Mestrado em Direito Multiregional Serviço com localização de cache KV

> Para a conclusão de cache LLM, o equilíbrio de carga de round-robin é prejudicial. Uma solicitação se não for alcançada no ponto de posse de seu prefixo, deve pagar preenchimento completo.

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 解释为什么圆轮负载平衡会破坏缓存式推理,并量化 TTFT 惩罚──
- 画出 cache-consciente roteador:输入(KV-cache eventos) 算法(prefixo-hash match)  Ties-breaker(utilização de GPU)
- Explicar 32% do LLM DR 失败驱动因素(缺失 Tokenizer 文件 / quantization configs),并陈述三文件 DR checklist──
- 区分商业 cross-region 产品(Bedrock CRI、GKE Multi-Cluster Gateway) com roteamento consciente de KV。

## 问题
Seu serviço opera em EUA-Leste-1、US-Oeste-2 和 eu-Oeste-1── Você está em frente colocando um ALB,并使用圆.

O round-robin para o serviço sem estado é o melhor. A inferência de LLM é que o design é com estado: KV cache codifica o modelo tudo o que já viu.

Além disso, sua equipe tem um plano DR. Você colocou pesos de modelo em reserva para S3 cross-região.

O Mestrado em Direito Multicorregional que serve é cache 问题、routing 问题和 DR higiene 问题, não é um equilíbrio de carga 问题。

## 概念
### Roteamento consciente de cache

Por favor, leve-o com o tempo suficiente para chegar. Router para prefixo fazer hash (por exemplo, 512 tokens); ele pergunta a cada réplica:  Você tem este prefixo em cache? 🏼 Réplica em blocos de distribuição e expulso 时, através de um canal público / sub  publicar eventos de cache KV. Router selecionar uma réplica adequada; se não houver uma correspondência, volta para o tie-breaker baseado em GPU-util 😇

**vLLM Router**(Rust,2026 produção-pilha): 订阅 `kv.cache.block_added`eventos,维护 prefixo-hash → índice de réplica, us O(1) busca 路由──没有匹配时回落到最小排列深度──

**llm-d router**O mesmo modelo, Kubernetes-nativo, através da API do ControlPlane, publica eventos.

**SGLang RadixAttention**(Fase 17 · 06) é o roteamento intra-replica 等价物──Cross-replica routing 严格发生在上游──

### Números

2K-token prompt 上的 TTFT P50,Llama 3.3 70B FP8,H100:
- Cachegueiro de entrada: ~80 ms。
- Cache miss ((pre-reempimento frio): ~ 800 ms。

10x  diferença。 Se o seu roteador entre as réplicas  atingir 60-80% do cache de prefixos  vida, você está em N-replica  capacidade  baixo perto de uma única réplica  desempenho。 Se ele for apenas 10%, você está perto de escalação ingênua。

### Transregião tem um novo padrão: latência de rede

RTT interregional:
- US-East-1  US-West-2: ~65 ms。
- EUA-Leste-1  Eu-Oeste-1: ~75 ms。
- US-East-1  ap-southeast-1: ~ 220 ms。

Se roteamento Colocar um pedido de US-East-1 送到 ap-southeast-1 的热序号,节省的预填(800 → 80 ms) será colocado 440 ms de ida e volta 抵消──GORGO(2026 research)把这个点显式化:联合最小化`prefill_time + network_latency`, em vez de apenas minimizar o pre-empimento. A resposta é geralmente manter o roteamento regional, exceto se o pre-empimento ocupa predominantes prefixos gigantescos de vários MB.

###  Comércio "infereção transregional"

A inferência transregional de AWS Bedrock irá automaticamente fazer o requisito viajar para outras regiões durante a pressão de capacidade.

Mesmo usando estes produtos, você ainda precisa de um roteador consciente de cache em camadas de aplicativos.

### DR higiene: 32% de arquivos faltantes  problem

广泛引用的2026 统计:32% de LLM DR 失败, é porque a equipe reservou pesos, mas esqueceu:

- `tokenizer.json`Ou `tokenizer.model`
- Configurações de quantização`quantize_config.json`、escalas AWQ、 pontos zero GPTQ)
- Configurações específicas do modelo ((RoPE escalação,mascaras de atenção, modelos de bate-papo)
- Configuração do motor`vllm_config.yaml`、sampulação de padrões 、manifestos do adaptador LoRA)

修复方式是三文件最小 DR manifesto:

1. HF modelo repo 下所有文件(pesos + configurações + Tokenizer)
2. Motor específico de configuração de serviço
3. Manifesto de implantação ((K8s YAML、Dockerfile、bloqueio de dependência)

Além disso, cada trimestre é realizado um exercício DR. JPMorgan us-East-1 no ano de 2024 11 de novembro alcançar 22 minutos de recuperação, apenas porque o livro de jogo já está exercido.

### Residência de dados é um problema

Se o seu roteador com conhecimento de cache  para coincidir com o prefixo, enviar uma solicitação para o TTFT  para o leste de EUA-1, então, independentemente do que o TTFT  ganha, você já infringiu o RGPD, primeiro, o limite de residência para roteadores , re-otimizar o cache

### Você deve lembrar-se de números

- Cache hit vs miss TTFT 差距: ~10x(2K prompt 上 80 ms vs 800 ms) ]]
- RTT interregional EUA-UE: ~75 ms。
- Falha DR: 32%  falta de configurações de Tokenizer/Quantum.
- JPMorgan us-east-1 falhaover 2024 年 11 月:22 分钟(30-min SLA) ⋅


```figure
cache-aware-router
```

## Use-o
`code/main.py`Em cargas de trabalho multi-regionais 上模拟三种路由策略(round-robin、cache-aware regional、cache-aware global) ⋅ report cache hit rate、TTFT P50/P99 和 cross-regional bill──

## Entrega-o
本课产 出 `outputs/skill-multi-region-router.md` regiões determinadas, restrições de residência, SLA, plano de roteamento

## 练习
1. 运行 `code/main.py`Em 75 ms RTT abaixo, comprimento de velocidade até que horas o roteamento trans-regional vai superar o roteamento local?
2. A taxa de acidentes de cache de 70% para 12% foi reduzida.
3. Para um em vLLM, servindo 5, com 5 adaptadores LoRA de 70B AWQ-quantizado modelo design DR manifesto──列出每个 file 和 config──
4. 论证 Bedrock cross-region inferência sobre a existência de uma infra-estrutura de tecnologia de TIEFT SLO rigorosa é não suficiente.
5. Uma solicitação de Paris correspondia ao prefixo do US-East-1...

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | 基于 prefix-hash match，把请求路由到持有 KV-cache 的 replica |
| KV-cache events | "cache pub-sub" | Replicas 发布 block add/evict；router 建索引 |
| Prefix hash | "cache key" | 前 N tokens 的 hash，用作 router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688；把 network latency 作为显式项 |
| Cross-region inference | "Bedrock CRI" | AWS 产品；availability failover，不感知 TTFT |
| DR manifest | "the backup list" | 恢复所需的每个文件，不只是 weights |
| Data residency | "GDPR boundary" | 关于哪个 region 可以看到 user data 的法律约束 |
| RTT | "round-trip time" | Network latency；75 ms US-EU，220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | 作为产品类别的 cache-aware router |

## 延伸阅读
- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1) 带 network latency 项 cross-region KV-cache reuse。
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) documentação de falha de disponibilidade.
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) fonte de roteador consciente de cache。
