# 差异性注意力 (V2)

> 软max注意会在每个不匹配的代币上分散少量概率. 在100k个代币上,这些噪音会积累并淹没信号. 差异变压器 (Ye et al., ICLR 2025) 通过将注意计算为两个软max差来解决这个问题,从而减轻共享噪音下限.

**类型:**构建
**语言:**字符串 (stdlib)
**前置要求:**阶段7 · 02 (自我注意),阶段7 · 15 (注意变体),阶段10 · 14 (建筑步行)
**时间:**时间60分钟

## 学习目标

- 准确说明为什么软max注意力 存在噪音下限,以及为什么随着环境长度而增长.
- 推导差异关注 公式,并解释为什么相减会抵消共享噪音成分,同时保留信号――
- 讲解V1到V2的差异:哪些部分更快,更简单,更稳定,以及为什么每次生产阶段预训练的变化都是必要的.
- 通过纯Python实现差异关注,并进行合成的信号加噪声查询 上实证验证噪音抵消特性.

## 问题

标准软max 注意,有数学性质,在规模变大时会变成工程上的麻烦.`q`关注权重是`softmax(qK^T / sqrt(d))`‧软max 永远无法产生精确的零值 每个不匹配的代币都会得到一些正确的质量──这个残余质量就是噪音,并且会随着背景长度扩大── 在128k 个代币下,即使每个不匹配的代币只获得0.001%的概率,127,999 个代币一起也将贡献约12%的总量──模型必须学会绕开一个随着背景的噪音下限──

在实证上,这表现为注意力头 干扰:长文本RAG 中的幻觉引用、100k-Token 检索任务中失败,以及针头在草中的基准在32k以上后出现的细微精确度下降.

由于DIFF V1有三个问题,使其无法进入前沿预训练管道. 它的值缓存在每个解码步骤都必须加载两次,它需要自定义CUDA内核,破坏了FlashAttention 兼容性,而且其每人RMSNorm在70B以上的长期训练中会导致不稳定.

## 核心概念

### 软max 的噪音下限

对于查询`q`和钥匙`K = [k_1, ..., k_N]`关注权重是:

```
w_i = exp(q . k_i / sqrt(d)) / sum_j exp(q . k_j / sqrt(d))
```

没有任何东西`w_i`如果是零.`k_i`与`q`完全无关,分数`q . k_i`也不是零波动,它会围绕零波动,方差为`||q||^2 / d`经过软max正常化后,每个无关代币仍将向加权和贡献`O(1/N)`△无关 标志的总贡献是 `O((N-1)/N) = O(1)`这不是一个小量.

模型想要的更像是硬顶-k:在匹配代币上给高权重,在其他位置接近零――软max 过于平滑,无法直接做到这一点――

### 差异性思路

将每个头的Q和K投影分成两部分:Q = (Q_1,Q_2),K = (K_1,K_2);;计算两个注意地图:

```
A_1 = softmax(Q_1 K_1^T / sqrt(d))
A_2 = softmax(Q_2 K_2^T / sqrt(d))
```

输出:

```
DiffAttn = (A_1 - lambda * A_2) V
```

相减会抵消两个地图 共享任何噪音分布. 如果两个地图上127万个无关标志上有近似均重权 (随机初始化确实如此),这些部分将相互抵消.

`lambda`每个头都能学习的标志量,参数化为`lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`,它可以为负.`lambda_init`默认是类似于 0.8 的小正数.

### 为什么这像带头的噪音抵消

可以把它想象成两个有噪音的麦克风在同一声音中录音. 它们都会录音说话者以及相关的背景噪音. 从一个信号减去另一个,共享噪音就会下降. 声音可以保留,因为两个信号在相位或幅度上有足够的差异,不会被完全抵消. 每个头部的.`lambda`现在,我们需要一个平衡的方法.

### 差异

V1 保持与基线变压器相等的参数――为了让每个头有两个查询,它将头维度减半――这牺牲了头的表达能力,更痛苦的是,还让每个头的值缓存减半――解码 每一步都必须加载值缓存 两次(每个软max分支一次) ――结果:尽管参数相同,解码仍然比基线慢――

后,额外维度将被投影回去,以匹配基线变压器的O_W投影──三件事同时发生:

1. 解码速度与基线的速度 持平(KV缓存只加载一次)
2. 没有需要自定义内核) 』
3. 解码时的算术强度 提高(每次从HBM加载字节 时对应更多计算)

在70B级预训练规模下,该RMSNorm将使后期训练不稳定. V2使用更简单的初始化方案替代它,保持训练稳定,而不增加额外模块.

### 什么时候使用它

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | 更干净的 Attention maps，更少幻觉引用 |
| Needle-in-haystack benchmarks | 32k 之后 accuracy 显著提升 |
| Multi-document QA | 更少跨文档干扰 |
| Code completion at 8k | 收益有限，不值得改变 architecture |
| Short chat (< 4k) | 基本与 baseline 不可区分 |

收益随着背景长度 增长而增加. 在4k标志下,噪音下限足够小,标准注意力 已经可用. 在128k下,它将开始显著伤害效果.

### 它如何与其他2026个扣搭配

| Feature | Compatible with DIFF V2? |
|---------|------------------------|
| GQA | 是（V2 增加 Q heads，而不是 KV heads） |
| MLA (DeepSeek) | 原则上是，但尚无公开论文将二者结合 |
| MoE | 是（Attention 独立于 MLP block） |
| RoPE | 是（不变） |
| YaRN / long-context scaling | 是（正是 DIFF 最有帮助的场景） |
| FlashAttention | 是，V2 支持（V1 不支持） |
| Speculative decoding | 是（Attention 改动对 spec-decode loop 不可见） |


```figure
differential-attention
```

## 构建它

`code/main.py`通过纯Python实现了差异性关注. 有已知信号加噪音结构的玩具查询,可以让你直接测量噪音抵消率.

### 步骤1:标准软max注意

子矩阵操作:列表列表,手写矩阵,带最大值相减以保证数值稳定性软max.

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### 步骤2:将Q、K 拆成两部分

风格:将头寸 减半──V2风格:保持头寸,并将头寸 数量加倍──玩具实施 为了教学清晰使用 V1数学完全相同,只有会计不一样──

### 步骤3: 两个软分 + 相减

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

注意:输出权重可以为负. 这没有问题.

### 步骤 4: 噪音抵消测量

构建一个长度为1024的合成序列――将信号标志 放置在已知位置,其余位置填充噪声――计算 (a) 标准软max 注意力 在信号位置上的权重,以及 (b) 差别注意力 权重――测量两者的信号-噪音比率――根据两个分支训练到多大程度产生差异,DIFF注意力通常能稳定产生高出3x-10x的信号-噪音比率――

### 步骤 5: V1 vs V2 参数核算

给定一个配置,打印:

- 基线变压器:Q、K、V 各自大小为`hidden * hidden`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
- ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`hidden * hidden`,我很小.`hidden * hidden`头部,头部,头部,头部.`lambda`参数(O(头 * d_头))
-       `2 * hidden * hidden`,K大小为`hidden * hidden`,我很小.`hidden * hidden`△额外维度会在O_W前投影回去──增加相同的`lambda`参数.

玩具 会测量 V2 的额外参数成本(大约每个注意区块 额外 `hidden * hidden`),并打印出来──

## 使用它

截至2026年4月,DIFF V2 尚未在每个生产推断服务器中发布,但vLLM 和 SGLang 正在推进集成.

- 微软内部长文 生产模型
- 许多面向256k+背景的开放模型训练运行中的研究复现.
- 将DIFF注意与滑动窗口注意在交换层上组合的混合架构.

你会在2026年选择它的场景:

- 从零训练一个目标为64k+有效的背景的新模型. 从一开始加入差异关注;之后重新训练成本很高.
- 在Q预测上做LoRA可以接近DIFF结构.

你不会选择它的场景:

- 你正在服务一个长文本的性能稳定的预训练密集模型――对现有重量来说,重新训练成本通常很难回来――
- 你的环境总是低于16K.

## 交付它

本课会生成`outputs/skill-diff-attention-integrator.md`△给定一个模型架构,目标背景长度,幻觉配置文件和培训预算,它将产生一个集成计划,用于把差异性注意力 加入新的预训练运行或LoRA细节调.

## 练习

1. 运行`code/main.py`△验证在合成查询上,差异性注意力 报告的信号-噪音比 高于标准软max 注意力――改变噪音幅度,并显示标准注意力 变得不可用的交叉点――

2. 对一个7B级模型 (隐藏=4096,头=32,头=128,32层),计算从基线到DIFF V1以及从基线到DIFF V2的参数变化.

3. 阅读DIFF V1论文 (ArXiv:2410.05258) 第3节,以及DIFF V2 Hugging Face博客第2节.

4. 实现一个放弃:分别用`lambda = 0`(纯第一软max) 和`lambda = 1`测量信号-噪音 如何随着变化扫描 寻找出能最大化信号-噪音 的 `lambda`,我知道.

5. 将玩具扩展到GQA + DIFF V2──选择8个KV头和32个Q头──展示KV缓存尺寸与相同 (8,32) 配置的基线GQA模型匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Differential attention | “两个 softmax 相减” | 将 Q、K 拆成两半，计算两个 softmax maps，从第一个中减去第二个（由 lambda 缩放），然后乘以 V |
| Noise floor | “softmax 的非零尾部” | Softmax 放在每个无关 Token 上的 O(1/N) 权重，在 long contexts 中会累加到 O(1) |
| lambda | “相减的缩放系数” | 每个 head 的可学习标量，参数化为 `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`；可以为负 |
| DIFF V1 | “ICLR 2025 版本” | 原始 Differential Transformer；将 head dim 减半以保持参数量，需要 custom kernel，decode 更慢 |
| DIFF V2 | “2026 年 1 月修复版” | 在保持 KV heads 的同时将 Q heads 加倍；decode speed 与 baseline 持平，并兼容 FlashAttention |
| Per-head RMSNorm | “V1 稳定器” | V1 在差分之后应用的额外 norm；V2 移除了它，以避免后期训练不稳定 |
| Signal-to-noise ratio | “有多少 Attention 被浪费了” | 真实 signal 位置上的权重与无关位置平均权重之间的比率 |
| Lost in the middle | “Long-context failure mode” | 一个实证现象：长 context 中间位置文档的检索 accuracy 会下降——DIFF attention 可以缓解这一点 |
| Arithmetic intensity | “每加载一个 byte 对应多少 FLOPs” | V2 在 decode 时通过每次 KV 加载对应双倍 queries 来提高的比率；对 memory-bound decode 很重要 |

## 延伸阅读

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) 原始论文,包含噪音抵消理论和长文本的废词
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) 面向生产的重写版本,匹配基线解码,并兼容FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333)关于为什么减速能恢复预训练注意力 结构理论分析
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900)参数共享变体
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) DIFF 所相减的基线变压器
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) 长文本基准面向的DIFF关注
