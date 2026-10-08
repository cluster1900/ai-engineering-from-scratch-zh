# 原因语言建模

> 现在,我们可以看到两面.

**Type:** Build
**Languages:** Python
**先修要求:**转换器 (转换器) 转换器 (转换器)
**Time:** ~75 分钟

## 问题

语言模型 回答一个问题:给定前 `t-1`个代币,代币`t`通过这个信号训练,即下一个代币预测,你就会得到一个可以一次生成一个代币的模型.

为了在整个序列中进行端到端训练,你需要让每个位置的预测只依赖于更早的位置.

原因面具是这样做的.`-inf`值组成的上三角矩阵,在软max 之前加到注意力分数上. 软max 之后,这些位置将变成0――每个位置只能到达自身和更早的位置. 因为你把它一次性应用到整个序列上,所以一次性前进通过就能得到N 个并行的下一个标记预测.

它们都是仅用于解码器的因果变压器,核心循环相同――只是规模更大,数据更好,RLHF更好――

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### 面具

给定长度为`N`构建一个`N × N`矩阵:

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

在软max之前,把`M`增加到原始的注意力分数上.`exp(-inf) = 0`因此,被掩盖位置的贡献权重为零. 注意矩阵的每行都是对前位置的概率分布.

实现成本:一次`torch.tril()`调用――计算时间:纳秒级――对整个领域的影响:一切――

### 没有做训练,没有做推

训练:对整个`(N, d_model)`序列做一次前进传输,计算 N 个跨进进进损失,求和,回进传输.

推理:你个别的代币 生成.输入.`[t1, t2, t3]`得到了`t4`◎输入`[t1, t2, t3, t4]`得到了`t5`◎输入`[t1, t2, t3, t4, t5]`得到了`t6`│KV缓存12课 保存`t1…tn`由于这些隐藏状态,所以你就不必在每一步重新计算它们.

### 损失 变量

给定标志`[t1, t2, t3, t4]`其他:

- 输入:`[t1, t2, t3]`
- 目标:`[t2, t3, t4]`

对于每一个位置`i`计算`-log P(target_i | inputs[:i+1])`这就是整个序列的交叉化.

你听说的每一个变压器都用了这个损失训练――预训练――精调――SFT 损失相似,数据不同――

### 解码策略

训练后,样本选择比人们想象的更重要.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

在2026年,对于开放权重模型,min-p +温度0.7是合理的默认值――投机解码是任何生产推断堆的基本配置――

### 让 GPT 配方 起作用的因素

1. **Decoder-only.**没有编码器 开销. 每层一次注意力 + FFN 通过.
2. **Scaling.**124M → 1.5B → 175B →万亿――金智拉规模定律――13课告诉你如何分配计算――
3. **In-context learning.**模型不需要细节调整就能跟随几次拍摄的例子.
4. **RLHF.**基于人类偏好后培训 把原始预训练的文本模型转化为聊天助理.
5. **Pre-norm + RoPE + SwiGLU.**支大规模稳定训练

自GPT-2以来,核心架构没有发生过太大的变化.


```figure
causal-mask
```


```figure
mask-derivation
```

## 构建它

### 步骤1:因果性面具

见`code/main.py`〔一行代码〕

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

在软max之前把它加到注意力分数上.

### 步骤 2: 一个2层GPT型号

堆叠两个解码器块(掩盖自注意+FFN,无跨注意) ・添加代币嵌入、定位编码 和解嵌(与代币嵌入矩阵绑定,这是自GPT-2 以来标准技巧) ・

### 步骤3:下一个标志预测,端到端

在一个20代币玩具词汇上,在每个位置产生逻辑.针对一个目标的转移计算跨进力损失.

### 步骤4:采样

实现贪,温度,顶-k,顶-p,分-p. 在固定提示上运行每种并比较输出.

## 使用它

火,2026语法:

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

在底层,`generate()`运行前进传递,取出最后位置的逻辑,样本 下一个代币,添加它,然后重复.每个生产级LLM推断堆(vLLM,TensorRT-LLM, llama.cpp,Ollama,MLX) 都用重度优化实现同一个循环 批量预填,连续批量,KV缓存页面,投机解码――

**GPT vs BERT，各用一句话：**预测`P(x_t | x_{<t})`〔BERT〕预测`P(x_masked | x_unmasked)`◊损失决定模型是否能够产生――

## 交付它

见`outputs/skill-sampling-tuner.md`△这个技能将用于新一代任务 选择样本参数,并需要确定性解码 时标记出来.

## 练习

1. **Easy.**运行`code/main.py`验证软max 之后的因果注意矩阵是下三角的.抽查:第3 行应该只在第03 列中权重.
2. **Medium.**实现宽度为4的束搜索──在10个短提示上比较束4与贪的困惑──束总是会赢吗?
3. **Hard.**实现投机解码:使用微型2层模型作为草案,使用6层模型作为验证器.测量100个长度为64个完成.

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

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)GPT-1──
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)GPT-2──
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)GPT-3 和在环境中学习
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192)规格解码 论文──
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py)标准因果性-LM 参考代码――
