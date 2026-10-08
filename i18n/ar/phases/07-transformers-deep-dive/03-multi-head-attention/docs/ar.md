# الاهتمام متعدد الرؤوس

> رأس الانتباه، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، رأس التعلم، والبحث، والبحث، والبحث، والبحث، والبحث، والبحث، والبحث، والبحث، والبحث، والبحث.

**类型：**الإنشاء
**语言：**بايثون
**前置知识：**المرحلة 7 · 02 ((الاهتمام الذاتي من الصفر)
**时间：**75 دقيقة

## 问题

单个自我注意头 会计算一个注意矩阵―― هذه المصفوفة 捕捉一种关系,通常是能够在当前训练信号中最小化损失的那种关系――如果你的数据里主题verb agreement、co-reference、长距离演讲 和语法分断 全部纠在一起,单个头会把它们抹在单一的软最大分布,丢失半信号――

ورقة Vaswani 2017  أعطى طريقة تعديل هي:并行运行多 وظائف الاهتمام، كل لديه توقعات Q、K、V الخاصة به، ثم وضع المخرج صبغة فوقها── كل رأس 都在维度为`d_model / n_heads`                                                                                                                                                                                                                                                              

الاهتمام المتعدد الرأس هو التخصص المتبني لجميع Transformer في عام 2026.. والجدل الوحيد هو استخدام عدد الرؤوس، وكذلك المفاتيح والقيم

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形为 `(N, d_model)``X`分别 التنبؤ إلى شكل`(N, d_model)`"الـ" "الـ" "الـ" "الـ" "الـ"`(N, n_heads, d_head)`، من بينهم`d_head = d_model / n_heads`❖ نقل`(n_heads, N, d_head)`.

**并行 Attend。**في كل رأس داخل النشاطات النقطة منتج الاهتمام.`(N, d_head)` هذه الرؤوس تعمل على مختلف الفضاء في الإدراج، ولا تتواصل مع بعضها البعض خلال الحسابات الاهتمامية

**Concatenate 并 project。**سوف تجمع رؤوسك`(N, d_model)`ثم ضرب في شكل`(d_model, d_model)`ماتريكس الخروج المتعلم `W_o`.`W_o`هي الرؤوس  إجراء مركبات مختلطة

**为什么有效。**كل رأس يمكن أن يتم تخصصه ، ولا حاجة إلى رؤوس أخرى 争抢表征预算──20192024 سنوات الدراسات الاستقصائية  تظهر أدوار رئيسية مختلفة: رؤساء الموقف ٬ يشاهد رأس الرمز السابق ٬ رؤوس النسخ ٬ رؤوس الكيانات المسماة ٬ رؤوس الإدراج ٬ وهي تشكل آلية أساسية للتعلم في السياق) ٬

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

GQA هو الحالي المعتمدة، لأنه يمكن أن تتم`N/G`تعدد خفض KV-Cache الذاكرة، في حين الحفاظ على تقريبا كاملة الجودة.


```figure
multihead-split
```

## بناءها

### الخطوة الأولى: من الاهتمام الذي لدينا من قبل

取 الدروس 02 里的 `SelfAttention`, باستخدام إختراق / مكث`code/main.py`中有numpy 实现; منطق如下:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

مرة واحدة لإعادة تشكيل و مرة واحدة نقل. لا حلقة.`nn.MultiheadAttention`أعمالك

### 步骤 2: على رأس 运行 نطاق نقطة-المنتج الاهتمام

كل رأس يحصل على قطعة خاصة به

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

على الأجهزة الحقيقية،`Qh @ Kh.transpose(...)`نعم واحد`bmm`◊GPU 看到的是形状为 `(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`من المجموعة الواحدة من المواد المزروعة.

### 步骤 3:مجموعة-سؤال الاهتمام 变体

只有 الأساسية و التوقعات القيمة 会改变──Q 获得 `n_heads`个群;K 和 V 获得 `n_kv_heads < n_heads`个群,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

في الاستنتاج، هذا سوف يوفّر الذاكرة، لأن كيف كاش في الاحتفاظ فقط`n_kv_heads`份副本، بدلا من `n_heads`份──Llama 3 70B استخدام 64 个查询头 和 8 个 KV头,也就是 8× 的缓存 缩减──

### الخطوة الرابعة: حاول كل رأس تعلم ماذا

في جملة قصيرة، استخدم 4 رؤوس لتنفيذ MHA.`(N, N)`ماتريسكة الاهتمام. سترى رؤوس مختلفة حتى في البدء عشوائية.

## استخدمها

في PyTorch 中,一行版本:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

GQA PyTorch 2.5+ 中的:

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**多少个 heads？**قواعد تجربة نماذج الإنتاج لعام 2026:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head` تقريبا دائما يقع في 64 أو 128‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`sqrt(d_head)`أكثر من 256، سوف تفقد العديد من المهنيين الصغار.

## 交付 it

见 `outputs/skill-mha-configurator.md` هذه المهارة ستعمل على أساس الميزانية المعلمية  طول التسلسل و هدف التنفيذ، لتقديم محول جديد  تقديم عدد الرؤوس  عدد الرؤوس و استراتيجية التنبؤ 

## التدريب

1. **简单。**取 `code/main.py`مركز المملكة العربية المتحدة، في ثالثة`d_model=64`في حالة`n_heads`من 1 إلى 16 . في مهمة النسخة الاصطناعية .
2. **中等。**实现 MQA(جميع رؤساء الاستطلاع 共享一个 KV head) ―― قياس عدد المعايير 相比 كامل MHA 下降了多少──计算推断 时 N=2048 下 KV-缓存大小缩小了多少──
3. **困难。**实现 a tiny 版本 of Multi-head Latent Attention:把 K,V 压缩到级-`r`في وقت الاهتمام`r`取到多少时,Cache memory 会降到 full MHA 的 1/8 以下,同时质量仍然保持在验证的 1bit 以内?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | “一个单独的 attention circuit” | 一个维度为 `d_head = d_model / n_heads` 的 Q/K/V projection，拥有自己的 attention matrix。 |
| d_head | “Head dimension” | Per-head hidden width；在 production 中几乎总是 64 或 128。 |
| Split / combine | “Reshape tricks” | Attention 前后的 `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose。 |
| W_o | “Output projection” | Concatenating heads 之后应用的 `(d_model, d_model)` matrix；heads 在这里混合。 |
| MQA | “One KV head” | Multi-Query Attention：单个共享 K/V projection。KV cache 最小，但有一些质量损失。 |
| GQA | “The default since Llama 2” | `n_kv_heads < n_heads` 的 Grouped-Query Attention；通过重复来匹配 Q。 |
| MLA | “DeepSeek 的技巧” | Multi-head Latent Attention：K,V 被压缩到 low-rank latent，并在 attend time 解压。 |
| Induction head | “in-context learning 背后的 circuit” | 一对 heads，检测之前的出现位置，并复制其后跟随的内容。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) 原始的多头规范──
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) MQA 论文。
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) 如何在训练后把 MHA 转换为 GQA──
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA، و لماذا هو في ذاكرة الاحتفاظ بالاستمرار
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) من الناحية الميكانيكية 观察头 实际做了什么──
