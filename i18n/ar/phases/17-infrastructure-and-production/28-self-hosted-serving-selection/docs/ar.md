# خدمة مضيفة ذاتية 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> 2026 سنة، أربعة محركات مدرجة استنتاجات التصرف الذاتي.**llama.cpp**في CPU 上最快  النموذج 支持最广, على الكميات والخيوط 拥有完全控制──**Ollama**هو تطوير خطة التثبيت على حسابات ، مقارنة مع llama.cpp 慢約15-30% ((Go + CGo + HTTP التسلسل) ، في الطبقة الإنتاج تحميل 差 3x‬**TGI 于 2025 年 12 月 11 日进入维护模式** فقط إصلاحات الحذاء، وتسريع الناتج الخام مقارنة بـ 10٪ من vLLM، ولكن في الماضي في مجال الملاحظة و HF إيكولوجيات التكامل عادة ما تكون على مستوى الأعلى.**vLLM**هو عامة الإنتاج المُختبرة  v0.15.1(2026 年 2 月) 新增 PyTorch 2.10、RTX Blackwell SM120、H200 تحسين‬**SGLang**هو وكالة 多轮 / مقدمة ثقيلة 专家  生产中有 400,000+ GPUs(xAI、LinkedIn、Cursor、Oracle、GCP、Azure、AWS) 硬件约束: فقط CPU → فقط能使用 llama.cpp。AMD /非 NVIDIA → فقط能使用 vLLM(TRT-LLM 被 NVIDIA 锁定) 2026 خط الأنابيب 模式:dev = Ollama,staging = llama.cpp,prod = vLLM SGLang。程全或使用相同 GGUF/HF وزرات。

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## 學习目标
- في given hardware ((CPU / AMD / NVIDIA Hopper / Blackwell) √ حجم ((1 个用户 / 100 / 10,000) وعبء العمل ((رداء عام / وكيل / سياق طويل) وقت اختيار محرك واحد‬
- ويقول: "أينما ستصبح المشاريع الجديدة في إطار التنمية العامة للطاقة الذرية في عام 2026؟
- 描述全程使用相同 GGUF أو HF وزنات ‬
-  شرح لماذا  فقط CPU  سيجب على استخدام llama.cpp، و AMD  سيستبعد TRT-LLM‬

## 问题
فريقك بدأ مشروع جديد للدراسة في مجال التعليم الذاتي. يقول مهندس واحد بـ Ollama، يقول آخر بـ VLLM، يقول الثالث هل TGI غير مفتوحة؟

في عام 2026، اختيار الأشجار مهم: أولا النظر إلى الأجهزة، ثم النظر إلى الحجم، وثالث النظر إلى الحملة.

## 概念
### 五个引擎

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件 قرارات الأولوية

**仅 CPU**لا يوجد محرك آخر في المركبة المركزية لديه قوة تنافسية

**AMD GPU**• vLLM(AMD ROCm 支持)。SGLang 也能用──TRT-LLM 被 NVIDIA 锁定,所以排除──

**NVIDIA Hopper (H100 / H200)**→ vLLM أو SGLang أو TRT-LLM──三者都是顶级──

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM هو الناتج 领先者(Phase 17 · 07)。vLLM 和 SGLang 紧随其后。

**Apple Silicon (M-series)**تم تجميعها على الـ (Ollama)

### حجم القرارات

**1 个用户 / local dev**→ Ollama。一条命令,数秒内 أول علامة。

**10-100 个用户 / 小团队**→ vLLM واحد-GPU

**100-10k 个用户 / production**→ مجموعة إنتاج vLLM ((مرحلة 17 · 18) أو SGLang。

**10k+ 个用户 / enterprise**→ مجموعة إنتاج المجموعة المختلفة + المفصلة ((مرحلة 17 · 17) + LMCache(مرحلة 17 · 18)。

### الحمل الثالث

**General chat / Q&A**في المشهد الواسع الاعتبار

**Agentic multi-turn（tools、planning、memory）**→ SGLang 的 RadixAttention(مرحلة 17 · 06)占优。

**带有大量 prefix reuse 的 RAG**→ SGLang。

**Code generation**→ vLLM 可以;SGLang 在缓存 上略好。

**Long context (128K+)**→ vLLM + prefill جزئية؛SGLang + KV مستوى

### تجي 维护陷

تعاطف الوجه TGI 于 2025 年 12 月 11 日进入维护模式  之后只做bug fixes──过去:顶级可观性、同类最佳 HF 生态系统集成(نموذج البطاقات、安全工具),原口 略落后于vLLM──

على المشاريع الجديدة لعام 2026: الامتناع عن التنفيذ التنفيذي للخدمات التنفيذية. يمكن أن يستمر التنفيذ الحالي للتنفيذ التنفيذي للخدمات التنفيذية، ولكن يجب أن ينتقل في النهاية.

### خط الأنابيب 模式

Dev(Ollama)→ التجهيز(llama.cpp)→ prod(vLLM)。全程使用相同的GGUF或HF重量──工程师在笔记本上快速代; التجهيز 镜像生产量化;prod 是服务 目标──

### Ollama 注意事项

أولاما  مناسبة جداً للديف. انها لا تناسب الإنتاج المشترك: الذهاب إلى HTTP التسلسل سوف تزيد من الإفراج، إدارة العملات أكثر من vLLM 更简单,OpenTelemetry 支持滞后.

### أنفس الإدارة مقابل الإدارة هو قرار آخر

المرحلة 17 · 01(الهيبرسكاليرات المدارة) 、· 02(المواقع المُناسبة) تغطي المدارة。 本课假设你已经决定自托管──自托管的理由:مقام البيانات、تحسينات مخصصة、التكلفة الكلية بعد التوسع٬ نموذج النطاق غير المفيد على خدمات التمويل──

### يجب أن تتذكر الرقم

- TGI 维护模式:2025 年 12 月 11 日。
- vLLM v0.15.1:2026 年 2 月;PyTorch 2.10;بلاكويل SM120 支持──
- SGLang 生产足迹: 400،000+ GPUs
- إنتاج أولاما 相对 llama.cpp 的差距:慢 15-30%;生产负载下 3x。


```figure
data-parallel
```

## استخدمها
`code/main.py`هو مشاة شجرة القرار: أعطينا الأجهزة + الحجم + عبء العمل ، اختيار محرك ومفسرة السبب.

## 交付 it
本课产出 `outputs/skill-engine-picker.md`                                                                                                                                                                                                                                                              

## التدريب
1. مع أجهزة / حجم / عبء العمل الخاص بك 运行 `code/main.py`هل المخرج يتوافق مع حسّك؟
2. إنّكِ تحتوي على 12 جانب H100 و 8 جانب MI300X AMD... ما هي المحركات؟ لماذا لا يمكن اختيار TRT-LLM؟
3. فريق يعتقد أن استخدام TGI في عام 2026، لأن هذا شيء مألوف لنا
4. أُلما ديف إلى vLLM prod:تكوين وتكوين ولاحظة
5. طول المقبلات P99 للمنتجات RAG هو 8K، ويعيش معدل استرداد المنتجات عالية جدا.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | “CPU 那个” | 最广 model 支持，CPU 上最快 |
| Ollama | “笔记本那个” | 一条命令安装，dev-grade throughput |
| TGI | “HF 的 serving” | 自 2025 年 12 月起维护模式 |
| vLLM | “默认选择” | 2026 年广泛生产 baseline |
| SGLang | “agentic 那个” | Prefix-heavy，RadixAttention |
| TRT-LLM | “NVIDIA 锁定” | Blackwell throughput 领先者，仅 NVIDIA |
| GGUF | “llama.cpp 格式” | Bundled K-quant variants |
| Production-stack | “vLLM K8s” | Phase 17 · 18 reference deployment |
| Pipeline pattern | “dev→stage→prod” | 同一 weights 上的 Ollama → llama.cpp → vLLM |

## 延伸阅读
- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) ملاحظات الإفراج
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
