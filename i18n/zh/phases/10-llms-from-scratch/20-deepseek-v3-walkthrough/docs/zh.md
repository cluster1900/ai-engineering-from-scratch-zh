# 构建讲解

> 第十一阶段 · 第十四课命名为每个开放模型都会调节的六个结构旋──DeepSeek-V3月 (十二月,总参数671B,活跃参数37B) 调节了全部六个旋,并额外加入四项:多头隐形注意力、无辅助损失负载平衡、多预测,以及双管预测──本课程从上下阅读DeepSeek-V3的结构,并根据发布配置推出了每个参数数──完成后,你将能够学习解释为什么671B/37B这个是正确的投注,以及为什么MLA + MoE 组合在前沿模型中单独使用胜利率.

**类型：**学习 课程
**语言：**字符串的计算器
**先修要求：**项目项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目:
**时间：**约75分钟

## 学习目标

- 从上到下阅读DeepSeek-V3配置,并使用六个GPT-2旋加上四个DeepSeek特有的新增项来解释每个段子.
- 推导总参数量 ((671B) 、活跃参数量 ((37B),以及各自的组成部分──
- 计算 128k 文本 下 MLA 的 KV 缓存 占用,并与一个活跃参数相同,使用 GQA 的密集模型 需要进行付出成本比较.
- 指出了每个项目针对架构或训练堆的哪些部分.

## 问题

探V3是第一个与Llama家族存在实质差异的前沿开放模型的架构.探V3是调节了六旋转的GPT-2.探V3是GPT-2加上全部六旋转,再额外加入四旋转.阅读Llama3配置是阅读深度搜索配置的热身,但其深层结构,也就是注意区块的形状,路线逻辑,训练时间目标,已经足够不同,因此需要单独讲解.

了解它的好处是:深度搜索V3的开放权重 发布改变了开放模型中边界能力的含义.

## 核心概念

### 不变的核心,再看一次

深度搜索V3 仍然是自主降级的──它仍然堆积了解码区块──每个区块──它仍然包含了注意力加上MLP加上两个RMSNorm──它在MLP中仍然使用SwiGLU──它仍然使用RoPE──预规──权重共享嵌入──基线与每个Llama或Mistral 相同──

### 转折:用MLA取代GQA

从10期 · 14期 你已经知道,GQA 通过让多组Q头 共享K 和 V 来缩小KV缓存――多头潜伏注意(MLA) 更进一步:K 和 V 被压缩到一个共享的低排潜伏表示(`kv_lora_rank`),然后在计算时按头 解压;;KV缓存只存储隐藏,通常是每个代币每层 512 个浮点数,而不是 8 x 128 = 1024 个浮点数.

在 128k 背景下,使用 MLA 的 DeepSeek-V3(每个代币 每一个层一个共享隐藏`c^{KV}`通过上升投影从这个隐藏的 派生,而这些上升投影可以吸收到后续的 产物中):

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

一个假设的GQA基线(Llama 3 70B 形状,8 个KV头,头 128)需要:

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

在128k背景下,MLA比Llama-3-70B风格的GQA缓存小4倍.

权衡是:MLA 在每次注意 计算时增加按头的解压.额外计算量相对于省的带宽很小.

### 路由:无助损失负载平衡

标准修复方法是添加一个辅助损失项,用于惩罚负载不平衡. 这确实有效,但会略微降低主任务性能.

根据专家的偏见,并在训练期间使用一个简单的规则调整:如果专家`e`过载,就降低`bias_e`负载不足,就提高它――不增加额外损失――训练保持干净――专家 负载保持平衡――

对主损失的影响:不可测量. 对MoE结构的影响:更干净,没有调整的辅助损失超参数.

### 更多密集训练+免费草案

从10期开始,你已经知道,DeepSeek-V3增加了D=1的MTP模块,用于预测后两个位置的代币. 在推理过程中,训练的好模块被重新使用为投机解码草案,接受率超过80%. 在训练过程中,每个隐藏状态受到D+1 = 2个目标的监督,提供更密集的信号.

参数:在671B主要上增加14B――开销:2.1%――

### 训练:双管

从10期开始,你已经知道,双管是一种双向管道,将向前和向后的块与跨节点的通讯重叠. 在DeepSeek-V3的2,048-H800规模下,它约追溯到1F1B原始的管道泡损失的245kGPU-小时.

### 配置,逐字段解析

下面是深度搜索V3配置:

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

解析如下:

- `hidden_size=7168`嵌 维度――
- `num_hidden_layers=61`总块深度.
- `first_k_dense_layers=3`其他 58 个使用 MoE。
- `num_attention_heads=128`问答问题:
- `kv_lora_rank=512`压缩到这个隐形维度,并按头压解.
- `num_experts=256, num_experts_per_tok=8`每个MoE区都有256名专家,采用前8个路由.
- `shared_experts=1`另外,还有一位常见的专家会为每个代币贡献输出.
- `moe_intermediate_size=2048`由于共有256名专家,它比密集的MLP小.

### 参数核算

完整计算在`code/main.py`中──核心结论:

- 嵌入:`vocab * hidden = 129280 * 7168 = ~0.93B`,我知道.
- 前 3个密集块:带 MLA 的注意(每块约144M) +密集 MLP(每块约260M) + 规范──总计约1.2B──
- 58个MOE块:带MLA的注意(约144M) + 256个专家(每一个约30M) + 1个共享专家(30M) +标准──按包含所有专家 计算,每块 总计约7.95B──58个MOE块 总计461B──
- 轮:14B

总计:核心架构 约476B+14BMTP;而已发布的671B 数字还将单独计入额外结构参数(偏差色器,专家特定组件,共享专家规模等) ⋅我们在计算器中复现的数字与已发布的值相差3-5%,差异来自DeepSeek 报告第二节附件 中记录的细粒度核算――

每次前进的活跃参数:

- 注意:每层144M*61=8.8B(所有层都会触发)
- 已有3层密度 (前3层密度) 已有58,58个MoE层 中每层激活8个路由+1个共享+路由上空费――每层活跃的MLP约260M――总计:3 *260M+58 *260M=~15.9B――
- 嵌入+规范:1.2B──
- 总活跃:约26B核心+14BMTP(训练时使用,但推理时不总是运行)≈37B。

### 671B / 37B 比例

活跃参数为总参数的5.5%──DeepSeek-V3是已发布的开放权重的最稀疏前沿MoE模型──混合8x7B的比例为13/47──28%,要密集得多──Llama 4 Maverick的比例为17B/400B──4.25%),与之相当──DeepSeek的押注是:在前沿规模下,更多专家加上更低的活跃比例,将在每次FLOP的质量上带来更好的结果──

### 深度搜索V3 的位置

| 模型 | 总参数 | 活跃参数 | 比例 | Attention | 新想法 |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN 扩展 |

### 后续:R1、V4

根据"深度搜索-R1 (深度搜索-R1 (深度搜索-R1 (深度搜索-R1 (深度搜索-R1)) 2025年,在V3背骨上进行了推理训练一次运行.

根据"深度搜索-V4"的预测,将保留MLA+MoE+MTP,并加入DSA.


```figure
moe-routing
```

## 使用它

`code/main.py`运行它,将输出与论文中的数字进行比较,并使用它测试假设变体(256专家对512、顶-8对16、MLA排名512对1024) ⋅

需要关注:

- 总参数与已发布的671B──
- 活跃参数与已发布的37B──
- 根据 128k 背景下下面的 KV 缓存,也就是 MLA 与 GQA 的比较.
- 按层的解剖,用于观察参数预算实际花在哪里.

## 交付它

本课会生成`outputs/skill-deepseek-v3-reader.md`△给定一个DeepSeek家庭模型 (V3、R1,或任何未来变体),它会生成一个单组件的架构阅读结果,命名配置的每个字段,按组件推导参数,并识别模型使用四个DeepSeek特有的创新中的哪些──

## 练习

1. 运行`code/main.py`△将计算器的总参数估计与已发布的671B进行比较,并识别差异来自哪里――论文 第2节 有完整分项――

2. 修改配置,将MLA排名从512 改为256k.计算 128k背景下得到的KV缓存大小.

3. 与一个假设的256专家,前-8) 调整比较 DeepSeek-V3的;总参数增加;活跃参数保持不变.理论上,额外专家容量带来什么收益?推理时代是什么?

4. 阅读深度搜索-V3技术报告 (ArXiv:2412.19437) 第2.1节 关于MLA内容──用三句话解释为什么K和V的解压矩阵可以在推理效率上被吸收到后续的矩阵中──

5. 对于大多数操作使用FP8训练――计算FP8与BF16的储存量为671B重量――它与14.8T代币训练预算有什么关系?

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MLA | “Multi-Head Latent Attention” | 将 K 和 V 压缩到共享低秩 latent（kv_lora_rank，通常为 512），并按 head on-the-fly 解压；KV cache 只存储 latent |
| kv_lora_rank | “MLA compression dim” | K 和 V 共享 latent 的大小；DeepSeek-V3 使用 512 |
| First k dense layers | “早期 layers 保持 dense” | 前几个 MoE-model layers 跳过 MoE router，并运行 dense MLP 以提高稳定性 |
| num_experts_per_tok | “Top-k routing” | 每个 token 会触发多少个 routed experts；DeepSeek-V3 使用 8 |
| Shared experts | “Always-on experts” | 无论 routing 如何都会处理每个 token 的 experts；DeepSeek-V3 使用 1 |
| Auxiliary-loss-free routing | “Bias-adjusted load balance” | 在训练期间调整按 expert 的 bias 项，以在不添加 Loss 项的情况下保持 expert 负载均衡 |
| MTP module | “额外 prediction head” | 从 h^(1) 和 E(t+1) 预测 t+2 的 Transformer block；更密集训练，免费的 speculative-decoding draft |
| DualPipe | “Bidirectional pipeline” | 将 forward/backward 计算与跨节点 all-to-all 重叠的 training schedule |
| Active parameter ratio | “Sparsity” | active_params / total_params；DeepSeek-V3 达到 5.5% |
| FP8 training | “8-bit training” | 使用 FP8 存储训练数据，并在许多 compute ops 中使用 FP8；相比 BF16 大约内存减半，质量代价很小 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report（arXiv:2412.19437）](https://arxiv.org/abs/2412.19437) 完整的架构,训练与结果文档
- [Hugging Face 上的 DeepSeek-V3 model card](https://huggingface.co/deepseek-ai/DeepSeek-V3)配置文件与部署说明
- [DeepSeek-V2 paper（arXiv:2405.04434）](https://arxiv.org/abs/2405.04434) 引入了MLA的前身模型
- [DeepSeek-R1 paper（arXiv:2501.12948）](https://arxiv.org/abs/2501.12948) 基于V3架构的推理训练后继模型
- [Native Sparse Attention（arXiv:2502.11089）](https://arxiv.org/abs/2502.11089) 深度寻找家庭关注的未来方向
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe)培训时间表参考
