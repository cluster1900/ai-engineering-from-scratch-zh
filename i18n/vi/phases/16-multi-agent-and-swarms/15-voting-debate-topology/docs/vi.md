# Đánh phiếu, tự nhất quán và Topology tranh luận

> Kết hợp hợp hợp lý nhất: lấy N 个 đại lý độc lập, sau đó đa số bỏ phiếu.**heterogeneous**Các đại lý  mở rộng nó, để thoát khỏi monokultur, các mô hình khác nhau, các cúm sao khác nhau, nhiệt độ khác nhau, bối cảnh khác nhau.**graph 最适合 research**, và hơn khoảng 4 đại lý đã xuất hiện  thuế phối hợp──AgentVerse (ICLR 2024) ghi lại hai kiểu hình mẫu mới nổi, hành vi tình nguyện và hành vi tuân thủ, trong khi sự tuân thủ 既 là một đặc điểm ((đ tìm được sự đồng thuận), cũng là một风险 (风险)  nhóm suy nghĩ, Bài học 24)──本课会绘制 topology space,构建每种变体,并测量协调税──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Giai đoạn 16 · 07 (Xã hội tâm trí và tranh luận), Giai đoạn 16 · 14 (Tổng thống nhất và BFT)
**Time:** ~75 minutes

## 问题
Cuộc tranh luận có thể nâng cao độ chính xác của nó.

1. 谁和谁对话 (topology)
2. 多少轮(Du 2023:轮和代理都各自独立重要)
3. Các tác nhân không phải là đa dạng (không phải là đa dạng)
4. Có hay không có tiếng nói đối lập (nhà thép vs. cỏ)

Để chạy 5 đại lý và bỏ phiếu cứng để kết nối với đội ngũ trên nhiệm vụ, thường hơn một đại lý hơn, và thất bại không phải là tự nhiên.

## 概念
### Sự tương thích với bản thân,chỉ số cơ sở mô hình đơn

Wang et al. 2022(Tự nhất quán cải thiện chuỗi suy nghĩ Lý luận) ở nhiệt độ > 0 时 đối với cùng một mô hình 采样 N 次,并 đối với các câu trả lời lý luận-chặng đường làm đa số bỏ phiếu。GSM8K 上的结果是:N=40 mẫu 相比单个贪解码 有显著提升──Tự nhất quán là đơn-agent  multi-agent bỏ phiếu 前身──

限制: tự nhất quán Sử dụng một mô hình cơ bản. Phỏng lẻo trong cấu trúc là tương quan. Nếu mô hình có một sự thiên vị có hệ thống, tất cả các mẫu đều chia sẻ nó.

### Tiếng bỏ nhiều đại diện, mở rộng khác nhau

用 N个*不同* đại lý 替代 N 个样本──不同基模型──Claude、GPT、Llama)、不同提示、不同工具访问──收益:未相关错误──成本:不同 đại lý 的成本不同;协调它们会增加总费──

tranh luận đa dạng trong năm 2026 名称是 **A-HMAD**, đó là tranh luận đa tác nhân khác nhau đối lập. Tên này chưa được phổ biến, nhưng các bài báo sẽ sử dụng nó để chỉ ra các mô hình tranh luận khác nhau, làm giảm các lỗi tương quan từ sự sụp đổ của đơn văn hóa.

### 4 loại topology

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Một trung tâm, tất cả các đại lý khác chỉ có một trung tâm đối thoại.
Dòng: cấu trúc đường, mỗi đại lý  xem trước một đại lý  输出──类似管道──
Cây: tầng lớp cấu trúc, bởi hệ thống đại lý hàng bậc 使用(Dạy 06)。
Hình: bất cứ ai-to-any── bao gồm cả các nhóm cộng đồng và bất kỳ DAGs nào.

### Thuế phối hợp (MultiAgentBench)

MultiAgentBench ((MARBLE, ACL 2025, arXiv:2503.01935) trong một bộ nhiệm vụ bao gồm nghiên cứu, lập trình và lập kế hoạch trên điểm tham khảo 了 star、chain、tree、graph──关键 đo kết quả:

- **Graph**Topology trong các nhiệm vụ nghiên cứu 上获胜──信息 bất cứ ai 流动; đại lý có thể chỉ trích lẫn nhau──
- **Star**Trong các nhiệm vụ thực tế trả lời nhanh chóng 上获胜──Hub 负责 filter 和巩固──
- **Chain**Trong các đường ống dẫn từng bước (Phase refinement)
- **Coordination tax**Trong topology đồ thị hơn 4 đại lý 后 xuất hiện.

Trần nhà đại lý 4 là kinh nghiệm, không phải cơ bản. Nó phản ánh khả năng bối cảnh LLM năm 2026: bối cảnh của mỗi đại lý được các sản phẩm của đồng nghiệp ấp đầy; một khi mọi người có thể thấy tất cả mọi người, giá trị biên của thêm đại lý N + 1 sẽ giảm xuống.

### Chiến lược tranh luận đa nhân viên. Chúng ta nên điên lên chứ?

ArXiv:2311.17371 là một cuộc khảo sát chiến lược MAD năm 2023 ⋅ được nghiên cứu khác tái hiện phát hiện: với tự nhất quán  cấu trúc tương tự như các biến thể MAD (tự độc lập lấy mẫu + tổng hợp), trong cùng ngân sách 下通常不如自 nhất quán ⋅ chỉ khi các đại lý thực sự đa dạng, và tranh luận 具有逆境结构 (một đại lý phản向论证) ⋅ khi, MAD giúp đỡ lớn nhất ⋅

### AgentVerse các mô hình mới nổi

AgentVerse ((ICLR 2024, https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf）记录了Trong cuộc tranh luận đa đại lý, ngay cả khi không có thiết kế rõ ràng cũng sẽ xuất hiện hai loại hành vi:

- **Volunteer。**Đại lý 主动提供帮助(I can take the next step)。 hữu ích: nó đưa công việc phân phối cho đại lý phù hợp nhất với một nhiệm vụ phụ──
- **Conformity。**Trưởng lý của nhà phê bình là một người phản đối chính xác.

Sự phù hợp giải thích tại sao cuộc tranh luận cho đến khi thỏa thuận sẽ thưởng cho những kẻ bắt nạt.

### Sự khác biệt: thực sự thúc đẩy độ chính xác của vòng quay

Một mô hình trong văn học thực tế năm 2024-2026: biến một trong các đại lý N thành mô hình cơ sở khác nhau, nâng cao độ chính xác thường lớn hơn là tăng N 1。 trực giác là đơn văn hóa, mỗi nguồn lỗi độc lập mới đều có kết hợp hơn so với mẫu có giá trị hơn。

Trong trường hợp tối đa, sự khác biệt vượt qua sự đa số. Trong hầu hết các nhiệm vụ của sự thật cơ bản rõ ràng, ba mô hình khác nhau vượt qua năm bản sao của một mô hình.

### Phương pháp của bồi thẩm đoàn

Sibyl framework (trong văn học Minsky-LLM được trích dẫn) đã hình thành một nhóm các đại diện chuyên môn, trong mỗi giai đoạn 通过投票来精细答案──不同于普通多数投票,陪审团 có vai trò: một đại diện điều tra chéo, một cung cấp bối cảnh, một cho khả thi 打分── Phương pháp của ban giám khảo 介于平凡投票(便宜、容易单元文化) và toàn bộ MAD(昂贵、容易合规) giữa──

### Khi cuộc bầu cử với cuộc tranh luận chiếm ưu thế

- 问题有基础真理 ((事实、数学、代码行为) ⋅ Sự hội tụ của phiếu là có ý nghĩa ⋅
- Các đại lý có thể truy cập các nguồn hoặc công cụ khác nhau (có thể sử dụng sự khác biệt).
- Các vòng có giới hạn trên (thường là 2-3), và có thẩm phán hoặc kiểm chứng độc lập.
- Ngân sách 允许 3-5 đại lý  在图表拓学上上超过 5-7 đại lý 后,税务协调会占主导

### Khi bỏ phiếu với cuộc tranh luận đau đớn

- 问题呈意见形――Tác nhân sẽ nhận được câu trả lời trông tự tin nhất, chứ không phải câu trả lời chính xác nhất――
- 所有 đại lý 共享 một mô hình cơ bản.
- Các vòng không giới hạn.
- 任务很简单――使用N=5 tự nhất quán của đơn vị hơn便宜, chính xác cũng khác nhau.


```figure
sw-debate-topology
```

##  xây dựng nó
`code/main.py`实现:

- `run_star(agents, hub, question)` trung tâm 轮询 mỗi công nhân và tổng hợp
- `run_chain(agents, question)` tinh chỉnh theo trình tự
- `run_tree(root, children, question)` cấu trúc bậc cao của tổng hợp độ sâu-2
- `run_graph(agents, question, rounds)` tranh luận toàn diện, vòng giới hạn
- Một đường quay tính khác nhau của kịch bản: mỗi đại lý đều có một .`error_bias`, cho thấy sai lầm hệ thống của nó.
- Một vòng đo, trong N=3、5、7 下运行每种拓学,并报告(精度、总_tokens、wallclock_simulated)

运行:

```
python3 code/main.py
```

预期输出:一张 topology × N →(sự chính xác、tokens、latency) 表──Graph 在 N=3-5 của các nhiệm vụ kiểu nghiên cứu 上获胜;star 在快速事实任务 上获胜;N=7 của biểu đồ 显示 phối hợp thuế(sự lốc phát triển tốc độ快于准确)。

## Sử dụng nó
`outputs/skill-topology-picker.md`Đây là một kỹ năng, nó đọc mô tả nhiệm vụ,并推 topology (những ngôi sao / chuỗi / cây / biểu đồ)

## 交付 nó
Đối với bất kỳ bộ phận nào:

- Từ sử dụng một mô hình cơ sở mạnh mẽ của **self-consistency at N=5**开始──它 là điểm khởi đầu rẻ.
- Nếu chính xác  rất quan trọng, nâng cấp đến **heterogeneous voting at N=3**️ đo lường delta️
- Chỉ có khi nhiệm vụ có cấu trúc (phát tích) và vòng giới hạn có thể thực hiện, chỉ nâng cấp đến**debate topology**
- 始终记录少数群──当少数群──持续正确时,你就有多样性信号──
- Trong độ chính xác 旁边 đồng thời đánh giá đồng hồ tường và các token.

## 练习
1. 运行 `code/main.py` vẽ topology đồ thị của đường cong phối-sự thuế: chính xác vs N  token vs N 曲线在什么 N 处曲线?
2. 实现 A-HMAD:三个带有意意不同的偏见的代理――在14课时的单文化攻击 上,all-the same-bias baseline与A-HMAD相比如何?
3. 给图表topology 添加一个评判角色, nó không bỏ phiếu, chỉ đối với sự đồng thuận cuối cùng 打分―― điều này sẽ thay đổi hành vi tuân thủ mới nổi 吗?
4. 阅读 AgentVerse paper(ICLR 2024) ―― nhận ra thực hiện của bạn biểu hiện mạnh nhất là hành vi nổi bật nào── bạn có thể thông qua thay đổi nhanh chóng 引出相反的行为 吗?
5. 阅读 MultiAgentBench(arXiv:2503.01935) Phần 4(Các thí nghiệm topology)。 dùng vũ khí của bạn trong một nhiệm vụ trong bài luận trên复现graph-wins-research结果──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-consistency | “Sample N times, vote” | Wang 2022。Single model，N 个 temperature>0 samples，对 reasoning paths 做 majority vote。 |
| Heterogeneity | “Different models” | 由不同 base models 或 prompt families 组成的 ensemble。打破 monoculture。 |
| MAD | “Multi-agent debate” | agents 在多个 rounds 中交换 critiques 的通用术语。见 Du 2023。 |
| A-HMAD | “Adversarial Heterogeneous MAD” | 强调不同 models + adversarial structure 的 MAD variant。 |
| Topology | “Who talks to whom” | Star、chain、tree、graph。决定 information flow。 |
| Coordination tax | “Diminishing returns” | 在 graph 上超过约 4 个 agents 后，cost 增长快于 quality。 |
| Volunteer behavior | “Unprompted help” | AgentVerse emergent pattern：agent 主动提出承担一个 step。 |
| Conformity behavior | “Agreement under pressure” | AgentVerse emergent pattern：agent 与 critic 对齐。 |
| Jury | “Small specialized panel” | 带 roles（examiner、context、scorer）的 Sibyl-style ensemble。 |

## 延伸阅读
- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) Tỷ lệ cơ sở mô hình đơn
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325) các đại lý và các vòng đều có ý nghĩa riêng biệt
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) chỉ số chuẩn topology, hiển thị biểu đồ, chuỗi  phù hợp với đường ống dẫn
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) Nghiên cứu chiến lược MAD; phát hiện ngân sách tương đương
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) tình nguyện và các mô hình tuân thủ nổi lên
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) Thực hiện tham chiếu
