# 多代币预测 (MTP)

> 从GPT-2到Llama3,每个自归LLM在每个位置都基于一个损失 训练:预测下一个代币――DeepSeek-V3在每个位置增加了第二个损失:预测再后面的代币――额外的14B参数――在671B模型上) 通过渐进流被蒸回主模型,而训练好的MTP头脑在推理中被重新用于猜测解码草稿人,接受率超过80%――1.8× 生产吞吐量几乎是免费的.本课程将基于DeepSeek 报告技术构建序列MTP模块,计算损失和头部,并解释为什么MTP保留了因果链,而Gloeckle等最初的并行MTP破坏.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04（预训练 mini GPT）、Phase 10 · 15（speculative decoding）
**Time:** ~60 分钟

## 学习目标

- 解释MTP 训练目标,并推导不同预测深度 上的关节损失──
- 解释Gloeckle等的平行MTP头2024) 与DeepSeek-V3的序列MTP模块之间的区别以及为什么序列设计能保留因果链──
- 计算在预训运行中加入MTP模块的参数和内存开销
- 从零实现一个MTP模块:共享嵌入,按深度变压器块,投影和共享输出头.

## 问题

接下来的代币预测是标准的LLM训练目标. 每个隐藏状态都被监督来预测唯一一个事物:紧随其后的代币.这是一个意料不到的弱信号.序列中的大部分信息都延伸到一个代币之外:结构,一致性,事实性,算术流程.

 MTP提出的问题是:如果每个隐藏状态都被监督一次预测多个未来代币会怎么样?Gloeckle et al. (Meta, 2024) 证明这有帮助.

根据预测深度的每一个模型上保留因果链.`h_i^(0)`预测`t+1`然后从新的隐藏状态.`h_i^(1)`预测`t+2`现在,`h_i^(1)`结合了`h_i^(0)`和 `E(t+1)`嵌入,根据此类推. 每个深度都有自己的小型变压器块. 分享嵌入和共享输出头. 让参数开销保持在适中范围. 在DeepSeek-V3的规模下,MTP模块在671B主模型权重上增加了14B参数.

本课程从零构建单个MTP模块和D-深度损失――数学很整洁――实现约150行――

## 核心概念

### 连续MTP配方

探V3 在主模型上添加`D`个MTP模块──每个模块`k`(其中之一)`k = 1..D`)预测深度 `k`标志,也就是在给定位置.`i`的前 时预测 `t_{i+k}`,我知道.

模块`k`包含:

- 一个变压器块`T_k`让自己有自己的注意力和MLP.
- 一个投影矩阵`M_k`将前一深度隐藏状态与下一深度的真实地标的嵌入结合起来.
- 共同嵌入`E`(与主模型相同)
- 共享输出头`Out`(与主模型相同)

训练时,对于截至位置`i`的前,按深度隐藏状态为:

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

预测为:

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

对于基本的真理而言,`t_{i+k}`它们的交叉性:

```
L_k = CE(logits_{i+k}, t_{i+k})
```

跨深度的关节损失:

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda`是一个较小的权重因素,深度搜索V3 在训练前10% 使用0.3,之后使用0.1──总训练损失为`L_main + L_MTP`,我知道.

### 为什么是连续的,而不是平行的

格洛克尔最初的平行MTP有D 个输出头,每个都直接应用到`h_i^(0)`每个头都从同一骨隐藏状态`t_{i+k}`,你可以正常训练,但这些预测并不是相互条件.`head_1`输出帮助`head_2`这些头是发射的.

根据 DeepSeek-V3 的序列设计`h_i^(k-1)`加上实际下一个代码嵌入`E(t_{i+k})`构建`h_i^(k)`为了预测,`t_{i+k+1}`深度`k+1`模块会看到`t_{i+k}`处的内容──这与自归解码器的结构相同,因此MTP模块可以直接作为投机解码草稿人使用──

推理时:将`h_i^(k-1)`和草拟出`t_{i+k}`输入模块`k+1`得到对`t_{i+k+1}`这正是EAGLE类型的草案,只是使用训练好的MTP模块作为草案网络.

### 参数核算

为了隐藏的原因`h`、词表为`V`的模型:

- 主模型:数十亿参数,加上一个大小为`V * h`输出头
- 共有输出头:复用主模型的头――没有额外参数――
- 共享嵌入:复用主模型的嵌入.
- 每个MTP模块:
  - 投影`M_k`其他:`(2h) * h = 2h^2`,我知道.
  - 变压器块`T_k`关注`4h^2`)加 MLP(SwiGLU 且比例为 8/3 时通常为`8h^2`,每一个街区`12h^2`,我知道.

每个模块的总额外参数:`~14h^2`对于深度搜索V3 的`h = 7168`,D = 1 模块:纸面上是`~14 * 7168^2 = ~720M`参数――DeepSeek-V3 报告是14B,差异主要来自MTP模块中专家层,也采用MoE──

### 投机解码回报

在预训期间,MTP模块会让训练变得慢约10% (更多的前进计算,额外损失) ⋅回报有两方面:

1. 密集训练信号――每个隐藏状态都看到D+1 监督目标――在MMLU、GSM8K、MATH、HumanEval 上测量效果:DeepSeek-V3的消融实验中稳定的几百分点提升――

2. 推理时免费的投机解码草案――MTP模块已被训练预测下几种代币――再使用网络草案时,它可以达到80%+的接受率――在这个水平下,N=3或N=5的规格解码可带来1.8×吞吐量――10%的训练成本将在第一次运行推理时开始回本――

### 与的关系

在预训练后单独训练一个小型草案模型.MTP将草案进入预训练.

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | 预训练之后 | 预训练期间 |
| Backward-compatible with existing weights | 是 | 否（需要重新训练） |
| Draft params | 1-2 个 transformer layers | 1 个 transformer block + projection |
| Acceptance rate | 0.88-0.92 | depth 1 时 0.80+ |
| Benefit beyond speedup | 仅 speculative decoding | 更密集的训练信号 + 加速 |


```figure
multi-token-predict
```

## 构建它

`code/main.py`端到端构建一个MTP模块:共享嵌入,投影,变压器区块,共享输出头.然后它会在一段简短的合成序列上计算每深度交叉缩损失,并按组件打印参数.32个代币的玩具词汇让数字更容易阅读.

### 步骤1:共享嵌入表

一个`vocab_size x hidden`面积的每个 MTP 模块都是共同使用的.

### 步骤2:每深度组合

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

真正的深度搜索V3会经历RMSNorm的两次向量缩写为`[2h]`没有一个.`h x 2h`矩阵投影. 这个玩具,为了简洁,用向量加法来代替.

### 步骤3: k 的变压器块

在玩具中,一个单层线性注意力区块和一个SwiGLU MLP 让结构可见,同时避免使用 numpy。

### 步骤4:共享输出头

复用主模型的输出投影――输出覆盖词汇的逻辑――

### 步骤5:每深度损失

对于抵消的情况`k`处基础真相符号的交叉化──使用`lambda / D`缩放因子跨深度聚合

### 步骤 6:参数核算

打印总参数量、共享的(嵌入式、头)参数量,以及每模块额外参数量──展示MTP额外参数与主模型大小的比例──

## 使用它

已集成到DeepSeek-V3 (上海) 和DeepSeek-R1系列中.

- 深度搜索自己的服务堆 可开箱即用地将MTP模块作为投机解码器 使用。
- 截至2026年4月,vLLM 和 SGLang 已有深度寻找-V3 MTP的集成路径──
- AMD的ROCm SGLang教程展示了一个具体的MTP猜测解码配置,并在V3检查站上测得1.8×加快.

在新的预训运行中使用MTP的场景:

- 你控制了完整的预训练管道,并希望先获得更密集的训练信号.
- 你知道自己会大规模服务这个模型,并希望免费获得猜测解码.
- 在1B规模下,销售损失通常超过收益.

不适合使用的场景:

- 对现有预训密集模型进行细节调整.
- 研究模型中你希望有一个干净的基线进行对比.

## 交付它

本课会生成`outputs/skill-mtp-planner.md`△给定一个预训运行规格 (模型大小、数据、计算),它将返回一个集成的MTP方案:深度 数 D、`lambda`时间表,内存开销以及推理时的投机式解码线程.

## 练习

1. 运行`code/main.py`△显示与合成信号 增强,每深度损失 单调下降──修改合成,使其使用固定模式,并验证深度-1 和深度-2损失 都会收──

2. 计算一个密集的70B模型 (隐藏于8192.80层) 在D=1MTP模块下面的参数开销――与DeepSeek-V3报告的14B开销进行比较――解释为什么DeepSeek的数字更高:MTP变压器块继承了相同的MoE结构,从而增加了每个模块的参数――

3. 在玩具中实现D=2:添加第二个MTP模块,接收h^(1) 并预测 `t_{i+2}`验证联合损失和参数核算与深度搜索论文的方程19-21匹配.

4. 将玩具换为平行MTP (Gloeckle-style):在主隐藏状态上添加D个输出头,每个预测不同的偏移――测量在同一个合成信号上,每个深度的损失与序列版本相比如何――对于 k > 1,序列版本应产生更低的深度损失,因为它在中间预测为条件――

5. 将训练好的MTP模块用作EAGLE样式的草案:推理时调用模块 k 来提出`t_{i+k}`△在延续的序列上,测量这些草案标记相对于主模型预测的接受率.

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | “额外 loss block” | 一个小型 transformer block 加 projection，用来预测主模型前方 `k` 个位置的 Token |
| Prediction depth | “哪个 offset” | 整数 `k`，使得 module `k` 基于截至位置 `i` 的 prefix 预测 `t_{i+k}` |
| Parallel MTP | “Gloeckle-style” | 位于同一个 backbone hidden state 之上的 D 个独立 heads，没有条件链 |
| Sequential MTP | “DeepSeek-V3 style” | 每个 module 都以先前 depth 的 hidden state 加下一个 Token 的 embedding 为条件；保留 causal chain |
| Shared output head | “复用主 head” | MTP modules 调用主模型的 LM head，而不是单独的 output projection |
| Shared embedding | “复用主 table” | 同一个 vocabulary embedding table 在所有地方使用；没有重复参数 |
| Projection matrix M_k | “结合 hidden + next-token” | 一个 `h x 2h` linear layer，将前一个 hidden state 和 target-token embedding 折叠为下一深度的输入 |
| Joint loss L_MTP | “平均额外 losses” | per-depth cross-entropy losses 的算术平均值，并按 `lambda` 缩放 |
| Acceptance rate at depth 1 | “MTP draft 多常正确” | D=1 MTP module 的 top-1 prediction 等于主模型 top-1 prediction 的比例；DeepSeek-V3 上超过 80% |
| Lambda weighting | “额外 loss 的重要性” | per-depth 缩放因子；DeepSeek-V3 在训练开始时为 0.3，之后为 0.1 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 完整的连续MTP描述(第2.2节),包括联合损失方程和推理时的1.8×加速
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) 深度搜索 设计所改进的平行MTP基线
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 685B 总量(671B主要+14BMTP),部署说明
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) MTP 所适配的投机解码框架
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840)EAGLE的2025年设计草案,也是MTP竞争对应方案
