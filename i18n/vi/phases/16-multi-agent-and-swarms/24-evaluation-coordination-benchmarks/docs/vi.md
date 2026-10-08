# 评估与协调 Các tiêu chuẩn

> Năm điểm chuẩn trong năm 2025-2026 bao gồm nhiều đại lý  đánh giá không gian.**MultiAgentBench / MARBLE**(ACL 2025, arXiv:2503.01935) sử dụng các KPI milestone  đánh giá sao/ chuỗi/ cây/ biểu đồ 拓;**graph 最适合 research**,khu hoạch định nhận thức tăng khoảng 3% thành công thành công trong thành tích milestone.**COMMA** đánh giá phối hợp thông tin không đối xứng đa phương thức; bao gồm GPT-4o trong các mô hình tiên tiến nhất rất khó vượt qua đường cơ sở ngẫu nhiên.**MedAgentBoard**(arXiv:2505.12371) bao gồm bốn loại nhiệm vụ y tế, và thường thấy nhiều đại lý không tốt hơn một LLM.**AgentArch**(arXiv:2509.10769) chuẩn 结合工具使用 + 记忆 + orchestration 的企业代理架构──**SWE-bench Pro**([arXiv:2509.16941](https://arxiv.org/abs/2509.16941)(với 41 repos trong số 1865 vấn đề, bao gồm các ứng dụng kinh doanh, dịch vụ B2B và các công cụ phát triển; mô hình biên giới trên Pro lên khoảng 23%, trong khi trên Verified lên hơn 70%  Đây là kiểm tra thực tế đối với ô nhiễm.**64.3%**,并显式使用代理团队协调( chưa xuất bản nguồn chính Anthropic  先视为初步结果);Verdent(agent scaffold) 在 Verified 上达到 **76.1% pass@1**([Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report)(■)**AAAI 2026 Bridge Program WMAC**(https://multiagents.org/2026/）是2026 年社区焦点──本课基于MARBLE的指标,运行拓学-vs-指标扫描,并固定仅通过SWE-bench 验证 不是通用化证证 这条规则──

**类型：**Học hỏi
**语言：**Python (stdlib)
**先修：**Giai đoạn 16 · 15 (Tópologi bỏ phiếu và tranh luận), Giai đoạn 16 · 23 (Phương thức thất bại)
**时间：**约75分钟

## 问题

Khi một bài báo tuyên bố rằng hệ thống đa đại lý của chúng ta tốt hơn, vấn đề là: Bắt hơn gì tốt hơn, trong những nhiệm vụ nào tốt hơn, làm thế nào để đo lường?

Không có điểm chuẩn chung, bạn không thể có ý nghĩa so sánh hai hệ thống đa đại lý. Hơn nữa, không có điểm chuẩn có thể bị ô nhiễm.

本课列举 2026 年五条法典标准,说明 mỗi tiêu chuẩn 衡量什么,并教你用怀疑态度阅读 tiêu chuẩn tuyên bố。

## 概念

### MultiAgentBench (MARBLE)  ACL 2025

arXiv:2503.01935── trong các nhiệm vụ nghiên cứu, lập trình và lập kế hoạch 上 đánh giá bốn loại topology phối hợp(star、chain、tree、graph)── dựa trên các KPI thành tích của milestone, không chỉ nhìn vào thành công cuối cùng──

测量结果:

- **Graph**Topology 最适合研究场景; ủng hộ bất kỳ sự phê bình nào.
- **Chain**最适合 bước lọc mã hóa.
- **Star**ối hợp với việc hợp nhất thực tế nhanh chóng.
- **Coordination tax**Trong biểu đồ trên hơn 4 đại lý xuất hiện sau đó.
- **Cognitive planning**Trong các topology tăng khoảng 3% thành tích thành công trong các thành tích thành công.

使用场景: 你想对协调拓类 进行果对果比较──MARBLE repo(https://github.com/ulab-uiuc/MARBLE）提供- Đánh giá:

### COMMA  đa phương tiện 非对称信息

覆盖代理 具有不同观察方式的任务,且必须在没有完整信息共享的情况下协调任务. 报告结果不适宜:包括GPT-4o在内的边界模型 在COMMA的代理-agent合作上很难超过**random baseline** tín hiệu là: các phương pháp đa tác nhân  thiếu đào tạo  thiếu đánh giá  LLM có thể xử lý hợp lý hơn hợp tác một phương pháp; phối hợp đa phương pháp 会崩。

Sử dụng trường hợp: Hệ thống của bạn có phối hợp thông tin đa phương thức hoặc không đối xứng. Kết quả không có kết quả của COMMA là một cảnh báo:

### MedAgentBoard  kiểm tra căng thẳng miền

ArXiv:2505.12371──四类医疗任务:chẩn đoán, lập kế hoạch điều trị, tạo ra báo cáo, giao tiếp với bệnh nhân.

发现:multi-agent 在大多数类别上不优于单-LLM──multi-agent优势很狭 当子任务可以清晰分离时(诊断 + điều trị),任务分解有帮助;当协调总费 超过专业化获益时(报告生成),它会伤害效果──

Sử dụng trường hợp: Quản trị của bạn có những đường cơ sở LLM đơn giản rõ ràng. Nếu kinh nghiệm của MedAgentBoard có thể tổng quát, thì nhiều hệ thống đa đại lý được đề xuất đều được thiết kế quá kỹ thuật.

### AgentArch  kiến trúc doanh nghiệp

ArXiv:2509.10769──将工具使用、记忆和调乐 分层组合的企业设置──基准 隔离每层的贡献: 添加工具有多大帮助吗? 添加记忆? 添加多代理调乐吗?

Sử dụng trường hợp: Bạn đang thiết kế hàng đại lý doanh nghiệp, và cần chứng minh tính hợp lý của mỗi tầng.

### SWE-bench Pro  现实检验

ArXiv:2509.16941──41 个存储 中的 1865 个问题,覆盖业务应用, B2B dịch vụ, và các công cụ phát triển.**未污染** Các mô hình biên giới trên Pro là khoảng 23%, trong khi trên Verified là hơn 70%  Sự khác biệt này là tín hiệu ô nhiễm 

2026 年 4 月分数:
- Claude Opus 4.7 trên Pro: **64.3%**( báo cáo称显式使用代理团队协调; chưa công bố nguồn chính Anthropic  先视为初步结果)
- Verdent ((đầu cơ nhân) trên xác minh: **76.1% pass@1**([technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report)(■)
- Không sử dụng cơ sở của biên giới điểm số thô trên Pro: ~23-35%[SWE-bench Pro paper](https://arxiv.org/abs/2509.16941)(■)

 Chúng tôi đã đánh bại SWE-bench Verified不再是能力证证──Pro 是当前门口测试──Agent-team scaffolding 在 Pro 上产生可衡量的收益 ((约 30-40 điểm delta), đây là một trong những lập luận kinh nghiệm mạnh nhất của hỗ trợ phối hợp đa đại lý năm 2026 ⋅

### AAAI 2026 WMAC

Chương trình Cầu AAAI 2026  Hội thảo về Hợp tác đa tác nhânhttps://multiagents.org/2026/）。这是2026 năm nhiều đại lý AI nghiên cứu của cộng đồng tập trung. Các bài báo được chấp nhận và các thủ tục hội thảo là đánh giá phương pháp mới của địa điểm truyền thống; trong việc đưa ra quyết định sản xuất, nên ưu tiên tham khảo các tuyên bố được chấp nhận bởi WMAC, chứ không phải các bản in trước của arXiv.

### 用怀疑态度 đọc yêu cầu chuẩn  danh sách kiểm tra 2026

Khi ai đó tuyên bố một kết quả đa đại lý:

1. **哪个 benchmark，哪个 split？**SWE-bench Verified với Pro  khác biệt rất lớn.
2. **Contamination check。**Chỉ số chuẩn có được phát hành sau khi cắt giảm đào tạo mô hình được kiểm tra không? Nếu không, hãy thận trọng.
3. **Baseline comparison。**So với cơ sở của một LLM, tự nhiên, nhiều đại lý trước đây
4. **Statistical significance。**N thử nghiệm, p-đáng giá, khoảng thời gian tin tưởng.
5. **Task diversity。**Một nhiệm vụ hay nhiều nhiệm vụ?
6. **Cost disclosure。**Các mã thông báo cho mỗi nhiệm vụ ۰:0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x :0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0x:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0

### Các điểm chuẩn trước đều đo lường nội dung không tốt

- **Long-horizon coordination。**持续数天的墙-钟互动──当前所有基准都很短──
- **Adversarial resilience。**Điều gì xảy ra khi một điệp viên có ý xấu hay bị tấn công?
- **Drift under deployment。**Các điểm chuẩn là tĩnh态; sản xuất phân bố sẽ thay đổi.
- **Cost-normalized performance。**Hầu hết các tiêu chuẩn  báo cáo chính xác nguyên liệu, chứ không phải chính xác trên đô la.

Vì bạn thực sự quan tâm đến trục xây dựng điểm chuẩn nội bộ của mình, thường là thực hành chính xác.


```figure
a5-bench-gap
```

##  xây dựng nó
`code/main.py`Đó là một bước đi không tương tác:

- Trong nhiệm vụ đồ chơi 上模拟 3 hệ thống đa đại lý.
- Để mỗi hệ thống tính toán các métrics milestone kiểu MARBLE.
- Thông qua bộ tập huấn, các nhiệm vụ giữ lại trong việc kiểm tra ô nhiễm.
- 显式比较随机基线――
- 打印 điểm số của các yêu cầu chuẩn

运行:

```bash
python3 code/main.py
```

预期输出:Sơ đồ điểm số của hệ thống, bao gồm độ chính xác nguyên liệu, thành tựu thành tích thành tích, chi phí cho mỗi nhiệm vụ, đối với delta đường cơ sở ngẫu nhiên, cũng như ghi chú kiểm tra ô nhiễm.

## Sử dụng nó
`outputs/skill-benchmark-reader.md`读取任意多代理基准索赔,并应用审查 kiểm tra danh sách──输出:grade 和 caveats──

## 交付 nó
生产评估纪律:

- **构建 internal benchmark**, phản ánh sự phân phối sản xuất thực tế của bạn.
- **在每次比较中包含 random baseline。**Nếu trong nhiệm vụ phối hợp trên không thể vượt quá ngẫu nhiên, thì nhiệm vụ có thể được định nghĩa không tốt.
- **同时报告 cost 和 accuracy。**Chi phí token và đồng hồ tường.
- **每季度重建 benchmark。**Phân phối sản xuất 会 biến đổi; 陈旧基准 会误导――
- **避免 published-benchmark overfitting。**Nếu đội ngũ của bạn chuyên tối ưu hóa số SWE-bench Pro, bạn sẽ trở lại trong sản xuất.

## 练习

1. 运行 `code/main.py`❖ Tìm ra trong ba hệ thống mô phỏng có chi phí tốt nhất cho mỗi bước ngoặt.
2. 阅读 MultiAgentBench ((arXiv:2503.01935)  Đối với lĩnh vực nhiệm vụ của riêng bạn, đánh giá MARBLE 会推四种类型中的哪种种──根据论文结果说明理由──
3. 阅读 SWE-bench Pro paper. Nó đặc biệt là chống lại ô nhiễm như thế nào?
4. 阅读 COMMA 关于多模拟协调的发现――设计一个可以加入内部基准的简单多模拟协调任务――什么可以算作有用信号?
5. Để xem danh sách kiểm tra các yêu cầu chuẩn  áp dụng cho một bài báo đa đại lý gần đây kết quả tiêu đề  Bạn sẽ cho yêu cầu này điểm nào?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025；带 milestone KPIs 的 star/chain/tree/graph topologies。 |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination；frontier models 相比 random 表现吃力。 |
| MedAgentBoard | "Domain stress test" | 四个医疗类别；经常发现 multi-agent 并不优于 single-LLM。 |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration 分层组合。 |
| SWE-bench Pro | "Contamination-resistant" | 1865 个问题、41 个 repos；在 Verified 上约 23% vs 70%+（contamination signal）。 |
| Milestone achievement | "Partial credit" | 奖励进展而不只奖励最终成功的 benchmarks。 |
| Contamination | "Benchmark leaked into training" | 发布后，benchmarks 进入训练语料；分数膨胀。 |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination；社区焦点。 |

## 延伸阅读

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) 带 milestone KPI của topology benchmark
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) Thực hiện tham chiếu
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) kiểm tra căng thẳng miền; đa tác nhân thường không tốt hơn
- [AgentArch](https://arxiv.org/abs/2509.10769) Các kiến trúc đại lý doanh nghiệp
- [SWE-bench leaderboards](https://www.swebench.com/) mô hình biên giới của Verified 和 Pro 分数
- [AAAI 2026 WMAC](https://multiagents.org/2026/) 2026 年社区焦点
