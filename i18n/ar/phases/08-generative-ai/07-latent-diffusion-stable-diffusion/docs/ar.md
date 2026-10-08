# التفريق المتخفي والتفريق المستقر

> في 512 × 512  الصورة القيام بتوزيع الفضاء البيكسل، في الحسابات كانه جريمة الحرب. Rombach et al. (2022) لاحظ، إن إنتاج صورة لا يحتاج إلى جميع 786k  طول، تحتاج فقط إلى ما يكفي لالتقاط طول هيكل القسم، فضلا عن جهاز تشكيل منفصل لمعالجة بقية الجزء.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## 问题

5122 من انتشار الفضاء البيكسل يعني أن شبكة U-Net يجب أن تكون في شكل`[B, 3, 512, 512]`للإنترنت U-Net من 500M-param، كل خطوة من الاختيارات حوالي 100 GFLOPS.

هذه الفلوبات قد تمتد في وضع تفاصيل غير مهمة على الشبكة ، وذلك هو أولئك الذين لديهم VAE يمكن أن يتم ضغطها خارج التركيبات عالية التردد. فكرة Rombach هي: التدريب مرة واحدة VAE (((*المرحلة الأولى*) ،) ،) إختمها ، ثم تماما في 4-شناط 64 × 64 مسدودة مساحة ((*المرحلة الثانية*) في التوزيع.

هذا هو التوزيع المستقر 配方 SD 1.x / 2.x استخدام واحد 860M U-Net 处理 `64×64×4`المعلومات المتخفية، SDXL استخدام واحد 2.6B U-Net  معالجة `128×128×4`،SD3 باستخدام متطابقة التدفقات من محول التوزيع (DiT) استبدل U-Net。Flux.1-dev (مختبرات الغابة السوداء ، 2024)  أصدرت 12B-param DiT-MMDiT── كلها تعمل في نفس المرحلتين أسفلها──

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**مُشفّر`E(x) → z`، المُفكّر`D(z) → x` معدل الضغط المستهدف: لكل مساحة تحت المحور 8×، إعادة ضبط القناة، جعل حجم الكامل المتخفي ≈ 1/16 من عدد البيكسل.`z`لن يتم إضافة القوة إلى غوسيان، لأننا لا نحتاج إلى`z`عمل تحديد النموذج)  عادة أيضا مع الخسارة المعارضة  تدريب، دع فك الصور المخرجة 

2. **Stage 2 — 在 `z` 上做 diffusion。**- لا .`z = E(x_real)`عندما يُصيب البيانات، يُدربُ شبكةٌ U-Net أو DiT على التشديد`z_t` التوصيل: من خلال التوزيع 采样 `z_0`ثم`x = D(z_0)`.

**文本 conditioning。**هناك أيضاً اثنين من المكونات الإضافية. واحد من مُشفّر النص.`[Q = image features, K = V = text tokens]`ويشاركها في المزيج.

**Loss Function 与 Lesson 06 完全相同。**نفس الشيء في الضوضاء 上 القيام DDPM / تدفق مطابقة MSE. أنت فقط استبدلت المجال البياني.

## 架构变体

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

趋势是: باستخدام DiT(作用于变化器的潜伏补丁) استبدال U-Net, توسيع رمز النص ((T5 在快速遵守上胜过CLIP),增加潜伏频道(4 → 16 带来更多细节余量) 


```figure
noise-schedule
```

## بناءها

`code/main.py`وضع أداة 1-D VAE(مخترع الهوية + المفكّر ، فقط للاظهار ؛ حقا VAE 会是 conv net) فوق DDPM من الدروس 06 ،并通过 تصنيف خالية من الإرشادات 加入类条件──

### 步骤 1: مرموز / مرموز

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

في الواقع، فإن الـ VAE لديها الوزن المُدرّب.`z`أعلى التشغيل، لا يهمّ المجال البياني الأصلي.

### الخطوة الثانية:`z`-المجال وسط صنع الانتشار

المُتَشابه مع الدروس 06 DDPM `z = E(x)` 采样出 `z_0`بعد، استخدام`D(z_0)`فك الرمز

### الخطوة الثالثة: إرشادات خالية من التصنيف

خلال التدريب، 10% من الوقت يُلغي علامة الفصل`ε_cond`和 `ε_uncond`ثم:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`= 无指导(完全多样性)`w = 3`= 默认值،`w = 7+`= 和 / 过化。

### 步骤 4: 文本 تكييف

ضع علامة الفصل 替换为结 نص رمز الصفحة 输出──通过跨注意 把文字嵌入 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

هذا هو الفرق الوحيد بين نموذج التوزيع الحتمي للطبقة والتوزيع المستقر.

## فخ

- **VAE-scale mismatch。**SD 1.x VAEs في تشفير 后会应用一个缩放常数(`scaling_factor ≈ 0.18215`نسيان هذا الأمر سيسمحون لـ U-Net في التدريب على التخلفات المتخفية
- **Text encoder silently wrong。**SD3 需要带 >=128 رمزات T5-XXL,fallback till only CLIP 会有损──始终检查 `use_t5=True`وإلا فستسرع الوفاء
- **混用 latent spaces。**SDXL、SD3、Flux 都使用不同 VAEs──在SDXL latences 上训练的LoRA 不能用于SD3──Hugging Face diffusers 0.30+ 会拒绝加载不匹配的检查站──
- **CFG too high。** `w > 10`سوف تنتج صورًا ومقاطعًا ، وتكلفة التنوع تُكلفها بشكل مناسب.`w = 3-7`.
- **Negative prompts leaking。**الإشارة السلبية الفارغة ستصبح رمزًا غير صالح ؛ الإشارة السلبية المملئة ستصبح`ε_uncond` هذان لا يطابقان بعض خطوط الأنابيب 会静默默认使用 null‬

## استخدمها

إنتاج عام 2026:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

## 交付 it

保存 `outputs/skill-sd-prompter.md` القدرة على تلقي عرض نصي + 目标风格,并输出:نموذج + نقطة التفتيش ✓ مقياس CFG、نموذج、إشارة ✓ خطوة ✓ قرار ✓ مجموعة قابلة للاختيار من ControlNet/IP-Adapter, فضلا عن قائمة التفتيش تدريجية للقياس المطلوب.

## التدريب

1. **Easy.**استخدام الإرشادات`w ∈ {0, 1, 3, 7, 15}`运行 `code/main.py` سجل متوسط العينة لكل فئة`w`أذاً، الطبقة تعني أنّها ستفصل عن متوسط المعلومات الحقيقية؟
2. **Medium.**ضع جهاز تشفير لعبة بدلاً من تشفير/تشفير tanh-MLP ‬ مقابل،并加入重建损失‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
3. **Hard.**استخدام المنتشرين بناء انتشار مستقيم حقيقي`sdxl-base`, باستخدام CFG=7 运行 30 个 Euler خطوات,并计时――然后切换到 `sdxl-turbo`, باستخدام 4 خطوات 和 CFG=0── نفس الموضوع، مختلفة الجودة، وصف ما حدث التغيير و السبب

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | “The VAE” | 训练好的 encoder/decoder 对；把 512² 压缩到 64²。 |
| Second stage | “The U-Net” | latent space 上的 diffusion model。 |
| CFG | “Guidance scale” | `(1+w)·ε_cond - w·ε_uncond`；调节 conditioning strength。 |
| Null token | “Empty prompt embed” | 用于 `ε_uncond` 的 unconditional embed。 |
| Cross-attention | “How text gets in” | 每个 U-Net block 都以 text tokens 作为 K 和 V 进行 attention。 |
| DiT | “Diffusion Transformer” | 用作用于 latent patches 的 transformer 替换 U-Net；扩展性更好。 |
| MMDiT | “Multi-modal DiT” | SD3 的架构：带 joint attention 的文本与图像流。 |
| VAE scaling factor | “Magic number” | 将 latents 除以约 5.4，使 diffusion 在 unit-variance 空间中运行。 |

## النتائج: في 8GB ستهلاك درجة GPU على النطاق التدريجي

参考流通集成是经典的我有一台消费级GPU,能交付吗?配方──技巧就是把生产推理文献列出的同一个三旋配方应用到扩散 DiT:

1. **Staggered loading。**التدفق 有三个不需要同时存在在VRAM 中的网络:T5-XXL نص رمز ((fp32 下约 10 GB) 、CLIP-L(小)、12B MMDiT، فضلا عن VAE。先编码提示,*حذف* مرموز,加载DiT,denoise,*حذف*DiT,加载VAE,decode。消费级 8GB GPUs 一次只能容纳一个阶段。
2. **通过 bitsandbytes 做 4-bit quantization。**في T5 مُشفّر و DiT 上都使用 `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)` انخفاض الـ 8× في الـ 內存، وفقاً لمعايير أريترا (من خلال المذكرات) ، انخفاض الجودة من النص إلى الصورة تقريباً غير قابل للتبصر.
3. **CPU offload。** `pipe.enable_model_cpu_offload()`سوف يتم التداول بشكل تلقائي بين وحدات المشاركة بين CPU و GPU في كل مرة، ولكن يمكن أن يزيد من التأخير بنسبة 10-20٪، ولكن يمكن أن يجعل خط الأنابيب يبدأ في العمل.

في الحساب:`10 GB T5 / 8 = 1.25 GB`كمية`12 B params × 0.5 bytes = ~6 GB`ديت كمية، إعادة إضافة على التفعيلات، باستخدام قول stas00، هذا هو الحالة النهائية من الاستنتاج TP=1: لا يوجد نموذج متوازي، أقصى قدر من الكمية.

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) انتشار مستقيم
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL。
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748) ديت
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3، MMDiT
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG‬
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) التدفق 1 系列
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) إنجاز المرجح لكل نقطة تفتيش أعلاه
