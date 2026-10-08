# Nhóm trò chuyện và chọn người nói

> AutoGen GroupChat và AG2 GroupChat trong N 个代理 之间共享一个对话; một bộ chọn 函数LLM、round-robin hoặc custom) chọn người phát biểu tiếp theo. Đây là mô hình của cuộc trò chuyện đa đại lý nổi lên: đại lý không biết mình trong biểu đồ tĩnh, chúng chỉ phản ứng với bể chia sẻ. GroupChat của AutoGen v0.2 được giữ lại trong AG2 fork; AutoGen v0.4 sẽ được viết lại cho mô hình diễn viên dựa trên sự kiện.

**类型：**Học tập + xây dựng
**语言：**Python (stdlib)
**前置条件：**Giai đoạn 16 · 04 (Tình mẫu sơ khai)
**时间：**~ 60 phút

## 问题

Khi workflow 已知时,静态图表(LangGraph) rất tốt. Cuộc trò chuyện thực sự không phải là静态: đôi khi coder sẽ hỏi nhà phê bình, đôi khi hỏi nhà nghiên cứu, đôi khi hỏi nhà văn.

Đó là điều mà AutoGen GroupChat đã làm.

## 概念

### 形状

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

Mỗi đại lý đều có thể nhìn thấy mỗi tin nhắn. Mỗi vòng đều sẽ gọi một chức năng chọn để chọn người phát biểu tiếp theo.

### 三种选择器 风格

**Round-robin。**固定循环──确定性──按N 线性扩展,但会忽略上下文: ngay cả khi đề tài là kiểm tra pháp luật, lập trình cũng sẽ nhận được lượt次──

**LLM-selected。**调用 một LLM, nó đọc nội dung gần đây nhất và trả lại cho người phát biểu tiếp theo thích hợp nhất.

**Custom。**Một hàm Python, chứa bất kỳ logic nào bạn muốn.

### ConversableAgent API

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`持有选择者──当一个代理──完成一轮后,经理会调用选择者,选择者 返回下一个代理──循环持续到满足终止条件──

### 终止

三种常见模式:

- **Max rounds。**Đối với số lần chung đặt giới hạn cứng.
- **"TERMINATE" token。**Các đại lý có thể gửi một tin nhắn; người quản lý dừng lại khi nó xuất hiện.
- **Goal-reached check。**Một trình xác minh khối lượng nhẹ mỗi vòng chạy một lần, và trò chuyện kết thúc khi dừng lại.

### AutoGen → AG2 分裂, cũng như Microsoft Agent Framework 合并

Đầu năm 2025, Microsoft bắt đầu viết lại một loạt các mô hình diễn viên dựa trên sự kiện cho AutoGen (v0.4) để cộng đồng sẽ GroupChat 语义 fork của AutoGen v0.2 cho AG2, giữ lại API đã được tích hợp của người sử dụng sớm.

Vào tháng 2 năm 2026, Microsoft tuyên bố AutoGen sẽ bước vào mô hình bảo trì, mô hình diễn viên dựa trên sự kiện 会合并到**Microsoft Agent Framework**(RC 2026 年 2 月,现在已与语义核心合并) ――GroupChat 概念在两条路线中都保留下来;实现细节不同──对于兼容 v0.2 的代码,AG2 là lựa chọn đầu tiên trên dòng chảy──

### 什么时候适合 

- **Emergent conversations。**Anh không muốn được kết nối trước với người phát ngôn tiếp theo của mọi người.
- **角色混合任务。**Coder hỏi nhà nghiên cứu, nhà nghiên cứu hỏi thám tử, thám tử 再问回编码──流程不是DAG──
- **探索式问题解决。**Hãy tưởng tượng 头脑风暴会议, chứ không phải 流水线──

### 什么时候会失败

- **严格确定性。**Người chọn LLM có thể không phù hợp.
- **Sycophancy cascades。**Các đại lý sẽ tuân theo những người tự tin nhất.
- **Context bloat。**Mỗi đại lý sẽ đọc mỗi bài; 10 vòng sau bối cảnh sẽ rất lớn.
- **Hot speakers。**Một đại lý vì chọn  ưu tiên chuyên长 và chủ đạo cuộc trò chuyện  sẽ cân bằng loa  như tính năng chọn  giới thiệu

### Nhóm trò chuyện với người giám sát

Tương tự như nguyên thủy, khác nhau:

- Giám sát viên: một đại lý 规划,其他代理 执行;;
- Group chat: tất cả các đại lý đều là đồng nghiệp; chọn là một hàm đóng vai trò trong nhóm chia sẻ.

两者都使用课04 中的四个原始人──群聊默认使用LLM-selected orchestration 和 full-pool shared state──


```figure
swarm-speaker
```

##  xây dựng nó

`code/main.py`Sử dụng các chương trình từ zero thực hiện một GroupChat.`TERMINATE`token của kết thúc.

Bản demo sẽ in bản sao cuộc trò chuyện của hai biến thể và dấu vết quyết định của người chọn.

运行:

```
python3 code/main.py
```

## Sử dụng nó

`outputs/skill-groupchat-selector.md`会为给定任务配置 GroupChat chọn:round-robin vs LLM-selected vs custom, cũng như để sử dụng những đầu vào của chọn ((bản thư gần đây, đặc biệt của đại lý, số lượt) 👇

##  phát hành nó

Danh sách kiểm tra:

- **Max rounds cap。**始终需要──典型任务为 10-20──
- **Speaker-balance metric。**Theo dõi mỗi đại lý của các lần quay; khi không cân bằng vượt quá giá trị của thời gian báo cáo.
- **Termination token。** `TERMINATE`hoặc đặc biệt là đại lý xác minh.
- **Projection 或 scoped memory。**Sau đó, hãy nghĩ rằng chỉ cần cho mỗi nhân viên một tầm nhìn có phạm vi, để ngăn chặn tình trạng bùng nổ.
- **Selector logging。**Đối với các biến thể được chọn trong LLM, đồng thời ghi lại sự nhập và lựa chọn của người chọn.

## 练习

1. 运行 `code/main.py`❖ So sánh cuộc nói chuyện vòng tròn với các LLM được chọn
2. Trong lựa chọn, bạn có thể thêm một bài viết về "Max-speaks-per-agent" quy tắc.
3. 实现目标终止:当评论员 返回"批准"时停止――它在圆顶之前触发的频率是多少?
4. 阅读 AutoGen stable doc 中关于 GroupChat 的内容(https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager`Sử dụng bộ chọn tùy chọn:
5. 阅读 AG2 repo(https://github.com/ag2ai/ag2），并将其V0.2 GroupChat với v0.4  phiên bản dựa trên sự kiện đối với v0.4  đã tăng thêm những đặc tính cụ thể nào?

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | "Who talks next" | 选择下一个 agent 的函数。Round-robin、LLM-selected 或 custom。 |
| GroupChatManager | "The meeting host" | 拥有 selector 并循环处理轮次的 AutoGen component。 |
| ConversableAgent | "The base agent" | AutoGen base class；一个可以发送和接收 messages 的 agent。 |
| Termination token | "The 'stop' word" | 结束 chat 的 sentinel string（通常是 `TERMINATE`）。 |
| Hot speaker | "One agent dominates" | selector 不断选择同一个 agent 的 failure mode。 |
| Context bloat | "Pool grows unbounded" | 每个 agent 都读取所有先前 message；context 随轮次增长。 |
| Projection | "Scoped view" | 面向角色的共享池视图，用于防止 context bloat。 |

## 延伸阅读

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) Thực hiện tham chiếu
- [AG2 repo](https://github.com/ag2ai/ag2) 社区延续的 AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) 合并后的继任者,RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) Đánh giá sự kiện người diễn viên mẫu 重写细节
