# كمية الإنتاج  AWQ، GPTQ، GGUF K-quants، FP8, MXFP4/NVFP4

> إن شكل الكمية ليس خيارًا عامًا ، بل وظيفة محرك الخدمة والحملة والعمل. GGUF Q4_K_M أو Q5_K_M 通過 llama.cpp 和 Ollama 交付 ، احتلال CPU و 场景 الجهاز. GPTQ في vLLM 内部胜出 ، تناسبك تحتاج إلى العمل في نفس القاعدة فوق حالات متعددة LoRA.

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## 學习目标
- يقولون 2026 ستة أشكال كمية الإنتاج  وموقعها المفضل الملائمة
- في تحديد الأجهزة ((CPU مقابل GPU、Hopper مقابل Blackwell) 、 المحرك(vLLM、TRT-LLM、llama.cpp) وحمله العمل(رداء روتينية、التفكير、متعدد-LoRA)
- 计算所选格式节省重量内存,以及未受影响的KV缓存──
- يقولون أن النماذج الكمية في حركة المرور في النطاقات

## 问题
سيتم تقليل الجهاز الكمي و خفض الذاكرة و عرض النطاق النطاق HBM ، وهذا هو بالضبط ما يُحتاج إلى فك الجهاز. نموذج FP16 70B لديه 140 غيغابايت 权重.

ولكن الكمية ليست مجانية. الكمية الحيوية تحفز من الجودة، خاصة في المهام الثقيلة للتفكير.

## 概念
### الأشكال الستة

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/edge 默认选择

GGUF هو شكل ملف ، في حد ذاته ليس محركًا قياسيًا ، فإنه يحتوي على مختلفات K الكمية ((Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0) ، ووضع في حاوية واحدة.

في vLLM متوسط التوصيل 惩罚:7B 上约 93 tok/s، هذا النموذج لم يستهدف نواة GPU 优化── عندما يكون هدف التنفيذ هو CPU/edge 时使用GGUF──其他 الحالات لا تستخدم──

### GPTQ  vLLM 中的多-LoRA

GPTQ هو خوارزمية كمية ما بعد التدريب ، مع مرور تحديد النطاقات.

انها ميزة فريدة:GPTQ-Int4 في vLLM تدعم مُعدّلات LoRA。 إذا كنت تريد خدمة نموذج أساسي إضافة إلى 10-50 خيارات دقيقة المُعدّلة(كلّ واحدة كـ LoRA) ،GPTQ هو طريقك──حتى أوائل عام 2026، NVFP4 لا يزال لا يدعم LoRA。

### AWQ  مركز البيانات GPU 默认选择

كمية الوزن المعرفة على التفعيل  الحماية في الوقت الحالي حوالي 1%  الحماية في الوزن المبرز  الحوافز مارلين-AWQ:相比 ساذجة  تحقيق 10.9x سرعة  7B  741 توك/س، هي أفضل 

ما عدا أنك بحاجة إلى متعددة LoRA ((GPTQ) أو تحسين بلاكويل FP4 ((NVFP4), وإلا فإن خدمة الجيبو الجديدة  اختيار AWQ。

### FP8  قابل للتأمين وسط

نقطة عائمة 8-بيت──近似无损──支持广泛──Hopper Tensor Cores 原生加速FP8──بلاكويل 继承这一点──当质量不可妥协时(理性、医学、代码-gen),FP8 هو 2026 سنة آمنة الاختيار المتضمن──إنقاذ الذاكرة هو نصف INT4، ولكن الجودة مخاطر منخفضة جدا──

### MXFP4 / NVFP4  بلاكويل 激进选择

التوسع في الحجم الدقيق FP4── كل كتلة الوزن لديها عامل مقياس خاص بها── تحفيز، ولكن في بلوكويل Tensor Cores 上有硬件加速── مقارنة FP8, سوف تقلل عدد كل رمز 字节 إلى النصف، وهذا هو المرحلة 17 · 07 في المرحلة الاقتصادية.

ملاحظات:
- لا يوجد دعم لورا (أول عام 2026)
- التفكير - عبء عمل ثقيل
- يجب أن تكون في مجموعة التقييم الخاصة بك

### فخّ التصفية

AWQ و GPTQ  بحاجة إلى مجموعة بيانات تحديد المعدلات، عادة C4 أو WikiText.

修复方式: استخدام بيانات في النطاقات القيام بالتصفية.

### فخ الـ KV

أوتق وضع الوزن المقصود إلى 4 بتات.

- الوزن: حوالي 35 جيجابايت ((من 140 جيجابايت INT4 و يأتي)
- 128 并发 × 2k سياق أسفل KV التخزين: حوالي 20 GB.
- الإنشاءات: حوالي 5 جيجابايت
- إجمالي: حوالي 60 جيجابايت، يمكن وضعها في H100 80 جيجابايت

我把模型量化到4GB 会忘记另外30-50GB──要整体预算HBM──

إضافة إلى ذلك، كيف كاش كمية ((FP8 كيف أو INT8 كيف) هو خيار آخر، مع تعادلات خاصة بها، فإنه سوف يؤثر مباشرة على دقة الاهتمام، وليس مجانا من المكاسب‬

### أوتو كيو INT4 على التفكير

سلسلة الفكر 、 الرياضيات 、 طويلاً النطاقات الكودية، هذه المهام كلها سوف تتأثر بشكل واضح بتحقيق الكمياتية الحثيثة ٬ AWQ INT4 في MATH 上会损失约 3-5 نقاط ٬ بالنسبة لحملات العمل الثقيلة للتفكير، إصدار FP8 أو BF16؛ قبول تكلفة الذاكرة٬٬

### 2026 دليل التقط

- خدمة CPU/Edge:GGUF Q4_K_M──完成──
- خدمة الجيبو ، دردشة روتينية ، بدون لورا
- خدمة GPU ‬المُعدّل: GPTQ من Marlin ‬
- عبء العمل في التفكير:FP8。
- مركز بيانات بلاكويل 质量已验证:NVFP4 + FP8 KV
- غير واضح: لكل مرشح يتم تقييمه على 1000 عينة


```figure
gpu-memory-breakdown
```

## استخدمها
`code/main.py`سيتم عرض مجموعة من النماذج الكبيرة، والحسابات من 6 أشكال أثر الذاكرة (وزن + KV + تفعيلات) والعبور النسبي.

## 交付 it
本课会产出 `outputs/skill-quantization-picker.md` تحديد حجم الأجهزة، النموذج، نوع عبء العمل، وتسامح الجودة، فإنه يختار شكلًا، ويولد خطة تحديد/تأكييد

## التدريب
1. 运行 `code/main.py` بالنسبة إلى نموذج 70B من 128 و 2k سياق، حساب مجموع HBM من كل نوع من الأشكال.
2. لديك نموذج تشفير 7B. اختيار طريقة للتصميم ووضح السبب. إذا كنت تحكم على التسامح مع الجودة خطأ، ما هو الطريق إلى الاسترداد؟
3. الحسابات للنموذج المجال الطبي 校准 AWQ مطلوبة حجم المعدل-مجموعة البيانات... لماذا لا يكون المزيد من البيانات أفضل دائما؟
4. 阅读 مارلين-AWQ ورقة النواة أو ملاحظات الإفراج.
5. متى يمكنك أن تضع أوزان AWQ مع FP8 KV مخزن مخزن، مقارنة بتركيز KV ابق في BF16 أكثر منطقية؟

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
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) مقارنة مع المعيار المرجعي
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的吞吐量 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南。
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) صيغة AWQ الأصلية
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) صيغة GPTQ الأصلية
