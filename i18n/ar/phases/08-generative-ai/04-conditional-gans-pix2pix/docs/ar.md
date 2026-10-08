# المواد المضادة المضادة مع Pix2Pix

> 2014-2017 أول انفجار كبير ، هو التحكم في GAN 生成什么── اضيف علامة 、 張圖像, أو جملة── Pix2Pix هو تصميم الصورة , و في المهمة الضيقة الصورة إلى الصورة , فإنه حتى الآن لا يزال يفوز كل نموذج عام نص إلى الصورة──

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

## 问题
无条件 GAN 会采样任意人脸──做演示 有用,进生产 没用──你想要的是:*把草图 映射成照片*、*把地图 映射成空图*、*把白天场景 映射成夜间*、*给灰色图像 上色*──在所有这些任务中,你会得到一个输入图像`x`و يجب أن تنشر مع بعض التوافقات التفاصلية`y`كل شخص`x`قد يكون هناك الكثير من المواصفات المنطقة`y`✿ خطأ مربع متوسط سوف يضغط عليهم إلى نتائج واضحة✿ خسارة معادلة لا تحدث ، لأن  تبدو حقيقية       

الحالة الحالة (ميرزا و أوسيندرو 2014) وضع الحالة`c`作为输入加入 `G`和 `D` Pix2Pix (Isola et al., 2017) على هذا عملت تخصيص: الشروط هي صورة المدخل الكاملة، مولد هو U-Net، المتميز هو *بيتش على أساس* تصنيف (PatchGAN) ، الخسارة هي خصومية + L1。 حتى في عام 2026، هذا المجموعة تعتبر في مجال الصورة إلى الصورة الضيقة 上 لا تزال تفوز من نموذج النص إلى الصورة التدريبية الصفر، لأنه يتدرب في * بيانات المزدوجة* 上  لديك هو بالضبط ما هو مطلوب الإشارة‬

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y`في Pix2Pix،`z`هو غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ غ

**Conditional D.** `D(x, y) → [0, 1]`输入是 *pair*(condition, output) ・・・这是关键差异:D 必须判断 `y`نعم أو لا`x`لم يكن مجرد الحكم`y`يبدو أن هذا حقيقي

**U-Net generator.**带有跨瓶跳连接的编码码器-decoder──对于输入和输出共享低水平结构边缘、 siluette) 任务至关重要──没有这些跳,高频细节会消失──

**PatchGAN discriminator.**D لا تنشر نتيجة حقيقية أو مزيفة، بل تنشر نتيجة واحدة`N×N`شبكة، كل خلية  تحكم على حقل استقبلي حوالي 70 × 70 بكسلات ‬ ثم تأخذ متوسط‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

L1 项稳定训练,并推动G 接近已知目标──L1比L2 产生更利的边缘(وسطاء، وليس وسائل)──`λ = 100`هو Pix2Pix 默认值

## CycleGAN  عندما لا يكون لديك أزواج

Pix2Pix 需要 زوج `(x, y)`البيانات: CycleGAN (Zhu et al., 2017) 通过额外的 Loss 放弃这个要求:*تساقط الدورة* الخسارة:`G: X → Y`和 `F: Y → X`تدريبهم، جعل`F(G(x)) ≈ x`و`G(F(y)) ≈ y` هذا يسمح لك في حالة عدم وجود مثالات مُزدوجة، تحويل الخيول إلى زيبرا الصيف تحويل إلى شتاء

في عام 2026، الصورة غير المزدوجة إلى الصورة 大多通过 diffusion ((ControlNet、IP-Adapter)) اكتمل، وليس CycleGAN، ولكن الدورة-التساق 思想 لا تزال موجودة في تقريبا كل واحد من مضامین تطابق المجال غير المزدوج 论文中。


```figure
gx-patchgan
```

## بناءها
`code/main.py`في البيانات 1-D 上 تحقيق نوع صغير مشروط GAN--شروط `c`                                                                                                                                                                                                                                                              

### الخطوة 1: ستقوم بتضمين الحالة إلى إدخال G و D

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

التشفير الساخن هو الطريقة الأسهل. النماذج الكبيرة ستستخدم التوابل المتعلمة.

### 步骤 2: القطار مشروط

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

المولّد يجب أن يتناسب مع * شرط محدد 下* من التوزيع الحقيقي، وليس الحدودي

### الخطوة 3: التحقق من كل فئة

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## فخ
- **Condition 被忽略。**G 学会 هامشية,D 从不惩罚,因为 حالة إشارة 太弱──修复:更强地 حالة D(طبقة مبكرة,而不只是晚), استخدام تمييز التنبؤ (Miyato & Koyama 2018)。
- **L1 weight 过低。**G 漂移到任意看起来真实输出,而不是忠实的输出──Pix2Pix-style 任务从 λ≈100 开始──
- **L1 weight 过高。**G 产生模糊 نتائج، لأن L1  لا يزال L_p القاعدة 
- **D 中 ground-truth leakage。**ستعمل`(x, y)`concat 作为 D input،而不只是 `y` لا يمكن التحقق من التوافق
- **每个 class 的 mode collapse。**كل فئة قد تنهار بشكل مستقل...

## استخدمها
2026 年 الصورة إلى الصورة 任务状态:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

عندما (أ) لديك آلاف الأمثلة المزدوجة، (ب) المهمة ضيقة ويمكن إعادة تكرارها، و (ج) تحتاج إلى استنتاج سريع،

## 交付 it
保存 `outputs/skill-img2img-chooser.md`موهبة 接收任务描述、数据可用性(مزدوج مقابل غير مزدوج、N عينات) و التخفيف / ميزانية الجودة، ثم输出:approach(Pix2Pix、CycleGAN、ControlNet variant、SDXL + IP-Adapter)、متطلبات التدريب البيانات、تكلفة الإستثمار والبروتوكول التقييم(LPIPS、FID、محدد للمهمة)

## التدريب
1. **Easy.**修改 `code/main.py`, إضافة الطبقة الثالثة. تأكد من أن G  لا يزال يضع ضجيج كل طبقة 映射 إلى وضع صحيح.
2. **Medium.**في إعداد 1-D 中with فقدان نمط الإدراك بدل L1(مثل D الصغيرة المجمدة 作为特征 استخراج) ―― هل ستغير حدة التوزيع المشروط ؟
3. **Hard.**في إعداد 1-D 中草拟一个CycleGAN: توزيعان, مولدات, فقدان دورة.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## النتائج: Pix2Pix  كمحتوى أساسي للضغط المتأخر

عندما يكون لديك بيانات مُزدوجة 和 صغرى مهمة(خطوط → تقديم 、خريطة معنوية → صورة 、النهار → الليل) وقت، استنتاج واحد لـ Pix2Pix في التخفيف فوق مقارنة التوزيع 快一个数量级──مقارنة الإنتاج عادةً ما تكون:

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix في الإنتقال من البطاقات الثابتة 上胜出( كل طلب 都是相同 FLOPs)。 التوزيع في الجودة 和 التعميم 上胜出。 الممارسة الحديثة عادة ما تكون للقيام بمهمة ضيقة تسليم نموذج مستقطب على طراز Pix2Pix،并为尾输入 提供 انتشار fallback。

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 论文。
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) Pix2Pix
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) CycleGAN。
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) Pix2PixHD
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291)سجاد / غاجان
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) التنبيه D。
