# Claude Agent SDK:Subagents 和 Session Store

> Claude Agent SDK là Claude Code harness 库形态──Built-in tools──用于 ngữ cảnh cách ly của các subagents、hooks、W3C trace propagation、session store parity──Claude Managed Agents is for long-running async work──được sử dụng cho các hosted alternative方案──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## Học mục tiêu
- 解释 Antropic Client SDK(raw API) và Claude Agent SDK(con hình dây) giữa
- Mô tả các yếu tố phụ: tương đồng và cách ly ngữ cảnh,以及何时使用它们──
- Nói ra bề mặt cửa hàng phiên Python SDK của mình`append`- `load`- `list_sessions`- `delete`- `list_subkeys`) và `--session-mirror`
- 实现一个stdlib harness,包含内置工具、带隔离的背景的 subagent spawning、生命周期 hooks 和会议店──

## 问题
Raw LLM API chỉ cho bạn một lần đi lại và đi lại.

## 概念
### SDK khách hàng vs SDK đại lý

- **Client SDK (`anthropic`).**Raw Messages API──你自己负责循环──工具和状态──
- **Agent SDK (`claude-agent-sdk`).**Thiết lập trình thực hiện công cụ m m m m m m m c c kết nối ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc ốc   ốc ốc                                                                                                                                                     

### Công cụ tích hợp

SDK 开箱附附10+ công cụ: file read/write、shell、grep、glob、web fetch 等──Custom tools 通过标准工具-schema界面注册──

### Các bộ phận phụ

Anthropic đã ghi lại hai mục đích:

1. **Parallelization.**并发运行独立工作── Tìm tập tin thử nghiệm cho mỗi 20 mô-đun này 是 20 个 phụ nhiệm vụ song song song──
2. **Context isolation.**Các người phụ nữ sử dụng cửa sổ ngữ cảnh của riêng họ; chỉ có kết quả trả lại cho nhạc sĩ.

Các mục mới nhất gần đây của Python SDK:`list_subagents()``get_subagent_messages()`, để đọc các bản sao phụ thuộc.

### Tiệm bán phiên

Tương đương giao thức của TypeScript:

- `append(session_id, message)` 添加一个转
- `load(session_id)` 恢复 cuộc trò chuyện.
- `list_sessions()` 枚举──
- `delete(session_id)` 带有 đối với các phiên subagent của hàng loạt.
- `list_subkeys(session_id)` 列出 chìa khóa phụ

`--session-mirror`(CLI cờ) sẽ được xem trong dòng phát bản sao của nó vào các file bên ngoài, dễ dàng để gỡ lỗi.

### Chân

Bạn có thể đăng ký vòng đời gan:

- `PreToolUse`- `PostToolUse` cửa hoặc công cụ kiểm toán gọi 
- `SessionStart`- `SessionEnd` thiết lập và phá hủy.
- `UserPromptSubmit` Trong mô hình  xem thông tin của người dùng  trước khi hành động.
- `PreCompact` 在 ngữ cảnh thu nhỏ 之前运行。
- `Stop` Đại diện ra ngoài 时 làm sạch 
- `Notification` cảnh báo kênh bên cạnh。

Hooks là một phương pháp hỗ trợ dòng công việc (Phase 14 curriculum reference) và các hệ thống tương tự như vậy.

### W3C bối cảnh theo dõi

调用方上活跃的OTel spans 会通过W3C 追踪语境标题 传播到CLI phụ quy trình──整个多进程追踪 会在你的后台中显示为一个追踪──

### Claude quản lý các nhân viên

Hosted 替代方案(beta header `managed-agents-2026-04-01`❖ Làm việc đồng bộ lâu dài  Caching nhanh chóng tích hợp  Compaction tích hợp  Kiểm soát 换取 quản lý cơ sở hạ tầng 

### Mô hình này dễ dàng xuất hiện

- **Subagent over-spawn.**Vì 100 nhiệm vụ nhỏ sinh ra 100 phụ thuộc.
- **Hook creep.**Mỗi đội sẽ thêm các cái nát; thời gian khởi động 膨胀── mỗi mùa xem xét cái nát──
- **Session bloat.**Các phiên 持续累积;size 增长──使用 `list_sessions`+ Chính sách hết hạn.


```figure
ae-subagent-isolation
```

##  xây dựng nó
`code/main.py`用 stdlib 实现 hình dạng SDK:

- `Tool`- `ToolRegistry`, chứa tích hợp `read_file`- `write_file`- `list_dir`
- `Subagent` bối cảnh riêng tư, chạy riêng biệt, trả lại kết quả.
- `SessionStore` thêm, tải, list, xóa, list_subkey
- `Hooks` `pre_tool_use`- `post_tool_use`- `session_start`- `session_end`
- Một demo: đại lý chính đồng bộ sinh ra 3 个 phụ thuộc (đất cả đều tách biệt), tổng kết kết quả,并 tiếp tục phiên họp.

运行:

```
python3 code/main.py
```

Trace 会 hiển thị sự cô lập ngữ cảnh phụ (subagent context isolation)

## Sử dụng nó
- **Claude Agent SDK**Sử dụng để muốn hình dạng vòng xoáy Claude Code của sản phẩm Claude- đầu tiên.
- **Claude Managed Agents**用于 tổ chức công việc đồng bộ lâu dài.
- **OpenAI Agents SDK**(Dân học 16) được sử dụng cho các đối tác đầu tiên của OpenAI.
- **LangGraph + custom tools**Nếu bạn muốn một máy trạng thái hình đồ thị.

## 交付 nó
`outputs/skill-claude-agent-scaffold.md`会 scaffold một ứng dụng SDK Claude Agent, chứa các bộ phận phụ, nát, cửa hàng phiên, phần mềm máy chủ MCP và sự lây lan theo dõi W3C.

## 练习
1. 添加一个子弹器,把20 个任务批 成每组 5 个平行子弹器──衡量管弦器背景尺寸与每任务的对比──
2. 实现一个 `PreToolUse`Hook, đối với `write_file`gọi  tiến hành giới hạn tốc độ ((( mỗi phiên mỗi phút 5 lần)
3.  liên kết `list_subkeys`Cây cỏ có thể bị nhiễm trùng... Trẻ cỏ có thể có thể có thể làm gì?
4. Để trò chơi này trở thành thực sự.`claude-agent-sdk`Phạm vi Python. Việc đăng ký công cụ sẽ xảy ra gì?
5. 阅读 Claude quản lý đại lý docs──你什么时候会从自主主办的转换到管理的?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Code 的库形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 生产模式
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) tổ chức 替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) đối tác
