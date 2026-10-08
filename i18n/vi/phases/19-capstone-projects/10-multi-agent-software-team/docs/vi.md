# Capstone 10  Nhóm Kỹ thuật phần mềm đa đại lý

> SWE-AF's factory 架构、MetaGPT's role-based prompting、AutoGen 0.4's typed actor graph、Cognition of Devin, cũng như Factory's Droids, đều trong năm 2026 nhận được cùng một hình dạng: kiến trúc sư chịu trách nhiệm lập kế hoạch,N 个 lập trình viên trong các đồng bộ làm việc trong các công ty, nhà phê bình chịu trách nhiệm cổng, kiểm tra viên chịu trách nhiệm kiểm chứng;; đồng bộ làm việc  chuyển đổi tường thành thông qua chia sẻ trạng thái và giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

## 问题
单代理编码利用在大型任务上会碰到上限──原因不是任何单个代理 很弱,而是200k-Token context 无法同时容纳建筑规划、四个并行代码基础片、评论员评论和测试输出──多代理工厂 会拆分问题:建筑师 负责规划,编码者 在并行工作树中负责实现,评论员 负责门,测试员 负责验证──SWE-AF "工厂"架构、MetaGPT 角色、AutoGen's typed actor graph,这三种框架描述的是同样的形态──

bề mặt thất bại là giao nộp. Architek đã lập kế hoạch cho các lập trình viên không thể thực hiện được. Các lập trình viên tạo ra sự xung đột lẫn nhau.

## 概念
Vai trò là các đại lý được đánh dấu.**Architect**(Claude Opus 4.7) 读取 issue,编写 plan,并将其分为带有显式界面的子任务──**Coders**(Claude Sonnet 4.7,N 个并行实例, mỗi instance trong một `git worktree`+ Daytona sandbox 中) 独立实现 phụ trách。**Reviewer**(GPT-5.4) 读取合并后的差异,并批准或请求具体修改──**Tester**(Gemini 2.5 Pro) Trong phòng thử nghiệm trong môi trường tách biệt,并 sử dụng các vật liệu  báo cáo vượt qua/ thất bại.

通信通過共享任務板 (通信通過共享任務板) 文件支援或 Redis) 完成──每角色 消费它被允许处理的任务──Handofs là các thư kiểu A2A-protocol──协调问题包括:

Sự tăng cường mã thông báo là hidden cost── mỗi giới hạn vai trò sẽ tăng các lời nhắc tổng kết và bối cảnh giao dịch── một vòng 40 lần chạy một đại lý sẽ biến thành 160 lần tổng cộng của bốn vai trò── rubric 会特别权衡 mã thông báo hiệu quả với cơ sở đơn vị, vì vấn đề không phải là đa đại lý có hiệu quả, mà là liệu nó có dựa trên mỗi USD tính toán hơn ‖

## 架构
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术
- Phân phối: LangGraph với trạng thái chung + các tiểu biểu đồ mỗi đại lý
- Thông điệp: A2A giao thức (Google 2025) cho các tin nhắn giữa các đại lý được gõ
- Mô hình: Opus 4.7 (kiến trúc sư), Sonnet 4.7 (coder), GPT-5.4 (đánh giá), Gemini 2.5 Pro (tử nghiệm)
- Tránh cách ly cây làm việc: `git worktree add`mỗi coder + Daytona sandbox
- Điều phối viên hợp nhất: hợp nhất ba chiều tùy chỉnh + giải quyết xung đột do LLM trung gian
- Eval: SWE-bench Pro (50 số), kịch bản SWE-AF, HumanEval++ cho các thử nghiệm đơn vị
- Sự quan sát: Langfuse với phạm vi đóng vai trò, kế toán token cho mỗi đại lý
- Việc triển khai: K8s, mỗi vai trò một lập lập triển khai,并 dựa trên backlog  cấu hình HPA


```figure
ce-team-handoff
```

##  xây dựng nó
1. **Task board.**JSONL được hỗ trợ bằng tệp, chứa các tin nhắn được gõ:`plan_request``subtask``diff_ready``review_needed``test_needed``approved``rejected``replan_needed`❖ Các đại lý 订阅 tags。

2. **Architect.**读取 GitHub issue, sử dụng Opus 4.7, yêu cầu giao diện phụ trách rõ ràng (触及文件、公共功能、测试影响) 发出包含子任务 DAG 的`plan_request`

3. **Coders.**N 个 走工, mỗi công nhân từ hội đồng quản trị Trung yêu cầu một nhiệm vụ phụ. Mỗi công nhân bắt đầu một nhiệm vụ mới.`git worktree add`và một chiếc hộp cát Daytona.`diff_ready`

4. **Merge coordinator.**Khi tất cả các lập trình viên hoàn thành, sẽ có N 个 chi nhánh qua hợp nhất ba chiều 合并到阶段 branch.

5. **Reviewer.**GPT-5.4 读取合并后的差异──不能批准它自己编写的差异──发出 `approved`(no-op) hoặc có yêu cầu thay đổi cụ thể của `review_feedback`,并路由回相关编码器──

6. **Tester.**Gemini 2.5 Pro trong hộp cát sạch 中运行测试套装──捕获文物──发发带有堆的 `test_passed`Hoặc`test_failed`◊ thất bại thử nghiệm vòng quay trở lại để có một bộ mã hóa của tác vụ phụ thất bại.

7. **Handoff accounting.**Mỗi条跨越角色界的消息 都会在 Langfuse中获得一个跨度,记录有效载量和使用的模型――计算每个子任务的代码放大(coder_tokens + review_tokens + tester_tokens + architect_share / coder_tokens) ⋅

8. **Eval.**Trong 50 phiên bản SWE-bench Pro 上运行──将 pass@1 和 $-per-solved-issue với một đại lý cơ bản(một Sonnet 4.7, trong một cây làm việc đơn lẻ)

9. **Post-mortem.**Đối với mỗi vấn đề thất bại, nhận ra việc giao giao thất bại (Histogram Handoff-Failure).

## Sử dụng nó
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## 交付 nó
`outputs/skill-multi-agent-team.md`Được phân phối. Được xác định một vấn đề URL và trình độ song song, nhóm này sẽ tạo ra một PR sẵn sàng để hợp nhất,并 cung cấp kế toán mã thông báo cho mỗi vai trò.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## 练习
1. Trong quá trình vận hành, bạn có thể nhận được một lỗi rõ ràng.`return None`(■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

2. 减少到两个编码器 (của kiến trúc sư +编码器 + kiểm tra viên + kiểm tra viên,编码器 顺序运行两个子任务) ――比较墙-钟 和通过率――

3. Sử dụng hạn chế người viết đơn  thay đổi điều phối viên hợp nhất  phụ trách 触及不相交的文件集) 量建筑师的规划负担

4. Từ GPT-5.4 换 thành Claude Opus 4.7 ⋅ đo tỷ lệ chấp thuận sai và chi phí token delta

5. 添加第五个角色:documenter (Haiku 4.5) ・ review 之后, nó sẽ tạo ra mục nhập log thay đổi。 đo lường chất lượng tài liệu liệu liệu liệu có đáng chi tiêu token bổ sung không。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) Lập thực hiện liên quan đến nhà máy đa đại lý năm 2026
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) Khung tâm đa tác nhân dựa trên vai trò
- [AutoGen v0.4](https://github.com/microsoft/autogen) Microsoft của khung diễn viên kiểu chữ
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai)  Một sản phẩm khác
- [Google A2A protocol](https://developers.google.com/agent-to-agent) thông tin nhắn giữa các đại lý
- [git worktree documentation](https://git-scm.com/docs/git-worktree) Substrate cách ly
- [SWE-bench Pro](https://www.swebench.com) Mục tiêu đánh giá
