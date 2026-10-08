# MARL  MADDPG, QMIX, MAPPO

> đa đại lý 协调  tăng cường học tập  truyền tải, trong năm 2026 vẫn ảnh hưởng đến LLM-agent 系统**MADDPG**(Lowe et al., NeurIPS 2017, arXiv:1706.02275)  giới thiệu Căn bộ tập trung, Thực hiện phi tập trung (CTDE): trong thời gian đào tạo, mỗi nhà phê bình đều có thể nhìn thấy tình trạng và động tác của tất cả các đại lý;测试时只运行本地 actor──适用于合作、竞争和混合场景──**QMIX**(Rashid et al., ICML 2018, arXiv:1803.11485) là带有单调混合网络的值分解; mỗi đại lý của Q 会组合成关联 Q, do đó `argmax`Có thể được phân phối trực tiếp cho các đại lý  chiếm vị trí chủ đạo trong StarCraft Multi-Agent Challenge (SMAC).**MAPPO**(Yu et al., NeurIPS 2022, arXiv:2103.01955) là một PPO có chức năng giá trị tập trung; trong thế giới hạt-SMAC、Google Research Football、Hanabi 上, chỉ cần极少调参就lực kỳ hiệu quả──这些方法支了必须分散的行动的代理团队政策──训练──MAPPO là**2026 年 cooperative-MARL 的默认 baseline** 本课会从一个小小的网球玩具 构建每种方法, 在接触LLM-agent培训之前,先把这些想法练成肌肉记忆──

**类型：**Học tập
**语言：**Python (stdlib,小型无 NumPy 实现)
**先修：**Giai đoạn 09 (Việc học tập tăng cường), Giai đoạn 16 · 09 (Mạng lưới sôi động song song song)
**时间：**~ 90 phút

## 问题

LLM-agent 系统越来越地训练间代理协调 政策:何时推迟何时行动调用哪个同行――告诉你如何训练这种政策的文献就是多代理强化学习 (MARL), nó sớm hơn LLM 潮潮,并且已经有一个小组主流算法――

Nếu không có từ vựng mô hình, đọc MARL 论文会很痛苦──Centralized training with decentralized execution (CTDE) ‧ value decomposition 和 centralized critics 不是流行词 它们是对具体问题的具体答案:

- RL độc lập (rằng đại lý) Từ góc nhìn của mỗi đại lý, nhìn là không ổn định.
- RL tập trung (RL) không thể mở rộng và vi phạm các hạn chế thực hiện.
- CTDE 兼得两者优点: Sử dụng thông tin toàn cầu 训练, sử dụng chính sách địa phương 部署。

## 概念

### 论文使用的三类环境

- **Particle World (multi-agent particle env)。**简单 2D vật lý, bao gồm các nhiệm vụ hợp tác/ cạnh tranh.
- **StarCraft Multi-Agent Challenge (SMAC)。**Hợp tác quản lý vi mô, quan sát một phần.
- **Google Research Football, Hanabi, MPE。**MAPPO cơ sở:

Không giống như các môi trường có hành động / quan sát khác nhau 类型──算法 会据此选择──

### MADDPG (2017)  CTDE pattern

Mỗi đại lý`i`Có một diễn viên trong thành phố.`mu_i(o_i)`, đưa quan sát của mình 映射到行动. Mỗi nhân viên cũng có một nhà phê bình.`Q_i(x, a_1, ..., a_n)`, nó trong quá trình đào tạo thấy tất cả các quan sát và tất cả các hành động.

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

Tại sao sử dụng CTDE: khi tập luyện, chúng tôi biết hành động của tất cả mọi người; chúng tôi sử dụng thông tin này để giảm sự khác biệt của mỗi nhà phê bình.`o_i`,并调用 `mu_i(o_i)`

失败模式:chính trị viên sẽ theo dõi các tác nhân 增长(输入包含所有行动) ⋅ Nếu không có sự gần gũi, rất khó để mở rộng đến ~ 10 tác nhân trên ⋅

### QMIX (2018)  phân hủy giá trị

Chỉ phù hợp với hợp tác. Phí thưởng toàn cầu là chức năng đơn giản của giá trị Q của mỗi đại lý.

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

Sự đơn thuần bảo đảm`argmax_a Q_tot`Có thể thông qua mỗi đại lý  độc lập chọn `argmax_{a_i} Q_i`Để tính toán. Đó là điều mà anh cần.**decentralized execution property** Trình luyện, kết hợp mạng lưới từ mỗi đại lý của Q 生成 `Q_tot`

Tại sao QMIX ở SMAC 上获胜: hợp tác quản lý vi mô StarCraft 具有同质的代理,本地obs,全球奖励 与价值分解 完美契合──

失败模式:tránh giới hạn monotonicity 限制较强; một số nhiệm vụ của cấu trúc phần thưởng không phải là monotone phân hủy được (ví dụ một đại lý vì sự hy sinh của đội)  mở rộng phương pháp (QTRAN、QPLEX) sẽ giải phóng điều này 

### MAPPO (2022)  被低估的默认选择

Multi-Agent PPO:带集中价值函数的PPO──每个代理都有自己的政策;所有代理 共享(或拥有每代理)能看到全状态的价值函数──Yu et al. 2022 在五个基准上将MAPPO与MADDPG、QMIX 及其扩展进行比较,并发现:

- MAPPO trong thế giới hạt-SMAC Google Research Football Hanabi  MPE 上匹配或超越非政策 MARL 方法──
- 极少──
- 训练稳定;跨种 可复现──

Trước bài viết này, cộng đồng đã đánh giá thấp về MARL chính sách. Đến năm 2026, MAPPO là cơ sở tiêu chuẩn của MARL hợp tác; bất kỳ phương pháp mới nào đều phải đánh bại nó.

### Tại sao các kỹ sư đại lý LLM  nên quan tâm

三个直接用途:

1. **Router training。**Meta-agent  chọn哪个子代理 处理任务──这是一个包含N 个分散子代理 和一个集中路由器的 MARL 问题──MAPPO 适合──
2. **Role emergence。**Trong mô phỏng đại lý sinh sản, đại lý đào tạo 随着时间采用互补作用, bản chất là giả mạo thành hình thức khác của MARL 问题──QMIX kiểu phân hủy giá trị 通过结构强制补充性──
3. **Multi-agent tool use。**Khi các đại lý chia sẻ công cụ và tranh giành ngân sách, thông qua CTDE  đào tạo chúng có thể có được các chính sách địa phương có thể triển khai, và tuân thủ các hạn chế tài nguyên.

Thực tế: Đến năm 2026, hầu hết các sản xuất LLM-agent 系统 là chính sách của họ, thay vì đào tạo chúng.

### CTDE  như mô hình thiết kế bên ngoài RL 

Ngay cả khi không tập luyện, CTDE cũng là mô hình kiến trúc hữu ích:

- Trong giai đoạn thiết kế, giả sử có khả năng nhìn thấy toàn bộ đội hình.
- Trong giai đoạn chạy, bắt buộc thực thi phi tập trung: mỗi nhân viên chỉ nhìn thấy`o_i`

Mô hình này 迫 bạn rõ ràng duy trì mỗi nhà nước đại lý,并提前 suy nghĩ về khả năng quan sát một phần. Nhiều sản xuất đa đại lý  hệ thống 默假设 ở khắp mọi nơi đều có nhà nước chung.

### không ổn định 问题

Khi nhiều đại lý cùng lúc học tập, mỗi môi trường của đại lý (cụ thể các chính sách của đại lý khác) đều không tĩnh.

- MADDPG: Phản tra toàn cầu thấy tất cả các hành động, vì vậy ước tính giá trị của nó là không còn lại.
- QMIX: sự phân hủy giá trị sẽ chuyển học tập đến không gian chung-Q, nơi tối ưu có ý nghĩa xác định.
- MAPPO: chức năng giá trị tập trung sẽ ngăn chặn sự thay đổi chính sách của các đại lý khác.

Trong hệ thống đại lý LLM, không ổn định biểu hiện vì  đại lý của tôi 上个月还正常,现在上游另一个代理 改了,我的就异常了──带 CTDE của MARL đào tạo là phương pháp sửa chữa nguyên tắc; cấp độ nhanh chóng sửa chữa hơn, nhưng耐久性较差──

### 本课不涵盖什么

训练真实网络是Phase 09 的主题──本课构建脚本政策 版本,在没有梯度更新的情况下演示CTDE、值分解和集中值模式──目标是你使用完整的 MARL库之前,先内化这些模式──


```figure
sw-ctde
```

##  xây dựng nó

`code/main.py`Trong một thế giới lưới hợp tác 2 đại lý rất nhỏ đã thực hiện ba mô hình biểu hiện:

- Môi trường: 2 个代理 在 4x4 grid 上, một viên viên thưởng. 奖励 = Nếu một viên viên nào đạt đến viên viên, thì là 1; nhiệm vụ kết thúc.
- `IndependentAgents` Mỗi đại lý                                                                                                                                                                                                                                                             
- `MADDPGStyle` phân tích tập trung 计算 giá trị chung; chính sách của các diễn viên 从中更新;;
- `QMIXStyle` Sử dụng mixer monotone của giá trị phân hủy。
- `MAPPOStyle` chức năng giá trị tập trung;quản lý 根据共享基线 更新。

Người dùng sử dụng cùng một tập,并 báo cáo trung bình bước đến mục tiêu.

运行:

```
python3 code/main.py
```

预期输出: các đại lý độc lập 平均需要 ~6 步; CTDE biến thể 会收到 ~3.5 步(4x4 lưới của tối ưu là 3)。 ngay cả khi sử dụng các chính sách kịch bản, mô hình 差异也会显现。

## Sử dụng nó

`outputs/skill-marl-picker.md`Đó là một kỹ năng, được sử dụng cho việc xác định nhiệm vụ đa đại lý  chọn thuật toán MARL: hợp tác đối với cạnh tranh  đồng nhất so với đa dạng  hành động-không gian loại  quy mô  tín hiệu phần thưởng 

## 交付 nó

Trong sản xuất MARL 很少见──当你确实使用它时:

- **从 MAPPO 开始。**Bài viết năm 2022 sẽ được thiết lập như một đường cơ sở; trước tiên, nó có thể được thực hiện trong vài tuần sau để theo đuổi thời gian của phương pháp phong phú hơn.
- **记录每个 agent 的 observation 和 action stream。**Không có dấu vết của nhân viên nào, tháo gỡ MARL gần như không có gì.
- **分离 training code 和 execution code。**CTDE là một hình thức kỷ luật; hãy thực hiện thực hiện thực sự chỉ nhìn thấy`o_i`
- **Reward shaping 警告。**MARL đối với thiết kế phần thưởng 极其敏感── hình thành trong một lỗi phối hợp, đại lý 就会学会利用它──运行 thử nghiệm đối kháng──
- **对于 LLM agents**, ưu tiên các chính sách cấp độ nhanh chóng. Chỉ khi dữ liệu tương tác + tín hiệu phần thưởng + cơ sở hạ tầng đều có, mới có thể tham gia vào đào tạo MARL.

## 练习

1. 运行 `code/main.py`◊ Sự khác biệt giữa các đại lý độc lập đo lường và các đại lý kiểu MAPPO  bước đến mục tiêu ◊ trên lưới 6x6, sự khác biệt này sẽ lớn hay nhỏ?
2. Thực hiện một biến thể cạnh tranh: hai đại lý, một viên, chỉ có đại lý đầu tiên đến được phần thưởng.
3. 阅读 MADDPG (arXiv:1706.02275) Phần 3。用你自己的话,以伪代码形式象征性实现确切的批评更新规则──
4. 阅读MAPPO (arXiv:2103.01955) ――为什么作者认为中心化价值 + PPO 在他们的基准上胜过非政策 MARL?列出三个强大主张──
5. Để sử dụng CTDE như một mô hình thiết kế được áp dụng cho một hệ thống đại lý LLM giả tưởng (ví dụ như đại lý nghiên cứu + tổng hợp + lập trình)

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| MARL | "Multi-Agent RL" | 面向 multi-agent 系统的 Reinforcement Learning。 |
| CTDE | "Centralized Training, Decentralized Execution" | 用 global info 训练；用 local policies 部署。 |
| MADDPG | "Multi-Agent DDPG" | CTDE，每个 agent 的 critic 能看到所有 observations + actions。 |
| QMIX | "Value decomposition" | 每个 agent 的 Q 的 monotonic mixing。Cooperative。 |
| MAPPO | "Multi-Agent PPO" | 带 centralized value function 的 PPO。2026 年默认 baseline。 |
| Value decomposition | "Sum of individual Qs" | Joint Q 表示为每个 agent 的 Q 的 monotone function。 |
| Non-stationarity | "Moving targets" | 当其他 agent 学习时，每个 agent 的 env 都在变化。MARL 的核心问题。 |
| On-policy / off-policy | "Learn from current / replay" | PPO 是 on-policy (MAPPO)；DDPG 和 Q-learning 是 off-policy。 |
| SMAC | "StarCraft Multi-Agent Challenge" | cooperative micromanagement benchmark；QMIX 的本土主场。 |

## 延伸阅读

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) MADDPG;NeurIPS 2017
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) QMIX;ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) MAPPO;NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) đối với kết quả của MAPPO  dễ đọc khung
- [SMAC repository](https://github.com/oxwhirl/smac) StarCraft Multi-Agent Challenge
