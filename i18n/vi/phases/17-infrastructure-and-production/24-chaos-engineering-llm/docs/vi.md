# LLM sản xuất của Kỹ thuật hỗn loạn

> Đến năm 2026, hướng tới LLM của Chaos Engineering đã trở thành một thực tế độc lập. Trong sản xuất, vận hành thực nghiệm trước tiên đặt điều kiện: đã được xác định SLI/SLO, track+metric+log observability, tự động rollback, runbooks, trên cuộc gọi.

**类型：**Học tập
**语言：**Python, đồ chơi hỗn loạn thí nghiệm chạy)
**前置条件：**Giai đoạn 17 · 23(SRE cho AI),Giai đoạn 17 · 13(Vì nhìn thấy)
**时间：**约60分钟

## Học mục tiêu

- Nói ra 5 điều kiện trước của Kỹ thuật hỗn loạn ((SLI/SLO、 khả năng quan sát、 quay lại、 sổ chạy、 trên cuộc gọi), và giải thích tại sao nhảy qua bất kỳ một trong số chúng đều phá hủy thực hành này。
-  vẽ ra bốn tầng (chính quyền, mục tiêu, an toàn, khả năng quan sát) và vào vòng phản hồi của SLO.
- 枚举五个 LLM- cụ thể thí nghiệm: ]] bộ nhớ quá tải, mạng thất bại, nhà cung cấp bị gián đoạn, sao chép sai lầm, bão quét KV)
- 根据堆 选择工具  Harness、LitmusChaos、Chaos Mesh。

## 问题

传统堆中的混沌测试已很成熟──LLM堆增加了新的失败模式──一个带有毒字符的4K-token提示 会让代币器卡住 12秒──上游提供商 返回 429;你的门户网 进行重试;你的服务 因重试加剧的同步而OOM──爆载下的KV cache驱逐风暴会导致重填,进而耗尽计算──

Những điều này sẽ không xuất hiện trong các thử nghiệm đơn vị.

## 概念

### Điều kiện trước

Nếu không có nội dung sau, đừng có hỗn loạn trong sản xuất:

1. **SLI/SLO** 已定义服务水平指标和目标──
2. **Observability** dấu vết, métrics, log,并连接到仪表板──
3. **Automated rollback** Giai đoạn 17 · 20 Phục hồi cờ chính sách
4. **Runbooks** 结构化,Phase 17 · 23。
5. **On-call** Có người chịu trách nhiệm đáp ứng.

Không có bất cứ một, tất cả có nghĩa là hỗn loạn sẽ trở thành sự kiện thực.

### Bốn máy bay + phản hồi

**Control plane** lập trình thí nghiệm ((Litmus workflow、Chaos Mesh schedule、Harness UI) 。

**Target plane** dịch vụ,pod,nốt, cân bằng tải, kho dữ liệu.

**Safety plane** tắt công tắc, cửa sổ ngăn chặn, giới hạn bán kính nổ, cửa ra ngân sách lỗi.

**Observability plane** 常规 metrics + trace-ID tương quan, được sử dụng để phân biệt các thất bại do hỗn loạn gây ra và các thất bại tự nhiên.

**Feedback loop** 发现结果反到 SLO điều chỉnh, cập nhật sổ hành trình, sửa mã.

### Đường sắt là yêu cầu bắt buộc

- **Burn-rate alert**Nếu số lỗi ngân sách hàng ngày  vượt quá dự kiến 2x, thì tạm dừng thí nghiệm.
- **Suppression windows**Trong thời gian thử nghiệm, trong bán kính nổ trong tĩnh lặng không phải cảnh báo thử nghiệm.
- **Trace-ID correlation**Tất cả các lỗi do thí nghiệm gây ra đều mang theo một thẻ, để gọi lại có thể được.

### 5 thí nghiệm đặc biệt về LLM

1. **Memory overload** 通过高并发发发发发发长文索,强制触发 KV cache dự phòng bão──观察: dịch vụ là优雅地 đổ tải, hay bị hỏng?

2. **Network failure** 切断 suy luận cổng thông tin và kết nối giữa nhà cung cấp 👇观察:fallback là không trong SLA 内生效?

3. **Provider outage simulation** OpenAI 100% 返回 429──观察:routing 是否失败到Anthropic?

4. **Malformed prompt** 注入会让代币器卡住的有效载荷 (ví dụ: Unicode sâu 嵌入式, mã UTF-8 khổng lồ) 观察: đơn yêu cầu liệu sẽ khóa chết một công nhân?

5. **KV eviction storm**  Thử ngân sách vLLM để buộc phải sơ tán.

### Tỷ lệ

- **每周**Trong giai đoạn vận hành các thí nghiệm nhỏ của loài cá voi, cũng có thể trong prod 5% 流量上运行.
- **每月** 针对特定场景 安排比赛日;跨团队参与;后死――
- **每季度** kiểm tra khả năng phục hồi giữa các nhóm; cập nhật bản đồ phụ thuộc

### Thiết bị công cụ

- **Harness Chaos Engineering**  công cụ thương mại; khuyến nghị thí nghiệm có nguồn gốc từ AI; giảm quy mô bán kính nổ; tích hợp công cụ MCP。
- **LitmusChaos** CNCF tốt nghiệp; dựa trên quy trình làm việc của Kubernetes。
- **Chaos Mesh** Cỗ cát CNCF;Curberetes-công dân CRD 风格。
- **Gremlin** 商业工具; hỗ trợ rộng rãi
- **AWS FIS**- **Azure Chaos Studio** dịch vụ đám mây quản lý

### Từ nhỏ bắt đầu

Tiếp theo, thực hiện thử nghiệm đầu tiên: trong stable flow: Kill a pod-kill a decode replica── observe redirect 和 recovery── nếu nó có thể hoạt động và trông an toàn, thì nó sẽ được nâng cấp lên hỗn loạn mạng──

Phiên nghiệm đặc biệt LLM đầu tiên: Tiêm vào một lần cung cấp 429, kéo dài 5 phút.

### Bạn nên nhớ số

- 4 tầng: kiểm soát, mục tiêu, an toàn, khả năng quan sát.
- Hỗng hỏng tỷ lệ: dự đoán ngân sách hàng ngày đốt cháy của 2x.
- Thời gian: tuần lễ canary, ngày chơi hàng tháng, kiểm toán hàng quý.
- 5 thí nghiệm LLM: bộ nhớ, mạng, nhà cung cấp, nhanh chóng sai sót, cơn bão KV.


```figure
i4-chaos-guard
```

## Sử dụng nó

`code/main.py`Sử dụng cửa máy bay an toàn 模拟三个 hỗn loạn thí nghiệm.

## 交付 nó

本课会生成 `outputs/skill-chaos-plan.md`△ được định xếp và trưởng thành, chọn 3 thí nghiệm và công cụ.

## 练习

1. 运行 `code/main.py` Thử nghiệm nào đã kích hoạt cổng tốc độ cháy, vì sao?
2. Để thiết kế một dịch vụ RAG dựa trên vLLM  thiết kế 5 thí nghiệm hỗn loạn  bao gồm các tiêu chí thành công 
3. Bạn đang báo động tốc độ đốt cháy của bạn 暂停 một thí nghiệm  Làm thế nào bạn biết nguyên nhân gốc rễ  là hỗn loạn hay là tự nhiên?
4. 论证 hỗn loạn  nên hoạt động trong sản xuất, hay chỉ hoạt động trong giai đoạn.
5. Nói ra ba loại hỗn loạn mạng chung không thể phục hồi được các chế độ thất bại cụ thể của LLM.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
