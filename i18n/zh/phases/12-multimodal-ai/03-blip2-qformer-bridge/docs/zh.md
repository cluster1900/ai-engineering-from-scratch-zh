# 从CLIP到BLIP-2 Q-Former 作为一种模拟桥梁

> 通过跨度关注冷的ViT的功能,然后直接插入冷的LLM的输入流程. 188M 参数的桥接将一个11B LLM 连接到ViT-g/14──到2026年,每个基于适配器的VLM  MiniGPT-4──InstructLIPIP──LLaVA的近亲都是它的后代. 本课阅读Q-Former的架构,解释其两个阶段的玩具训练,并构建一个版本,将视觉解码器进入冷的文本中.

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**前置要求:**转换器 (转换器)
**Time:** ~180 minutes

## 学习目标
- 解释为什么在冷视觉编码器和冷的LLM之间放一个可训练的瓶,在成本和稳定性上优于端到端的细节调整.
- 实现一个跨越注意力区块,其中一组固定的可学习的查询 关注外部图像特征──
- 走读BLIP-2的两阶段预训练:代表 (ITC + ITM + ITG),然后生成(使用结解码器的LM损失)。
- 将Q-Former与LLaVA中使用的更简单的MLP投影机进行比较,并论证各自何时更占优点.

## 问题
你有一个结的VIT,它为每张图像产生 256 个DIM 1408 的补丁符号. 你有一个结的7B LLM,它希望DIM 4096 的补丁嵌入.

BLIP-2的问题是:能否将256-Token 图像表示压缩成更少的代码 ((例如 32个),同时保留足够的信息,让LLM 能够为图像生成标题,回答问题并进行推理?并且能否在不接触冰的脊椎的情况下训练这个桥梁,把训练成本限制在桥梁参数上?

答案是:Q-Former──32个可学习的"查询"矢量,对 ViT的补丁符号做交叉参加,生成一个32个符号的视觉摘要为 LLM使用──总计188M参数──在接触 LLM 之前,先使用对比性、匹配和生成目标 训练──

## 概念
### 需要学习的问题

问:前任的核心技巧:不是让LLM的文本代码关注图像补丁,而是引入一组新的32个可学习查询矢量`Q`让它们关注图像补丁. 这些查询是模型参数.

经过过过交叉关注后,每个查询 持有图像的缩写摘要   描述主要对象、描述背景、计数对象等──查询并不是字面上专门对应语义标签;它们会学习任何能让下游损失下降的编码──

### 建筑

原是一个小型变压器 (大约100M参数),有两条路径:

1. 查询路径:32 个查询 矢量 流经自我注意 ((彼此之间),然后对冷的ViT的补丁符号做交叉注意,最后经过FFN。
2. 文字路径:一个类似BERT的文本编码器与查询路径 共享自我注意 和FFN权重――文本路径 禁用横向注意――

训练时两条路径都会运行――查询 和文本通过共享自我关注 交互,这意味着在需要文本的任务中,查询可以以文本为条件──VLM 交互的推断 阶段,只让查询流过,产生32个视觉标志──

### 两阶段的培训

预训练:

阶段1:代表性学习 (无 LLM) △三种损失:
- 图像与文本对比:CLIP类对比,作用于集成查询标记和文本 CLS标记。
- 图像与文本匹配:二进制分类器  这对图像与文本是否匹配?使用硬负面挖矿
- 图像基文生成:文本上的因果性LM头,以查询为条件――迫使查询编码可由文本生成的内容――

只有训练Q-Former──ViT是结的──没有LLM 参与──

通过一个小型线性层将将 32 个查询输出投影到LLM的嵌入式dimension──把它们前置到文本提示──只在拼接后的提示+图像+标题序列上 LM损失训练线性投影和Q-Former──

之后,Q-Former +投影就是完整的视觉适配器――Inference 时:image → ViT →Q-Former →线性项目 → 前置到文本 → 结结结的LLM 发出输出――

### 参数经济学

炼188M,训练) = 总计8B,训练188M──Q-前身约为完整堆 参数的2.4%──训练成本也体现这一点:少量A100 上训练数天,而不是终端训练数周──

质量:BLIP-2 在零射VQA上达到或超过Flamingo-80B,同时体量小50倍.

### 指示BLIP 与指令感知型Q-Former

导读BLIP (2023) 用额外输入扩展了Q-Former:指令文本 本身.在交叉关注时,查询现在可以访问图像补丁和指令.查询可以根据指令专用化("计算车辆"",描述情绪"),而不是学习单个固定摘要.

### 迷你GPT-4与仅用投影机的方法

迷你GPT-4保留了Q-Former,但只训练输出线性投影,同时结结其他所有部分──便宜,但代价是质量查询是BLIP-2,不是你的──适合快速代,但不是最佳架构──

### 为什么LLaVA变得更简单

拉瓦 (LLVA)  (Lesson 12.05) 用普通的2层MLP 取代了Q-Former,将每个VIT补丁代码投影到LLM空间 对24x24网格,每张图像 576个代码,全部输入LLM.

到2026年,领域出现分流:Q-Former 在代币预算中保留重要场景;MLP投影机在每个代币原始质量优先场景中占主导地位.

### 门的跨度关注:

弗拉明戈 (Flamingo) 课 12.04) 之前使用了相同的跨度注意力思路,但它发生在每个结的LLM层,而不是作为单个桥接.BLIP-2 表明你可以只压缩到输入层,仍然有效.

### 2026年的后代

- 问题:BLIP-2、InstructBLIP、MiniGPT-4,以及大多数来自代币预算原因的视频语言模型──
- 感知器:Flamingo 的变体 (课 12.04);Idefics 家庭、鷹、OmniMAE──
- 光器:LLaVA、LLaVA-Next、LLaVA-OneVision、Cambrian-1──
- 关注池:VILA、PaliGemma──

决策问题是你受到代币预算限制,还是受到质量限制.


```figure
modality-projection
```

## 使用它
`code/main.py`构建一个Q-Former风格的交叉关注:

1. 模拟 256 个图像补丁标志
2. 实例化 32个可学习的问题
3. 运行量级点产品交叉关注 (Q 来自查询,K/V 来自补丁)
4. 通过线性层 投影到 LLM-dim ((512) 〕
5. 输出 32 个LLC准备的视觉标志.

所有数学都使用纯Python (对向量使用嵌套循环) ,但形状正确,会打印注意力重矩阵,这样你可以看到每个查询从哪些补丁中 拉取信息.

## 交付它
本课生成 `outputs/skill-modality-bridge-picker.md`△给定一个目标VLM配置,并给出简短的理由以及每个桥梁的参数估计.

## 练习
1. 用 PyTorch 实现跨注意力区块──验证在 32 个查询和 256 个键/值下,注意力重量矩阵是 32 x 256,并且软max 后每一行求和为 1──

2. 在BLIP-2阶段1中,Q-Former同时运行三种损失:ITC、ITM、ITG──使用伪代码写出每种前进签名──哪种需要文字编码器路径是活跃的?

3. 比较参数:Q-Former (Q-Former) 12层,768隐藏)vs2层MLP投影机 (MLP投影机) 1408 → 4096,两层) .在多大规模的LLM上,188MQ-Former的成本会通过训练效率收回?

4. 阅读BLIP-2论文(arXiv:2301.12597) 第三节,了解Q-Former如何初始化──解释为什么从BERT基础初始化(而不是随机初始化) 会加速收──

5. 对一个10分钟视频,以1FPS采样到60,计算每代币 成本:(Q-Former → 32代币/框架) vs (MLP投影器 → 576代币/框架) ――哪个可以放进 128k代币LLM背景窗口?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | 带有 32 个可学习 query Vector 的小型 transformer，对 frozen ViT features 做 cross-attend |
| Learnable queries | "Soft prompt for vision" | 一组固定参数，作为 cross-attention 的 query 侧；按模型学习，在所有输入之间共享 |
| Cross-attention | "Q from here, K/V from there" | query、key、value 来自不同来源的 Attention；queries 从 ViT patches 拉取信息的方式 |
| ITC | "Image-text contrastive" | 应用于 Q-Former pooled queries vs text CLS 的 CLIP-style loss |
| ITM | "Image-text matching" | 在 hard-negative-mined pairs 上的 binary classifier；迫使 queries 区分细粒度不匹配 |
| ITG | "Image-grounded text generation" | 文本以 queries 为条件生成时的 causal LM loss；迫使 queries 编码 text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 单独训练 Q-Former（ITC/ITM/ITG）；Stage 2 接入 frozen LLM，并且只训练 projection + Q-Former |
| Frozen backbone | "Do not finetune" | vision encoder 和 LLM weights 固定；只训练 bridge |
| Projection head | "Linear to LLM dim" | 将 Q-Former 输出映射到 LLM Embedding dimension 的最终 linear layer |
| Perceiver resampler | "Flamingo's version" | 类似的 learnable-query cross-attention，由 Flamingo 在每一层使用，而不是作为单个 bridge |

## 延伸阅读
- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597) 核心文件
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) 使用ITC/ITM/ITG 三件套的前身──
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651)"接前"第一阶段训练的概念祖先──
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) 指示的Q-Former──
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592) 仅是投影仪的方法
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795)可学习的通用架构――
