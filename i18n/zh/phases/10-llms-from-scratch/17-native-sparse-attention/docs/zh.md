# 专注于本地节省 (深度搜索 NSA)

> 在64k代币下,注意力会吞70-80%的解码延迟.每个开放模型实验室都有修复方案.DeepSeek的 NSA(ACL 2025最佳论文) 是真正的稳定脚跟方案:三个并行注意力 分支,即压缩后粗粒度代币.选择性保留的细粒度代币,以及用于本地背景的滑动窗口,通过学习门组合在一起. 它是硬件对齐的 (内核友好的) √原生训练的 (可同时用于预训练,而不是在推测时外),并且在64k代码上,它比FlashAttention更快,达到或超过注意力质量. 本端将挂到构建这三个分支,展示为什么这种稀疏性可以在端子上微分.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## 学习目标

- 告诉我们, NSA的三个注意力分支,以及每个分支抓取什么信息.
- 解释为什么 NSA 是可以训练的,而之前的稀疏注意方法只能用于推断.
- 在64k背景下下,根据压缩块大小和选择顶-k,计算NSA相比全注意的注意力计算节省量――
- 在一个短的合成序列上,使用Stdlib Python 实现三分支组合,并验证了盖тинг权重的行为.

## 问题

序列长度为 N 时,Full attention 的时间成本是 `O(N^2)`按,每层KV缓存是`O(N)`在64k代币下,计算和内存带宽 数字都非常灾难性. 在NSA论文中的理论估计测量值显示:在64k下,注意力占总解码延迟的70-80%──后续所有指标,包括TTFT、代币/秒、每百万代币 成本,都被注意 成本主导──

稀疏注意是显而易见的答案――此前尝试大致分为两类――固定的模式稀疏性 (滑窗,步骤,区块本地) 将丢弃信息,并失败于长距离回忆任务―― 输入时间稀疏性 (KV缓存剪切、H2O、StreamingLLM) 应用于密集注意力上预训练的模型,只能恢复潜在的加速的一小部分,因为模型从未被要求通过稀疏模式 路由信息――

等,深度搜索+PKU+UW,ACL 2025最佳论文, arXiv:2502.11089) 两者兼具:模型在预训期间学习的稀疏性模式,以及一个核对齐的算法实现,使其在推断时真正交付计算节省.

## 概念

### 三个行分支

对于每一个查询,NSA会针对KV缓存的三种不同的视图运行三次注意:

1. **Compressed branch.**标志被分组为大小为`l`通过一个小型的学习MLP,每个块将被压缩成单个总结代币.

2. **Selected branch.**使用压缩分支的注意力分数,识别出与当前查询 最相关的顶级k块──读取这些块中细粒度(未压缩) 符号,然后查询会参加到所有这些符号──可以把压缩分支的注意力看作选择的路由信号──

3. **Sliding-window branch.**查询会参加到最近的`W`个标志 (通常为 512),用于本地环境.

通过学习的位置门组合:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win`它们不必加加为1,可以独立对各分支加权而产生.

### 为什么这可以被训练?

选择步骤 () 是离散的.离散操作会破坏渐进流程.

NSA 绕开这一点:压缩分支注意本身就是作用于整个序列的可微粗粒度注意点.`top_k`操作在前向计算图上是无运行,它只控制哪些块会从内存中加载.

这就是NSA能够端到端用于预训练的原因.模型将联合学习如何通过三个分支路由信息,产生稀疏的模式,并推断真正交付承诺的速度.

### 硬件对齐的内核

NSA的内核是为现代GPU内存层次结构设计的.内核按GQA组加载查询(外环),为每个组获取应对稀少的KV块(内环),并在SRAM上运行注意.由于每个查询组看到相同的选定的块,选择是每个查询组,而不是每个查询头,KV加载会在组内摊销――算术强度保持在较高水平――

论文报告称,Triton 核在 64k 解码上比 FlashAttention 快 9x,并且速度比 会随序列长度增长――前进和后退的核 均已提供――

### 计算预算

让`N`为序列长度,`l`为了压缩块的尺寸,`k`为顶级选项计数,`w`为了滑窗,`b`为选择区块大小通常等于`l`

- 压缩分支:每个查询有`O(N/l)`个关键,因此总计`O(N * N / l)`,我知道.
- 选择分支:每个查询有 `O(k * b)`个关键,因此总计`O(N * k * b)`,我知道.
- 滑动分支:每个查询有`O(w)`个关键,因此总计`O(N * w)`,我知道.

总计:`O(N * (N/l + k*b + w))`,我知道.

当 当`N = 64k, l = 64, k = 16, b = 64, w = 512`查询的成本为`1000 + 1024 + 512 = 2536 keys`◎ 完全注意`64000 keys`△计算减少25倍

当 当`N = 128k, l = 64, k = 16, b = 64, w = 512`查询的成本为`2000 + 1024 + 512 = 3536 keys`◎ 完全注意`128000 keys`△减少36倍. 收益随着序列长度的增长而增加,这正是它的核心意义.

### 如何比较

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

根据"月球镜头"的同时发布,也采用了类似的三胜过一个的思路,将"月球镜头"的原则应用到注意力区块中.


```figure
sliding-window-attention
```

## 构建它

`code/main.py`在一个短的合成序列实现三个分支,并展示:

- 为了教学清晰,使用一个简单的平均积分基线;真实NSA使用学习的MLP) 』
- 由压缩分支分数驱动的顶级k区块选择.
- 最近`w`个标志 上的滑窗注意力――
- 封闭组合
- 完全注意比较计算图纸的打印.

### 步骤1:将代币压缩成块

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 步骤 2: 压缩分支注意

运行查询 针对压缩键的软max 注意量――压缩分支分数 同时作为顶级k选择的信号――

### 步骤3: 顶级k区块的选择

选择最高分数`k`个压缩块的索引.

### 步骤 4:滑动窗口注意

取最后`w`个标志,并针对它们运行标准注意.

### 步骤 5: 门 + 结合

输出量为输出量为三个分支.

### 步骤 6:计算计算

打印每分支,每次查询的关键 数量以及总数.`N`在一个1024-Token 合成序列上,使用 `l = 32, k = 4, w = 128`美国国家安全局每次查询都会看到`32 + 128 + 128 = 288`个键,而全注意力是1024个,减少3.5x.

## 使用它

截至2026年4月,公众推断堆 中的集成状态:

- **DeepSeek internal**美国国家安全局或其后的DSA (Deepseek Sparse Attention)
- **vLLM**开发实验性NSA支持.
- **SGLang**美国国家安全局发布了国家安全局的基准;生产路径跟随了全局的发展.
- **llama.cpp / CPU**没有支持; 在CPU吞吐量下,内核分解的开销不值得.

什么时候使用 NSA:

- 面向64k以上的背景,并且有严格的计算预算的预训或继续训练运行.
- 对于深度搜索的长文本检查点进行推断. 这些权重是NSA原生.

什么时候不要使用:

- 现有密集关注预训练模型──没有持续训练,无法后备NSA──
- 环境低于16k──三分支开销会超过省收益──
- 批量-1互动聊天――延迟敏感的解码会受益,但只在长时间的背景下下成立――

## 交付它

本课会产出 `outputs/skill-nsa-integrator.md`△给定一个长文本预训练运行规范,它会产生一个NSA集成计划:压缩块大小,顶-k滑窗口,门 MLP宽度,内核选择,以及用于证明架构变得更合理的具体长文本评估.

## 练习

1. 在1024-代码 合成序列上运行`code/main.py`在三个预设上扫`(l, k, w)`并打印计算数量――找出在针头-在-haystack测试上保持对完全关注 95% 提醒同时,每个查询键数量 最低的预设――

2. 将平均池压缩机换成一个小的学习MLP(2层,隐藏 32)──在一个信号是块 平均值的合成任务上训练它──测量它在持有数据上对平均池基线的困惑差距──

3. 实现门 MLP──它以查询作为输入,输出三个尺度──显示门的行为是合理的:在随机查询上接近均的权重;当查询中命中远之前的区块时,给选择的分支更高权重──

4. 计算NSA启用70B模型在128k背景下 下的KV缓存内存预算──KV头为 8,头暗为 128,BF16──与全重视以及MLA──10期 · 14期显示MLA的数字)进行比较──找出NSA的细粒度分支KV缓存等于全重关注序列长度──

5. 阅读 NSA论文(arXiv:2502.11089) 第4节,并用三句话解释为什么压缩分支的注意力分数将被重复用于顶级选项,而不是计算一个单独的路由分数――将答案关联到渐进流量――

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | “粗粒度视图” | 在 block-averaged keys 上做 Attention，以每个 query `O(N/l)` 个 keys 提供 global context |
| Selected branch | “Top-k blocks” | 在 compressed-branch scores 最高的 `k` 个 blocks 上做细粒度 Attention |
| Sliding window | “Local context” | 在最后 `W` 个 Token 上做 Attention，以捕获短程模式 |
| Native trainability | “打开 sparsity 进行 pre-train” | sparsity pattern 在 pre-training 期间学习，而不是在 inference 时外挂 |
| Compression block size l | “粗粒度视图的 group size” | 多少个 Token 被合并成一个 summary；通常为 32-64 |
| Top-k | “要保留的 blocks” | 读取其未压缩 Token 的 compressed blocks 数量；通常为 16 |
| Sliding window W | “Local attention radius” | 通常为 512；更短会损害 local coherence，更长会浪费计算 |
| Branch gate | “如何混合三个分支” | per-position MLP 输出，对三个分支的贡献加权 |
| Hardware alignment | “Kernel-friendly sparsity” | 选择 sparse pattern，使实际 GPU kernel 能达到理论 speedup |
| DSA | “NSA 的后继者” | Deepseek Sparse Attention，DeepSeek 系谱中继 NSA 之后的架构 |

## 延伸阅读

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089)论文
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) NSA 面向的架构家族
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) 同期工作,针对区块的MOE风格注意
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150)滑窗 起源
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) NSA 改进的推断时间稀缺度基线
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691) NSA 核在 64k 下击败的全注意力基线
