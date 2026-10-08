# Các đại lý trình duyệt với dài thời gian Web  nhiệm vụ

> ChatGPT agent(7 tháng 7 năm 2025) sẽ Operator và nghiên cứu sâu  hợp nhất làm một trình duyệt / nhà máy tính kết thúc, và trên BrowseComp lên 68.9% 创下 SOTA。OpenAI 于 2025 8月 31 日关闭 Operator đây là sự tích hợp cấp sản phẩm。Anthropic 收购 Vercept 之后, sẽ Claude Sonnet trong OSWorld thành tích trên trên trên OSWorld từ dưới 15%  nâng lên 72.5% Web ・Arena-Verified(ServiceNow,ICLR 2026) sửa đổi tỷ lệ âm tính sai lệch 11.3 phần trăm trong WebArena gốc, phát hành 258-task Hard subset。 những con số này là thực tế。 thực tế: sự chuẩn bị của OpenAI Ứng viên chịu trách nhiệm công khai cho biết, đối với các trình duyệt Ứng viên có thể được một lần trực tiếp hoàn toàn sửa lỗi Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng  dụng Ứng dụng Ứng dụng Ứng dụng  dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng  dụng Ứng dụng Ứng dụng Ứng dụng  dụng Ứng dụng  dụng  dụng Ứng dụng  dụng Ứng dụng  dụng  dụng Ứng dụng  dụng  dụng Ứng dụng  dụng  dụng  dụng Ứng dụng  dụng Ứng dụng  dụng  dụng Ứng dụng  dụng Ứng dụng  dụng 

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：**Giai đoạn 15 · 10 (Phương thức cho phép), Giai đoạn 15 · 01 (Các chất có tầm nhìn dài)
**Time:** ~45 minutes

## 问题

Trình duyệt là một đại lý tầm xa: nó sẽ đọc nội dung không tin tưởng, và thực hiện có hậu quả. Mỗi trang mà đại lý truy cập, đều là các mục nhập không được viết bởi người dùng. Mỗi biểu đơn trên mỗi trang, đều là một đường dẫn lệnh tiềm ẩn.

防景不舒服──OpenAI 准备 负责人把隐含事实说出来:Indirect prompt injection不是一个可以完全修复的 bug──原因是攻击发生在代理的读取和行动边界,而这个边界在架构上是模糊的模型读取的每个代币,原则上都可能被读成一条指令──

本课会命名这个攻击面,命名基准版图(BrowseComp、OSWorld、WebArena-Verified),并建模一个最小的间接即时注射场景,让你推推理课 14 和 18 中的真实防御──

## 概念

### 2026 年版图: mỗi hệ thống một đoạn văn

**ChatGPT agent (OpenAI).**Năm 2025 năm tháng 7 tháng 7 tháng 7 tháng 7 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2025 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 năm 2020 (Buyết kế hoạch)

**Claude Sonnet + Vercept (Anthropic).**Anthropic  mua Vercept, tập trung vào khả năng sử dụng máy tính 上。将 Claude Sonnet 在 OSWorld 上的成绩从<15% 提升到72.5%。Claude Computer Use 作为工具 API 发布。

**Gemini 3 Pro with Browser Use (DeepMind).**Tích hợp sử dụng trình duyệt  phát hành điều khiển sử dụng máy tính;FSF v3(2026 年 4 月,Lớp 20) chuyên theo dõi ML R&D 领域的自主权──

**WebArena-Verified (ServiceNow, ICLR 2026).**修复一个有充分记录的问题:原始 WebArena 约有11.3%的错误负率(任务被标记为失败,但实际已解决) ―― 已被验证发布 使用人工整理的成功标准重新评分,并加入了258-任务 Hard subset(ICLR 2026 paper,openreview.net/forum?id=94tlGxmqkN) ――

### BrowseComp vs OSWorld vs WebArena

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同──高BrowseComp 分数说明代理 能找到事实; nó không说明代理 能预订航班──OSWorld 分数更接近它不能在我的桌面上工作──WebArena-Verified 更接近它不能完成一个流程──任何生产决策都需要选择与任务分布匹配的基准──

### 攻击面,命名如下

1. **Indirect prompt injection.**Không tin cậy của trang nội dung chứa chỉ thị. Công viên 读取它们. Công viên 执行它们.  公开示例:2024 Kai Greshake et al.
2. **URL fragment / query injection.**Được bắt URL của `#fragment`hoặc chuỗi truy vấn 包含命令──它们从未被见见染; nhưng vẫn nằm trong bối cảnh của đại lý──
3. **Memory-binding attacks.**页面 chỉ dẫn đại lý 写入一条持续存储(Lớp 12 涵盖 trạng thái bền) ・ trong phiên tiếp theo, bộ nhớ này trong trường hợp không có cảm biến hiển thị cảm biến cảm ứng
4. **Authenticated sessions 上的 CSRF-shaped attacks.**Tiếp xúc 类:agent 已登录某处; attacker page发出状态变更请求,agent 使用用户的 cookies 执行这些请求。
5. **One-click hijack.**Một đại lý vận tải không gây hại sẽ theo dõi tải trọng.
6. **Agent host surface 中的 Content-Security-Policy holes.**Đưa ra và các lớp công cụ 本身也可能成为攻击 Vector;browser-in-a-browser-agent stack 很宽──

### Tại sao không thể hoàn toàn sửa chữa?

Những hành động này có thể được thực hiện bởi các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, các nhà quản lý, và các nhà quản lý, và các nhà quản lý.

Đây là cùng với lý thuyết của Lob (Dạy 8) là một mô hình suy luận tương tự: đại lý không thể chứng minh một token là an toàn; nó chỉ có thể xây dựng một hệ thống, để làm cho token không an toàn dễ dàng hơn để được kiểm tra ra.

### Thực sự có thể lên đường

- **Read / write boundary.**读取永远不产生后果──写入(提交表单、发布内容、调用有副作用的工具) Nếu nội dung được phát hành bởi giới hạn niềm tin, thì cần được phê duyệt nhân sự mới──
- **Tool allowlist per task.**Trưởng lý có thể duyệt; trừ khi một công cụ đã được bật rõ ràng cho nhiệm vụ, nếu không nó không thể phát hành chuyển khoản điện tử.
- **Session isolation.**Các phiên trình duyệt chỉ sử dụng các thông tin tín dụng có phạm vi 运行。 không có tác giả sản xuất, không có email cá nhân。 giữ lại mỗi yêu cầu HTTP 日志 để kiểm tra。
- **Content sanitizer.**Nhận HTML trong ngữ cảnh mô hình 前, sẽ剥离 được biết đến-mô hình xấu──( giảm dễ dàng tấn công; không thể ngăn chặn tải trọng hữu ích phức tạp──)
- **对 consequential actions 使用 HITL。**Mô hình đề xuất sau đó thực hiện bài học 15.
- **Canary tokens on memory.**Nếu một mục ghi nhớ 触发, người dùng sẽ thấy nó (Lớp 14)


```figure
injection-boundary
```

## Sử dụng nó

`code/main.py`建模一个小浏览器-代理运行,目标是三个合成页面――一个页面是良性的,一个在可见文本中有直接提示注射斑块,一个有URL-fragment注射(不可见,但位于代理的背景中) ――脚本展示了 (a) 无知代理会做什么,(b) 读/写界会捕获什么,(c) 净化器会捕获什么,(d) 二者都捕获不了什么――

## 交付 nó

`outputs/skill-browser-agent-trust-boundary.md`界定一个拟议的浏览器代理部署: nó đạt đến những vùng tin cậy, nó được ủy quyền viết vào gì, cũng như lần đầu tiên vận hành trước phải đặt trên những phòng thủ nào.

## 练习

1. 运行 `code/main.py` tìm ra chất khử trùng có thể bắt được nhưng giới hạn đọc/scrut 不能捕获的攻击, cũng như giới hạn đọc/scrut 能捕获的攻击

2. 扩展 sanitizer, sử dụng nó để kiểm tra một loại hắc-Jack kiểu URL-phân tích tiêm.

3. 选择一个你知道的真实浏览器-agent workflow (ví dụ: 预订航班) 列出每次阅读和每次写,标记哪些写 需要 HITL,以及为什么.

4. 阅读 WebArena-Verified ICLR 2026 paper── tìm ra một WebArena 评分不可靠的任务类别,并解释 Verified subset 如何解决它──

5. Để thiết lập trình duyệt, thiết kế một bộ nhớ có thể... bạn sẽ lưu trữ gì, tồn tại ở đâu, gì sẽ kích hoạt báo động?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) Operator và nghiên cứu sâu  
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) Hạt giống của nhà điều hành, và sau đó trở thành kiến trúc của đại lý ChatGPT.
- [Zhou et al. — WebArena](https://webarena.dev/) Định nghĩa chuẩn ban đầu
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) ICLR 2026 giấy cố định phụ nhóm
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 包含 bàn luận về bề mặt tấn công của các đại lý sử dụng máy tính.
