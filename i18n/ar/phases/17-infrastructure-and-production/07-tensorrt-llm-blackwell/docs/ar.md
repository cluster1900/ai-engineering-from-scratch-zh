# في بلوكويل 上 استخدام FP8 و NVFP4 运行 TensorRT-LLM

> TensorRT-LLM  محدود فقط لـ NVIDIA، ولكن هو في بلاكويل 上胜出── في配合 دينامو 编排 GB200 NVL72 上,SemiAnalysis InferenceX في 2026 Q1-Q2 测得 120B 模型成本为每百万令牌$0.012，而 H100 + vLLM 为 $0.09/M، تشكل 7x الفجوة الاقتصادية. هذا المجموعة هي ثلاث أنواع من الوقوف على النقطة الدقيقة من النظام:FP8 على KV التخزين والكروات الاهتمام  لا يزال مهمًا ، لأنه يحتوي على النطاق الحركي الذي يحتاجه ؛ NVFP4  4-bit microscaling) معالجة الوزن والقيمة التشغيل ؛ التنبؤ متعدد الوهات (MTP) مع المزدوج المزدوج / التميز أيضا على ذلك إضافة 2-3x  يوم-0                                                                                                                                                                                                                                                                                                                                                                                  

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**المرحلة 17 · 04 (vLLM الخدمة الداخلية) ، المرحلة 10 · 13 (تقييم)
**Time:** ~75 分钟

## 學习目标

- 解释为什么即便权重使用NVFP4,FP8对KV缓存 和注意 仍然关键──
- 计算边界模型 在 BF16、FP8 和 NVFP4 下的HBM足迹,并推理节省来自哪里──
- يقولون عن TRT-LLM استخدام بلاكويل خصائص خاصة ((الليلة-0 FP4
- 判断什么时候 TRT-LLM's NVIDIA-lock 值得使用相对于 Hopper 上 vLLM's 7x 成本差距──

## 问题

2026 سنة التفكير الاقتصادي المشكلة هي لكل دولار يمكن أن تنتج الكثير من الوهم── والجواب يعتمد على أربعة طبقات على التركيبات:硬件代际(Hopper H100/H200 مقابل Blackwell B200/GB200) 精度(BF16 → FP8 → NVFP4) ٬ المحرك الخادم(VLLM مقابل SGLang مقابل TRT-LLM) و طريقة ترتيب(بسيط مقابل منفصل مقابل Dynamo)‬

في Hopper + vLLM 上,120B MoE من تكاليف تشغيل حوالي لكل مليون رمز ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0.012,便宜 7x── جزء منها من الفجوة من hardware(Blackwell واحد GPU LLM 吞吐 مقابل هوبر 高 11-15x)── الجزء الآخر من كومة:FP4 权重、MTP مسودة、فصل المقبل/إفصاح، فضلا عن استخدام NVLink 5 للاتصالات الخبراء MoE كل إلى كل‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

هذا هو التخلي: باستخدام التنقل التجاري لتغيير الاقتصادية. فهم أي كومة من المجموعات المختارة قد ساهمت في أي جزء من الفجوة، هو جوهر هذا الدراسة.

## 概念

### لماذا FP8  لا يزال أسفل KV cache

خطأ شائع عام 2026 هو: افتراض أن NVFP4 يمكن تطبيقها في جميع الأماكن. الحقيقة ليست كذلك.

NVFP4(2025-2026) تطبق على الوزن والقيمة التشغيل.

典型 بلاكويل 配置:

- 权重:NVFP4 ((4 بتات التصوير المجهري)
- 激活值:NVFP4。
- كاش كيف:FP8。
- مكثف الاهتمام:FP32 ((رملة أقصى

### استخدام TRT-LLM بلاكويل خاصة ذات البدائية

- **Day-0 FP4 weights**: نموذج تزويدك مباشرة إصدار FP4 权重;TRT-LLM 无需后培训转换 即可加载──FP4 不需要 AWQ / GPTQ 步骤──
- **Multi-token prediction (MTP)**: مع EAGLE(مرحلة 17 · 05) نفس الطريق، ولكن تم تجميعها إلى TRT-LLM بناء 中──
- **Disaggregated serving**:prefill 和 decode 位于独立 GPU pools,KV cache 通过 NVLink أو InfiniBand 传输──与 Dynamo(Phase 17 · 20)
- **All-to-all communication primitives**: NVLink 5 سوف تعزز تأخير الاتصال الخبير MoE مقارنة هوبر  خفض 3x  TRT-LLM من نواة MoE  تم إجراء تعديلات على هذا
- **NVFP4 + MXFP8 microscaling**:بلاكويل تنسور كورات 上的硬件加速尺度-عامل 处理──

### يجب أن تتذكر الرقم

- HGX B200 通過 TRT-LLM في GPT-OSS-120B 上 يصل إلى 0.02 $ / M Token。
- GB200 NVL72  通过 دينامو 编排 TRT-LLM) يصل إلى 0.012/M Token.
- H100 + vLLM 在可比工作负荷上约为0.09 $ /M Token。
- TRT-LLM 更新三月带来 2.8x 吞吐增益(2026)。
- بلكويل مقارنة هوبر واحد GPU LLM 吞吐为 11-15x
- MLPerf إيجاب v6.0(2026 年 4 月): بلاكويل 主导每个提交任务──

### فب4 فى النمو الحقيقي

NVFP4 激进很──在推理-heavy workload ((سلسلة التفكير、数学、长上下文代码-gen) 上,FP4 权重会明显退化──Per-block calibration can be mitigated, but cannot eliminate── نشر نماذج التفكير عادة ما تستخدم FP8 权重 + FP4 激活值作为折中,或坚持在 H200 上全程使用 FP8──

قواعد: في التزام استخدام NVFP4 权重前,始终在你的评估设上验证任务质量──

### لماذا هذا هو NVIDIA-قفل

إن TRT-LLM هو C++ + CUDA + نواة مصدر مغلقها. الموديل بحاجة إلى SKU خاصة لـ GPU 编译。不支持 AMD,不支持 Intel,不支持 ARM。 إذا كانت استراتيجيتك الإحتياطية متعددة الجهات المتاحة، فإن TRT-LLM لا يمكن أن يذهب إلى الطبقة الخدمة TRT-LLM.

### 2026 سنة تنسيق عملي

 لـ 100 مليون دولار + في الحسابات التدريبية السنوية، تنفيذ هوبر + vLLM 会留下 7-10x من التكلفة المتمثلة في تحسين الفضاء.

### مكافأة التقسيم

في مرحلة 17 · 20 中深入讲解──在 بلاكويل 上,乘数会叠加:FP4 权重 × MTP سرعتup × التنظيم الموقع × cache-awaren routing──7x 数字假设使用的是这套完整的堆──


```figure
pipeline-parallel
```

## استخدمها

`code/main.py`会为三种堆 计算模型的HBM Footprint、decode throughput(memory-bound regime) و $/M-token:H100 + BF16 + vLLM、H100 + FP8 + vLLM、B200 + NVFP4/FP8 + TRT-LLM──运行它,观察复合效应,以及每个变化贡献了差距中的哪一部分──

## 交付 it

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md` إعطاء حجم العملات المحددة  حجم الـ Token السنوي، فإنه سيحكم على Blackwell + TRT-LLM stack إذا كان يستحق NVIDIA-lock‬

## التدريب

1. 运行 `code/main.py` لحد من المعلمات النشطة لـ 30% من 120B MoE، حساب H100 BF16、H100 FP8 و B200 NVFP4/FP8 فوق التوصيل القياسي الحدودي للفريقة النطاقية‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
2. 某客户每年在H100 + vLLM 上花费2M$. 考虑7x 经济差距, they need to buy how many Blackwell GPUs 才能在12个月内摊销迁移到TRT-LLM的成本?
3. بعد تحويل الوزن في NVFP4 ، ترى في MATH على ارتفاع معدل الوقوف 3 个点.
4. 阅读MLPerf v6.0 نتائج الاستنتاجات...
5. 计算 405B 模型在 NVFP4 权重 + FP8 KV cache、128k context 下所需的HBM──它能装进单个GB200 NVL72 节点吗?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) 2026 年 4 月 MLPerf 结果──
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) NVLink 5 كل شيء إلى كل مع نواة MoE
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方 engine 文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) التنسيق المفصل على TRT-LLM 之。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) 发布 بلاكويل عدد مقياس السويت
