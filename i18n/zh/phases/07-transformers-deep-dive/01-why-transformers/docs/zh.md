# 为什么变革器 RNN的问题

> 转换器 一次处理所有代币. 之后,深度学习中每一个扩展曲线都发生了变化.

**类型：**学习 课程
**语言：**字符串
**先修要求：**基础学习 (深度学习),第5阶段·09阶段 (序列到序列),第5阶段·10阶段 (注意力机制)
**时间：**时间45分钟

## 问题

在2017年之前,地球上每一个最先进的序列模型语言"",翻译"",语音都是重复的神经网络――LSTM和GRU在相当于ImagenNet的翻译基准上统治了半十年――它们是当时所有者唯一可用的工具――

它们有三个致命的弱点. 顺序计算意味着你不能沿时间轴并行行化:Token`t+1`需要来自代币`t`隐藏状态――一个1024代码序列意味着在每周期内可以执行1,000,000次浮点操作的GPU上进行 1,024个串行步骤――在为并行设计的硬件上,训练的墙钟时间会随序列长度线性增长――

消失梯度意味着50个代币 之前的信息已经被压缩到50层非线性. 关闭的复发单位 (LSTM,GRU) 缓解了这种压缩,但从未消除了它.

固定宽度的隐藏状态意味着编码器会在解码器 看到任何内容之前,把整个源序列挤进单个向量――源是5个代币 还是500个都无关紧要;瓶始终是相同的形状――

2017年论文 注意力是你需要的 提出了一个激进的想法:彻底抛弃复发――让每个位置并行地参加到每个其他位置――用一次大型矩阵乘法训练而不是1024次顺序计算――

到2026年,这个结果已经主导了所有模式.语言:GPT-5,Claude 4,Llama 4) 视觉:ViT,DINOv2,SAM 3) 音频:Whisper) 生物学:AlphaFold 3) 机器人:RT-2:

## 概念

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Recurrence 是瓶颈。**计算`h_t = f(h_{t-1}, x_t)`,每一步都取决于前一步.`h_4`之前计算`h_5`在拥有1万+的现代GPU中,将浪费99%的面积在长序列中.

**Attention 是广播。**自我注意会为每对`(i, j)`同时计算`output_i = sum_j(a_ij * v_j)`△整个N×N注意力矩阵会在一次批量中填满──没有任何步骤依赖另一个步骤──GPU 喜欢这一点──

**加速不是常数。**它是`O(N)`连续深度和`O(1)`在实践中,在N=512和硬件相同的情况下,变压器每时代的训练速度快510×;随着序列长度增加,差距将继续扩大,直到触及注意力`O(N²)`闪光注意 后来修复了这一点见第12课.

**transformers 的代价。**按 注意力记忆`O(N²)`扩展──2K背景 没问题──128K背景 则需要滑窗──RoPE外分──Flash 注意,或线性注意变量──回复 在时间和内存上都是`O(N)`转变器用内存换时间,然后通过并行性把时间赢回来.

**Inductive bias 的转变。**转变器不做假设 每个位置都是注意的候选人. 这就是为什么转变器需要更多的数据才能训练得好,但一旦拥有足够的数据就能扩展得更远.


```figure
rnn-vs-parallel
```

## 构建它

没有神经网络,我们用数值模拟核心瓶子,让你在笔记本上感觉到差距.

### 步骤1:测量连续深度

见`code/main.py`我们构建两个函数. 一把序列编码为加法链. 一行,类似于RNN. 一个把它编码为并行规约.

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

我们对长度最高的100,000序列分别计时.RNN版本是O(N),并且使用单个CPU管道.即使在纯Python中,注意力式降低在长度≥1000时也会胜出,因为Python的`sum()`代代不会在每一步都产生解释器开销.

### 步骤 2: 计算理论操作

两个算法都做N 次加法――区别在于 *依赖深度*:在下一步能够开始之前,有多少操作必须顺序发生――RNN深度 = N――注意深度 = log(N),如果使用树缩小;或者在平行扫描中为 1――决定GPU 时间是深度,而不是操作次数――

### 步骤3:长序列上的经验扩展

我们打印了一个时间表,让O(N) 差距变得可见. 在2026年Mac笔记本上,少于1,000个元素的序列太快,难以测量.100,000个序列将显示出清晰的线性扫描.将其扩展到16,384个Token变压器,并与12层LSTM等价格模型相比,你就会明白为什么训练墙钟在2016年是一个阻碍因素.

## 使用它

2026 年什么时候仍然选择RNN:

| 情况 | 选择 |
|-----------|------|
| Streaming inference，一次一个 Token，常量内存 | RNN or state-space model (Mamba, RWKV) |
| 超长序列（>1M tokens），Attention memory 爆炸 | Linear attention, Mamba 2, Hyena |
| 没有 matmul accelerator 的 edge device | Depthwise-separable RNN 在 FLOPs/watt 上仍然胜出 |
| 其他任何情况（训练、batched inference、最高 128K 的 context） | Transformer |

像Mamba这样的国家空间模型 (SSM) 质上是带有结构化参数化的RNN,使它们具有两种优势:`O(N)`通过选择性扫描进行并行训练.它们以更好的长文本扩展恢复了90%的变压器质量. 到2026年,大多数边界实验室都在训练混合SSM+变压器模型.例如,Jamba,Samba) 重复并没有死亡,它是一个组件.

## 交付它

见`outputs/skill-architecture-picker.md`△该技能将根据长度,产量和培训预算的约束,为一个新的序列问题选择架构.

## 练习

1. **简单。**从`code/main.py`中取出`rnn_style`测量量量,变换为长度为64个隐形状态.
2. **中等。**使用纯Python 实现并行前-总数 (Hillis-Steele扫描) 验证它在长度1024 时产生与序列扫描相等数值输出――计算深度――
3. **困难。**转移到 GPU 上的 PyTorch──随序列长度从64扫到65,536对两者计时──绘图并解释曲线形状──

## 关键术语

| 术语 | 人们常说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Recurrence | “RNNs 是顺序的” | step `t` 依赖 step `t-1` 的计算方式，迫使执行沿时间轴串行进行。 |
| Serial depth | “图有多深” | 依赖操作的最长链；即使在无限硬件上也会限制 wall-clock。 |
| Attention | “让 Tokens 彼此查看” | Weighted sum `sum_j a_ij v_j`，其中 `a_ij` 来自位置 i 和 j 之间的相似度分数。 |
| Context window | “模型能看到多少” | 一个 Attention layer 可作为输入的位置数量；quadratic memory cost 在这里扩展。 |
| Inductive bias | “架构内置的假设” | 关于数据形态的先验；CNNs 假设 translation invariance，RNNs 假设 recency。 |
| State-space model | “背后有代数的 RNN” | 为通过结构化 state-space matrices 实现并行训练而参数化的 recurrence。 |
| Quadratic bottleneck | “为什么 context 这么昂贵” | Attention memory = 序列长度上的 `O(N²)`；Flash Attention 隐藏的是常数，而不是扩展规律。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) 这篇论文终结了主流NLP中重复的情况.
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)注意的诞生,当时它被连接到RNN上.
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) 原始 LSTM 论文,作为记录.
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752)对变压器的现代复制答案
