# Capstone 07  端到端 Fine-Tuning Pipeline(Dữ liệu đến SFT đến DPO đến Serve)

> Một mô hình 8B dựa trên đào tạo dữ liệu của riêng bạn, dựa trên sở thích của bạn để hoàn thành DPO đối với nhau, hoàn thành định lượng, giải mã định lượng, và có thể đo lường được $ / 1M token 成本提供服务.

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**Giai đoạn 2 (ML), Giai đoạn 3 (DL), Giai đoạn 7 (Tranformator), Giai đoạn 10 (LLM từ đầu), Giai đoạn 11 (LLM kỹ thuật), Giai đoạn 17 (tế hạ tầng), Giai đoạn 18 (tự an toàn)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

## 问题
Năm 2026, mỗi nhóm AI nghiêm ngặt sẽ luôn sẵn sàng để tạo ra một đường ống điều chỉnh tinh tế không phải vì họ sẽ phát hành mô hình cơ sở biên giới, mà vì sự thích hợp, đó là tên miền SFT, DPO có lợi cho các nhãn hiệu ưa thích, sử dụng các bản thảo khử trùng để giải mã phỏng đoán, cũng như sử dụng dịch vụ của EAGLE-3, chỉ là nơi có thể đo lường lợi nhuận thực sự xuất hiện.

Bạn sẽ đặt một cơ sở 8B(Llama 3.3、Qwen3 hoặc Gemma 3) trên dữ liệu cụ thể nhiệm vụ 上依次完成 SFT 和 DPO, sau đó để phục vụ thực hiện định lượng,并 sử dụng lm- đánh giá-tài dụng、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 衡升.

## 概念
Hãng đường ống này có 5 giai đoạn.**Data**:dedup(MinHash / Datatrove) ∙ lọc chất lượng(Nemotron-CC 风格 phân loại) PII scrub、 đối với các tiêu chuẩn công cộng phân chia kiểm tra vệ sinh của ô nhiễm.**SFT**:Axolotl YAML、8xH100 上的ZERO-3、cosine lịch trình、packed sequences、2-3 epochs──**DPO or GRPO**:TRL cấu hình ∞1 epoch ∞ các cặp ưu tiên có thể từ đánh dấu nhân tạo hoặc đánh giá mô hình ∞beta tuning∞**Quantize**:GPTQ + AWQ + GGUF,保证 linh hoạt triển khai.**Serve**:vLLM 0.7 + EAGLE-3 đầu tiên đầu tiên (hoặc SGLang + SpecForge)  K8s triển khai  dựa trên HPA chờ đợi hàng đợi 

Ablations 是交付物:在三个 tiêu chuẩn cụ thể cho nhiệm vụ 上比较 SFT-only、SFT+DPO、SFT+GRPO。Servicing metrics:batch 1 / 8 / 32 下的代币/s、EAGLE-3 rate of acceptance、$/1M tokens。Safety eval:Llama Guard 4 pass rate。Model card:bias evaluations、reproducibility seeds、data licensing。

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
- Dữ liệu: Datatrove dùng cho dedup, Nemotron-CC phân loại dùng cho chất lượng, Presidio dùng cho PII
- Cơ sở: Llama 3.3 8B、Qwen3 14B hoặc Gemma 3 12B
- SFT: Axolotl v0.8, cộng tác với ZeRO-3 ✓ Flash Attention 3 ✓ gói các chuỗi
- Tích thích: TRL 0.15 dùng cho DPO hoặc GRPO; Unsloth dùng cho lặp lại GPU đơn
- Số lượng: GPTQ (Marlin) 、AWQ、 thông qua llama.cpp 生成 GGUF
- Dịch vụ: vLLM 0.7 + EAGLE-3 decoding speculative ((hoặc SGLang 0.4 + SpecForge)
- Eval: lm-học định-nhận dụng  RewardBench-2  MT-Bench-v2  MMLU-Pro
- Thử nghiệm an toàn: Llama Guard 4  ShieldGemma-2
- Cơ sở hạ tầng: Kubernetes + NVIDIA thiết bị plugin, dựa trên HPA xếp hàng chờ
- Hình ảnh: W&B dùng để đào tạo, Langfuse dùng để suy luận


```figure
ce-finetune-stages
```

##  xây dựng nó
1. **Data pipeline.**Trong cơ thể nguyên liệu 上运行 Datatrove dedup。 ứng dụng Nemotron-CC 风格 chất lượng phân loại。Presidio 清理 PII。使用明确种子 写出火车/val split。

2. **Contamination check.**Đối với mỗi phân chia xác nhận, tính toán nó với MMLU-Pro、MT-Bench-v2、RewardBench-2 các bộ thử nghiệm của MinHash── từ chối bất kỳ sự chồng chéo nào──

3. **Axolotl SFT.**YAML  chứa ZeRO-3、FA3、đơn vị gói.

4. **TRL DPO / GRPO.**取 SFT checkpoint, trên các cặp ưu tiên 上运行一个时代的 DPO(或在数学/代码上使用可验证奖励的 GRPO) 』扫描beta。

5. **Quantize.**生成三种量子:GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp 的 GGUF-Q4_K_M──记录大小 和名字吞吐量──

6. **Serve with speculative decoding.**vLLM 0.7 cấu hình, sử dụng thông qua Red Hat Speculators  huấn luyện EAGLE-3 đầu dự thảo  đo đợt 1 / 8 / 32  tỷ lệ chấp nhận và độ trễ đuôi  báo cáo với Anthropic / OpenAI trong cùng đánh giá trên của $ / 1M token đối với tỷ lệ 

7. **Eval matrix.**Trong khi đó, các công ty đã được trang bị các sản phẩm khác nhau, như:

8. **Safety eval.**Trong bộ dev 上统计 Llama Guard 4 tỷ lệ vượt qua.

9. **Model card.**Mô hình MOF 2026: dữ liệu, đào tạo, cấp phép, an toàn, và bao gồm phần khả năng tái tạo của YAML và các SHA tham gia.

## Sử dụng nó
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

## 交付 nó
`outputs/skill-finetuning-pipeline.md`Mô tả giao hàng. Một lệnh hoàn thành dữ liệu đến SFT đến DPO đến quant đến serve đến evalu toàn bộ quy trình, và xuất ra thẻ mô hình + điểm cuối đã phục vụ.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## 练习
1. Trong cùng một tiêu chuẩn cụ thể về nhiệm vụ 上运行 SFT-only、SFT+DPO、SFT+GRPO── báo cáo phương pháp ưu tiên 胜出,以及领先多少──

2. 将 Llama 3.3 8B 替换为 Qwen3 14B──在匹配质量下测量 $/1M token──

3. 测量 domain data với mức chấp nhận EAGLE-3 trên chung ShareGPT ∙ báo cáo差值, cũng như nó đối với ngân sách trễ có nghĩa là gì ∙

4. 注入 1% ô nhiễm(把 MMLU-Pro trả lời 泄漏 vào dữ liệu đào tạo)并重跑 eval──观察 MMLU-Pro chính xác 不真地跃升──构建一个能捕获这个问题的污染检查CI门──

5. 添加 LoRA SFT, như là một thay thế cho âm thanh hoàn chỉnh.

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
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考 SFT / DPO huấn luyện viên
- [TRL documentation](https://huggingface.co/docs/trl) DPO và GRPO 参考实现
- [Unsloth](https://github.com/unslothai/unsloth) lặp lại GPU đơn 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考 hàng phục vụ
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)  Một huấn luyện viên giải mã đầu cơ khác
- [Model Openness Framework 2026](https://isocpp.org/) mở phát hành 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) canonical eval runner
