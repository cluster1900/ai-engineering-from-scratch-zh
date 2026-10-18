# GPT  Sebep dili modeli

> BERT 能看到两侧──GPT 只有能看到过去──三角面具是现代AI中影响最深远的一行代码──

**Type:** Build
**Languages:** Python
**先修要求:**7 · 02 aşaması (Öz dikkat), 7 · 05 aşaması (Tüm Transformer), 7 · 06 aşaması (BERT)
**Time:** ~75 分钟

## 问题

dil modeli 回答一个问题:给定前 `t-1`- Token, token.`t`Bu sinyal eğitimi ile, yani bir sonraki belirti tahminini kullanarak bir kez bir belirti üretebilen bir model elde edeceksiniz.

Tüm dizide bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama boyunca bir sonraki aşama üzerinde çalışmak için, bir sonraki aşama üzerinde bir sonraki aşama üzerinde bir sonraki aşama üzerinde bir aşama üzerinde bir aşama yapılması gerekir.

Sebep maskesini yapmak işte bu.`-inf`值組成的上三角矩陣, softmax 之前加到注意分上──softmax 之后, bu konumlar 0 になる──每位置只能到自己和更早的位置出席──因为你把它一次性应用到整个序列上,所以一次性前进传就能得到N 个并行的下一个标记预测──

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2025), Claude, Llama, Qwen, Mistral, DeepSeek, Kimi   bunlar sadece dekodörlü sebepçi transformatörlerdir, çekirdek döngüsü aynı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### maske

给定长度为 $N$Bir dizi oluşturun.$N \times N$matris:

```math
M_{ij} = \begin{cases} 0 & \text{若 } j \le i \\ -\infty & \text{若 } j > i \end{cases}
```

Hızlı bir şekilde,`M`Üstüne ilk dikkat puanları.$\exp(-\infty) = 0$, maske konumunun katkısı ağırlığı sıfırdır. Dikkat matrisi'nin her satırı sadece önceki konumların olasılık dağılımına yöneliktir.

实现成本: bir kere `torch.tril()`调用──计算时间:纳秒级── tüm alanın etkisine:一切──

### Üç köşeler

Maske genellikle dikkat üzerinde bir ekleme olarak konuşulur. Tersine, bu artık gizemli bir şey değildir: dikkat, önce ortalama üçüncü gelişme, üçgen ise sadece ortalama işlemin döngüsünün sınırını bir matç olarak yazır.

**阶段 1：前缀平均。**En basit sırada sonuç özet: konum $i$变为位置 $0 \ldots i$⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒     ⇒ ⇒       ⇒        ⇒                                                                                                                                                                                                                                                                                  `out[i] = X[:i+1].mean(0)`△ Aynı hesaplama bir matron çarpı ile de yapılabilir. Bir elementin 1'nin aşağı üç köşesiyle, her satırın bu satırın element sayısı ile ayrılırken tekrar çarpı:

```python
import numpy as np

A = np.tril(np.ones((n, n)))
A = A / A.sum(axis=1, keepdims=True)
out = A @ X
```

$A$- Evet .$i$行是 $[1/(i+1), \ldots, 1/(i+1), 0, \ldots, 0]$◊ Kısayolların üzerinde hiçbir şey yok.

**阶段 2：学习权重。**均平均把过去每 token都视为同等重要──用学到的分数矩阵 `S`Bu sırada her satır doğal olarak 1 olarak kullanılmaya devam eder. Bu nedenle, sayı olarak ayırmak yerine her satır için yumuşak maksimum kullanın.`-inf`Çünkü ...`exp(-inf) = 0`- ...

```python
def softmax(x, axis):
    e = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

S = S + np.triu(np.full((n, n), -np.inf), k=1)
A = softmax(S, axis=1)
out = A @ X
```

Aynı üçgen, aynı yol, aynı matmul, aynı zamanda sadece bir matmul.`-inf`Maske yeni bir mekanizma değil, sadece aşama 1'nin sıfır elementlerini softmax'in giriş alanına dönüştürmek.

**阶段 3：依赖内容的权重。**2. aşamada,`S`Eğitim sonrası sabitlenme: Tokenlerin içeriği ne olursa olsun, pozisyon 7 pozisyon 3'ün ağırlığı her zaman aynıdır.`S = Q @ K.T / sqrt(d_k)`△ diğer kısım tamamen değişmez. Maske ∞ yumuşak ∞ , daha da aynı süreçtir.

Üç aşama, bir değişmezlik: Aşağı üç köşeler sıradan bir sıradan bir sıraya katlanır. Ortalama  Ortalama  Öğrenilen duruş ağırlığı  İçeriğin ağırlığı  bağımlılığı  Maske  Daha sonra dikkat üzerine eklenmedi.

```figure
mask-derivation
```

### Eğitim, eğitim ve öneriler

訓練: tüm için `(N, d_model)`Bir kez ileriye geçmek için bir dizi yapın, hesaplayın N 个 çapraz entropi kaybı( her bir konum için),求和,backprop。 dizi boyunca ve gidermek için. İşte GPT 训练能够扩展的原因:

推理: 你个个代币 生成──输入 `[t1, t2, t3]`- Al .`t4`❖ 输入 `[t1, t2, t3, t4]`- Al .`t5`❖ 输入 `[t1, t2, t3, t4, t5]`- Al .`t6`KV cache(Lection 12)保存 `t1…tn`Bu yüzden her adımında yeniden hesaplamak zorunda değilsiniz. Ama düşünce zamanında bir dizi derinlik = 输出长度.

### Kayıplar  Birer birer değişim

给定 token `[t1, t2, t3, t4]`- ...

- Giriş: `[t1, t2, t3]`
- Hedefler: `[t2, t3, t4]`

Her bir pozisyon için .`i`,计算 `-log P(target_i | inputs[:i+1])`Bu, bütün dizinin çapraz entropi.

Duyduğun her transformatör LM bu kaybı kullanıyor 訓練── 訓練前、 調整、 SFT  kaybı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

### Şifreleme stratejileri

訓練 sonrası, örnekleme  seçmek insanların hayal etmesinden daha önemlidir.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

2026 yılında, açık ağırlıklı modeller için, min-p + sıcaklık 0.7 bir mantıklı bir değerdir.

### 让 GPT reçeti 起作用的因素

1. **Decoder-only.**没有编码器 开销――每层一次 注意+FFN通过――
2. **Scaling.**124M → 1.5B → 175B → trilyonlar。Chinchilla ölçekleme yasaları(13 ders) size hesaplama nasıl dağıtılacağını söyleyin。
3. **In-context learning.**Model için ince ayarlama gerekmiyor. Birkaç örnekle takip edebilirsiniz.
4. **RLHF.**基于人类偏好后培训 把原始预训文模型转化为聊天助手──
5. **Pre-norm + RoPE + SwiGLU.**Büyük çaplı bir eğitim.

GPT-2'den bu yana, çekirdek yapısı çok fazla değişmedi. Gerçekten ilginç değişiklikler veri, ölçek ve eğitim sonrası üzerinde gerçekleşmiştir.


```figure
causal-mask
```


## Yapın onu.

### 步骤 1: sebep maskası

Görüyorum .`code/main.py`一行代码:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Bu da tam bir mekanizmadır.

### 步骤 2: Bir iki katmanlı GPT-şöyle model

堆叠两个解码块(masked self-attention + FFN,无跨注意)。添加代码嵌入、位置编码 和无嵌入(与代码嵌入矩阵绑定,这是自 GPT-2 以来标准技巧)。

### 步骤 3: Sonraki belirti tahmin,端到端

Bir 20 token oyuncak sözcükünde, her pozisyonda logitler oluşur. Bir hedef birbiriyle değişim karşısında  hesaplama çapraz entropi kaybı.

### 4 adım: Örnekleme

实现贪欲、温度、top-k、top-p、min-p──在固定 prompt 上运行每种并比较输出──一个样本取函数只需要10 行──

## Kullan

PyTorch,2026 dilini:

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

Alt katta,`generate()`运行前行,取出最后位置 logits,sample 下一个代币,追加它,然后重复──每个生产级 LLM inference stack(vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX)都用重度优化实现同一个循环 批量预填、持续批量、KV缓存页面、投机解码──

**GPT vs BERT，各用一句话：**GPT 预测 $P(x_t \mid x_{<t})$│BERT 预测 │$P(x_{\text{masked}} \mid x_{\text{unmasked}})$◊ kayıp modelin üretilebilmeyeceğini belirler.

## - Söyle.

Görüyorum .`outputs/skill-sampling-tuner.md`◊ Bu beceri yeni nesil görevi için  sampleleme parametrelerini seçmek ve belirginlik çözme gerektirir                                                                                                                                                                                                                                                  

## 练习

1. **Easy.**运行  İşlem`code/main.py`,验证 softmax 后的因果注意矩阵是下三角的──抽查:第3 行应该只在第03 列有权重──
2. **Medium.**实现宽度为 4 的梁搜索──在 10 个短提示上比较梁-4 与贪的困惑──beam 总是会赢吗?
3. **Hard.**实现投机式解码:使用微型2层模型 作为草案,使用6层模型 作为验证器──测量100 个长度为64 的完成 上的壁-时钟速度──确认输出与验证器的贪输出匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Causal mask | “三角形” | 加到 attention scores 上的上三角 `-inf` matrix，使位置 `i` 只能看到位置 `≤ i`。 |
| Next-token prediction | “loss” | 模型在每个位置上的分布与真实下一个 token 之间的 cross-entropy。 |
| Autoregressive | “一次生成一个” | 将输出反馈为输入；并行性只存在于训练阶段，不存在于生成阶段。 |
| Logits | “pre-softmax scores” | softmax 之前 LM head 的原始输出；sampling 就发生在这些值上。 |
| Temperature | “创造力旋钮” | 将 logits 除以 $T$；$T \to 0$ = greedy，$T \to \infty$ = uniform。 |
| Top-p | “Nucleus sampling” | 将分布截断为累计和 $\ge p$ 的最小集合；从剩余部分 sample。 |
| Min-p | “比 top-p 更好” | 保留满足 `p ≥ min_p × max_p` 的 tokens；会根据分布尖锐程度调整 cutoff。 |
| Speculative decoding | “draft + verify” | 便宜模型提出 N 个 tokens；大模型并行验证。 |
| Teacher forcing | “训练技巧” | 训练时输入真实的前一个 token，而不是模型的预测。每个 seq2seq LM 的标准做法。 |

## 延伸阅读

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) GPT-1。
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) GPT-2。
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 和 bağlam içi öğrenim
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) spesifik çözme 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 标准 causal-LM 参考代码。
