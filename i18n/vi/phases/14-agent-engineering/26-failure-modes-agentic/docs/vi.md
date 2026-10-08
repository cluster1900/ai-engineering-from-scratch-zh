# Các chế độ thất bại: Các đại lý tại sao sẽ thất bại

> MASFT (Berkeley, 2025) sẽ phân loại 14 loại chế độ thất bại của đại lý thành 3 loại.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**先修要求：**Giai đoạn 14 · 05 (Tự tinh chỉnh và CRITIC), Giai đoạn 14 · 24 (Sự quan sát)
**Time:** ~60 minutes

## Học mục tiêu
- Nói ra ba loại thất bại của MASFT, và nói ra ít nhất bốn mô hình cụ thể trong mỗi loại.
- 解释 tại sao sự thất bại của đại lý sẽ làm tăng các chế độ thất bại AI hiện có
- Mô tả 5 ngành công nghiệp tái hiện mô hình và phương pháp giảm thiểu:
- 实现 một stdlib detector, sử dụng các nhãn chế độ thất bại 标注 đại lý dấu vết。

## 问题
Các đại lý của nhóm phát hành trong 90% các dấu vết trên tất cả các công việc. Phần còn lại 10% thất bại không phải là tiếng ồn ngẫu nhiên, mà rơi vào một số ít các loại xuất hiện lặp lại. Một khi bạn có thể đặt tên cho chúng, bạn có thể giám sát và sửa chữa chúng.

## 概念
### MASFT (Berkeley, arXiv:2503.13657)

Các loại hình thất bại đa đại lý hệ thống phân loại. 14 loại các chế độ thất bại 聚类为 3 个类.

核心主张:những thất bại là những thiếu sót thiết kế cơ bản trong nhiều Agent 系统, thay vì có thể thông qua các mô hình cơ bản tốt hơn 修复 LLM 限制

### Microsoft Taxonomy của chế độ thất bại trong các hệ thống AI đại lý

- 现有AI失败 (việc phân biệt, ảo giác, rò rỉ dữ liệu) sẽ được mở rộng trong tình huống của các nhà máy.
- Những thất bại mới từ tự trị: hành động không mong muốn quy mô lớn, lạm dụng công cụ, trôi động nhiệm vụ.
- Báo trắng này là danh sách rủi ro của các sản phẩm đại lý.

### Characterizing Faults in Agentic AI (arXiv:2603.06847)

- Những thất bại từ sự dàn xếp, sự tiến hóa của trạng thái nội bộ và sự tương tác của môi trường.
- Không chỉ là mã xấu hoặc mô hình xấu xuất hiện.

### LLM Agent Hallucinations Survey (arXiv:2509.18970)

两种主要表现:

1. **Instruction-following Deviation** Đại lý không tuân theo hệ thống báo động.
2. **Long-range Contextual Misuse** Trưởng  quên hoặc sử dụng sai trong bối cảnh trong vòng đầu tiên 

Các lỗi tiềm năng: bỏ qua (漏掉步骤)  Phá thải (重复步骤)  Phá vỡ (Disorder)  步骤顺序错误) 

### 5 ngành công nghiệp tái hiện mô hình

Arize、Galileo、NimbleBrain 2024-2026 năm hiện trường phân tích thu nhận:

1. **Hallucinated actions.**Trưởng lý đã sử dụng một công cụ không tồn tại, hoặc đã tạo ra các lập luận.
2. **Scope creep.**Cơ quan sẽ mở rộng nhiệm vụ vượt ra ngoài phạm vi yêu cầu của người dùng (tạo thêm PR, gửi thêm email)
3. **Cascading errors.**Một lần bị ảo giác của SKU ảo ảnh sẽ kích hoạt bốn lần API gọi, biến thành nhiều hệ thống xảy ra.
4. **Context loss.**长周期任务忘记早期轮次的约束――
5. **Tool misuse.**Sử dụng các lập luận sai lầm 调用正确工具, hoặc trực tiếp调用错误工具──

Cascading là cái chết nhất. Các nhân viên không thể phân biệt được nhiệm vụ không thể hoàn thành, và thường xuyên trong 400 sai lầm, ảo giác xuất phát từ thông điệp thành công.

### Giảm thiểu: mỗi bước đều đặt cổng

Trong mỗi bước của chuỗi lý luận đặt cổng xác minh tự động, đối với môi trường kiểm tra tình trạng thực tế đặt nền tảng:. cụ thể bao gồm:

- Mỗi bước phân loại an toàn (Dạy học 21)
- Truy cập lập luận gọi công cụ (Trule 06):
- sẽ lấy lại nội dung với các sự kiện được biết 交叉检查(Lớp 05, CRITIC)
- 通过重新探测状态 来检测 thành công ảo giác(文件真的被创建了吗?)。

### giám sát thất bại  dễ dàng xuất错 nơi

- **Tagging only crashes.**Hầu hết các thất bại của đại lý sẽ tạo ra hiệu quả xuất hiện.
- **No baseline.**Khám phá lưu động  cần những gì tốt nhất; nếu không có nó, bạn sẽ không thể đánh giá được 
- **Over-alerting.**Mỗi thất bại đều tạo ra một trang.


```figure
failure-cascade
```

##  xây dựng nó
`code/main.py`实现 một stdlib failure-mode tagger:

- Một bộ dữ liệu dấu vết tổng hợp của một mô hình bao gồm 5 kiểu:
- Mỗi mô hình đối phó với các chức năng cảm biến (chương cụ gọi, đầu ra, lặp lại các hành động trên các mô hình ký hiệu)
- Một tagger, được sử dụng để đánh dấu mỗi dấu vết và phân phối chế độ báo cáo.

运行 nó:

```
python3 code/main.py
```

输出: mỗi条 dấu vết của nhãn + phân phối tổng thể, đây là một loại giá thấp của Phoenix về việc phân nhóm dấu vết của nội dung.

## Sử dụng nó
- **Phoenix**Sử dụng để sản xuất các nhóm lưu động môi trường (Dream Cluster) (Dân học 24)
- **Langfuse**用于 phiên bản lặp lại + ghi chú.
- **Custom**Sử dụng nền tảng quan sát không thể kiểm tra các chữ ký cụ thể về miền.

## 交付 nó
`outputs/skill-failure-detector.md`生成面向您所在域的故障模式探测器,并连接到追踪商店──

## 练习
1. 添加一个 成功幻觉探测器:
2. 标签 100 条 thực sự theo dõi của một sản phẩm mà bạn đã xây dựng.
3. Thực hiện một métrics các bán kính: cho sự thất bại của bước thứ nhất, nó ảnh hưởng đến bao nhiêu bước dưới?
4. 阅读 MASFT's 14 种故障模式选择──三种适用于产品模式──编写探测器──
5. Để một bộ phát hiện  kết nối công việc CI: Nếu >=5% các dấu vết được đánh dấu cho một số mô hình, thì để xây dựng  thất bại.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | “Multi-agent failure taxonomy” | Berkeley 14-mode categorization |
| Cascading error | “Ripple failure” | 一个早期错误会通过 N 个步骤传播 |
| Context loss | “Forgot the constraint” | 长周期轮次丢失早期轮次事实 |
| Tool misuse | “Wrong tool / wrong args” | 调用有效，但调用方式错误 |
| Success hallucination | “Faked completion” | Agent 在 400 上声称成功；state 未变化 |
| Scope creep | “Overreach” | Agent 做了超出要求的事 |
| Instruction-following deviation | “Disobedience” | 忽略 system prompt 或用户 constraint |
| Sub-intention errors | “Plan bugs” | plan execution 中的 omission、redundancy、disorder |

## 延伸阅读
- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657)14 loại chế độ thất bại, 3 个类别
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) Đăng ký rủi ro
- [Arize Phoenix](https://docs.arize.com/phoenix) 实践中的 drift cluster
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) Các mô hình đơn giản hơn, có thể hoàn toàn tránh được những mô hình này.
