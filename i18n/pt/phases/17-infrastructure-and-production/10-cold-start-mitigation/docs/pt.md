# Mitigação do Começo Frio dos LLM Sem Servidor

> Uma imagem de modelo de 20 GB do frio até a servidão  necessita de 5-10 minutos(7B) até 20+ 分钟(70B) ・・・ em um mundo sem servidor real, não é aquecimento, mas desligamento。 Mitigações 作用在五层:pre-seed node images(AWS 上的 Bottlerocket、双体弧)、model streaming(NVIDIA Run:ai Model Streamer,vLLM 原生支持)、GPU memória instantâneos(Modal checkpoints,restart 最多快 10x)、hot pools(`min_workers=1`(→Layered loading) (→Dram→HBM pipeline, latency 降低 10-200x), bem como a migração ao vivo de Token de entrada de transmissão (KB) em vez de KV cache (GB) (→KV cache) (→KB) (→KB) DATA) (→KB) DATA) (→KB) DATA) (→KB) DATA) (→KB) DATA) (→KB) DATA) (→KB) DATA) (→KB) DATA) DATA) DATA (→KB) DATA) DATA (→KB) DATA) DATA (→KB) DATA) DATA (→KB) DATA (→KB) DATA (→KB) DATA) DATA (→KB) DATA (→KB) DATA) DATA (→KB) DATA (→KB) DATA (→K) DATA) DATA (→K) DATA (→K) DATA) DATA (→K) DATA) DATA (→K) DATA (→K) DATA) DATA (→K) DATA) DATA (→K) DATA (→K) DATA) DATA (→K) DATA (→K) DATA (→K) DATA) DATA (→K) DATA (→K) DATA (→K) DATA) DATA (→K) DATA (K) DATA) DATA (→K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (K) (

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：**Fase 17 · 02 (Economia da plataforma de inferência), Fase 17 · 03 (GPU Autoscaling)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 列举五层缓解冷启动, e em cada nível, dizer uma ferramenta ou padrão.
- 将 70B modelo 計算为 (provisão de nó) + (pesos de download) + (pesos de carga em HBM) + (motor init) 之和。
- 解释为什么直播迁移 传输输输入 Token(KB) em vez de KV cache(GB),以及代价是什么(recomputação)。
- Não é um problema, mas é um problema.`min_workers > 0` transformar-se num limiar de SLA necessário

## 问题
Seu endpoint de LLM sem servidor em escala nocturna para zero.

1. Provisão de Karpenter um nó de GPU:45-60s.
2. O contêiner puxa um peso de 30 GB de imagem: 120-300s.
3. O motor irá carregar pesos até HBM:45-120s, dependendo do tamanho do modelo e da velocidade de armazenamento.
4. VLLM ou TRT-LLM Ini始化 CUDA graphs、KV cache pool、Tokenizer:10-30s。

总计:220-510s(大约 3-8 分钟) 后才会返回一个代币──你的SLA是2s──你发出一个热池──`min_workers=1`), o problema parece desaparecer, mas agora você está a pagar por uma GPU 24x7 em vão. Se o seu serviço tem 5 produtos, cada um tem uma réplica quente, é que 5 × 24 × 30 = 3.600 GPU-horas / mês, independentemente de um usuário estar disponível.

A mitigação do início frio é um método de manutenção da economia sem servidor ao mesmo tempo que se aproxima da latência sempre em funcionamento.

## 概念
### Layer 1  预置节点镜像(Bottlerocket)

Na AWS, a arquitetura de dois volumes do Bottlerocket irá separar o sistema operacional dos dados.`EC2NodeClass`O novo nó está em funcionamento, o passo 2 e o passo 3 desaparecem.

GCP 上的等价方案:带有预烤容器层的自定义VM images──Azure 上:采用相同模式的管理磁盘快照──

### Layer 2  streaming modelo (Run:ai Model Streamer)

Não é esperar o arquivo completo de carga 完再回答第一个请求,而是逐层将重量流到 GPU memory,并在第一个变压器块 常驻后立即开始处理──NVIDIA Run:ai Model Streamer 在 vLLM 2026 中原生提供──支持 S3、GCS 和本地 NVMe──通过将 I/O 和计算设置重叠,大型模型的重量载时间大约减半──

### Layer 3  Snapshots de memória GPU (Modal)

Modal em primeira carga 后对 GPU state(pesoes、CUDA gráficos、KV cache region) fazer checkpoint。后续 restarts 直接消化到HBM,比重新初始化快 10x。这最接近在2秒内启动 一个热 GPU──Trade-off:快照 绑定 per-GPU-topology,所以如果Karpenter将你迁移到不同的 SKU,你需要重新检查点──

### Layer 4  Piscinas quentes (min_workers=1)

A redução mais simples é manter uma réplica sempre pronta. O custo é a taxa horária de uma GPU 24x7.$0.85-$1,50 para evitar 30s início frio), para grandes modelos 则更友好(每小时支付 $4 para evitar 5 minutos início frio) ・pools quentes 变得必需 SLA limiar: normalmente é 70B+ modelo 上 TTFT P99 < 60s。

### Layer 5  Carregamento em camadas (ServerlessLLM)

ServerlessLLM vai armazenar 视为一个层次:NVMe(快但大)、DRAM(中等但可分层)、HBM(小但即时)。Peso 预先加载到DRAM;按需加载到HBM。Paper 报告,相比天真盘到HBM,冷负载的延迟 降低 10-200x。Production adopção 仍处早期,但已经存在与vLLM的整合──

### Layer 6  Migração ao vivo (patrão de bônus)

Quando algum nó é indispensável, o padrão tradicional é o início frio, outra réplica, e a retirada de pedidos de fila. Migração ao vivo vai inserir Token (kilobytes) mover-se para o destino do modelo carregado e para o destino.

### A matemática da piscina quente

Para o serviço P99 TTFT SLA para 2s, a questão não é não ter uma piscina quente, mas necessitar de quantas réplicas quentes, bem como quais são os caminhos para obtê-las.

- Pós-graduação em Educação e Tecnologia`min_workers=1-2`- Não.
- Percurso de lote de fundo ((classificação noturna): aceita escala-zero,可容忍 5-10 分钟 começo frio。
- Nível Premium: para cada inquilino `min_workers`E capacidade dedicada.

### Messa antes de otimizar

Novo nó do modelo de 70B de anatomia de início a frio:

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### Números que você deve lembrar

- Começo a frio modal: 2-4 segundos (Use Snapshots da GPU)
- Baseten 默认 começo frio: 5-10s; utiliza pré- aquecimento 时 sub-secondes
- O início do frio é de 70B.
- Run:ai Modelo Streamer: ~ 2x velocidade de carga de peso
- Carregamento em camadas de servidor sem LLM:latencia 降低 10-200x (números de papel)


```figure
cold-start-pipeline
```

## Use-o
`code/main.py`Relatório total do tempo de início a frio, custo da piscina quente, bem como taxa de pedido de equilíbrio de água quente.

## Entrega-o
本课会产出 `outputs/skill-cold-start-planner.md` determinar o SLA、 tamanho do modelo, forma do tráfego, escolher quais as medidas de mitigação devem ser superadas.

## 练习
1. 运行 `code/main.py` calcular a taxa de pedido de equilíbrio: após ultrapassar esta taxa, a taxa de replicação quente, a taxa de receita de SLO, a taxa de receita de início a frio, a taxa de receita a frio, a taxa de receita a frio, a taxa de receita a frio e a taxa de receita a frio, a taxa de receita a frio, a taxa de receita a frio e a taxa de receita a frio, a taxa de receita a frio e a taxa de receita a frio, a taxa de receita a frio e a taxa de receita a receita a taxa de receita a taxa de receita a taxa de receita mais conveniente.
2. Você vai implementar um modelo 13B, P99 TTFT SLA para 3s.
3. A pré-semente de botelhos eliminou a atração da imagem, mas os pesos ainda precisam de carga de imagem até HBM. Se a velocidade de leitura de NVMe com back-up de imagem for de 7 GB/s, calcula o relógio de parede do modelo 70B.
4. Seu provedor sem servidor  fornece snapshots de GPU (GPU) Modal), mas sua equipe rejeitou, razão é snapshots 会泄露 PII──论证 ambos os pontos de vista:现实风险是什么, mitigation 是什么?
5. Design a política de piscina quente em camadas: utilizadores pagos, utilizadores de teste e cargas de trabalho em lote,

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) Modal 发布的基准和检查点架构──
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) padrão de imagem de volume de dados pré-seededed。
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) 将重量 load  重叠 
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/)Livro de jogo de pré-aquecimento
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) Projeto de carga em camadas。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) Desagregadas desdobramentos de migração ao vivo。
