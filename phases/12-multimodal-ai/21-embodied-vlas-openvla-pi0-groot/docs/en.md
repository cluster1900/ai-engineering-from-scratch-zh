# Embodied VLAs：RT-2, OpenVLA, π0, GR00T

> 第一次由模型从网站读取食谱并在厨房机器人中执行，是 RT-2（Google DeepMind，2023 年 7 月）。RT-2 将动作离散化为 text Token，在 web data 与 robot-action data 上对 VLM 进行 co-fine-tuning，并证明 web-scale vision-language 知识可以迁移到机器人控制。OpenVLA（2024 年 6 月）发布了开放的 7B 参考实现。Physical Intelligence 的 π0 系列（2024-2025）加入了 flow-matching action experts。NVIDIA 的 GR00T N1（2025 年 3 月）为大规模 humanoid robots 提供了 dual-system（System 1 / System 2）控制。VLA primitive，即 vision-language-action，一个能看、能读、能行动的单一模型，是本阶段理解模型与 Phase 15 自主系统之间的桥梁。

**Type:** 学习
**语言：** Python（stdlib，action Tokenizer + VLA 推理骨架）
**Prerequisites:** Phase 12 · 05（LLaVA），Phase 15（Autonomous Systems，已引用）
**Time:** ~180 分钟

## 学习目标

- 描述 action tokenization：离散 bin 编码（RT-2）、FAST 高效 action Token、连续 flow-matching actions（π0）。
- 解释为什么在 web + robot data 上进行 co-fine-tuning，可以保留对新任务的 general-knowledge transfer。
- 在同一个机器人任务上比较 OpenVLA（开放 7B Llama+VLM）、π0（flow-matching）和 GR00T N1（dual-system）。
- 说出 Open X-Embodiment dataset 及其作为 RT-X training corpus 的作用。

## 问题

能根据自然语言指令做家务的机器人，自 1970 年代以来一直是研究目标。2020 年代的答案是：vision-language-action（VLA）模型。它使用与 VQA 相同的 VLM 架构，但输出不是文本，而是动作（joint torques、end-effector poses、discrete commands）。

VLA 特有的挑战：

1. 动作空间是连续的（joint angles、forces），并且高维（7-DOF arm + 3-DOF gripper = 10 dims at 30 Hz）。
2. 机器人专用训练数据稀缺。Open X-Embodiment 有约 1M trajectories；web text-image 是 5B+。
3. 控制频率很关键。30 Hz control loop 意味着每个动作只有 33ms 预算。
4. 安全性。错误动作会损坏硬件、伤害人或破坏财产。

## 概念

### Action tokenization（RT-2）

RT-2 的技巧：把每个 joint target 表示为一个量化后的 text Token。将归一化的 [-1, 1] 范围离散化为 256 个 bin，并将每个 bin 映射到一个 vocabulary ID。一个 10-DOF action 在每个 control step 会变成 10 个 Token。

在混合数据上对 PaLM-X VLM 进行 co-fine-tune：

- Web image-text pairs（captioning、VQA）。
- Robot demonstrations，action 表示为 Token。

模型看到 “pick up the red cube”（language）→ image（vision）→ 10-Token action sequence（discretized joint targets）。Web pretraining 保留 general-knowledge transfer：即使 “fast-moving” 不在训练数据中，RT-2 也能遵循 “move towards the fast-moving object”。

RT-2 论文中的 inference 为 3-5 Hz，受限于 VLM autoregressive decode。

### OpenVLA — 开放的 7B 参考实现

OpenVLA（Kim et al.，2024 年 6 月）是开放权重的 RT-2 等价物。7B Llama backbone，DINOv2 + SigLIP 双 vision encoder，基于 256 bins 的 action tokenization。

在 Open X-Embodiment 上训练（跨 22 个机器人的 970k trajectories）。附带 LoRA fine-tuning 支持，用于适配新机器人。

Inference：在 A100 上配合 quantization 可达 4-5 Hz。对慢速操作足够快，但不适合高频控制。

### FAST tokenizer — 更快的 action decode

Pertsch et al.（2024）指出，discrete-bin tokenization 效率不高，因为大多数动作集中在 bin-space 的小区域内。FAST（Frequency-domain Action Sequence Tokenizer）通过 DCT 压缩 action sequences，并量化其系数。

一个 30-step action trajectory 变成约 10 个 FAST Token，而不是 300 个 discrete-bin Token。Inference 速度提升 3-5x，且不损失质量。

### π0 和 flow-matching actions

Physical Intelligence 的 π0（Black et al.，2024 年 10 月）用 flow-matching action expert 替代离散 action Token：

- 一个小型 action transformer 读取 VLM 的 hidden states，并通过 rectified flow 输出连续的 50-step action sequence。
- action head 使用 flow-matching loss 训练；VLM pretraining 保持不变。
- Inference：完整 action sequence 在约 5 个 denoising steps 中输出，实际达到 50 Hz 控制。

π0 的主张：在广泛的操作任务集合上击败 OpenVLA 和 Octo。continuous-action 表述保留了 discretization 会破坏的平滑性。

π0.5 和 π0-FAST 是增量升级。π0-FAST 将 FAST tokenization 与 flow matching 结合。

### GR00T N1 — 面向 humanoids 的 dual-system

NVIDIA 的 GR00T N1（2025 年 3 月）面向 humanoid robots（>30 DOF，全身）构建：

- System 2：大型 VLM 读取场景 + 指令，并以约 1 Hz 产生 high-level subgoals。
- System 1：小型 action-head transformer，根据 subgoals 产生低层 50-100 Hz joint commands。

这种拆分对应 Kahneman 的快思考与慢思考：System 2 规划，System 1 执行。优势：慢速 VLM 规模的规划不会阻塞快速控制；System 1 保持小型以降低延迟。

GR00T N1.7（2025 年末）改进了 data scaling。GR00T 使用来自 Omniverse 的 sim-to-real data 进行 fine-tune。

### Open X-Embodiment

训练数据。RT-X（2023 年 10 月）汇集了 22 个 dataset，覆盖 22 个机器人上的 1M trajectories。Open X-Embodiment 是所有人都使用的 corpus：

- ALOHA / Bridge V2 / Droid / RT-2 Kitchen / Language Table。
- 每个样本：（robot state、camera views、instruction、action sequence）。
- 训练卫生：统一 action space、归一化 joint ranges、调整 camera 尺寸。

OpenVLA 和 π0 都在 Open X-Embodiment 上训练。到任意特定机器人的 domain gap，可通过在 100-1000 条任务专用 demos 上进行 LoRA fine-tuning 来弥合。

### Co-fine-tuning 与 robot-only

Co-fine-tuning 将 web VQA data 与 robot trajectories 混合。比例很重要：VQA 太多，模型会忘记动作；robot data 太多，模型会丢失通用知识。

RT-2 的比例：约 1:1。OpenVLA：web-to-robot 约 0.5:1。π0：类似。精确比例是需要按 dataset size 调整的 hyperparameter。

Robot-only 训练会产生任务专用模型，遇到 out-of-distribution 指令就会失败。Co-fine-tuning 的差异在于，模型不仅能处理 “pick up the red cube（in demo）”，还能处理 “pick up the third largest object from the left（novel phrasing）”。

### Safety 和 action limits

每个生产级 VLA 都配有：

- 硬 joint limits（不能超过规格施加 torque）。
- Velocity limits（soft clipping）。
- Workspace bounds（end-effector 不能离开桌面）。
- 对新任务使用 human-in-the-loop approval。

这些作为 control-layer checks 位于 VLA 外部。VLA 的输出是建议，不是命令。

## 使用它

`code/main.py`：

- 实现 256-bin action tokenization 和 de-tokenization。
- 基于 DCT + quantization 草拟 FAST tokenizer。
- 比较（discrete-bin、FAST、continuous-flow）在每个 action step 上的 Token 数。
- 打印 RT-2 → OpenVLA → π0 → GR00T 的谱系摘要。

## 交付它

本课产出 `outputs/skill-vla-action-format-picker.md`。给定一个机器人任务（manipulation、navigation、humanoid whole-body），在 discrete-bin + RT-2、FAST + OpenVLA、flow-matching + π0 或 dual-system + GR00T 之间做选择。

## 练习

1. 一个 10-DOF arm，以 30 Hz 控制频率运行。256 bins 的 discrete-bin tokenization 每秒会发出多少个 Token？7B VLM 能跟上吗？

2. FAST tokenization 将 30-step trajectories 压缩到约 10 个 Token。如果 trajectory 包含高频运动（例如 drumming），用户会失去什么？

3. π0 的 flow-matching head 在约 5 个步骤中 denoise。将其吞吐量与 OpenVLA 在 4-5 Hz 下的 autoregressive decode 进行比较。

4. GR00T 的 System 1 / System 2 拆分对应 Kahneman。提出一种不同的拆分（System 3？），它可能帮助 bipedal walking。

5. 阅读 Open X-Embodiment Section 4 关于 dataset curation 的内容。说出防止 domain leakage 的三条 curation rules。

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|----------|
| VLA | "Vision-language-action" | 接收 image + instruction 并输出 action commands 的模型 |
| Action tokenization | "Discrete bins" | 将连续 joint targets 量化为每个 dim 256 个 bin，每个 bin 是一个 vocab ID |
| FAST tokenizer | "Frequency action tokens" | DCT + quantize，将 30-step trajectories 压缩到约 10 个 Token |
| Co-fine-tune | "Mix web + robot" | 在 robot demos 旁边同时使用 web VQA data 训练，以保留通用知识 |
| Flow-matching action head | "π0 continuous output" | 小型 transformer，通过 rectified flow 输出 50-step action sequence |
| System 1 / System 2 | "Dual-system control" | 大型 VLM 慢速规划，小型 action head 快速行动；GR00T 模式 |
| Open X-Embodiment | "RT-X dataset" | 1M-trajectory 跨机器人 dataset；training corpus |

## 延伸阅读

- [Brohan et al. — RT-2 (arXiv:2307.15818)](https://arxiv.org/abs/2307.15818)
- [Kim et al. — OpenVLA (arXiv:2406.09246)](https://arxiv.org/abs/2406.09246)
- [Black et al. — π0 (arXiv:2410.24164)](https://arxiv.org/abs/2410.24164)
- [NVIDIA — GR00T N1 (arXiv:2503.14734)](https://arxiv.org/abs/2503.14734)
- [Open X-Embodiment Collab — RT-X (arXiv:2310.08864)](https://arxiv.org/abs/2310.08864)
