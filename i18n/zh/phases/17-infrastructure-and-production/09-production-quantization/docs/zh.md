# 产量量化  AWQ,GPTQ,GGUF K-量子,FP8,MXFP4/NVFP4

> 量子化格式不是一个通用选择,而是硬件、服务引擎 和工作负载的函数──GGUF Q4_K_M 或 Q5_K_M 通过 llama.cpp 和 Ollama 交付,占据CPU 和边缘场景──GPTQ 在 vLLM 内部胜出,适合你需要在同一基础上运行多LoRA的情况──带 Marlin-AWQ核 AWQ 在 7B级模型上可达到约 741个/s,并在 INT4 下有最佳的数据中心生产默认选择@1, 2026 年FP8 在Adaper 库存和黑色的保持中间带,类似无损和广泛的支持──NVFP4 和 MXFP4黑色微软化团队的生产) 需要逐步验证 进进两个陷: AQQ 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组 组

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## 学习目标
- 说出2026年六种生产量化格式及其最佳适用场景
- 在给定硬件 (CPU vs GPU,Hopper vs Blackwell) 机器 (vLLM,TRT-LLM,llama.cpp) 和工作负载 (常规聊天,推理,多次LoRA) 时选择格式――
- 计算所选的节省重量内存以及未受影响的KV缓存
- 通过数量化模型来实现域流量上退化的校准数据集陷.

## 问题
量子化会降低内存和HBM带宽,而这正是解码需要的.一个FP1670B模型重量140GB.把重量重量化为INT4 (AWQ或GPTQ),模型是35GB,可以放入一张H100,并给KV缓存留出空间.

但量化不是免费的. 激进量化会降低质量,特别是在推理重任务上. 不同的格式适应不同的引擎. 不同的硬件.

## 概念
### 六种格式

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### 关键字: 关键字:

GGUF是一种文件格式,本身不是量化方案,它把K量子变量置在一个容器中.Q4_K_M 和 Q5_K_M 是生产默认的,在 4-5 位下接近 BF16 质量.对于 CPU 或边缘服务,这是最佳选择,因为 llama.cpp 到目前为止是最快的 CPU 推断引擎.

在vLLM中的吞吐量 惩罚:7B 上约93tc/s,这种格式并非针对GPU内核 优化──当部署目标是CPU/边缘时使用GGUF──其他情况不要使用──

###    中的多洛拉

GPTQ是一种后训练量化算法,带有校准通过──马林内核让它在 GPU 上变快(相比非马林 GPTQ 有2.6x速度)──7B 上约712 tok/s──

它的独特优势:GPTQ-Int4 在vLLM中支持LoRA适配器──如果你要服务一个基模型加上10-50个精细调化的变体──每个作为一个LoRA),GPTQ就是你的路径──直到2026年初,NVFP4还不支持LoRA──

### AWQ 数据中心GPU 默认选择

激活意识重量量化量化时保护约1% 最显著的权重――马林-AWQ核:相比天真实现有10.9x速度――7B上约741个/秒,是INT4格式中 Pass@1 最好的――

除非你需要多LoRA (GPTQ) 或激进的黑尔FP4 (NVFP4),否则新的GPU服务选择AWQ──

### 可靠的中间地带

八位浮点――近似无损――支持广泛――霍珀电压核心 原生加速FP8――布莱克威尔 继承这一点――当质量不可妥协时――理性、医学、代码-gen),FP8是2026年安全的默认选择――内存储蓄是INT4的一半,但质量风险较低――

### 黑 激进选择

微量化FP4──每块重量都有自己的尺度因素──激进,但在黑电压芯上有硬件加速──相比FP8,将每个代币字节数量减半,这是17期的经济收益──

注意事项:
- 没有LORA支持.
- 推理重量工作负载 上质量下降可见――
- 必须在你的评估设置上逐模型验证.

### 校准陷

对于域名模型 (码,医学,法律),使用通用网页文本进行校准,会让算法对应该保护的权力做出错误判断.

修复方式:使用域内数据进行校准.

### 卡车预存陷

对于带 AWQ 的 70B 模型:

- 体重:约35GB (从140GB INT4而来)
- 后面的KV缓存:约20GB.
- 激活:约5GB.
- 总量:约60GB,可以放进H10080GB.

现在我把模型量化到4GB, 忘了30-50GB,

另外,KV缓存量化 ((FP8 KV或 INT8 KV) 是另一个选择,有自己的权衡,它会直接影响注意力精度,不是免费的收益.

### 对于推理有风险

对于推理重量工作负载,发布FP8或BF16;接受记忆成本──

### 2026 选用指南

- 处理器/边缘服务:GGUF Q4_K_M──完成──
- 没有任何问题.
- 现在,我们在线观看.
- 推理工作量:FP8──
- 黑数据中心质量已验证:NVFP4 + FP8 KV──
- 不明:对每个候选人进行1000个样本的评估.


```figure
gpu-memory-breakdown
```

## 使用它
`code/main.py`针对一系列模型大小,计算六种格式的内存足迹 (重量+KV+激活) 和相对吞吐量――展示KV缓存何时占主导性、重量压缩何时划算,以及FP8何时是安全选择――

## 交付它
本课会产出 `outputs/skill-quantization-picker.md`△给定硬件,模型大小,工作负载类型和质量宽容,它会选择一种格式,并产生校准/验证计划.

## 练习
1. 运行`code/main.py`△对于 128 个并发 2k 语境的 70B 模型,计算每种格式的总 HBM △哪种格式可以让你放进一个 H100 80GB?
2. 你有一个7B编码模型. 选择一种格式并说明理由. 如果你对质量容忍度做出了错误,恢复的路径是什么?
3. 计算为医学领域模型 校准AWQ所需的校准数据集尺寸为什么更多数据不总是更好?
4. 阅读Marlin-AWQ核纸或发布说明. 用三句话解释为什么AWQ在7B上达到741个单/秒,而原始GPTQ约为712个单.
5. 什么时候把 AWQ 重量与FP8 KV缓存组合,比把 KV 保持在BF16更合理?

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
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/)对比指标而言
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的输出 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南──
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗──
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) 原始 AWQ 公式──
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) 原始 GPTQ 公式──
