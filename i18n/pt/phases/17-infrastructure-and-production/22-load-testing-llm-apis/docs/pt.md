# Teste de carga APIs LLM  Por que k6 和 Locust 会谎

> Os testadores de carga tradicionais não são para respostas de streaming, comprimentos de saída variáveis, métricas de nível de token ou GPUs e são projetados. A maioria das equipes será presa em duas armadilhas.`--mean-input-tokens`+ `--stddev-input-tokens`修复这一点──2026 年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm) para utilização em Token 级准确性;**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）** streaming-aware、Kubernetes-native, através de TestRun/PrivateLoadZone CRDs fazer distribuído 测试, mais adequado para CI/CD gates; Vegeta utilizado para saturar a taxa constante de Go; Localização 2.43.3 只有配合 LLM-Locust extension 才适用于 streaming──负载模式:steady-state、ramp、spike(autoscaling test)、soak(memory leaks)。

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**Fase 17 · 08 (Métricas de inferência), Fase 17 · 03 (GPU Autoscaling)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- 解释让通用负载测试器在LLM API 上说谎的两个反模式(GIL 陷、即时-uniformity 陷)
- 针对给定目的选择工具:LLMPerf(marca de referência run) 、k6 + extensão de streaming(CIE gate) 、guidellm(síntese em larga escala) 、GenAI-Perf(NVIDIA referência) 。
- 设计四种负载模式 ((stable、ramp、spike、soak),并说出每种模式捕捉的失败模式──
- Utilize input tokens of mean + stddev 构建真实的 prompt distribution, em vez de fixa longitudin¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 问题
Você usou o k6 测试 LLM endpoint, configurar 500 usuários simultâneos.

 aconteceu duas coisas.  Primeiro, k6  enviou 500 instruções iguais  Seu pedido-coagulando e prefixo caching  faz parecer que está processando 500 decódios simultâneos, mas na verdade apenas está processando um  Segundo, k6 não irá acompanhar as respostas de streaming de forma visual de forma a inter-token latencia acima; ele vê uma conexão HTTP, em vez de 500 Tokens de diferentes intervalos de chegada 

Os testes de carga dos LLM são uma questão independente.

## 概念
### GIL 陷(Locust)

Locust utiliza Python, e no lado do cliente 于 GIL 下运行 टोकenization。高并发时,Tokenizer 会排在请求生成 后面──报告的间代码延迟 包含客户端 टोकenization backlog──你以为服务器 慢;其实是测试慢──

修复:LLM-Locust extensão vai transferir a tokenization 〜 process independente, ou usar o harness de linguagem compilada(k6、 usar tokenizers.rs de LLMPerf) 』

### Rapidez de uniformidade

Todos os testadores de carga conhecidos permitem configurar um prompt. Em 10.000 vezes, cada vez em um ciclo de testes, cada vez emite o mesmo prompt. O servidor cada vez vê o mesmo prefixo.

修复: desde distribuição rápida 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` 长度多样,内容多样,

### 4 tipos de carga

1. **Steady-state** 以 constante RPS 运行 30-60 分钟──捕捉:baseline performance regressions──
2. **Ramp** Em 15 minutos, o RPS aumentará de 0 线性 para o valor-alvo.
3. **Spike** Subitamente aumentou para 3-10x RPS, durou 2 minutos depois de recuperar.
4. **Soak** estado estável 运行 4-8 小时――捕捉:memória vazamentos conexão-pool drift  observabilidade sobrefluxo

### 2026 工具映射

**LLMPerf**(Anyscale)  Python, mas tokenization by Rust 支持──Mean/stddev prompts──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** Referência de NVIDIA── usar Triton cliente;metric 覆盖全面── atenção sua ITL não contém TTFT;LLMPerf 包含── o mesmo servidor 上两工具会产生不同的 TPOT──

**LLM-Locust**(TrueFoundry) 修复 GIL 陷的 Locust extension──熟悉的 Locust DSL + streaming metrics──

**guidellm** Referência de grande escala de sintética。

**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）**- Não .
- Não há nada de errado com o que é que é o que é que é que é.
- k6 Operador utiliza TestRun / PrivateLoadZone CRDs  realizar testes distribuídos nativos Kubernetes。
- O teste de CI/CD e SLA são mais adequados.

**Vegeta** Go,比 k6 更简单──Constant-rate HTTP saturation── não possui capacidade de LLM-consciente, mas é adequado para testes de gateway/limit de taxa──

**Locust 2.43.3 stock** Para LLM há uma armadilha de GIL 🏼

### Porta SLA do CI

Em PR 上运行 k6,并使用:

- Em RPS de base, abaixo de 30 a 50 vezes de iteração.
- Porta:P50/P95 TTFT、5xx < 5%、TPOT 低于值。
- 违规时让建设 失败──

### Verdadeira distribuição rápida

Desde o real flux sample construção (se there existisse), ou de distribuições públicas  construção (por exemplo, para o chat de ShareGPT prompts ∞ para o código de HumanEval) ∞ vai significar + stddev 输入 LLMPerf── no entanto, é necessário evitar loop-with-one-prompt──

### Você deve lembrar-se de números

- k6 Operador 1.0 GA:2025 年 9 月。
- k6 v2026.1.0:metricas de streaming-consciente
- 典型LLMPerf run:在同步 X 下 100-1000 solicitações。
- 典型CI gate: cada PR 30-50 iterações。
- Quatro modos: estável, ramp, spike, mergulho.


```figure
load-pattern-waves
```

## Use-o
`code/main.py`模拟带有真实快速分布 的负载测试,测量有效TPOT,并演示均快速陷──

## Entrega-o
本课生成 `outputs/skill-load-test-plan.md`△ dado o trabalho em carga e SLA 后, seleccionar ferramentas e desenhar quatro modos de carga―

## 练习
1. 运行 `code/main.py` Comparar uma distribuição uniforme e realista  差在哪里?
2. Por porta CI 编写 k6 script:在100 simultâneo 下 TTFT P95 < 800 ms, runtime 5 分钟──
3. Seu teste de remoção mostra memória de 50 MB por hora.
4. Testes de ponta de 10 RPS a 100 RPS── se Karpenter + vLLM produção-pilha  já está em posição Fase 17 · 03 + 18), tempo de recuperação esperado é quanto?
5. GenAI-Perf em mesmo servidor 上 report TPOT=6ms;LLMPerf  report TPOT=11ms;; explicação do seu motivo;;

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
