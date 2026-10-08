# 协商与议价

> Các nhà quản lý sẽ được phép điều chỉnh thông qua các quy trình quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, quản lý, và quản lý, quản lý, quản lý, và quản lý, và quản lý, quản lý, và quản lý, và quản lý, và quản lý, quản lý, và quản lý, và quản lý, quản lý, và quản lý, và quản lý, và quản lý, quản lý, và quản lý, và quản lý, và quản lý, và quản lý, và quản lý.**OG-Narrator**(tạo cơ giới thiệu quyết định + người kể về LLM) sẽ đạt tỷ lệ giao dịch từ 26,67% 提升到 88.88%; Cuộc thi đàm phán tự trị quy mô lớn (arXiv:2503.06416)  đã được tiến hành khoảng 180k lần thảo luận, phát hiện **chain-of-thought-concealing**đại lý 通过向对手隐藏推理而获胜;Bhattacharya et al. 2025 基于Harvard Negotiation Project 指标进行排名,Llama-3 最有效,Claude-3 进攻性最强,GPT-4 最公平。本课实现 Contract Net Protocol(FIPA的前身,Lesson 02),连接一个 LLM 风格的买家/卖家,运行 OG-Narrator 风格的分解,并衡量每个结构选择如何变化成交率。

**类型：**Học tập + xây dựng
**语言：**Python (stdlib)
**前置要求：**Giai đoạn 16 · 02 (FIPA-ACL Heritage), Giai đoạn 16 · 09 (Tác mạng lưới lôi kéo song song song)
**时间：**约75分钟

## 问题

两个代理 需要达成价格一致. Nếu chỉ dựa vào ngôn ngữ đơn giản, tỷ lệ thành công trong các LLM trong các cuộc đàm phán năm 2024-2026 sẽ rất thấp.

根本问题在于,LLM 混了两项工作:决定报价和叙述报价――OG-Narrator 将两者分离:determinist报价生成器 计算数值移动;LLM 仅负责叙述――成交率跃升到约89%――

Đây là một bản đồ của một cơ chế đa đại lý cổ điển 发现:将机械层与通信层解会赢――Contract Net Protocol ((FIPA, 1996; Smith, 1980) là một quy trình tham khảo của cơ chế thị trường nhiệm vụ――把 LLM 插入叙述槽位,你就得到一个现代 LLM 驱动的任务市场――

## 概念

### Một段话 hiểu Hợp đồng Net

Smith năm 1980 của Hợp đồng Net Protocol: một **manager**广播 **call for proposals (cfp)**-**bidders**Với những lời đề nghị của nó**propose**tin nhắn 响应; quản lý 选择获胜者,并向获胜者发送 **accept-proposal**, gửi cho người thất bại**reject-proposal**❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖**refuse**(giầu  từ chối đề xuất)`fipa-contract-net`giao thức tương tác.

### Tại sao OG-Nha-Nha sẽ thắng

"Mức đo khả năng thương lượng của các mô hình ngôn ngữ" (arXiv:2402.15813) 观察到:

- LLM thường phá vỡ quy tắc giá trị của các tổ chức
- n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n
- Chỉ dựa trên quy mô, không thể khắc phục được những vấn đề này. Các mô hình lớn hơn sẽ tạo ra ngôn ngữ đáng tin cậy hơn, nhưng chiến lược sai lầm giống như vậy.

OG-Nau chuyện chia sẻ:

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

cung cấp máy phát là một loại chiến lược đàm phán cổ điển: mô hình thương lượng Rubinstein, chiến lược Zeuthen, hoặc xung quanh giá đơn giản tit-for-tat.

成交率提升 là vì:
- Giá duy trì trong khu vực thương lượng
- Cây neo là chiến lược, chứ không phải tình cảm.
- LLM làm nó tốt: viết作.

### Hoàn thành

ArXiv:2402.05863  đã cung cấp quy định chuẩn 

- LLM có thể thông qua việc áp dụng cá nhân (Tôi rất mong muốn bán nó vào thứ Sáu) sẽ tăng doanh thu khoảng 20%; thao túng cá nhân là một chiến lược thực sự.
- Các đại lý công bằng/ hợp tác sẽ được sử dụng để đối phó với các đại lý chống đối; phòng thủ cần phải có sự phản đối rõ ràng.
- Đối với các kịch bản chuẩn khoảng 40% nhận được kết quả không công bằng.

Đây không phải là những người tham vấn xấu ── nhưng là những người tham vấn như con người, bao gồm cả những phần có thể được sử dụng ──

### Sợi dây tư tưởng 隐藏

Cuộc thi đàm phán tự trị quy mô lớn (arXiv:2503.06416) đã được tiến hành khoảng 180k lần thảo luận trên nhiều chiến lược LLM:

- Nếu một đại lý trong một tấm vỏ công khai xuất phát tôi sẽ chỉ đi đến$75; my reservation price is $70 , đối thủ sẽ đọc nó.
- 胜者私下计算策略;输出通道只包含优惠和最低限度的必要叙述──

Đây là lý thuyết trò chơi cổ điển (Aumann 1976  Về lý trí và thông tin) vào năm 2026 回应: tiết lộ đánh giá cá nhân của bạn 会损失收益――LLMs không trực tiếp nhận thức được điều này, và sẽ sẵn sàng đặt đặt đặt đặt đặt ra những dấu vết lý luận có thể nhìn thấy đối thủ của mình――

工程结论:将私用scratchpad ngữ cảnh với công cộng-thông điệp ngữ cảnh chia rẽ.

### Bhattacharya et al. 2025  mô hình 排名

基于哈佛谈判项目 指标(đối议 nguyên tắc BATNA tôn trọng  lợi ích tương đối):

- **Llama-3**Trong giao dịch đạt được hiệu quả nhất (transaction rate + payoff)
- **Claude-3**là kẻ đàm phán mạnh nhất trong cuộc tấn công.
- **GPT-4**最公平(不同配对中的 thanh toán khác nhau 最小) ⋅

Đây là một sự thay đổi nhanh chóng trong năm 2025. Điểm nhấn không phải là mô hình nào sẽ thắng trong năm 2026, mà là các mô hình cơ bản khác nhau có mô hình đàm phán tồn tại liên tục.

### Thông qua hợp đồng Net + LLM

Hợp đồng Net trong LLM đa đại lý Trung học hiện đại:

1. Trưởng quản lý sẽ phân chia nhiệm vụ thành đơn vị.
2. 使用任务描述向工人代理 广播 `cfp`
3. Mỗi công nhân trả lại một đề nghị:`(price, eta, confidence)`, trong đó giá có thể là token, đơn vị tính toán hoặc đô la.
4. Người quản lý 选择获胜者 (单个或多个,取决于任务)并授予任务──
5. Những công nhân bị từ chối có thể tự do thực hiện các nhiệm vụ khác.

Điều này có thể được mở rộng tốt đến hơn 100 nhân viên, bởi vì phương pháp phối hợp là phát sóng và trả lời, chứ không phải trò chuyện đồng bộ.

### Các bên liên quan của LLM

NeurIPS 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 引入带有 **secret scores**和 **minimum-acceptance thresholds**Các công ty công nghiệp tư nhân của mỗi bên liên quan; LLM phải đưa ra các thông điệp trong các thông điệp.

### Narration-vs-mechanism 规则

Trong tất cả các tiêu chuẩn tham vấn trong giai đoạn 2024-2026, các quy tắc công trình phù hợp là:

> 让LLM 负责叙述──不要让LLM 计算提供──

Nếu đề nghị 需要一个数字 (价格,ETA,数量),根据谈判状态决定性 生成它,并让LLM 生成框架. Nếu đề nghị 需要一个提案结构 (任务分解,角色分配), có thể让LLM 起草, nhưng在发送前要根据方案进行约束检查.


```figure
a5-og-narrator
```

##  xây dựng nó

`code/main.py`实现:

- `ContractNetManager`- `ContractNetTask`- `Bid` quản lý + người đề nghị,广播 cfp, thu thập đề xuất, trao nhiệm vụ.
- `og_narrator_bargain(state, rng)` OG-Nau người mua:面向中点的定制主义 Zeuthen-style concession──
- `seller_response(state, rng)` chính sách phản đề xuất của người bán xác định (Deterministic seller counter-offer policy)
- `naive_llm_bargain(state, rng)` 模拟 toàn bộ LLM thương lượng:以高变化 选择价格,且经常落在 ZOPA 之外──
- Đường: trong 1000 lần thử nghiệm 上衡 giá trị giao dịch, mỗi lần thử nghiệm đều lấy lại giá đặt phòng.

运行:

```
python3 code/main.py
```

预期输出: tỷ lệ giao dịch bằng sáng tạo-LLM khoảng 65-75%; tỷ lệ giao dịch OG-Narrator khoảng 85-95%;15-25 个百分点的差异就是将提供-generación与叙述 分解开来的结构优势――此外还会输出一个包含三个投标者和一个任务的合同网任务市场分配示例――

## Sử dụng nó

`outputs/skill-bargainer-designer.md`设计一个议价协议:谁生成报价 (Deterministic) 谁负责叙述的私人 scratchpad 如何与公开信息分离以及如何监控交易率──

##  phát hành nó

Danh sách kiểm tra giá sản xuất:

- **分离 scratchpad。**Nhà nước tư nhân không bao giờ có thể vào trong bối cảnh đối thủ.
- **Deterministic offer generation。**Giá, số lượng, ETA: tính toán, đừng nhanh chóng.
- **验证所有 incoming offers**Có phù hợp với quy trình không? Trong biên giới giao thức  từ chối các đề nghị ngoài Zopa.
- **限制 rounds。**Trận đấu tối đa 3-5 vòng; thời hạn 时升级给中介者──
- **持续衡量 deal rate 和 payoff variance。**Tỷ lệ giao dịch giảm là một triệu chứng, thường là chuyển hướng nhanh hoặc tấn công bên đối tác.
- **记录所有 rejected proposals**及其决定性理性── đối với các nhà quản lý mạng hợp đồng, những người đấu thầu thất bại 需要理解原因──

## 练习

1. 运行 `code/main.py`❖ xác nhận OG-Narrator trong tỷ lệ giao dịch trên vượt qua ngây thơ-LLM― cao xuất số?
2. 实现 **persona-based payoff improvement**(arXiv:2402.05863)  người mua chỉ trong câu chuyện sử dụng  tuyệt vọng để mua tuần này  của cá nhân, cung cấp máy phát 保持不变── tỷ lệ giao dịch hoặc thanh toán có thay đổi không?
3. 实现 chuỗi suy nghĩ **concealment**:维护一个不会传递给对手的私人 scratchpad string──如果你意外泄漏它会如何通过交换道来模拟?
4. Để mở rộng hợp đồng với giá dự trữ của đấu giá N-bầu  Khi tất cả các đề nghị vượt quá dự trữ, quản lý làm thế nào để quyết định giữa giá thấp nhất và chất lượng cao nhất? Bạn sẽ chọn quy tắc trao giải nào, vì sao?
5. 阅读 Bhattacharya et al. 2025  Về Dự án đàm phán Harvard 指标的内容──实现两个不同风格的讨价还价者(侵略性与公平)──衡量对称和不对称对称下的收益差异──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Contract Net | “任务市场” | Smith 1980，FIPA 1996。cfp + propose + accept/reject。规范任务市场。 |
| ZOPA | “Zone of possible agreement” | buyer 最高价与 seller 最低价之间的重叠区间。其外部的 offers 无法成交。 |
| BATNA | “Best alternative to a negotiated agreement” | 如果本次交易失败，你的后备方案。它设定你的 reservation price。 |
| OG-Narrator | “Offer generator + narrator” | 分解：deterministic offer，LLM narration。 |
| Zeuthen strategy | “Risk-minimizing concession” | 根据风险限制让步的经典 offer-generator。 |
| Rubinstein bargaining | “Alternating-offer equilibrium” | 带 discounting 的 infinite-horizon bargaining 的 game-theoretic model。 |
| CoT concealment | “隐藏你的推理” | arXiv:2503.06416 的获胜者保留 private scratchpads；public channel 只显示 offer。 |
| Persona manipulation | “情绪姿态” | arXiv:2402.05863：从 desperation/urgency personas 获得约 20% payoff gain。 |

## 延伸阅读

- [NegotiationArena](https://arxiv.org/abs/2402.05863) điểm chuẩn;Tầm lẫn cá nhân và khai thác
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) OG-Narrator, cũng như người mua-khó hơn người bán kết quả
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416) 约180k 次协商; chuỗi tư tưởng che giấu 获胜
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 带 bí mật tiện ích của nhiều cách có thể đánh giá
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) 经典机制,IEEE Transactions on Computers
