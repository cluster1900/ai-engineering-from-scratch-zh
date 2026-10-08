# 截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截至截止截至截至截至截止截至截至截止截至截止截止截止截至截至截止截至截至截至截止截至截至截止截至截至截至截至截至截至截止截止截至截止截止截至截至截止截止截至截至截至截至截止截止截至截止截至截至截至截止截至截至截止截至截至截至截至截至截止截止截至截止截止截止截至截至截止截至截至截至截至截至截至截至截至截至截至截至截至截止截至截至截止截至截至截止截至截至截止截至截至截至截止截至截至截止截至截至截止截止截至截至截止截止截至截至截至截至截至截至截止截止截至截至截止截至截至截止截止截止截止截至截至截至截至截至截至截至截至截至截止截止截至截至截至截

> 一个基于你自己的数据训练的8B模型,基于你自己的偏好完成DPO对齐,完成量化、推测解码,并以可衡量的$/1M代币 成本提供服务.2026年的开放堆是Axolotl v0.8、TRL 0.15、用于代的Unsloth、用于量化的GPTQ/AWQ/GGUF,以及用于服务的vLLM 0.7+EAGLE-3──这个终点的目标是可复制的完整运行管道:输入YAML,输出服务的终点,并发布了2026年模型开放框架下面的模型卡──

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**阶段2 (ML),阶段3 (DL),阶段7 (变压器),阶段10 (从零开始LLM),阶段11 (LLM工程),阶段17 (基础设施),阶段18 (安全)
**Phases exercised:**子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子
**Time:** 35 小时

## 问题
2026年,每个严格的AI团队都会随时准备好一个细节调整管道――不是因为他们要发布边界基模型,而是因为下游适配,也就是域名SFT、针对标记偏好的DPO、用于投机解码的蒸草稿、以及使用EAGLE-3的服务,才是真正出现的位置――Axolotl v0.8 处理多GPU SFT配置――TRL 0.15 处理DPO 和 GRPO──Unsloth 让你能够快速做单个GPU代――vLLM 0.7 + EAGLE-3 在不损失的质量下将通过输出解码 升级2-3x──工具可用;真正的技巧在YAML 和Hygiene 已经被纪录了――

你将把一个8B基础放在任务特定数据上,完成SFT和DPO,然后为服务做量化,并使用lm-评估-杆、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 测量升级──你将根据2026年模型开放框架 产出一个模型卡──重点是可复现性:一个命令到端重跑整条管道──

## 概念
这条管道有五个阶段.**Data**除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除除**SFT**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子**DPO or GRPO**:TRL配置,1时代优先级对可以来自人工标记或模型判断的beta调整.**Quantize**:GPTQ+AWQ+GGUF,保证部署灵活性──**Serve**根据排队等待的HPA──

运行量:批量1/8/32 下的代币/s、EAGLE-3接受率、$/1M代币──安全评估:Llama Guard 4通过率──模型卡:偏见评估、可再生性种子、数据许可──

## 架构
```
raw data (HF datasets + internal)
    |
    v
Datatrove dedup + Nemotron-CC quality filter + PII scrub
    |
    v
split hygiene (MMLU-Pro contamination check)
    |
    v
Axolotl SFT config (YAML)  ---> 8xH100, ZeRO-3
    |
    v
TRL DPO / GRPO config       ---> 4xH100, 1 epoch
    |
    v
GPTQ + AWQ + GGUF quantize
    |
    v
vLLM 0.7 + EAGLE-3 speculative decoding
    |
    v
K8s deployment, HPA on queue-wait
    |
    v
lm-eval-harness + RewardBench-2 + MT-Bench-v2 + MMLU-Pro
    |
    v
model card (2026 MOF) + safety eval (Llama Guard 4)
```

## 技术
- 数据:数据源用于测量,Nemotron-CC分类器用于质量,Presidio用于PII
- 基:拉马3.3 8B、文3 14B 或玛3 12B
- 光注意3 包装序列
- 偏好调整:TRL 0.15 用于DPO或GRPO;不用于单GPU代
- 量化:GPTQ (马林) 、AWQ、通过 llama.cpp 生成 GGUF
- 服务:vLLM 0.7 + EAGLE-3 投机解码(或SGLang 0.4 + SpecForge)
- 评价:lm-评估-利用,RewardBench-2,MT-Bench-v2
- 安全评估: 拉马卫队4 盾牌Gemma-2
- 基础设施:Kubernetes + NVIDIA设备插件,基于排队等待的HPA
- 观察性:W&B 用于训练,Langfuse 用于推断


```figure
ce-finetune-stages
```

## 构建它
1. **Data pipeline.**在原材料中 上运行数据库分类.应用Nemotron-CC 风格质量分类器.

2. **Contamination check.**对于每个验证分区,计算其与MMLU-Pro、MT-Bench-v2、RewardBench-2测试组的 MinHash──拒绝任何重叠──

3. **Axolotl SFT.**姆含有ZERO-3、FA3、序列包装──使用8×H100 训练2-3个时代──记录到W&B──

4. **TRL DPO / GRPO.**取 SFT 检查点,在优先对上运行一个时代的 DPO(或在数学/代码上使用可验证奖励的 GRPO) 』扫描beta。

5. **Quantize.**生成三种量子:GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp 的GGUF-Q4_K_M──记录大小和名义吞吐量──

6. **Serve with speculative decoding.**通过Red Hat 投机器 训练的EAGLE-3草案头.

7. **Eval matrix.**在基础上,SFT-only、SFT+DPO、SFT+GRPO 上运行 lm-eval-harness、RewardBench-2、MT-Bench-v2、MMLU-Pro──产出一张表.

8. **Safety eval.**在 dev 设置上统计 拉马卫队 4 通过率──使用 ShieldGemma-2 输出过器──

9. **Model card.**文件:2026 模板:数据,培训,eval,安全,许可证以及包含YAML和承诺SHAs的可复制性部分

## 使用它
```
$ ./pipeline.sh config/llama3.3-8b-domainX.yaml
[data]    300k deduped, 12k filtered, 280k accepted (seed=7)
[SFT]     3 epochs, 8xH100, 6h12m, val loss 1.42 -> 1.03
[DPO]     1 epoch, beta=0.08, 4xH100, 1h40m
[quant]   GPTQ-INT4 4.6 GB, AWQ-INT4 4.8 GB, GGUF-Q4_K_M 5.1 GB
[serve]   vLLM 0.7, EAGLE-3 acceptance 0.74, p99 126ms @ bs=8
[eval]    MMLU-Pro +3.2, MT-Bench-v2 +0.41, RewardBench-2 +0.08
[card]    model-card.md generated under 2026 MOF
```

## 交付它
`outputs/skill-finetuning-pipeline.md`描述交付物品. 一个命令完成数据到SFT到DPO到数量到服务到评估的全流程,并输出模型卡+已服务的终点.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## 练习
1. 在同一任务特定的基准上运行SFT+DPO、SFT+GRPO──报告哪种优先方法 胜出,以及领先多少──

2. 将Llama 3.3 8B 换成Qwen3 14B──在匹配质量下测量$/1M代币──

3. 测量域名数据与通用ShareGPT上面的EAGLE-3接受率.

4. 注入1%的污染(把MMLU-Pro答案 泄漏到培训数据)并重跑评估──观察MMLU-Pro精度 不真地跃升──构建一个能够捕获这个问题的污染检查CI门──

5. 添加LoRA SFT,作为完整的细调的替代方案.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Axolotl | "SFT trainer" | 由 YAML 驱动的统一 trainer，用于 SFT、DPO 和 distillation |
| TRL | "Preference tuner" | Hugging Face library，用于 LLMs 上的 DPO、GRPO、PPO |
| GRPO | "Group-relative policy optimization" | DeepSeek R1 的 RL recipe，使用可验证 rewards |
| EAGLE-3 | "Speculative decoding draft" | 可提前预测 N 个 tokens 的 draft heads；vLLM 使用 target model 验证 |
| MOF | "Model Openness Framework" | 2026 年用于按 data、code、license 对 model releases 评分的标准 |
| Contamination check | "Split hygiene" | 基于 MinHash 检测 test-set 泄漏进 training |
| Acceptance rate | "EAGLE / MTP metric" | target model 接受 drafted tokens 的比例 |

## 延伸阅读
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考SFT/DPO培训员
- [TRL documentation](https://huggingface.co/docs/trl)                     
- [Unsloth](https://github.com/unslothai/unsloth)单GPU代代 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考服务堆
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) 另一种投机解码训练师
- [Model Openness Framework 2026](https://isocpp.org/)公开发布 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness)定律评价运行器
