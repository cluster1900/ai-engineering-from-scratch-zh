# Quantização da produção  AWQ, GPTQ, GGUF K-quants, FP8, MXFP4/NVFP4

> O formato de quantização não é uma escolha geral, mas sim uma função do hardware、serving engine 和 workload──GGUF Q4_K_M ou Q5_K_M 通過 llama.cpp 和 Ollama 交付,占占用 CPU 和 edge 场景──GPTQ na vLLM 内部胜出,适合你需要在同一基地上运行多洛拉的情况──带 Marlin-AWQ kernels的 AWQ 带在7B级模型上可达约741 tok/s,并在INT4 下有最佳Pass@1, 2026年数据中心生产默认选择──FP8在Adaper、库存和黑well的中间带保持,类似无损且支持广泛──NVFP4 和 MXFP4Black激化团) 需要逐批验证──VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## Objectivo de aprendizagem
- Explicar 6 tipos de formatos de quantização de produção em 2026 e seus melhores cenários de utilização:
- Em determinado hardware (((CPU vs GPU、Hopper vs Blackwell) 、motor(vLLM、TRT-LLM、llama.cpp) e carga de trabalho(routeiro de chat、razão、multi-LoRA) 时选择格式──
- 計算所選式省重量記憶, bem como não afectados cache KV──
- Dizer que os modelos quantizados em tráfego de domínio ︎

## 问题
Quantização irá reduzir a memória e a largura de banda HBM, e isso é o que é necessário para decodificar. Um modelo FP16 70B tem 140 GB de peso.

Mas a quantização não é gratuita. A quantização intensificada reduz a qualidade, especialmente em tarefas pesadas de raciocínio. Diferentes formatos se adaptam a diferentes motores. Diferentes hardware.

## 概念
### Os seis formatos

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/edge 默认选择

GGUF é um formato de arquivo, em si não é um esquema de quantificação, ele usa variantes K-quantificadas ((Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0)), embutida em um recipiente.

Em vLLM, o desempenho é de aproximadamente 93 tok/s, este formato não é dirigido a kernels de GPUs 优化── quando o objetivo de implantação é CPU/edge 时使用GGUF──其他情况不要用──

### GPTQ  vLLM 中的多洛拉

GPTQ é um algoritmo de quantização pós-treino, com passagem de calibração.

Se você quiser servir um modelo base, adicione 10 a 50 variantes perfeitamente ajustadas, cada uma como um LoRA, GPTQ é o seu caminho. Até o início de 2026, NVFP4 ainda não suporta LoRA.

### AWQ  GPU do datacenter 默认选择

Quantização de peso consciente de ativação── quantização ⋅ proteção de cerca de 1% ⋅ o peso mais significativo ⋅ os kernels Marlin-AWQ:相比天真 ⋅ realização ⋅ 10.9x speedup── 7B ⋅ 741 tok/s, é o melhor dos formatos INT4 中 Pass@1 ⋅

Além disso, você precisa de multi-LoRA (GPTQ) ou ativado Blackwell FP4 (NVFP4), ou então o novo serviço de GPU (GPU)  escolher AWQ (GPU).

### FP8  Clínica de transporte de mercadorias

Ponto flutuante de 8 bits──近似无损──支持广泛──Hopper Tensor Cores 原生加速FP8──Blackwell 继承这一点──当质量不可妥协时(理性、医学、代码-gen),FP8 é uma escolha emérita segura de 2026年──Memory savings is one half of INT4, but the quality risk is much lower──

### MXFP4 / NVFP4  Blackwell 激进选择

Microscaling FP4── cada bloco de peso tem seu próprio fator de escala── aceleração, mas em Blackwell Tensor Cores há hardware aceleração── em comparação com FP8, vai diminuir a metade o número de bits de tokens, que é a Fase 17 · 07 da economia de ganho──

Atenção:
- Ainda não há apoio da LoRA (em 2026).
- Raciocínio-cargas de trabalho pesadas 上质量下降可见──
- 必須在你的評估組上逐模型驗證──

### A armadilha de calibração

AWQ e GPTQ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

修复方式: usar dados no domínio fazer calibração.

### A armadilha de cache KV

AWQ Colocar o peso em 4 bits.

- Peso: cerca de 35 GB ((de 140 GB INT4 e para lá)
- 128 并发 × 2k contexto 下的 KV cache: cerca de 20 GB。
- Ativações: cerca de 5 GB.
- Total: cerca de 60 GB, podemos colocar no H100 80 GB.

O meu modelo foi quantificado para 4 GB, e esqueci-me de 30 a 50 GB.

Além disso, a quantização do cache de KV ((FP8 KV ou INT8 KV) é uma outra opção, com suas próprias compensações, que afetará diretamente a precisão da atenção, não é um benefício gratuito.

### AWQ INT4 para o raciocínio

A cadeia de pensamento, matemática, longo contexto de código-gen, estas tarefas são claramente influenciadas por quantidades de atividades.

### Guia de escolha 2026

- Serviço de CPU/edge:GGUF Q4_K_M──完成──
- GPU serve chat de rotina sem LoRA:AWQ
- GPU serve multi-LoRA: GPTQ de Marlin
- Carga de trabalho de raciocínio:FP8。
- Centro de dados Blackwell 质量已验证:NVFP4 + FP8 KV
- Não está claro: para cada candidato, uma avaliação de 1.000 amostras.


```figure
gpu-memory-breakdown
```

## Use-o
`code/main.py`Apresentação do cache KV 何時占主导、重量圧縮、計画、以及 FP8 何時是安全选择──

## Entrega-o
本课会产出 `outputs/skill-quantization-picker.md` Dado o tamanho do hardware, modelo, tipo de carga de trabalho e tolerância à qualidade, ele escolhe um formato e gera um plano de calibração/validação.

## 练习
1. 运行 `code/main.py`◊ Para o modelo 70B de 128 e 2k contextos, calcular o total de HBM de cada formato.
2. Você tem um modelo de codificação 7B. Escolha um formato e explicação de razão. Se você julgar que a tolerância à qualidade está errada, qual é o caminho para a recuperação?
3. 计算为医学领域模型 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校) 校准 AWQ 校
4. 阅读 Marlin-AWQ kernel paper 或 release notes──用三句话解释为什么AWQ em 7B sobe a 741 tok/s, enquanto o GPTQ bruto é de cerca de 712──
5. Quando combinar o peso AWQ com o cache FP8 KV, comparado a manter o KV em BF16 mais razoável?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant variants 的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；production GGUF 默认选择 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-train INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；Marlin kernels；INT4 下最佳 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernels；10x speedup |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上的安全 precision 默认选择 |
| MXFP4 / NVFP4 | “microscaling four” | Blackwell 4-bit FP，带 per-block scale factors |
| Calibration dataset | “cal data” | 用于选择 quantization parameters 的输入文本；必须匹配 domain |
| KV cache quantization | “KV INT8” | 与 weights 分开的选择；影响 Attention accuracy |

## 延伸阅读
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) Em relação ao índice de referência
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的吞吐量 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南──
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) Origem AWQ formulação。
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) Originação da formulação GPTQ。
