# Khóa bộ nhớ và tính toán thời gian ngủ (Letta)

> MemGPT vào năm 2024 trở thành Letta. Sự tiến triển năm 2026 đã kết hợp hai ý tưởng: mô hình có thể trực tiếp chỉnh sửa các khối bộ nhớ chức năng phân tán, cũng như đại lý thời gian ngủ của bộ nhớ trong đại lý chính 空时异步整合记忆. Đây là cách để mở rộng trí nhớ ra ngoài cuộc trò chuyện đơn lẻ.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## Học mục tiêu
- Nói ra Letta sử dụng của ba tầng nhớ (core, recall, archive) và mỗi tầng của tác dụng.
- 解释 mô hình khối bộ nhớ: khối người, khối người, cũng như khối được xác định bởi người dùng của các đối tượng được đánh dấu như vậy.
- Mô tả về tính toán thời gian ngủ, tại sao nó nằm ngoài đường quan trọng, và tại sao nó có thể hoạt động hơn so với các đại lý chính mô hình mạnh hơn.
- Thực hiện một vòng lặp hai đại lý văn bản hóa, trong đó đại lý chính cung cấp phản ứng, đại lý thời gian ngủ trong các vòng kết hợp các khối.

## 问题
MemGPT (Dạy học 07) giải quyết dòng chảy kiểm soát bộ nhớ ảo. Sau đó, có ba vấn đề sản xuất:

1. **Latency.**Mỗi hoạt động bộ nhớ đều nằm trên đường quan trọng. Nếu đại lý phải cắt, tổng kết hoặc điều chỉnh trong thời gian chờ người dùng, thời gian trễ đuôi sẽ tăng lên nhanh chóng.
2. **Memory rot.**写入会不断积累――被矛盾推翻的事实会留下――检索会被陈旧内容淹没――
3. **Structure loss.**平的档案库 无法表达Human block 总是在提示中;Persona block 总是在提示中;Task block 按会议交换──

Letta (letta.com) là phiên bản viết lại năm 2026:

## 概念
### Ba tầng

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | 始终可见 | 在 main prompt 内 | Agent tool call + sleep-time rewrites |
| Recall | 对话历史 | 可检索 | 自动轮次日志 |
| Archival | 任意事实 | Vector + KV + graph | Agent tool call + sleep-time ingest |

Core là MemGPT core。Remember là talk buffer 及其被驱逐的尾部。Archival là store bên ngoài。This split cleared MemGPT's two layers重载。

### Các khối bộ nhớ

Block là tầng cốt lõi trong một phần được gõ, liên tục, có thể chỉnh sửa.

- **Human block** 关于用户的事实(姓名、角色、偏好、目标)
- **Persona block** ý tưởng về bản thân của đại lý (身份、语气、约束)

Letta sẽ biến nó thành các khối được xác định bởi người dùng tùy chọn: dùng cho mục tiêu hiện tại `Task`khối, sử dụng cơ sở mã thực tế `Project`khối, dùng cho các khối cứng`Safety`Mỗi khối đều có`id``label``value``limit`(字符上限)`description`(让模型知道何时编辑它)

Các khối có thể qua bề mặt công cụ 编辑:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)`                                                                                                                                                                                                                                                              

### Lượng ngủ

2025 年 Letta 的新增项: 在后台运行第二个代理,位于关键路径外──睡眠时间代理处理对话录和代码库文本,将`learned_context`写入共享块,并整合或作废档案记录──

Các thuộc tính được nhận được từ:

- **No latency cost.**Đáp lại chính ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇
- **Stronger model allowed.**Máy tác dụng thời gian ngủ có thể đắt hơn, chậm hơn, vì nó không bị trễ.
- **Natural consolidation window.**Khi người dùng không chờ đợi, thực hiện de重、总结、作废矛盾事实──

Chế độ này phù hợp với cách làm việc của con người: Bạn hoàn thành nhiệm vụ, ngủ, nhớ dài trong đêm.

### Letta V1 với lý luận nguyên sinh

Letta V1 (`letta_v1_agent`, 2026)  bỏ qua `send_message`/những nhịp tim và trong đường thẳng `Thought:`Các mã thông báo, chuyển và hỗ trợ lý luận bản địa. Đáp ứng API (OpenAI) 和带延伸思维的消息 API (Anthropic) 会在单独的频道上发出推理,并跨轮次传递(在生产中跨供应商加密)  Luồng kiểm soát vẫn là ReAct.

### Mô hình này dễ dàng xuất hiện ở nơi

- **Block bloat.**无限 `block_append`会很快触及限度──在会导致超出帽的写入前接入块总结──
- **Silent drift.**Trưởng thức thời gian ngủ đã viết lại khối, còn đại lý chính từ chưa chú ý.
- **Poisoned consolidation.**Đặc vụ thời gian ngủ sẽ xử lý nội dung có thể tiếp xúc của kẻ tấn công vào lõi. Bài học 27 cũng áp dụng cho bề mặt thời gian ngủ.


```figure
memory-blocks
```

##  xây dựng nó
`code/main.py`实现:

- `Block` id、label、value、limit、description──
- `BlockStore` CRUD + `near_limit(label)`người giúp đỡ.
- Hai nhân viên viết văn`PrimaryAgent`服务一个轮次,`SleepTimeAgent`Trong vòng giữa các sự kết hợp.
- Một đoạn truyện, trình bày bao gồm các đoạn văn của các bài viết, cũng như một đoạn văn về thời gian ngủ, nó kết thúc một đoạn văn và hủy bỏ một câu chuyện cũ.

运行:

```
python3 code/main.py
```

Bản sao  thể hiện sự phân chia này: chuyển đổi chính 快并产生原始写入; ngủ qua 负责压缩和清理。

## Sử dụng nó
- **Letta**(letta.com) 作为参考实现──可自主托管或使用管理云──
- **Claude Agent SDK skills** kỹ năng là một cái tên, có phiên bản, có thể kiểm tra các hướng dẫn khối, đại lý có thể tải lên.
- **Custom builds**适用于希望控制存储后端的团队──使用Letta API hợp đồng,以便后续迁移──

## 交付 nó
`outputs/skill-memory-blocks.md`Lập thành một hệ thống khối hình Letta, với các cái nón thời gian ngủ, bao gồm các quy tắc an toàn và dây dẫn trích dẫn.

## 练习
1. 添加一个 `block_summarize`công cụ:当 `near_limit`返回 true 时, sử dụng mô hình tạo tổng kết 替换 block value──哪个触发值能同时最小化总结调用 和 block overflow?
2. Trong lưu trữ trên thực hiện thời gian ngủ dedup: văn bản của hai bản ghi có > 90% token chồng chéo 时折叠为一个.
3. 为 khối 加版本. Mỗi lần ghi lại đều ghi lại giá trị cũ và khác biệt.`block_history(label)`, để các nhà điều hành có thể điều tra vì sao đại lý quên X──
4. Để xem các đại lý thời gian ngủ như những nhà văn không tin cậy. Khi chúng chạm vào Persona hoặc Safety block, gửi trước yêu cầu đánh giá đại lý thứ hai.
5. sẽ được chuyển thể ví dụ để sử dụng Letta API (`letta_v1_agent`()  Bạch sơ đồ có gì thay đổi, lý luận bản địa  làm thế nào để thay đổi hình dạng dấu vết?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory block | “可编辑的 prompt section” | Core memory 中 typed、persistent、LLM-editable 的 segment |
| Human block | “用户记忆” | 关于用户的事实，固定在 core 中 |
| Persona block | “Agent 身份” | Self-concept、语气、约束，固定在 core 中 |
| Sleep-time compute | “异步记忆工作” | 第二个 agent 在 critical path 之外执行整合 |
| Core / Recall / Archival | “层级” | 三层记忆拆分：始终可见 / 对话 / external |
| Block limit | “上限” | 每个 block 的字符限制；迫使进行 summarization |
| Native reasoning | “Thinking channel” | Provider-level reasoning output，而不是 prompt-level `Thought:` |
| Learned context | “Sleep output” | Sleep-time agent 写入 shared blocks 的事实 |

## 延伸阅读
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Mô hình khối
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) 异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) 原生 lý luận 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 起源
