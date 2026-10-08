# Các công cụ song song gọi và các công cụ của Streaming

> Nếu chuỗi thực hiện,就是三次往返──并行运行后, tổng tiêu tốn thời gian sẽ giảm xuống đến chậm nhất đơn调调用── hiện tại mỗi nhà cung cấp biên giới đều có thể phát ra nhiều công cụ trong một lượt.

**类型：**Xây dựng
**语言：**Python(stdlib, hồ bơi + dây thả)
**前置要求：**Giai đoạn 13 · 02(phong thức gọi lặn sâu)
**时间：**约75分钟

## Học mục tiêu

-  Giải thích tại sao tồn tại `parallel_tool_calls: true`, và khi nào nên cấm nó.
- Trong thời gian fan-out song song, sẽ phát các đoạn tranh luận 关联到正确的工具-call id──
- Trong quá sớm phân tích trước,把部分 `arguments`string 重组为完整 JSON。
- 运行一个三城市天气基准, hiển thị độ trễ liên tục so với song song.

## 问题

Không có cuộc gọi song song 时, một đại lý  trả lời what is the weather in Bengaluru, Tokyo, and Zurich 会这样做:

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

三次 LLM 往返, mỗi lần trả lại phải trả cho thời gian trễ của trình thực.

Sử dụng cuộc gọi song song:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

Một lần LLM 往返──Executor 时间是三者的最大值,而不是总和──在OpenAI、Anthropic 和 Gemini 上的生产基准显示, đối với tải trọng làm việc ngoài máy, đồng hồ tường có thể giảm 60% đến 70%──

代价是相关复杂性──当三个调用乱序完成时, kết quả của bạn phải mang theo sự phù hợp `tool_call_id`, để mô hình có thể đưa chúng vào cùng một dòng. Khi kết quả được trả về dưới dạng dòng, bạn phải đặt phần các đoạn huỳnh huỳnh huỳnh 组装 thành JSON hoàn chỉnh, tái thực hiện.

## 概念

### 启用 song song

- **OpenAI。** `parallel_tool_calls: true`默认开启──设置为 `false`Có thể bắt buộc một loạt.
- **Anthropic。** Thông qua `disable_parallel_tool_use: false`实现 paralel () 条 3.5 及以上默认开启) 设置为`true`- Đúng rồi.
- **Gemini。**始终具备平行能力;`tool_config.function_calling_config.mode = "AUTO"`让 mô hình quyết định.

Khi công cụ có thứ tự phụ thuộc`create_file`Rồi rồi`write_file`(■ Một số thông tin được sử dụng để tiếp cận các thông tin khác, hoặc giới hạn tỷ lệ không thể chịu được sự phát tán, cấm song song 

### Tương quan ID

mô hình phát ra mỗi调用 có một`id`◊ host  trả lại mỗi kết quả đều phải chứa cùng một ID. Không có ID này, kết quả sẽ chứa không rõ.

- **OpenAI。**Mỗi bài viết về vai trò công cụ`tool_call_id`
- **Anthropic。**Mỗi người`tool_result`khối trên `tool_use_id`
- **Gemini。**Mỗi người`functionResponse` 上 的`id`(Thiên sinh 3 及以上;Thiên sinh 2 按名匹配,这会在同名的平行调用时出错)

### 并发运行 cuộc gọi

Người chủ 会在自己的线索、coroutine或远程工作者 上运行每个调用执行器──最简单的使用线索池;生产环境使用异步配合 配合 `asyncio.gather`Hoặc cấu trúc đồng thời.

Một lỗi thường thấy: theo danh sách gọi 顺序回复结果, thay vì theo hoàn thành顺序回复;;`tool_call_id`, nhưng nếu một kết quả bị mất hoặc lặp lại, các trình tự rắc rối sẽ làm cho việc kiểm tra trở nên khó khăn hơn.

### Các cuộc gọi của công cụ streaming

Khi mô hình 以 dòng 形式输出时,`arguments`会分片到达──三条行列电话的三条零分流 会在线上交错──你需要为每个ID 准备一个积累器──

按供应商的结构:

- **OpenAI。**Mỗi mảnh là`choices[0].delta.tool_calls[i].function.arguments`(câu phần) ⋅chunk 携带 `index`(call list 中的位置) ∼你按索引 累积,在 `id`Lần đầu tiên xuất hiện, đọc nó và `finish_reason = "tool_calls"`时解析 JSON。
- **Anthropic。**Các sự kiện phát sóng là `message_start`, rồi mỗi khối một .`content_block_start`,类型为`tool_use`(có chứa id、name、空 input)`content_block_delta`sự kiện 携带 `input_json_delta`Những mảnh nhỏ.`content_block_stop`关闭 mỗi khối.
- **Gemini。** `streamFunctionCallArguments`(Tình sinh 3 及以上)发出带 `functionCallId`Các đoạn, vì vậy các cuộc gọi có thể được thực hiện hoàn toàn.

### Phần JSON và phân tích sớm 陷

Trong `arguments`完整之前不能解析──像 `{"city": "Beng`Như vậy JSON một phần không phải là JSON hiệu quả, sẽ bỏ lỗi.`finish_reason = "tool_calls"`、Anthropic của `content_block_stop`, hoặc sự kiện cuối cùng của Gemini. Chỉ cần thử cho đến khi đó.`json.loads`更健壮的做法是使用增量 JSON parser,在结构完成时产出事件;OpenAI's streaming guide 推这种做法,用于展示实时 思维指标的 UX。 Brace-counting 作为完整性测试并不可靠(引用字符串或逃逸内容中的 braces会导致错误正面),只能作为非正式的调试异理学──

### Việc hoàn thành ngoài trật tự

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

host reply  vẫn phải trích dẫn id:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

Trong OpenAI hoặc Anthropic 上, trả lời trong thứ tự không ảnh hưởng đến sự chính xác.

### Điểm chuẩn: theo dõi đối với song song

`code/main.py`Trung 模拟三个执行器, độ trễ 分别为400、600 和 800 ms──Tỷ lệ trễ 运行总共需要1800 ms──Tỷ lệ trễ 运行需要max(400,600,800) =800 ms──差异是常量,而不是比例,所以节省会随着工具数量 增长──

Thực tế thế giới chú ý: cuộc gọi song song 会给下游 API 增加压力。 đối với dịch vụ giới hạn tốc độ thực hiện 10 路 fan-out 会失败。Phase 13 · 17 会覆盖 gateway level backpressure;retry semantics 计划放在未来阶段。

### Streaming fan-out của tường đồng hồ

Nếu mô hình tự mình xuất hiện dưới dạng stream, bạn có thể thực hiện lập tức ngay sau khi một cuộc gọi hoàn thành, thay vì tất cả các cuộc gọi đều hoàn thành. Đây là một loại tối ưu hóa được OpenAI ghi lại, nhưng không phải tất cả SDK đều bị lộ.


```figure
tp-parallel-fanout
```

## Sử dụng nó

`code/main.py`Có hai phần.`concurrent.futures.ThreadPoolExecutor`,顺序和并行运行三个模拟天气调用,并打印墙-clock time──第二部分回放一个假的流媒体响应,也就是在同一条流上交错的三个平行调用的`arguments`Các mảnh,并用 `StreamAccumulator`Không có LLM, không có mạng, chỉ có重组逻辑.

关注点:

- Thời gian theo trình độ đạt 1,8 giây. Thời gian song song trong cùng độ trễ giả.
- Bộ tích lũy thông qua bộ đệm id, và chỉ trong mỗi cuộc gọi của JSON 完整时解析, xử lý các đoạn rào rào đến.
- thực thi trong một số ID của các lập luận hoàn thành 后立即启动, thay vì như tất cả các dòng 结束。

## 交付 nó

本课会产出 `outputs/skill-parallel-call-safety-check.md` Đặt một danh sách công cụ, kỹ năng này 会审计 những công cụ có thể được song song, những gì có phụ thuộc đặt hàng, những gì sẽ áp suất  giảm giới hạn tốc độ,并 trả lại một với mỗi công cụ `parallel_safe`Đăng ký sửa đổi cờ:

## 练习

1. 运行 `code/main.py`并改变模拟延迟―― xác nhận tỷ lệ song song với trình tự 近似为`max/sum`(trực sự运行会因线程安排、序列化 和带 Overhead 而略偏离理想值)

2. 扩展蓄積器,处理 call bị hủy bỏ giữa dòng 情况:`cancelled`event── Which provider 明确 ghi lại tình huống này?`content_block_stop`语义和 OpenAI của `finish_reason: "length"`行为──

3. 用 `asyncio.gather`替换线程池──对两者做基准──你应该能看到异步 有小幅收益,因为成本换语境更低,但前提是执行者做真实I/O──

4. 选择两个不应对化的工具 (ví dụ:`create_file`Rồi rồi`write_file`(■)                                                                                                                                                                                                                                                              `ordering_dependency`biểu đồ,并 dựa trên biểu đồ này đối với fan-out song song làm cửa. Đây là cơ chế tối thiểu của lập trình phụ thuộc nhận thức, trong tương lai đại lý-kỹ thuật giai đoạn 会将其形式化.

5. 阅读 OpenAI's song song-phục-calling phần 和 Anthropic 的 `disable_parallel_tool_use`Docs. 找出 Anthropic 建议禁用平行主义的一个真实世界工具类型──(提示: đối với các đột biến hậu quả của cùng một nguồn lực──)

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Parallel tool calls | “一个 turn 里的 fan-out” | Model 在单个 assistant message 中发出多个 tool calls |
| `parallel_tool_calls` | “OpenAI 的 flag” | 启用或禁用 multi-call emission |
| `disable_parallel_tool_use` | “Anthropic 的反向开关” | Opt-out flag；默认启用 parallel |
| Tool call id | “Correlation handle” | 每次调用的标识符，result message 必须原样回显 |
| Accumulator | “Stream buffer” | 用于 partial `arguments` chunks 的 per-id string buffer |
| Out-of-order completion | “最快的先返回” | Parallel calls 以不可预测的顺序完成；ids 是粘合剂 |
| Dependency graph | “Ordering constraints” | 某些 tools 的输出会进入其他 tools 的输入；不能 parallelize |
| Parse-early trap | “JSON.parse 炸了” | 尝试解析不完整的 `arguments` string |
| `streamFunctionCallArguments` | “Gemini 3 feature” | 带有每次调用 unique id 的 streamed argument chunks |
| Completion-order reply | “不要等全部完成” | 结果一到就回复，并按 id 标记 |

## 延伸阅读

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) 默认行为和选择退旗
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use) `disable_parallel_tool_use`和 kết quả đợt đợt
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) Gọi song song liên quan đến ID của Gemini 3
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) OpenAI stream của các lập luận chia cắt tái lắp ráp
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming) 带 `input_json_delta`của `content_block_delta`
