# VLA thể hiện:RT-2, OpenVLA, π0, GR00T

> Lần đầu tiên được mô hình thực hiện trên trang web là RT-2 (Google DeepMind, tháng 7 năm 2023) ⋅RT-2 sẽ phân tán động tác thành văn bản Token, co-fine-tuning trên dữ liệu web với dữ liệu robot-action trên VLM, và chứng minh rằng kiến thức trên quy mô web có thể di chuyển sang kiểm soát máy tính. OpenVLA (ngày 6 năm 2024) đã phát hành 7B mở để tham khảo thực hiện. Phương pháp trí tuệ thể chất của π0 ⋅2024-2025) gia nhập các chuyên gia hành động phù hợp dòng chảy.

**Type:** 学习
**语言：**Python(stdlib, Action Tokenizer + VLA 推理骨架)
**Prerequisites:** Phase 12 · 05（LLaVA），Phase 15（Autonomous Systems，已引用）
**Time:** ~180 分钟

## Học mục tiêu

- 描述 hành động tokenization:离散 bin 编码(RT-2)、FAST 高效 hành động Token、连续 dòng chảy-tích hợp hành động(π0)。
- 解释 tại sao trên dữ liệu web + robot có thể được điều chỉnh đồng thời, có thể giữ lại chuyển giao kiến thức chung cho nhiệm vụ mới.
- Trong cùng một nhiệm vụ máy tính trên so sánh OpenVLA (OpenVLA)
- Nói ra Open X-Embodiment dataset  và tác dụng của nó như là RT-X training corpus

## 问题

能根据自然语言指令做家务的机器人, kể từ những năm 1970 đã là mục tiêu nghiên cứu.

Những thách thức đặc biệt của VLA:

1. 动作空间是连续的(đối hợp góc、 lực),并且高维(7-DOF cánh tay + 3-DOF nắm giữ = 10 dims ở 30 Hz)
2. 机器人专专训训数据稀缺──Open X-Embodiment có khoảng 1M quỹ đạo; Web text-image là 5B+──
3. Control frequency rất quan trọng. 30 Hz control loop có nghĩa là mỗi động tác chỉ có 33ms.
4. Sự an toàn. Phản ứng sai lầm sẽ làm hỏng phần cứng.

## 概念

### Đồ ký hành động (RT-2)

Kỹ thuật của RT-2: đưa mỗi mục tiêu chung biểu thị cho một mã thông tin sau khi được định lượng. sẽ được định nghĩa [-1, 1]  phạm vi phân tán thành 256 mã thông tin,并 sẽ mỗi mã thông tin được mô tả thành một danh mục từ vựng.

Trong dữ liệu hỗn hợp đối với PaLM-X VLM  thực hiện co-fine-tune:

- Cặp hình ảnh-tinh văn web ((captioning、VQA)。
- Robot biểu tình, hành động biểu hiện cho Token

模型看 tôi lên khối đỏ(lời)→ hình ảnh(vín)→ 10-Token hành động chuỗi(được phân khúc mục tiêu chung)。Web dự kiến đào tạo 保留 thông tin truyền tải:即使 快速移动 不在训练数据中,RT-2 也能遵循 移动向快速移动对象。

RT-2 论文中的推断为 3-5 Hz, bị giới hạn trong VLM tự rút mã.

### OpenVLA  开放的 7B 参考实现

OpenVLA(Kim et al.,2024 年 6 月) là mở权重的 RT-2 等价物──7B Llama backbone,DINOv2 + SigLIP 双视觉编码器, dựa trên 256 bins của hành động tokenisation──

Trong Open X-Embodiment 上训练(跨 22 个机器人的 970k quỹ đạo) ⋅附带 LoRA fine-tuning 支持,用于适配新机器人──

Inference: trên A100 上配合 định lượng có thể đạt 4-5 Hz;; đối với vận hành chậm đủ nhanh, nhưng không phù hợp với kiểm soát cao频;;

### FAST tokenizer  更快的行动解码

Pertsch et al. (pp.2024) chỉ ra, hiệu suất token hóa bin riêng biệt không cao, vì hầu hết các động tác tập trung trong khu vực nhỏ của bin-space.

Một quỹ đạo hành động 30 bước  biến thành khoảng 10 个 FAST Token, thay vì 300 个 Diskret-bin Token。Inference 速度提升 3-5x,且不损质量。

### π0 và các hành động phù hợp dòng chảy

Phương pháp thông minh vật lý của π0(Black et al.,2024 年 10 月) với thông tin của chuyên gia hành động phù hợp dòng chảy 替代离散 hành động Đồ chỉ:

- Một biến đổi hành động nhỏ 读取 VLM's hidden states,并通过 rectified flow 输出连续的50 bước hành động序列──
- đầu hành động 使用 dòng chảy phù hợp mất 训练;VLM trước tập 保持不变。
- Inference: chuỗi hành động hoàn chỉnh trong khoảng 5 bước biểu thị trong输出, thực tế đạt đến 50 Hz 控制。

π0 的主张: trong một tập hợp các nhiệm vụ hoạt động rộng lớn đánh bại OpenVLA và Octo.

π0.5 和 π0-FAST là tăng lượng nâng cấp.

### GR00T N1  面向人形的双系统

NVIDIA's GR00T N1(2025 年 3 月)面向人形机器人(>30 DOF, toàn身) cấu trúc:

- Hệ thống 2: VLM lớn 读取场景 + chỉ thị,并以约 1 Hz  tạo ra các mục tiêu phụ cấp cao.
- Hệ thống 1: biến đổi đầu hành động nhỏ, theo các mục tiêu phụ tạo ra các lệnh chung 50-100 Hz thấp tầng.

Những phân chia này đối với Kahneman's Quick Thinking và Slow Thinking:System 2 规划,System 1 执行.

GR00T N1.7(2025 年末) cải tiến quy mô dữ liệu。GR00T Sử dụng dữ liệu sim-to-real của Omniverse  thực hiện điều chỉnh tinh tế。

### Khám X mở

训练数据──RT-X(2023 年 10 月)汇集了 22 bộ dữ liệu, bao gồm 22 quỹ đạo 1M trên 22 cơ thể──Open X-Embodiment là một tập hợp được sử dụng bởi tất cả mọi người:

- ALOHA / Bridge V2 / Droid / RT-2 Kitchen / Language Table。
- Mỗi mẫu: ((robot trạng thái, hình ảnh xem, hướng dẫn, chuỗi hành động)
- 训练卫生:统一行动空间,归一化关节范围,调整摄像头尺寸.

OpenVLA và π0 đều được tập luyện trên Open X-Embodiment.

### Đồng-định-thượng với robot-chỉ

Đồng tinh chỉnh sẽ kết hợp dữ liệu VQA web với quỹ đạo robot 混合──比例 rất quan trọng: VQA 太多,模型会忘动作;机器人 dữ liệu 太多,模型会失去了通用知识──

RT-2 tỷ lệ: khoảng 1:1──OpenVLA:web-to-robot 约 0.5:1──π0:类似──精确比例是需要根据数据集尺寸调整的超参数──

Chỉ có robot 训练会产生任务专用模型,遇到出发指令就会失败。 Sự khác biệt về đồng tinh chỉnh là,模型不仅能处理 tôi lên khối đỏ(trong demo) ,还能处理 tôi lên đối tượng lớn thứ ba từ bên trái ().

### An toàn và giới hạn hành động

Mỗi VLA cấp sản xuất đều có:

- 硬 joint limits ((không thể vượt quá quy tắc施加扭矩)
- Giới hạn tốc độ (mới cắt)
- Biên giới không gian làm việc (End-effector 不能离开桌面)
- Đối với nhiệm vụ mới sử dụng sự chấp thuận của con người trong vòng.

Những điều này như kiểm tra lớp kiểm soát nằm bên ngoài VLA.


```figure
mm-action-tokens
```

## Sử dụng nó

`code/main.py`- Có thể là:

- 实现256-bin action tokenization 和 de-tokenization。
- 基于DCT + định lượng 草拟 FAST tokenizer──
- 比较(định dạng-bin、FAST、continuous-flow) ở mỗi bước hành động trên số Token
- 打印 RT-2 → OpenVLA → π0 → GR00T 的谱系摘要──

## 交付 nó

本课产 出 `outputs/skill-vla-action-format-picker.md`△给定一个机器人任务 ((manipulation, navigation, humanoid whole-body), trong phân biệt-bin + RT-2, FAST + OpenVLA, dòng chảy phù hợp + π0 hoặc hệ thống kép + GR00T 之间做选择──

## 练习

1. Một cánh tay 10 DOF, với 30 Hz  kiểm soát tần suất hoạt động. 256 bin của phân biệt-bin token hóa mỗi giây sẽ phát hành bao nhiêu token? 7B VLM  có thể theo dõi?

2. FAST Tokenization sẽ làm cho các quỹ đạo 30 bước  bị nén xuống khoảng 10 Token。 Nếu quỹ đạo 包含高频运动 (ví dụ như trống), người dùng sẽ mất gì?

3. Đầu phù hợp dòng chảy của π0 trong khoảng 5 bước để xác định.

4. Hệ thống 1 / Hệ thống 2 của GR00T 拆分对应 Kahneman── đề xuất một cách khác biệt tách tách tách ((System 3?), nó có thể giúp đi bộ hai chân──

5. 阅读 Open X-Embodiment Phần 4 关于数据集库存的内容──说出防止域名泄漏的三条库存规则──

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
