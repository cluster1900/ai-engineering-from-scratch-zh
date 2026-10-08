# 马巴 混合型SSM变压器

> 变压器通过注意力换质量,但代价是二次复杂性. 变压器通过推推换取线性时间推理和常量内存,但质量落后. AI21的Jamba (三月2024年) 和Jamba 1.5 (八月2024年) 将它们放进同一个模型:每7个Mamba层配 1个变压器层,每块使用MoE,并提供可在单张80GB GPU 上运行的256k窗口.

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**前置要求:**阶段10 · 14 (开放型号建筑),阶段10 · 17 (原生稀疏关注)
**Time:** ~60 minutes

## 学习目标
- 解释Jamba块中三种原始性:变压器层、Mamba层、MoE,以及1:7:甚至的交错配方──
- 从高层说明SSM的推进形式,以及为什么它能够实现常量内存推理.
- 计算Jamba 模型在256k背景下下 KV缓存占用并与纯变压器 模型所需内存进行比较.
- 描述Mamba-3的三项创新 (特拉佩索达式分辨率,复杂价值状态更新,MIMO) 以及每个创新针对的问题.

## 问题
注意序列长度是二次复杂性――状态空间模型是线性的――这个差异会不断增加:在256k代币下,一个变压器注意地图 每个头都有65B个条目;SSM的递送状态不随序列长度变化,大小固定――

纯SSM 模型(Mamba、Mamba-2) 在小规模下能匹配变压器的复杂性,但在状态跟踪任务上落后,并且在某些内文检索类别上失败──直觉是:SSM将历史压缩到固定状态;当历史很长时,信息会泄漏──注意 精确记住所有内容,但要付出二次复杂性成本──

显而易见的修复方法:两者都用. 在需要精确召回的地方放变压器层――其他地方使用SSM层――调节比例――Jamba是第一个以规模化方式交付这种混合配方的生产级模型.

本课会阅读这三篇论文,并形成选择正确比例的思维模型.

## 概念
### 一页的SSM

通过固定大小的状态`h`处理序列`x_1, ..., x_N`其他:

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

通过线性动力学.`A`演化,接收输入`B x_t`并输出`C h_t`,我知道.`A, B, C`记住这个关键性质:计算`y_t`只有需要`h_{t-1}`和 `x_t`没有任何更早的需要.`x`△内存是常量. 推理是每个符号.

建模质量的关键在于`A`结构――S4(Gu 2021) 使用高度结构化的矩阵,在训练期间可以作为长卷积 高效求值――Mamba(Gu, Dao 2023) 将固定的`A, B, C`替换为依赖数据的形式 (也就是选择性) 部分 (Mamba-2(2024) 进一步简化了结构 (Mamba-3(2026) 则在特定位置重新加入复杂性 (复杂性).

关键性质是:对于解码器LLM,SSM层可以作为注意层的直接替代品,用固定大小的逐层状态取代不断增长的KV缓存.

### 巴区

根据两个数字交错层:

- `l`巴比率:注意力与巴比率:`l = 8`表示每7个层配 1个变压器层,7个层+1个注意力= 每组8层) ⋅
- `e`频率:MoE──Jamba 使用 `e = 2`表示每隔一层应用 MoE

区块内层序列:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

每个巴块是8层,深度为4层,总共32层.

### 为什么 1:7 的比率

AI21做了排放:什么样的关注Mamba比如能在他们的长文本评估上获得最佳的参数复杂性和在文本内回忆?

- 注意 太多(1:1:质量提升,但内存和速度变差.
- 注意 太少(1:15):内存很好,但在文本中检索 失败.
- 最好的点是1:7,或1:8.

直觉是:变压器层处理精确召回和状态跟踪――布层负责低成本大部分处理――

### 位置编码

巴层 本身具有位置感知能力 (通过递推) ⋅原始巴基混合物中的注意力层 没有使用RoPE,因为SSM层 提供位置信息──巴 1.5 为注意力层 添加RoPE,以增强更长的语境概括性;这是基于经验的长文本评估后进而进步──

### 记忆预算

对于Jamba-1 形状 ((32层:28Mamba+4注意,隐藏4096,32注意头):

- 只有注意层:在256k BF16 下为 `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB`只有4个注意层 贡献KV缓存
-  SSM状态:每个代币前为 `28 * hidden * state_size`布状态是每个特征的16个,隐藏 4096:总计`28 * 4096 * 16 * 2 = 3.7 MB`,我知道.

与相同的隐藏32层32头满满MHA的纯变压器相比:在256kBF16下为`2 * 32 * 32 * 128 * 256k * 2 = 128 GB`△KV缓存 减少8倍──即使对比大多数 2024 模型使用的 GQA(8) 基线(`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`巴的1: 7混合物在16GB下仍然小2x──

这就是AI21所说的单张80GB GPU 上的256k背景──全MHA纯变压器的KV缓存放不下;即使GQA基线也几乎不给重量和激活空间留下空间;而Jamba可以──

### 马巴-3:2026年纯SSM基线

马巴-3(ICLR 2026,arXiv:2603.15569) 在纯SSM方面引入了三项创新:

1. **Exponential-trapezoidal discretization.**用更有表达力的递送替换Mamba-2 中的勒方法分辨性.`x_t`表面的外.

2. **Complex-valued state update.**之前的Mamba 将状态矩阵从复杂的(S4) 降低为真实对角形(Mamba),再降低为规模的身份(Mamba-2) ・Mamba-3 重新加入复杂值,相当于对状态进行数据依赖的旋转嵌入式──这恢复了之前的真实值 简化所牺牲的状态跟踪能力──

3. **Multi-input multi-output (MIMO) projections.**不使用个特征标量预测,而是使用矩阵值预测.

在1.5B参数规模下,Mamba-3 相比GatedDeltaNet将平均下游精度提高0.6个点;MIMO变体额外增加1.2个点,总共提升1.8个点――在相同状态大小下,Mamba-3 以半状态匹配Mamba-2――

尚没有大规模生产的混合动力机,但显然是下一代的Jamba类型模型SSM侧的候选方案.

### 何时使用混合物

混合动力 适合以下情况:

- 文本足够长,直到纯变压器KV缓存变得痛苦
- 任务混合了短距离结构 (适合SSM) 和长距离回忆 (需要变压器)
- 你希望在单个GPU内存预算上部署,而变压器KV缓存本身就放不下.

混合动力 不适合以下情况:

- 短短的背景 低于16k) ・SSM上空费被浪费;纯变压器 足够好。
- 任务需要在任何地方,在任何地方注意力
- 你正在扩展到数万亿参数边界模型――纯变压器+MLA+MOE(DeepSeek-V3风格) 目前在能力竞赛中胜出――

### 竞争环境

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

2026年格局:纯变压器MoE 主导边界,但混合动力占据256k以上的细分领域――Mamba-3在国家跟踪上升的胜利中,可能推动下一代混合动力采用更低比例的SSM更多、更少的注意力)


```figure
swiglu-ffn
```

## 使用它
`code/main.py`是一个用于混合架构的内存计算器.给定SSM-Transformer比和隐藏尺寸/层数量配置,它会计算:

- 目标背景 下的KV缓存──
- 系统状态存储.
- 一系列模型形状在下文中总内存.

计算器支持:

- 纯变压器基线 (KV缓存随 N 增长)
- 巴式1: 7混合物
- 完全没有KV缓存) 』

对于已发布的形状,数字直接来自Jamba-1 和Jamba-1.5论文;对于假设变体,则是外推得到.

实际部署的集成考虑:

- 大多数生产推理服务器 (vLLM、SGLang) 支持Jamba 和 Mamba──检查具体版本──
- 在 256k 背景下下,Jamba 的内存优势会体现在的同时请求输出上.在相同的VRAM上,你能容纳比变压器序列更多的Jamba序列.
- 作为独立模型,Mamba-3还没有在生产中交付,只是1.5B的研究预览.

## 交付它
本课会产出 `outputs/skill-hybrid-picker.md`△给定工作负载规范,它将在纯变压器,巴式混合和纯SSM之间提供推,并明确说明内存与质量权衡.

## 练习
1. 运行`code/main.py`计算32层纯变压器 (隐藏4096.32头) 和相同形状的Jamba-1混合动力在256k背景下下下 KV缓存――验证AI21论文声称约8倍内存降低――

2. 修改计算器,建模 1:3混合物(4 Mamba: 1 注意) 和 1:15 混合物(14 Mamba: 1 注意) ――绘制KV缓存与比率──在哪个比率下 KV缓存等于SSM状态内存?

3. 阅读Jamba论文(arXiv:2403.19887) 的第3节.解释为什么AI21使用Mamba-1而不是Mamba-2,尽管Mamba-2更快.提示:混合式除部分记录了这一点.

4. 计算Jamba 1.5 大 中 MoE-每一个层的参数上层费用(总计 398B,激活 94B) ・将积极比与深度搜索-V3(37B/671B) 相比,并解释为什么Jamba的架构将把积极比推得更高──

5. 阅读Mamba-3论文(arXiv:2603.15569) 的第 3 节.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | “带固定状态的递推” | 具有学习到的递推 `h_t = A h_{t-1} + B x_t` 的层；每个 token 使用常量内存 |
| Selective SSM | “Mamba 的技巧” | 依赖数据的 A、B、C 参数，使模型在线性时间下获得类似 gating 的选择性 |
| Attention-to-Mamba ratio | “多少个 Attention layers” | 在 Jamba 中，`l = 8` 表示每 7 个 Mamba layers 配 1 个 Attention layer |
| Jamba block | “8 层一组” | 一个 Attention + 七个 Mamba + 在交替位置使用 MoE |
| SSM state | “隐藏缓冲区” | 固定大小的逐层状态，用于替代 Mamba layers 的 KV cache |
| 256k context | “Jamba 的旗舰数字” | Jamba-1 可在单张 80GB GPU 上容纳的序列长度；pure Transformer 在该大小下无法做到 |
| Mamba-3 | “2026 pure SSM” | 当前最佳 pure-SSM architecture，具有 complex state + MIMO；是 hybrid 重新构建时围绕的 baseline |
| MIMO | “Multi-input multi-output” | Mamba-3 的创新，使用 matrix-valued projections 而不是逐 feature 标量 |
| Exponential-trapezoidal discretization | “Mamba-3 的递推” | 更有表达力的递推，包含 Mamba-2 的 Euler-method discretization |
| Hybrid architecture | “混合 Attention 和 SSM” | 任何交错 Transformer 和 SSM layers 的模型；Jamba 是生产级原型 |

## 延伸阅读
- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) 原始 Jamba 论文,比率排放,256k文本 声明
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570) 扩张后的系列,398B/94B 和 12B/52B 公开发布
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) Jamba 构建所基于的选择性SSM论文
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060) 简化结构化国家空间后继者
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569)复杂值状态,MIMO,2026纯SSM边界
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) S4 论文,面向LLM的SSM谱系起点
