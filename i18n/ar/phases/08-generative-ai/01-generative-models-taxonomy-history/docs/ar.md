# النماذج التوليدية  分类法与历史

> كل نموذج صورة، نموذج نص، نموذج فيديو، نموذج 3D، ينتمي إلى واحدة من خمس فئات.

**类型:**學习
**语言:**بايثون
**先修要求:**المرحلة 2 (أساسيات المعلمين) ، المرحلة 3 (قاعدة التعلم العميق) ، المرحلة 7 · 14 (المحولات)
**时间:**45 دقيقة

## 问题

النموذج التوليدي يفعل شيئاً واحداً: يُحدد من توزيع غير معروف`p_data(x)`抽取的训练样本,输出看起来像来自同样的分布的新样本──人脸、句子、MIDI 文件、蛋白质结构如果你眼看,它们都是同样的问题──

الصعوبة في ذلك`p_data`يوجد في مساحة ذات ملايين الأبعاد ((( صورة RGB 512x512  صورة حوالي 786k 维) ، النموذج يقع داخل هذا المجال على مجموعة متنوعة ضئيلة ، بينما قد تكون لديك 10M فقط من النموذجات。 كثافة طلب الحل العنيف هو لا أمل فيه。 كل نموذج تولدي هو في تحويل مشكلة واحدة إلى مشكلة أخرى غير صعبة قليلاً。

في السنوات الـ 12 الماضية، كانت هناك خمس عائلات على قيد الحياة. فهم كل عائلة ما فعلت، سوف تخبرك لماذا نجحت في بعض المهام، ولماذا ستنهار في المهام الأخرى.

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**ستعمل`log p(x)`写成一个你真的能计算的求和──模型 (بيكسلCNN, WaveNet, GPT) سوف `p(x) = ∏ p(x_i | x_<i)`因式分解──تطبيع التدفقات (NVP الحقيقي، ضوء) `p(x)`构成一个简单基础 分布的可逆变换――优点:精确概率,干净的训练 Loss──缺点:自动退行 推理是顺序的(长序列会慢),流动 需要可逆架构(架构限制很强)。

**2. Explicit density, approximate。**من هنا`log p(x)`(ELBO)并优化这个界限──VAEs (Kingma 2013) 使用带变化后的编码-decoder──Diffusion models (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──Diffusion 是 2026 年图像、视频和3D 的主导脊柱──

**3. Implicit density。**قفز تماماً فوق الكثافة تعلم مولد نموذج`G(z)`و من يُحكم على التمييز`D(x)`GANs (Goodfellow 2014) ――推理很快(مرة واحدة إلى الأمام ، ولكن عملية التدريب خرجت من مكانة غير مستقرة── حتى في عام 2026 ، ستايلجان 1/2/3 في مجال التصوير الصوير في المجال الثابت (((إنسان وجوه وغرفة نوم) على ما يزال حالة الفن‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**4. Score-based / continuous-time。**直接学习 سجل كثافة السجلات `∇_x log p(x)`(نقطة) ――Song & Ermon (2019) 表明得分匹配 将扩散 推广为一个SDE──流程匹配 (Lipman 2023) 是 2024-2026 年热点:无需模拟的训练、更直的路径、比 DDPM 快 4-10 倍的采样──稳定扩散 3、Flux、AudioCraft 2 都使用流程匹配──

**5. 基于 Token 的离散 codes 上的 autoregressive。**استخدام VQ-VAE أو الكمياتية المتبقية سوف يتم ضغط البيانات عالية إلى فئة أقصر من الاختراق رموز تسلسل ، ثم استخدام Transformer لسلسلة رموز 建模.

## 简史

| 年份 | 模型 | 为什么重要 |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | 第一个拥有可用训练 Loss 的 deep generative model。 |
| 2014 | GAN (Goodfellow) | Implicit density，没有 likelihood，却能产生惊人锐利的样本。 |
| 2015 | DRAW, PixelCNN | 顺序图像生成。 |
| 2017 | Glow, RealNVP | 可逆 flows；通过 depth 获得精确 likelihood。 |
| 2017 | Progressive GAN | 第一个 megapixel 人脸。 |
| 2019 | StyleGAN / StyleGAN2 | 在人脸这个单一领域中，photorealistic faces 依然很难被击败。 |
| 2020 | DDPM (Ho) | Diffusion 变得实用。 |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image 进入主流。 |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = 商品化。 |
| 2022 | ControlNet, LoRA | 对 pretrained diffusion 进行精细控制。 |
| 2023 | SDXL, Midjourney v5, Flow matching | 规模 + 更好的训练动态。 |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion；flow matching 胜出。 |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | 生产级视频。 |
| 2026 | Consistency + Rectified Flow | 从 diffusion backbones 进行一步采样。 |

## 五问分诊

عندما يظهر مقال جديد عن النموذج الجيني، قبل أن يبدأ القراءة، اجيب أولا على هذه الأسئلة الخمسة:

1. **建模的是什么？**البيكسلات المتخفية القطع القطع القطع القطع القطع القطع الثلاثية الدرجة الغاسيانات الشبكات الوجبات؟
2. **Density 是 explicit 还是 implicit？**هل كتبوا`log p(x)`- ماذا ؟
3. **Sampling：one-shot 还是 iterative？**تعبير متكرر يعني التفكير أبطأ؛ واحد-طلق عادة ما يعني خصم أو مستقطب.
4. **Conditioning：unconditional、class、text、image、pose？**هذا يحدد الخسارة و الممارسة
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**كل واحد لديه أساليب الفشل المعروفة ((انظر الدروس 14)

ستجيب على هذه الأسئلة الخمسة مرة أخرى في كل درس من هذه المرحلة.


```figure
autoencoder-bottleneck
```

## بناءها

كود هذا الدراسة هو نوع من الوسائل الخفيفة: استخدام ثلاث أساليب للعب: (كربن كثافة  جداول الهستوجرام، فضلا عن أقرب عينة GAN-ish مولد) من نموذج يناسب من خلال خليط 1-D من غوسيان، حتى يمكنك أن ترى في مشكلة يمكن الطباعة على شاشة واحدة على اختلافات الكثافة الصريحة مقابل الضمنية.

运行 `code/main.py`ستأخذ من خليط غوسي مزدوج و تقوم بتطبيق 2000 عينة

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

ملاحظة: السؤال الأول يسمح لك أن تسأل: هل هذا الأمر ممكن؟

## استخدمها

2026، أي عائلة تناسب أي مهمة؟

| 任务 | 最佳家族 | 原因 |
|------|-------------|-----|
| Photoreal faces，窄领域 | StyleGAN 2/3 | 仍然最锐利，推理最快。 |
| 通用 text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3。 |
| 快速 text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM。 |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling。 |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) 或 flow matching (AudioCraft 2) | 离散 tokens 扩展成本低。 |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS 用于重建，diffusion 用于 novel-view。 |
| Density estimation（不采样） | Flows | 唯一拥有精确 `log p(x)` 的家族。 |
| Simulation / physics | Flow matching, score SDE | 直线路径，平滑 Vector fields。 |

## 交付 it

保存为 `outputs/skill-model-chooser.md`.

هذه المهارة قبل وظيفة وصف ومخرج:(1) يجب استخدام أي عائلة،(2) ثلاثة خيارات مفتوحة و ثلاثة خيارات مضيفة ترتيب قائمة،(3) يجب عليك الاهتمام من وضع الفشل المحتمل، فضلا عن (4) 计算/时间预算──

## التدريب

1. **Easy。**على المنتجات الخمسة التالية، تحديد أسرته والعمود الفقري: صورة ChatGPT, منتصف الرحلة v7, سورة, طريق الجري Gen-3, المختبرات الحادية.
2. **Medium。**تصفح ثلاث أسئلة، تستخدم للتحقق من هذا التسارع في التكييف وارتفاع القرارات
3. **Hard。**选择一个你关心的领域 (例如: 蛋白质结构 CAD 分子轨迹)  للماڊل SOTA الحالي في هذا المجال 回答五问分诊,并勾勒一个更好的模型会改变什么──

## 关键术语

| 术语 | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Generative model | “它会生成新东西” | 学习 `p_data(x)` 的 sampler，可选地暴露 `log p(x)`。 |
| Explicit density | “你可以计算它” | 模型提供 closed-form 或 tractable 的 `log p(x)`。 |
| Implicit density | “GAN-style” | 只有 sampler——无法计算给定点的 `p(x)`。 |
| ELBO | “Evidence lower bound” | `log p(x)` 的一个 tractable 下界；VAEs 和 diffusion 会优化它。 |
| Score | “log-density 的 Gradient” | `∇_x log p(x)`；diffusion 和 SDE models 学习这个 field。 |
| Manifold hypothesis | “数据存在于一个表面上” | 高维数据集中在低维 manifold 上；这就是 dimensionality reduction 有效的原因。 |
| Autoregressive | “预测下一个片段” | 将 joint 因式分解为 conditionals 的乘积。 |
| Latent | “压缩 code” | 一种低维表示，decoder 可以从中重建输入。 |

## 生产备注: خمسة أسرة، خمسة أشكال

كل عائلة تتضمن إضافة إلى خادم استنتاج مختلف 成本曲线──إنتاج إضافة 文献将 LLM 推理框定为预填 +解码;同样分解也适用于这里:

- **Autoregressive（类别 1 和 5）。**顺序 decode 主导 latency;KV-cache、استمرار البشيشون واكتشافات المضاربة يمكن تطبيقها مباشرة
- **VAE / diffusion / flow-matching（类别 2 和 4）。**هذا ليس هناك تعريف لـ LLM  المعنى.`num_steps × step_cost`و`step_cost`هو في كامل حل غامض 上次 محول أو U-Net إلى الأمام.
- **GAN（类别 3）。**لم يكن هناك جدول، لم يكن هناك تخزينات كيف.

عندما ترى في المقالة المقتطفة أسرع من التوزيع، ترجمة إلى أقل خطوات × تكلفة خطوات مماثلة × تكلفة خطوات مماثلة × تكلفة خطوات أرخص.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) غان 论文。
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 论文。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) ديبم 论文。
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为 SDE انتشارها
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) التدفق المماثل 论文。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) انتشار ثابت 3。
