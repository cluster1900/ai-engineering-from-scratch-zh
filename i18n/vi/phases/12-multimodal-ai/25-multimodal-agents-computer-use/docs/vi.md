# Các đại lý đa phương tiện và sử dụng máy tính (Capstone)

> 2026 năm biên giới sản phẩm là một đại lý đa phương thức: nó có thể đọc ảnh chụp màn hình, nhấp chuột nút, duyệt web UI, lấp đầy các biểu mẫu,并端到端 hoàn thành các dòng công việc. SeeClick 和 CogAgent(2024) chứng minh GUI-grounding nguyên thủy.

**Type:** Capstone
**语言：**Python(stdlib、action scheme + agent loop skeleton)
**Prerequisites:** Phase 12 · 05（LLaVA）、Phase 12 · 09（Qwen-VL JSON）、Phase 14（Agent Engineering）
**Time:** 约 240 分钟

## Học mục tiêu
- 设计一个多模特代理循环:perceive → reason → act → observe → repeat。
- 构建一个GUI grounding output schema(click coordinates、type text、scroll、drag), để VLM 能以 JSON 发出。
- So sánh các đại lý chỉ chụp màn hình, đại lý cây truy cập và đại lý lai.
- Trong một slice VisualWebArena nhỏ, cài đặt đánh giá điểm chuẩn của đại lý đa mô hình.

## 问题
Một dòng công việc đặt chỗ: "Hãy tìm cho tôi một chuyến bay đến Tokyo vào ngày 15 tháng 4, chỗ ngồi dưới 800 đô la, đặt nó".

Thuốc đa phương tiện 需要:

1. 获取浏览器的截图.
2. 将 màn hình ảnh + URL + mục tiêu 解析为计划──
3. 发出 cấu trúc hành động:click(在 x,y) 、type "Tokyo"(在元素 E) 、滚向下、选择(radio button)
4. sẽ được ứng dụng cho trình duyệt.
5. 观察新状态 (nơi mới)
6. 重复 cho đến khi nhiệm vụ hoàn thành.

Mỗi bước là một cuộc gọi VLM đa mô hình. Khả năng VLM phải là JSON có thể phân tích.

## 概念
### GUI grounding  nguyên thủy

GUI đặt đất là:给定一个屏幕截图 和一条自然语言说明,输出要点击的 (x, y) phối hợp ((或其他动作) ⋅

SeeClick(arXiv:2401.10935) là kết quả mở quy mô đầu tiên: trong dữ liệu GUI tổng hợp + thực trên chỉnh sửa một VLM, với các mã thông báo văn bản đơn giản 输出 phối hợp。有效。

CogAgent(arXiv:2312.08914) vì các UI mật độ tăng mã hóa độ phân giải cao 1120x1120──分数: web navigation 上约 84%──

Ferret-UI(arXiv:2404.05719) chuyên về các UI di động,并 với dữ liệu truy cập iOS 集成──

Phương thức đầu ra thường là JSON:

```json
{"action": "click", "x": 384, "y": 220, "element_desc": "Search button"}
```

`element_desc`Giúp phục hồi: Nếu các liên kết di chuyển giữa các ảnh chụp màn hình, gợi ý ngữ nghĩa có thể làm cho hệ thống tái định tuyến.

### Các chương trình hành động

Một quy trình hành động điển hình có 6-10 loại hành động:

- `click`(x, y)
- `type`: (text, x?, y?)
- `scroll`: (nghĩa, số lượng)
- `drag`(x0, y0, x1, y1)
- `select`: (option_index)
- `hover`(x, y)
- `navigate`: (url)
- `wait`(ms)
- `done`: (sự thành công, giải thích)

Agent Mỗi bước phát hành một hành động. Báo trình duyệt 执行并返回新状态.

### 仅截图 vs 可访问性树

两种输入模式:

- Chỉ chụp màn hình: hình ảnh hoàn chỉnh, không có thông tin cấu trúc.
- Cây truy cập:DOM có cấu trúc / thông tin truy cập iOS.
- Hybrid: hai trong số đó có, sử dụng cây  như một nền tảng đáng tin cậy của hành động nguyên tử, sử dụng ảnh màn hình  cung cấp ngữ nghĩa ngữ cảnh.

Các đại lý sản xuất trong có thể sử dụng hybrid.

### Tưởng thức chân trời dài

Một dòng công việc 20 bước sẽ tạo ra 20 ảnh chụp màn hình.

- Kết luận: mỗi 5 bước, kết luận đã xảy ra, bỏ qua các bức ảnh màn hình cũ.
- Skip-frame: giữ giữ第一张、最后一张, cũng như mỗi 3 张 screenshot。
- Log ghi lại công cụ: thực hiện các hành động, giữ lại bản ghi văn bản của nội dung đã hoàn thành; đừng xem lại ảnh chụp màn hình cũ.

Claude's computer-use API Sử dụng log pattern.

### Sử dụng công cụ trực quan

ChartAgent(arXiv:2510.04514) cho phép hiểu chati 引入视觉工具使用:crop、zoom、OCR、调用外部检测──agent 可以把"crop to region (100, 200, 300, 400) then call OCR" 作为工具调用 输出──工具 返回文本;VLM 继续推理──

Mô hình này có thể được tổng hợp: set-of-mark prompting, vùng ghi chú và các công cụ phát hiện bên ngoài đều phù hợp với cùng một công cụ gọi, nhận được phản ứng cấu trúc.

### Các chỉ số chuẩn năm 2026

- ScreenSpot-Pro── khoảng 1k ảnh màn hình trên web trên nền GUI──Open SOTA Qwen2.5-VL-72B 约 85%──Frontier 约 90%──
- VisualWebArena。Thông việc web cuối đến cuối(shop、forum、classified ads)。Open SOTA 约20%──Gemini 3 Pro 约27%──
- AgentVista(arXiv:2602.23166)。 khó nhất của 2026 điểm chuẩn。 xuyên 12 lĩnh vực thực tế của dòng công việc。 Mô hình biên giới đạt điểm 27-40%; mô hình mở 10-20%。
- WebArena / WebShop── các tiêu chuẩn sớm hơn; đã được biên giới 和──

### Tại sao nó vẫn khó khăn

Thuốc 性能瓶:

1. 细粒度 thị giác đặt đất. "Click the small X" thường trong độ phân giải di động.
2. Kế hoạch định định đường dài: 10 hành động sau đó, đại lý sẽ rời khỏi mục tiêu.
3. Phản hồi lỗi── khi nhấp vào nút 失败(错误) thì,检测 + 恢复 rất ít xuất hiện trong dữ liệu được đào tạo 中──
4. Nội dung qua trang ⋅ trên tab hoặc长 hình thức 之间跳转会丢失状态──

Các hướng nghiên cứu: kiến trúc bộ nhớ, lập kế hoạch lại rõ ràng, xác minh đa mô hình, dùng để kết hợp ảnh chụp màn hình thành công của hành động.

### Ngọc đá xây dựng nó

Nhiệm vụ Capstone: xây dựng một đại lý sử dụng máy tính, nó có thể:

1. 读取 trang giả của trang đặt chỗ HTML + chụp màn hình.
2. 规划 nhiều bước: tìm kiếm → chọn → điền biểu mẫu → gửi。
3. 发发出 JSON hành động phù hợp với các quy trình hành động
4. Trong một phần 10 nhiệm vụ cố định, đánh giá trên.

Bài học này cung cấp mã treo, dễ dàng mở rộng cho trình duyệt thực.


```figure
mm-agent-loop
```

## Sử dụng nó
`code/main.py`Đường đá cột:

- Action schema của JSON 定义(10 个 hành động)。
- 作为 dict 的模拟浏览器状态──
- Cơ thể vòng tròn đại lý: nhận trạng thái, phát hành hành động, áp dụng, vòng.
- 10-task mini-benchmark (trên bản tổng hợp), được sử dụng để đo lường tỷ lệ thành công từ đầu đến cuối.
- Khi hành động 失败时的错误-recovery hook──

## 交付 nó
本 bài học 生成 `outputs/skill-multimodal-agent-designer.md` Định định một sản phẩm sử dụng máy tính (domain, action set, evaluation target), thiết kế vòng tròn đầy đủ của các đại lý, chiến lược nhớ, chế độ đặt nền và điểm chuẩn dự kiến.

## 练习
1. Sử dụng `screenshot_region`công cụ ((crop + zoom) mở rộng kế hoạch hành động.

2. 阅读 AgentVista(arXiv:2602.23166)  mô tả các loại nhiệm vụ khó khăn nhất, cũng như tại sao các mô hình biên giới vẫn thất bại

3. Nhiệm độ nén chân trời dài: thiết kế một chuỗi tổng kết, giữ ≤4 张 ảnh chụp màn hình trực tiếp, đăng số lượng không giới hạn。

4. 构建一个错误恢复:当动作失败时,agent接下来做什么?

5. So sánh ảnh chụp màn hình Claude 4.7 với ảnh chụp màn hình lai + cây truy cập Qwen2.5 - VL trong 10 nhiệm vụ trên web.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GUI grounding | "Click coordinates" | Model 在 screenshot 上针对 instruction 的 target 输出 (x,y) |
| Action schema | "Tool definitions" | 有效 actions（click、type、scroll、drag）的 JSON description |
| Accessibility tree | "Structured DOM" | 来自 browser/iOS APIs 的 machine-readable UI hierarchy |
| Hybrid agent | "Screenshot + tree" | 同时使用 image 和 structured info；比单独使用任一者更可靠 |
| Visual tool use | "Zoom/crop/detect" | Agent 在 plan 中途调用 external vision tools（OCR、detection） |
| Summary-chain | "Memory compression" | 周期性 text summaries 替代很长的 screenshot history |
| VisualWebArena | "E2E web bench" | 2024 benchmark，用于 end-to-end web tasks |
| AgentVista | "2026 hard bench" | 12-domain realistic workflows；即使 Gemini 3 Pro 也只有约 30% |

## 延伸阅读
- [Cheng et al. — SeeClick (arXiv:2401.10935)](https://arxiv.org/abs/2401.10935)
- [Hong et al. — CogAgent (arXiv:2312.08914)](https://arxiv.org/abs/2312.08914)
- [You et al. — Ferret-UI (arXiv:2404.05719)](https://arxiv.org/abs/2404.05719)
- [ChartAgent (arXiv:2510.04514)](https://arxiv.org/abs/2510.04514)
- [Koh et al. — VisualWebArena (arXiv:2401.13649)](https://arxiv.org/abs/2401.13649)
- [AgentVista (arXiv:2602.23166)](https://arxiv.org/abs/2602.23166)
