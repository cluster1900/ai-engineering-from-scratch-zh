# إطار إعداد OpenAI وإطار السلامة الحدودية في DeepMind

> إطار إعداد OpenAI v2(4 月) أدخلت فئات البحث: الاستقلال الطويل المدى、التسجيل الذاتي والتكيف٬التنسيق الذاتي والتكيف٬التحقيق الذاتي والتحقيق الذاتي والتحقيق الذاتي والتحقيق الذاتي والتحقيق الذاتي، والتي تختلف عن الفئات المتتبعة٬ فئات المراقبة سوف تنشئ تقارير القدرات ومجموعات الاستشارات في مجال السلامة٬ ومراجعة FSF v3٬ من قبل مجموعة الاستشارات العميقة٬ 9 月، 2025، مستويات القدرة المتتبعة 于 2026  4 月 17 日加入) سوف تُدخل الذات الذاتية  ML مجال البحث والتطوير الذاتي والتكيف٬ML R&D المستوى 1                                                                                                                                                                                                                                                                                                                                

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## 问题

دراسة 19 قراءة دقيقة لسياسة التوسع من الأنثروبيك. هذه الدورة من خلال قراءة OpenAI و DeepMind's policies لتكمل المشهد الكامل. هذه المستندات الثلاث هي نفس النوع من المنتجات، ومعالجة نفس المسألة: المختبر الحدودي متى ينبغي أن تعليق أو الحد من نموذج؛ فهي تتجه على الفئة الصغيرة، كما أنها تتنقش في بعض المواقع المحددة الهامة.

趋同之处:三者都把长远自主权 标记为值得追踪的能力类别──三者都承认欺骗性行为(التزوير بالتوافق、الرمل) هو نوع محدد من风险──三者都有内部审查机构──分歧之处:OpenAI 将分类分为Tracked(强制缓解) 和Research(不自动触发)──DeepMind 将自主权 纳入两个领域,而不是单独命名──实验室将使用Tracked Research、Critical vs Moderate、Tier-1 vs Tier-2等名称;能力落落在哪个桶里,将在不同实验室产生不同的操作后果──

وضعها معاً هو ممارسة مفيدة. نفس القدرة في الأنثروبيك ربما تكون التخفيف الإلزامي، في OpenAI ربما تكون مراقبة ولكن لا تسبب، في DeepMind ربما تكون تتبع في مجال معين.

## 概念

### إطار إعداد OpenAI v2(2025 年 4 月)

结构:

- **Tracked Categories**: تطبيق تقارير القدرات (模型能做什么) + تقارير الحماية (已有哪些缓解措施)
- **Research Categories**: تجربة تتبع، ولكن لم يلتزم بعد بقدرة نموذجية لتنفيذ تدابير مكافحة محددة، بما في ذلك الحكم الذاتي على المدى الطويل، التخفيض الرملي، التكرار الذاتي والتكيف، تقويض الحماية،

في v2 من المفاتيح:فئات البحث لا تنشئ تلقائياً تدابير التخفيف.

### إطار السلامة الحدودية في DeepMind v3(2025 年 9 月; مستويات القدرة المتتبعة 于 2026 年 4 月 17 日加入)

结构:

- **Critical Capability Levels (CCLs)**: عبر خمسة مجالات القدرةقيمة:الكترونيات、البيولوجيات、ML البحث والتطوير、CBRN、المتحكمية(纳入ML R&D 和 Cyber)
- **Tracked Capability Levels**:2026 年 4 月加入额外粒度──具体例:ML R&D استقلالية المستوى 1 = 以 مقابل الأدوات البشرية + الذكاء الاصطناعي
- **Deceptive alignment monitoring**:明确承诺 على المراقبة الآلية على سوء استخدام الأدوات المثيرة

طريقة تعبير الذاتية مختلفة عن OpenAI. DeepMind 没有把 الذاتية保留为顶层领域; it was included in autonomy可能造成伤害领域.

### ثلاثة مشترك

- 内部 مجموعة الاستشارات الأمنية(分别命名为 انتروبيك SAG、OpenAI SAG、DeepMind اللجنة الداخلية)。高能力模型部署前进行审查──
- 明确提到 الاختلاف الخادع / التصفيق التزوير 是一类风险。
- 以声明的节奏产出持续性文档:أنثروپيك:خريطة الطريق للسلامة على الحدود، تقرير المخاطر،OpenAI: تقارير القدرات والضمانات، DeepMind:دورة تحديث المجلس الأوروبي للصحة والتنمية)。
- الاعتراف بأن الوقاية من المراقبة وحدها محدودة.

### هم من التفريقات

- **Anthropic**:v3.0 移除暂停承诺;AI R&D-4 عتبة هو تم تسميتها
- **OpenAI**:تتتبع مقابل البحث 拆分;فئات البحث (بما في ذلك الاستقلال على المدى الطويل) لن تتحرك بوابةها
- **DeepMind**:تحت إدراج الذاتية في مجالات أخرى؛تتتبع مستويات القدرة في 2026

### التعبير عن الرمل: قدرة محددة على تعقيد كل شخص

رملة البحث (模型在评估中策略性表现不佳) تقع في OpenAI من فئات البحث.

إذا كان نموذج في كيس الرمل في التقييم، فإن قدرة كل إطار سيتم تقليل قيمته. الإطار فقط في قياس فعال عندما فعال. وهذا هو السبب في أنه بالإضافة إلى التقييم الذاتي للمختبر، تحتاج أيضا إلى قياس خارجي.

### 政策阅读技能

- 定位: كل قدرة مهتمة بك يجب أن تجدها في السياسة.
-  分类: هل هو متابعة ((触发缓解措施) أم البحث ((متتبع ولكن لا ي触发) ؟
- 节奏: هل يتم تحديث جدول زمني الإعلانات، أم يتم تحديثها فقط بعد حدث معين؟
- 独立性: الاطلاع الخارجي مضطر أم قابل للاختيار؟ الأنثروبات مع أبوولو ومعهد السلامة الذكاء الاصطناعي الأمريكي 合作;OpenAI مع METR 合作;DeepMind يعتمد بشكل رئيسي على SAG الداخلي


```figure
a5-tracked-vs-research
```

## استخدمها

`code/main.py`تطبيق أداة صغيرة لتقديم القرارات. تم إعطاء قدرة على التحكم الذاتي. التنظيم الخادع. أتمتة البحث والتطوير. رفع الإنترنت.

## 交付 it

`outputs/skill-cross-policy-diff.md`استخدام ثلاثة إطار كإشارة، لقدرة محددة على إنتاج

## التدريب

1. 运行 `code/main.py` تأكيد إمكانية فحص المستندات المختلفة من خلال إصدار أداة مختلفة مع الاتفاق السياسي، على الأقل

2. 完整阅读 OpenAI Prepness Framework v2──识别每个研究类别──对每项,用一句话说明为什么它在研究而不是追踪──

3. 完整阅读 DeepMind FSF v3، فضلا عن مستويات القدرة المتتبعة في 4 أشهر عام 2026 更新──识别 ML R&D استقلالية مستوى 1 具体评估标准──你会如何从外部测量它?

4. تُعرض أسلحة الرمل في مجال البحوث في OpenAI. تصميم تقييم، يُضطر إلى كشف نموذج أسلحة الرمل في مجال الكشف عن قدرته الحقيقية.

5. 针对某项具体能力 (由你选择) 比较三项政策――说明你认为哪些政策的分类最严谨的,哪些最不严谨的――用源文本证明――

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/)إعلانات
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 完整文档──
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) إعلانات FSF v3
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) مستويات القدرة المتتبعة 增补。
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) إحصاءات المخاطر في إطار إطار إدارة الأمن المالية
