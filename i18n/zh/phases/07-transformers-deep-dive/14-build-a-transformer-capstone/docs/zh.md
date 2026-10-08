# 从零构建变压器  石头 项目

> 十三节课――一个模型――不走捷径――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 到 13。不要跳过。
**Time:** 约 120 分钟

## 问题

你已经读过每篇论文. 你已经实现了注意力,多头分离,位置编码,编码和解码区块,BERT和GPT损失,MoE,KV缓存.

这个顶点:在一个字符级语言建模任务上端到端训练一个小型的解码器仅变压器――它读到莎士比亚――它生成新的莎士比亚――它足够小,可以在10分钟内在笔记本电脑上训练完成――它也足够正确,只要换成更大的数据集并进行更长时间的训练,就能得到一个真正的LM――

这是本课程的nanoGPT──它不是原创卡帕蒂2023年的纳诺GPT教程是每个学生至少要写一次的参考实施──我们沿着它的形状,并围绕本课程已经讲述的内容重新组织──

## 概念

![Transformer-from-scratch block diagram](../assets/capstone.svg)

架构标注如下:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### 我们交付什么

- `GPTConfig`统一配置所有超参数的地方──
- `MultiHeadAttention`因果性,并带有可选的闪光式路径`scaled_dot_product_attention`
- `SwiGLUFFN`现代 FFN。
- `Block`预规,用残余的包裹注意力 + FFN。
- `GPT`嵌入式,堆积的块,LM头,生成的)
- 使用AdamW、cosine LR、渐进切割的训练循环.
- 莎士比亚文书上的卡级代币化器.

### 我们不交付什么

- 罗佩 第四课已从概念上实现了.
- 生成期间的KV缓存  每一代步都会在完整的前上重新计算注意力――慢慢但更简单――练习会要求你添加KV缓存――
- 闪光注意  PyTorch 2.0+ 会在输入匹配时自动发送;我们使用 `F.scaled_dot_product_attention`,我知道.
-   每个区块使用单个FFN──你已经在第11课中见过MoE──

### 目标指标

在Mac M2笔记本电脑上,一个4层,4头的GPT在`tinyshakespeare.txt`上训练2000步:

- 训练损失在约6分钟内从约4.2) 随机收到约1.5.
- 采样输出看起来具有莎士比亚的形态:古风词汇、换行,以及像ROMEO: 这样的专名称会出现.
- 值损失 (最后10%的文本) 紧随着培训损失;在这个规模/预算下没有过度适应.


```figure
n5-block-stack
```

## 构建它

本课使用 PyTorch──安装 `torch`参见  计算机系统`code/main.py`◎ 脚本会处理:

- 如果缺失则下载`tinyshakespeare.txt`没有什么可说的.
- 字节级卡标记器
- 列车/车间分离率为90/10.
- 在支持硬件上使用bf16自动播放的训练循环.
- 训练完成后的样本采集

### 步骤1:数据

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

适合4字节的语音大小.没有BPE,也没有代币器.

### 步骤2:模型

参见`code/main.py`△这个块是05课的标准写法 预规则、RMSNorm、SwiGLU、因果MHA──4/4/128的参数数数量:约800K──

### 步骤3:训练循环

随机取一批长度为 256 个标志窗户――前进――转变-一-交叉化――后退――亚当W步――Log――重复――

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### 步骤4:样本

给定一个提示,反复前进,从顶部的登录中样本,添加,然后继续――500个代币 后停止――

### 步骤 5:读取输出

后面的2000步:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

这不是莎士比亚,但它有莎士比亚的形状.

## 使用它

这座顶石是参考架构.

1. **更换 tokenizer。**使用BPE(例如 `tiktoken.get_encoding("cl100k_base")`◎◆ 语音大小 会从65跳到约5万.◆ 模型容量需要相应扩大来补偿.
2. **在更大的 corpus 上训练。**使用 `OpenWebText`或`fineweb-edu`通过10B代币训练一个125M参数GPT大约需要24小时.
3. **添加 RoPE + KV cache + Flash Attention。**下面的练习会引导你完成每一个项目.

最终会得到一个125M参数GPT,可以生成流英文――它不是边界模型――但同一个代码路径 只是更大 正是卡帕蒂,电路AI和艾伦研究所在2026年将用来训练研究检查点的方式――

## 交付它

参见`outputs/skill-transformer-review.md`△该技能会针对前13节覆盖的正确性,审查一个从零开始实施的变革者──

## 练习

1. **Easy.**运行`code/main.py`验证你训练的模型 最后一步验证损失低于2.0――把`max_steps`改为5000的损失是否继续改善?
2. **Medium.**用RoPE 替换学习的位置嵌入式.`MultiHeadAttention`内部对Q 和 K 应用转移──训练并验证值损失 至少同样低──
3. **Medium.**在采样循环中实现KV缓存――分别在有缓存和没有缓存的情况下生成500个代币――笔记本电脑上墙钟应该升级为520×──
4. **Hard.**给模型添加第二个头,用来预测下一个加一个代币(MTP 从DeepSeek-V3的多代币预测――联合训练――它有帮助吗?
5. **Hard.**用4个专家的MoE 替换每个区块中单个FFN──路由器+顶-2路由──在匹配的活跃参数条件下,观察值损失如何变化──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| nanoGPT | “Karpathy 的 tutorial repo” | 最小化的 decoder-only transformer training code，约 300 LOC；canonical reference。 |
| tinyshakespeare | “标准 toy corpus” | 约 1.1 MB 文本；自 2015 年以来几乎每个 character-LM tutorial 都使用它。 |
| Tied embeddings | “共享 input/output matrix” | LM head weight = token embedding matrix 的转置；节省 parameters，并提升质量。 |
| bf16 autocast | “Training precision trick” | 用 bf16 运行 forward/back，在 fp32 中保留 optimizer state；自 2021 年以来成为标准做法。 |
| Gradient clipping | “阻止 spikes” | 将 global grad norm 限制在 1.0；防止 training blowups。 |
| Cosine LR schedule | “2020+ 默认选择” | LR 先线性上升（warmup），然后按 cosine 形状衰减到峰值的 10%。 |
| MFU | “Model FLOP Utilization” | 实际达到的 FLOPs / 理论峰值；2026 年 40% dense、30% MoE 已经很强。 |
| Val loss | “Held-out loss” | 在 model 从未见过的数据上计算 Cross-Entropy；overfit detector。 |

## 延伸阅读

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) 经典的注释实施.
