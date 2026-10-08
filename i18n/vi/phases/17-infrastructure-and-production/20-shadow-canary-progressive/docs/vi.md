# Tráffic Shadow của LLM, Canary Rollout và triển khai tiến bộ

> Các triển khai LLM kết hợp phần khó khăn nhất trong triển khai phần mềm: không có chế độ thử nghiệm đơn vị, không có chế độ thất bại phân tán tín hiệu 滞后.

**Type:** 学习
**语言：**Python(stdlib, đồ chơi canary tiến bộ mô phỏng)
**Prerequisites:** Phase 17 · 13（Observability），Phase 17 · 21（A/B Testing）
**Time:** ~60 分钟

## Học mục tiêu

- 区分影音模式 (零影响比较) 卡尼尔 (canary)                                                                                                                                                                                                                                                     
- 列举五个 LLM cụ thể metrics canary ((trễ, chi phí/ yêu cầu, lỗi/ từ chối, phân phối chiều dài sản xuất, phản hồi của người dùng) 
- 解释 tại sao LLM không quyết định chủ nghĩa (tối đa 15%), sẽ thay đổi triển khai trong stable 的含义──
- 设计一个耗时数秒的政策转换) thay vì vài小时的重新部署)

## 问题

Bạn đã phát hành một mô hình mới. Các đánh giá ngoại tuyến cho thấy độ chính xác tăng 3%. Bạn đang trong sản xuất.

Điều này có thể được tránh khỏi. Chế độ bóng sẽ bắt đầu tăng giá 40% trước khi bất kỳ người dùng nào thấy.

## 概念

### Chế độ bóng

Ứng viên nhận và sản xuất tương tự yêu cầu; kết quả sẽ được ghi lại, nhưng sẽ không được trả lại cho người dùng.

- Nội dung sản xuất
- Số lượng token (đơn vị chi phí)
- Trễ.
- Từ chối và sai lầm.

能捕捉:cost blow-ups、length regressions、明显 từ chối thay đổi、hard errors──不能捕捉:用户会感知到的质量 delta──影影是烟雾测试,不是质量测试──

### Việc triển khai Canary

带门的渐进交通转移──典型进度:1% → 10% → 25% → 50% → 75% → 100%──每一步基于 5 个指标 设置门:

1. **Latency percentiles** P50、P95、P99。违规:canary 的 P99 > baseline 的 1.5x。
2. **Cost per request** 混合 $──违规:高于基线 >20%──
3. **Error / refusal rate** 5xx 加明显 từ chối 违规:baseline 的 2x──
4. **Output length distribution** trung bình + P99。违规: chuyển đổi phân phối。
5. **User-feedback rate** thumbs-down / hồ sơ vé.

### Không quyết định là sự khác biệt mới

Các đầu vào tương tự sẽ tạo ra không hoàn toàn tương tự các đầu ra:

- GPU FP không liên kết (không liên kết)
- Sự khác biệt kích thước lô ((( cùng một yêu cầu trong lô 128 với lô 16 中不同)
- Tiêu chuẩn lấy mẫu: nhiệt độ > 0)

实测: Trong cùng các thiết lập đánh giá 上, run-to-run độ chính xác biến động tối đa lên đến 15%。 ổn định Trong triển khai có nghĩa là métrics 处于预期变化内, thay vì với đường cơ bản 完全相同──把门 设置在噪音 floor 之上──

### Chi phí là biến số

Một mô hình tốt 20% Mỗi lần điều chỉnh có thể tốn kém 3 lần. Chi phí/ yêu cầu là một trong 5 cổng.

### Rollback là vũ khí

- Phạm cờ chính sách (Figure flag system): trong config 中切换百分比;耗时数秒──
- Mô hình pinning(registry digest): mô hình pin 不会 tự động nâng cấp。
- Rollback = đảo ngược cờ + đặt bản ghi đính vào trước đó.

Nếu hàng của bạn cần phải tái triển khai để có thể quay lại, hãy sửa chữa nó trước khi được triển khai.

### Thiết bị công cụ

**Argo Rollouts**- **Flagger** Kubernetes bộ điều khiển giao hàng tiến bộ.

**Istio weighted routing** dịch vụ lưới 级流量拆分──

**KServe / Seldon Core** 内置 canary 的模型服务──

**Feature flags** Thỏa lực  Đen Đen  Phong thâm  Thả ra  Phong trào cấp chính sách, không cần phải tái triển khai 

### Tỷ lệ thời gian

Canary Gates Mỗi 5-15 phút kiểm tra một lần, cụ thể phụ thuộc vào khối lượng lưu lượng truy cập ▌1% lưu lượng truy cập ▌ và 10 req/min ▌, mỗi cửa sổ có 50-150 điểm dữ liệu  đối với độ trễ ▌ đủ, nhưng đối với phản hồi của người dùng từ tiếng ồn lớn hơn ▌10% sẽ mang lại khoảng 10x nhiều dữ liệu ▌Thành công ▌ nên tạm dừng đủ lâu trong mỗi bước, để tích lũy đủ mẫu ▌

### A/B 步骤 là lựa chọn

Nếu mô hình mới 明显不同( khác nhau hành vi, khác nhau đường cong chi phí, khác nhau âm thanh), trong canary 通過后以 50% thực hiện thử nghiệm A / B. Nếu nó chỉ là một phiên bản cải tiến, trong canary cổng 通過后直接到 100%.

### Bạn nên nhớ số

- Tăng tiến của cá thể: 1% → 10% → 25% → 50% → 75% → 100%。
- Tối cao không xác định: sự khác biệt chạy đến chạy trên cùng đầu vào tối đa 15%
- 5 métrics: latency, cost, error/refusal, output length, user feedback
- Cổng chi phí:高于基线 >20% 即为违规――
- Rollback: vài giây, chứ không phải vài giờ.


```figure
i4-canary-ramp
```

## Sử dụng nó

`code/main.py`模拟带有注入回归的加拿大推广――报告推广 在哪个阶段 停止,以及哪个门被触发――

## 交付 nó

本课生成 `outputs/skill-rollout-runbook.md` Định hình ứng cử viên  cơ sở và dung nạp rủi ro, thiết kế bóng  quy hoạch 100% 

## 练习

1. 运行 `code/main.py` Đánh vào 25% giảm chi phí 
2. Mô hình mới của bạn trong offline có mức độ chính xác tăng 3% nhưng chi phí/ yêu cầu là +18%── có được phát hành không?
3. Thiết kế một thời gian quay trở lại cuối cùng ít hơn 60 giây.
4. Không quyết định trong đánh giá của bạn 上显示 ±7%── đặt cổng canary, tránh báo động sai── bạn sử dụng nhân số nào?
5. Chế độ bóng  Trước khi bắt được 40% giá cao hơn.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Shadow mode | “duplicate to new” | 用于 logging 的零影响 send-to-candidate |
| Canary | “progressive traffic” | 带 gates、暴露给用户的渐进式 rollout |
| Gates | “rollout checks” | 阻止 progression 的 metric thresholds |
| Non-determinism | “LLM variance” | 不可消除的 run-to-run differences |
| Policy flag | “flag flip rollback” | Config-level rollback，数秒而不是数小时 |
| Model pin | “registry digest” | 指向 model version 的不可变 reference |
| Argo Rollouts | “K8s progressive” | Kubernetes-native canary/rollback controller |
| KServe | “inference K8s” | 带 canary primitives 的 model serving |
| Istio weighted | “mesh split” | Service-mesh traffic splitter |

## 延伸阅读

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
