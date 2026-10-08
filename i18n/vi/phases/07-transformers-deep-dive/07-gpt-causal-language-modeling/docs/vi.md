# GPT  Mô hình hóa ngôn ngữ nguyên nhân

> BERT 能看到两侧──GPT 只能看到过去──三角面膜 là một trong những mã hóa ảnh hưởng sâu xa nhất trong AI hiện đại──

**Type:** Build
**Languages:** Python
**先修要求:**Giai đoạn 7 · 02 (Tự chú ý), Giai đoạn 7 · 05 (Tổng biến), Giai đoạn 7 · 06 (BERT)
**Time:** ~75 分钟

## 问题

mô hình ngôn ngữ  trả lời một vấn đề:给定前 `t-1`个 token, token `t`Sử dụng bài tập tín hiệu này, đó là dự đoán tín hiệu tiếp theo, bạn sẽ nhận được một mô hình có thể tạo ra một tín hiệu một lần ‒ tạo ra bất kỳ mô hình văn bản nào.

Để thực hiện các bài tập từ đầu đến cuối trong toàn bộ chuỗi, bạn cần để dự đoán từng vị trí chỉ phụ thuộc vào vị trí sớm hơn. Nếu không, mô hình sẽ thông qua việc tìm kiếm câu trả lời dễ dàng để lừa đảo.

Cái mặt nạ gây ra là điều này.`-inf`Các vị trí này sẽ trở thành 0... mỗi vị trí chỉ có thể tham dự đến vị trí của chính mình và sớm hơn... bởi vì bạn đã áp dụng nó một lần trên toàn bộ chuỗi, vì vậy một lần đi về phía trước sẽ có thể nhận được các dự đoán mã số tiếp theo của N 个 parallel ⋅

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2024), Claude, Llama, Qwen, Mistral, DeepSeek, Kimi   chúng là các biến đổi nhân quả chỉ có trình giải mã, vòng tròn cốt lõi giống nhau.

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### mặt nạ

给定长度为 `N`của chuỗi, xây dựng một `N × N`Matrix:

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

Trong softmax 之前,把 `M`+ đến điểm chú ý ban đầu`exp(-inf) = 0`, vì vậy, trọng lượng đóng góp của vị trí được che là 0, mỗi dòng của trật tự chú ý chỉ là phân phối xác suất vị trí trước.

实现成本: một lần `torch.tril()`调用――计算时间:纳秒级―― đối với toàn bộ lĩnh vực ảnh hưởng:一切――

### Không tập luyện, không tập luyện

训练: đối với toàn bộ `(N, d_model)`Dòng làm một lần đi trước, tính N 个 mất tích entropy chéo (cross-entropy) (đối với mỗi vị trí một), tìm kiếm, quay lại, đi lại, đi lại)

推理: 你个个代币 生成──输入 `[t1, t2, t3]`, nhận được`t4`❖ nhập khẩu`[t1, t2, t3, t4]`, nhận được`t5`❖ nhập khẩu`[t1, t2, t3, t4, t5]`, nhận được`t6` KV cache (Khóa học 12) 保存`t1…tn`Các trạng thái ẩn, vì vậy bạn không cần phải tính lại chúng ở mỗi bước. Nhưng khi suy nghĩ về chiều sâu của chuỗi = 输出长度.

### mất  chuyển đổi từng người

给定 token `[t1, t2, t3, t4]`- Có thể là:

- Nhập: `[t1, t2, t3]`
- Mục tiêu: `[t2, t3, t4]`

Đối với mỗi vị trí`i`,计算 `-log P(target_i | inputs[:i+1])`△求和── đây là sự thâm nhập chéo của toàn bộ chuỗi.

Bạn nghe nói mỗi biến thể LM đều sử dụng sự mất mát này  luyện tập  luyện tập trước  chỉnh sửa  SFT  mất mát tương tự, dữ liệu khác nhau 

### Chiến lược giải mã

Sau khi tập luyện, việc lấy mẫu là quan trọng hơn những gì người ta tưởng tượng.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

Trong năm 2026, đối với các mô hình trọng lượng mở, min-p + nhiệt độ 0,7 là một giá trị được xác định hợp lý.

### 让 GPT công thức 起作用的因素

1. **Decoder-only.**Không có mã hóa 开销. Mỗi cấp một lần.
2. **Scaling.**124M → 1.5B → 175B → nghìn tỷ. Quy luật quy mô của Chinchilla. Bài học 13 cho biết bạn làm thế nào để phân phối tính toán.
3. **In-context learning.**13B 时涌现. 模型无需细调就能跟随几次拍摄的例子.
4. **RLHF.**基于人类偏好后培训 把原始预训 文本模型转化为聊天助手──
5. **Pre-norm + RoPE + SwiGLU.**支大规模稳定训练──

Kể từ GPT-2, cấu trúc cốt lõi không thay đổi quá nhiều. Những thay đổi đáng chú ý thực sự xảy ra trong dữ liệu, quy mô và sau đào tạo.


```figure
causal-mask
```


```figure
mask-derivation
```

##  xây dựng nó

### 步骤 1: mặt nạ nguyên nhân

见 `code/main.py`一行代码:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Trong khi đó, nó được tăng lên điểm chú ý.

### 步骤 2: Một mô hình GPT 2 lớp

堆叠两个解码块(masked self-attention + FFN,无跨注意)。添加代币嵌入、位置编码 和无嵌入(与代币嵌入矩阵 绑定,这是自 GPT-2 以来的标准技巧)。

### 步骤 3: dự đoán tín hiệu tiếp theo,端到端

Trong một từ ngữ trò chơi 20 token 上, ở mỗi vị trí tạo ra logic.

### 步骤 4: lấy mẫu

实现贪欲、温度、top-k、top-p、min-p──在固定 prompt 上运行每种并比较输出──一个样本取函数只需要10 行──

## Sử dụng nó

PyTorch,2026 ngôn ngữ:

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

Ở tầng dưới,`generate()`运行前传,取出最后位置 logits,sample 下一个代币,添加它,然后重复──每个生产级LLM inference stack(vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX)都用重度优化实现同一个循环 批量预填、持续批量、KV cache paging、猜测解码──

**GPT vs BERT，各用一句话：**GPT 预测 `P(x_t | x_{<t})`│BERT 预测 │`P(x_masked | x_unmasked)`◊ mất quyết định liệu mô hình có thể được tạo ra không

## 交付 nó

见 `outputs/skill-sampling-tuner.md`◊ kỹ năng này sẽ được sử dụng cho nhiệm vụ thế hệ mới  chọn các tham số lấy mẫu, và cần xác định giải mã 时标记出来.

## 练习

1. **Easy.**运行 `code/main.py`,验证 softmax 后的因果注意矩阵是下三角的──抽查:第3 行应该只在第03 列有权重──
2. **Medium.**实现宽度为 4 的束搜索──在 10 个短提示 上比较束4 与贪的困惑──beam 总是会赢吗?
3. **Hard.**实现 định nghĩa phân tích: sử dụng mô hình 2 tầng nhỏ 作为草稿, sử dụng mô hình 6 tầng 作为验证器──测量 100 个长度为 64 个的完成 上的墙-钟速度──确认输出与验证器的贪输出匹配──

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
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 和 học tập trong bối cảnh
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) mã hóa spec 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 标准 nguyên nhân-LM 参考代码──
