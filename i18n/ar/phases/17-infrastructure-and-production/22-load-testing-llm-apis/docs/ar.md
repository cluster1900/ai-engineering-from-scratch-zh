# اختبار الحمل إدارة الأعمال التدريبية APIs  لماذا k6 و الثعلب 会说谎

> لا يتم تصميم اختبارات الحمل التقليدي لردود التدفق  طول الخروج المتغير  متريات درجة الـ Token أو GPU  و 而而设计的── معظم الفريقين سيتم إلقاء القبض على اثنين من الفخاخ                                                                                                                                                                                                                              `--mean-input-tokens`+ `--stddev-input-tokens`修复这一点──2026 年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm) للاستخدام في الجهازات الجهازية**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）** التدفق على الهواء الطلق 、Kubernetes-أصل، من خلال TestRun/PrivateLoadZone CRDs القيام بتوزيع 测试,最适合 CI/CD gate;Vegeta 用于 Go ثابت-rate saturation;Locust 2.43.3 只有配合 LLM-Locust extension 才适用于 streaming──负载模式:steady-state、ramp、spike(autoscaling test)、soak(memory leaks) ‬

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**المرحلة 17 · 08 (مقاييس الإستدلال) ، المرحلة 17 · 03 (توسيع الذاتية للبرنامج)
**Time:** ~75 minutes

## 學习目标
- 解释让通用载荷测试器在LLM API 上说谎的两个反模式(GIL 陷、即时-均性陷)
- 针对给定目的选择工具:LLMPerf(المرجع المقياسية)、k6 + التوسع التدفقي(بوابة CI)、المرشدات(التركيب الاصطناعي على نطاق واسع)、GenAI-Perf(إشارة NVIDIA)。
- 设计四种负载模式 ((استقرار、رامي、بيك٬غوص) ،并说出每种模式捕捉的失败模式──
- استخدام رموز المدخلات من المتوسط + stddev 构建真实的 التوزيع السريع ، بدلا من طول ثابت.

## 问题
لقد قمت بتجربة نقطة نهاية لـ LLM، وضعت 500 مستخدم متزامن. لقد تم إيقافها. لقد تم إيقافها.

حدث شيئين. أولا، K6 أرسلت 500 إشارة نفسها.  طلبك-تجميع ووضع الاحتياطي المسبق يجعلها تبدو وكأنها معالجة 500 رمز متزامن، ولكن في الواقع مجرد معالجة واحد.

اختبار الحمل في ماجستير في العلوم العليا هو سؤال مستقل.

## 概念
### (GIL 陷(Locust)

Locust استخدام Python، وفي جانب العميل 于 GIL 下运行 توكيينازيشن.高并发时,Tokenizer 会排在请求生成 后面.

修复:إكستنشن LLM-Locust سوف تحويل الوهم إلى عملية مستقلة ، أو استخدام اللغة المجمعة القائمة على اللغة المجمعة

### التوحيد السريع

جميع اختبارات الحمل المعروفة تسمح لك بتصميم استشارة واحدة. في 10,000 مرة من اختبار الدورة، كل مرة سوف ترسل نفس الاستشارة تماما. الخادم كل مرة ترى نفس الإضافة.

修复: من التوزيع السريع 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` 长度多样,内容多样.

### أربعة أشكال

1. **Steady-state** 以 ثابتة RPS 运行 30-60 分钟──捕捉:基线性能回归──
2. **Ramp** خلال 15 دقيقة سوف يرتفع RPS من 0 線性 إلى القيمة المستهدفة
3. **Spike** ارتفاع مفاجئ إلى 3-10x RPS، يستمر 2 دقيقة بعد استعادة.
4. **Soak** حالة ثابتة 运行 4-8 小时──捕捉: تسربات الذاكرة

### 2026 工具映射

**LLMPerf**(Anyscale)  Python، ولكن الجهازات بواسطة Rust 支持──Mean/stddev تطلبات──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** إشارة NVIDIA  استخدام عميل Triton  متري 覆盖全面‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ 

**LLM-Locust**(TrueFoundry) 修复 GIL 陷的虫扩展──熟悉的虫 DSL + 流量指标──

**guidellm** مقياس مقياسية كبيرة

**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）**:
- (إذهب، قم بتجميعها، بدون إضافة)
- k6 مشغل استخدام TestRun / PrivateLoadZone CRDs  إجراء اختبارات مقسمة Kubernetes-أصلة
- 最适合 CI/CD gate 和 SLA testing

**Vegeta** الذهاب،比 k6 更简单──شبية HTTP ثابتة السعر── ليس لديه قدرة على معرفة الجامعة، ولكن مناسبة للاختبار بوابة / حدود السعر──

**Locust 2.43.3 stock** لـ LLM 有 GIL 陷🏼 فقط يمكن أن يرتبط LLM-Locust تمديد استخدام‬‬

### بوابة SLA في مركز CI

في PR 上运行 k6,并使用:

- في خط الأساس RPS 下各 30-50 مرات التكرار
- البوابة: P50/P95 TTFT、5xx < 5%、TPOT 低于值。
- 违规时让建设 失败。

### حقا حقيقية التوزيع السريع

من نموذج التدفق الحقيقي بناء (إذا كان هناك) ، أو من التوزيعات العامة بناء (على سبيل المثال تستخدم في الدردشة ShareGPT الإشارات، تستخدم في الرمز HumanEval) ، سوف يعني + stddev 输入 LLMPerf。 على أي حال يجب تجنب الحلقة مع واحد-إشارة。

### يجب أن تتذكر الرقم

- k6 المشغل 1.0 GA:2025 年 9 月。
- k6 v2026.1.0:مقاييس الوعي بالاتصال
- 典型 LLMPerf run: في التزامن X 下 100-1000 طلبات
- بوابة CI النموذجية: لكل إعادة التكرار 30-50 PR
- أربعة أشكال: ثابتة، رامي، نوتة، غطس


```figure
load-pattern-waves
```

## استخدمها
`code/main.py`模拟带有真实快速分布的负载测试,测量有效TPOT,并演示均快速陷──

## 交付 it
本课生成 `outputs/skill-load-test-plan.md` إعطاء حمل عمل محدد و SLA 后, اختيار الأدوات并设计四种负载模式──

## التدريب
1. 运行 `code/main.py` تقسيم متساوي وواقعي  差在哪里?
2. من أجل بوابة CI 编写 k6 نص:在100同时 下 TTFT P95 <800 ms,runtime 5 分钟──
3. اختبار التغوط الخاص بك يظهر الذاكرة كل ساعة تزيد 50 ميغابايت.
4. اختبار العصبة من 10 ريبس إلى 100 ريبس. إذا كان كاربينتر + vLLM إنتاج-حجمة 已就位(المرحلة 17 · 03 + 18) ، المتوقع وقت التعافي هو كم؟
5. GenAI-Perf في نفس الخادم 上 گزارش TPOT=6ms؛LLMPerf  گزارش TPOT=11ms。 شرح السبب。

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
