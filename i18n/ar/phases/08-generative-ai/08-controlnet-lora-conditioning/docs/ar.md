# ControlNet، LoRA & Conditioning

> 仅靠文本是一种拙的控制信号──ControlNet 让你建立一个预训练的扩散模型,并使用深度地图、pose skeleton、scribble或边形图像来引导它──LoRA 让你通过训练1000万参数来调整一个2B参数模型──二者结合,把稳定的扩散从玩具变成2026年各机构都在交付图像管道──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

## 问题

像"مرأة في ثوب أحمر تمشي كلب في شارع مزدحم" مثل هذا الإشارة، لم تخبر模型狗在*哪里*、女人是什么*姿势*, أو في الشوارع*透视关系*──文本大约只能固定你指定一张图像所需信息的10%──الباقي جزء هو المعلومات المرئية، لا يمكن استخدام الكلمات高效描述──

لكل نوع من الإشارات (موقع، عمق، قدرة، قسم) من التدريب إلى الصفر نموذج مشروط جديد، وتكلفة مرتفعة.

أنت أيضا تريد في حالة عدم إعادة تدريب النموذج الكامل، تشكل النموذج الجديد مفهوم ((صورةك、 منتجاتك、 نمطك)) ...... تحتاج إلى دلتا صغيرة 100x.

ControlNet + LoRA + text = 2026 سنة الممارس الوسائل الكهربائية. معظم خط الأنابيب الصورة الصناعية في الصف SDXL / SD3 / فلوكس القاعدة 之上叠加 2-5 个 LoRA、1-3 个 ControlNet، فضلا عن جهاز تعديل IP-‬

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### (تشارون)

取一个预训练的SD──*克隆* U-Net的编码器 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边缘,深度,pose)──使用 *零转*跳连接(初始化为零的1×1 convs,一开始是无运,随后学习多尔达) 把克隆版本连接回原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

تعني الابتدائية الصفرية للسيطرة على شبكة التحكم، والابتدائية على نفس الهوية، حتى قبل التدريب لن يسبب ضرر.

كل نوع من النماذج التابعة للسيطرة سوف تكون نموذج جانبي صغير  نشر (SDXL 约360M,SD 1.5 约70M)  يمكنك في الاستنتاج 时组组合它们:

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### (هو وزملاء)

بالنسبة للموديلات المتعددة`W ∈ R^{d×d}`, 结 `W`و أضيف ديلتا منخفضة الدرجة:

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

من بينهم`r << d` الاهتمام، على سبيل المثال، المرتبة 4-16 هو التكوين المعيار؛ على الوزن المعدل، على سبيل المثال، المرتبة 64-128`2 · d · r`بدلاً من ذلك`d²` ‬`d=640`اهتمام SDXL،`r=16`عندما كل مُعدّل  فقط 20k 参数، بدلاً من 410k، خفض 20x── وضعها على النموذج بأكمله، فإنّ لورا عادةً ما تكون 20-200MB، بينما القاعدة هي 5GB──

في الاستنتاج، يمكنك تقليل لورا:`W' = W + α · B @ A`.`α = 0.5-1.5`很常见──多 LoRA سوف تتضمن بطريقة مضافية

### المعدل المعدل (Ye et al., 2023)

واحد جداً صغير جداً، يقبل واحد واحد الصور* كمصطلحات ((مع المقال)  يستخدم رمز الصور CLIP لتوليد رموز الصور، ويزورها مع رموز النص معًا في إدراج الاهتمام المتقاطع  كل نموذج أساسي  20MB‬‬، فإنه يجعلك لا تحتاج إلى LoRA، ويمكنك أيضًا تحقيق  إنتاج واحد مع هذا ‬المصطلح ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## المجموعة المتحركة

| Tool | 它控制什么 | Size | 何时使用 |
|------|------------|------|----------|
| ControlNet | 空间结构（pose、depth、edges） | 70-360MB | 精确 layout、composition |
| LoRA | 风格、主体、概念 | 20-200MB | 个性化、风格 |
| IP-Adapter | 来自 reference image 的风格或主体 | 20MB | 文本无法描述外观 |
| Textual Inversion | 将单个概念作为新 token | 10KB | 旧方案，大多已被 LoRA 替代 |
| DreamBooth | 对主体做 full fine-tune | 2-5GB | 强身份一致性、高计算成本 |
| T2I-Adapter | 更轻量的 ControlNet 替代方案 | 70MB | Edge devices、inference budget |

ControlNet ≈ 空间──LoRA ≈ 语义──两者一起使用──


```figure
v4-controlnet-zero
```

## بناءها

`code/main.py`في 1-D 上模拟 هذه الآليات:

1. **LoRA。**طبقة خطية متقدمة`W`تدريب منخفض الدرجة`B @ A`,使 `W + BA`匹配目标 خطية الطبقة`r = 1`足以完美学习a تصحيح درجة-1..

2. **ControlNet-lite。**

### الخطوة 1: الرياضيات

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### الخطوة 2: شبكة جانبية صفر

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

في الخطوة 0، الخروج مع القاعدة  تماما نفسها ‬ التدريب المبكر سوف يتسارع التطور ‬`gate`، لن يحدث كارثة

## 常见坑

- **LoRA 过度缩放。** `α = 2`أو`α = 3`إنه نوع من التسلل المعتاد لجعله أقوى، ولكن قد ينتج عن طريقها إصدارات مفرطة أو تلف.`α ≤ 1.5`.
- **ControlNet weight 冲突。**مع استخدام الوزن 1.0 من Pose ControlNet و الوزن 1.0 من عمق ControlNet عادة ما تكون أكثر.
- **LoRA 用在错误的 base 上。**SDXL LoRA في SD 1.5 上会静默 no-op، لأن أبعاد الاهتمام لا تتطابق.
- **Textual Inversion 漂移。**في نقطة تفتيش واحدة، يتم تغيير رموز التدريب إلى نقطة تفتيش أخرى سوف تتحرك بشكل كبير.
- **LoRA weight-merging 和存储。**يمكنك وضع لورا لحمق إلى أساس النموذج في الوزن، للحصول على استنتاج أسرع ((بدون إضافة وقت التشغيل) ، ولكن سوف تفقد في الوقت التشغيل  تقليل `α`قدرتها على الاحتفاظ بنسقتين

## استخدمها

| Goal | 2026 pipeline |
|------|---------------|
| 复现某个品牌的艺术风格 | 在约 ~30 张精选图像上训练的 rank 32 LoRA |
| 把我的脸放进生成图像 | DreamBooth 或 LoRA + IP-Adapter-FaceID |
| 指定 pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| 精确 layout | ControlNet-Scribble 或 ControlNet-Canny |
| 替换背景 | ControlNet-Seg + Inpainting（Lesson 09） |
| 快速 1-step 风格 | SDXL-Turbo 上的 LCM-LoRA |

## 交付 it

保存 `outputs/skill-sd-toolkit-composer.md` هذه المهارة 接收一个任务(أصول المدخل:مسرعة ✓可选参考图像、可选姿势、可选深度、可选拼图),并输出工具堆、重量 和可复现的种子协议──

## التدريب

1. **Easy。**في`code/main.py`مركز " لورا "`r`من 1 إلى 4... هل يمكن أن تتطابق الدلتا المستهدفة للدرجة 2؟
2. **Medium。**في اثنين من التحويلات الهدف فوق تدريب اثنين من المواطنين المستقلين. تحميل معا، وتظهر لهم زيادة التفاعل. متى هذا التفاعل سوف تفتح الخطية؟
3. **Hard。**استخدام المنتشرات 叠加:SDXL-base + Canny-ControlNet(وزن 0.8) + 一个风格 LoRA(α 0.8) + إيد-ادابتر(وزن 0.6)。 مع الوزن المتداول 变化,测量 FID-vs-prompt-adhesion trade-off。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| ControlNet | "Spatial control" | 克隆 encoder + zero-conv skips；读取一张 conditioning image。 |
| Zero convolution | "Starts as identity" | 初始化为零的 1×1 conv；ControlNet 一开始是 no-op。 |
| LoRA | "Low-rank adapter" | `W + B @ A`，`r << d`；比 full fine-tune 少 100x 参数。 |
| rank r | "The knob" | LoRA 压缩；典型值为 4-16，重度个性化使用 64+。 |
| α | "LoRA strength" | LoRA delta 的 runtime scaling。 |
| IP-Adapter | "Reference image" | 通过 CLIP-image tokens 实现的小型 image-conditioning adapter。 |
| DreamBooth | "Full subject fine-tune" | 在约 ~30 张主体图像上训练完整模型。 |
| Textual Inversion | "New token" | 只学习一个新的 word embedding；旧方案，大多已被替代。 |

## 生产说明:مبادلات LoRA مخططات ControlNet خدمة متعددة المستأجرين

واحد حقيقي نص-إلى-الصورة SaaS جلسة في نفس نقطة تفتيش قاعدة 上 خدمة مئات من LoRA و عشرة ControlNet──خدمة  مشكلة مثل LLM متعددة التأجير(إنتاج المقالة وسط سلسلة مستمرة و LoRAX / S-LoRA 下讨论 LLM 场景):

- **Hot-swap LoRAs，不要 merge。**ستعمل`W' = W + α·B·A`يندمج إلى القاعدة، يمكن أن يجعل كل خطوة استنتاج 快约 ~ 3-5%, ولكن سوف 结`α`و قاعدة:                                                                                                                                                                                                                                                             `pipe.load_lora_weights()`+ `pipe.set_adapters([...], adapter_weights=[...])`, يمكن استخدامها على الطلب تنشيطها.`2 · d · r · num_layers`الوزن، أي MB 级、亚秒级。
- **ControlNet 作为第二条 attention lane。**كلون كودر مع القاعدة ومسيرات التشغيل. اثنين من الوزن تمتد 1.0 من ControlNet = كل خطوة اثنين من إضافات المضي قدما، بدلا من مرسلة واحدة دمجها.
- **Quantized LoRAs 也适用。**إذا قمت بتقييم القاعدة ((انظر الدروس 07، التدفق على 8GB) ، لورا دلتا أيضا يمكن أن تصبح صافيّة إلى 8-بيت أو 4-بيت── QLoRA تحميل على النمط  دعونا نتمكن من وضع في 4-بيت تدفق القاعدة فوق فوق 5-10 ة لورا، و لا  انفجار في الذاكرة──

تحديد التدفق: نيلز من التدفق على 8GB المذكرة سوف قاعدة قياس إلى 4 بتات ؛ في هذا القاعدة الكمية على النمط فوق لورا(`pipe.load_lora_weights("user/style-lora")`),并使用 `weight_name="pytorch_lora_weights.safetensors"`، لا يزال بإمكاني العمل. هذا هو وصفة تسليم معظم مؤسسات SaaS في عام 2026.

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) ControlNet‬
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA ((أول مرة تستخدم في LLM؛ ثم تم نقلها إلى التوزيع)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) جهاز تعديل IP
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) البديل الأسهل لـ ControlNet
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242)"مكتب الأحلام"
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考 خطوط الأنابيب
