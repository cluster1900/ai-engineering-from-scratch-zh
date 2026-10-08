# 评估  FID  CLIP Score  تفضيلات البشر

> كل قائمة نموذجية تم إنشاؤها تستشهد بنتيجة FID ∙ CLIP، وكذلك نسبة الفوز من المنتجات الإنسانية المفضلة. كل رقم لديه نمط فاشل يستخدمه الباحثون. إذا لم تكن تعرف هذه النماط الفاشلة، فلن تستطيع التمييز بين التحسينات الحقيقية والتنمية.

**类型:**بناء
**语言:**بايثون
**先修:**المرحلة 8 · 01 (التصنيف) ، المرحلة 2 · 04 (متريكات التقييم)
**时间:**45 دقيقة

## 问题

النماذج المنتجة عادة ما تتم بناء على * النموذج الجودة * و * الشروط التابعة * للحكم على المثالين. كلا من هذه النماذج لا توجد مقياس مغلق. يجب أن يكون نموذجك يرمز 10،000 صورة ؛ يجب أن يكون هناك شيء ما يفرزها. يجب عليك أيضًا أن تصدق أن هذه الرقم يمكن أن تتراوح بين عائلة النماذج ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓                                                                                            

- **FID (Fréchet Inception Distance)。**في الفضاء الصناعي للشبكة، فاصل بين التوزيع الحقيقي وتوزيع المنتج.
- **CLIP score。**生成图像的Clip-image Embedding与快速的Clip-text Embedding 之间的共数相似性──越高越好──衡量快速 遵循度──
- **人类偏好。**في نفس اللحظة 上让两个模型正面对决,让人类(或 GPT-4 级模型) اختيار أفضل واحد,再聚合成 Elo score──

سترى أيضا: IS(نقطة البدء، أساسا قد تم إيقافها) ✓KID、CMMD、ImageReward、PickScore、HPSv2、MJHQ-30k── كل واحد من هذه النقاط قام بتعديل نقطة فاشلة من المعلم السابقة‬

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  样本质量

هوسل وآخرون (2017):

1. 为 N 张真实图像和 N 张生成图像提取 إبتدائي-v3 ميزات (2048-D) ⋅
2. لكل مجموعة يُحْتَمَلُ واحد غوسيان: حساب المتوسط`μ_r, μ_g`و التباين`Σ_r, Σ_g`.
3. (FID = )`||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`.

解释:特征空间中两个多变量 غوسيان 间的频率距离──越低 = 分布越相似──

失效模式:
- **小 N 时有偏。**FID هو على التوزيع الخاصية لتحديد متوسط مربع 计算,小 N 会低估覆变,给出假的低 FID──始终使用 N ≥ 10,000──
- **依赖 Inception。**إنشاء-v3 訓練于 ImageNet──远离 ImageNet's domain ((人脸、艺术、文字图像) سوف تولد FID── استخدام مستخرجات ميزات في مجال معين──
- **刷分。**过拟 启动前可以在没有视觉质量提升的情况下得到低 FID──使用CMMD(见下文)来对抗它──

### درجة CLIP  prompt 遵循度

رادفورد وغيرهم (2021):

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

على 30K 张 توليد الصور الحصول على متوسط  الحصول على حجم يمكن مقارنة بين النماذج.

失效模式:
- **CLIP 自身的盲点。**تمتلك الموديل في CLIP نمطاً جيداً، ولكن لم يتبع الأمر بشكل حقيقي.
- **短 prompt 偏差。**短 prompt 在野外有更多 CLIP-image 匹配──长 prompt 的 CLIP score 会机械性降低──
- **prompt 刷分。**في الفور، إضافة "الجودة العالية، 4K، اللوحة الرائعة" سوف يرفع درجة CLIP، ولكن لن تحسن الرسومات المرتبطة.

CMMD (Jayasumana et al., 2024) 修复了一些问题: استخدام ميزات CLIP بدلا من البداية، استخدام أقصى متوسط التناقض بدلا من Fréchet.

### الناس يفضلون الحقيقة

选择一组 prompt──用模型 A 和模型 B 生成──把成对结果展示给人类(或强 LLM قاضي)──将胜负聚合成 Elo 或 Bradley-Terry score── بنچ مارك:

- **PartiPrompts (Google)**:1,600 个多样化 prompt,12 个类别──
- **HPSv2**:107k 个人类标注,广泛使用作自动化代理──
- **ImageReward**-مُرخص من "ميت"
- **PickScore**: على أساس إختيار إختيار 2.6M تفضيلات 訓練──
- **Chatbot-Arena-style image arenas**:https://imagearena.ai/وبرنامج آخر

失效模式:
- **judge 方差。**لا يختلف تفضيل الخبراء وغير الخبراء.
- **prompt 分布。**精挑细选的快速会偏向某一家──始终记录清楚──
- **LLM-judge reward hacking。**جبت-4-القاضي سوف تكون جميلة ولكن خطأ النتائج الخادعة

## 组合 استخدام

تقرير تقييم درجة الناتج يجب أن يحتوي على:

1. على 10-30k 个样本,针对 تمتد
2. في نفس المجموعة من العينات ومعها على الفور 上计算 CLIP score / CMMD(التبع)
3. في النسخة السابقة من النموذج
4. 失效模式分析:随机抽取 50 输出,标记已知问题(手部结构、文字染、对象数量一致性)

أي مؤشر واحد هو كذبة.


```figure
gx-fid-distributions
```

## 动手构建

`code/main.py`في "مقاطع الميزات" المكوّنة لتحقيق FID 类 CLIP-score 和 Elo 聚合 (((نستخدم 4D Vector 作为替代的Inception features)  سترى:

- 小 N 和大 N 上的 FID 计算,也就是偏差──
- سوف تميز شبيهة الكوسين بين البحيرة كـ "نسبة CLIP"
- من قاعدة تحديث إيلو من تصميمات التيار المفضل

### الخطوة الأولى:

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 步骤 2: CLIP 风格 من تشابه الكويسين

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### الخطوة الثالثة: الـ Elo 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**في N=10k 以下, هذا الإطلاق غير موثوق.
- **跨分辨率比较 FID。**في البداية 299 × 299 تحويل حجم سوف تغير التوزيع الخاصه.
- **只报告一个 seed。**على الأقل تنشأ 3 بذور
- **通过 negative prompts 抬高 CLIP score。**بعض خطوط الأنابيب ستمر عبر المكالمة لتعزيز CLIP.
- **prompt 重叠导致 Elo 偏差。**إذا كان هناك نموذجين في التدريبين يظهرون على كل حال على نقطة التأثير، فلن يكون هناك أي معنى.
- **人类 eval 的付费众包偏斜。**المنتج  MTurk 标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## استخدمها

بروتوكول تقييم الإنتاج لعام 2026:

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

أربعة أسماك في نفس التقرير = 主张── أي واحد منفرد واحد = 营销──

## 交付

保存 `outputs/skill-eval-report.md`موهبة في تلقي نقطة تفتيش نموذج جديدة + خط أساسي، ومصدر خطة تقييم كاملة: نموذج الكمية ▌معيارات ▌فشل في النموذج ▌معايير النووية‬

## التدريب

1. **Easy.**运行 `code/main.py` تقييم N=100 مع N=1000 في نفس التوزيع المكوّن  تقييم حجم الاختلاف
2. **Medium.**基于合成 CLIP-style features 实现 CMMD 公式见 Jayasumana et al., 2024)  مقارنة مع FID
3. **Hard.**复现 HPSv2 设置:从 Pick-a-Pic 的一个子集中取 1000 个图像-prompt زوج,基于偏好细调,一个小型CLIP-based scorer,并测量它与持久的集合的一致性──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FID | "Fréchet Inception Distance" | 对真实与生成 Inception features 拟合 Gaussian 后的 Fréchet distance。 |
| CLIP score | "Text-image similarity" | CLIP image 与 text Embeddings 之间的 cosine similarity。 |
| CMMD | "FID's replacement" | CLIP-feature MMD；偏差更小，无 Gaussian assumption。 |
| IS | "Inception score" | Exp KL(p(y|x) || p(y))；在现代模型上相关性差，已退役。 |
| HPSv2 / ImageReward / PickScore | "Learned preference proxies" | 在人类偏好上训练的小模型；用作自动 judge。 |
| Elo | "Chess rating" | 成对胜负的 Bradley-Terry 聚合。 |
| PartiPrompts | "The benchmark prompt set" | Google 策划的 1,600 个 prompt，覆盖 12 个类别。 |
| FD-DINO | "Self-sup replacement" | 使用 DINOv2 features 的 FD；更适合 ImageNet 之外的领域。 |

## 生产注记: التقييم و كذلك هو إستنتاج عبء العمل

في 10k نموذج على متن FID يعني إنتاج 10k 张图像. بالنسبة لمجموعة واحد L4 فوق 10242 50 خطوة SDXL قاعدة، وهذا حوالي 11 ساعات من استنتاج طلب واحد.

- **尽力 batch，忘掉 latency。**تقييم غير متصل = إجراء البطاقات الثابتة على أكبر حجم من القوة في الذاكرة.`num_images_per_prompt=8`调用 `pipe(...).images`, ساعة الحائط مقارنة بطلب واحد 快 4-6 ×
- **缓存真实 features。**لاستخراج ميزة إنشاء (FID) أو CLIP (CLIP-score، CMMD) فقط运行*一次*,并存储为`.npz`لا تجعل كل تقييم يعيد حسابه

对于CI / رجعة البوابات: كل PR 在 500-نموذج 子集上运行 FID + CLIP درجة(~30 دقيقة); 每晚运行完整 10k FID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 论文。
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD‬
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) CLIP‬
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2。
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) ImageReward‬
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) مشاركات
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) مسح وضع الفشل
