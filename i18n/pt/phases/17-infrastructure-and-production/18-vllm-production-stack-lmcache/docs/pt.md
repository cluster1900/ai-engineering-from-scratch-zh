# Utilize LMCache KV Descarga de VLLM Production Stack

> O LMCache é uma camada de descarga de KV, que extrai KV cache da memória da GPU e usa-o entre consultas e motores. Primeiro, o CPU DRAM, depois o disco/Ceph. LMC 0.11.0 KV Descarga de Conector. Em 1 de janeiro de 2026, através do Connector API v0.9.0+, o CPU pode ser desligado para ser desligado. O LMCache não é compartilhado diretamente com os usuários. Mesmo sem prefixos, o LMCache também tem um preço muito alto: quando usamos o KV, são previamente recomendados para recuperar, não podem ser re-computados. Baseado em 4 CPUs de alta velocidade, o CPU de 16GBVG-4G é muito baixo.

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**前置要求：**Fase 17 · 04 (VLLM Serving Internals), Fase 17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 図出 vLLM produção-stack diferentes níveis: roteador, motores, descarga de KV, observabilidade,
- 解释 KV Offloading Connector API ((v0.9.0+), bem como caminho asincrono 0.11.0 如何隐藏脱载延迟──
- 量化 LMCache CPU-DRAM 何時有幫助 (KV > HBM),以及何時只增加上市 (KV 小到足以放入HBM) ⋅
- De acordo com as restrições de implantação, entre o descarregamento do CPU vLLM nativo e o conector LMCache 之间做选择──

## 问题
Seu vLLM serve em concurência 上升时显示 GPU HBM 达到 100%,并出现预先事件── Requests 被驱逐、requeue,然后同一个2K-token prompt 在一分钟内被重新填充四次──GPU computador 被花在重复的预填上;output 远低于原产量──

O custo de GPU é linear. O custo de GPU é linear. O custo de GPU é linear. O custo de GPU é linear.

LMCache irá colocar o cache KV 抽取到CPU DRAM, fazer requisições preemptadas 快速恢复,并让引擎 之间的重复预写 共享缓存,而不需要每个引擎都重新预填──

## 概念
### Estação de produção de vLLM

`github.com/vllm-project/production-stack`É referente ao Kubernetes 部署:

- **Router** cache-consciente(Fase 17 · 11)。消费 KV eventos。
- **Engines** trabalhadores vLLM── cada GPU, ou cada grupo TP/PP,
- **KV cache offload** Implementação de LMCache ou conector nativo。
- **Observability** Prometheus raspar, gráficos, painéis de controle, rastros de ótel.
- **Control plane** descobrecimento de serviços configuração  atualizações de rolamento

以 Helm chart + operador 形式交付。

### API de conector de descarga de KV (v0.9.0+)

vLLM 0.9.0 introduziu a API do Connector, para uso de backends plugáveis do cache KV. Seu motor irá descarregar blocos para o conector; conector armazená-los (RAM, disco, armazenamento de objetos, LMCache) ⋅ Quando o requisito precisa de um bloco, o conector irá carregá-lo de volta.

vLLM 0.11.0(2026 年 1 月) aumentou o caminho de descarga assíncrona: em casos comuns, a descarga pode ocorrer no segundo plano, portanto, o motor não será bloqueado.

### Descarga de CPU nativa vs LMCache

**Native vLLM CPU offload**:motor-local──把 KV blocos 存储在主机RAM中──实现快,零网络 hop──不能跨引擎──

**LMCache connector**: cluster-scale──把 blocos 存储在共享 LMCache server(CPU DRAM + Ceph/S3 tier) 中── qualquer motor 都可以访问块── já há 16x H100 benchmarks 发布──

Quando um único motor tem pressão HBM 时选择 native──当多个引擎 共享前置 时选择 LMCache(带共同系统提示的RAG、带共享模板的多租户)──

### Comportamento de referência

Distribuído em 4 台 a3-highgpu-4g 上的16x H100(80 GB HBM)测试:

- Baixa pegada de KV ((brotos avisos  baixas concurrenças): todas as configurações são equivalentes à linha de base, o LMCache aumenta cerca de 3-5% das despesas gerais¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Moderado pegada:LMCache  bắt đầu trong động cơ   entre motores  reutilização do prefixo 上带来帮助。
- KV excedido HBM:descarga de CPU nativa e LMCache aumentam significativamente o rendimento; LMCache  aumentou de forma maior, pois há partilha entre motores。

### Quando a LMCache é decisiva

- 多个租客 共享系统提示 的多租客服务──
- Peças de documento em consultas 之间重复的RAG──
- Com base em variantes de alta precisão (LoRA), entre elas, o modelo base KV reutilização irá reduzir a re-reatividade.
- Cargas de trabalho pesadas de pré-empenho: de CPU restaurar 比重新预填 更便宜──

### Quando não habilitar

- Pressão HBM 很小: Você vai pagar sobrecarga 却没有收益.
- Contexto curto ((< 1K tokens): tempo de transferência > 重新 prefill。
- Carga de trabalho de inquilino único: não há reutilização captável.

### Integração com a porção desagregada

Fase 17 · 17 desagregado de serviço + LMCache 会叠加增益: de prefill pool para decodear pool de KV transferências Se não for usado, irá cair em LMCache; posteriori consultas 会从 LMCache 拉取──Fase 17 · 11 cache-consciente roteador pode enviar o pedido para o local cache ou LMCache-compartilhado cache 匹配的引擎──

### Números que você deve lembrar

- vLLM 0.9.0: API do conector 发布──
- vLLM 0.11.0(2026 年 1 月):caminho de descarga assíncrono; impacto de latência de ponta a ponta 取决于工作负荷、KV hit rate 和系统压力(不是绝对保证) 』
- 16x H100: quando a pegada de KV supera a HBM, LMCache ajuda.
- Pressão de HBM: 3 a 5% de custos gerais e sem benefício.


```figure
zero-sharding
```

## Use-o
`code/main.py`O relatório é um dos principais exemplos de um novo modelo de trabalho.

## Entrega-o
本课会产出 `outputs/skill-vllm-stack-decider.md` dado a forma da carga de trabalho e a implementação do VLLM, o que é o resultado da selecção nativa do LMCache, ou o que é o resultado da selecção.

## 练习
1. 运行 `code/main.py`LMCache do que HBM utilização  Começar a planejar?
2. 某租户 每小时 200 查询 共享一个 6K-token系统提示──计算每个租户 预期的 LMCache节省──
3. O servidor LMCache é um único ponto de falha.
4. LMCache em disco giratório 上存到 Ceph──对于70B FP8 下4K-token KV(500 MB),lear time 相比重填 如何?
5. 论证 vLLM 0.11.0 caminho assíncrono 否免费:overhead 藏在哪里?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | “参考部署” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的 pluggable KV store interface |
| Native CPU offload | “engine-local spill” | 把 KV 存到同一 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | CPU DRAM + disk 上的 cross-engine KV cache server |
| 0.11.0 async | “non-blocking offload” | 隐藏在 engine stream 后面的 offload |
| Preemption | “evict to make room” | HBM 满时的 KV cache shuffle |
| Prefix reuse | “same system prompt” | 多个 queries 共享开头；cache hit |
| Ceph tier | “disk tier” | cache hierarchy 中 DRAM 下方的 durable storage |

## 延伸阅读
- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) Gráfico do capacete + operador。
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) Implementação do conector。
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) Detalhes de caminho assíncrono。
