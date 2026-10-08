# ستايلجان

> معظم المولدات سوف تصل`z`في نفس الوقت، في كل طبقة، ستايليجان وضعها مفتوحة، أولا وضعها`z`映射到中间表示 `w`ثم عبر "أداين" في كل مستوى من مستويات القرار`w` هذا التغيير فتح الفضاء الخفية، و جعل الصور من الصور الفنية في فترة 7 سنوات أصبحت مشكلة حل

**类型：**الإنشاء
**语言：**بايثون
**前置要求：**المرحلة 8 · 03 (GANs) ، المرحلة 4 · 08 (تطبيع) ، المرحلة 3 · 07 (CNNs)
**时间：**45 دقيقة

## 问题

DCGAN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `z`映射成一张图像──`z`كل شيء يتحكم فيهم المظهر والضوء والصورة والصورة والصورة والظاهرة`z`في محور واحد يتحرك، كل شيء يتغير. لا يمكنك أن تطلب النموذج من نفس الشخص، مختلفة الموقف.

Karras et al. (2019, NVIDIA)  طرح: توقف把 `z`إرسال مباشرة إلى طبقات الحاويات`4×4×512`العجلة 作为网络输入──学习一个8层 MLP,把 `z ∈ Z → w ∈ W` من خلال * التطبيع المثلي التكيفي * (AdaIN) في كل تصميم`w`أولاً، تعديل كل خريطة خاصية، ثم استخدم`w`التنبؤات المثيرة للشكل والتحول.

النتيجة هي:`W`على الطابق العالي (الوضع ‬身份) مع الجزء (الضوء ‬اللون) هناك التركيز الواسع ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`w` كمطراز منخفضة الصلة،并使用图像B的 `w`كسلسلة عالية الصلابة، وبالتالي في تبادل بين اثنين من الصور الأساليب.

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`، واحد 8 مستويات MLP`Z = N(0, I)^512`.`W`ليس مضطرًا للعبث، بل يتعلم كيفية التكيف مع البيانات.

**Synthesis network。**من المتعلم إلى المتعلم`4×4×512`開始── كل بلوك في التوصل إلى القرار:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`△分辨率翻倍:4, 8, 16, 32, 64, 128, 256, 512, 1024‬

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

من بينهم`y_scale`和 `y_bias`من`w`التنبؤات المرتبطة بها. تتعادل على خريطة الميزات، ثم يتم إعادة إضافة النمط.

**逐层 noise。**إلى كل خريطة ميزة اضافة طريق واحد ضجيج غوسيان، و من خلال تعلمها من كل عامل طريق يتم تقليصها.

**Truncation trick。**الاستنتاج 时,采样 `z`, حساب`w = mapping(z)`ثم`w' = ŵ + ψ·(w - ŵ)`، من بينهم`ŵ`هو متوسط على العديد من النماذج`w`.`ψ < 1`مع العديد من التغييرات الجودة.`ψ ≈ 0.7`.

## ستايلجان 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

حتى عام 2026، ستايلجان 3  لا يزال هو المشهد التالي الاختيار المفرد: a) الصور الصغرى في مجال عالية FPS، b) تكييف النطاق القليل من اللقطات، c) تحرير القصة القصيرة على الموقع، c) إعادة بناء الصور الحقيقية.`w`, إعادة تحرير هذا`w`)― بالنسبة للمجال المفتوح من النص إلى الصورة، فإنه ليس أداة مناسبة، والنشر هو فقط


```figure
gx-stylegan-mapping
```

## بناءها

`code/main.py`实现 a 1-D style-GAN lite: a خريطة MLP، وظيفة التكوين، فإنه يتلقى تعلم إلى المتجهة الكمية العادية،并用从 `w`派生的尺度/bias 进行调制,还有层次的噪音──它显示通过 affine-modulation 注入 `w`، يمكن أن تصل أو تتجاوز`z`拼接进生成器输入方式──

### الخطوة 1: شبكة الخرائط

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 步骤 2: تطبيع الحالة التكيفية

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

كل خريطة ميزة من نطاق و التحيز من خلال التنبؤ الخطي من`w`حصلت على.

### 步骤 3: ضجيج لكل طبقة

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

كل طريق من الإشارات يمكن تعلمها

## فخ

- **Droplet artifacts。**ستايلجان 1 في خرائط الميزات تنتج قطرة بلاكية، لأن AdaIN 把 mean 归零了── ستايلجان 2 من خلال تحديد الوزن من خلال تقليل الوزن من التحولات لتصميمها──
- **Texture sticking。**النسيج StyleGAN 1 و 2 تتبع إحداثيات البيكسل، وليس إحداثيات الكائنات ((( في التقاطع 时可见)  التحولات خالية من الاسم في StyleGAN 3 باستخدام مرشحات سينك النافذة 修复 هذا النقطة‬
- **Mode coverage。**التقطيع`ψ < 0.7`يبدو صافا، ولكن فقط من شكل ضيق جدا  منطقة نموذج؛ إذا كان هناك حاجة إلى تنوع، استخدام `ψ = 1.0`.
- **Inversion 有损。**ضع الصورة الحقيقية في المقابل`W`عادة من خلال التحسين أو ترميز (e4e، ReStyle، HyperStyle)

## استخدمها

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

对于答案是 个人的脸部照片的产品级演示,StyleGAN 在推断成本  单次前进通过,在4090上 <10ms) 和相同质量门下       上胜过传播

## 交付 it

保存 `outputs/skill-stylegan-inversion.md`◊مهارة 接收一张真实照片并输出: طريقة التحول (e4e / ReStyle / HyperStyle) 、预期隐藏损失、编辑预算(在出现文物 之前你能在`W`中移动多远), و قائمة من المعروفة فعالة تحرير الاتجاهات ((年龄、表情、姿态)

## التدريب

1. **简单。**- لا بأس`adain_on=True`和 `adain_on=False`运行 `code/main.py` مقارنة التشغيل المتخفي الثابت مع التشغيل المتخفي
2. **中等。**实现 mixing regularisation: بالنسبة لفرقة تدريبية، حساب `w_a`.`w_b`، و في النصف الأول من التطبيق`w_a`, آخر نصف المقطع التطبيق`w_b`هل تعلمت أن أسلوب التشريح غير متأثر؟
3. **困难。**خذ نموذج StyleGAN3 FFHQ مسبقًا تدريبًا `w`التوجيهات: تقرير في مكانة التنقل يمكن أن يُساعد على دفع المزيد

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Mapping network | “那个 MLP” | `f: Z → W`，8 层，把 latent geometry 与数据统计解耦。 |
| W space | “Style space” | Mapping network 的输出；大致 disentangled。 |
| AdaIN | “Adaptive instance norm” | Normalize feature map，然后由 `w`-projection 做 scale + shift。 |
| Truncation trick | “Psi” | `w = mean + ψ·(w - mean)`，ψ<1 用多样性换质量。 |
| Path-length regularization | “PL reg” | 惩罚 `w` 中单位变化导致的图像大幅变化；让 `W` 更平滑。 |
| Weight demodulation | “StyleGAN2 的修复” | Normalize conv weights 而不是 activations；消除 droplet artifacts。 |
| Alias-free | “StyleGAN3 的技巧” | Windowed sinc filters；消除 texture 粘在 pixel grid 上的问题。 |
| Inversion | “为真实图像找到 w” | Optimize 或 encode `x → w`，使 `G(w) ≈ x`。 |

## شرح النتاج: لماذا ستايلجان في 2026 سنة لا تزال قادرة على الإنترنت

4090 StyleGAN3 能在 10 ms内生成一张 10242 FFHQ 人脸:`num_steps = 1`لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية، لا توجد إشعارات إلكترونية**300× 差距**، بالنسبة لمنتجات المجال الضيق ((خدمات الأفاطار ‬خطوط أنابيب وثائق الهوية ‬ توليد الوجهات المخزونية) ، فإنها في TCO 上胜出‬

两个运维后果:

- **没有 scheduler，没有 batcher。**في الغالب لا يوجد أي فائدة من الـ LLM و التوزيع، لأن كل طلب يستهلك نفس الفلوب.
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`من شبكة الخرائط  مجموعة صغيرة  形区域采样── هي طبقة خدمة للاختلافات العينة  唯一 杆── ارتفاع القيمة عند الحمل `ψ`،للمستخدمين الممتازين تحسينها

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) StyleGAN‬
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) إكسارة e4e
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) StyleGAN-XL
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 现代最小化 GAN وصفة
