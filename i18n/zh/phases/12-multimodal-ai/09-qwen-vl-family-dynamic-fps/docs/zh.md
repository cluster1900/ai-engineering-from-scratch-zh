# 动态-FPS视频

> 文-VL家族 文-VL (2023)、Qwen2-VL (2024)、Qwen2.5-VL (2025)、Qwen3-VL (2025) 是2026年最具影响力的开放视觉语言模型谱系系──每一代人做出了决定性的结构押注,并在12个月内复制了开放生态的其他项目:通过M-RoPE实现原生态态分辨率、带绝对完整的动态FPS样本测试、ViT中关注窗口,以及输出形式化代理.到Qwen3-VL课时,这个配方已经稳定:一个支持生态宽度高输入的2D-ViT编码器,将其连接到大型M-RoPE语言的MLP中,以及让您理解这个过程中的每个阶段的行为,以及如何进行训练.

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## 学习目标
- 计算M-RoPE的三轴旋转 (时间,高度,宽度),并解释为什么三者都需要――
- 为视频选择动态-FPS样本采集策略,并推理每秒的代币与事件检测精度之间的取舍.
- 顺序说出Qwen-VL四代升级,以及每代启动了什么.
- 连接一个Qwen2.5VL式JSON代理输出格式,并从VLM 响应中解析结构化工具调用──

## 问题
文-VL 于2023年8月发布,是对LLaVA-1.5和BLIP-2的直接反应.

分辨率:LLaVA-1.5 运行在336x336──对照片也可以,但对中文发票或密集电子表格截图没有用──Qwen-VL的第一创新是448x448 和地面边界框输出,让模型能够指向对象──

视频:视频-LLaMA 堆叠逐个编码器并将它们给LLM. 它对短片有效,但不适用于多钟视频,因为这种类型的视频的时间轴才是信号.

结构化输出:LLaVA 输出自由格式文本──代理 需要 JSON──Qwen-VL 使用显式 JSON 输出格式训练,包括把边界框 坐标作为文本──

每一代Qwen-VL都扩展了这三条轴线之一.

## 概念
### 文-VL (2023年8月)

第一代:OpenCLIP ViT-bigG/14 作为编码器 (2.5B参数) 、LLama兼容的Q-Former (含 256个查询) 、Qwen-7B基础──贡献:

- 现在,我们在车上看了.
- 语音:使用带显式坐标标标标 输出图像文字对子 训练──"猫在 <box>(112, 204), (280, 344)</box>"──
- 从一开始就进行中文+英文多语言训练.

当时的基准:英文上可与GPT-4V竞争,中文上占优优.

### wen2-VL (2024年9月)  M-RoPE 与原生分辨率

换成固定分辨率 + Q-Former stack──关键变化:

- 原生动态分辨率──ViT 接受任何HxW 可被 28 整除的输入──Patch 14 带 2x 空间融合)──1120x672 的图像──40x24 合并的补丁) 会产生 960 个视觉代码──无需变大、无需造、无需小图片──
- 对于图像 t=0;对于视频 t = frame_index──RoPE 按每个轴的频率旋转查询/键向量──没有位置嵌入表──
- 通过合补丁代币上使用2层MLP──
- 带动态FPS的视频──默认以1-2FPS采样视频,但模型接受任意数──

结果:Qwen2-VL-7B 在多个多模拟基准上追赶GPT-4o,并在 DocVQA上超过它(94.5vs88.4);;架构变化是决定性的步骤――

### wen2.5-VL(2025年 2月) 动态FPS+绝对时间

动态FPS不仅需要采用更多的.

- 绝对时间代币――不使用位置索引 ((框0,1,2...),而使用实际时间──"在0:04时,猫跳跃. "模型会看到与框代币交错的`<time>0.04</time>`标签
- 动态FPS──慢速材料以1FPS采样,动作场景以4+FPS采样──由用户或训练器选择;M-RoPE 会适应──
- 空间关注 采用窗户的块内局部) 提升吞吐;每隔几层加入全球关注.
- 显式 JSON 输出格式──使用工具调用 数据训练:"{\"工具\": \"点击\", \"弦\": [380, 220]}"──开箱即代理准备──
- 视频频频频段不会耗尽频率范围.

基准:Qwen2.5-VL-72B 在大多数视频基准上超过GPT-4o,在文档上追赶Gemini 2.0,并为GUI地面设定开放模型SOTA(ScreenSpot:84%精度与GPT-4o的38%) ⋅

### 文3-VL (2025年11月)

文3VL是一次增量升级,重点是整合而不是重新发明:更大的LLM背骨文3-72B) 、扩展的训练数据、改进的OCR,以及通过Qwen3 思维模式 获得更强的推理.

这个谱系的结论:到2025年,Qwen-VL 架构已经稳定了.

### 数学上,M-RoPE

经典 RoPE 使用成坐标,按位置 `m`旋转维度为`d`的查询`q`其他:

```
q_rot[2i]   = q[2i]   * cos(m * theta_i) - q[2i+1] * sin(m * theta_i)
q_rot[2i+1] = q[2i]   * sin(m * theta_i) + q[2i+1] * cos(m * theta_i)
theta_i     = 10000^(-2i/d)
```

,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`d = 96`△分配32个 给时间、32个高度、32个宽度──每条条条条 按自己的轴位置旋转──位于 (t=5,h=10,w=20) 的补丁 会在其三条条条条段 上分别应用旋转`R_t(5)`,我知道.`R_h(10)`,我知道.`R_w(20)`,我知道.

文字标记 使用 `t = text_index, h = 0, w = 0`视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用 视频使用`t = frame_time, h = row, w = col`△单图像使用`t = 0`,我知道.

好处:一个位置编码即可处理文本,图像和视频,无需分支代码或不同的位置表.

### 动态-FPS 采样逻辑

给定一个时间为`T`秒的视频和目标标志 预算 `B`其他:

1. 计算你能承担的最大FPS:`fps_max = B / (T * tokens_per_frame)`,我知道.
2. 从`{1, 2, 4, 8}`中选择满足 `fps <= fps_max`目标是FPS.
3. 如果运动强,选择更高的FPS──如果运动弱,选择更低的FPS──
4. 按选定的FPS 均采样;在之间插入 `<time>t</time>`标签

文2.5VL 会隐式训练这种逻辑;推理时用户通过 `fps`参数控制――一个60秒动作序列,以4FPS、每81个代币计算,等于19440个代币,在32k背景中可管理――

### 结构化代理输出

文2.5VL的代理 训练显式面向结构化工具调用:

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

解析是确定性的:对模型输出执行JSON.parse──相比之下,自由格式的"点击 (1024, 512) "需要regex 和歧义处理──这个转变解释了为什么Qwen2.5VL的屏幕点分数从Qwen2-VL的55%跃升到84%.──


```figure
mm-mrope-axes
```

## 使用它
`code/main.py`实现了:

- 进行M-RoPE位置计算.
- 动态FPS样本:给定 (持续时间,预算,运动_水平),选择FPS 并输出框架时间标签──
- 一个玩具版 Qwen2.5VL JSON输出解析器,用于处理带坐标字段的工具呼叫响应.

运行它,然后在一个5分钟视频上把固定FPS 换成动态FPS,感受差异.

## 交付它
本课产出发 `outputs/skill-qwen-vl-pipeline-designer.md`△给定一个视频任务 (监控,代理,行动识别,可访问性),它会输出Qwen2.5VL配置 (框架预算,FPS策略,窗口注意力旗,代理输出模式) 和延迟估算.

## 练习
1. 计算隐藏 48(每条频段 16,基线 10000) 当,位于 (t=3,h=5,w=7) 的补丁的M-RoPE 旋转――展示每条频段 中前三对的旋转角度――

2. 一段10分钟的安全摄像头录像,以1FPS将产生多少?在384分辨率和3x池下,总代币数是多少?

3. 为30秒网球回合,30秒食谱演示,30秒 UI-代理录屏分别选择FPS──使用动态FPS逻辑说明理由──

4. 文2.5VL 完全取消了Q-Former──为什么简单的MLP在2025年可行,但在2023年不可行?

5. 将三个Qwen2.5VL JSON工具调用输出解析为Python dict――错误的JSON会发生什么失败?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | hidden dim 中带 temporal、height 和 width bands 的 3D rotary position embedding |
| Dynamic FPS | "Smart sampling" | 根据运动、时长和 Token 预算为每个视频选择的帧采样率 |
| Absolute time token | "Timestamp token" | 在序列中交错插入的 `<time>t</time>`，让模型看到实际秒数而不是帧索引 |
| Window attention | "Local attention" | 为提速而限制在小窗口内的 spatial self-attention；周期性加入 global attention |
| Structured agent output | "JSON mode" | 通过训练数据监督教 VLM 输出可解析 JSON，其中包含 coords 和 tool names |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的每请求控制项，用来约束总像素数，从而约束 Token 数 |
| Grounding | "Point-at-it" | 将 bounding-box 坐标作为文本 Token 输出；自 Qwen-VL v1 起使用 |

## 延伸阅读
- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
