# التفتيش التدريجي و إعادة الحساب التشغيلي

> سيتم الاحتفاظ بالعدد المتوسط للعملات التشغيلية في كل مقياس 70B و 128K، حيث يمكن أن يصل قيمة التشغيل لكل صف إلى 3 TB.

**Type:** Build
**语言:**بايثون ((مع مشعل متخلف)
**前置要求:**المرحلة 10 الدروس 04 (ميني-GPT قبل التدريب) ، المرحلة 10 الدروس 05 (توسيع وتوزيع)
**Time:** ~70 分钟

## 问题

محول التدريب سوف يتم حفظ كل طبقة للخلف 中需要求导的每一操作的输入:注意输入、Q/K/V投影、softmax 输出、FFN 输入、规则 输出,以及残留流──对于隐藏的尺寸为`d`طول التسلسل`L`"بارتش"`B`من الطبقة، وهذا تقريبا هو كل طبقة`12 * B * L * d`个浮点数──

لـ`d=8192, L=8192, B=1`، وهذا في BF16 下是 800 MB / layer. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .`L^2`),更没有计入 tensor-parallel جزئي النسخ

هذا هو الحساب الجانبي:BF16 الوزن بالإضافة إلى حالة التحسينات قد يمكن أن تضع في 80GB، ولكن قيمة التشغيل سوف تجعلك تتجاوز الحد.

朴實實現時,checkpointing 每一步大约会多花 33% من التقدم الممر FLOPs. 实现好时,即根据Korthikanti et al. 智能选择做选择性检查,你可以在5% 开销下省5x 存储存储.

## 概念

### الخلفية  في الواقع تحتاج إلى ماذا

`output = layer(input)`✿ إلى الوراء 想要 `grad_input`和 `grad_params`❖ لتحديدها، تحتاج:

- `input`(للاستخدام في الحسابات على الإنترنت`grad_params = input.T @ grad_output`)
- بعض النشاطات المتوسطة النشاطات المتوسطة النشاطات المتوسطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة النشطة الن النشطة النشطة الن الن الن الن الن الن الن الن الن الن الن الن النشطة الن الن الن الن الن الن الن الن الن الن الن الن الن الن الن الن الن الن الن

المضي قدماً 会在自动保存这些内容──每个 `tensor.retain_grad()`وكل شخص يحتاج إلى إدخاله سيتم الاحتفاظ بمصدر

### 朴素 التفتيش الكامل

إزالة الشبكة`N`个段 前进 期间,只保存每个段的 *input*──当后退时 需要中间量时,重新运行该段的前进通行 来物化它们,然后再求导──

مثال: محول 32 طبقة 拆 into 32 个段, كل قطاع 1 层。

- الذاكرة:32 个 طبقة المدخلات ((小) مقابل 32 *( كل طبقة حجم تفعيل)
- الحسابات المضافة: كل قطاع 额外 1 مرات إلى الأمام، وذلك يعني زيادة مجموعات المضافة المضافة إلى الأمام 约 33% ((لأن الخلف هو إلى الأمام 2x، خطوة كاملة من 1 + 2 = 3 个单位变为 1 + 1 + 2 = 4 个单位) 

كان هذا في البداية Chen et al. 2016`sqrt(L)`層放一个检查点,以平衡记忆和计算.

### نقطة التفتيش الانتخابية (كورتهيكانتي 2022)

ليست كل تكاليف قيمة التشغيل نفسها.`B*L*L*heads`,并随序列长度 *二次* 增长──FFN التفعيل الخفية 是 `B*L*4d`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

التفتيش الانتقائي 会保留 تخزين التكلفة المنخفضة من قيمة النشاطات (التنبؤات الخطية والبقايا) ، فقط إعادة حساب الجزء الثمين (الاهتمام)

سيتم تنفيذها في مجال إعادة الحسابات التشغيلية الانتقائية. معظم عمليات تدريب الحدودية من 2024+ تم استخدامها.

### إفراج

重新计算的替代方案:在前和后期 之间把激活值传到CPU RAM──它需要PCIe带宽;当空带宽的收益高于重现化 成本时很有用──混合策略很常见: بعض الطبقات نقطة التفتيش، بعض الافتراغ──

سوف FSDP2 سوف تخفيض 作为一等选项提供──当GPU受记忆限制,但CPU-GPU转移还有余量时,

### نموذج التكلفة

كل`k`نقطة تفتيش مستوى واحد`L`层时,朴素检查点的每步FLOPs:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

باستخدام نقطة التفتيش المنتخبة، تقوم فقط بإعادة حساب جوهر الاهتمام، بدلاً من الطبقة الكاملة:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### نموذج توفير الذاكرة

حجم التشغيل في كل مستوى:`A` ‬`L`层,总 التشغيل الذاكرة:`L * A`.

نقطة تفتيش كاملة (حجم القطاع 1):只保存 `L * input_volume`(للمحول المعيار 约为 `L * 1/10 A`(‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`9 * L * A * 1/10`.

كل`k`نقطة تفتيش المستوى`L/k * A`, إعادة إضافة القطاع النشط`k-1`層的量──

عندما`k = sqrt(L)`时, ذاكرة و إعادة حساب تكلفة مدينة `sqrt(L)`缩放، هذا هو أفضل وزن من طبقات التكلفة الموحدة

### ماذا يحدث في نقطة التفتيش

- مرحلة خط الأنابيب في وسط المستويات الداخلية من الطائرة.
- إذا كانت الطبقات الأولى والأخيرة هي التي تحكم هذه المرحلة في محولات الصور ، فلا تُرى نقطة التفتيش
- 已使用 FlashAttention's attention kernels: فلاش 已会快速重新计算软max، لذلك الإضافية على مستوى الطبقة التفتيش 叠加收益很小──

### نمط التنفيذ

1. **Function wrapper：**استخدام`torch.utils.checkpoint.checkpoint(fn, input)`حزمة قطعة واحدة.`input`، في العودة إلى الوراء 

2. **Decorator-based：**ستضع الطبقات على علامة يمكن التفتيش عليها؛ ويقرر المدرب في وقت التشغيل أي قطاعات يتم تغليفها.

3. **Manual explicit recompute：**أنفسنا نكتب مرورًا خلفيًا ،调用自定义的 `recompute_forward`, باستخدام مدخلات الاحتفاظ

٣٣- أعطى النتيجة الوظيفية 相同── الملفوفات هي المعيار المعتاد استخدامها.

### مع TP / PP / FP8

- **Tensor parallel：**مدخلات نقطة التفتيش في إعادة الحساب يجب جمعها أو استردادها؛ تحتاج إلى معالجة تكلفة الاتصالات.
- **Pipeline parallel：**النموذج النموذجي هو نقطة التفتيش في كل مرحلة من خط الأنابيب إلى الأمام، مما يجعل الجهازات الدقيقة في الترتيب العكسي يمكن إعادة استخدام ذاكرة التشغيل.
- **FP8 recompute：**إعادة الحساب 期间更新的 amax史 必须与原始前匹配,否则 FP8 مقياس 会漂移──大多数框架 会快照规模──


```figure
activation-recompute
```

## بناءها

### 步骤 1: نموذج الألعاب

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### الخطوة الثانية: تحتاج إلى جميع التفعيلات

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 步骤 3: نقطة التحقق-كل-ك ذاكرة

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤 4: نموذج التكلفة

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤 5: مقياس الذاكرة

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### الخطوة 6: الحجم المثالي للجزء

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### الخطوة 7: قرار نقطة التفتيش المختارة

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## استخدمها

- **torch.utils.checkpoint**:`from torch.utils.checkpoint import checkpoint`،PyTorch 中的规范包装──它包裹一个函数;只保存输入,然后倒退时重新计算──
- **Megatron-Core activation recomputation**:支持 `selective`.`full`和 `block`طرق تدريب الحدود 2024+
- **FSDP2 offload**:FSDP2 中中 `module.to_empty(device="cpu")`配合 `offload_policy`،سوف يضع التفعيلات إلى CPU بدلاً من إعادة الحساب
- **DeepSpeed ZeRO-Offload**: لتحسين الحالات و التفعيلات من CPU خارج التحميل، مع التحقق من نقطة التفتيش 互补。

## 交付 it

本课会产出 `outputs/prompt-activation-recompute-policy.md`, هذا أمر مفاجئ: يتلقى تحديد نموذجك ((طبقات  خفية  sequ ‬بارتش) وذاكرة GPU قابلة للاستخدام,并输出

## التدريب

1. 验证正确性.`model_forward`+ `model_backward`(مفعول كامل)`model_forward_checkpointed`+ `model_backward_checkpointed`(قطاعات)  تدرجات المعايير 必須在機械精度 下完全一致‬

2. حجم قطاع التسجيل`k`، من 1 إلى `L`◊ رسم FLOP فوق رأس وذاكرة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

3. 实现 انتقائية التفتيش: حفظ مدخلات وحدات الاهتمام، ولكن لا حفظ بينها间量── بالنسبة إلى نموذج 32 طبقة seq=8192، قياس مقارنة مع التفتيش الكامل الطبقة FLOP مبالغ فوقية──

4. 添加脱载──把段输入 保存到一个模拟的 CPU缓冲((一个单独的列表)──将 PCIe带宽 作为字节/时间 测量,并找出脱载与重计算 之间的破解点──

5. مقياس واحد حقيقي PyTorch محول,分別使用和不使用 `torch.utils.checkpoint` قياس الذاكرة`torch.cuda.max_memory_allocated`) و الوقت الخطوة

## 关键术语
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- أول مقال عن التفتيش المرتفع المشكلي
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- تحديد التشغيل الانتقائي و تحليل التكلفة المشكلية
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)--                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- حجم التشغيل أسفل إزالة
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准 API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)-- الاختيارية 、 كامل و وضع الحظر
