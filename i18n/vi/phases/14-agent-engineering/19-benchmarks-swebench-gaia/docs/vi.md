# Các điểm chuẩn:SWE-bench,GAIA,AgentBench

> 三个基准构成 2026 年代理评价的点──SWE-bench 测试代码 patching──GAIA 测试一般主义工具的使用──AgentBench 测试多环境推理──要了解它们的组成、污染 叙事,以及它们不衡量什么──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## Học mục tiêu

- Nói ra dây thừng thử nghiệm của SWE-bench ((FAIL_TO_PASS),并解释为什么它以单元测试作为门
- 解释 tại sao SWE-bench Verified ((OpenAI,500 nhiệm vụ) tồn tại,以及它移除了什么──
- Mô tả của GAIA: đối với loài người đơn giản, đối với AI 困难;三个难度等级──
- Nói về 8 môi trường của AgentBench, cũng như nó là một khối chính đối với các LLM nguồn mở.
- 总结 SWE-bench+  phát hiện nhiễm trùng và tác động

## 问题

Các bảng xếp hạng sẽ cho bạn biết mô hình nào trên một điểm chuẩn nào đó sẽ thắng.

- chuẩn liệu liệu liệu có bị ô nhiễm không (trả lời trong dữ liệu đào tạo trong rò rỉ thử nghiệm)
- điểm chuẩn 是否衡量你关心的内容(code vs. duyệt web vs. generalist)
- đánh giá liệu có phải mạnh mẽ không(ST phù hợp, kiểm tra nhà nước, đánh giá con người)

Trước khi trích dẫn một số, hãy hiểu được ba điểm chuẩn này và các chế độ thất bại của nó.

## 概念

### SWE-bench ((Jimenez et al., ICLR 2024 uống)

- Từ 12 个热门 Python repos của 2.294 个 thực sự GitHub vấn đề.
- Agent 得到:pre-fix commit 的代码库 + mô tả vấn đề ngôn ngữ tự nhiên.
- Trưởng 产出: Một váy
- Thử nghiệm: ứng dụng patch,运行 repo của test suite──patch 必须让 FAIL_TO_PASS tests(之前失败,现在通过)翻转,同时不破坏 PASS_TO_PASS tests──

SWE-agent(Yang et al., 2024) đạt 12,5% trong thời gian phát hành, trọng tâm của nó là giao diện máy tính-agent (fail editor commands、model 能理解的搜索语法)

### SWE-bench Verified

OpenAI,2024 年 8 月── 500 nhiệm vụ phụ của nhân tạo được sắp xếp── loại bỏ các vấn đề mơ hồ、 thử nghiệm không đáng tin cậy, cũng như sửa chữa các nhiệm vụ không rõ ràng── nó là điểm tham khảo chính của đại lý của bạn liệu có thể giao các bản vá thực sự không?

### Ô nhiễm

- Hơn 94% các vấn đề của SWE-bench sớm hơn hầu hết các mô hình cắt giảm.
- **SWE-bench+**发现 32.67% các bản vá thành công trong các bài viết đã rò rỉ các giải pháp trong mô hình trong mô tả đã được sửa chữa), còn 31.08% vì sự phủ sóng thử nghiệm kém và đáng ngờ.
- Được xác minh 更干净, nhưng并非 hoàn toàn không bị ô nhiễm.

实践影响: một mô hình trên SWE-bench đạt 50%, trên SWE-bench+ 上可能只有 35%── nếu bạn tuyên bố hiệu suất trên SWE-bench, xin luôn luôn đồng thời báo cáo cả hai──

### GAIA(Mialon et al., Nov 2023)

- 466 câu hỏi; trong đó 300 câu hỏi được lưu lại cho bảng xếp hạng tư nhân của huggingface.co/gaia-benchmark.
- 设计理念: đối với loài người trong khái niệm đơn giản ((92%), nhưng đối với AI 困难(带插件的GPT-4:15%) 
- 测试 lý luận, đa phương tiện, web, công cụ.
- 三个难度等级;Tiếp độ 3 需要跨modality 的长工具链──

GAIA được sử dụng để đo lường khả năng tổng quát. Đừng kết hợp nó với các tiêu chuẩn cụ thể về mã.

### Đại diệnBench ((Liu et al., ICLR 2024)

- 8 môi trường, bao gồm mã ((Bash、DB、KG) 、games(Alfworld、LTP) 、web(WebShop、Mind2Web) và thế hệ mở。
- Nhiều vòng, mỗi vòng chia khoảng 4k-13k vòng.
- Trải nghiệm chính: suy luận dài hạn, ra quyết định và hướng dẫn theo là OSS LLM 追赶 blockers of commercial 

### Những thứ này không đo lường gì

- Chi phí hoạt động trên thế giới thực
- Điều kiện đối nghịch.
- Bạn có thể xem xét được hiệu suất của lĩnh vực của mình bằng cách sử dụng đánh giá của bạn, Bài học 30)
- Các thất bại đuôi (chỉ số chuẩn nhìn trung bình; nhà khai thác sản xuất 关心最差的 1%) ").

### Benchmarking 常见错误

- **执着于单一数字。**SWE-bench 50%  nói cho bạn thông tin ít hơn P50 / P75 / P95 chi phí + phân phối bước.
- **Contaminated claims。**报告 SWE-bench 却不提 Verified hoặc SWE-bench+ là gây hiểu lầm của
- **Benchmark-as-development-target。**Để đánh giá điểm 优化会偏离生产有用性――


```figure
ae-swebench-gate
```

##  xây dựng nó

`code/main.py`实现一个玩具版 SWE-bench-like harness:

- Công việc sửa lỗi tổng hợp (Task 3 tasks)
- Một nhân viên kịch bản, sẽ đưa ra các bản vá.
- Một người chạy thử nghiệm, để kiểm tra FAIL_TO_PASS.
- Một phân loại khó khăn kiểu GAIA dựa trên độ sâu phân hủy câu hỏi.

运行 nó:

```
python3 code/main.py
```

输遇展示每个任务 + 每个难度的解决率,并让评估员规则变得具体――

## Sử dụng nó

- **SWE-bench Verified**Sử dụng các đại lý mã.
- **GAIA**Sử dụng các đại lý tổng quát. Sử dụng phân chia bảng xếp hạng tư nhân.
- **AgentBench**Sử dụng để so sánh đa môi trường.
- **Custom evals**(Dạy 30) Sử dụng hình thức thực tế của sản phẩm của bạn.

## 交付 nó

`outputs/skill-benchmark-harness.md`会为任意代码基任务对 构建一个SWE-bench-style harness,带有 FAIL_TO_PASS / PASS_TO_PASS gating。

## 练习

1. Để sử dụng đeo đồ chơi này 移植 vào một repo thực tế 上运行( chọn một của riêng bạn) ―― cho lỗi đã biết  biên tập 3 bài kiểm tra FAIL_TO_PASS。
2. Thêm một số bước số liệu. Trong 3 nhiệm vụ của bạn, mỗi lần giải quyết cần bao nhiêu bước đại lý?
3. 阅读 SWE-bench+ paper。实现一个解决方案-leakage check(将发文与不同做模式匹配)。
4. Từ phân chia công chúng, tải về một câu hỏi của GAIA.
5. 阅读 AgentBench's per-environment breakdown──what environment 映射你的产品表面?那里的 SOTA是什么样?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| SWE-bench | “Code agent benchmark” | 2,294 个 GitHub issues；patch 必须翻转 FAIL_TO_PASS tests |
| SWE-bench Verified | “Clean SWE-bench” | 500 个由人工 curated 的 tasks，OpenAI |
| FAIL_TO_PASS | “Fix gate” | 之前 failing、patch 后必须 passing 的 tests |
| PASS_TO_PASS | “No-regression gate” | 之前 passing 且必须仍然 passing 的 tests |
| GAIA | “Generalist benchmark” | 466 个 human-easy / AI-hard 的 multi-tool questions |
| AgentBench | “Multi-env benchmark” | 8 个 environments；long-horizon multi-turn |
| Contamination | “Training-set leak” | benchmark tasks 出现在 model training 中 |
| SWE-bench+ | “Contamination audit” | 在 successful SWE-bench patches 中发现 32.67% solution leakage |

## 进一步阅读

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) Định nghĩa chuẩn nguyên thủy
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选子集
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) điểm chuẩn chung
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) 多环境 suite
