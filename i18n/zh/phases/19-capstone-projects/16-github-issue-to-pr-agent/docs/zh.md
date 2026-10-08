# 综合项目 16  GitHub 发行至公关自主代理

> 通过,并发布一个有逻辑的 PR、可供审查的 PR──难点在于自动复现的 repo 构建环境、防止凭证泄漏、强制执行每次 repo 预算,以及确保代理无法强迫推──这个顶点将构建自主托管版本,并与托管的替代品相比较.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 30 小时

## 问题
无机云编码代理 是与互动编码代理 (capstone 01) 的独立产品类别. UX 是一个GitHub标签.`@agent fix this`工作者会在云沙箱中启动、克隆备用,运行测试、编辑文件、验证,并打开一个包含在正文中的代理理性 PR──没有交互循环,也没有终端──AWS远程SWE代理、Cursor背景代理、OpenAI Codex云、Google Jules和工厂Droids都朝着这个形式收收──

工程挑战很具体:环境复制 (应在没有缓存的开发图像的情况下进行零构建测试) 测 (必须重新运行或隔离) 凭证范围测试 (必须拥有最小的细粒度许可)  GitHub App) 按 repo 按天执行预算,以及无力推政策.

## 概念
触发器是GitHub网关 (问题标签或公关评论) ‧发送器将进入ECSFargate或Lambda的队伍. 工作者将将将 repo 拉入Daytona或E2B沙箱,并使用从 repo 推断出的通用Dockerfile (语言、框架) ‧代理运行一个面向Claude Opus 4.7或GPT-5.4-Codex的迷你自动代理或SWE-agent v2循环. 它会代执行:阅读代码,提出修复,应用补丁,运行测试.

验证是关门步骤――PR 打开前,完整的CI 必须在沙盒中通过――计算覆盖率的三角形;如果超过值为负,PR 仍将打开,但将被标记为`needs-review`作为公关描述发布,并添加一个可追踪的评论员`@agent`线子

通过两个不同的GitHub表面进行限制:应用提供一个短期安装代币,`workflows: read`强制执行禁止直接写入`main`和禁止强迫推,而且app永远不会被加入绕行列表.`.github/workflows`通过路径扩展的仅阅读访问 不是实际的GitHub应用程序原始,因此代理的文件编辑允许列表必须在员工中强制执行――按 repo 按天的预算上限在发送器中强制执行――例如,每个 repo 每天最多 5个 PR,每个 PR $20) ⋅

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
- 触发器: 通过GitHub应用程序的微粒代币;通过Lambda或Fly.io的网络连接器
- 工作者:ECSFargate任务 (或 GitHub 行动自主托管的运行者)
- 每个任务一个戴顿纳的装箱或E2B的沙箱
- 基于Claude Opus 4.7 / GPT-5.4-Codex的迷你Swe-agent基线或SWE-agent v2
- 获取:树木监护者复核地图 + 撕裂
- 验证:全CI在沙箱+覆盖地达尔塔门
- 观察性:长,带每公关的痕迹档案,并从公关机构 链接
- 预算:每期每日美元上限;每期每天最多的公交数


```figure
cf-issue-to-pr
```

## 构建它
1. **GitHub App.**细粒度安装代币:问题阅读+写、拉_请求写、内容阅读+写、工作流阅读──分支保护(唯一能做到这一点的表面) 强制执行禁止直接推到`main`和禁止强迫推;app 不在绕行列表中──工人对拟议的差异 执行禁止写入`.github/workflows`下的内容的允许列表检查,因为GitHub应用程序权限不是路径范围的.

2. **Webhook receiver.**接收问题标签 / 公共关系评论网页.`@agent fix this`过──进入队到SQS──

3. **Dispatcher.**从SQS 弹出任务――强制执行每日预算每次回复――使用回复URL、问题体 和一个全新的戴顿沙箱 启动ECSFargate任务――

4. **Environment inference.**检测语言(Python、Node、Go、Rust) 和包管理器(uv、pnpm、go mod、cargo) ・・・如果没有Dockerfile,则动态生成一个──

5. **Agent loop.**使用Claude Opus 4.7的迷你自动代理或SWE-agent v2──工具: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git──硬限制:20美元成本、30分钟墙钟、30个代理转──

6. **Verification.**循环结束后,在沙盒中运行完整的测试套件――通过 jacoco/coverage.py 计算覆盖率 delta――如果CI红:停止,不打开 PR――如果覆盖率下降超过2%:打开带`needs-review`标签的 PR

7. **PR posting.**通过GitHubAPI打开 PR,包含:标题,理性,差异总结,追踪URL,成本,转折.

8. **Credential hygiene.**员工使用短期的GitHub应用安装代币运行.

9. **Eval.**30个不同难度的种植内部问题――测量通过率,PR质量,不同规模,风格,覆盖率,成本,延迟――在同样的问题上与Cursor背景代理和AWS远程SWE代理对比――

## 使用它
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

## 交付它
`outputs/skill-issue-to-pr.md`提供可用的.一个GitHub App+async云工作者,可将标记的问题转换为有限额成本和范围的凭证.可审查的 PR.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

## 练习
1. 添加一个固片检测模式:标签`@agent stabilize-flake TestX`试验50次,并提出一个可以稳定的最小改动.

2. 在三个共同问题上,与课程背景代理的成本相比.

3. 实现预算仪表板:每次每日成本,每用户成本,对异常情况发出警报.

4. 建立一个干燥运行模式:不运行CI 就打开公关草案,这样审查员可以低成本检查计划.

5. 加入保留政策:超过7天未合并的公关分支会自动删除──

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
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 标准异步云代理参考
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) CLI 参考
- [Cursor Background Agents](https://docs.cursor.com/background-agent)商业替代品
- [OpenAI Codex (cloud)](https://openai.com/codex)主办的竞争对手
- [Google Jules](https://jules.google)谷歌的托管版本
- [Factory Droids](https://www.factory.ai)替代商业参考
- [GitHub App documentation](https://docs.github.com/en/apps) 范围的机器人身份
- [Daytona cloud sandboxes](https://daytona.io)参考沙盒
