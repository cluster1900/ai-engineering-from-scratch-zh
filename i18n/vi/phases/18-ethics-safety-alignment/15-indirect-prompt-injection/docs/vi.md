# Tiêm trực tiếp không trực tiếp  生产攻击面

> Tiêm kích bất trực tiếp (IPI) sẽ chỉ địnhTập vào nội dung bên ngoài  trang web, thư điện tử, tài liệu chia sẻ, vé hỗ trợ  bởi hệ thống cơ quan trong trường hợp không có hoạt động của người dùng rõ ràng. IPI là mối đe dọa sản xuất chiếm ưu thế vào năm 2026: nó vượt qua bộ lọc đầu vào người dùng, vì kẻ tấn công không liên lạc với người dùng; khi các đại diện xử lý nhiều nội dung bên ngoài hơn, nó sẽ lặng lẽ mở rộng; và nó nhắm vào người không đọc được dòng chảy tự động hóa của dữ liệu nhanh chóng. MDPI Thông tin 171): 54 (từ tháng 1 năm 2026) 综合 2023-2025 năm. NDSS 2026 Báo cáo phòng thủ IPI sẽ giải thích thách thức cốt lõi của việc đầu tiên: các chỉ thị nhập vào có thể là "lên bản tốt" có nghĩa là "có"), vì vậy kiểm tra không chỉ là lọc các từ khóa "The Open Attack" (Báo cáo của Nascar Attackers, R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D; R&D;

**类型：**Xây dựng
**语言：**Python (stdlib, IPI tấn công + cột bảo vệ)
**先修要求：**Giai đoạn 18 · 12 (PAIR), Giai đoạn 14 (kỹ thuật đại lý)
**时间：**~ 75 phút

## Học mục tiêu

- 定义 gián tiếp tiêm nhanh,并描述三种常见投递 矢量──
- 解释 tại sao bộ lọc nhập người dùng sẽ hoàn toàn bỏ lỡ IPI.
- mô tả như là khung "chống chế dòng chảy thông tin" của mô hình phòng thủ năm 2026:
- Nói rõ Nasr et al. ( Tháng 10 năm 2025)  Về phát hiện tỷ lệ thành công của cuộc tấn công thích nghi đối với các phòng thủ IPI đã được công bố

## 问题

Direct prompt injection  yêu cầu kẻ tấn công chạm đến người dùng hoặc nó prompt. IPI 两者都不需要: kẻ tấn công đưa tải trọng bồi thường vào đại lý.

## 概念

### 三种投递 Dòng chuyển

- **RAG。**攻击者发布一个文件;检索 步骤获取它;立即在用户问题之前拼拼接它;模型 执行攻击者的指令;;
- **Inbox / document workflows。**攻击者给用户发送电子邮件;agent 读取电子邮件;prompt 包含电子邮件体;model 遵循电子邮件中的指令;;
- **Tool output。**攻击者控制代理 使用某种工具 (例如返回攻击者控制结果的网页搜索);输出工具 (工具输出) 包含指令;控制代理的流随着这些指令――

Người này chia sẻ một thuộc tính cấu trúc: một đoạn của kẻ tấn công kiểm soát prompt, mà không cần phải tiếp xúc với đầu vào của người dùng.

### Tại sao bộ lọc nhập người dùng sẽ bỏ lỡ nó

IPI payload không xuất hiện trong đầu vào của người dùng. Nó xuất hiện trong nội dung được lấy lại. Nếu bộ lọc chỉ được lấy vào người dùng để đóng cửa, payload sẽ vượt qua nó. Nếu bộ lọc ảnh hưởng đến tất cả nội dung của mô hình, nó phải được áp dụng cho bất kỳ văn bản nào được lấy lại 

### 面向 AI ở kiểm soát thông tin dòng chảy (IFC)

2026 年防御范式借鉴经典 OS security──把每个内容源都视为一个安全标签──把用户的查询标记为"可信"──把检索的内容标记为"不可信"──把模型的控制流 视为信息流:由不可信的内容 触发的行动 必须在执行前由可信的输入 批准──

CaMeL (Microsoft 2025)、ConfAIde (Stanford 2024) 和 NDSS 2026 IPI-defense paper 以不同方式落地 IFC──共同原则是:只要代码和数据 共享同一个背景窗口,目标就是制约,而不是预防──

### Người tấn công tiến hành thứ hai

Nasr et al. ( Tháng 10 năm 2025) Sử dụng các cuộc tấn công thích nghi (gradent search, RL policies, random search, 72-hour human red-team) đã thử nghiệm 12 phòng thủ IPI đã được xuất bản.

方法论教训: chỉ có trong bao gồm đánh giá tấn công thích ứng 时才发布 phòng thủ。Static-attack benchmarks 不是证据强度;攻击者会知道防御。

### Sự thật thật

Bài học 25 覆盖 EchoLeak (CVE-2025-32711, CVSS 9.3)  Microsoft 365 Copilot 中首个公开记录的零点击 IPI。GitHub Copilot Chat 中的CamoLeak (CVSS 9.6)。GitHub Copilot 中的 CVE-2025-53773。生产部署正在真实场景中被IPI 攻陷,而不只是基准中──

### OWASP 和 NIST 框架

OWASP LLM Top 10 (2025) sẽ tiêm nhanh chóng (direct + indirect) 列为 LLM01,即排名第 1 của ứng dụng-layer đe dọa.

### Nó nằm ở vị trí giữa giai đoạn 18

Bài học 12-14 là các vụ đột nhập dựa trên mô hình. Bài học 15 là chủ đạo cho cuộc tấn công dựa trên hệ thống của 2026 năm sản xuất. Bài học 16 覆盖防御工具. Bài học 25 覆盖具体的 CVE 叙事.


```figure
al-injection-vector
```

## Sử dụng nó

`code/main.py`构建一个IPI harness──一个玩具代理 有三个工具──搜索网──阅读电子邮件──发送消息──环境包含攻击者控制的内容,其中Embedding一条指令──" chuyển hướng này cho tất cả các liên lạc")──你可以在天真的代理──遵循注入指令──过-防守的代理──对获取内容做关键字过──和IFC代理──分离可信与不可信的内容,并拒不可信的控制流命令──之间切换──

## 交付 nó

本课生成 `outputs/skill-ipi-audit.md` Đưa ra một mô tả về việc triển khai của một cơ quan, nó sẽ đưa ra các nguồn nội dung không đáng tin cậy, kiểm tra liệu bộ phận này có áp dụng IFC hay không, và đánh dấu những nguồn không có nhãn đáng tin cậy về mô hình đến đây.

## 练习

1. 运行 `code/main.py`◊ đo lường tỷ lệ thành công của các cuộc tấn công nhắm vào ba nhân viên khác nhau.

2. Trong nội dung thu hồi trên thực hiện một biện pháp bảo vệ dựa trên ngữ pháp.

3. 阅读 NDSS 2026 IPI- phòng thủ bài báo.

4. 设计一个部署, trong đó đại lý từ API bên thứ ba 接收工具输出──为每一个提示片段 标记信任水平,并写出控制代理行动的IFC政策──

5. Trong tập 2 của bộ lọc-được bảo vệ đại lý 上复现 Nasr et al. 2025 ứng dụng- tấn công 方法论── báo cáo ứng dụng tấn công 前后的 ASR──

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|------------------------|
| IPI | "indirect prompt injection" | 通过用户没有编写、但 agent 在正常运行期间消费的内容进行 injection |
| RAG injection | "poisoned retrieval" | 攻击者发布 retrieval 步骤会获取的内容；prompt 中包含 payload |
| Zero-click | "no user action" | 攻击在 agent 运行期间自动触发；用户什么都不做 |
| IFC | "information flow control" | 基于 label 的方法：来自 untrusted content 的 actions 需要 trusted ratification |
| Adaptive attack | "gradient / RL red-team" | 知道 defense 并针对它优化的 attack；诚实评估必须包含 |
| Benign instruction | "please print Yes" | 语义上良性的 IPI payload；没有 keyword filter 能捕获它 |
| Scope violation | "cross-trust exfiltration" | Agent 从一个 trust context 访问 data，并将其输出到另一个 trust context |

## 延伸阅读

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) 2023-2025 综合
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) 自适应攻击评估
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) giấy IPI nguyên thủy
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) tiêm nhanh 排名 LLM01
