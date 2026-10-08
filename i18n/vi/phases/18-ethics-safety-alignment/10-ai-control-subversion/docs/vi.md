# AI Control  在颠覆下仍然保持安全

> Greenblatt, Shlegeris, Sachan, Roger (Redwood Research, arXiv:2312.06942, ICML 2024): Control 重新定义 an ninh vấn đề: cho một mô hình không tin cậy mạnh U, nó có thể được tối ưu hóa theo cách đối kháng đối với bạn, những thỏa thuận nào có thể cho phép bạn cùng lúc có được kết quả không chấp nhận được hạn chế? Các nguồn lực có sẵn bao gồm một mô hình không tin cậy yếu T, một ngân sách lao động con người đáng tin cậy H, cũng như khả năng xuất bản U. Trong khuôn khổ này, trong nhiệm vụ mã-cửa ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ    ơ ơ                                                                                                      

**Type:** 学习
**Languages:** Python (stdlib，code-backdoor 任务上的 safety-vs-usefulness frontier)
**前置要求：**Giai đoạn 18 · 07 (những chất gây ngủ), Giai đoạn 18 · 08 (làm kế hoạch), Giai đoạn 18 · 09 (sử lý giả lập sự đồng nhất)
**Time:** ~75 分钟

## Học mục tiêu

- 定义 AI Control 威胁模型:不可信强模型 U、可信弱模型 T、可信人类预算 H。
- mô tả Trusted Editing 协议, cũng như tại sao nó chiếm ưu thế trên nhiệm vụ ICML 2024 code-backdoor  nhiệm vụ Pareto Untrusted Monitoring。
- 解释 sự sắp xếp giữa U 值得信任) và kiểm soát U  không值得信任但我们仍然安全)
- Nói rõ ba giới hạn của kiểm soát: con người không thể mở rộng, mô hình đáng tin cậy yếu cuối cùng sẽ rơi vào hậu, kiểm soát sẽ không tạo ra mô hình mạnh đáng tin cậy.

## 问题

Chương 7-9  Bài học giải thích, mô hình biên giới có thể là sự sắp xếp gian lận, âm mưu, hoặc giả mạo sắp xếp. Vấn đề an ninh được thể hiện lại như: Chúng ta có thể lấy được công việc hữu ích từ mô hình không tin tưởng, đồng thời không cho nó tạo ra kết quả không thể chấp nhận được? Đây là vấn đề kiểm soát, cấu trúc của nó giống như an ninh cổ điển: giả định tình huống tồi tệ nhất đối thủ, thỏa thuận thiết kế, và áp lực nhóm đỏ đo lường tỷ lệ thành công đối thủ.

## 概念

### 威胁模型

Kiểm soát 假设:
- U 不可信强模型──有能力──可能是对抗性 (có khả năng là đối kháng)
- T 可信弱模型──能力较弱,但已知不是对抗性──
- H 可信 nhân lực.

系统 phải sử dụng U 产生有用输出―― đối thủ cố gắng tạo ra kết quả không thể chấp nhận được cụ thể (ví dụ, phát hành code trong backdoor), đồng thời duy trì một tỷ lệ hợp pháp của công việc hữu ích, để thông qua lợi ích 值――

Điều này đặt ra câu hỏi: Trong trường hợp không tin tưởng, những hiệp định nào có thể duy trì an toàn?

### ICML 2024 cửa sau 任务

Các lệnh là các vấn đề lập trình cấp cạnh tranh. U sinh thành một giải pháp ứng cử. Một Oracle ẩn sẽ đánh dấu giải pháp có chứa cửa sau không? Một số đầu vào cụ thể sẽ tạo ra lỗi đầu ra mã. Red team kiểm soát U, và cho phép xem tất cả các chi tiết bên trong của thỏa thuận.

### So sánh 4 giao ước

- **Baseline:**直接发布 U 的输出――Usefulness 最高――安全 最低――
- **Upfront auditing:**Đối với tất cả các sản phẩm và sản phẩm, an toàn là tối đa.
- **Untrusted Monitoring:**Ví dụ thứ hai của U cho các kết quả đầu tư của ví dụ thứ nhất; H 审计 được đánh dấu các kết quả đầu tư.
- **Trusted Editing:**T trong mỗi lần truy vấn trong biên tập U của xuất khẩu. Nếu T không biết, thì đường dẫn cho H.

Greenblatt et al. 发现 Trusted Editing Pareto-dominates Untrusted Monitoring: trong mỗi an toàn 水平上 có lợi ích cao hơn.

### Tại sao Trusted Editing  thắng

Việc kiểm soát không tin cậy  yêu cầu U của ví dụ thứ hai không thể phối hợp với ví dụ thứ nhất. 串通 có thể thông qua các dấu hiệu steganographic hoặc các tiền lệ đào tạo chung xảy ra. 协议 phải đầu tư ngân sách vào sự kháng cự đối phó với sự đồng tình, và điều này sẽ làm giảm tín hiệu của giám sát.  Trusted Editing hoàn toàn là tránh串通, vì theo giả thuyết, bất kỳ biên tập nào được đề xuất không chống lại tình dục. 代价 là khả năng yếu hơn, vì vậy nó có thể quá từ chối, hoặc bỏ qua những cánh cửa sau nhỏ.

### 4 hiệp ước

1. U 扮演什么角色: Chỉ là nhà sản xuất, giám sát, hoặc cả hai đều là:
2. T 扮演什么角色: biên tập viên, giám sát viên, hoặc người lấy mẫu lại.
3. H 如何分配: kiểm toán thống nhất, kiểm toán ngẫu nhiên, hoặc kiểm toán theo cờ.
4. 协议在勾结-阻力 上花费多少计算──

### Định hướng đối với kiểm soát

- Định hướng: U 是否安全到可以信任? 第 2、4、5、6、7、8、9 课都与此相关──
- Kiểm soát:  我们能否在不信任的情况下安全使用 U?

Sự sắp xếp là thuộc tính của mô hình. Kiểm soát là thuộc tính của giao thức triển khai. Kiểm soát không tạo ra các mô hình sắp xếp; nó tạo ra cho việc sử dụng an toàn của mô hình có thể không được sắp xếp.

### 3 giới hạn cơ bản

- Nhân loại không thể mở rộng. Ngân sách được giới hạn trong tình nguyện kiểm toán khó khăn AI  xuất khẩu số lượng nhân loại.
- Có thể tin rằng mô hình cuối cùng sẽ rơi sau. Khi T yếu hơn U  yếu nhiều, tín hiệu chỉnh sửa của T sẽ trở thành tiếng ồn.
- Việc kiểm soát không phải là sự sắp xếp. Có thể trong ASL-3 (第 18 课) các thỏa thuận làm việc có thể không thể trong ASL-4 工作. Nếu U có thể điều khiển T, hoặc đưa ra phân phối kiểm toán của H, kiểm soát sẽ thất bại.

### Tăng tiến năm 2025

UK AISI 和 Redwood 合作研究 控制安全案例(metr.org / redwoodresearch.org 2025): kiểm soát an toàn trường hợp 论证 là, trong trường hợp xấu nhất của U giả định, thỏa thuận này hạn chế không thể chấp nhận được kết quả của概率.

### Nó nằm ở vị trí giữa giai đoạn 18

Chương 6-9 课描述威胁 ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ( ()  ()  () () () () () () () () () () () () () () () () () () () () () () () () () () () () () ( () () () () () () () () ( () () () () () () () () () () () () () () () ( () () () () () () () () () () () () () () () () () () ( () () () () () () () (


```figure
al-control-protocol
```

## Sử dụng nó

`code/main.py`Trong một trò chơi cửa sau  nhiệm vụ trên模拟四种协议. U 生成输出; một phần trong đó có cửa sau (Red-team policy)  T 批准或编辑. H 在预算内被调用.

## 交付 nó

本课生成 `outputs/skill-control-protocol-audit.md` Định nghĩa một mô tả giao thức triển khai, nó sẽ nhận ra các vai trò U / T / H, đặt tên cho các vector hợp tác, và ước tính rằng giao thức này nằm ở vị trí của biên giới hữu ích-an toàn dưới áp lực của nhóm đỏ.

## 练习

1. 运行 `code/main.py` Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re: Re:

2. T với nhiệt độ thấp lấy lại mẫu, sau đó U 编辑 T 的输出──衡量它在边界上位置──为什么它比 Trusted Editing 失败更灾难性?

3. 2024 论文 giả định U có thể xem thỏa thuận. Thiết kế một thỏa thuận đối với U  ẩn những sản lượng đang được kiểm toán.

4. 阅读 Greenblatt et al. 2024 Mục 7(collusion)  đề xuất một biện pháp chống lại sự collusion,并 giải thích sự hữu ích của nó dự kiến 成本。

5. Để sử dụng U = GPT-4-class T = GPT-3.5-class H = 审计 1% 输出部署, rõ ràng mô tả một trường hợp an toàn kiểm soát.

## 关键术语

| Term | 人们通常怎么说 | 它实际上的含义 |
|------|-----------------|------------------------|
| AI Control | “safety under subversion” | 在最坏情况 U 下限制不可接受结果的协议设计 |
| Untrusted model (U) | “强模型” | 我们想从中提取工作、但并不信任的有能力模型 |
| Trusted model (T) | “弱模型” | 一个较弱、已知不是对抗性的模型，用作 editor/monitor |
| Trusted human (H) | “审计预算” | 有界的专家劳动；昂贵；ground-truth 信号 |
| Trusted Editing | “T edits U” | T 作为 U 输出 gate 的协议；H 被用于模糊输出 |
| Untrusted Monitoring | “U monitors U” | 第二个 U 实例给输出打分的协议；只有额外投入后才具备 collusion-resistance |
| Control safety case | “正式论证” | 书面论证：一个协议在最坏情况 U 下限制对手成功率 |

## 延伸阅读

- [Greenblatt, Shlegeris, Sachan, Roger — AI Control (arXiv:2312.06942)](https://arxiv.org/abs/2312.06942) 经典 ICML 2024 论文
- [Redwood Research — Recent AI Control papers index](https://redwoodresearch.substack.com/) 2024-2025 后续研究
- [UK AISI + METR — Control safety cases](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) 面向边境实验室的运营化
- [Hubinger et al. — Sleeper Agents (Lesson 7, arXiv:2401.05566)](https://arxiv.org/abs/2401.05566) kiểm soát và giả định mô hình đe dọa
