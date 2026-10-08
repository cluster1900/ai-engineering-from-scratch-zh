# OpenAI Prep Framework và DeepMind Frontier Safety Framework

> OpenAI Preparedness Framework v2(4月 năm 2025) giới thiệu Các loại nghiên cứu: Tự trị dài hạn, Lái tạo rác và thích nghi, Tự trị sao chép và điều chỉnh, chúng khác với các loại được theo dõi. Các loại được theo dõi sẽ kích hoạt các báo cáo về năng lực và các báo cáo về bảo mật, được kiểm tra bởi nhóm cố vấn về an toàn FSF v3 ((9月 năm 2025, Capacity Levels được theo dõi 于 2026 4月 17日加入) sẽ tự trị 纳入 ML lĩnh vực R&D và Kỹ thuật toán (ML R&D) cấp độ 1 như đối với con người + có công cụ cạnh tranh, hoàn toàn tự động hóa R&D pipeline) FSF 明三 v3 thông qua các biện pháp điều chỉnh đối với các loại thông tin lừa dối được sử dụng để theo dõi chính sách tự động hóa; nếu như chính sách nghiên cứu sẽ không bao gồm các biện pháp kiểm soát tự động, Mn sẽ không thể giải quyết được các biện pháp kiểm soát tự động;

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## 问题

Bài học 19 仔细阅读Anthropic's scaling policy──本课通过阅读OpenAI和DeepMind's policies来补充全景──Thầy ba tài liệu là cùng loại sản phẩm, xử lý cùng một vấn đề: biên giới phòng thí nghiệm 什么时候应该暂停或限制一个模型; chúng đều có xu hướng trên một小组类别, cũng có sự phân biệt trên một số vị trí cụ thể quan trọng──

趋同之处: 三者都把长远自主权 标记为值得追踪的能力类别──三者都承认欺骗行为(alignment faking、sandbagging) là một loại风险 cụ thể──三者都有内部审查机构──分歧之处:OpenAI将类别分为Tracked(强制缓解) 和Research(不自动触发)──DeepMind将自主权 纳入两个领域,而不是单独命名──实验室将使用Tracked Research,Critical vs Moderate、Tier-1 vs Tier-2等名称;能力落在哪个桶里,会产生不同的操作后果──

Đặt chúng lại với nhau là một bài tập hữu ích. Một khả năng tương tự trong Anthropic có thể là làm giảm thiểu , trong OpenAI có thể là  giám sát nhưng không kích hoạt , trong DeepMind có thể là  theo dõi trong một lĩnh vực cụ thể ── thái độ chính sách rất quan trọng.

## 概念

### OpenAI Preparedness Framework v2(2025 年 4 月)

结构:

- **Tracked Categories**:触发 Khả năng báo cáo (模型能做什么)加保障报告 (已有哪些缓解措施) 部署前由安全咨询组 审查。
- **Research Categories**:实验室 đang theo dõi, nhưng chưa cam kết khả năng mô hình của các biện pháp giảm thiểu cụ thể, bao gồm: Tự trị dài hạn, Lưu trữ cát, Tái tạo tự động và thích nghi, Giảm bảo vệ.

Các phân loại nghiên cứu sẽ không tự động tạo ra các biện pháp giảm thiểu. Các chính sách được xây dựng để giúp giảm thiểu tiềm năng.

### DeepMind Frontier Safety Framework v3(2025 年 9 月;Sự theo dõi các mức độ khả năng 于 2026 年 4 月 17 日加入)

结构:

- **Critical Capability Levels (CCLs)**:跨五个领域的能力值:Thiết học, Sinh học, ML R&D CBRN, Tự trị
- **Tracked Capability Levels**:2026 年 4 月加入额外粒度──具体例:ML R&D tự trị cấp 1 = 以 đối với con người + AI công cụ có chi phí cạnh tranh, hoàn toàn tự động hóa AI R&D ống ống bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor bor
- **Deceptive alignment monitoring**:明确 cam kết thực hiện giám sát tự động đối với việc sử dụng biện pháp lý luận bằng công cụ.

Cách diễn tả tự trị khác với OpenAI. DeepMind không đặt tự trị trong lĩnh vực cấp cao; nó được đưa vào lĩnh vực tự trị có thể gây tổn thương.

### 三者 chung xu hướng

- 内部 Antrope SAG, OpenAI SAG, DeepMind nội bộ ủy ban) ――高能力模型部署前进行审查──
- 明确 đề cập đến sự sắp xếp / sắp xếp giả mạo là một loại风险.
- 以声明的节奏产出持续性文档:Anthropic:Bộ trình an toàn biên giới,Báo cáo rủi ro;OpenAI:Báo cáo về khả năng và biện pháp bảo vệ;DeepMind:FSF update cycle)
-  thừa nhận chỉ dựa trên giám sát có giới hạn phòng thủ.

### 它们的分歧之处

- **Anthropic**:v3.0 移除暂停承诺; AI R&D-4 ngưỡng là được đặt tên là một cửa tiếp theo.
- **OpenAI**:Tracked vs Research 拆分;Phát mục nghiên cứu (bao gồm tự trị tầm xa) sẽ không tự động cổng.
- **DeepMind**: tự trị được đưa vào các lĩnh vực khác; Cấp độ khả năng theo dõi 于 2026 年 4 月加入更细粒度──

### Sandbagging: một khả năng đặc biệt để làm cho người khác phức tạp

Sandbagging (模型在评估中策略性表现不佳) nằm trong OpenAI's Research Categories。Anthropic's RSP v3.0 通过评估-context gap(Lớp 1) xử lý nó。DeepMind 在 FSF v3 中通过欺骗性对齐监测 处理它。

Nếu một mô hình trong một túi cát trong đánh giá, thì khả năng của mỗi khung sẽ bị đánh giá thấp.

### 政策阅读技能

- 定位: Mỗi năng lực bạn quan tâm đều nên được tìm thấy trong chính sách. Nếu không tìm thấy, chính sách sẽ không bao gồm nó.
- 分类: Nó là theo dõi (tracked) hay nghiên cứu (tracked but not touched)?OpenAI 明确 đặt tên cho điều này;
- 节奏: Chính sách là theo thời gian của tuyên bố được cập nhật, hoặc chỉ được cập nhật sau một sự kiện cụ thể?
- 独立性: kiểm tra bên ngoài là bắt buộc hay có thể lựa chọn?Anthropic với Apollo và Viện An toàn AI Hoa Kỳ 合作;OpenAI với METR 合作;DeepMind chủ yếu phụ thuộc vào SAG bên trong.


```figure
a5-tracked-vs-research
```

## Sử dụng nó

`code/main.py`实现一个小型决策表差工具――给定一个能力(自治、欺骗性配线、研发自动化、网络升级等), nó sẽ phát hành ba chính sách phân biệt cách phân loại năng lực này,以及会触发什么缓解措施―― nó là một công cụ trợ giúp đọc, không phải là một công cụ chính sách――

## 交付 nó

`outputs/skill-cross-policy-diff.md`Sử dụng ba khung như một tài liệu tham khảo, để tạo ra các chính sách đối với các khả năng cụ thể.

## 练习

1. 运行 `code/main.py`❖ xác nhận các công cụ khác nhau của sản xuất và chính sách phù hợp, ít nhất xác minh hai bạn có thể đối phó với nguồn kiểm tra tài liệu.

2. 完整阅读 OpenAI Preparedness Framework v2──识别每个研究类别──对每项,用一句话说明为什么它在研究而不是追踪──

3. 完整阅读 DeepMind FSF v3, cũng như Cấp độ khả năng theo dõi năm 2026 năm 4 tháng 更新──识别 ML R&D tự trị cấp 1 具体评估标准──你会如何从外部测量它?

4. Sandbagging  nằm trong OpenAI's Research Categories。 thiết kế một đánh giá, buộc phải mô hình của túi cát để lộ khả năng thực sự của nó。 trích dẫn Bài học 1 中关于评估-context-gaming的讨论。

5. 针对某项具体能力 (由你选择) 比较三项政策――说明 bạn nghĩ phân loại nào của chính sách nghiêm ngặt nhất, nào không nghiêm ngặt nhất―― dùng văn bản chứng minh

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) v2 công bố
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 完整文档──
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) FSF v3 公告──
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) Cấp năng lực theo dõi 增补。
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) FSF 格式风险报告示例──
