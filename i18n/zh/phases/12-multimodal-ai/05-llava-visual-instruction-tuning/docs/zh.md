# 视觉指令调整

> LLaVA(2023年4月) 是地球上最多复制的多元架构. 它使用2层MLP取代BLIP-2的Q-Former,使用简单的代币连锁,取代了Flamingo的关闭交叉注意力,并通过158k条视觉指导转换上练习,这些数据由GPT-4从纯文本标题中生产.

**类型：**构建
**语言：**编程程序:
**先修：**阶段12 · 02(CLIP),阶段11(LLM工程 教学调整)
**时间：**时间: 180 分钟

## 学习目标

- 构建一个2层的MLP投影机,将ViT补丁嵌入式模1024mm)映射到LLM的嵌入式模4096)。
- 走通 LLaVA两阶段配方: 1) 在 558k标题对上做投影机配线, 2) 在 158k GPT-4生成转上做视觉指令调整──
- 构建一个LLaVA格式提示,包含图像 标记定位符、系统提示 和用户/助理转──
- 解释为什么社区从Q-Former转向MLP,尽管Q-Former在代币预算上有优势.

## 问题

蓝皮2的Q-Former(课时12.03) 把一张图像压缩成32个标记――干净、高效、基准表现好――但它有两个问题――

第一个,Q-前者是可训练的,但它的损失不是最终任务. 第一个阶段训练ITC+ITM+ITG. 第二阶段训练LM损失.

第二,Q-Former有188万个参数,而在LLaVA的2023年规模下,你必须把它与目标LLM 一起协同设计,换LLM,要重新训练Q-Former,换视觉编码器,也重新训练.

拉瓦的答案简单到令人尬:取ViT的576个补丁符号,让每个符号通过一个2层MLP(`1024 → 4096 → 4096`),然后把全部 576 个都塞进了 LLM 的输入序列――没有瓶――没有基于奇怪目标的第一阶段预训练――只是在直接的 LM 损失上训练 MLP――

数据从哪里来?LLaVA的第二洞见:使用GPT-4(仅文本) 生成指令数据──把图像的COCO标题和边界框数据输入GPT-4,让它生成对话、描述和复杂推理问题──免费获得158k的指令回应转折──无需人工标注──

结果:一个在8张A100上运行一天,在MMMU上击败了弗拉门戈,并发布了社区可扩展的开放检查点VLM. 到2023年底,它已经产生了50多个叉子.

## 概念

### 架构

杆-1,5在13B:
- 视觉编码器:CLIP ViT-L/14 @ 336(第一阶段结,第二阶段可选解) 』
- 投影机:带GELU激活的2层MLP,`1024 → 4096 → 4096`,我知道.
- 后来是拉马-3.1-8B)

图像 + 文本提示 的前进通行:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

在2048年下文中,文本还剩下1472个代币.在32k下文中,这只是一个错误.

### 阶段1:投影机的配合

结 ViT──结 LLM──只训练2层 MLP──数据集:558k图像标题对(LAION-CC-SBU)──损失:在投影图像代币条件下,对标题做语言建模──

作为一个专业的项目,它可以完成.

### 阶段2:视觉指令调整

解投影机 (?? 仍可训练) ・解 LLM (?? 解) 通常全量,有时使用LoRA) ・ 在158k视觉指导转上训练――

导读数据是关键技巧――Liu等的生成方式:
1. 取一张COCO图像
2. 提取文本描述(5 条 人类标题+边界框列表) 』
3. 用三种提示模板 发送给GPT-4:
   - 对话:生成一个用户和助理 围绕这个图片来交流的对话.
   - 详细描述:给图像的丰富,详细描述.
   - 复杂推理:提出一个需要根据图像进行推理的问题,然后回答它.
4. 将 GPT-4 的输出解析为 指示,响应) 双子

整个过程并没有直接接触图像只接触文本描述――GPT-4 会产生幻觉的合理图像内容――有一些噪音,但它奏效了:

### 为什么社区复制了这个方案

- 没有调整的1阶段的损失――全程使用LM损失――
- 投影机训练以小时计,而不是以天计.
- 通过重新训练投影机,可以替换LLM(LLaVA-Llama2、LLaVA-Mistral、LLaVA-Llama3)
- 视觉指令数据管道使用GPT-4,并且针对新领域的重建成本很低.

### LLaVA-1.5 与 LLaVA- NEXT

加入:
- 学生们的学习和学习的过程,
- 系统更好,快速.
- 2048 → 32k 文本

加入:
- 任何Res:把高分辨率图像切成2x2或1x3 网格的336x336种植,再加一个全球低分辨率小图片──每种种植都变成了576个标记;每张图像总数约2880个视觉标记──OCR和图表任务大幅提升──
- 使用 ShareGPT4V(高质量GPT-4V字幕) 的更好指令数据混合物──
- 更多强的基础LLM(Mistral-7B、Yi-34B)

### 视频

课时 12.08 会深入讲 OneVision──简短版:同一个投影机,但用一个课程 训练,在一个模型中覆盖单个图像、多个图像 和视频,并共享视觉标志预算──

### 与 Q-Former 的比较

| | Q-Former（BLIP-2） | MLP（LLaVA） |
|---|---|---|
| 每张图像的 visual Token | 32 | 576（base）或 2880（AnyRes） |
| 可训练参数 | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | 仅 LM |
| LLM drop-in | 需要重新训练 | 最小重新训练即可替换 |
| Multi-image | 别扭 | 自然（concat） |
| Video | 别扭 | 自然（per-frame concat） |
| Token budget | 小 | 大 |

果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 果: 

### 快速格式

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>`在代币化之前,它将被替换为 576 个视觉代币 (任何代币都为 2880 个).

### 参数经济性

子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
- 现在,我们要做什么?
- 投影机 (直线) ~22M 可训练──
- 拉马-7B:7B──
- 总计:7.3B参数――第二阶段 期间可训练:完整7B+22M投影机――

阶段2的训练成本:8xA100上约20小时――这是一个关键数字一天、一个节点、可复现――这就是LLaVA的扩散开放的原因――


```figure
mm-llava-projector
```

## 使用它

`code/main.py`实现:

1. 纯Python 中的2层MLP投影机(玩具尺度 下dim 16 → 32 → 32)。
2. 快速建设管道:系统快速+ 用 N 个预测代币 替换 `<image>`+用户转换+助手生成位──
3. 一个可视化器,用于展示 576 个代币视觉区块 在 LLM 文本中的样式

## 交付它

本课产出发 `outputs/skill-llava-vibes-eval.md`△给定一个LLaVA家庭检查点,它会运行一个10个即时振动-eval套件(3个标题,3个VQA、2个推理、2个拒绝),并报告一个人类可读的分数卡──它不是基准;而是烟雾测试,用来确认投影器和LLM 连接良好──

## 练习

1. 计算`1024 → 4096 → 4096`带 GELU 和偏差的 LLaVA-13B 的比例是多少?

2. 为什么LLaVA应该拒绝这个请求?需要什么训练数据来加强拒绝?

3. 阅读LLaVA-NeXT博客的AnyRes 部分──计算一张1344x672图像在AnyRes下面视觉代币数量──与336x336下面的基 576代币对比──

4. 升到第一个阶段,直接进入第二阶段.

5. 对于一个新领域 (医学X射线,卫星图像),描述生成域名指令的四步数据管道――每步可能出什么问题?

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|----------------|------------------------|
| Projector | “MLP bridge” | 带 GELU 的 2-layer MLP，将 ViT dim 映射到 LLM dim |
| Image Token | “<image> placeholder” | Prompt marker，在 inference 前被 N 个 projected visual Token 替换 |
| Visual instruction tuning | “LLaVA stage 2” | 在 GPT-4-generated（image, instruction, response）triplets 上训练 |
| Stage 1 alignment | “Projector pretraining” | 冻结 ViT 和 LLM，用 captions 上的 LM loss 训练 projector |
| AnyRes | “Multi-crop tiling” | 将高分辨率图像切分为 tile grid，并拼接每个 tile 的 visual Token |
| LLaVA-Instruct | “GPT-4-generated” | 从 COCO captions + GPT-4 合成的 158k instruction-response pairs |
| Vision encoder freeze | “Backbone locked” | CLIP weights 在 stage 1 不更新，有时在 stage 2 也不更新 |
| ShareGPT4V | “Better captions” | 由 GPT-4V 生成的 1M dense captions，用于更高质量 alignment |
| VQA | “Visual question answering” | 回答关于图像的自由形式问题的任务 |
| Prismatic VLMs | “Design-space paper” | Karamcheti 2024 ablation，系统测试 projector 和 data choices |

## 延伸阅读

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) 拉瓦论文──
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) LLaVA-1.5──
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793)密集字幕 数据集──
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)设计空间的排放量――
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)统一的单图,多图,视频.
