# Eval 驱动的代理 开发

> Hướng dẫn của nhân chủng học: Từ đơn giản đơn giản  bắt đầu, sử dụng đánh giá toàn diện để tối ưu hóa chúng, và chỉ cần thêm nhiều bước vào hệ thống đại lý  đánh giá không phải là bước cuối cùng.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## Học mục tiêu
- Nói ra ba cấp đánh giá  điểm chuẩn tĩnh  sản xuất trực tuyến  và các mục đích sử dụng riêng 
- 解释 đánh giá- tối ưu hóa 密切循环──
- Mô tả thực tiễn tốt nhất: 2026: các phương pháp và mã được đặt cùng nhau, hoạt động trong CI,并作为 PR gateway──
- Mỗi lớp học của giai đoạn 14 sẽ được kết nối với trường hợp đánh giá mà nó tạo ra.

## 问题
Các đại lý có thể thông qua demo. Chúng sẽ thất bại trong quá trình sản xuất bằng cách không thể dự đoán được. Các điểm chuẩn trả lời là:

## 概念
### 3 cấp đánh giá

1. **Static benchmarks** dùng để mã hóa của SWE-bench Verified(Dạy 19) 、 dùng để duyệt web trên bàn WebArena/OSWorld(Dạy 20) 、 dùng để nói chung GAIA(Dạy 19) 、 dùng để sử dụng công cụ của BFCL V4(Dạy 06)  dùng để xuyên mô hình so sánh và tháo quay gập。污染 là hiện hữu thực sự:SWE-bench+ 发现 32.67% giải pháp rò rỉ──始终报告 Verified / +-audit 分数──

2. **Custom offline evals**  您的产品形态:
   - LLM-as-judge ((Langfuse、Phoenix、Opik  Bài học 24)。
   - Thực hiện dựa trên bản vá运行,检查测试)
   - Dựa trên quỹ đạo sẽ có các chuỗi hành động so với vàng; OSWorld-Human  hiển thị các đại lý cấp cao nhất là vàng 1.4-2.7x)

3. **Online evals** 生产:
   - Lần lặp lại phiên họp
   - Guardrail 触发的告警(Lớp 16、21)
   - 单步成本 / 延迟跟踪 (Dạy học 23 bao gồm:

### Thử nghiệm đánh giá-định hướng (Anthropic)

Chuyện liên quan:

1. Nhà đề xuất 生成输出──
2. Người đánh giá  tiến hành phán quyết:
3. 反复 tinh chỉnh, cho đến khi đánh giá 通過──

Đây là tự tinh chỉnh sau khi được phổ biến (Dân học 05)  Bất kỳ dòng chảy đại lý nào bạn quan tâm đều có thể được đóng gói vào trình tối ưu hóa đánh giá, để nâng cao độ tin cậy.

### 2026 thực hành tốt nhất

- Evals và code đặt cùng nhau.
- Trong mỗi PR trên thông qua CI 运行.
- 根据 eval scores gate merge (ví dụ: 相对主要 不允许回归 > 5% )
- Mỗi đường dây được chiếu vào một trường hợp đánh giá.
- Mỗi条学到的规则 (Reflection, Pro-workflow learning-rule) đều được mô tả như một trường hợp thất bại.

### Chuyện 14 sẽ xảy ra

Mỗi lớp học trong giai đoạn 14 sẽ tạo ra các trường hợp đánh giá:

| Lesson | 它生成的 Eval case |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted、infinite-loop guard |
| 02 ReWOO | 当 tool 失败时，Planner 能正确 replans |
| 03 Reflexion | 学到的 reflections 会在 retry 时应用 |
| 05 Self-Refine/CRITIC | Judge 通过 refined output |
| 06 Tool Use | Argument coercion 生效；unknown tools 被拒绝 |
| 07-10 Memory | Retrieval citations 与 sources 匹配；stale facts 失效 |
| 12 Workflow Patterns | 每种 pattern 都产生正确输出 |
| 13 LangGraph | Resume 精确复现 state |
| 14 AutoGen Actors | DLQ 捕获 crashed handlers |
| 16 OpenAI Agents SDK | Guardrail 在正确输入上触发 |
| 17 Claude Agent SDK | Subagent results 返回 orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score、WebArena success rate、OSWorld efficiency |
| 21 Computer Use | Per-step safety 捕获 injected DOM |
| 23 OTel | Spans 发出 required attributes |
| 26 Failure Modes | Detectors 标记 known failures |
| 27 Prompt Injection | PVE 拒绝 poisoned retrievals |
| 28 Orchestration | Supervisor 路由到正确 specialist |
| 29 Runtime Shapes | DLQ 处理 N% failure |

Nếu bộ đánh giá của bạn bao gồm từng phần, bạn đã bao gồm giai đoạn 14.

### Eval 驱动开发会在哪里失败

- **没有 baseline。**Không có đánh giá tốt nhất được biết 无法解读── lưu trữ cơ sở.
- **LLM-judge 没有 grounding。**Các thẩm phán cũng sẽ ảo giác.
- **过拟合 evals。**Để đánh giá 优化会偏离生产实用性――轮换案――
- **Flaky evals。**Các trường hợp không chắc chắn sẽ gây ra báo động sai.


```figure
ae-eval-three-layers
```

##  xây dựng nó
`code/main.py`là một sdlib eval harness:

- 带 danh mục (chỉ số chuẩn, tùy chỉnh, trực tuyến) của hồ sơ trường hợp
- Một nhân viên kịch bản đang được thử nghiệm.
- Vòng đánh giá-đối ưu hóa: đề xuất, thẩm phán, tinh chỉnh cho đến khi vượt qua hoặc đạt đến vòng tối đa.
- Cổng CI: tỷ lệ vượt qua tổng cộng + với sự lùi lại của đường cơ sở.

运行 nó:

```
python3 code/main.py
```

输出: mỗi trường hợp của pass/fail  cờ quay lại  phán quyết cổng CI

## Sử dụng nó
- Trong repo tương tự với mã đại lý, biên soạn các trường hợp đánh giá.
- Thông qua CI trong mỗi PR lên vận hành chúng.
- Trong thời gian hồi quy, hãy xây dựng thành công.
- Theo tỷ lệ vượt qua thay đổi theo thời gian.
- Mỗi thất bại sản xuất sẽ bị kết hợp với một trường hợp mới.

## 交付 nó
`outputs/skill-eval-suite.md`Để tạo ra một sản phẩm đại lý  cấu trúc bộ đánh giá ba cấp, bao gồm các cổng CI và theo dõi trắc trở.

## 练习
1. Hãy lấy một vụ thất bại trong sản xuất của bạn. Hãy viết một vụ đánh giá có thể hoàn thành.
2. Để tạo ra một lĩnh vực của bạn bao gồm ba chiều ((thực tế, âm thanh, phạm vi) của LLM-phán tòa quy tắc.
3. Để đánh giá bộ 接入 CI──在 >=5% regression 时让 build 失败──
4. 添加轨迹- hiệu quả métrics:agent 相比黄金轨迹 走了多少步?
5. Để mỗi lớp học của giai đoạn 14 được hiển thị vào một trường hợp đánh giá trong bộ của bạn. Có thiếu sót không? Đó là khoảng cách cần phải sửa chữa.

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Static benchmark | “Off-the-shelf eval” | SWE-bench、GAIA、AgentBench、WebArena、OSWorld |
| Custom offline eval | “Domain eval” | 面向你的产品形态的 LLM-as-judge / exec / trajectory |
| Online eval | “Production eval” | Session replay、guardrail alerts、cost/latency tracking |
| Evaluator-optimizer | “Propose-judge-refine” | 迭代直到 judge 通过 |
| CI gate | “Merge blocker” | 在 eval regression 时让 build 失败 |
| Baseline | “Last-known-good” | 用于检测 regression 的 reference score |
| Trajectory efficiency | “Steps over gold” | Agent step count 除以 human expert minimum |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)Từ đơn giản bắt đầu, sử dụng đánh giá 优化
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选 chuẩn
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) Chỉ số chuẩn sử dụng công cụ
- [Langfuse docs](https://langfuse.com/) 实践中的 evals + phiên bản lặp lại
