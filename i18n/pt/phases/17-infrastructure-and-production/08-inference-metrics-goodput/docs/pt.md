# Metricas de inferência  TTFT、TPOT、ITL、Goodput、P99

> O TFT é preencher加队加网络──TPOT(equivalente ao ITL) é o decodificador de memória-vinculado de cada token 成本──端到端延迟是 TTFT加 TPOT 乘以输出长度──Throughput é toda a frota 聚焦后每秒 Token 数──但对产品真正重要的是 goodput:同时满足每个 SLO 要求比例──在低好put的下高 throughput意味着你无法处理用户的 Token──2026年 TRT-LLM 上 Llama-3.1-8B-Instruct 数字参考: mean TTFT 162 ms, mean TPOT 7.33 ms, mean E2E 1,093 ms, mean E2E 1,093 ms, mean PTFP 50P 909                                                                                                                                                                    

**Type:** 学习
**Languages:** Python（stdlib，玩具版 percentile calculator 和 goodput reporter）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 60 分钟

## Objectivo de aprendizagem
- 精确定义 TTFT、TPOT、ITL、E2E、output 和 goodput,并指出每个指标测量的组件──
- Explique por que significa ser um servidor de LLM para obter estatísticas erradas, bem como como como como ler P50/P90/P99
- 构建一个SLO multi-constraint (tfpt<500 ms AND TPOT<15 ms AND E2E<2 s),并根据此计算 goodput──
- Para explicar as razões, o que é necessário para que o TPOT possa ser considerado como um instrumento de referência?

## 问题
Se 40% das solicitações de terminação excederem os 2 segundos, o usuário já abandonou a sessão.

Inferência tem várias latências 轴, cada eixo de fracaso modo são diferentes. Prefixo é computação-ligado,并随即时长度 扩展. Decode é memória-ligado,并随批量 扩展.

## 概念
### TTFT  tempo para o primeiro token

`TTFT = queue_time + network_request + prefill_time`

Quando os pedidos 很长时,预填占主导── em Llama-3.3-70B FP8 em H100 上运行的, um pedido de 32k 需要约800 ms de prefill.

### TPOT / ITL  Latência entre tokens

Com uma quantidade, há muitos nomes.`TPOT`(tempo por token de saída)`ITL`(latencia entre tokens)`decode latency per token`Tudo é o mesmo. É o primeiro Token. Depois, continuamos a streaming entre os Token.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

Na mesma com preenchimento em pedaços da pilha Llama-3.3-70B H100, TPOT média ≈ 7 ms⋅ não preenchimento em pedaços 时,当相邻序列 正在执行长 preenchment, TPOT可能高达50 ms⋅关注 P99,而不是 mean⋅

### Latência E2E

`E2E = TTFT + TPOT * output_tokens + network_response`

对于长输出(>500 Token),E2E por TPOT 主导──对带长提示的短输出,E2E por TTFT 主导──报告按输出长度分组的E2E──

### Transmissão

`throughput = total_output_tokens / elapsed_time`

Não posso dizer-lhe o estado de saúde de um único pedido.

### O que é que realmente me interessa?

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

O SLO é uma restrição múltipla. Apenas cada restrição é satisfeita, uma solicitação é boa. O bom desempenho é essa proporção. O bom desempenho é fracasso. O objetivo é o baixo desempenho.

Até 2026, o goodput já se tornou um indicador de uso interno para o rastreamento de SLA para os fornecedores de plataforma de IA e para as apresentações da MLPerf Inference v6.0.

### Por que significa que é errada estatística

As distribuições de latência do LLM são de direita. Em um lote de decodificação, se houver uma solicitação de proximidade de preenchimento, pode haver 500 Tokens TPOT de cerca de 7 ms, enquanto há 20 Tokens TPOT de cerca de 60 ms.

始终报告三元组(P50、P90、P99)。 para a experiência do usuário, P99 才是你要优化的指标──

### Números de referência  TRT-LLM 上的 Llama-3.1-8B-Instrução, 2026

- TTFT médio: 162 ms
- TPOT médio: 7,33 ms
- média E2E: 1.093 ms
- P99 TPOT: 取决于碎片-prefill configuração, normalmente varia entre 10-25 ms ⋅

Estes são os pontos de referência lançados pela NVIDIA. Eles variam com o tamanho do modelo.

### A armadilha de medição

Os dois instrumentos de referência mais utilizados em 2026 darão resultados diferentes ao TPOT durante a mesma execução:

- **NVIDIA GenAI-Perf**: в ITL 计算中排除 TTFT──ITL 从 Token 2 开始──
- **LLMPerf**:包含 TTFT──ITL 从 Token 1 开始──

Para um TTFT para 500 ms  100 tokens de saída  Total decodificação para 700 ms  GenAI-Perf  relatório `ITL = 700/99 = 7.07 ms`,LLMPerf  relatório `ITL = 1200/100 = 12.00 ms`❖ Instrumentos para escolher o número.

始终说明使用了哪个工具──始终发布定义──

### Construção de um SLO

O modelo de chat 70B dos consumidores face a 2026:

- TTFT P99 <= 800 ms¬
- TPOT P99 <= 25 ms¬
- Para <300-Token 输出,E2E P99 <= 3 s⋅
- Objetivo de produção de energia >= 99%:

As SLOs de empresa vão acessar TTFT ((200-400 ms) e ampliar E2E── o essencial é escrever-as, medir-as, e fazer o bom uso como um único composto  para realizar o acompanhamento──

### Como medir

- 运行真流量或真实合成(LLMPerf 使用 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`)。
- O objetivo da corrida de referência é 2x o pico de concurência.
- 运行 30-50 vezes iteração,对合并样本取百分比──
- 发布时包含工具名、工具版本、模型、hardware、concurrence、即时分布──


```figure
throughput-latency
```

## Use-o
`code/main.py`É uma edição de jogos de calculadora de goodput.

## Entrega-o
本课会生成 `outputs/skill-slo-goodput-gate.md` Dado uma carga de trabalho e SLO, ele gerará uma receita de referência para CI/CD, com goodput e não throughput para gate deploys 

## 练习
1. 运行 `code/main.py`Quando você coloca o P99 TPOT de 30 ms 收紧到15 ms 时, o bom rendimento 如何变化?
2. 某供应商 引用 Llama 3.3 70B H100 上 15,000 tok/s──在相信之前,应提出哪三个问题?
3. Por que preenchimento em pedaços pode proteger P99 TPOT, mas não pode proteger o TPOT?
4. Para assistente de voz  construir um SLO de consumo ((primeiro token é ouvido, em vez de ser lido)  Qual indicador para o usuário mais visível?
5. 阅读LLMPerf README 和 GenAI-Perf docs── encontrar outros três instrumentos que definem indicadores incongruentes──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；在长 prompts 下由 prefill 主导 |
| TPOT | “time per output token” | 首个 Token 之后每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在大多数工具中与 TPOT 相同（不是全部，见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上 response-side network |
| Throughput | “tok/s” | Fleet efficiency；没有 latency percentiles 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足每个 SLO constraint 的请求比例 |
| P99 | “tail” | 百分之一最差情形 latency；用户体验指标 |
| SLO multi-constraint | “the joint” | 三个 latency bounds 的 AND；只要违反任意一个，请求就失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 工具对 ITL 是否包含 TTFT 的定义不一致 |

## 延伸阅读
- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) TTFT、ITL、TPOT 权威定义──
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) 替代定义与测量配方──
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) Real implementações 上的 aplicada medição。
- [LLMPerf](https://github.com/ray-project/llmperf) Baseado no índice de referência de código aberto de Ray.
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html) Ferramenta de referência da NVIDIA。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) aceito pela indústria ̇ baseado em um índice de referência de boa qualidade 
