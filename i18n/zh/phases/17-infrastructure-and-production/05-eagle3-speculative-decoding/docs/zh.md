# 生产环境中的EAGLE-3 投机解码

> 投机解码将是一个快速草案模型与目标模型配对. 草案提出K个代币; 目标在一次前进中验证; 被接受的代币是免费的. 到2026年,EAGLE-3是生产级变体,它在目标模型的隐藏状态上训练草案头,而不是在原始代币上训练,从而在通用聊天中将接受率Alpha推至0.6-0.8 区间. 正确的问题不是草案有多快,而是我的流量Alpha是多少?如果低于0.55,在高并发下投机解码课程将变成净负面收益,因为每个被拒绝的草案消耗第二次目标都会通过. 您测量Alpha,重新开关.

**类型：**学习 课程
**语言：**鱼 (鱼)
**先修要求：**阶段17 · 04(vLLM服务内部),阶段10 · 18(多代码预测)
**时间：**约60分钟

## 学习目标

- 说出推测解码的三代演变,并解释Eagle-3 相比Eagle-2 和经典草案模型 改变了什么――
- 定义接受率alpha,根据alpha 和 K(草案长度) 计算预期加速,并识别目标并发下破平率alpha──
- 解释为什么在2026年VLLM中投机解码是非默认的),以及为什么不测量阿尔法就开始它是生产反模式.
- 写出测量计划:使用哪个基准,哪种快速分布,哪个同步点,使用哪个指标作为上线门──

## 问题

在一台运行 Llama 3.3 70B FP8 的 H100 上,每个解码的代币会读取约140GB/s的权重并输出一个代币――GPU计算在解码期间几乎空,瓶是HBM带宽,而不是matmul吞吐量――

投机解码利用了这个差距――使用便宜的草案模型 生成K个候选标记,然后让目标模型在一次前进通行中验证所有K个.

经典草案模型 方法使用同一家族的更小模型(Llama 3.2 1B 为Llama 3.3 70B起草案) ⋅它能工作,但接受率一般,因为更小模型的分布会偏离目标──EAGLE、EAGLE-2,再到EAGLE-3,直接在目标模型的内部状态上训练轻量的草案头,因此草案的分布更紧跟目标──这就是为什么Alpha 会从草案模型的0.4升至EAGLE-3的0.6-0.8──

关键限制:EAGLE-3 在 vLLM 2026 中是选择.`speculative_config`没有旗,就没有加速. 如果团队没有真实流量量测量阿尔法,就直接打开,往往会看到尾延迟变差,而不是变好.

## 概念

### 实际上带来了什么?

没有规范解码时,每个代币的成本是一次目标前进. 使用草案长度K 和接受alpha的规范解码时,每个目标前进的预期代币数是`1 + K * alpha`比是加速`(1 + K * alpha) / (1 + epsilon)`对于K=5、alpha=0.7 的情况,`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`△真实世界数字通常集中在2-3x,因为生产流量上的阿尔法很少如此高,而且电子数据会在高批量下增长.

### 为什么阿尔法是唯一重要的指标

被拒绝的代币不会消失,它们会强迫第一个被拒绝的代币进行第二次目标推进. 在alpha 降至0.4 的工作负载上,你必须支付草案的 Overhead,验证,以及重滚.例如 256 同步),解码批量已经足够大,单独的目标和目标与验证的内存带宽之间的差距会缩小. 在大多数 2026 硬件上,alpha 低于0.55 时,规格解码在实践中是净负面收益.

在 ShareGPT 风格的通用聊天天天,使用 ShareGPT 训练的 EAGLE-3 能达到 0.6-0.8──在域特定流量上,使用通用数据训练的草案头会降至 0.4-0.6──训练域特定的草案头可以恢复alpha;与目标细节调整相比,这是一个轻量化、快速的训练任务──

### 子 代际一览

- **经典 draft model**基础设施简单,加载两个模型,草案 每次目标向前运行 K 次向前.
- **EAGLE-1（2024）**目标隐藏状态 (最后层) 上训练单个草案头――Alpha 约0.5-0.6――在目标上有少量参数的上层――
- **EAGLE-2（2025）**根据"图案规划"的定义, 图案规划器更复杂.
- **EAGLE-3（2025-2026）**们在一个小时内,我们会看到一个人在们的眼前.

### 2026 生产配方

1. 先以普通方式上线目标模型――测量目标并发下基线TTFT、ITL、吞吐量――
2. 通过VLLM`speculative_config`启动EAGLE-3草案――重新运行基准――
3. 记录接受率 alpha──vLLM V1 将其报告为`spec_decode_metrics.accepted_tokens_per_request`除了要求的草案长度即可得到alpha
4. 如果生产流量分布 上阿尔法 < 0.55,禁用规格解码,或训练域特定的EAGLE-3草案.
5. 在生产并发下重新运行.

### 生产陷:P99尾

标识解码会降低ITL的平均值. 如果没有调优,P99可能变差. 被拒绝的草案会触发两段式序列.

### 3 已部署在哪里

谷歌在2025年人工智能概述中部署了投机解码,`speculative_config`作为文档化接口发布;V1 中的N-gram GPU推测解码是兼容零碎预填的变体──SGLang 支持EAGLE-3,并将其作为预写重工作负载的推草案路径──

### 一行平衡数学

预期加速:`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`令`S = 1`解答的阿尔法:`alpha_breakeven = verify_overhead / K`△对于典型的验证额度大约为0.15 且K=5:`alpha_breakeven = 0.03`◎但这是原始解码 数学――在高并发下,检查上空费会上升,而解码批量已经在多个序列之间摊销内存读数,因此实践中的有效的alpha_breakeven 会爬升到约0.45-0.55──

### 什么时候不要使用猜测解码

- 批量-1 离线生成,且延迟不重要.
- 输出很短 ((低于50个代币) ・草案总费和验证成本 占主导――
- 没有专业领域的专业领域.
-  vLLM v0.18.0 加草案模型规格解码 加 `--enable-chunked-prefill`△这个组合无法编译.文档化的例外是V1中N-gram GPU规格解码.


```figure
mx-speculative-tree
```

## 使用它

`code/main.py`在一系列的阿尔法值和草案长度 K 上模拟有无猜测解码的解码循环――它会打印破-甚至阿尔法、测得的速度和尾声行为――在多个 (阿尔法,K) 组合上运行它,准确观察猜测解码 在哪里不再计划――

## 交付它

本课产出发 `outputs/skill-eagle3-rollout.md`△给定目标模型,交通分布,描述和同步目标,它将产生分阶段的EAGLE-3推广计划:基准线,可配置,测量alpha、以alpha >=0.55 作为门、观察P99 ITL──

## 练习

1. 运行`code/main.py`为了获得2倍的速度,需要什么?
2. 假设生产流量由70%通用聊天、30%代码 组成──通用聊天在使用 ShareGPT 训练的 EAGLE-3 上达到阿尔法 0.7;代码 达到阿尔法 0.4──混合阿尔法 是多少?特征解码 是否净正收益?
3. 阅读全文`speculative_config`文档──说出三种模式──草案模型、EAGLE、N-gram),以及哪一种兼容的零碎预填.
4. 启用EAGLE-3 后你看到平均ITL下降25%,但P99ITL上升15%.
5. 计算Llama 3.3 70B的EAGLE-3草案头脑内存成本.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Speculative decoding | “draft plus verify” | 用便宜模型提出 K 个 Token，在一次 target forward 中验证全部 K 个 |
| Acceptance rate alpha | “spec accept rate” | draft Token 被 target 接受的比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值 4-8 |
| Verify overhead epsilon | “spec overhead” | verify-and-reroll 相比普通 target forward 的额外成本；随 batch 增长 |
| EAGLE-3 | “latest EAGLE” | 2025-2026 变体；在多个 target layers 上训练 draft head；通用聊天上 alpha 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中显式 opt-in；没有默认值就没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中 N-gram lookups 的 GPU-side draft；兼容 chunked-prefill |
| Break-even alpha | “no-op alpha” | spec decode 提供零加速时的 alpha；在生产并发下关注它 |
| Rejected-draft two-pass | “reroll cost” | drafts 被拒绝时发生两次 target forward；推高 P99 tail |

## 延伸阅读

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) `speculative_config`和 V1 中 零碎的预填 兼容性权力来源
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) 精确字段集合──
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) 原始龙头表述
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858)适应性草图和树木
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) 使用高效的投机解码法学系统──
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) 生产部署检查清单
