# Kubernetes 上的 GPU Autoscaling  Karpenter, KAI Scheduler, Gang Scheduling

> É três níveis, não é uma camada. Carpenter 动态供给节点(不到一分钟,比 Cluster Autoscaler 快 40%) ∙KAI Scheduler 处理帮安排、拓感知和分层队列  它能避免 7-of-8 的部分分配陷:七节点因为缺缺一个GPU而等并烧钱──应用层自动式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式`DCGM_FI_DEV_GPU_UTIL`É a medida do ciclo de trabalho: 100%, talvez 10 requisições, também 100 个.`WhenEmptyOrUnderutilized`策略, porque vai acabar com o trabalho de GPU em execução no processo de elaboração.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：**Fase 17 · 02 (Economia da plataforma de inferência), Fase 17 · 04 (vLLM Servings Internals)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- 画出三层自动扩展 架构 节点供给、帮规划、应用层),并说出每层使用的工具──
- Explica porquê .`DCGM_FI_DEV_GPU_UTIL`É o erro do VLLM HPA 信号,并说出两个替代信号(队列深度、KV cache utilization rate)
- 描述帮派安排以及 KAI Scheduler 防止的部分分配失败模式(8 GPUs em que há 7 个空等待) ⋅
- "Concordo que estamos a trabalhar com a GPU"`WhenEmptyOrUnderutilized`),并说明2026年的安全替代方案──

## 问题
Sua equipa em Kubernetes 上 lançou um serviço de LLM 服务──你把HPA 设置为使用 `DCGM_FI_DEV_GPU_UTIL`Como sinal. O serviço no tempo de negócios tem permanecido em 100% de utilização.

Além disso, você usa o Cluster Autoscaler 管理节点──凌晨2点来一个1M-Token prompt; cluster花了3分钟供给节点,请求超时──

Além disso, você implantou um que precisa atravessar 2 nós usando o modelo 70B de 8 GPUs. O cluster tem 7 GPUs vazios, e há 1 GPU distribuído em 3 nós. O Cluster Autoscaler é o único que falta.

Três, três diferentes modelos de falha. A autoescalação consciente de GPU de 2026 não é uma combinação de pontos de fornecimento, agendamento de gangues e aplicativos de autoescalação de sinais.

## 概念
### Layer 1  节点供给 (carpentro)

Karpenter  monitor pendentes pods, e em cerca de 45-60 segundos fornecer o ponto  Cluster Autoscaler para GPU                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `NodePool`约束动态选择实例类型  Se o seu módulo 需要 8 H100, e não há nenhum nó de correspondência no cluster, o Carpenter irá fornecer diretamente um nó, em vez de expandir um grupo existente。

**consolidation 陷阱**Carpenter 默认的`consolidationPolicy: WhenEmptyOrUnderutilized`Para o pool de GPU  muito perigoso. O terminal de GPU  node em execução, o módulo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

Configuração de segurança do GPU pool:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

Permitir Karpenter em uma hora depois da consolidação, mas não expulsar o trabalho em curso.

### Layer 2  agendamento de gangues KAI Agendador)

KAI Scheduler(项目原名 "Karp",后改名)处理默认 kube-scheduler 不处理的事情:

**Gang scheduling** Total ou total sem arquivo de regulação.  Necessita de 8 pods de inferência distribuída de GPUs, ou 8 juntos, ou um todo não inicia.

**拓扑感知** 知道哪些GPU共享 NVLink、哪些位于同一架、哪些之间有InfiniBand──并据此放置 pod──DeepSeek-V3 67B tensor-parallel workload 必须留在一个NVLink域内;KAI Scheduler将遵守这一点──

**分层队列** Multiple teams in priority 和 quota  competing with one GPU pool──A necessidade de produção de emergência da equipe A é apenas permitida quando a prioridade    regras permitem, para ser ocupada por um trabalho de formação da equipe B                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

KAI  como agendador secundário e kube-agendador 一起部署; 你通过注释 让工作负载 使用它──Ray 和 vLLM produção-stack 都有集成──

### Layer 3   aplicada层信号

**HPA 陷阱**- Não .`DCGM_FI_DEV_GPU_UTIL`É uma métrica de ciclo de trabalho  É medida se a GPU está trabalhando em cada intervalo de tempo.

Pior ainda, o VLLM e o motor semelhante vão pré-distribuir a memória cache KV.`--gpu-memory-utilization`*■ Mesmo com apenas uma solicitação, o uso da memória também permanece em cerca de 90% ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

**2026 年替代信号**- Não .

- 队列深度( espera pre-reempimento de pedidos)
- Utilização do cache KV (%)
- Cada réplica do P99 TTFT (tudo o sinal do SLA)
- Goodput ((( por segundo satisfazer todos os pedidos do SLO)

NVIDIA Dynamo Planner 和 llm-d Workload Variant Autoscaler 会消费这些信号并扩缩复лика──它们会完全取代用于 LLM de serviço HPA──

### Que tempo é preciso?

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### Preenchimento/decodificação desagregado 会让一切更复杂

Se você executar prefill / decode desagregado (fase 17 · 17), você terá dois tipos de pods, e eles têm diferentes gatilhos de escala: prefill pod baseado em profundidade de expansão de capacidade, decode pod baseado em pressão de cache KV expandência capacidade.`Services`Não tente colocar um HPA único em frente de ambos.

### Começo frio é importante .

Fase 17 · 10) é um ponto de fornecimento de tempo para tornar o usuário visível em um local atrasado.`min_workers=1`), ou em aplicação de nível de uso de ponto de controlo estilo Modal.

### Você deve lembrar-se de números

- Carpenter 节点供应: cerca de 45-60s, em comparação com Cluster Autoscaler 约 90-120s (GPU 节点) ⋅
- A programação de CAI 防止部分分配浪费  7 de 8 陷──
- `DCGM_FI_DEV_GPU_UTIL`作为 HPA 信号:坏掉的; usar linha de linha de profundidade ou KV utilization rate。
- Carpenter `WhenEmptyOrUnderutilized`O trabalho da GPU está em funcionamento.`WhenEmpty + consolidateAfter: 1h`- Não.


```figure
autoscaling
```

## Use-o
`code/main.py`Em burst GPU workload 上模拟一个三层 autoscaler──比较天真 HPA(duty cycle) ∼队列深度 HPA 和 KAI-gang-scheduled scaling──报告未满足请求、idle-GPU 分钟数和复合分数──

## Entrega-o
本课会生成 `outputs/skill-gpu-autoscaler-plan.md` Dado uma topologia de cluster  forma de carga de trabalho 和 SLO, ele irá desenhar um esquema de autoescalação de três níveis 

## 练习
1. 运行 `code/main.py`Em uma carga de trabalho burst, baixo, ciclo de trabalho HPA vai perder quantas solicitações de profundidade de fila HPA pode aceitar?
2. Para um em H100 SXM5 上服务 Llama 3.3 70B FP8 cluster 设计Karpenter NodePool──指定 `capacity-type`- Não.`disruption.consolidationPolicy`- Não.`consolidateAfter`, bem como uma que não GPU carga de trabalho  não pode ser ajustado para estes nós de manchas.
3. Seu relatório de equipa de implantação está em espera, porque a GPU está disponível, mas não pode ser regulada.
4. Por desagregado prefill pod 选择一个自动扩展 信号,并为解码 pod 选择另一个不同信号――说明两者理由――
5. 计算 `WhenEmptyOrUnderutilized`Consolidação  Em uma 24x7 custo de produção de serviço: este serviço tem, em média, 60 vezes por dia um evento de queda de solicitações, e P99 TTFT > 10s:

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes 节点 autoscaler；亚分钟级供给 |
| Cluster Autoscaler | "the old scaler" | Kubernetes 节点 autoscaler 的前身；更慢，基于 group |
| KAI Scheduler | "the GPU scheduler" | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | "all or nothing" | 原子化调度 N 个 pod，或全部延后 |
| Topology awareness | "rack-aware" | 基于 NVLink/IB/rack placement 放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric；不是 LLM 的 scaling signal |
| Queue depth | "waiting requests" | 对 prefill-bound scaling 正确的 HPA 信号 |
| KV cache utilization | "memory pressure" | 对 decode-bound scaling 正确的 HPA 信号 |
| Consolidation | "Karpenter consolidation" | 终止节点以迁移到更便宜的 instance type |
| `WhenEmpty + 1h` | "safe consolidation" | 不驱逐正在运行 GPU job 的策略 |

## 延伸阅读
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 设计文档和配置示例──
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) política de consolidação 语义和 GPU-safe 默认值──
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) Dinamo Planner de escala de sinais。
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html)Ray está a trabalhar.
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) orientações específicas para a gestão de Kubernetes。
- [llm-d GitHub](https://github.com/llm-d/llm-d) Carga de trabalho Variante Autoscaler 设计。
