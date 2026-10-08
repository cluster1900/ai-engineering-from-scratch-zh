# AI SRE  Multi-Agent 事件响应、Runbooks、预测性检测

> AI SRE thông qua RAG sử dụng dữ liệu cơ sở hạ tầng dựa trên các chương trình quản lý AI và Azure SRE sẽ cung cấp các chương trình quản lý như một sản phẩm quản lý. NewBird Hawkeye đang phát triển: sử dụng đánh giá đối lập. Hai mô hình phân tích cùng một sự cố; phù hợp = không phù hợp = không chắc chắn; hoạt động của nhóm sẽ được phân tích sau khi thay đổi.

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## Học mục tiêu
- 画出多代理 AI SRE 架构图: giám sát viên + đại lý chuyên nghiệp (日志、指标、runbooks) + cổng chấp thuận con người。
- 解释 tại sao phạm vi tự động khắc phục rất hạn chế (không phải là dịch vụ xây dựng lại)
- Nói出 đối kháng đánh giá 模式(NewBird Hawkeye):
- 引用 MIT 89% sớm phát hiện kết quả, cũng như hạn chế hoạt động: không có kích hoạt của dự đoán chỉ là bảng điều khiển.

## 问题
Một kỹ sư đang gọi trong buổi sáng 3 giờ nhận được thông báo:  tỷ lệ lỗi trong thanh toán 很高──他们检查 Datadog、Loki、三 runbook、部署 log──30 phút sau, họ nhận ra nguyên nhân gốc là KV cache spike 导致 vLLM OOM── họ khởi động lại pod; lỗi biến mất──

Đến năm 2026, các cuộc điều tra như thế này có thể tự động hóa. Theo dịch vụ tập hợp nhật ký.

完全自主修复是另一个问题──Restart pod:安全──Scale GPU pool:如果政策 允许则安全──Re-architect the service:绝对不行──关键原则是划清这条狭窄边界──

## 概念
### Kiến trúc đa đại lý

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

Giám sát viên sẽ phân chia sự cố thành các câu hỏi phụ. Các đại lý chuyên nghiệp có quyền truy cập vào công cụ.

### Khu vực tự trị

**Safe (narrow)**:restart pod、revert cụ thể triển khai、在预先批准的边界内规模池、启用预先批准的功能旗──

**Not safe (broad)**:更改服务拓学,修改资源限制, triển khai mã mới,更改 IAM,修改数据库.

Bất cứ ai cũng đã bán nó và quên nó  Mọi người đều đang cam kết quá mức  Với AI SRE đã trưởng thành, sự an toàn sẽ mở rộng, nhưng biên giới là thực sự tồn tại 

### đối kháng đánh giá (NewBird Hawkeye)

Hai mô hình phân tích độc lập cùng một sự kiện. Nếu chúng đạt được sự đồng thuận với nguyên nhân gốc rễ, độ tin cậy cao hơn. Nếu chúng không đồng thuận, thì với hai giả thuyết có thể nhìn thấy leo thang lên con người.

### Khoá sử dụng

团队人员流动是传统SRE的隐形杀手 部落知识 会流失──AI SRE sẽ lưu trữ sổ chạy + hậu tử vong 存入向量DB;agents 会在每新事件中检索──当新工程师加入时,AI 拥有完整历史──

### Dự đoán trước sự cố

MIT 2025 nghiên cứu: trên bộ thử nghiệm, dựa trên lịch sử日志、GPU 温度、API 错误模式训练的LLM, trong 10-15 phút dự đoán xảy ra trước khi bị gián đoạn đã đạt 89% 

现实检查:没有动作的预测只是仪表板――操作问题是:当我们预测到时,要做什么?预防性排水?

### Sản phẩm vào năm 2026

- **Datadog Bits AI** Datadog 内部的托管 SRE copilot──
- **Azure SRE Agent** Người gốc Azure
- **NeuBird Hawkeye** đánh giá đối kháng + trí nhớ hoạt động。
- **PagerDuty AIOps** phân loại + giảm trùng
- **Incident.io Autopilot** chỉ huy vụ việc + phối hợp

### Các sổ chạy như mã

Các runbook từ Confluence 页面 phát triển cho带有结构化章节 (symptom,hypothesis,verify,act)                                                                                                                                                                                                                                              

### Những con số mà bạn nên nhớ

- MIT sớm phát hiện: 89% của các sự cố,10-15 phút thời gian dẫn.
- Các nhân viên đa phân loại: giám sát viên +(日志、指标、runbooks) + con người。
- Set tự khắc phục an toàn: khởi động lại pod  tái triển khai  ở quy mô trong giới hạn 
- Đánh giá đối lập:两个模型独立;协议 = sự tin tưởng.


```figure
i4-incident-agents
```

## Sử dụng nó
`code/main.py`模拟多代理 triage:log agent 找到错误,metric agent 找到 CPU spike,runbook agent 匹配到已知问题――Supervisor đối với giả thuyết 排序――

## 交付 nó
本课会生成 `outputs/skill-ai-sre-plan.md` Dựa trên hiện tại trên cuộc gọi ∞ khối lượng sự cố ∞ độ trưởng thành của nhóm, thiết kế một AI SRE triển khai ∞

## 练习
1. 运行 `code/main.py`Nếu log và các đại lý métric không phù hợp thì làm thế nào?
2. Vì dịch vụ của bạn được định nghĩa là 3 hành động tự khắc phục an toàn.
3. 编写一个结构化 runbook template: section,required fields,verification commands.
4. Hình ảnh dự đoán 提前 12 分钟触发. Chính sách của bạn là gì?
5. 论证 Một nhóm 3 người nên sử dụng AI SRE vào năm 2026, hay chờ đợi.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| AI SRE | “agent for on-call” | LLM-backed incident investigation + coordination |
| Supervisor agent | “the orchestrator” | 将 incidents 拆分为 sub-queries 的顶层 agent |
| Specialized agent | “domain agent” | 拥有 tool access（日志、指标、runbooks）的 sub-agent |
| Auto-remediation | “AI fixes it” | 狭窄的预先批准 action；不是宽泛的 re-architecture |
| Operational memory | “vector runbooks” | vector DB 中用于 RAG 的 post-mortems + runbooks |
| Adversarial eval | “two-model check” | 独立分析；agreement = confidence |
| NeuBird Hawkeye | “the adversarial one” | 具备 adversarial-eval + memory pattern 的产品 |
| Bits AI | “Datadog's SRE agent” | Datadog 托管的 AI SRE |
| Pre-incident prediction | “early detection” | outage prediction 的 10-15 分钟 lead time |

## 延伸阅读
- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
