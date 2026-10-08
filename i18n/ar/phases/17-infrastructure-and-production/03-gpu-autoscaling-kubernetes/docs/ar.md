# كوبرنيتس 上的 جي بي يو التوسيع الذاتي  كاربينتر، KAI المجدول، المجدول العصابات

> هو ثلاثة مستويات ، وليس طبقة واحدة. كاربنتر 动态供应节点(不到一分钟,比 Cluster Autoscaler 快 40%)  KAI Scheduler 处理帮安排、拓感知和分层队列  它能避免 7-of-8 部分分配陷:七节点因为缺缺 GPU而等并烧钱.`DCGM_FI_DEV_GPU_UTIL`و هو قياس دورة العمل: 100٪ ربما يكون 10 个请求, وربما يكون 100 个.`WhenEmptyOrUnderutilized`استراتيجية، لأنه سوف ينتهي في عملية التفكير العمل الجيوبي يجري.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：**المرحلة 17 · 02 (اقتصاد منصة الإستعراض) ، المرحلة 17 · 04 (vLLM خدمة داخلية)
**Time:** ~75 minutes

## 學习目标
- رسم ثلاثة مستويات من التوسيع الذاتي 架构 节点供给、帮安排、应用层),并说出每一层使用工具──
- أوضح لماذا`DCGM_FI_DEV_GPU_UTIL`هو خطأ HPA 信号,并说出两个替代信号(队列深度、KV cache utilization rate)
- 描述帮派安排以及 KAI Scheduler 防止的部分分配失败模式(8 个GPU 中有7 个空等待)
- يقول "توفير النهاية" يعمل في عمل "جيبيو"`WhenEmptyOrUnderutilized`),并说明2026 سنة الإستبدال الأمني.

## 问题
فريقك في Kubernetes أعرضت خدمة لدرجة الماجستير في مجال التعليمات العليا.`DCGM_FI_DEV_GPU_UTIL`作为信号──业务时间内服务一直卡在100%利用率──HPA 从不扩大 它已经认为你满载了──你手动增加一副本;TTFT 降落了──HPA 仍然不扩容──这个信号在骗你──

بالإضافة إلى ذلك، تستخدم Cluster Autoscaler 管理节点──凌晨2点来一个1M-Token prompt; cluster花了3分钟供给节点,请求超时──

علاوة على ذلك، قمت بتنفيذ محرك يتطلب عبر 2 عقدة استخدام 8 GPU نموذج 70B.

ثلاث طبقات، ثلاث أنماط مختلفة من الفشل.

## 概念
### الطبقة 1  节点供给 (الخريطة)

كاربينتر راقب القنابل المنتظرة، ويقوم بتقديم العناصر في حوالي 45-60 ثانية`NodePool`约束动态选择实例类型  إذا كان حجرك 需要 8 H100، بينما لا توجد نقاط مطابقة في المجموعة، سوف يقوم كاربنتر بتزويد عبارة عن عبارة مباشرة عن عبارة عن عبارة، بدلاً من توسيع مجموعة موجودة ما.

**consolidation 陷阱**: كاربنتر 默认的 `consolidationPolicy: WhenEmptyOrUnderutilized`بالنسبة لمجموعة GPU 很危险──它会终止正在运行的 GPU 节点,把 pod 迁移到更便宜且更合适尺寸的实例──对于推理工作负载,这意味着驱逐正在运行的请求,并重新加载70B模型在新节点──损失是数分钟容量外加请求失败──

إعدادات أمن حوض GPU:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

يسمح كاربينتر في فترة بعد التوحيد لكن لا يطرد العمل الذي يجري

### الطبقة 2  تنظيم المجموعات

KAI Scheduler ((项目原名 "كارب",后改名)处理默认 kube-scheduler 不处理的事情:

**Gang scheduling** كامل أو كامل بدون وضع الأرض ∙ بحاجة إلى 8 أجهزة إستنتاج موزعة من GPU ، أو 8 معاً لبدء ، أو واحد لا يبدأ ∙ بدونها ، سوف تواجه جزء من تخصيص في 8 أجهزة في بداية 7 ، انتظار لا محدود ومحترقة المال ∙

**拓扑感知** 知道哪些GPU共享 NVLink、哪些位于同一架、哪些之间有InfiniBand──并据此放置 pod──DeepSeek-V3 67B تنسور متوازي عبء العمل 必须留在一个NVLink域内;KAI Scheduler将遵守这一点──

**分层队列** العديد من الفرق على الأولوية و حصة  المنافسة مع مجموعة GPU واحدة  الحاجة الطارئة إلى الإنتاج في الفريق A فقط في أولوية   عندما يسمح القواعد ، فقط سيتم الحصول على وظيفة تدريبية في الفريق B 抢占──

كاي كجدول ثانوي مع كوب-جدول واحد تمتد؛ أنت من خلال التعليقات 让工作负载 使用它──Ray 和 vLLM إنتاج-حجمة 都有集成──

### الطبقة 3  应用层信号

**HPA 陷阱**:`DCGM_FI_DEV_GPU_UTIL`يُقيس GPU في كل فترة عمل هل يعمل. 100% من معدل الاستخدام قد يعني 10 أو 100 طلبات، وربما 100 طلبات.

والأسوأ من ذلك، فليم و مثل المحركات سوف تقاسم قبل الوصول إلى ذاكرة الاحتفاظ الكهربائية`--gpu-memory-utilization`(── حتى لو كان هناك طلب واحد، استهلاك الذاكرة يبقى على نحو 90%── HPA القائم على الذاكرة لن ينخفض أبدا ً──

**2026 年替代信号**:

- 队列深度(انتظر طلبات الوفاء المسبق)。
- كيه وي cache utilization rate ((مخصصة لسلسلة نشطة من كتلة مثال)
- كل نسخة من P99 TTFT ((إشارة SLA الخاص بك) 
- جيدجدوة (( في كل ثانية لتلبية جميع طلبات SLO)

NVIDIA Dynamo Planner 和 llm-d Variant Autoscaler 会消费这些信号并扩缩复lica──它们将完全取代用于 LLM خدمة HPA──

### ماذا تفعل ؟

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### إزالة الملفات المُزقة/إزالة الملفات المُزقة ستجعل كل شيء أكثر تعقيداً

إذا قمت بتمرير إعدادات المقبلات المفصلة (مرحلة 17 · 17) ، سيكون لديك نوعان من الأجزاء، ويكون لديهم اثنين من أشكال التوسع المختلفة: إعدادات المقبلات على أساس قوة التوسع المرتبة، إعدادات الإعدادات على أساس ضغط الاحتفاظ الكهربائي.`Services`لا تحاول وضع HPA منفصلة في المواجهة بينهما

### البداية الباردة هنا أيضاً مهمة

التخفيف من بدء البرد ((مرحلة 17 · 10) هو نقطة إمدادات الوقت لتصبح المستخدم مرئي تأخير مكان── 45-60 ثانية قبل الحرارة، زائد 20GB تحميل النموذج، إعادة إضافة المحرك init، يعني من الصفر`min_workers=1`), أو في التطبيقات استخدام النمط المودال للتفتيش.

### يجب أن تتذكر الرقم

- كاربينتر 节点供应: حوالي 45-60s، مقابل كلاستر Autoscaler 约 90-120s ((GPU 节点) 
- المخطط KAI 防止部分分配浪费  7 من 8 陷──
- `DCGM_FI_DEV_GPU_UTIL`作为 HPA 信号:坏掉的; استخدام قوة التسلسلة أو استخدام KV 率。
- كاربنتر `WhenEmptyOrUnderutilized`:终止正在运行GPU工作──对推断 使用 `WhenEmpty + consolidateAfter: 1h`.


```figure
autoscaling
```

## استخدمها
`code/main.py`في عبء عمل GPU انفجر 上模拟一个三层自动规模器──比较 ساذج HPA(دورة الالتزام) 、排队-عمق HPA 和 KAI-gang-scheduled scaling──报告未满足请求、idle-GPU 分钟数和复合分数──

## 交付 it
本课会生成 `outputs/skill-gpu-autoscaler-plan.md` أعطى طوبولوجيا المجموعة  شكل عبء العمل و SLO، فإنه سوف تصميم ثلاثية مستويات الحجم الذاتي 

## التدريب
1. 运行 `code/main.py`في عبء العمل المفاجئ تحت، دورة العمل الباطلة HPA سوف تفقد عدد طلبات HPA عمق الصف يمكن أن تتواصل؟ الفرق من أين؟
2. لـ واحد في H100 SXM5 上服务 للاما 3.3 70B FP8 مجموعة  تصميم كاربنتر NodePool‬ 指定 `capacity-type`.`disruption.consolidationPolicy`.`consolidateAfter`، و أيضا جعل غير GPU عبء العمل غير قادر على ضبط إلى هذه العقود على التلوث.
3. تقرير فريقك التنفيذ في انتظار، لأن GPU متاح ولكن لا يمكن ضبطها ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
4. لقطة إعداد المقبلات المفصلة  اختيار قطعة إعدادات السيارات 信号,并为 فك القنبلة 选择另一个不同信号──说明两者理由──
5. 计算 `WhenEmptyOrUnderutilized`في حالة التكلفة على خدمة 24x7: في هذه الخدمة في المتوسط 60 مرة في اليوم حدث انخفاض الطلبات، و P99 TTFT > 10s:

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes 节点 autoscaler；亚分钟级供给 |
| Cluster Autoscaler | "the old scaler" | Kubernetes 节点 autoscaler 的前身；更慢，基于 group |
| KAI Scheduler | "the GPU scheduler" | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | "all or nothing" | 原子化调度 N 个 pod，或全部延后 |
| Topology awareness | "rack-aware" | 基于 NVLink/IB/rack placement 放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric；不是 LLM 的 scaling signal |
| Queue depth | "waiting requests" | 对 prefill-bound scaling 正确的 HPA 信号 |
| KV cache utilization | "memory pressure" | 对 decode-bound scaling 正确的 HPA 信号 |
| Consolidation | "Karpenter consolidation" | 终止节点以迁移到更便宜的 instance type |
| `WhenEmpty + 1h` | "safe consolidation" | 不驱逐正在运行 GPU job 的策略 |

## 延伸阅读
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 设计文档和配置示例──
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) سياسة التوحيد 语义和 GPU-secure 默认值。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) إشارات تنمية دينامو المخططين
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html) راي 集成模式──
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) إدارة الإرشادات الخاصة بـ "كوبرنيتس"
- [llm-d GitHub](https://github.com/llm-d/llm-d) متغيرات الحمل العاملة المتعددة الذاتية 设计。
