# كابستون 07 端到端  Fine-Tuning Pipeline ((بيانات إلى SFT إلى DPO إلى Serve)

> نموذج 8B على أساس تدريب بياناتك الخاصة ، على أساس تفضيلاتك الخاصة لإنجاز DPO على التوازن ، وإنجاز التعريف الكمي ‒ التشخيص المضاربي ، ومع قياسها مع علامات $ / 1M 成本提供服务. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**المرحلة الثانية (ML) ، المرحلة الثالثة (DL) ، المرحلة السابعة (المحول) ، المرحلة العاشرة (LLM من الصفر) ، المرحلة الحادية عشر (هندسة LLM) ، المرحلة السابعة عشرة (البنية التحتية) ، المرحلة الثامنة عشرة (السلامة)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

## 问题
في عام 2026 ، كل فريق قاطع من AI سيكون جاهزاً في أي وقت لإنشاء خط أنابيب تحسينات دقيقة. ليس لأنهم يريدون إصدار نموذج أساسي حدودي ، ولكن لأن نطاق SFT يناسب ، أي DPO المستهدف للمعلامات المفضلة ، والتي تستخدم في تشكيل المضاربات ، فضلاً عن استخدام خدمة EAGLE-3 ، حيث يمكن قياس الإستفادة الحقيقية.

ستضع أساس 8B إلى 14B ((Llama 3.1 8B、Qwen3 14B أو Gemma 3 12B) في البيانات المحددة للمهمة 上依次完成 SFT 和 DPO, ثم لخدمة القيام بالقياس الكمي,并使用 lm-قياس-السلسلة、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 衡量升级── سوف تقوم بناءً على 2026 Model Openness Framework 产出一份模型卡──重点是可复现性:

## 概念
هذا الخط له خمس مراحل**Data**:dedup(MinHash / Datatrove) ∙مصفح الجودة(Nemotron-CC 风格 تصنيف) مصفح PII ٬تحقق من النظافة المزروعة للتلوث من المؤشر المرجعي العام‬**SFT**: أكسولوتل يامل  8x H100 上 上的 زرو-3 ٬ جدول كوسين ٬ سلسلة معبأة ٬ 2-3 دورات ٬**DPO or GRPO**: تكوين TRL 、1 عصر 、أزواج الاختيار يمكن أن تأتي من التسمية الاصطناعية أو النموذج الحكم 、التنسيق البيتا‬**Quantize**:GPTQ + AWQ + GGUF، ضمان مرونة النشر**Serve**:vLLM 0.7 + EAGLE-3 رؤساء المضاربة(أو SGLang + SpecForge)、تشرين K8s、بناء على HPA انتظار الصف

الإجراءات هي المواد المقدمة: في ثلاثة معايير محددة للمهمة 上比较 SFT- فقط、SFT+DPO、SFT+GRPO。 قياسات الخدمة: مجموعة 1 / 8 / 32 下的令牌/s、EAGLE-3 معدل قبول、$/1M رموز‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## المكونات
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
- البيانات: البيانات تستخدم لتحقيق، النموترون-CC تصنيف تستخدم لجودة، الوزارة تستخدم ل PII
- القاعدة: لامة 3.1 8 ب、 كوين3 14 ب أو جيمما 3 12 ب
- SFT: Axolotl v0.8 ، مع زرو-3 ✓ فلاش انتباه 3 ✓ تسلسلات معبأة
- تحديد الاختيار: TRL 0.15 تستخدم DPO أو GRPO؛ Unsloth تستخدم إعادة التكرار من GPU واحد
- الكمية: GPTQ (مارلين) 、AWQ、 ٬ من خلال llama.cpp 生成 GGUF
- خدمة: vLLM 0.7 + EAGLE-3 فك التشفير المضاربة ((أو SGLang 0.4 + SpecForge)
- Eval: lm-تقييم-استعمال
- تقييم السلامة: حراسة لامة 4
- البنية التحتية: Kubernetes + NVIDIA جهاز إضافية، على أساس HPA المقاييس انتظار الصف
- الملاحظة: W&B تستخدم للتدريب، Langfuse تستخدم للإستنتاج


```figure
ce-finetune-stages
```

## بناءها
1. **Data pipeline.**في الجسم الخام 上运行 داتاتروف ديبوپ.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

2. **Contamination check.**لكل تقسيم التحقق، الحساب مع MMLU-Pro،،MT-Bench-v2،،RewardBench-2 مجموعة اختبار من MinHash── رفض أي تداخلات‬

3. **Axolotl SFT.**يمل 包含 ZeRO-3、FA3、تعبئة التسلسلات‬‬‬‬‬‬‬استعمل 8xH100‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

4. **TRL DPO / GRPO.**取 SFT نقطة التفتيش، في أزواج التفضيلات 上运行一个时代的 DPO(或在数学/code 上使用可验证奖励的 GRPO) 』扫描beta──

5. **Quantize.**生成三种量子:GPTQ-INT4-مارلين、AWQ-INT4、面向 llama.cpp 的 GGUF-Q4_K_M── حجم السجل 和 throughput الاسمي──

6. **Serve with speculative decoding.**vLLM 0.7 تكوين، باستخدام Red Hat Speculators  تدريب EAGLE-3 رؤوس مشروعات  قياس مجموعة 1 / 8 / 32  معدل قبول و التأخير الذيل  تقرير مع انتروبيك / OpenAI في نفس تقييم  1 مليون دولار ترامب مقابل 

7. **Eval matrix.**في البنيسة 、SFT-وحدها、SFT+DPO、SFT+GRPO 上运行 lm-eval-harness、RewardBench-2、MT-Bench-v2、MMLU-Pro──产出一张表──

8. **Safety eval.**في المجموعة التطويرية 上统计 لاما غارد 4 معدل عبورها.

9. **Model card.**طراز MOF 2026:بيانات تدريبات حالية سلامة رخصة، فضلا عن تشمل YAML و المشاركة SHAs القسم إعادة التأهيل

## استخدمها
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

## 交付 it
`outputs/skill-finetuning-pipeline.md`描述交付物物──一个命令完成数据到 SFT到 DPO到 quant 到 serve到 eval 的全流程,并输出模型卡 + 已服务的终点──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## التدريب
1. في نفس المعايير المحددة للمهمة 上运行 SFT- فقط ‧SFT+DPO、SFT+GRPO── تقرير أي طريقة تفضيل 胜出,以及领先多少──

2. 将 Llama 3.1 8B 替换为 Qwen3 14B──在匹配质量下测量 $/1M tokens──

3. 测量域数据与通用 ShareGPT 上的EAGLE-3 قبولية المعدل.

4. 注入 1% التلوث ((把MMLU-Pro إجابات 泄漏进培训数据)并重跑 eval──观察MMLU-Pro دقة 不真地跃升──构建一个能捕获这个问题的污染检查CI门──

5. إضافة LoRA SFT، كبدل من المزج الدقيق الكامل.

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
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考 مدرب SFT / DPO
- [TRL documentation](https://huggingface.co/docs/trl) دبي و جرو
- [Unsloth](https://github.com/unslothai/unsloth) إعادة التكرار من GPU واحد 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考 كومة الخدمة
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)  نوع آخر من مدربات التفكير
- [Model Openness Framework (arXiv:2403.13784)](https://arxiv.org/abs/2403.13784): إطلاق مفتوح 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) متدرب تقييم تقييم
