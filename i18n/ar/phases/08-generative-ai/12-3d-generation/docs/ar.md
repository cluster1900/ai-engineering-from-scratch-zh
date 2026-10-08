# الجيل الثلاثي الأبعاد

> 3D هو 2D إلى 3D 借力最强的模式──2023 سنة الاختراق هو 3D غوسيان Splating──2024-2026 سنة من التقدم في التوليد، يتم تعديلها على انتشار متعدد الرؤية + إعادة بناء 3D، من عرض واحد أو صورة تولد الأشياء والمشهد──

**Type:** Learn
**Languages:** Python
**先修要求:**المرحلة 4 (الرؤية) ، المرحلة 8 · 07 (الانتشار المتخفف)
**Time:** ~45 minutes

## 问题

3D  محتوى صعب التعامل:

- **表示。**شبكات، سحابة نقطة، شبكات الصوت، حقل المسافة الموقعة (SDFs) ، حقل الإشعاع العصبي (NeRFs) ، غوسيانات ثلاثية الأبعاد.
- **数据稀缺。**ImageNet لديها 14M 张图像──最大的干净 3D 数据集(Objaverse-XL, 2023) لديها حوالي 10M 个物体, منها الكثيرة من نوعية أقل──
- **内存。**شبكة 5123 صوتية لديها 128 مليون صوتية؛ منظر قابل للاستخدام NeRF  بحاجة إلى 1 مليون عينات / أشعة.
- **监督。**بالنسبة للصور الثنائية الأبعاد، لديك بكسلات. بالنسبة للصور الثلاثية الأبعاد، عادة ما تكون لديك عدد قليل من الرؤى الثنائية الأبعاد، ويجب أن ترتفع إلى ثلاثية الأبعاد.

2026 سنة كومة ضع هذين المشكلين منفصلة. الخطوة الأولى، باستخدام نموذج Diffusion 生成 *2D متعدد الرؤية الصور *♦ الخطوة الثانية، ضع هذه الصور لتصميم طريقة *3D تمثيل *♦ عادة ما يكون غوسيان splatting)♦

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### 3D غوسيان سبلاتينغ (Kerbl et al., 2023)

ضع المشهد يعبر عن حوالي 1M 个 3D غوسيان 组成的云──每个有 59 个参数:位置 (3) ∙covariance (6,或四 4 + 尺度 3) ∙opacity (1) ‧spherical-harmonics color(درجة 3 时为 48,درجة 0 时为 3) 

التنسيق = التنبيه + التركيب الألفي──快(4090 上 1080p 约 100 fps)──可微──通过 Gradient Descent على الصور الحقيقية الأرضية 拟合──一个场景可在消费级 GPU 上用5-30 分钟完成拟合──

اثنين من 2023-2024 创新:
- **Generative Gaussian splats。**LGM、LRM、InstantMesh وغيرها من النماذج مباشرة من واحد أو عدة صور التنبؤ غوسيان سحابة
- **4D Gaussian Splatting。**مع معدلات لكل إطار من الجوسي، تستخدم في المشهد الحركي.

### التوزيع متعدد الرؤى

التنسيق الدقيق واحد قبل التدريب الصورة نموذج التوزيع، مما يسمح له بتوليد العديد من المواقف المتطابقة من نفس الكائن من خلال النص أو صورة واحدة. زيرو123 (Liu et al., 2023) ، MVDream (Shi et al., 2023) ، SV3D (استقرار، 2024) ، CAT3D (غوغل، 2024) ، عادة ما تنتج 4-16 مشاهدة حول الكائن ، مرة أخرى من خلال غوسيان سلايتينغ أو NeRF رفع إلى 3D.

### خطوط الأنابيب من نص إلى ثلاثية الأبعاد

| Model | Input | Output | Time |
|-------|-------|--------|------|
| DreamFusion (2022) | text | NeRF via SDS | 每个 asset ~1 小时 |
| Magic3D | text | mesh + texture | ~40 分钟 |
| Shap-E (OpenAI, 2023) | text | implicit 3D | ~1 分钟 |
| SJC / ProlificDreamer | text | NeRF / mesh | ~30 分钟 |
| LRM (Meta, 2023) | image | triplane | ~5 秒 |
| InstantMesh (2024) | image | mesh | ~10 秒 |
| SV3D (Stability, 2024) | image | novel views | ~2 分钟 |
| CAT3D (Google, 2024) | 1-64 images | 3D NeRF | ~1 分钟 |
| TripoSR (2024) | image | mesh | ~1 秒 |
| Meshy 4 (2025) | text + image | PBR mesh | ~30 秒 |
| Rodin Gen-1.5 (2025) | text + image | PBR mesh | ~60 秒 |
| Tencent Hunyuan3D 2.0 (2025) | image | mesh | ~30 秒 |

2025-2026 方向: تناسب محركات اللعبة 、带 PBR مواد النماذج مباشرة من النص إلى الشبكة── بالنسبة للأشياء العامة، انتشار المشاهدة المتعددة 中间步骤 لا يزال أفضل تكوين للإظهار──

### (نيرف)

حقل الإشعاع العصبي (ميلدنهول وآخرون، 2020)。`(x, y, z, view direction)`و لا يخرج`(color, density)` من خلال الأشعة 积分进行 rendering. 质量上优于基于网的小说视觉合成,但 render 速度慢 100-1000 倍.


```figure
v4-3d-multiview
```

## بناءها

`code/main.py`实现 a玩具版 2D غوسيان splating 拟合:把一个合成目标图像(平滑梯度) تعبيرها إلى 2D غوسيان splats 的和──通过 Gradient Descent 优化位置、颜色 和 覆盖,以匹配目标──你会看到两个核心操作:前进 render(splat + ألفا- المركب) و通过 Gradient Descent 拟合──

### 步骤 1: 2D غوسيان المزق

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### الخطوة الثانية: إجراء التطهير من خلال المواقع المتضافة

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

الفا-مكونات. إصدارنا الثنائي الأبعاد للعب فقط يبحث عن و.

### 步骤 3: استخدام التراجع التدريجي 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## فخ

- **View inconsistency。**إذا كنت تُنتج بشكل مستقل 4 مشاهد، بينما لا تتوافق في الحكم على بنية الكائن، فإن 3D 拟合会变模糊──修复: استخدام مع الاهتمام المشترك انتشار متعدد الرؤى──
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一侧――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M spots 并过拟合──Densification + pruning heuristics(من 3D-GS 原论文) 是必要的──
- **Topology issues。**من الشبكات المضطربة للماطاع (SDFs) عادة ما يكون لها ثقوب أو التقاطعات الذاتية.
- **训练数据许可。**رخصة Objaverse 混杂; استخدام تجاري من النموذج إلى النموذج.

## استخدمها

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

بالنسبة للعبة أو التجارة الإلكترونية في خط الأنابيب الإصدارات 3D: Meshy 4 أو Rodin Gen-1.5 输出可直接进入 Unity / Unreal 的 PBR Mesh──

## 交付 it

保存 `outputs/skill-3d-pipeline.md`موهبة 接收一个3D Brief(إدخال: نص / صورة واحدة / صور قليلة؛إخراج: شبكة / شقق / NeRF؛استخدام: عرض / لعبة / VR) ،并输出:بيبلينة(الانتشار متعدد المشاهد + تناسب، أو نموذج شبكة مباشرة)

## التدريب

1. **Easy。**4 16 64 غوسيان 运行 `code/main.py` تقرير النهائي MSE مقابل الهدف
2. **Medium。**扩展为颜色 غوسيان (RGB) ▽确认重建匹配目标颜色模式──
3. **Hard。**استخدام gsplat أو Nerfstudio، من 50 صورة التقاط 重建真实物体──報告適合時間 和持久的 views 上的最终 SSIM──

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| 3D Gaussian Splatting | "3DGS" | 把场景作为 3D Gaussians 的 cloud；可微的 alpha-composite render。 |
| NeRF | "Neural radiance field" | 在 3D point 输出 color + density 的 MLP；通过 ray integration render。 |
| Triplane | "Three 2-D planes" | 把 3D 分解成三个 2-D axis-aligned feature grids；比 volumetric 更便宜。 |
| SDS | "Score distillation sampling" | 使用 2D-diffusion score 作为 pseudo-Gradient 来训练 3D model。 |
| Multi-view diffusion | "Many views at once" | 输出一批一致 camera views 的 Diffusion model。 |
| PBR | "Physically-based rendering" | 具有 albedo、roughness、metallic、normal channels 的 material。 |
| Densification | "Grow splats" | 3DGS 训练 heuristic：在高 Gradient 区域 split / clone splats。 |

## 生产备注:3D لا يوجد تحتة مشتركة

不同于图像(لاتينت difusion + DiT) 和视频(Spaceotemporal DiT),2026 年的3D 还没有单一主导运行时间──生产决策树会按代表分叉:

- **NeRF / triplane。**الإستدلال هو تشكيل الأشعة + كل عينة واحدة MLP إلى الأمام.
- **Multi-view diffusion + LRM reconstruction。**المرحلة 1 ((متعدد الرؤية ديت) هو ودرس 07 一样的 خادم التوزيع. المرحلة 2 ((LRM محول) هو على الرؤى مرة واحدة إلى الأمام.
- **SDS / DreamFusion。**تحسين الأصول، ليس الاستنتاجات، بل إنشاء وظائف، وليس معالج الطلبات.

بالنسبة لمعظم منتجات 2026 ، فإن الجواب الصحيح هو على الطلب تشغيل نموذج انتشار متعدد المشاهد ، إعادة بناء التطور إلى 3DGS ،并خدم 3DGS باستخدام المشاهدة في الوقت الحقيقي── هذا سيفرز عبء العمل 清晰拆分 إلى خادم GPU-inference(快) ومتحسن خارجي(慢) ‬

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) نيرف
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079) 3DGS‬
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) SDS‬
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) صفر123‬
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) انتشار متعدد الرؤى。
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314) CAT3D
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d) SV3D
