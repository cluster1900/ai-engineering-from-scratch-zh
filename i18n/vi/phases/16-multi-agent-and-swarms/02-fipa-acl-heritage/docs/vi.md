# Phiên truyền của FIPA-ACL và các đạo luật ngôn luận

> Trước MCP, trước A2A, có FIPA-ACL. Năm 2000, Quỹ IEEE cho các đại lý vật lý thông minh  phê duyệt một ngôn ngữ truyền thông đại lý, trong đó có 20 ngôn ngữ hiệu suất, hai ngôn ngữ nội dung, cũng như một nhóm giao thức tương tác: hợp đồng net, đăng ký/ thông báo, yêu cầu khi nào. Nó do đó xuất hiện từ ngành công nghiệp, vì ontology mở bán cho web nói quá nặng, nhưng các hệ thống đa đại lý được thúc đẩy bởi LLM ế tục, đang tái hiện ý tưởng, chỉ không có ngữ nghĩa chính thức: hợp đồng JSON  lấy hiệu suất, ngôn ngữ tự nhiên  thay thế ontologies.

**Type:** 学习
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（Why Multi-Agent）
**Time:** ~60 分钟

## 问题

Các lĩnh vực của các ứng viên-photocol năm 2026 rất đông đúc: sử dụng các công cụ MCP, sử dụng các đại lý A2A, sử dụng các kiểm toán doanh nghiệp ACP, sử dụng các ANP để phân tâm tín ngưỡng, sử dụng các nội dung ngôn ngữ tự nhiên NLIP, thêm CA-MCP và hơn 20 đề xuất nghiên cứu.

Trong thực tế, hầu hết trong số đó đều được tái phát hiện một cây quyết định rất cụ thể đã có hai thập kỷ lịch sử. Austin ([1]1962) và Searle ([1]1969) thuyết diễn văn-giá trị đã cho chúng ta những phát biểu là hành động. KQML ([2]1993) biến nó thành giao thức dây (Wire Protocol) FIPA-ACL ([2]2000 năm phê duyệt) đã đưa ra tiêu chuẩn hóa cấp tham chiếu: 20 ngôn ngữ hiệu suất SL0/SL1, cũng như các giao thức tương tác của các ngôn ngữ liên kết SL0/SL1 được sử dụng cho mạng lưới hợp đồng và các thông báo đăng ký. JADE và JACK là nền tảng tham chiếu Java.

Khi bạn thấy MCP của `tools/call`Khi bạn thấy vòng đời nhiệm vụ của A2A, hoặc kho lưu trữ bối cảnh chia sẻ của CA-MCP, bạn sẽ thấy là một loại tái mô tả mềm hơn của quyết định FIPA, bản địa JSON.

## 概念

### 用一段话 hiểu Phản ứng nói

Austin lưu ý rằng một số câu không phải là trong việc mô tả thế giới, mà là thay đổi thế giới. Tôi hứa.  Tôi yêu cầu.  Tôi tuyên bố. Ông gọi những câu này là những phát biểu hiệu suất. Searle sẽ định hình hóa nó thành 5 loại: khẳng định, hướng dẫn, truyền đạt, thể hiện, tuyên bố.

### 二十个 FIPA biểu diễn (部分列表)

| Performative | Intent |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该 proposal” |
| `reject-proposal` | “我拒绝该 proposal” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的 message 无法 parse” |
| `cfp` | “针对 X 发出 proposals 征集” |
| `subscribe` | “当 X 变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试了 X，但失败了” |

完整列表在 `fipa00037.pdf`(FIPA ACL Message Structure) 中──重点不是记住它,而是每一个内容,都应对LLM协议 最终会重新添加一个原始──

### Thông điệp FIPA-ACL của quy định

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

七个字段承载 giao thức phong bì;一个字段(`content`(Tổ phần phần còn lại là bạn sẽ phát minh lại thứ gì đó mỗi khi bạn đưa giao thức JSON vào các thử nghiệm và các mô hình.

### 两个传统平台

**JADE**(Java Agent Development framework, 19992020s) là sử dụng thời gian chạy FIPA-compliant rộng nhất.

**JACK**(Agent Oriented Software,商业) nhấn mạnh trên thông điệp FIPA 之上的 BDI(Tín ngưỡng-Thiên chí-Thiên tâm)

两者都在网堆 吞掉多代理使用案例 后走向衰落──MCP 和 A2A là 2026 năm chạytime 容器──

### FIPA vì sao lại bị loại bỏ

- **Ontology 开销。**FIPA 要求使用共享 ontology 来 parse `content`就 ontologies 达成一致是一个历历时数年的标准化过程──web 只是使用HTTP + JSON──
- **没人使用的 formal semantics。**SL (Semantic Language) cung cấp các điều kiện chân lý nghiêm ngặt, nhưng hầu hết các hệ thống sản xuất sử dụng nội dung dạng tự do,并忽略形式主义──
- **Tooling lock-in。**JADE chỉ hỗ trợ Java; Jack là sản phẩm thương mại.
- **internet 赢下了 stack。**REST, sau đó là JSON-RPC, sau đó là gRPC, thay thế vận chuyển ACL.

### LLM 复兴是 FIPA-lite

So sánh một FIPA `request`Với một MCP`tools/call`- Có thể là:

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

Cùng một phong bì, các cấu trúc khác nhau. Cả hai đều mang tính: ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai, ai

Cuộc khảo sát năm 2025 của Liu et al. ((A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP, arXiv:2505.02279) rõ ràng chỉ ra rằng truyền thuyết này: MCP đối phó với các hành động ngôn ngữ sử dụng công cụ, A2A đối phó với các hành động ngôn ngữ đại lý-tương tác, ACP đối phó với các hành động ngôn ngữ audit-trail, ANP đối phó với các tiện ích mở rộng danh tính phi tập trung.

### 直白地说明 tradeoff

**FIPA 给了你、而现代 specs 放弃的东西：**

- Tiểu ngữ học chính thức: bạn có thể chứng minh`inform`Ý nghĩa là người gửi tin vào nội dung.
- Một quy tắc của biểu diễn: bạn không cần phải tranh luận lại xem chúng ta có nên có một`cancel`? ──
- Các mô hình giao tiếp-photocol hàng thập kỷ:contract-net、subscribe-notify、propose-accept, còn có các tính chất chính xác đã biết đến──

**现代 specs 给了你、而 FIPA 没有的东西：**

- Với tất cả các công cụ hiện đại兼容 của JSON-cùng tải hữu ích bản địa.
- LLM không cần thiết với mô hình chữ viết tay ngay lập tức giải thích nội dung ngôn ngữ tự nhiên.
- Chuyển web-stack ((HTTP、SSE、WebSocket) ]]
- 通过实时的MCP `server/discover`Với thẻ A2A Agent  thực hiện khả năng phát hiện.

Hơn nữa, ý định ngữ nghĩa tự do hơn, thay đổi để dễ dàng hơn để thực hiện.

### Các giao thức tương tác đáng được chuyển

FIPA đã kết hợp với khoảng 15 giao thức tương tác. Trong đó ba trong số đó có giá trị đưa vào các hệ thống đa đại lý LLM:

1. **Contract Net Protocol (CNP)。**Quản lý 发出 `cfp`(công gọi đề xuất); người đề nghị dùng`propose`响应;manager 接受/拒绝──这是规范的任务市场模式(Phase 16 · 16 đàm phán)
2. **Subscribe/Notify。**Đăng ký 发送 `subscribe`; nhà xuất bản trong chủ đề 变化时发送 `inform`Đó là mỗi chuyến xe buýt của năm 2026.
3. **Request-When。**当条件 Y 成立时执行 X──带预条件的延迟行动──2026 年的模拟是耐久的工作流引擎中的延迟任务(Phase 16 · 22 Scaling Production)──

Mỗi một đều có thể hiển thị rõ ràng đến hàng tin nhắn hiện đại, thăm dò HTTP +, hoặc phát trực tuyến SSE.

###  Lên bỏ ontology  sau đó sẽ xuất hiện những vấn đề

Không có phân tích phân tích, đại lý 会从自然语言内容 推断含义──2026年有文档记录的失败模式 是**semantic drift**: 2 đại lý dùng cùng một từ`"customer"`(văn số 1): (văn số 2): (văn số 2): (văn số 2): (văn số 2): (văn số 2): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 3): (văn số 4): (văn số 4): (văn số 4): (văn số 4): (văn số 4): (văn số 4): (văn số 4): (văn số 4): (văn số 4): (văn số 4): (văn số 4):))

Không đi toàn bộ ontology 路线的缓解措施:

- `content`上的 JSON Schema: trong dây 层 từ chối cấu trúc lỗi.
- Các loại đồ tạo vật ((A2A): từ chối lỗi của modality。
- bọc 中的显式表演: ngay cả khi nội dung là ngôn ngữ tự nhiên, cũng có thể làm cho ý định 明确无歧义。

### 2026 mô hình 映射到 ngôn ngữ-phản ứng di sản

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent、correlation id | formal semantics、ontology |
| MCP `resources/read` | `query-ref` | explicit intent、correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle、state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard（Hayes-Roth 1985） | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

Từ trên xuống đọc bảng này, mô hình là: giữ nguyên cấu trúc, từ bỏ chủ nghĩa hình thức, để LLM 掩歧义──


```figure
sw-contract-net
```

##  xây dựng nó

`code/main.py`实现 một dịch giả FIPA-ACL tinh khiết. Nó编码和编码规范的ACL封面,并展示每种MCP / A2A消息形状 如何归约为同样七个字段.

- 将五条 MCP-style 和 A2A-style messages 编码为FIPA-ACL。
- Để FIPA-ACL 解码回现代等价形式.
- Sử dụng `cfp``propose``accept-proposal``reject-proposal`, giữa một quản lý và ba nhà đấu thầu , vận hành một phiên bản đồ chơi Hợp đồng đàm phán mạng lưới .

运行:

```
python3 code/main.py
```

输出 là một đoạn dấu vết bên cạnh, hiển thị từng thông điệp hiện đại của 2026 JSON 形式和 FIPA-ACL 形式, sau đó hiển thị một lần vòng đi của hợp đồng-net bid ;;

## Sử dụng nó

`outputs/skill-fipa-mapper.md`là một kỹ năng, nó sẽ đọc bất kỳ đặc điểm-phụ lục nào và tạo ra bản đồ FIPA-ACL. Trước khi áp dụng giao thức mới, hãy trả lời với nó:`inform`?

## 交付 nó

Đừng mang lại FIPA-ACL...

- Mỗi bài tin nhắn có ý định nguyên thủy (performative) là gì?
- Có hay có sử dụng liên quan trả lời yêu cầu và hủy bỏ ID?
- Có phải có ngôn ngữ nội dung rõ ràng ((JSON-RPC、 văn bản đơn giản、 đồ tạo kiểu cấu trúc)?
- Các giao thức tương tác là hạng nhất, hay bạn đang bắt đầu tái thiết hợp đồng mạng?
- Khi hai đại lý đối với nội dung có ý nghĩa có sự phân biệt (semantic drift) thì chuyện gì xảy ra?

Trước khi giao giao thức mới nào đến sản xuất, hãy ghi lại 5 vấn đề này.

## 练习

1. 运行 `code/main.py` quan sát mã hóa đi lại và đi lại  nhận ra các ứng dụng hiệu quả của FIPA `tools/call``resources/read`Và tạo ra nhiệm vụ A2A.
2. dùng một`cancel` mở rộng hợp đồng-net demo, để quản lý có thể rút lại nhiệm vụ trong quá trình đấu thầu.`cancel`- Thử giải quyết những vụ thất bại không thể giải quyết được?
3. 阅读 FIPA ACL Message Structure(http://www.fipa.org/specs/fipa00037/）第4.14.3 节── chọn một biểu diễn không bao gồm,并 mô tả tương tự JSON-RPC hiện đại của nó──
4. 阅读 Liu et al., arXiv:2505.02279──分别针对 MCP、A2A、ACP、ANP,列出它们保留和放弃的FIPA执行家族──
5. Vì bản thân mình trong hệ thống`request`thực hiện của `content`字段设计一个最小的JSON-Schema──与纯自然语言相比,这个方案给你什么,又带来什么成本?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | “一种会做事的 utterance” | Austin/Searle：把 utterances 视为 actions。ACL 的理论源头。 |
| FIPA | “那个老 XML 东西” | IEEE Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope format：performative + content + metadata。 |
| Performative | “那个动词” | 一条 message 的 intent class：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单，范围更窄。 |
| Ontology | “共享词汇表” | 对 content language 所谈论概念的 formal definition。 |
| SL0 / SL1 | “FIPA content languages” | Semantic Language levels 0 and 1，即 formal content language family。 |
| Contract Net | “Task market” | Manager 发出 cfp；bidders propose；manager accepts。规范的 interaction protocol。 |
| Interaction protocol | “Messages 的模式” | 一组具有已知 correctness 的 performatives 序列：request-when、subscribe-notify 等。 |

## 延伸阅读
- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) 将现代规范与FIPA遗产 连接起来的规范 2025调查
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 2000 năm phê duyệt hình thức phong bì
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 完整的 biểu diễn danh mục
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) `request`- Không.`query-ref`                                                                                                                                                                                                                                                              
- [A2A specification](https://a2a-protocol.org/latest/specification/) hợp đồng-net 和 đăng ký- thông báo của hiện đại đại đại lý-tương đương 等价格形式
