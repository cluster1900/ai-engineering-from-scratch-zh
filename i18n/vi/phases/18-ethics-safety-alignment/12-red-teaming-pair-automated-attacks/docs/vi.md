# Đội đỏ: PAIR và tấn công tự động

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419)  PAIR  Lần trôi tự động lặp lại  是经典的自动化黑盒 jailbreak。带有红团系统提示的攻击者 LLM 会为目标 LLM 代提出 jailbreak,并在自己的聊天历史中累积尝试和响应,作为在语境反──PAIR thường在20次查询内成功,比 G(CGZou et al. n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n nn n n n nnn n nn nnn nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn

**类型：**Xây dựng
**语言：**Python (stdlib, giả vờ vòng PAIR chống lại mục tiêu đồ chơi)
**前置要求：**Giai đoạn 18 · 01 (để theo dõi hướng dẫn), Giai đoạn 14 (kỹ thuật đại lý)
**时间：**~ 75 phút

## Học mục tiêu
- mô tả PAIR 算法: hệ thống tấn công nhanh chóng, tinh tế lặp lại, phản hồi trong bối cảnh.
- 解释当目标是黑盒时,为什么 PAIR 严格比 GCG更高效──
- Nói ra bốn cơ sở tấn công tự động khác, và mô tả một đặc điểm khác cho mỗi một.
- Mô tả JailbreakBench và HarmBench đánh giá giao thức, cũng như trong thỏa thuận riêng của họ "nồng độ thành công của cuộc tấn công".

## 问题
Red-teaming 过去 là một hoạt động thủ công. Một số ít chuyên gia thử nghiệm tạo ra một phản ứng phản đối, và theo dõi những gì có hiệu quả.

## 概念
### Algoritm PAIR

输入:
- Mục tiêu LLM T (((我们正在攻击的模型) ⋅
- Thẩm phán LLM J (((评分某响应是否为 jailbreak)
- Đội tấn công LLM A(đội đỏ tối ưu hóa)
- Đường mục tiêu G:"Thi đáp với [phản xuất hại]."
- Ngân sách K( thường là 20 lần truy vấn)

循环, đối với k trong 1..K:
1. 用目标 G 和迄今为止的 (prompt, response) cặp 历史来 prompt A。
2. A 输出一个新的提示 p_k。
3. sẽ gửi cho T; nhận được phản ứng r_k。
4. J 根据目标对 (p_k, r_k) 打分──
5. Nếu điểm số >= ngưỡng,则停止  已找到 jailbreak。
6. Nếu không, sẽ (p_k, r_k) 追加到 A 的历史中;继续──

经验结果(NeurIPS 2023): tỷ lệ thành công của cuộc tấn công của GPT-3.5-turbo、Llama-2-7B-chat > 50%; Success required average query số trong 10-20 范围内。

### Tại sao PAIR hiệu quả

GCG(Zou et al. 2023) thông qua Gradient trong đối thủ Token hậu tố 上搜索; nó cần truy cập mô hình hộp trắng, sẽ tạo ra hậu tố không thể đọc được.

### Các cuộc tấn công tự động liên quan

- **GCG (Zou et al. 2023, arXiv:2307.15043).**针对 đối lập hậu tố của Token 级 Gradient search──White-box,可迁移,产生不可读字符串──
- **AutoDAN (Liu et al. 2023).**Trong một cuộc tìm kiếm tiến hóa nhanh chóng, hướng dẫn bởi mục tiêu hàng đầu.
- **TAP (Mehrotra et al. 2024).**带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning 带 pruning  分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分 分
- **PAP (Zeng et al. 2024).**Các lời khuyên thuyết phục đối thủ  将人类 thuyết phục技巧编码为提示模板──

### JailbreakBench và HarmBench

两者(2024) 都将评估 标准化:

- JailbreakBench (arXiv:2404.01318) ――覆盖 10 个 OpenAI-policy 类别的 100 个有害行为──以 Attack Success Rate (ASR) 作为主要指标──需要评判(GPT-4-turbo、Llama Guard或 StrongREJECT)──
- HarmBench (Mazeika et al. 2024) ――覆盖 7 个类别的 510 个行为,包含语义和功能损害测试──比较 18 种攻击在 33 个模型上的表现──

ASR thường trong ngân sách truy vấn cố định.

### Nó là một nguyên nhân quan trọng đối với việc triển khai vào năm 2026

Hiện tại mỗi phòng thí nghiệm biên giới thành phố sẽ được phát hành trước khi phát hành cho mô hình sản xuất vận hành PAIR 和 TAP。 quỹ đạo ASR 会 hiện tại thẻ mô hình(Dạy 26) và phụ lục trường hợp an toàn(Dạy 18) trong đó。

### Đây là vị trí ở giai đoạn 18.

Bài học 12 là tự động tấn công cơ sở. Bài học 13 ((Many-Shot Jailbreaking) là một loại互补的长度利用── Bài học 14 ((ASCII Art / Visual) là một loại编码攻击── Bài học 15 ((Indirect Prompt Injection) là 2026 năm của sản xuất tấn công面── Bài học 16 覆盖对应的防御工具──Llama Guard、Garak、PyRIT)──


```figure
al-pair-loop
```

## Sử dụng nó
`code/main.py`构建一个玩具 PAIR loop──目标是一个假分类器,会拒绝明显的有害提示关键字过──攻击者是一个基于规则的炼油器,会尝试抛词、角色扮演框架 和编码──判断对应打分──你会看到攻击者在大约5-15次代内成功绕过关键字过器,并在语义过器上失败──

## 交付 nó
本课产 出 `outputs/skill-attack-audit.md` Đặt ra một báo cáo đánh giá của nhóm đỏ, nó sẽ kiểm tra: đã chạy các cuộc tấn công nào ((PAIR, GCG, TAP, AutoDAN, PAP)  ngân sách của mỗi cuộc tấn công  sử dụng các thẩm phán  dựa trên các tập hợp hành vi gây hại  JailbreakBench, HarmBench, nội bộ) 

## 练习
1. 运行 `code/main.py`◊测量三种内置攻击策略的平均求-to-success――解释 mỗi chiến lược sử dụng giả định phòng thủ mục tiêu nào――

2. 实现第四种攻击策略 (例如,翻译成另一种语言、base64编码) ⋅ báo cáo nó trong mục tiêu lọc từ khóa và mục tiêu lọc ngữ nghĩa 上新中-queries-to-success──

3. 阅读 Chao et al. 2023 Hình 5(PAIR vs GCG so sánh)  mô tả hai mặc dù PAIR 具有效率优势但仍首选 GCG 的场景──

4. JailbreakBench sẽ tập trung vào mục tiêu cố định  báo cáo ASR。 thiết kế một chỉ số额外 để đo đa dạng tấn công(quá khác biệt trong các cuộc tấn công nhanh chóng thành công)。 giải thích tại sao đa dạng đối với đánh giá phòng thủ  rất quan trọng。

5. TAP(Mehrotra 2024) thông qua phân nhánh + cắt 扩展 PAIR──为 `code/main.py`草拟一个TAP-style 扩展,并描述计算成本与成功率之间的权衡.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement；attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | 针对 adversarial suffix 的 white-box Token 级 Gradient search |
| Attack success rate (ASR) | "% jailbreaks at k queries" | 主要指标；必须与 query budget 和 judge identity 一起报告 |
| Judge LLM | "the scorer" | 评估响应是否满足 harmful goal 的 LLM |
| JailbreakBench | "the evaluation" | 带有标记类别的标准化 harmful-behaviour set |
| HarmBench | "the broader bench" | 510 个 behaviour，functional + semantic harm test |
| TAP | "tree of attacks" | 带 branching + pruning 的 PAIR；在更高 compute 下获得更好的 ASR |

## 延伸阅读
- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) PAIR 论文,NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) Bảng giấy GCG
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) Đánh giá tiêu chuẩn hóa
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) đánh giá rộng hơn
