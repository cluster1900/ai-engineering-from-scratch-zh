# 面向 LLM của Swarm Optimization ((PSO, ACO)

> 生物启发式优化 正在LLM 领域回归──**LMPSO**(arXiv:2504.09247) sử dụng PSO, tốc độ của mỗi hạt là một prompt, LLM 生成下一个候选人; nó trong cấu trúc trình bày**Model Swarms**(arXiv:2410.11163) Đặt mỗi chuyên gia LLM 视为模型权重多元 上一个PSO粒子,并报告在9数据集上相比12基线有**13.3% average gain**, và mỗi vòng chỉ cần 200 trường hợp.**SwarmPrompt**(ICAART 2025) sẽ PSO + Grey Wolf 混合 được sử dụng để tối ưu hóa nhanh chóng.**AMRO-S**(arXiv:2603.12933) là các chuyên gia pheromone được ACO khởi động, được sử dụng cho nhiều đại lý LLM định tuyến**4.7x speedup**、có thể giải thích bằng chứng định tuyến, cũng như sẽ đưa ra suy luận và cập nhật không đồng bộ chất lượng của việc học giải.

**类型：**Học + xây dựng
**语言：**Python (stdlib)
**先修：**Giai đoạn 16 · 09 (Tương đồng mạng lưới thu thập hàng), Giai đoạn 16 · 14 (Tổng thống nhất và BFT)
**时间：**~ 75 phút

## 问题

Bạn có một lời nhắc, trong nhiệm vụ đánh giá lên điểm 62%── Bạn muốn cải thiện nó── đơn giản thực hành là không có Gradient của động điều chỉnh, nhưng cách mở rộng là rất kém──Reinforcement Learning  cần tín hiệu phần thưởng và đủ nhiều triển khai để đào tạo── thông qua lời nhắc làm Backpropagation 并不现实 lời nhắc là chia rẽ các chuỗi, không phải là có thể phân tích nhỏ──

经典生物启发式优化  用于连续搜索空间的PSO、 用于路径选择的ACO  正是为这种场景设计的:无 Gradient、基于种群、每次评估 成本低──把它们与 LLM 配合用于无 Gradient 搜索步骤,就能得到一个出乎意料的实用优化器──

Tương tự mô hình cũng áp dụng cho các hệ thống đa đại lý trong các hệ thống đại lý *routing*。ACO 风格的色素轨迹 会记录哪个代理在哪类任务上表现最好,让路由器利用这个轨迹,并让色素衰减,以便路线可以重新发现。

## 概念

### Tái mới PSO (Kennedy & Eberhart 1995)

Particle Swarm Optimization:连续搜索空间中的粒子种群──每个粒子有位置`x_i`和 tốc độ `v_i`❖ Mỗi lần lặp lại:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

Trong số đó `p_best`Là hạt được kết quả tốt nhất của mình,`g_best`là kết quả tốt nhất của đám đông,`w, c1, c2`là sự bất lực + nhận thức + trọng lượng xã hội,`r1, r2`Đó là một yếu tố.

### LLM 输出上 PSO  LMPSO

arXiv:2504.09247 将 PSO 适应到 LLM 生成的结构化输出(数学表达式、程序) ・・・ mỗi hạt là một kết quả ứng cử viên。 Velocity 是一个 *prompt*, mô tả cách đưa kết quả hiện tại sang tốt nhất cá nhân/ toàn cầu 修改。 LLM 根据速度提示 生成新的输出──Velocity 的 inertia 是类似的做小增进变化的提示──

Điều này có hiệu quả tốt trong các trường hợp sau:
- 输出是结构化的(可解析、可评估)
- Kiến thức là tự động (测试运行,算术评估)
- Dân số 较小(~10-30 hạt), vì vậy总 LLM gọi là 保持可控。

Khi fitness cần đánh giá nhân tạo, nó không hiệu quả tốt  Chi phí của mỗi lần lặp lại sẽ trở nên quá cao.

### Mô hình Swarms

ArXiv:2410.11163 sẽ PSO từ lớp sản xuất 带 đến *model* layer。 mỗi particle là một chuyên gia LLM(pharameter)。Swarm  thông qua không Gradient update sẽ các tham số hướng tới tập thể tốt nhất 移动。

关键洞察是 LLM chuyên gia mô hình đã được chia sẻ các yếu tố đa dạng trong nhau gần nhau(nhanh bộ chuyển đổi, LoRA delta) ⋅ trong không gian này thấp dimension làm PSO 成本低且有效──

### ACO refresh ((Dorigo 1992)

Nền tạo kiến Optimization:ants 遍历图;每条路都有色素的轨迹──️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### AMRO-S  dùng để định tuyến ACO của đại lý

ArXiv:2603.12933 Sử dụng ACO làm nhiều đại lý định tuyến. Mỗi loại nhiệm vụ là một của định tuyến. Mỗi đại lý là một 条可能路线.

- **可解释的 routing evidence。**Nguồn pheromone là tín hiệu của con người.
- **Quality-gated asynchronous update。**Phero-mon chỉ trong kiểm tra chất lượng  thông qua các bản cập nhật sau, sẽ suy luận và học hỏi 解──
- Trong điểm chuẩn định tuyến đa đại lý 上实现 **4.7x speedup**

Cổng chất lượng rất quan trọng: không có nó, các đại lý nhanh nhưng sai sẽ tích lũy pheromone, hệ thống sẽ khóa trong các tuyến đường xấu trên.

### 什么时候为 LLM 使用 PSO / ACO

**使用 PSO 当：**
- Không gian tìm kiếm là连续的, hoặc có thể được hiển thị đến连续参数(quan nhập  LoRA trọng lượng  số lượng tạo参数) 
- Khỏe mạnh 便宜且自动──
- Dân số có thể rất nhỏ (với 10-30)

**使用 ACO 当：**
- Bạn có đường dẫn hoặc lựa chọn đường đi 问题──
- Các quyết định sẽ tăng cường theo thời gian (những loại nhiệm vụ tương tự sẽ xuất hiện lại)
- Bạn cần các quyết định định tuyến đường của chứng cứ có thể giải thích.

**不要使用二者当：**
- Khỏe mạnh  cần đánh giá nhân tạo( mỗi lần lặp lại 成本过高)
- Không gian tìm kiếm là phân tán và hợp nhất, trong khi PSO không thể bao gồm được các thuật toán di truyền được thay đổi)
- Quyết định thời gian thực 需要严格延迟(PSO/ACO 相比单通路测量 收较慢)

### Tại sao lại được lấy cảm hứng từ sinh học?

基于 Gradient的方法需要可微信号──LLM đầu ra và quyết định định định tuyến 并不自然可微──Pseudo-gradient 方法(reinforcement-learned routers、DPO-style prompt tuners) 可行,但需要昂贵的训练──

PSO và ACO chỉ cần một chức năng * đánh giá *. Nếu bạn có thể cho ứng viên ra hoặc quyết định định định tuyến 打分, bạn có thể tối ưu hóa trong không gian này.

###  thực dụng giới hạn

- **Population budget。**N hạt × T lặp lại × chi phí mỗi năm.$0.02 / call 的情况，一个 20-particle PSO 跑 50 iterations 大约花费 ~$20  theo quy hoạch
- **Exploration vs exploitation。**Tốc độ phân rã pheromone với sự tĩnh mạch của PSO  có sự trao đổi; phân rã quá nhanh →  quên giải pháp; quá chậm → 卡在早期地方最佳──
- **Catastrophic drift。**Nếu bối cảnh thể dục 发生变化 (một sự phân phối dữ liệu mới), hai loại thuật toán đều có thể hội tụ trước, sau đó khác nhau.


```figure
swarm-stigmergy
```

## 构建

`code/main.py`实现:

- `LMPSO`Trong số lượng các tham số nhanh chóng (nhiều lượng, trọng lượng trên) trên chạy PSO.
- `AMRO_S` ACO 风格 định tuyến──3 个 đại lý、4 种类型 nhiệm vụ、pheromone matrix、100 个任务路由──打印一段时间内(task_type → agent choices)
- Đối với: trên cùng dòng công việc trên so sánh định tuyến ngẫu nhiên với ACO định tuyến.

运行:

```
python3 code/main.py
```

预期输出:
- LMPSO:g_best fitness trong 30 lần lặp lại 内从随机值提升到接近最佳.
- AMRO-S:pheromone table  ổn định đến từng loại nhiệm vụ đối phó với các tác nhân chính xác; ACO định tuyến trong chất lượng cao hơn ngẫu nhiên cao khoảng ~30-40%, đồng thời giảm độ trễ ((更少重试) ]]

## 使用

`outputs/skill-swarm-optimizer.md`帮助在PSO、ACO、基因算法和基梯式优化器 之间选择,用于 LLM / đại lý tối ưu hóa các vấn đề。

## 交付

- **从小开始。**10-20 hạt,20-50 lặp lại. Chỉ khi đường cong hội tụ  hiển thị rõ ràng thu nhập.
- **记录每轮 pheromones 或 g_best。**Không có dấu vết của các máy tối ưu hóa đám đông rất khó để gỡ lỗi.
- **Quality-gate updates。**Đặc biệt là ACO:快但错误的代理 绝不能累积费罗蒙──
- **在 distribution shift 时 reset decay。**Khi phân bố đánh giá thay đổi, pheromones lão hóa đã qua thời gian; đặt lại hoặc tạm thời tăng tỷ lệ phân rã.
- **限制每轮成本。**输出成本/iiteration metric― mỗi vòng chi phí 500$― chỉ mang lại 0,5% tăng PSO không thể vận chuyển―

## 练习

1. 运行 `code/main.py` quan sát sự hội tụ của LMPSO  thay đổi kích thước dân số 为 5、10、20、50──在哪个规模上时间到收缩 开始和?
2. 实现一个 灾难性漂移 实验:在回复30 后改变健身功能──PSO 适应得多快?Reset `p_best`Có giúp gì không?
3. 给 AMRO-S 添加质量门: chỉ có điểm đánh giá > 0,7 chạy 才 gửi pheromone── so với phiên bản của ổng chưa được thêm, điều này làm thế nào thay đổi sự hội tụ?
4. 阅读 LMPSO(arXiv:2504.09247) ――把论文中的 速度作为提示 映射回你的数值速度──模拟中丢失了什么,又保留了什么?
5. 阅读 AMRO-S(arXiv:2603.12933)。实现带异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异化

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995。基于种群的无 Gradient Optimizer。 |
| ACO | "Ant Colony Optimization" | Dorigo 1992。通过 pheromone trails 进行 path/route optimization。 |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247。Velocity 是 prompt；LLM 生成 candidates。 |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163。在 model parameter subspace 上进行无 Gradient update。 |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933。覆盖 task-type × agent 的 pheromone matrix。 |
| p_best / g_best | "Personal / global best" | 每个 particle 和整个 swarm 目前找到的最佳 solutions。 |
| Pheromone | "Routing memory" | Edge 上的强度；随时间衰减；根据 quality deposit。 |
| Quality-gated update | "Only learn from good runs" | 以 quality check 为条件进行 pheromone deposit。 |
| Catastrophic drift | "Distribution shift" | Fitness landscape 改变；旧的 p_best 和 pheromones 变得过时。 |

## 延伸阅读

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) 1995 năm PSO 论文
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html)1992 năm ACO 基础
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) 面向结构化 LLM Outputs của PSO
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) Trong mô hình trọng lượng của không gian phụ trên của PSO
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) 带 quality gate 的 pheromone-driven routing
