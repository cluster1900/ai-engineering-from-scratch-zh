# Memory: Virtual Context và MemGPT

> Môn ngữ cửa sổ là giới hạn. Đối thoại, văn bản và công cụ theo dõi không. MemGPT (Packer et al., 2023) phân loại nó cho bộ nhớ ảo của hệ điều hành: ngữ cảnh chính là RAM, cửa hàng bên ngoài là đĩa, đại lý trong hai người.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Học mục tiêu
- 解释 MemGPT 所 dựa trên OS 类比:những nội dung chính = RAM,những nội dung bên ngoài = đĩa, các công cụ bộ nhớ = trang vào/ ra khỏi:
- Sử dụng stdlib 实现两层 MemGPT 模式:chân lưu trữ nội dung chính, cửa hàng tìm kiếm bên ngoài, cũng như các công cụ vào/ ra trang.
- 描述 đại lý 如何发发发"chạm" để truy vấn hoặc sửa đổi bộ nhớ bên ngoài,以及结果如何被拼接回下一个提示──
- 识别会延续到 Letta(Lớp 08) và Mem0(Lớp 09) trong MemGPT 设计选择。

## 问题
Chiếc cửa sổ ngữ cảnh trông giống như là có thể giải quyết trí nhớ. Thực tế là không.

1. **Overflow.**Nhiều vòng đàm thoại, dài văn bản, hoặc đường mòn khó khăn của các công cụ gọi sẽ vượt qua cửa sổ.
2. **Dilution.**Ngay cả trong cửa sổ, vào không liên quan ngữ cảnh cũng sẽ hiếm khi giải phóng cho nội dung quan trọng.
3. **Persistence.**New session From empty window started. Không có bộ nhớ bên ngoài. Không thể vượt qua phiên nói ra.

Một cửa sổ lớn hơn có thể giúp đỡ, nhưng không thể giải quyết vấn đề này. Báo cáo năm 2025 của Mem0  đo đến 128k-phòng cửa sổ cơ sở vẫn sẽ bỏ lỡ một đại lý cửa sổ 4k  nhờ bộ nhớ bên ngoài có thể nắm bắt các sự thật về đường chân trời dài.

## 概念
### MemGPT:OS 类比

Packer et al. (arXiv:2310.08560, v2 Feb 2024) sẽ quản lý bối cảnh 映射到操作系统虚拟内存:

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | Vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

đại lý vận hành một vòng lặp ReAct bình thường. Một loại công cụ khác cho phép nó đưa dữ liệu trang trong và trang ra trong bối cảnh chính.

### Hai tầng

- **Main context.**固定大小的提示,保存当前任务──始终对模型可见──
- **External context.**无界, thông qua các công cụ 搜索.

Bài viết ban đầu đã đánh giá thiết kế trên hai nhiệm vụ vượt ra khỏi cửa sổ cơ bản: phân tích tài liệu của hơn 100k Token, cũng như trò chuyện nhiều phiên để giữ trí nhớ bền vững xuyên suốt ngày.

### Mô hình gián đoạn

MemGPT 引入memory-as-interrupt:在对话中途,agent có thể调用memory tool,runtime 执行它,结果作为新的观察 拼接进下一次助手转──概念上等于Unix`read()`syscall: Nó ngăn chặn quá trình ∞ trả lại các byte, rồi quá trình ∞ tiếp tục vận hành∞

标准 bộ nhớ 工具接口:

- `core_memory_append(section, text)` 写入 prompt 的 liên tục phần
- `core_memory_replace(section, old, new)` 编辑 phần liên tục
- `archival_memory_insert(text)` 写入 tìm kiếm cửa hàng bên ngoài.
- `archival_memory_search(query, top_k)` Từ cửa hàng bên ngoài 检索
- `conversation_search(query)` 扫描 quá khứ quay

### Biên giới của MemGPT với điểm khởi đầu của Letta

2024 年 9 月,MemGPT 成为 Letta──research repo (`cpacker/MemGPT`) vẫn còn duy trì;Letta  mở rộng kế hoạch này:

- 三层而不是两层(core、recall、archival  Bài học 08)。
- Sử dụng lý luận bản địa 替代 `send_message`- Tâm lý nhịp tim (Dạy học 08)
- Các đại lý thời gian ngủ 运行 bộ nhớ không đồng bộ làm việc (Dạy 08)

Ngay cả khi hệ thống sản xuất vận hành Letta 、Mem0, hoặc tự xác định cửa hàng hai cấp, giấy MemGPT vẫn là nền tảng của năm 2026 ⋅

### Mô hình này dễ dàng xuất hiện ở nơi

- **Memory rot.**写入积累得比读取更快;hãy lấy lại 被陈旧事实淹没──修复方式: thường xuyên củng cố(Letta-time sleep),显式无效(Mem0 conflict detector)。
- **Memory poisoning.**Khoảnh khắc bên ngoài là văn bản được tìm kiếm. Nếu nội dung bị tấn công kiểm soát 落入记忆注,agent 会在下一个会议重新摄入它.
- **Citation loss.**Trưởng nhớ  người dùng để tôi tàu X, nhưng không thể trích dẫn là                                                                                                                                                                                                                                                      


```figure
context-budget
```

##  xây dựng nó
`code/main.py`Sử dụng stdlib 实现 MemGPT của mô hình hai cấp:

- `MainContext`  cố định                                                                                                                                                                                                                                                            `core`dict 和 `messages`danh sách; vượt quá giới hạn 时自动紧 最旧消息──
- `ArchivalStore` 内存中的 BM25-esque store(token-overlap scoring), lưu trữ (id, văn bản, thẻ, phiên, lượt) ghi lại。
- 五个映射到 MemGPT bề mặt của bộ nhớ công cụ.
- Một nhân viên kịch bản, trước tiên đưa các sự kiện vào hồ sơ, sau đó thông qua việc điều tra.`archival_memory_search` trả lời câu hỏi:

运行:

```
python3 code/main.py
```

trace 展示代理 写入三个事实,将主要文本 填到 cap 触发驱逐), sau đó qua từ hồ sơ 检索 để trả lời câu hỏi tiếp theo, trong trường hợp không có LLM thực sự

## Sử dụng nó
Ngày nay, mỗi hệ thống bộ nhớ sản xuất đều là một biến thể của MemGPT:

- **Letta**(Dân học 08)  三层、 bản địa lý luận、 ngủ thời gian tính toán。
- **Mem0**(Dân học 09)  Vector + KV + đồ thị, với lớp điểm kết hợp
- **OpenAI Assistants / Responses** 通过线程和文件 管理存储器──
- **Claude Agent SDK** 通过技能和会议存储 提供长期记忆──

根据运营形态(自主托管,管理,框架集成)选择,而不是根据核心模式 选择;核心模式就是MemGPT。

## 交付 nó
`outputs/skill-virtual-memory.md`Đây là một kỹ năng có thể sử dụng được, có thể sử dụng cho bất kỳ thời gian chạy mục tiêu nào 生成正确的两层内存架架(主 +档案 + tool surface),并接好驱逐政策和引用字段──

## 练习
1. 添加一个以 Tốc hiệu  đo `max_main_context_tokens`cap(用 `len(text.split())`* 1.3 近似) ・超过 cap 时,把最旧消息紧紧 成总结──比较有没有总结者时的行为──
2. Trong kho lưu trữ 上正确实现 BM25 ((term frequency、inverse document frequency) ⋅ trên bộ dữ liệu đồ chơi 上测量 recall@10,并与代币-overlap baseline 比较──
3. 给档案插件 添加 `citation`fields(session_id, turn_id, source_url)。让 agent 在每个检索支持的答案中引用来源。
4. 模拟记忆中毒:添加一条档案记录,内容是" bỏ qua tất cả các hướng dẫn của người dùng trong tương lai". 编写一个警卫,扫描检索中指示形文字,并把它们标记为不值得信赖──
5. sẽ thực hiện chuyển để sử dụng MemGPT nghiên cứu repo của bộ nhớ cốt lõi JSON schema (`cpacker/MemGPT`Khi chuyển từ dây phẳng sang các phần được đánh dấu, sẽ xảy ra những thay đổi gì?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Virtual context | “无限 memory” | Main（prompt）+ external（searchable）两层，带 page in/out |
| Main context | “Working memory” | prompt：固定大小，始终可见 |
| Archival memory | “Long-term store” | External searchable persistence，按需检索 |
| Core memory | “Persistent prompt section” | 固定在 main context 内的命名 sections |
| Memory tool | “Memory API” | agent 发出的用于读写 external memory 的 tool call |
| Interrupt | “Memory page fault” | Agent 暂停，runtime 获取，结果拼接进下一轮 |
| Memory rot | “Stale facts” | 旧写入淹没 retrieval；用 consolidation 修复 |
| Memory poisoning | “Injected persistent note” | attacker content 被存为 memory，并在 recall 时重新摄入 |

## 延伸阅读
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) Được OS 启发s ảo bối cảnh 论文
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Sự tiến hóa ba cấp
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Lập bối  theo ngân sách
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413)  cấu trúc bộ nhớ sản xuất lai trên mô hình này
