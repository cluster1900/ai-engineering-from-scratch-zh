# Tưởng thức chia sẻ và bảng màu 模式

> Trong hệ thống đa đại lý năm 2026 có hai phương pháp:**message pool**(Tất cả mọi người có thể xem thông tin của tất cả mọi người, chẳng hạn như AutoGen GroupChat hoặc MetaGPT) và**带 subscription 的 blackboard**(Agent 订阅相关事件, chẳng hạn như Context-Aware MCP hoặc Matrix framework) ⋅ cả hai đều là phần duy nhất có trạng thái trong hệ thống Multi-Agent **memory poisoning**Một đại lý 幻觉出一个事实,另一个 đại lý 把它当作已验证内容,准确性逐渐衰退,而且这种衰退比立即崩更难调试――本课将使用stdlib 构建这两种结构,注入一次毒袭,并展示三种在生产中真正有效缓解措施――

**类型：**Học + xây dựng
**语言：**Python,`threading`(văn)
**先修：**Giai đoạn 16 · 04(Mô hình sơ khai),Giai đoạn 16 · 09(Tác mạng lưới lồng lồng song song)
**时间：**约75分钟

## 问题

Multi-Agent 系统需要一个地方让代理共享事实―― một tùy chọn trên chữ cái là 把所有内容都通过消息传递, nhưng đây tương đương với việc tái tạo lại trạng thái chia sẻ

Khi một trong những người đại lý  tạo ra ảo ảnh và đưa ảo ảnh vào trạng thái chia sẻ, sau đó mỗi người đọc được trạng thái này, đại lý sẽ đưa ảo ảnh này thành sự thật.

Đây là nhiễm độc trí nhớ. Nó là phân loại MAST của các nhà khoa học học.

## 概念

### 两种主要拓

**Full message pool。**Mỗi đại lý 读取每条消息──AutoGen GroupChat 和 MetaGPT sử dụng phương pháp này── đơn giản, minh bạch, kiểm tra, nhưng không thể mở rộng lên hơn khoảng 10 đại lý, vì các văn bản trên mỗi đại lý sẽ được làm bởi các đại lý khác.

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**带 subscription 的 Blackboard。**Agent 声明自己感兴趣的主题; tầng dưới chỉ đường từ các thông tin liên quan. CA-MCP(arXiv:2601.11595) và Matrix decentralized framework(arXiv:2511.21686) sử dụng phương pháp này.

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### Phương trường thích hợp

- **Full pool**适合代理 数量少 ((< 10) 角色异构、对话 là một tình huống chu kỳ ngắn.
- **Blackboard**适合 Agent 数量多、角色同质但实例众多(swarms) 、对话长期运行情况──Routing 能节省 Token 成本并减少上下文污染──

生产系统通常混合使用:顶部使用一个小型全池 (một tầng quy hoạch),下方使用黑板 (một tầng lao động)

### Một cảnh ngộ độc trí nhớ

三个 Agent 执行一个研究任务──Agent A là đại lý tìm kiếm──Agent B là tổng kết──Agent C là nhà phân tích──

1. A 获取一个页面,并向共享状态写入消息: Nghiên cứu báo cáo cải thiện độ chính xác 42% .
2. Trang được lấy thực tế viết là cải thiện 4,2% .
3. B 读取共享状态后写入:Nâng cao độ chính xác 42% được báo cáo (nguồn: A).
4. C 读取共享状态后写入:Thiếu nại chấp nhận  42% nâng là biến đổi.
5. Báo cáo cuối cùng trích dẫn một số 42% chưa từng có.

Không có đại lý 崩── không có thử nghiệm thất bại──系统工作正常── cái ý tưởng này qua trạng thái chia sẻ, từ trên xuống của một đại lý vào trong mỗi suy luận của một đại lý.

### Tại sao đây là vấn đề cấu trúc

没有共享状态时,Agent A's幻觉会留在A's上下文中──下游 Agent 会重新获取或重新推导,可能会发现错误──

 vấn đề không phải là trạng thái chia sẻ mà là trạng thái chia sẻ**没有 provenance，也没有独立 verifier**❖ Có ba biện pháp giảm thiểu có thể giải quyết vấn đề này:

1. **每次写入都标注 provenance。**Mỗi mục trong trạng thái chia sẻ đều ghi lại người viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian viết, thời gian, thời gian viết, thời gian, thời gian, thời gian, thời gian, và thời gian, và thời gian, và thời gian, và thời gian, và thời gian, và thời gian, và thời gian, và thời gian.
2. **对写入做 versioning；把它们视为 append-only。**修正 là một mục mới, được sử dụng để thay thế mục cũ, thay vì bản địa更新.
3. **至少保留一个无法写入共享状态的 Agent。**Trình kiểm tra chỉ đọc 抽样输入、重新获取来源,并标记不一致──因为 nó không thể viết vào hồ bơi, vì vậy nó sẽ không bị nhiễm độc hồ bơi──

### Bảng đen 先例 ((Hayes-Roth, 1985)

Blackboard 模式比LLM agents早了四十年.Hayes-Roth (sinh năm 1985,A Blackboard Architecture for Control) mô tả các chuyên gia Knowledge Sources: chúng quan sát một bảng đen toàn diện, đóng góp các giải pháp một phần,并触发 các nguồn khác.

### Dự án so với toàn bộ hình ảnh

純黑板会给每个订阅者同样的投影(按主题 限定) 更多激进的设计是**per-agent projection**Mỗi đại lý nhận được một quan điểm tùy thuộc vào vai trò của mình. Các nhà giảm trạng thái của LongGraph là quy tắc của năm 2026 để thực hiện chức năng giảm sẽ gấp lại trạng thái toàn cầu thành một mảnh cụ thể về vai trò.

Dự án mỗi đại lý  mở rộng性更强, nhưng cần sơ đồ. Không có sơ đồ. Khi bạn sẽ xây dựng lại dự án ad-hoc trong mỗi lệnh của đại lý.

### Tương tự văn bản 模式

Nhiều đại lý cùng lúc viết một vấn đề đồng thời, không chỉ là vấn đề LLM.

- **Sequential writer（single producer）。**Tất cả các bài viết đều được viết bởi một đại lý điều phối viên 串行化.
- **带 versioning 的 optimistic concurrency。**Mỗi mục có phiên bản; tác giả trong phiên bản không phù hợp 时失败并重试;;经典数据库技术;;
- **Topic partitioning。**Không có tranh chấp giữa các chủ đề, cần thiết kế ranh giới phân vùng tốt.

Hầu hết các nhà văn sử dụng các mô hình liên tục, vì LLM 调用足够慢, làm cho tranh cãi 很少见,而瓶影响不大――

### Không thể ghi xác minh

Các biện pháp giảm thiểu quan trọng nhất là kiểm chứng chỉ đọc:

- Chuyên gia kiểm tra và chia sẻ tình trạng của nhóm (读取 blackboard hoặc pool)
- Verifier  không có trạng thái chia sẻ viết tay  chỉ có thể viết vào kênh xác minh độc lập.
- Verifier 独立获取 viết 中引用的来源──标记分歧──
- Người xác minh  bản thân mình được chuyển giao cho con người hoặc đại lý quyết định độc lập, không phản đối lại cộng đồng.

Không có sự tách biệt như vậy, người xác minh sẽ gặp gỡ những người mới trong hồ bơi, điều này có nghĩa là hồ bơi bị nhiễm độc sẽ gặp người xác minh độc, và người xác minh cũng sẽ gặp người xác minh độc của nó.


```figure
swarm-blackboard
```

##  xây dựng nó

`code/main.py`Sử dụng Python, chúng tôi đã thực hiện hai loại công nghệ, cũng như một cuộc tấn công độc đồ chơi và 3 loại biện pháp giảm bớt.

- `MessagePool` 线程安全的附录日志,支持完整读出──
- `Blackboard` 按主题键的 pub/sub, hỗ trợ thuê bao mỗi đại lý
- `ProvenanceEntry` Mỗi lần viết vào tất cả ghi chép (tác giả, thời gian, dấu ấn, thông tin)
- `PoisoningScenario` 运行一个三 代理研究任务, trong đó là Agent A 幻觉出小数点――印最终报告――
- `Verifier` Một đại lý chỉ đọc, sẽ lấy lại các nguồn và ghi nhận không phù hợp.

运行:

```
python3 code/main.py
```

预期输出:
- Run 1 ((không xác minh): 42% của sự phát hiện sẽ được truyền đến báo cáo cuối cùng.
- Run 2( có xác minh viên):verifier 标记不一致,pool 被标记为 旗,最终报告包含撤销。

## Sử dụng nó

`outputs/skill-memory-auditor.md`là một kỹ năng, được sử dụng để kiểm tra bất kỳ Multi-Agent  hệ thống chia sẻ bộ nhớ  thiết kế, kiểm tra xuất xứ, phiên bản và xác minh phân tách.

##  phát hành nó

对于任何共享记忆 设计:

- Mỗi lần viết tất cả ghi lại nguồn gốc:`(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`
- 让日志保持附加单──Cửa đổi là引用被取代的新入口──
- 部署 ít nhất một đại lý xác minh chỉ đọc truy cập nguồn độc lập.
- sẽ dẫn đầu của xác minh viên 路由到单独频道, thay vì quay lại pool chia sẻ.
- 记录 sự thay thế trong văn bản  比例上升是幻觉模式的早期证据──

## 练习

1. 运行 `code/main.py`❖ xác nhận chạy 1 sẽ truyền hình, và chạy 2 sẽ bắt được nó.
2. 添加第二幻觉:agent B 编制一个数据集尺寸──verifier 应该能够捕获两者,而不需要针对任何情况手工调优──
3. 将 toàn bộ bể 切换为带 chủ đề phân vùng(`prices``summaries``analyses`Phân vùng chủ đề sẽ làm cho những kịch bản độc hại nào khó thực hiện hơn, còn đối với những gì không giúp đỡ?
4. 阅读 Hayes-Roth(1985,A Blackboard Architecture for Control)  tìm ra bài luận中本课未讨论、但2026 年系统会受益的两个控制模式──
5. 阅读 CA-MCP(arXiv:2601.11595)。将其 chia sẻ Nội dung Store 映射到 `code/main.py`Trong lớp MessagePool hoặc Blackboard. CA-MCP đã thêm thêm vào những thứ nguyên thủy nào?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Message pool | “Shared chat history” | 每个 Agent 都会读取的 append-only log。完全透明，但扩展性差。 |
| Blackboard | “Shared workspace” | 按 topic keyed 的 pub/sub。Agent 订阅相关 topics。扩展更远。 |
| Provenance | “谁写了什么” | 每次写入的 metadata：writer、timestamp、prompt、sources。 |
| Memory poisoning | “幻觉在扩散” | 一个 Agent 的错误进入共享状态，下游 Agent 将其当作事实。 |
| Append-only | “没有原地更新” | Corrections 是用来 supersede 的新 entries。保留 audit trail。 |
| Unwritable verifier | “Independent auditor” | read-only Agent，会重新获取 sources 并标记不一致。 |
| Projection | “Scoped view” | 从 global state 计算出的 per-agent view。LangGraph reducers 是规范案例。 |
| Knowledge Source | “Specialist agent” | Hayes-Roth 在 1985 年对 blackboard participant 的称呼。 |

## 延伸阅读

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST phân loại;nghỉm trí nhớ là sự không phối hợp của một đứa con
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) Sử dụng để phối hợp các máy chủ MCP của Shared Context Store
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686) 基于消息队的黑板,没有中央管弦乐器
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 生产中的 per-agent dự đoán 模式
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Từ nguồn gốc và ghi nhận xác minh của Bộ sản xuất
