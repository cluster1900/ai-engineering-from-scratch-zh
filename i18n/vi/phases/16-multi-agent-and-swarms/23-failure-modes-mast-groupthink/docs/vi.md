# 失效模式  MAST、Groupthink、Monoculture、Cascading Errors

> Thuế phân tích tham khảo năm 2026 là:**MAST**(Cemri et al., NeurIPS 2025, arXiv:2503.13657), nó xuất phát từ 7 个 state-of-the-art open-source MAS 的 1642 条执行 trace,显示出 **41–86.7% 的失败率**❖ ba loại:**Specification Problems**(41.77%) 角色歧义、任务定义不清;**Coordination Failures**(36,94%) 通信中断、 trạng thái không đồng bộ;**Verification Gaps**(21.30%) 缺少验证,缺少质量检查,**Groupthink**家族(arXiv:2508.05687) bổ sung:sự sụp đổ của nền tảng đơn vị: giống nhau mô hình cơ bản → 相关失败)  thiên vị phù hợp: đại lý 相互强化彼此的错误)  lý thuyết suy nghĩ kém, động cơ hỗn hợp, sự thất bại về độ tin cậy: lớp kết hợp ví dụ: cơn bão rút tiền, trong đó một lần thất bại thanh toán 触发 đặt hàng lặp lại,进而触发库存 lặp lại, cuối cùng áp suất: dịch vụ hàng tồn kho trong vài giây  cần cắt mạch)  Bị độc trí nhớ: ảo giác của một đại lý  xâm nhập vào bộ nhớ chia sẻ, đại lý sẽ chuẩn bị tình huống xảy ra; thực tế dần dần giảm, làm cho căn nguyên 诊断 trở nên đau đớn.**STRATUS**(NeurIPS 2025) báo cáo cho biết, thông qua các đại lý phát hiện / chẩn đoán / xác nhận chuyên dụng, giảm thành công 提升 1.5x。本课把失败模式 视为一等工程目标。

**Type:** 学习
**Languages:** Python (stdlib)
**前置要求:**Giai đoạn 16 · 13 (Tưởng thức chia sẻ), Giai đoạn 16 · 14 (Thiến thuận và BFT), Giai đoạn 16 · 15 (Tópologi bỏ phiếu và tranh luận)
**Time:** ~75 分钟

## 问题

Các hệ thống đa đại lý trong nhiệm vụ thực sự tỷ lệ thất bại là 41-86,7% (Cemri et al. 2025) trên 7 MAS nguồn mở trên测得) ⋅This is not by just adding more agents就能调试的问题──These fail have structural reasons──MAST taxonomy ⋅ đã đưa ra các loại──本课将 từng loại được phân tích thành một mô hình phát hiện, chẩn đoán và giảm thiểu cụ thể, để các số này không còn hiển thị tùy ý nữa──

Thực tế sản xuất năm 2026 là việc đưa các chế độ thất bại khi thiết kế nhập vào.

## 概念

### Các loại MAST

**Specification Problems（41.77% 的失败）。**Nhiệm vụ của đại lý được định nghĩa không đủ nghiêm ngặt. Ví dụ:

- Vai trò không rõ ràng: hai đại lý đều tự coi mình là nhà phê bình.
- Nhiệm vụ được xác định dưới: người dùng muốn một góc độ cụ thể, nhưng chỉ nói  tóm tắt điều này──
- Các tiêu chí thành công ngầm: đại lý không thể đánh giá mình thành công hay không.

Giảm thiểu:
- 编写 các hợp đồng vai trò rõ ràng.
- Mỗi nhiệm vụ có các bài kiểm tra chấp nhận.
- Kiểm tra kỹ thuật trước chuyến bay: Một đặc vụ độc lập trong việc gửi trước nhiệm vụ kiểm tra được xác định.

**Coordination Failures（36.94%）。**通信或状态中断──

Ví dụ:
- Hai đại lý không đồng bộ để cập nhật trạng thái chung.
- Thông điệp giữa các đại lý 丢失(lỗi thất bại 时out)
- State drift:agent A 认为任务已完成;agent B 仍在执行──

Giảm thiểu:
- 带版本的共享状态, sử dụng đồng thời lạc quan.
- Để các thông điệp quan trọng thực hiện sự thừa nhận rõ ràng
- 定期州同步检查站;尽早检测漂移──

**Verification Gaps（21.30%）。**Không có kiểm tra độc lập đối với xuất khẩu.

Ví dụ:
- Một đại lý 声称成功;无人验证──
- Một loạt các đại lý đều tin vào một số xuất khẩu.
- Đối với hành vi kết hợp mới nổi  thiếu bảo hiểm kiểm tra.

Giảm thiểu:
- 独立验证代理 (đọc 13) ・ Chỉ đọc, truy cập nguồn độc lập。
- 显式交付合同:A 的输出必须通过检查 C,B 才能开始──
- 为 hậu hoc phân tích ghi lại kết quả ghi lại.

### Gia đình tư duy nhóm (arXiv:2508.05687)

Khi các đại lý cùng chất hóa hoặc bắt chước nhau, sẽ xuất hiện năm loại thất bại liên quan:

**Monoculture collapse。**相同基模型或培训数据 → 相关错误──当三代理 共享一个LLM时,它们也共享它的幻觉──

**Conformity bias。**Các đại lý hướng tới những người đồng nghiệp mạnh mẽ nhất hoặc tự tin nhất, ngay cả khi nó là sai lầm.

**Deficient ToM。**Các đại lý không thể mô phỏng niềm tin của nhau; phối hợp 崩(Dạy học 18)。

**Mixed-motive dynamics。**具有部分一致激励的代理人 漂移到折中中态,结果谁都不满足──

**Cascading reliability failures。**Một mẫu lỗi của một bộ phận 触发 phụ thuộc các mẫu lỗi trong bộ phận.

### Ví dụ:  cơn bão tái thử

Một mô hình tai nạn cổ điển năm 2026:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

修复方式 là một cách quen thuộc:**circuit breakers** Tỷ lệ lỗi 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时

Các bộ cắt mạch là một trong số ít các biện pháp giảm thiểu thất bại đa đại lý có thể được sử dụng trực tiếp từ các hệ thống phân tán và không cần sửa đổi.

### ng độc trí nhớ

Từ Bài học 13: ảo giác của một đại lý  trở thành thực tế ký ức chung; các đại lý  dựa trên thực tế bị ô nhiễm được đưa ra xét đoán.

症状 là tỷ lệ xác thực dần giảm. Bạn sẽ không bị tai nạn. Bạn sẽ gặp khó khăn vì nguyên nhân gốc rễ của sự chậm trễ.

Giảm thiểu: chỉ cần thêm log, nguồn gốc, xác minh không thể viết. Bài học 13 đã được bao gồm.

### STRATUS  Các chất đặc biệt cho việc phát hiện lỗi

STRATUS(NeurIPS 2025) báo cáo,当你部署以下角色时,缓解成功 提升 1.5x:

- **Detection agent。**监视 triệu chứng mô hình(Hà bất đồng cao, tăng độ giảm, trôi dạt độ chính xác)
- **Diagnosis agent。**给定症状, từ phân loại MAST 推断可能根原因──
- **Validation agent。**Trong ứng dụng giảm  kiểm tra các triệu chứng là không được loại bỏ.

Đây là ứng dụng cho các hệ thống phản ứng tình huống kiểu SRE của hệ thống đại lý.

### Việc kiểm toán trong chế độ thất bại

Thực hành tốt nhất của năm 2026 là mỗi năm (hoặc mỗi lần phát hành lớn) thực hiện một lần kiểm toán chế độ thất bại:

1. **Trace sample。**收集约1000 条 thực sự thực hiện dấu vết.
2. **Categorize。**Đối với mỗi dấu vết của thất bại,映射到 MAST + nhóm suy nghĩ các loại.
3. **Compute failure-by-category rate。**Những loại nào là chủ đạo hệ thống của bạn?
4. **Rank mitigations。**Phong cách nào có thể loại bỏ nhiều thất bại nhất?
5. **Pick 2-3 mitigations。**实现;下季度重新审计──

纪律比具体选择更重要―― không kiểm toán, thất bại 会混入噪音,永远不到系统性处理――

### Khi hệ thống thất bại lặng lẽ

Loại thất bại nguy hiểm nhất là thất bại chính xác im lặng. Một hệ thống thất bại lớn ((crash]], ngoại lệ, cảnh báo) có thể được giám sát. Một hệ thống tạo ra kết quả có thể chấp nhận được nhưng sai lầm không thể vượt qua nhật ký ngoại lệ.

投资于:
- Phân tích con người dựa trên mẫu thử nghiệm.
- Các thử nghiệm hồi quy của bộ dữ liệu vàng.
- Chuyến kiểm tra chéo giữa các đại lý đối với các hàng xuất khẩu quan trọng.

### Thất bại so với thất bại chậm

Một số thất bại là ngay lập tức; một số là chậm. Một số là chậm.

2026 年的工程动作:Proxy thất bại chậm của công cụ, để bạn có thể chuyển đổi 转变可见错误之前捕获它──Tỷ lệ thỏa thuận, tỷ lệ rút tiền, phân phối chiều dài sản xuất, cũng như khoảng cách chỉnh sửa giữa các phiên bản đại lý liên tục đều là các proxy hữu ích──


```figure
a5-retry-cascade
```

##  xây dựng nó

`code/main.py`实现:

- `FailureTaxonomy` 将模拟事件 分类为 MAST + Groupthink categories──
- `CircuitBreaker` 经典模式;当 lỗi tỷ lệ 超过门 时打开。
- `RetryStormSimulator`  hiển thị thất bại hàng loạt;切换断路机 bật / tắt。
- `DetectionAgent` bộ kết hợp triệu chứng kiểu STRATUS với kịch bản.

运行:

```
python3 code/main.py
```

预期输出:
- 没有断路的重试暴风雨: 库存错误 爆炸式增长(模拟)
- Có bộ cắt mạch: ở ngưỡng 处封顶; cung cấp phản ứng chế độ suy giảm.
- Cơ quan phát hiện 标记该模式并命名 MAST loại。

## Sử dụng nó

`outputs/skill-mast-auditor.md`Đối với hệ thống đa đại lý 运行 MAST kiểu kiểm toán chế độ thất bại.

##  phát hành nó

生产中的 failed mode kỷ luật:

- **每季度 MAST audit。**Không phải là mỗi năm. Các danh mục sẽ thay đổi theo hệ thống.
- **到处部署 circuit breakers。**Đối với bất kỳ dịch vụ phụ thuộc nào, mỗi cuộc gọi ra ngoài                                                                                                                                                                                                                                                        
- **Golden datasets。**Kiểu, chất lượng cao, kiểm toán nhân tạo, mỗi tuần thực hiện kiểm tra hồi quy.
- **STRATUS trio。**Chẩn đoán + Chẩn đoán + Các tác nhân xác nhận  giám sát sản xuất.
- **Failure budget。**Để theo loại 统计  tỷ lệ thất bại 设定显式 SLO──超出预算 会触发停运对话──

## 练习

1. 运行 `code/main.py`❖ xác nhận máy cắt mạch  hạn chế cơn bão thử lại ❖ điều chỉnh ngưỡng thất bại 并 quan sát sự thỏa hiệp ❖
2. 实现一个 **slow-failure proxy**3: tỷ lệ đồng thuận của các đại lý đồng hành. Khi nó giảm mạnh, kích hoạt báo động.
3. 阅读 Cemri et al.(arXiv:2503.13657)。 chọn một trong 7 hệ thống MAS của họ,并映射其前3类失败──它们与 MAST的预测相比如何?
4. 阅读 Groupthink paper(arXiv:2508.05687)。识别五种模式 中哪一种在生产中最难检测──提出一个代理测量──
5. Để bạn hiểu về một hệ thống đa tác nhân cụ thể  thiết kế một bộ ba phát hiện-hít chẩn đoán-tính xác kiểu STRATUS  Phát hiện  giám sát những triệu chứng nào? Chẩn đoán  đề xuất các biện pháp giảm thiểu nào?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | “2026 taxonomy” | Cemri 2025；3 个根类别 + 14 个 failure sub-types。 |
| Specification Problem | “Role ambiguity” | 任务或角色定义不足；agents 不知道该做什么。 |
| Coordination Failure | “State drift” | agents 之间的通信或同步中断。 |
| Verification Gap | “No one checked” | 输出在没有独立验证的情况下被接受。 |
| Groupthink family | “Homogeneity failures” | Monoculture、conformity、deficient ToM、mixed-motive、cascading。 |
| Monoculture collapse | “Same model, same hallucinations” | 来自共享 base model 或 training data 的相关错误。 |
| Retry storm | “Cascading error amplification” | 一次 failure 触发 retries，进而放大下游 load。 |
| Circuit breaker | “Fail fast on error rate” | 当 error rate 超过 threshold 时打开；用 default 短路。 |
| STRATUS | “Incident response trio” | Detection + diagnosis + validation agents。1.5x mitigation success。 |
| Memory poisoning | “Hallucinations propagate” | Shared-memory fact 被污染；下游 agents 基于 poison 推理。 |

## 延伸阅读
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Định dạng phân loại MAST, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) đơn sản xuất, phù hợp, và phân loại năm gia đình
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) Việc nhập vào các thủ tục NeurIPS 2025 (khám phá + chẩn đoán + xác nhận)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) 经典 máy cắt mạch 参考
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 生产 ghi chú về chế độ thất bại
