# 综合项目 14  تخمينات فك التشفير 推理服务器

> في vLLM 0.7 EAGLE-3 في التدفق الحقيقي جلب 2.5-3x 吞吐量.P-EAGLE (AWS 2026)  قدم المزيد من التكهنات الموازية.SGLang SpecForge تدرب على نطاق واسع على مسودة الرأس.

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 小时

## 问题
تم تحويل تشخيص المضاربة إلى سلعة في عام 2026 . تم تحويل مشروع EAGLE-3 إلى رأس مخطط بناء على نموذج الهدف  تدريب الحالة الخفية ،并预测未来 N 个 Token; تم إجراء التحقق من نموذج الهدف في مرور واحد. سيتم تحويل معدل قبول 60-80% إلى 2-3x من الانتشار من النهاية إلى النهاية.

关键技术不在模型,而在服务运营中. 接受率会随流量分布漂移(ShareGPT vs code vs domain data)  يحدث رفض 时的尾延迟比不使用猜测更差,因此你必须报告多个批量大小 下的 p99,而不能只报告稳定状态代币/sec──相对于Anthropic / OpenAI API的每1M代币 成本,是可信度的杆──

## 概念
التشفير المضارب لديه طبقتين**draft**النموذج ((إيغل-3 رأس ̊نغرام، أو أكثر من ذلك النموذج المتحالف مع الهدف) في كل خطوة يقدم ك 个候选 Token。**target**النموذج في المرور الواحد 中验证全部 k 个 Token; أي إشارة مقبولة ستبدل طريق الفلسة.

إيغل-3 على معظم التدفقات أفضل من إنجرام مشروع. P-EAGLE لأجل أعمق مشروع شجرة 运行 المضاربة الموازية.

التنفيذ باستخدام Kubernetes。vLLM 0.7 كل GPU أو شحنة متوازية التنسور 运行 نسخة。HPA 基于 queue-waiting وليس CPU 自动扩缩容量。FP8 (مارلين) 和 INT4 (AWQ) كم سوف يسمح ذاكرة GPU 保持在H100 / H200 范围内──端到端报告包括 throughput、接受率、批量 1/8/32 下的 p50/p99,以及 $/1M Token。

## المكونات
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术
- الخدمة: vLLM 0.7 أو SGLang 0.4
- أساليب التكهنات: رأس مشروع EAGLE-3
- مسودة التدريب: SpecForge (SGLang) أو Red Hat Speculators
- النماذج المستهدفة: Llama 3.3 70B ‧Qwen3-Coder-30B MoE ‧GPT-OSS-120B
- الكمية: FP8 (مارلين) ∞INT4 AWQ
- التنفيذ: Kubernetes + NVIDIA جهاز إضافة؛ على أساس المقاييس انتظار الصف
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval، لقياس معدل قبول عبر النطاقات
- المرجح: تنسورRT-LLM فك التشفير المضاربة، كخط أساسي للمورد


```figure
cf-spec-decode
```

## بناءها
1. **Target model prep.**选择 Llama 3.3 70B──通过 مارلين كمية إلى FP8──在 1xH100(或 2x تنصر متوازي) 上用 vLLM 0.7 部署──

2. **Draft source.**من Red Hat Speculators 拉取 الموافقة EAGLE-3 مسودة رأس( أو من خلال SpecForge 训练一个)

3. **Baseline numbers.**في الافتراضات 之前:بارت 1/8/32 下的代币/s、p50/p99 تأخير、استخدام البيانات الكهربائية‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

4. **Enable EAGLE-3.**تغيير التكوين؛ إعادة تنفيذ نفس المعيار المرجعي.

5. **P-EAGLE.**• إمكانيّة التكهنات الموازية؛ قياس اختلافات شجرة المسودة العميقة مع سلسلة EAGLE-3.

6. **Domain traffic.**سوف يشاركGPT、HumanEval و النطاقات المحددة حركة المرور من خلال نفس الخادم 运行── حسب التوزيع القياسية قبول معدل── تحديد مشروع 发生 التدفق 条件──

7. **Second target model.**في Qwen3-Coder-30B MoE 上运行 نفس الأنابيب── مسودة 更棘手(صوت توجيه MoE)── تقرير النتائج──

8. **K8s HPA.**في K8s، ويقومون بتتبع HPA`queue_wait_ms` عرض الحمل تغير إلى ثلاثة أضعاف الوقت

9. **Cost comparison.**في نفس تقييم 上 حساب $/1M Token,并与人类 کلاود سونيت 4.7 和 OpenAI GPT-5.4比较──发布结果──

## استخدمها
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## 交付 it
`outputs/skill-inference-server.md`وصف المنتج.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

## التدريب
1. عندما يُقَدَّم مشروع مقارنة بالهدف 落后一个版本时 (على سبيل المثال، إلاما 3.3 -> 3.4 drift) ، يُقيّم تدهور معدل قبولها.

2.  تحقيق إرجاع النسخة: إذا كان معدل قبول EAGLE-3 أقل من عتبة معينة، فلتنتقل إلى مسودة النسخة.

3. 运行受控MoE تجربة:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音 两种情况对比──测量草案接受敏感性──

4. 扩展到H200 (141 GB) 报告每副本 获得的模型大小头房,以及是否可以服务一个未定量化的Llama 3.3 70B‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

5. في نفس أجهزة H100 فوق مقياس TensorRT-LLM فك التفريبية.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) كومة الخدمات المرجعية
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) ورقة تشخيص المضاربة المتوازية + تكامل
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) خطة تدريبية للقائد المسرحي
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) مركز مشروع متوافق
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/)البدائل البائعة
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) إشارة تجارية
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840)ورقة طريقة
- [vLLM repository](https://github.com/vllm-project/vllm) الرمز والمؤشرات المرجعية
