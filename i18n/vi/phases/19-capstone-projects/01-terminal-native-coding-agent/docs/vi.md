# Capstone 01  终端原生 Cử lý mã hóa

> Đến năm 2026, hình dạng của đại lý mã hóa đã được xác định. Một hệ thống TUI, một kế hoạch có trạng thái, một bề mặt công cụ được đóng hộp, một vòng lặp chịu trách nhiệm về kế hoạch, hành động, quan sát, phục hồi.

**类型：**Capstone
**语言：**TypeScript / Bun (hành), Python (như kịch bản cổ điển)
**先修要求：**Giai đoạn 11 (kỹ thuật LLM), Giai đoạn 13 (công cụ và giao thức), Giai đoạn 14 (nhà tác nhân), Giai đoạn 15 (hệ thống tự trị), Giai đoạn 17 (tế hạ tầng)
**覆盖阶段：**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：**35 小时

## 问题
Đến năm 2026, các đại lý lập mã đã trở thành chủ đạo AI  ứng dụng类别.  Claude Code (Anthropic)  Compounder 2 và Agent Tabs của Cursor 3 (Cursor)  AMP (Sourcegraph)  OpenCode (112k stars)  Factory Droids và Google Jules đều phát hành các biến thể khác nhau của cấu trúc giống nhau: một vòng dùng kết thúc  Một bề mặt công cụ có quyền hạn  Một hộp cát, cũng như một mô hình kế hoạch-chính sát vòng quanh biên giới                                                                                                                                                                                              

Bạn không thể hiểu được các đại lý này từ bên ngoài. Bạn phải tự xây dựng một vòng quan sát trong vòng 47 vì ripgrep.

## 概念
Vỏ có 4 bề mặt.**Plan**维护一个 TodoWrite 风格的状态对象, bởi mô hình Mỗi vòng viết lại**Act**分发 tool calls (đọc, chỉnh sửa, chạy, tìm kiếm, git)**Observe**捕获 stdout / stderr / exit codes, thực hiện cắt,并把摘要反回去──**Recover** xử lý lỗi công cụ, đồng thời tránh bùng nổ cửa sổ ngữ cảnh hoặc vòng lặp vô hạn.**hooks**`PreToolUse`- `PostToolUse`- `SessionStart`- `SessionEnd`- `UserPromptSubmit`- `Notification`- `Stop`, và`PreCompact` Đây là các điểm mở rộng có thể cấu hình, người vận hành có thể nhập vào trong đó chính sách, viễn thông và hàng rào.

sandbox sử dụng E2B hoặc Daytona。 mỗi nhiệm vụ đều trong một bộ chứa dev mới, chạy, và gắn trên một cây làm việc git có thể đọc được。những cây làm việc 永远不会 chạm vào hệ thống tệp chủ sở hữu。thành công hoặc thất bại sau đó tất cả sẽ bị phá hủy。 chi phí kiểm soát trong ba cấp độ bắt buộc: mỗi vòng Token 上限、 mỗi phiên 美元预算, cũng như cứng lượt hạn chế (thường là 50)。 lớp quan sát là sử dụng các quy ước OpenTelemetry của GenAI ngữ nghĩa,并 gửi đến tự lưu trữ Langfuse。

## 架构
```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 技术
- Thời gian chạy của vòng xoáy: Bun 1.2 + Ink 5 (Tình phản ứng trong đầu cuối)
- Mô hình 访问:OpenRouter 统一 API, hỗ trợ Claude Sonnet 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5(用于最难任务)
- Truyền công cụ: Mô hình giao thức ngữ cảnh StreamableHTTP (MCP 2026 sửa đổi)
- Sandbox: E2B sandbox (JS SDK) hoặc Daytona devcontainers
- Tìm kiếm mã: ripgrep subprocess, tree-sitter parsers cho 17 ngôn ngữ (đã được biên soạn)
- Tự ly: `git worktree add`cho mỗi nhiệm vụ, thanh toán về thành công / thất bại
- Eval harness: SWE-bench Pro (được xác minh) + Terminal-Bench 2.0 + 30 nhiệm vụ của riêng bạn
- Hình ảnh: OpenTelemetry SDK với `gen_ai.*`semconv → tự lưu trữ Langfuse
- Public Relations Posting: GitHub App Sử dụng token hạt mỏng, phạm vi  giới hạn trong mục tiêu repo


```figure
ce-agent-loop
```

##  xây dựng nó
1. **TUI and command loop.**搭建一个使用墨的 Bun 项目──接收 `agent run <repo> "<task>"`△打印一个分屏视图:计划面板(顶部) 、工具调用流(中部) 、Token budget(底部) △添加 Ctrl-C 取消逻辑,在退出前触发 `SessionEnd`- Đúng rồi.

2. **Plan state.**定义一个带类型的 TodoWrite schema(包含 pending / in_progress / done items 和 notes) ――model Mỗi vòng qua công cụ gọi 重写完整状态不要让它增量修改──将计划 持久化到`.agent/state.json`, như vậy sau khi sụp đổ có thể tiếp tục.

3. **Tool surface.**定义六个工具:`read_file`- `edit_file`(带 khác biệt xem trước),`ripgrep`- `tree_sitter_symbols`- `run_shell`(带 thời gian),`git`(status / diff / commit / push) ―― thông qua MCP StreamableHTTP 暴露,使 harness và vận chuyển 解── mỗi công cụ 都返回截断后的输出(每次调用最多4k Tokens)──

4. **Sandbox wrapping.**Mỗi nhiệm vụ đều khởi động một hộp cát E2B.`git worktree add -b agent/$TASK_ID`创建一个新分支. Tất cả các công cụ gọi đều trong sandbox.

5. **Hooks.**实现全部八种 2026 hook 类型──至少接入四个用户编写的 hooks:(a)`PreToolUse`Đường bảo vệ chỉ huy phá hủy, ngăn chặn cây làm việc bên ngoài `rm -rf`,(b) `PostToolUse`Tài khoản token, ((c) `SessionStart`khởi đầu ngân sách,`Stop`写入 cuối cùng của dấu vết gói.

6. **Eval loop.**Trình clone một phiên bản 30 SWE-bench Pro Python 子集── đối với mỗi vấn đề 运行你的 Harness──与迷你-swe-agent──最小基线)`eval/results.jsonl`

7. **Cost control.**硬性截断: 50 lượt 200k ngữ cảnh  mỗi nhiệm vụ là 5 đô la`PreCompact`Hook trong 150k 处将较早的转转 摘要为前状态块,为新观测 出空间,同时不丢失计划──

8. **PR posting.**Sau thành công, bước cuối cùng là`git push`, sau đó sử dụng GitHub API  mở một PR, và chính xác bao gồm kế hoạch và kết luận khác nhau.

## Sử dụng nó
```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## 交付 nó
kỹ năng được giao 位于 `outputs/skill-terminal-coding-agent.md`△ Đặt một đường repo và mô tả nhiệm vụ, nó sẽ hoạt động hoàn chỉnh trong vòng lặp kế hoạch-sự hành động-xem xét,并 quay lại URL PR và gói theo dõi △本 capstone:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## 练习
1. Để hỗ trợ mô hình từ Claude Sonnet 4.7 切换为运行在 vLLM 上的 Qwen3-Coder-30B──比较 pass@1 和 $-per-task──报告开放模型表现较差的地方──

2. 添加一个 `reviewer`Sub-agent, trong PR đăng 前读取 diff,并可以请求一个修订循环──衡量错误积极评论 是否会让SWE-bench pass rate 低于单代理基线(提示:通常会)。

3. 压测 sandbox:编写一个尝试 `curl`Nhiệm vụ của URL bên ngoài, cũng như một nỗ lực viết vào cây làm việc bên ngoài Nhiệm vụ của Bộ.

4. Sử dụng mô hình nhỏ hơn (Haiku 4.5) 实现 `PreCompact`Kết luận: ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

5. Để chuyển MCP StreamableHTTP 替换为studio。Benchmark cold-start 和 per-call latency。为本地-only 使用选择胜者。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | “agent loop” | 围绕 model 的代码，负责分发 tools、维护 plan state，并强制执行 budgets |
| Hook | “Agent event listener” | 由 harness 在八种 lifecycle events 之一上运行的用户编写脚本 |
| Worktree | “Git sandbox” | 位于独立路径的 linked git checkout；可以丢弃而不触碰 main clone |
| TodoWrite | “Plan state” | model 每轮都会重写的 typed list，包含 pending/in-progress/done items |
| StreamableHTTP | “MCP transport” | 2026 MCP revision：具备双向 streaming 的 long-lived HTTP connection；取代 SSE |
| Token ceiling | “Context budget” | 对 input+output Tokens 设置的每轮或每 session 上限；触发 compaction 或 termination |
| pass@1 | “Single-attempt pass rate” | SWE-bench tasks 在第一次运行中解决的比例，不包含 retry 或 test-set peeking |

## 延伸阅读
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) Từ Anthropic của vòng xoắn tham chiếu
- [Cursor 3 changelog](https://cursor.com/changelog) Thuốc Tabs 和 Composer 2 ghi chú sản phẩm
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) Sử dụng so sánh sợi dây ghế SWE-đường cơ sở tối thiểu
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) Sử dụng Opus 4.5 trên SWE-bench được xác minh lên đạt 79,2%
- [OpenCode](https://opencode.ai) Vỏ mở, 112k ngôi sao
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本 đáy cuối 面向的评估
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) StreamableHTTP,metadata khả năng
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) tool call 和 Tích sử dụng của schema span
