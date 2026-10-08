# GPT  نمذجة لغة السببية

> برت 能看到两侧──GPT 只有能看到过去──三角面膜是现代 AI 中影响最深远的一行代码──

**Type:** Build
**Languages:** Python
**先修要求:**المرحلة 7 · 02 (تأثير الانتباه الذاتي) ، المرحلة 7 · 05 (المحول الكامل) ، المرحلة 7 · 06 (BERT)
**Time:** ~75 分钟

## 问题

نموذج اللغة 回答一个问题:给定前 `t-1`أوراق، أوراق`t`مع هذا التدريب الإشاراتي، أي التنبؤ التوقيعي التالي، سوف تحصل على ما يمكن أن تولد رمز مرة واحدة ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

لتجري التدريب من نهاية إلى نهاية على التسلسل بأكمله، تحتاج إلى جعل توقعات كل موقع تعتمد فقط على الموقع السابق. وإلا فإن النموذج سوف يمر في السرقة للرد سهلاً للخداع.

القناع السببى هو فعل هذا الأمر`-inf`المصفوفة العليا الثلاثي من المكونات، في المرحلة الأولى من المرحلة، قبل إضافة إلى نقاط الاهتمام، بعد ذلك، هذه المواقع سوف تصبح 0، كل موقع فقط يمكن أن يشارك إلى نفسها وأوقاتها الأولى، لأنّك وضعتها مرة واحدة تطبيق على التسلسل بأكمله، لذلك مرة واحدة إلى الأمام، يمكنك الحصول على N 个并行的 التنبؤات التوقيتية التالية.

GPT-1 (2018) ، GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2024), كلود، لاما، كوان، ميسرال، ديب سيك، كيمي    هم محولات سببية لمعرفة الكمبيوتر فقط، الحلقة الأساسية هي نفسها.

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### القناع

给定长度为 `N`تسلسل، بنية واحد `N × N`المصفوفة:

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

في المرحلة الاولى،`M`إضافة إلى درجات الاهتمام الأصلية`exp(-inf) = 0`، لذلك يتم تعريف مساهمة الموقع على القلق إلى صفر. كل خط من المصفوفة الاهتمام هو مجرد توزيع احتمال الموقع السابق.

实现成本: مرة واحدة `torch.tril()`调用――计算时间:纳秒级―― على النطاق بأكمله:一切――

### لم يذهب للتدريب،

التدريب: على كل شيء`(N, d_model)`التسلسل القيام مرة واحدة إلى الأمام، حساب N 个 خسائر الانتروبيا المتقاطعة ((( كل موقع واحد) ،求和,backprop。 على طول التسلسل 并行── هذا هو سبب GPT 训练能够扩展: يمكنك معالجة 1M رموز في مجموعة في مرسلة GPU واحدة──

تَعْرفُ: أنت تَعْرفُ أَنّهُ مُتَعَلّقُ.`[t1, t2, t3]`، الحصول على`t4` الإدخال`[t1, t2, t3, t4]`، الحصول على`t5` الإدخال`[t1, t2, t3, t4, t5]`، الحصول على`t6`KV cache(درسة 12) حفظ `t1…tn`ولا داعي للقيام بإعادة حسابها في كل خطوة ولكن في الوقت الذي يتم فيه التفكير في التداول

### الخسارة  التحول واحد

أعطينا رموز`[t1, t2, t3, t4]`:

- المدخل: `[t1, t2, t3]`
- الأهداف:`[t2, t3, t4]`

لكل موقع`i`, حساب`-log P(target_i | inputs[:i+1])`△求和── هذا هو التقاطع الانتروبية لسلسلة كاملة

كل محول لعبة LM يستخدم هذا الخسارة التدريبات التدريبات المسبقة التنسيقات المحددة الخسارة

### استراتيجيات فك الكشف

بعد التدريب، الاختيار من النموذج هو أكثر أهمية من ما يعتقد الناس.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

في عام 2026، بالنسبة للنماذج المفتوحة الوزن، من-p + درجة الحرارة 0.7 هو قيمة مرموقة معقولة.

### 让 GPT وصفة 起作用的因素

1. **Decoder-only.**لا يوجد مرموزة 开销 
2. **Scaling.**124M → 1.5B → 175B → تريليونات。 قوانين قياس تشينشيللا(المرحلة 13) أخبرك كيف تقاسم الحوسبة‬
3. **In-context learning.**تقريباً في 6B13B 时涌现──模型无需细调就能跟随少数拍照例子──
4. **RLHF.**基于人类偏好后培训 把原始预训文模型转化为聊天助手──
5. **Pre-norm + RoPE + SwiGLU.**تدريبات استقرار واسعة النطاق

منذ GPT-2، لم يتغير البنية الأساسية كثيرا.


```figure
causal-mask
```


```figure
mask-derivation
```

## بناءها

### الخطوة 1: قناع السبب

见 `code/main.py`一行代码:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

في المرحلة الأولى، قم بإضافةها إلى درجات الاهتمام.

### الخطوة 2: نموذج GPT-ش 2 طبقات

堆叠两个 بلوك المفكّر 绑定,这是自 GPT-2 以来标准技巧)

### الخطوة 3: التنبؤ التالي،端到端

في لغة لعبة 20 رمزًا ، في كل موقع تكون هناك منطقات.

### الخطوة الرابعة: أخذ العينات

实现 لالية、温度、top-k、top-p、min-p──在固定 prompt 上运行每种并比较输出──一个采样函数只需要10 行──

## استخدمها

(بيتورش2026)

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

في الأسفل،`generate()`运行前行,取出最后-position logits,sample 下一个代币,追加它,然后重复──每个生产级LLM الاستنتاجات كومة(vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX)都用重度优化实现同一个循环 批量预填、连续批量、KV缓存页面、猜测解码──

**GPT vs BERT，各用一句话：**GPT 预测 `P(x_t | x_{<t})`BERT 预测 `P(x_masked | x_unmasked)`◊ الخسارة تقرر ما إذا كان نموذج قادر على إنتاجها

## 交付 it

见 `outputs/skill-sampling-tuner.md`◊ هذه المهارة سوف تكون مهمة الجيل الجديد  اختيار معايير العينات، ويحتاج إلى فك التشخيص الحددي  تدوينها 

## التدريب

1. **Easy.**运行 `code/main.py`, التحقق من softmax  بعد المصفوفة الاهتمام السببية هي                                                                                                                                                                                                                                                      
2. **Medium.**实现宽度为 4 的束搜索──在 10 个短提示 上比较束4 与贪的困惑──beam 总是会赢吗?
3. **Hard.**实现 تخمينات التشفير: استخدام نموذج صغير من نوع 2 طبقات 作为 مسودة، باستخدام نموذج من 6 طبقات 作为验证者──测量 100 个长度为 64 的完成 上的壁表速度──确认输出与验证者的贪输出匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Causal mask | “三角形” | 加到 attention scores 上的上三角 `-inf` matrix，使位置 `i` 只能看到位置 `≤ i`。 |
| Next-token prediction | “loss” | 模型在每个位置上的分布与真实下一个 token 之间的 cross-entropy。 |
| Autoregressive | “一次生成一个” | 将输出反馈为输入；并行性只存在于训练阶段，不存在于生成阶段。 |
| Logits | “pre-softmax scores” | softmax 之前 LM head 的原始输出；sampling 就发生在这些值上。 |
| Temperature | “创造力旋钮” | 将 logits 除以 T；T→0 = greedy，T→∞ = uniform。 |
| Top-p | “Nucleus sampling” | 将分布截断为累计和 ≥p 的最小集合；从剩余部分 sample。 |
| Min-p | “比 top-p 更好” | 保留满足 `p ≥ min_p × max_p` 的 tokens；会根据分布尖锐程度调整 cutoff。 |
| Speculative decoding | “draft + verify” | 便宜模型提出 N 个 tokens；大模型并行验证。 |
| Teacher forcing | “训练技巧” | 训练时输入真实的前一个 token，而不是模型的预测。每个 seq2seq LM 的标准做法。 |

## 延伸阅读

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) GPT-1。
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) GPT-2。
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 和 التعلم في السياق
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) تَشْرِيف المُحدّثات 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 标准 causal-LM 参考代码。
