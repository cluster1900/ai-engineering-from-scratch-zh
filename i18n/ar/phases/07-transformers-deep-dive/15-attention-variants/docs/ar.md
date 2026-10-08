# انتباه 变体  نافذة زلقة، شقق، فرقية

> الاهتمام الكامل هو دورة واحدة. كل رمز يمكن أن ترى كل رمز، والحفاظ على ذلك يدفع ثمنها.

**Type:** Build
**Languages:** Python
**先修要求:**المرحلة 7 · 02 (تأثير الذاتية) ، المرحلة 7 · 03 (العديد الرؤوس) ، المرحلة 7 · 12 (KV مخزن / الانتباه الفلاشي)
**Time:** ~60 minutes

## 问题

الاهتمام الكامل في تكلفة الذاكرة على طول المسلسل`O(N²)`, حساب التكلفة أيضا`O(N²)`لـ128K-context للاما 3 70B، وهذا يعني أن كل طبقة لديها 160 مليار من الاهتمام 条目، ضرب مرة أخرى إلى 80 طبقة.`O(N²)`التفعيل في الاحتفاظ به، ولكن لن يغير حسابات حسابية تكلفة كل رمز

ثلاثة فئة تغيرات تغير المصفوفة الاهتمام

1. **Sliding window attention (SWA).**كل رمز يحتضر فقط إلى الوهم القريب داخل النافذة الثابتة ، بدلا من المقبل الكامل.`O(N · W)`، من بينهم`W`هو النافذة الكبيرة.
2. **Sparse / block attention.**فقط محدد`(i, j)`لـ"ئـن تـُـتـعـزّل؛ ويتـضطر البـاقي من المواقع إلى زيـو الـوزن.
3. **Differential attention.**استخدام مقياس Q / K مستقل 计算两张 خريطة الاهتمام،再相减──消除将把权重泄漏到前几个代币的 注意沉──微软的DIFF变压器(2024)。

هذه يمكن أن تتعايش. نموذج حدودي عام 2026 往往会混合使用它们: معظم الطبقات هي SWA-1024, كل خمسة طبقات واحدة عالمية كامل الاهتمام, هناك عدد قليل من رؤوس التفاضل المستخدمة لتفريغ الاختبار.

## 概念

### مراقبة النافذة المنزلقة (SWA)

 موقع `i`كل استفسار فقط حضور إلى `[i - W, i]`(المتسببين في الجهاز) أو `[i - W/2, i + W/2]`(توجيه) ‬الموقع‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`-inf`.

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

لـ`N = 8192`和 `W = 1024`، تمتد النتيجة على متريكس 1024 × 8192  غير صفر  خفضت 8 × 

**KV cache 会随 SWA 缩小。**كل طبقة تحتاج فقط للحفاظ على قريبة `W`个 Token of K 和 V── بالنسبة لتصميم مشابه لـ Gemma-3(1024 نافذة,128K سياق) ،KV cache 会降低 128×──

**质量成本。**純 SWA Transformer 難以處理長距離检索──修复方法: 交错在 SWA 層間交错 層──Gemma 3 使用 5:1 SWA:全球──Mistral 7B 使用因果性-SWA stack,信息通过重叠窗向前流动`W`، عبر`L`层后,模型可以向后出席 `L × W`رمز

### الاهتمام القليل / الحظر

预先选择 واحد `N × N`نمط التنقل.

- **Local + strided (OpenAI sparse transformer).**احضر حتى آخر`W`الـ "أعلامة" ، إضافة أخرى إلى هذا`stride`个 رمز مكانة.`O(N · sqrt(N))`计算同时捕捉局部和长距离信息──
- **Longformer / BigBird.**نافذة محلية + عدد قليل من الرموز العالمية`[CLS]`), هذه الوهم الحاضرة إلى جميع الوهم, أيضا يتم امتلاك الوهم الحاضر + روابط عشوائية-بذرة.
- **Native Sparse Attention (DeepSeek, 2025).**تعلم ماذا`(Q, K)`بلوك 重要; 在内核层面跳过零块──兼容 FlashAttention──

الاهتمام الفارق هو هندسة النواة 故事──数学很简单(ماسك سكور ماتريكس);收益来自不把零条目加载进 SRAM──FlashAttention-3 和 2026 年的FlexAttention API 让自定义稀少模式 成为PyTorch 中等能力──

### الاهتمام المختلف (محول DIFF ، 2024)

الاهتمام العادي هناك غسل الاهتمام 问题:softmax 强制每一行求和为 1, لذلك أولئك الذين لا يريدون حضور خاص إلى أي محتوى من الوهم سوف تنحدر الوزن إلى الوهم الأول (أو الوهم الأول) على.

الاهتمام التفاضلي 通过计算**两张**خريطة الاهتمام لم تصل إلى حل هذه المشكلة:

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

من بينهم`λ`هو مقياس تعلم تحصل عليه ((عادة تكون 0.50.8)。A1 捕捉真实内容权重;A2 捕捉 sink。相减会抵消 sink,把权重重新分配给相关 Token。

報告結果(Microsoft 2024):الارتباك 降低 510%,在相同训练长度下有效背景 延长 1.52×,针-在-haystack 检索更敏。

### 变体对比

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

## بناءها

见 `code/main.py` نحقق مقارنة قناع السببية، في صفوف الألعاب، ومثبتة كاملة ✓SWA、مقلي+مخطط 和 الاهتمام التفاضلي‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### الخطوة 1: قناع السبب الكامل

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

من القاعدة للدرس 07 ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ 

### 步骤 2: قناع سببية النافذة المزلقة

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

واحد من العناصر`window`۞ الآن`window >= n`سأستعيد الاهتمام الكامل`window = 1`كل رمز يذهب إلى نفسه

### 步骤 3: مقلية + خطوة القليل القليل القناع

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

نافذة محلية كثيفة إضافة من المرحلة الأولى إلى الأساس`stride`个 Token 的位置──随着额外层数增加,感受野以日志步骤 增长──

### الخطوة الرابعة: الاهتمام المختلف

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次 انتباه مرور، باستخدام تعلم الحصول على معدل الاختلاط 相减──在代码中,我们比较单一注意与差异性注意的注意-沉热地图,并观察沉缩──

### 步骤 5: حجم مخزن KV

في`N = 131072`│ طباعة كل متغير حجم الاحتفاظ كل طبقة│ SWA 和 稀少 变体会降低 10100×── Diferential 会翻倍── │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │

## استخدمها

نمط الإنتاج لعام 2026:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention  قبول وظيفة قناع:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

هذا سوف يُعدّل إلى جوهر تريتون ذاتية التعريف. بالنسبة للنمط العادي، السرعة في فلاشاتنيون 3 بنسبة 10%، ويكون وظيفة الماسك هي عملية استدعاء في بايثون.

**何时选择哪一种：**

- **Pure full attention** كل طبقة مناسبة لتحديد النطاقات القصوى حوالي 16K، أو الاختبار الجودة
- **SWA + global mix** 长 context(>32K), تدريب وإستنتاج 受内存限制──2026 年 32K 以上的默认选择──
- **Sparse block attention** خودdefiniel、 خودdefinition pattern── الحفاظ على تحميل خاص للعمل
- **Differential attention**  أي تلوث من الغوص الاهتمام سوف يؤدي إلى إصابات

## 交付 it

见 `outputs/skill-attention-variant-picker.md` هذه المهارة سوف تتوقف على طول السياق المستهدف  احتياجات الاختبار و ملف تعليمي التدريب / التأثير ، لتحديد نموذج جديد تطبيقات الاهتمام

## التدريب

1. **Easy.**运行 `code/main.py` التحقق`window=4`ساوة سوف تُضع كل خط في آخر 4 رموز خارج كل محتوى`window=n`会 بيت-مثل 复现 كامل الاهتمام السببى
2. **Medium.**في الدروس 07 حجر الوصول`window=1024`في "تيني شاكسبير" أعلى تدريب 1000 خطوة
3. **Hard.**في الحجر الرئيسي 模型实现 Gemma-3-style 5:1 layer mix ((5 مستوى SWA,1 مستوى عالمي)  في حالة توازن العوامل، مقابل الخسارة ‬الذاكرة والجودة التوليد من النطاق الأساسي النقي SWA و ‬المنظمة العالمية النقية‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
4. **Hard.**كل رأس لديه ما يتعلمه`λ`في مهمة استرداد اصطناعية ((إبرة، 2000 个 الاهتزازات) على التدريب. في حالة توازن العنصرات، قياس دقة الاسترداد مقارنة مع خط أساسية الاهتمام الواحد.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑窗 + العالمية الوهم 论文。
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) محلي + عالمي + عشوائية
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) نمط OpenAI المحلي+المخطط
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA:مزيج عالمي
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) ونفذة=1024 ميكس 5:1، اليوم هو تعليمي
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) DIFF محول 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) DeepSeek-V3.2 تعلم-تباين الاهتمام
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) استخدمها 中 قناع-كما-تصل نمط إشارة API‬
