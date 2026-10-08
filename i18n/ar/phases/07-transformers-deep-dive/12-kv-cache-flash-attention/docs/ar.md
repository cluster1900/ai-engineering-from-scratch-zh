# كيه وي كاش، الانتباه الفلاشي وتحسين التوصيات

> التدريب هو المشترك ويتم تقييد FLOP ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 7 · 02 (تأثير الانتباه الذاتي) ، المرحلة 7 · 05 (المحول الكامل) ، المرحلة 7 · 07 (GPT)
**Time:** ~75 minutes

## 问题

مُعَرّفٌ بسيطٌ لتحديد المُعدّات`N`个代币 需要做 `O(N²)`工作: كل خطوة سوف تقوم بإعادة حساب الاهتمام على كامل الاهتمام  على استجابة 4K-token ، وهذا يعني 16M مرة الاهتمام 运算 ، معظمها غير كافية  كل حالة مخفية من الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهتمام الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهت الاهة الاهت الاهة الاهت الاهت الاهت الاهت الاهة الاهت الاهت الاهت الاهت الاهة الاهت الاهت الاهة الاهت الاهت الاهت الاهت الاهة الاهت الاهت الاهة الاهت الاهت الاهت الاهت

علاوة على ذلك، الانتباه نفسه سوف يحمل أيضا الكثير من البيانات. الاهتمام المعيار هو تحويل المصفوفة N×N النتائج، N×d softmax output، N×d النتائج النهائية على HBM عدد قراءة مرات الكثير. بالنسبة N≥2K، الاهتمام سوف يصبح أولا مقيدة في الذاكرة، وليس مقيدة في FLOP.

دو وغيره من المقدمين على التحسينات، قم بتحديد التقييمات المقبلة من التدريج إلى التدريج:

1. **KV cache。**الاحتفاظ كل علامة سابقة من K و V المتجهات. كل علامة جديدة من الاهتمام هو سؤال على حساب مفاتيح الاحتفاظ.`O(N²)`降到 `O(N)`.
2. **Flash Attention。**للاهتمام  حساب صنع الطلاء، جعل كاملة N×N المصفوفة  أبدا لن يدخل HBM── كل softmax + المملة كانت في SRAM تم الانتهاء── في A100 فوق سجل الجدار تسريع 为 24×؛ في دعم FP8 H100 上为 510×──

بحلول عام 2026 ، كل منهما قد أصبح عاماً التكوين. كل مستوى إنتاج يُفترض أن يكون موجوداً.

## مفهوم الأساسي

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### كيو كاش رياضيات

كل طبقة مُشفّر كل رمز كل رأس

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

بالنسبة لموديل 7B، 32 طبقة 32 رأس

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

对于Llama 3 70B ((80 层、d_head=128、使用 8 个KV heads 的 GQA):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

هذا هو السبب في أن 10 جيجا غيترا لاما 3 70 ب في سياق 128 كيه تحت، فقط حجم المجموعة 1 من الكشيف كيه في غاية سوف تشكل 40 جيجا غيترا A100 معظم الحفاظ على الأوراق.

**GQA 是 KV-cache 的关键收益。**استخدام 64 رأس من MHA 会需要 32 GB──MLA أيضا يمكن أن يضغط أكثر──

### الانتباه الوهائي  التبليط 技巧

الاهتمام المميز:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

ثلاث مرات HBM 往返── في H100، HBM 带宽是 3 TB/s؛SRAM هو 30 TB/s── بالمقارنة مع الاحتفاظ بكل المحتوى على الشريحة، كل مرة HBM 往返都会带来约10倍的减速──

انتباه فلاش:

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

كل طوب يحتاج مرة واحدة فقط إلى HBM`O(N²)`降到 `O(N)`❖ المرور الخلفي 会从前行中重新计算部分值, بدلا من جعلها كلها موجودة 

**数值技巧。**تشغيل softmax في البلاط  بين الصيانة `(max, sum)`، لذلك التحدّي النهائي هو محدد. هذا ليس مثل الإصدار المحاسب مع الاهتمام القياسي.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

فلاش 4  نشر  فقط دعم المضي قدما-مرورها‬ تدريب لا يزال يستخدم فلاش 3‬ فلاش 4 GQA 和 varlen 支持仍在等中‬ (عام 2026)‬

### التشخيص المضارب  另一个延迟优化

廉价模型提出 N 个代币――大模型并行验证全部 N 个代币――如果验证接受 k 个代币,你就就用1次大模型前传 换来 k 次生成――对于代码和散文,典型 k=35──

2026 سنة المعتمدة:
- **EAGLE 2 / Medusa。**集成式草案头,共享验证器的隐藏状态──23×加速,且无质量损失──
- **Speculative decoding with draft model。**في مستوى المستهلكين هناك 24× تسريع
- **Lookahead decoding。**إعادة التكرار جاكوبي;不需要草案模型──小众但免费──

### الإفراز المستمر

النتيجة المكتسبة: إنتظر التسلسل الأبطأ  تنتهي، ثم تشغيل مجموعة جديدة 

التسلسل المستمر ((أقدم في أوركا نشرت، اليوم تستخدم vLLM、TensorRT-LLM、SGLang): الطلب القديم تم الانتهاء، على الاطلاق الطلب الجديد تغيير إلى اللحم.

### الصفحة الاهتمام  وضع KV cache 当作虚拟内存

نقطة بيع أساسية vLLM.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬


拖动维度参数,观察缓存大小 如何变化──把序列长度或批量大小 推高,你会看到它多快就超过单张GPU容量──

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

## بناءها

见 `code/main.py` نحن ننجح:

1. -من السهل`O(N²)`مُعَدّر متزايد
2. واحد`O(N)`كيف-كاشة الكشيف الكشيف
3. واحد مثل فلاش انتباه تشغيل-ماكس خوارزمية من المخططات softmax

### الخطوة 1: KV cache

```python
class KVCache:
    def __init__(self, n_layers, n_heads, d_head):
        self.K = [[[] for _ in range(n_heads)] for _ in range(n_layers)]
        self.V = [[[] for _ in range(n_heads)] for _ in range(n_layers)]

    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)

    def read(self, layer, head):
        return self.K[layer][head], self.V[layer][head]
```

بسيط جدا: في كل طبقة من قائمة كل رأس، استمر في إضافة كل رمز من K  V المتجهات

### 步骤 2: المصفوفة softmax

```python
def tiled_softmax_dot(q, K, V, tile=4):
    """Flash-attention-style softmax(qK^T)V with running max/sum."""
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

输出与一次性计算 `softmax(qK) V`متطابقة قليلاً، لكن مجموعة العمل في أي لحظة كانت مجرد واحدة`tile × d_head`كتلة، وليس كاملة `N × d_head`.

### الخطوة 3: في 100 توليد رمز الصور 上比较 ساذج مقابل فك التشفير المتخزين

统计注意 操作数――ساف:`O(N²)`= 5050♦مُخفّض:`O(N)`= 100...

## استخدمها

```python
# HuggingFace transformers auto-enables KV cache on decoder-only generate().
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-3B",
    attn_implementation="flash_attention_2",  # use FA3 if Hopper
    torch_dtype="bfloat16",
)
# generate() uses KV cache automatically
```

وحدة الإنتاج:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

跨请求的前缓存是2026年重要收益相同系统提示、少数截图示例,或长文本文档 都能在多次调用之间复用 KV──对于反复使用工具提示的代理 工作负载,前缓存通常能带来5× 吞吐量提升──

## 交付 it

见 `outputs/skill-inference-optimizer.md`◊ هذه المهارة سوف تستخدم في إعدادات جديدة لتنفيذ إختيار الاهتمام

## التدريب

1. **Easy.**运行 `code/main.py` تأكيد البراغية و الاكتشافات المتخفية  تتمثل في نفس الناتج; انتبه إلى اختلافات العدد
2. **Medium.**实现 prefix caching:给定一个提示 P 和多个完成,先对P 运行一次前行来填充KV缓存,然后按每个完成 分支――测量对对每一个完成 重新编码P 的速度――
3. **Hard.**实现 a玩具版 PagedAttention:KV cache 使用固定的16 رمزية كتلة،并带有免费列表── عندما يتم الانتهاء من تسلسل 完成时,把它的块 归回池中──模拟 1,000 个长度不同的聊天完成──比较它与连续分配的内存碎片情况──

## 关键术语

| Term | 人们的说法 | 它实际上的含义 |
|------|------------|----------------|
| KV cache | “让 decoding 变快的技巧” | 存储每个前缀 token 的 K 和 V；新 queries attend to 它们，而不是重新计算。 |
| HBM | “GPU 主内存” | High Bandwidth Memory；H100 上 80 GB，B200 上 192 GB。带宽约 3 TB/s。 |
| SRAM | “片上内存” | 每个 SM 的高速内存，H100 上每个 SM 约 256 KB。带宽约 30 TB/s。 |
| Flash Attention | “Tiled attention kernel” | 在 HBM 中不物化 N×N 的情况下计算 attention。 |
| Continuous batching | “No-wait batching” | 不清空 batch，直接换出完成的 sequences、换入新的 sequences。 |
| PagedAttention | “vLLM 的核心卖点” | KV cache 以固定 blocks 分配，并通过 page table 管理；消除碎片。 |
| Prefix caching | “复用长 prompts” | 在请求之间缓存共享前缀的 KV；对 agents 来说是重大成本削减。 |
| Speculative decoding | “Draft + verify” | 廉价 draft model 提出 tokens；大模型在一次 pass 中验证 k 个。 |

## 延伸阅读

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) فلاش 1..
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) فلاش 2..
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) فلاش 3..
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) خط أنابيب بلاكويل 5 مراحل 和 البرمجيات-exp2 技巧; قراءة repo README، معرفة هذه الدورة المذكورة تحذيرات الإطلاق المقبلة فقط
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) vLLM 论文。
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) تشفير المواصفات
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 本课引用的集成草案方法的EAGLE-1/2 ورقة
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) مع النسر واحد من المشار إليها مقربة من مدوسة
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) 关于16 رمز بلوك و تصميم الجدول الصفحة القنوني الغوص العميق
