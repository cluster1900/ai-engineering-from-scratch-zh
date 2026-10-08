# 视频语言模型:时间代码和地面

> 视频不是一叠照片――一个5秒片 有因果序列、动作动词和事件时序,这些是图像模型无法表示的――视频-LLaMA(等,2023年6月) 发布了第一个具有音频视觉基层的开放视频-LLM――视频聊天和视频-LLaVA 扩大了这一模式――到2025年,Qwen2.5VL的TMRoPE 缩小了与边境专有模型的差距――每个系统都以不同的方式解决时间代码:Q-former per clip、concat-pool per frame、TMRoPE per token――本课程将解读这些模式,构建统一对动态框架样本,并进行时间基层测量任务上评估――

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## 学习目标
- 解释为什么时间定位编码会独立于视觉编码器 改变视频VLM性能――
- 与动态-FPS和事件驱动的框架样本的比较在每秒代币与地面准确性之间取舍.
- 描述Q-前-每片段(视频-LLaMA) 、组合-每框(视频-LLaVA) 和M-RoPE-每标记(Qwen2.5-VL) 设计。
- 描述四个视频基准:视频MME,时间准,自我计划,视频-MMMU.

## 问题
一段 1 分钟、30 FPS 的视频有1800个.按每一个 196个视觉代币.

存在三种压缩策略:

1. 根据内容使用1-8FPS)
2. 进行强力聚合 (对每个框架的补丁代币进行3x3或4x4双线聚合池)
3. 通过Q-former 压缩:输入一个16片,输出64个代币.

每种取舍不同──子样本会丢失时间细节──池会丢失空间细节──Q-前两者都会丢失一些,但节省代币──

模型如何知道框架5发生在框架6之前?选项包括简单的1D时间的RoPE(视频-LLaMA) 、学习的时间嵌入式(视频-LLaVA) 和TMRoPE(Qwen2.5-VL,完整3D) 👇

## 概念
### 每个片段一个Q-former+音频分支

视频-LLaMA(2023) 是第一个开放的视频-LLM──建筑:

- 快速拍摄的 16 个片,速度为 2 FPS ((即 8 秒)
- 视频Q-former,对全部16个框架做交叉服务 -> 32个学习查询 -> LLM。
- 并行音频分支:波形 -> 图像绑定音频编码器 -> 音频Q-former -> 32个查询 -> LLM。

优势:音频视觉联合推理――弱点:固定剪辑长度,无法处理任意时间定位――

### 视频聊天和视频-LLaVA

视频聊天保留了视频-LLaMA的思路,但删除了音频并简化.

它们不能处理长视频.

### 文2.5VL和TMRoPE

引入了TMRoPE,即时间模式旋转位置嵌入式. 每个补丁代币都携带一个 (t, h, w) 位置,其中 t 是实际的时间标签,而不是框架指数.

与简单的时间嵌入的关键区别:

- 绝对时间,而不是指数. 模型是在4.2秒,而不是在15秒.
- 每个视觉代币都按自己的时间标志独立旋转.
- 兼容动态FPS──如果这里采用2FPS采样,那里采用4FPS采样,TMRoPE可以原生处理这种不均间隔──

模型可以输出 4.2 秒──视频-LLaMA 只能说 早期的剪辑──

### 框架采样策略

整体:在整个时间内均采样N框架――简单,但会丢失运动峰――

动态FPS:根据运动强度自适应采样――光学流或框架差异会在高运动段中选择更密集的采样――Qwen2.5VL 会这样训练――

活动驱动:运行一个轻量探测器,在行动中发生处采样更多──视频代理 使用这种方式──

键盘+文本:在拍摄边界+若干相邻的框架采样──用于电影内容──

### 每个的集成

在1FPS和每一个框架 576个代币时,一个5分钟的剪辑是172,800个代币──Qwen2.5-VL-72B的128k背景可以很少处理,但成本很高──

对于大多数任务来说,这是一个甜点点.

对于代理工作流程可以更激进地聚合,6x6 -> 每个框架16个代币),因为空间细节不那么重要.

### 四个视频基准

- 视频中小企业:综合视频理解,包含短+中+长.
- 时间:细粒度时间推理,包含"前"/"后"问题──
- 长时程第一人称视频──
- 视频-MMMU:多学科视频问题

完整视频-VLM评价 会覆盖全部四个.它们强调不同维度:时间准 关注订单,EgoSchema 关注3+分钟推理,视频中小企业 覆盖多种持续时间.

### 接地输出格式

时间接地 的输出格式:

- 猫跳转4秒的标志.
- 结构化JSON:`{"event": "jump", "start": 4.1, "end": 4.3}`.2.5VL 会训练这种形式.
- 基于代币:特殊`<time>4.1</time>`标志与答案交错──Qwen2.5VL的内部格式──

基于代币的下游使用 最准确的.

### 2026 年最佳实践

2026年视频VLM的最佳实践:

- 编码器:带 M-RoPE 或 TMRoPE 的 SigLIP 2(Qwen2.5-VL) 』
- 模样:动态FPS (根据运动使用1-4),带最大罩.
- 按组合:3x3 双线性
- 输出:包含时间 +事件 字段的结构化 JSON。
- 标准:视频中小企业+时间盘 用于一般;EgoSchema 用于长远的时间表.


```figure
video-temporal-patches
```

## 使用它
`code/main.py`包含:

- 统一和动态FPS框架样本器
- 一个玩具时间定位评估器:给定时间T处的"基本真理"事件和模型输出,在容忍内评分精度.
- 视频-LLaMA(16个,Q-前) 、视频-LLaVA(8个,MLP)、Qwen2.5-VL(动态FPS +TMRoPE) 之间的比较

## 交付它
本课会产出 `outputs/skill-video-vlm-frame-planner.md`△给定一个视频任务 ((监控,行动识别,时间定位,总结),它会选择框架样本,聚合因素,输出格式和预期精度级别.

## 练习
1. 对于一个3分钟的演示,选择制服还是动态FPS──用代币计数说明原因──

2. 什么是简单的时间嵌入表做不到的?

3. 写一个VLM可学习输出时间定位JSON方案――包含错误案例――

4. 阅读视频-LLaVA 第3节中"投影前的配列"为什么比训练独立的图像和视频编码器更好?

5. 给定视频中小企业排名榜,截至2026年,顶级开放模型与顶级专有模型之间的差距是多少?其中有多少差距可以归因于时间编码,多少可以归因于基础LLM规模?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM 会为事件发生时间输出具体 timestamp range |
| TMRoPE | "Time-Multimodal RoPE" | 带绝对 timestamps 的 3D rotary position，由 Qwen2.5-VL 使用 |
| Dynamic FPS | "Motion-aware sampling" | 在 high-motion segments 采样更多 frames，在 static segments 采样更少 |
| Frame pooling | "Spatial compress per frame" | 在进入 LLM 前用 bilinear interpolation 减少每个 frame 的 patches |
| Video Q-former | "Clip compressor" | 将 N frames 映射到 K learned queries 的 cross-attention bottleneck |
| VideoMME | "Video bench" | 综合 short/medium/long video benchmark，2500+ samples |

## 延伸阅读
- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
