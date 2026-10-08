# 综合项目 16  GitHub phát hành đến PR Trưởng độc lập

> AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud 和 Google Jules đều cung cấp cùng một hình dạng sản phẩm năm 2026: cho vấn đề 打标签, nhận được một PR── trong một hộp cát đám mây, kiểm tra kiểm tra 通过,并发布 một PR带有合理的、可供审查的── khó khăn nằm trong môi trường xây dựng tự động tái hiện repo、 ngăn chặn rò rỉ tín dụng、 bắt buộc thực hiện ngân sách mỗi repo, cũng như đảm bảo rằng đại lý không thể đẩy mạnh──

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

## 问题
Async cloud coding agent là một loại sản phẩm độc lập khác với các đại lý lập trình tương tác (capstone 01) của. UX là một nhãn GitHub.`@agent fix this`,worker sẽ khởi động trong hộp cát đám mây, lập trình thử nghiệm, kiểm tra, kiểm tra, và mở một PR có chứa lý luận của đại lý trong văn bản chính thức. Không có vòng tương tác, cũng không có thiết bị kết thúc.

工程挑战很具体:environment reproduction(agent 必须在没有缓存的开发图像的情况下从零构建 repo) flaky tests(必须重新运行或隔离) 权限范围(必须拥有最小的细粒级权限的 GitHub App) 按 repo 按天执行预算,以及无力推政策──这个顶石会衡通过率、成本和安全,并与托管的替代方案对比──

## 概念
触发器是 GitHub webhook ([[question label]] hoặc bình luận PR)  dispatcher sẽ làm việc vào đội đến ECS Fargate hoặc Lambda。worker sẽ repo 拉入 Daytona hoặc E2B sandbox,并使用从 repo 推断出的通用 Dockerfile ([[language]]、框架)  agent 运行一个面向Claude Opus 4.7 hoặc GPT-5.4-Codex的迷你自动代理或SWE-agent v2 loop。 nó sẽ 代执行: đọc mã, đề xuất sửa chữa, áp dụng bản vá, chạy thử nghiệm。

Việc xác minh là bước mở cửa. PR 打开前, CI hoàn chỉnh phải nằm trong hộp cát.`needs-review` đại lý 会把 lý luận 作为 PR描述 发布,并添加一个评论员可 ping 以进行后续的 `@agent`Dòng:

An toàn thông qua hai bề mặt GitHub khác nhau  tiến hành giới hạn: App  cung cấp một token cài đặt ngắn hạn, có sẵn `workflows: read`和较狭的 repo content/PR scope;branch protection(而不是 app permissions)`main`和禁止强迫 đẩy, và ứng dụng sẽ không bao giờ được đưa vào danh sách bỏ qua.`.github/workflows`Các ứng dụng GitHub không thực sự có tính năng nguyên thủy, do đó, các tập tin của đại lý được chỉnh sửa cho phép thực hiện trong danh sách.

## 架构
```
GitHub issue 被标记为 `@agent fix` 或 PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task（或 GitHub Actions self-hosted runner）
       - pull repo
       - infer Dockerfile（language、package manager）
       - Daytona / E2B sandbox，带 target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 或 GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v（已验证）
    git push + 通过 GitHub App open PR
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator review；可以 @-mention agent 进行 follow-ups
```

## 技术
- Trigger: 具備微粒的代币的 GitHub App;通过Lambda或Fly.io的网关接收器
- Người làm việc: ECS Fargate task ((或 GitHub Actions tự lưu trữ runner)
- Sandbox: Mỗi nhiệm vụ một container Daytona hoặc E2B sandbox
- Loop đại lý: dựa trên Claude Opus 4.7 / GPT-5.4-Codex của mini-swe-agent cơ sở hoặc SWE-agent v2
- Khám truy cập: bản đồ repo-sitter cây + ripgrep
- Kiểm tra: CI đầy đủ trong hộp cát + cổng delta bảo hiểm
- Khả năng quan sát: Langfuse,带 per-PR lưu trữ dấu vết,并 từ cơ quan PR 链接
- Ngân sách: mỗi repo hàng ngày USD trần; mỗi repo hàng ngày nhiều nhất PR số


```figure
cf-issue-to-pr
```

##  xây dựng nó
1. **GitHub App.**Đơn hiệu cài đặt hạt mỏng: vấn đề đọc+tập lại、 kéo_phán nghị viết、 nội dung đọc+tập lại、thông trình đọc。 Bảo vệ chi nhánh(mối duy nhất có thể làm được điều này bề mặt)`main`和禁止强迫;app 不在绕行列中── nhân viên đối với đề xuất khác biệt 执行禁止写入 `.github/workflows`Xem danh sách cho phép của nội dung, vì quyền của ứng dụng GitHub không được mở rộng theo phạm vi đường.

2. **Webhook receiver.**Phụng chức năng Lambda 接收 issue label / PR comment webhooks──按标签 `@agent fix this`过──入队 đến SQS──

3. **Dispatcher.**Từ SQS 弹出 nhiệm vụ──强制执行 per-repo per-day budget── dùng repo URL、issues body 和一个全新的 Daytona sandbox 启动 ECS Fargate nhiệm vụ──

4. **Environment inference.**检测 language(Python、Node、Go、Rust) và package manager(uv、pnpm、go mod、cargo)

5. **Agent loop.**Sử dụng Claude Opus 4.7 của mini-swe-agent hoặc SWE-agent v2── Công cụ: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git──硬限制: $20 giá、30 phút tường-tiếng hẹn hò、30 lượt quay của đại lý──

6. **Verification.**vòng kết thúc, trong sandbox 中运行完整测试套装──通过 jacoco / coverage.py 计算覆盖 delta──如果CI đỏ:停止,不打开 PR──如果覆盖下降超过2%:打开带`needs-review`nhãn của PR.

7. **PR posting.**Push agent branch── thông qua GitHub API 打开 PR,包含:title、rational、diff summary、trace URL、cost、turns──

8. **Credential hygiene.**Người làm việc sử dụng ngắn hạn GitHub App cài đặt token 运行。Log trong归档前会 scrub secrets。

9. **Eval.**30 vấn đề nội bộ khác nhau được gieo trồng.  đo lường tỷ lệ vượt qua, chất lượng PR, kích thước khác nhau, phong cách, bảo hiểm, chi phí, thời gian trễ.

## Sử dụng nó
```
# on github.com
  - user 用 `@agent fix this` 标记 issue #842
  - 14 分钟后出现 PR #1903
  - body:
    > 修复了 widget.dedupe() 中由 null comparator entry 导致的 NPE。
    > 添加了 regression test widget_test.go::TestDedupeNullComparator。
    > Coverage delta: +0.12%
    > Turns: 7  Cost: $1.80  Trace: langfuse:...
    > Label: needs-review
```

## 交付 nó
`outputs/skill-issue-to-pr.md`Một công nhân đám mây không đồng bộ của GitHub App, có thể được đánh dấu các vấn đề được chuyển thành có chi phí giới hạn và các chứng chỉ phạm vi có thể xem xét PR.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

## 练习
1. 添加一个fix flaky test 模式:label `@agent stabilize-flake TestX`Trong sandbox, chạy thử nghiệm này 50 lần, và đề xuất một thay đổi nhỏ nhất có thể ổn định nó.

2. Trong ba vấn đề chung trên đối với chi phí của các đại lý nền tảng cursor.

3. 实现一个预算仪表:per-repo per day cost,per-user cost,对异常发出警报,

4. Xây dựng một mô hình chạy khô: không hoạt động CI 就打开PR草案, vì vậy các nhà phê bình có thể có kế hoạch kiểm tra chi phí thấp.

5. Chính sách giữ lại thêm: Hơn 7 chi nhánh PR chưa hợp nhất sẽ tự động xóa。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GitHub App | “Scoped bot identity” | 具备 fine-grained permissions + short-lived installation token 的 App |
| Async cloud agent | “Background agent” | 在 cloud sandbox 中运行的 non-interactive worker，而不是 terminal |
| Environment inference | “Dockerfile synthesis” | 检测 language + package manager，若缺失则生成 Dockerfile |
| Verification | “CI-in-sandbox” | 打开 PR 前在 worker 内运行完整 test suite |
| Coverage delta | “Coverage preservation” | 从 base 到 agent branch 的 test coverage % 变化 |
| Per-repo budget | “Daily ceiling” | 在 dispatcher 强制执行的 dollar 和 PR-count cap |
| Rationale | “PR body explanation” | agent 对变更内容及原因的总结；PR body 中必须包含 |

## 延伸阅读
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 标准 tài liệu tham chiếu của đại lý đám mây không đồng bộ
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) Khán giả CLI
- [Cursor Background Agents](https://docs.cursor.com/background-agent) thay thế thương mại
- [OpenAI Codex (cloud)](https://openai.com/codex) đối thủ cạnh tranh được tổ chức
- [Google Jules](https://jules.google) phiên bản lưu trữ của Google
- [Factory Droids](https://www.factory.ai) Khả năng tham chiếu thương mại thay thế
- [GitHub App documentation](https://docs.github.com/en/apps) danh tính bot có phạm vi
- [Daytona cloud sandboxes](https://daytona.io) hộp cát tham chiếu
