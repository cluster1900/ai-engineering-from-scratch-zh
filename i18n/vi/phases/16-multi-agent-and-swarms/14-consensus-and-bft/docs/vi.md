# 面向 Agents' Consensus 和 Byzantine Fault Tolerance

> Các hệ thống phân phối cổ điển BFT 遇上随机 LLM. Năm 2025-2026 xuất hiện ba hướng nghiên cứu:**CP-WBFT**(arXiv:2511.10400) thông qua cuộc thăm dò tin tưởng cho quyền bỏ phiếu mỗi lần;**DecentLLMs**(arXiv:2507.14928) 采用无领导方式,并行工人提案与几何中介聚合;**WBFT**(arXiv:2505.05103) sẽ được cân nhắc bỏ phiếu với Clustering Structure Hierarchical 结合,把节点分分为核心和边缘──来自 Can AI Agents Agree? (arXiv:2603.01213) 诚实实证实结果是: ngay cả khi thỏa thuận quy mô, ngày nay cũng rất yếu, một nhân viên lừa dối về khả năng phá hủy hỗn hợp các nhân viên──BFT cần nhưng không đầy đủ──本课构建一个最小 BFT giao thức,注入三种特异性代理攻击(Byzantine lie、psychophantic conformity、correlated-error monoculture),并衡量每种共识 如何应对──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**前置要求：**Giai đoạn 16 · 07 (Xã hội tâm trí và tranh luận), Giai đoạn 16 · 13 (Tưởng thức chung)
**Time:** 约 75 分钟

## 问题

Bạn có N 个 LLM đại lý, mỗi thành phố sẽ xuất hiện một câu trả lời. Chúng không đồng ý.

现在加入一个欺骗的代理:它故意撒谎――或加入一个伪善的代理:它同意最后发言的人―― 在经典BFT中,假设是拜占庭节点占比为`f < n/3`Thực tế của năm 2026 là: LHM thậm chí trong thực tế cũng tự nhiên, sẽ trải qua các mô hình liên quan, và ảnh hưởng đến các kết quả của nhau. Bạn không thể coi chúng như cử tri Bernoulli độc lập.

经典 BFT(PBFT, 1999)并没有错,但它不完整――它处理任意 bit-flipping――它不处理三个诚实代理 因共享训练数据而共享同一个幻觉──本课从PBFT的基础开始,并叠加三种2025-2026年的适配──

## 概念
### 经典 BFT 给你什么

Thực tế Biến pháp chịu đựng lỗi Byzantine (Castro & Liskov, OSDI 1999) 可容忍 `f < n/3`个 Byzantine nodes──该协议有三个阶段(pre-prepare、prepare、commit) 和两个原始的(đăng ký thông điệp、quorum certificates)──它在`n >= 3f + 1`个诚意或恶意节点之间达成单个价值协议.

Những đảm bảo này rất mạnh mẽ, nhưng có những giả định sau:

1. **Independent faults。**Byzantines 不会协作──
2. **Honest nodes 确实诚实。**Kết quả trung thực của sự chính xác không phải là vấn đề;
3. **问题存在 ground-truth answer。**Đối với sự sai lầm đạt được sự đồng thuận vẫn là sự đồng thuận.

Các đại lý LLM  đã vi phạm những điểm này. Hai đại lý của mô hình cơ bản tương tự sẽ chia sẻ sai lầm. Một LLM  vẫn sẽ ảo giác. Đối với vấn đề mơ hồ, sự thật là nội dung của các đại lý quyết định, không có lời nói bên ngoài.

### 三种 LLM-specific attacks

**Byzantine lie。**Một đại lý 输出故意错误的答案――如果`f < n/3`, BFT 能处理它.

**Sycophantic conformity。**Một đại lý trước khi bỏ phiếu đọc câu trả lời của người khác, và giữ nguyên sự đồng thuận với người phát biểu cuối cùng. Đây không phải là ý xấu, nhưng sẽ liên quan đến tiếng nói lớn nhất.

**Correlated-error monoculture。**Ba đại lý chia sẻ một mô hình cơ bản. Chúng ảo giác xuất hiện với một câu trả lời sai.

### Phản ứng trong năm 2025-2026

**CP-WBFT**(arXiv:2511.10400)  Tự tin-Before-Testified Weighed BFT。 Mỗi cử tri 给自己的答案附加一个信心调查(自报概率,或单独校准模型的预测)。Tự tin 随着信心缩小──报告称在完整图上 BFT改善为 +85.71%──Mitigation 目标:sycophantic conformity(符合代理 往往对其主动所给出的位置信心 较低)。

**DecentLLMs**(arXiv:2507.14928)  无领袖── nhân viên lao động并行提出提案,评估员为提案 打分,最终答案是得点位置的几何中介──当`f < n/2`时具备强性──Mitigation 目标:Byzantine lie 和 correlated errors(đối với các điểm ngoại lệ, trung bình hình học mạnh,并拉向密集集群,而不是模型偏差平均)。

**WBFT**(arXiv:2505.05103)  Đánh nặng BFT với cấu trúc Hiệu ứng Nhóm phân loại. Đánh giá phiếu Từ chất lượng phản ứng 加上从历史学习到的信任分分配.将代理聚类为核心和边缘;Core agents 必须先达成共识,Edge agents 跟随.

### 实证: Liệu các đại lý AI có thể đồng ý không? (arXiv:2603.01213)

Bài viết này  đo lường nhiều mô hình biên giới trên thỏa thuận quy mô  Các đại lý LLM đạt được sự đồng thuận với một giá trị số đơn lẻ  tìm thấy không phù hợp:

- Ngay cả khi không có đối thủ, các đại lý LLM trong nhiều điểm chuẩn trên tỷ lệ bất đồng về các câu hỏi quy mô cũng vượt quá 30%.
- 单个采用欺骗人的代理 可将 混合代理共识 拉离诚实基线 40+百分点――
- Tỷ lệ bất đồng với sự đa dạng mô hình 相关; tập hợp khác nhau so với tập hợp đồng nhất 分歧更多(好处: không liên quan sai lầm), nhưng drift 也更慢(坏处: thời gian để thỏa thuận 更长) 』

Kết luận:BFT  cung cấp cho bạn các kết quả chuẩn, nhưng nó không nói cho bạn về kết quả chuẩn đúng không.

### 剥离到核心协议

Một vòng BFT tối thiểu của các đại lý LLM:

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

Các bước của việc tập hợp ngữ nghĩa là những thay đổi quan trọng của LLM- cụ thể. 2 câu trả lời: Nghiên cứu báo cáo cải thiện 4,2% và 4,2% thuộc cùng một tập hợp.

### Định hướng ngưỡng

`threshold`Các tham số quyết định何时接受、何时重试──过低: bạn sẽ chấp nhận yếu đa số──过高: bạn sẽ không bao giờ chấp nhận bất cứ điều gì── trải nghiệm phạm vi:对 `n=5-7`个代理为0.5-0.67; còn nhỏ hơn `n`需要更高值──低于值时, eskalate 给人类或另一个代理集团──

### Sự đồng thuận không thể cung cấp sự giúp đỡ

- **Ambiguous questions。**Nếu vấn đề không có sự thật căn bản, đồng thuận là một ý kiến.
- **Compound questions。**Thiết mã và giải thích nó 是两个答案──分别对每个答案投票──
- **Adversarial multi-round。**Nếu các đại lý có thể quan sát các vòng trước và bắt chước cuộc tranh luận năm 2023, họ sẽ bắt đầu đồng ý với nhau, không cần phải nói sự thật.


```figure
swarm-consensus-wave
```

##  xây dựng nó
`code/main.py`实现:

- `AgentVoter`Chính sách kịch bản của  带有 (trả lời, tin tưởng)
- `MajorityVote` 经典 đa dạng
- `CPWBFT` 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带                                                                                                                                                                                                                                                                                                                                                        
- `DecentLLMs` Trong các đề xuất được ghi điểm 上做几何- trung bình tổng hợp
- `Scenario`Trong ba kiểu tấn công, mỗi bộ tổng hợp được vận hành.

Các mô hình tấn công đã được thực hiện:

1. `byzantine`Một đại lý với sự tự tin cao.
2. `sycophancy`Một đại lý 复制 nó thấy câu trả lời đầu tiên,并 sử dụng sự tự tin phù hợp.
3. `monoculture`:三个 đại lý 共享一个错误答案(sự kết hợp sai lầm), sự tự tin 中等。

运行:

```
python3 code/main.py
```

预期输出:一张 ( tấn công, tổng hợp) -> câu trả lời cuối cùng của表,并高亮正确答案──Plurality trong trường hợp đơn sản xuất thất bại中──CPWBFT của sự tự tin trọng lượng 缓解 sycophancy──DecentLLMs của hình học-chấp trung bình trong đơn sản xuất 少于总体一半时会拉向诚实集群──

## Sử dụng nó
`outputs/skill-consensus-designer.md`Đối với các nhóm đa tác nhân thiết kế giao thức đồng thuận: phương pháp tập hợp, trọng lượng, ngưỡng, và chính sách leo thang của các vòng giới hạn dưới:

## 交付 nó
Trong việc phát hành bất kỳ cơ chế đồng thuận nào:

- **至少用上面三种 patterns 做 attack-test。**Quy tắc của bạn nên được dự đoán thất bại, chứ không phải là sự thất bại lặng lẽ.
- **记录每个 minority cluster**及其来源──少数群体是你发现相关错误的早期警告系统──
- **强制 bounded rounds。**Đừng tranh luận tiếp tục cho đến khi có thỏa thuận, điều này sẽ làm cho sự đồng tình được thưởng thức.
- **将 agreement 与 correctness 分离。**Kết quả đồng thuận 交给verifier;verifier 独立于组合──
- **监控 agreement rate。**Tăng lên đột ngột có nghĩa là thiên vị tuân thủ; giảm đột ngột có nghĩa là chuyển hướng mô hình.

## 练习
1. 运行 `code/main.py` xác nhận đa số trong cuộc tấn công đơn sản xuất 下 thất bại, nhưng khi sự tự tin đơn sản xuất 低于 0.7 时 CPWBFT 能部分缓解──
2. 添加第四种攻击模式:**silent abstention**, một đại lý 拒绝回答(I don't know)。 Mỗi đại lý 应如何处理弃权?实现你的选择。
3. Để phân tích phân tích từ chuỗi canonicalization 换 thành nhúng-semblancy( sử dụng bất kỳ mô hình nhúng nguồn mở)
4. 阅读 CP-WBFT (arXiv:2511.10400)  thực hiện hiệu chuẩn hóa thử nghiệm sự tin cậy 步骤(một mô hình hiệu chuẩn độc lập 检查每个代理自报的信心)  đo lường kịch bản monoculture 上的精度增──
5. 阅读 Can AI Agents Agree? (arXiv:2603.01213)。复现一个简化规模协议实验:三个代理、一个规模问题、欺骗人提示──CPWBFT或DecentLLMs 能抓住它吗?

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| BFT | “Byzantine fault tolerance” | Castro-Liskov 1999 protocol，用于在 `f < n/3` arbitrary faults 下达成 consensus。 |
| Byzantine | “任何坏行为” | 一个可以撒谎、丢弃 messages、静默失败的节点，除了安全 crash 外什么都可能做。 |
| Confidence probe | “你有多确定？” | 附加到 vote 上的自报或 calibrator-predicted probability。 |
| Semantic clustering | “同一答案，不同表述” | 在 counting votes 之前对等价 answers 分组。 |
| Geometric median | “Robust center” | 最小化到 sample points 距离之和的点。与 mean 不同，它对 outliers robust。 |
| Monoculture | “相同 model，相同 failures” | agents 共享 training data 或 base model 时产生的 correlated errors。 |
| Sycophantic conformity | “同意最大声的声音” | agent 的 vote 偏向最先/最大声发言的人。 |
| Core/Edge | “Hierarchical BFT” | WBFT 拆分：小规模 Core 先 consensus，Edge nodes 跟随。限制 latency。 |

## 延伸阅读
- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://pmg.csail.mit.edu/papers/osdi99.pdf) 基础
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) 按信任  cân nhắc phiếu bầu
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) Phân tích trung bình hình học
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) Sử dụng chia chia Core / Edge của thời gian trễ hạn chế
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) sự dễ dàng của thỏa thuận quy mô và tấn công cá nhân lừa đảo
