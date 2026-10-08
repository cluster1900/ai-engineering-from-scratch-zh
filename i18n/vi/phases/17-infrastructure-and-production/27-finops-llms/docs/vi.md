# Các LLM của FinOps  单位经济性与多租户归因

> 传统FinOps trong LLM 支出上会失效──成本是Token 交易,而不是资源在线时长──标签无法映射, một API call 是一笔交易,不是一资产──工程决策(quan 设计"",context window"",输出长度)就是财务决策──2026 playbook 要求从第一天起就埋点三个归因维度:per-user:`user_id`) dùng cho việc định giá ghế và mở rộng, cho mỗi nhiệm vụ`task_id`+ `route`(b) Đối với sản phẩm giá trị trên mặt và ưu tiên, cho người thuê)`tenant_id`(với các công cụ khác nhau, các công cụ khác nhau được sử dụng để tạo ra các sản phẩm khác nhau, như: • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

**类型：**Học hỏi
**语言：**Python(stdlib,带 kill switch của mô phỏng chi phí cho đồ chơi)
**先修：**Giai đoạn 17 · 13 ((Vì nhìn thấy),Giai đoạn 17 · 14 ((Caching)
**时间：**约60分钟

## Học mục tiêu

- 解释 tại sao FinOps truyền thống (tags + tiers) trong LLM 支出上会失效,并说出三个新的归因维度──
- 枚举四个代币层 ((quan_quan__工具_memory_response),并说明 tại sao việc thanh toán một thùng sẽ ẩn chi phí―
- 为 đa thuê nhân 产品设计执法梯 (nước: 价格: 费用 cap: 费用 cap: 杀开开) ⋅
- 选择单位指标(chi phí cho mỗi truy vấn / đồ tạo được giải quyết), thay vì $/M Token。

## 问题

Tài khoản của anh chỉ ra 40.000 đô la.
- Người thuê nhà nào đã bỏ tiền này?
- nhiện tính sản phẩm  thúc đẩy chi tiêu này
- Có người dùng cá nhân nào đó đang sử dụng không?
- tội lỗi là phát bốc hơi, gọi công cụ, hoặc tăng cường bộ nhớ.

Tag-and-aggregate của bên cung cấp đối với tài nguyên đám mây(EC2、S3) có hiệu lực, vì thẻ sẽ lây lan đến các mục dòng。LLM API gọi sẽ không tự động mang tag, bạn phải ở trang gọi 打上用户/task/tenant,并一路传递──事后归因总会漏掉边缘案例──

## 概念

### 3 tính năng

**Per-user**(`user_id`): người tạo ra nhiều chi phí;. thúc đẩy giá ghế; mở rộng cuộc trò chuyện,并识别 người sử dụng điện;.

**Per-task**(`task_id`+ `route`): bề mặt sản phẩm  tạo ra bao nhiêu chi phí  thúc đẩy ưu tiên tính năng, cũng như quyết định liệu có giết chết tính năng đắt tiền 

**Per-tenant**(`tenant_id`): khách hàng nào là lợi nhuận.

Từ ngày đầu tiên, tôi đã ở trong địa điểm gọi 埋点 these three dimensions.

### 4 tầng mã

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40%（agent workloads） |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

Đặt tất cả bốn tầng vào một thùng sẽ làm cho tối ưu hóa mất đi.

### Đường thang thực thi

1. **Rate limit**按租客 设置──预期峰值的2-3x──返回带 `Retry-After`Người thuê nhà sẽ bị cản trở; sẽ không có bất ngờ.

2. **Daily spend cap**按租客 设置──合同上限的1.5-3x──触发:收紧率限制 + cảnh báo khách hàng thành công──

3. **Kill switch**基于相对于租户基线的支出 z-score > 4──Auto-pause租户;页面在调用;升级给 ops + CS──

### 归因模式

- **Tag-and-aggregate**:打 metadata header;稍后聚合──简单;粗略──
- **Telemetry joiner**Thông qua thẻ nhận dạng dấu vết Đặt dấu vết 连接到账单――准确性最高――成熟团队会这样做――
- **Sampling + extrapolation**:chọn mẫu 5-10%, tái đợt trả lại.
- **Model-based allocation**: dùng regression 推断 cost driver。 áp dụng cho dữ liệu cũ không có thẻ。
- **Event-sourced**Các sự kiện trong dòng Kafka / Kinesis:
- **Real-time streaming**Đăng ký: 亚秒级更新.

### Chi phí cho mỗi X là chỉ số đơn vị

$/M Token là nhà cung cấp 语言──产品指标是:

- Mỗi chi phí đã được giải quyết hỗ trợ công trình.
- Chi phí của mỗi bài viết
- Chi phí của mỗi nhiệm vụ của một đại lý thành công.
- Mỗi người dùng sẽ nói về chi phí.

Để kết quả của sản phẩm kết quả.

### 成本归因 结构

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

Mỗi lần gọi đều phát ra, lưu trữ vào hồ dữ liệu, theo chiều kích tập hợp, và xếp hàng khả năng quan sát của giai đoạn 17 · 13 là điểm rơi của nó.

### 复合节省

Stack: cache + batch + route + gateway──四个都用上时:
- Cache L2(Phase 17 · 14):Input 约便宜 10x。
- Chuyện 17 · 15: 50% giảm giá
- Phương pháp chuyển tiếp đến mô hình便宜 (Phase 17 · 16): chi phí giảm 60%).
- Hiệu quả Gateway (Phase 17 · 19): Redundancy + Retry 

Tình huống xếp chồng tốt nhất: khoảng 5-10% của đường cơ bản ngây thơ. Hầu hết các đội đã kích hoạt 2-3 đòn bẩy; rất ít khi xếp bốn đống hoàn toàn lên.

### Bạn nên nhớ số

- 归因维度:per user,per task,per tenant
- 4 个 token 层: ngay lập tức, công cụ, bộ nhớ, phản ứng.
- Động thái tắt: chi tiêu điểm z > 4 ⋅
- 单位指标:cost per solved query, thay vì $/M Token。
- Các tối ưu hóa xếp chồng: có thể đạt được khoảng 5-10% của đường cơ sở.


```figure
i4-spend-ladder
```

## Sử dụng nó

`code/main.py`模拟一个多租户LLM服务,带三层执法梯子――注入一个虐待租户,并演示杀开关 触发――

## 交付 nó

本课会生成 `outputs/skill-finops-plan.md`△ cho định sản phẩm và quy mô, quy trình quy định thiết kế và thang thực thi.

## 练习

1. 运行 `code/main.py`✿ Đổi tắt giết trong cái gì điểm z 触发?
2.  thiết kế một bảng điều khiển chi phí cho mỗi người thuê. Bạn sẽ xây dựng 5 hình ảnh nào trước?
3. Bạn thuê lớn nhất là đơn vị kinh tế tiêu cực.
4. 为 hỗ trợ sản phẩm  tính chi phí cho mỗi vé được giải quyết:3M Token/ticket, khoảng 800 vé/ngày, GPT-5 tỷ lệ lưu trữ:
5. 论证 Tagging retroactive 是否可能有效──何时可以接受?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | “user-level cost” | 每次 call 都打上 `user_id` |
| Per-task attribution | “feature cost” | `task_id` + `route` 识别 product surface |
| Per-tenant attribution | “customer cost” | `tenant_id`；驱动单位经济性 |
| Four token layers | “cost layers” | prompt + tool + memory + response |
| Rate limit | “429 guard” | 在 gateway 强制执行的 per-tenant ceiling |
| Daily spend cap | “daily ceiling” | Tenant-scoped budget，带 alert |
| Kill switch | “auto-pause” | Spend z-score > 4 触发 auto-suspension |
| Cost per resolved | “product unit metric” | 成本绑定到产品结果，而不是 Token |
| Telemetry joiner | “trace-to-billing” | 准确性最高的归因模式 |
| Stacked optimization | “cache+batch+route+gateway” | 复合节省到约 5-10% baseline |

## 延伸阅读

- [FinOps Foundation — AI FinOps Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Azure OpenAI 中的 Managed LLMs](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
