# Chuyển Sim-to-Real

> Một chính sách trong mô phỏng được đào tạo nhưng thất bại trên phần cứng, bản chất là ghi nhớ mô phỏng.

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

## 问题

训练真实机器人 很慢、危险且昂贵──一个 biped 需要数百万训练集才能学会走走;而真实 biped 哪怕摔倒一次,也可能损坏硬件──模拟 给你无限重设、确定性可复现、并行环境,并且不会造成物理损坏──

Nhưng máy mô phỏng là sai lầm. Phân tích của các bộ đệm lớn hơn các mô hình MuJoCo. Các máy ảnh có biến dạng ống kính, trong khi máy mô phỏng không bao gồm.**reality gap**, tức là sự khác biệt hệ thống giữa phân phối sim và phân phối thực tế, là vấn đề cốt lõi của RL được triển khai trong robot.

Bạn cần một đối với *sim-to-real phân phối chuyển đổi* 具有强烈性政策──三种历史方法:randomize simulator(domain randomization) 、用少量真实数据 适配政策(domain adaptation / fine-tuning), hoặc nhận ra các参数 của hệ thống thực并匹配它们 (系统识别) ⋅ đến năm 2026, các phương pháp chính thức sẽ đưa ba người vào mô phỏng song song song với quy mô lớn ⋅ Isaac Sim、 Isaac LabMujoco MJX trên GPU) 结合──

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**Tobin et al. 2017,Peng et al. 2018。 Trong thời gian đào tạo, ngẫu nhiên mỗi người có thể ở robot thực tế trên các tham số sim khác nhau: khối lượng, tản độ tỷ lệ đòn đòn, tăng PD động cơ, ồn cảm biến, vị trí máy ảnh, ánh sáng, kết cấu, mô hình liên lạc。 chính sách Học đến một về ngày nay đang ở trong những điều kiện phân phối của sim , và biến đổi trong toàn phạm vi── nếu robot thực sự 落在训练包内, chính sách 就能工作──

- **优点：**Không cần dữ liệu thực tế. Một bộ phận, phù hợp với nhiều robot.
- **缺点：** Tập luyện quá ngẫu nhiên sẽ tạo ra một chính sách phổ quát nhưng quá thận trọng🏼   quá nhiều tiếng ≈ quá nhiều quy định🏼

**System Identification (SI)。**Trong bài tập trước, sử dụng dữ liệu thế giới thực Ứng dụng các tham số của mô phỏng. Nếu bạn có thể đo lường sự chi phối của robot thực tế trên cánh tay, hãy lấp nó vào sim.

- **优点：**精确、低噪音 训练目标:
- **缺点：**Rõ ràng là các lỗi mô hình còn lại đối với chính sách không thể nhìn thấy; những tác dụng không thể nhận ra nhỏ (ví dụ như băng điện chết) vẫn sẽ phá hủy việc triển khai.

**Domain Adaptation。**Trong sim training, sử dụng lại ít dữ liệu thực tế tinh tế.

- **Real2Sim2Real：**Sử dụng các bản triển khai thực tế học một mô phỏng dư thừa `f(s, a, z) - f_sim(s, a)`, tái sửa đổi trong sim training sau đó. Không cần quá nhiều dữ liệu thực để có thể giảm khoảng cách.
- **Observation adaptation：**训练一个政策, thông qua các tính năng học tập trích xuất (ví dụ: GAN pixel-to-pixel) sẽ thực sự obs → sim giống như obs;; điều khiển vẫn còn ở trong sim;;

**Privileged learning / teacher-student。**Miki et al. 2022(ANimal quadruped) ・・・ trong mô phỏng 中训练一个可以访问特权信息(地面真理摩擦、地面高度、IMU drift) 的 *老师*。再蒸留 一个只看到真实传感器观测的 *学生*。学生 学会从历史中推断特权特,并在物理参数变化下保持强──

**Massively parallel simulation。**20242026。 Isaac Lab、Mujoco MJX、Brax 都能在单个GPU上运行数千个平行机器人──PPO 搭配 4,096 个平行人形,可以在数小时内收集多年经验──随着训练分布变宽,现实差缩小;当这4,096 个环境中每个都有不同的随机参数时,DR 几乎是免费的──

**2026 年真实世界配方（quadruped walking 示例）：**

1. Sử dụng sim song song lớn,并 đối với trọng lực, khoan dung, tăng động lực, tải trọng, làm ngẫu nhiên miền.
2. Sử dụng thông tin đặc quyền (Terrain Map, Body Speed Truth)
3. Chỉ sử dụng proprioception (chế lập mã khớp chân) từ giáo viên để thu hút học sinh.
4. 可选: thông qua IMU thực trên của tự động mã hóa thực hiện điều chỉnh quan sát.
5. Đưa vào 10+ môi trường trên không bắn. Nếu thất bại, hãy sử dụng PPO bị hạn chế an toàn để làm vài phút tinh chỉnh thế giới thực.


```figure
f3-reality-gap
```

##  xây dựng nó

本课代码 là một màn trình diễn của một lĩnh vực ngẫu nhiên rất nhỏ, trường hợp là có những chuyển đổi * tiếng ồn * của GridWorld。 Chúng tôi đào tạo một chính sách, để nó trải qua khả năng trượt ngẫu nhiên trong sim, và sử dụng một trình độ trượt chưa từng thấy trong real để đánh giá。 hình dạng này có thể trực tiếp được chiếu vào chuyển đổi MuJoCo-to-hardware。

### 步骤 1: được tham số sim

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`Trong robot thực tế, nó có thể là sự chi phối, khối lượng, tăng động, hoặc có thể là bất kỳ sự thay đổi nào xảy ra giữa sim và thực.

### 步骤 2: Sử dụng DR 训练

Trong mỗi tập  bắt đầu, 采样 `slip ~ Uniform[0.0, 0.4]`◊ Training PPO / Q-learning / 任意方法──重复许多集──

### Bước 3: Trong real slip 上做零射 评估

Trong `slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`和 `0.7`Trong ngoại, DR-tren chính sách  nên trong hỗ trợ  trong giữ gần nhất, và trong hỗ trợ ngoại,滑退化 ⋅ cố định-slip-tren chính sách trong ngoại, training slip ⋅ sẽ rất hỏng.

### Bước 4: So với đào tạo hẹp

训练第二政策, chỉ sử dụng `slip = 0.0` Trong cùng nhóm `slip`Nhìn xem, nếu thực sự trượt > 0, trở lại sẽ giảm thảm họa.

## 陷

- **过多 randomization。**Trong `slip ∈ [0, 0.9]`Trên thực tế, chính sách của bạn sẽ trở nên cực kỳ liều lĩnh, cho đến khi bạn không cố gắng theo con đường tối ưu.
- **过少 randomization。**Trong một phạm vi rất nhỏ, chính sách hoàn toàn không thể phổ biến được.
- **误判 parameter space。**Randomize 错误的东西(真实差是机器延迟,但 Randomize camera hue),DR 不会有帮助──先配置 真实机器人──
- **Privileged info leakage。**Nếu giáo viên sử dụng trạng thái toàn cầu để thực hiện hành động, không chỉ là quan sát, thì có thể tạo ra sinh viên không thể theo dõi kết quả.
- **Sim-to-sim transfer failure。**Nếu chính sách của bạn đối với biến thể sim khó khăn hơn không vững chắc, nó cũng sẽ không vững chắc đối với thế giới thực.
- **没有 real-world safety envelope。**Một chính sách hiệu quả trong sim và hiệu quả trong thực tế, nếu không có tấm khiên an toàn cấp thấp, vẫn có thể làm hỏng các phần cứng.

## Sử dụng nó

2026 năm sim-to-real đống:

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

Đối với tất cả các quy mô, dòng công việc đều đồng nhất: cố gắng thích hợp với sim, ngẫu nhiên các phần bạn không thích hợp, đào tạo các chính sách lớn, tháo dỡ, sau đó mang theo tấm khiên an toàn triển khai.

##  phát hành nó

保存为 `outputs/skill-sim2real-planner.md`- Có thể là:

```markdown
---
name: sim2real-planner
description: 为给定 robot + task 规划 sim-to-real transfer pipeline，覆盖 DR、SI 和 safety。
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

给定一个 robot platform、一个 task，以及可访问真实硬件的时间，输出：

1. Reality gap 清单。按预期影响排序的可疑来源（contact、sensing、actuation delay、vision）。
2. DR parameters。精确列表、范围、distribution。针对 real measurements 论证每个范围。
3. SI steps。要测量哪些参数；测量方法。
4. Teacher/student 拆分。teacher 使用哪些 privileged info；student 使用哪些 obs。
5. Safety envelope。Low-level limits、emergency stops、backup controller。

拒绝在没有 (a) zero-shot sim-variant test，(b) safety shield，(c) rollback plan 的情况下 deploy。标记任何超过 measured real variability 3× 的 DR range，因为它很可能 over-randomized。
```

## 练习

1. **Easy。**Trong GridWorld cố định trượt ((slip=0.0) trên đào tạo một đại lý học Q──在 trượt ∈ {0.0, 0.1, 0.3, 0.5} 上评估──绘制 return vs slip──
2. **Medium。**训练一个 DR Q-làm việc học đại lý,采样 `slip ~ Uniform[0, 0.3]` đánh giá cùng nhóm lau bỏ  trong trượt=0.5 ((trên phân phối) khi, DR 带来 được lợi nhuận bao nhiêu?
3. **Hard。**Thực hiện một chương trình giảng dạy: từ slip=0.0  bắt đầu, mỗi khi chính sách đạt 90% tối ưu, mở rộng phạm vi DR── đo đạt slip=0.3 bước môi trường không-bút cần thiết,并 so với chuẩn gốc DR cố định đối với──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Reality gap | “Sim-to-real difference” | training 与 deployment 的 physics/sensing 之间的 distribution shift。 |
| Domain randomization (DR) | “Train across random sims” | 训练期间 randomize sim parameters，让 policy 泛化。 |
| System identification (SI) | “Measure real and fit sim” | 估计真实物理参数；设置 sim 来匹配。 |
| Domain adaptation | “Fine-tune on real data” | sim training 后进行少量 real-world fine-tune；可能适配 obs 或 dynamics。 |
| Privileged info | “Ground truth for teacher” | 只有 sim 拥有的信息；student 必须从 obs history 中推断它。 |
| Teacher/student | “Distill privileged -> observable” | teacher 使用捷径训练；student 学会在没有这些捷径的情况下模仿。 |
| ADR | “Automatic Domain Randomization” | 随着 policy 改进而拓宽 DR ranges 的 curriculum。 |
| Real2Sim | “Close the gap with real data” | 学习一个 residual，让 sim 模仿 real rollouts。 |

## 进一步阅读

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) 原始 DR giấy ((động cơ nhìn) 。
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) động lực của DR, động cơ bốn lần
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) Dactyl, quy mô lớn ADR。
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) Học sinh của một sinh vật.
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 驱动 20252026 triển khai sim song song rộng
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) Phương pháp chương trình học ADR。
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) Dyna frameing(使用模型做规划 + triển khai),支现代 sim-to-real pipelines。
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) phân loại các phương pháp sim-to-real,并包含 benchmark kết quả.
