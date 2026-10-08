# Nhà khoa học AI v2  Hội thảo 级 tự do nghiên cứu

> Sakana's AI Scientist v2 (Yamada et al., arXiv:2504.08066) 运行完整的研究循环:假设,代码,实验,图表,写作,投稿――它是第一让生成论文通过ICLR 2025 研讨会同学评审的系统――独立评估 (Beel et al.) 发现,42% của các thí nghiệm因编码错误失败,文献评审也经常把既有概念错误标记为小说――Sakana 自己的 doc 警告说,该代码库会执行 LLM 编写的代码,并建议使用Docker 隔离――这两幅图景共同构成重点――

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

Nghiên cứu là một nhiệm vụ mở. Không giống như tìm kiếm thuật toán của AlphaEvolve hoặc DGM được giới hạn được tự sửa đổi, nghiên cứu kết quả không có tiêu chuẩn chính xác có thể kiểm tra được bởi máy.

AI Scientist v1 (Sakana, 2024)  thông qua mô hình từ người viết  bắt đầu để đóng vòng lặp. LLM trong cố định脚手架内填入实验. AI Scientist v2 (Yamada et al., 2025) sử dụng với mô hình ngôn ngữ tầm nhìn  phê bình vòng lặp tìm kiếm cây nhân tố, loại bỏ mô hình 要求.

Bài viết được nhận được bởi các chuyên gia của ICLR 2025 接收(带 tiết lộ) ・独立评估结论:该系统远不可靠──两者都是真的──

## 概念

### 架构

1. **想法生成。**LLM 根据主题和已有文献提出研究思想──v1 使用模板;v2 在假设空间上使用代理搜索──
2. **新颖性检查。**Biết bao về những ý tưởng đã được xuất bản hay không. Biết bao về Beel et al. đã phát hiện ra một dấu hiệu sai lầm: đã có phương pháp thường được phân loại thành tiểu thuyết.
3. **实验计划。**Agent 起草实验协议 并编写代码──
4. **执行。**代码在沙盒中运行──失败会反到复试循环──根据Beel et al. 的测量, trong giai đoạn này 42% thí nghiệm因编码错误失败──
5. **图表生成。**mô hình ngôn ngữ thị giác 读取生成图表,并重写它们以提高可读性──这是 v2's key技术新增点──
6. **写作。**LLM 起草论文,并与内部评论员 代。
7. **可选：投稿。**Bài luận được gửi đến một địa điểm nào đó.

### hội thảo 接收结果 nghĩa là gì

Một bài báo được phát triển bởi v2 đã qua đánh giá đối tác của hội thảo ICLR 2025 ∙ tác giả cho ủy ban chương trình  tiết lộ nguồn gốc bài báo ∙ Việc nhận này là một điểm dữ liệu; nó không tuyên bố rằng hệ thống này sẽ làm nghiên cứu ∙                                                                                                                                                                                                                                

重要背景:workshop 论文的门低于主要会议论文── 评论 评论 噪声很大;在任意一天,都会有一小部分投稿被接收──一次成功是概念的证明,而不是可靠性声明──Nature 2026 论文记录了端到端循环,并且它本身由人类研究人员共同签署;它不是系统写了一篇 Nature 论文──

### 独立评估发现了什么

Beel et al. (arXiv:2502.14297)  đã tiến hành đánh giá bên ngoài.

- **实验失败。**42% của các thí nghiệm因编码错失败(错误进口、形状不匹配、未定义变量)  Retry loop 捕获部分,但不是全部──
- **新颖性错误标记。**văn học-hãy tìm lại 步骤 thường đưa những khái niệm đã có được đánh dấu như một tiểu thuyết.
- **呈现质量差距。**Tầm nhìn ngôn ngữ 图表批评 tạo ra hiệu quả xuất bản cấp hình ảnh, che giấu điểm yếu của các thí nghiệm cơ bản.

Điều cuối cùng được phát hiện cho giai đoạn này là quan trọng nhất. Một hệ thống sản xuất có thể tin cậy nhưng không được nghiên cứu có thể tin cậy, nguy hiểm hơn hệ thống thất bại rõ ràng, thay vì an toàn hơn.

### thoát khỏi hộp cát 风险

Sakana  kho lưu trữ của riêng mình README 警告:

> Vì phần mềm này sẽ thực hiện mã của LLM 生成, chúng tôi không thể đảm bảo an toàn. Có các gói nguy hiểm không được kiểm soát truy cập web, cũng như rủi ro của quá trình không mong đợi.

Đây là hình thức hoạt động tự chủ trong lĩnh vực chưa được chứng minh. LLM viết mã; mã chạy; mã có thể làm bất cứ thứ gì mà quá trình được phép làm. Nếu không có các hành động về hệ thống tệp, mạng lưới và quy trình để làm một hộp cát hạn chế, bất kỳ đại lý nghiên cứu tự hướng nào đều có thể truyền dữ liệu ra ngoài, sử dụng hết tính toán, hoặc tự viết lại.

Câu chuyện của AlphaEvolve  Sandbox dễ dàng hơn, bởi vì người đánh giá của nó rất chặt chẽ. AI Scientist v2 có một vòng lặp mở chạy mã, và có một mục tiêu mở. Vì vậy nó cần sự tách biệt mạnh hơn. Docker là yêu cầu tối thiểu; tiếp theo / gVisor là tốt hơn), và mỗi lần đăng bài rời khỏi hệ thống trước tất cả đều cần đánh giá nhân tạo.

### v2 Trong đống biên giới vị trí giữa

| System | Target | Output kind | Evaluator | Known failure |
|---|---|---|---|---|
| AlphaEvolve | algorithms | code | unit + benchmark | 受 evaluator 严谨程度限制 |
| DGM | agent scaffolding | code | SWE-bench | reward hacking |
| AI Scientist v2 | research papers | text + code + figures | peer review（弱） | 实验失败、错误标记、润色掩盖弱点 |

Trong số những người này, người đánh giá tự động v2 yếu nhất, xuất khẩu rộng nhất, đường dẫn ngắn nhất của vật thể công khai.


```figure
mx-research-loop
```

## Sử dụng nó

`code/main.py`将 v2 循环模拟为一个状态机:想法 → 新性检查 → 实验 →图表 → 写作 → review → 接收或代―― mỗi trạng thái đều có tỷ lệ thất bại có thể cấu hình được, tỷ lệ này xuất phát từ phát hiện của Beel et al.――运行模拟器 N 个循环并统计:

- Có nhiều ý tưởng đến giai đoạn đăng bài.
- Có bao nhiêu bài đăng có bị ẩn trong các bài báo về các thiếu sót quan trọng trong các thí nghiệm.
- Các ngân sách thử lại làm thế nào để cân bằng giữa chất lượng và sản xuất.

## 交付 nó

`outputs/skill-ai-scientist-sandbox-review.md`là một danh sách kiểm tra kiểm tra hai cổng, được sử dụng để nghiên cứu các đại lý vòng tròn  sản xuất bất kỳ nội dung nào rời khỏi hộp rác  trước kiểm tra

## 练习

1. 使用默认参数运行 `code/main.py`Có bao nhiêu tỷ lệ các hoạt động vòng lặp xuất hiện trong một bài báo? Có bao nhiêu tỷ lệ xuất hiện trong một bài báo có thất bại trong thí nghiệm, nhưng bị phê bình trên biểu đồ?

2. 默认值已使用 Beel et al. 的 42% / 25%──分别用 `--experiment-failure 0.20 --novelty-mislabel 0.10`和 `--experiment-failure 0.60 --novelty-mislabel 0.40`重新运行──两次运行之间, tỷ lệ làm sạch nhưng bị lỗi thay đổi như thế nào?

3. 阅读 Sakana's AI Scientist v2 repo README 中关于沙盒 要求的内容──说出两个你会为多日自主运行额外施加的限制(Docker 之外)──

4. 阅读Beel et al. Phần 4 trong nội dung về khoảng cách chất lượng trình bày.

5. Đối với các nhà nghiên cứu 输出 đề xuất một giao thức đánh giá con người, làm cho sự mở rộng của nó tốt hơn.

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AI Scientist v1 | “Sakana 的 templated research agent” | 将实验填入固定 scaffold |
| AI Scientist v2 | “无 template 的 research agent” | 带有 VLM 图表批评的 agentic tree search |
| Agentic tree search | “分支式 research agent” | 并行扩展多个实验计划；由内部 critic 剪枝 |
| Vision-language critique | “对图表进行 VLM 润色” | Multimodal model 读取图表并重写以提高清晰度 |
| Literature retrieval | “新颖性检查” | 搜索 prior work 以确认想法新颖性，并已被记录会发生错误标记 |
| Polish masking | “漂亮论文，破损研究” | 呈现质量超过实验质量；隐藏弱点 |
| Sandbox escape | “LLM 代码逃逸” | agent 执行的代码做了 loop designer 未预期的事情 |

## 延伸阅读

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066) 论文。
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/) 带有同行评价 背景的供应商总结──
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) Bộ Ngoại giao đánh giá số lượng
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) 模板化前身──
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) 关于开放式研究代理的更广泛框架――
