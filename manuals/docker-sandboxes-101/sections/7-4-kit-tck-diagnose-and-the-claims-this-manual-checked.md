# kit-tck、sbx diagnose，以及本手册核对过的论断

> 本手册从 Docker 页面或社区转述的每条论断都对照 capture 核对过或标为未核实，本节就是那份台账。

厂商页面说凭据值从不进入 VM {{docs-sbx Security model}}。2026-08-10 的一篇 Hacker News 帖子说代理会重新签发每张证书，2026-09-26 的一期播客说没有人审计过这条边界。你想知道这三条里哪一条有人核对过。读完本节后，你能说出本手册核实了哪些论断、用的是哪个文件，以及哪些只是转述。

## 台账 {#s-kit-tck-diagnose-and-the-claims-this-manual-checked-the-ledger}

每一行列出论断及其来源、判定，以及判定背后的 capture 文件。判定为已确认表示一份录制文件展示了该行为。已反驳表示一份文件展示了相反情况。有争议表示两个来源不一致且没有 capture 能裁定，未核实表示没有计划或录制 capture。

| 论断及其出处 | 判定 | 证据 |
|---|---|---|
| 凭据值从不进入 VM（文档，Security model） | 已确认 | `10-env-sentinel.txt` 有 `M101_RECV_KEY=sbx-cs-<rand>` 和 `ANTHROPIC_API_KEY=proxy-managed`，`10-receiver.log` 显示主机接收器得到了 `Bearer m101-dummy-receiver-0000` |
| 密钥只为绑定的主机注入，并且整个头被替换（HN 2026-08-10，C34） | 两边均已确认 | `10-swap-curl.txt`：在 `host.docker.internal:18080` 上为 204，在 `gateway.docker.internal:18080` 上为 `000`，而 `10-receiver.log` 显示有无 `Bearer` 以及在 `X-Demo` 中的替换 |
| 除非有规则允许，出站 TCP 会被阻止（文档，Default security posture） | 已确认 | `09-blocked.txt`：403，以及 `09-check-verbose.json`：`"deny_kind": "implicit"` |
| 每个沙箱有自己的 Docker Engine，没有通往主机守护进程的路径（文档，Security model） | 部分确认 | `04-guest.txt`：内部是 Docker Engine 29.8.1 服务器，用户 `agent` 在 `docker` 组中，没有探测主机路径 |
| `--clone` 的提交通过 `sandbox-<name>` 到达主机（帮助，`sbx create`） | 已确认 | `08-clone-host.txt`：`git fetch sandbox-m101-clone` 带回了 `81e11df from sandbox`，`08-clone-commit.txt`：向 `/run/sandbox/source` 的 push 被拒绝 |
| 客户机在 Apple silicon 上使用 16 KiB 页（blog 2026-05-26，C45） | 已确认 | `04-guest.txt`：`getconf PAGESIZE` 打印 16384 |
| 代理是 `gateway.docker.internal:3128`（issue #12，C26） | 已确认 | `04-env.txt`：`HTTPS_PROXY=http://gateway.docker.internal:3128`，并且设置了 `PROXY_CA_CERT_B64` |
| HTTPS 被拦截并重新签名（issue #12，HN 2026-08-10） | 未检查 | `09-allowed.txt` 显示 CONNECT 隧道和 `cloudflare` 回复，没有读取证书链 |
| 每个沙箱一个 MCP 网关端点（文档，Architecture） | 已确认 | `11-static-inside.txt`：`MCP_GATEWAY_URL=http://mcp-gateway.docker.internal/mcp`，以及 `11-gateway-tools-static.json`：`ask_wiki_question` |
| 27 种 toolset 类型，`transfer_task` 不在其中（schema，C56） | 已确认 | `16-toolsets.txt`：27 行，两个隐式名称都没有 |
| `sbx kit` 命令是 v1 和 v2 工具（C13） | 已确认 | `13-kit-v3-validate.txt`："is a v3 source kit and this load path has no kit builder configured"，以及 `12-validate.txt`：`VALID` |
| kit 签名用 `sbx kit sign` 和 `verify` 验证（文档，Build and distribute kits） | 未检查 | 没有录制 sign 或 verify 步骤，只有 `13-kit-builder-status.txt` |
| 本地模型无需密钥即可运行（文档，Use local and hosted models） | 已确认 | `25-doctor.txt`：每个提供方凭据都是 `not set`，Docker Model Runner 可达且带有 `docker.io/ai/qwen3:4b`，`25-run-dmr.txt` 现场回答 `Hello`。`18-cassette-head.txt` 显示录制的请求发往 `localhost:12434`，`27-inside-run.txt` 从 VM 内部回答。8B 的 `ai/qwen3:latest` 拉取失败（`25-model-pull-latest.txt`） |
| 本地使用需要 Docker 登录（文档，FAQ，在 HN 2026-08-10 和 issue #321 中有争议，C15） | 部分确认 | `02-diagnose.txt` 把 Authentication 列为一项检查，kit 的先决条件包括 `sbx login`，`help-sbx-cloud.md` 注明每次 `--help` 都会尝试对 login.docker.com 做 TLS |
| `sbx policy approval` 不是一条命令（v0.47.0 帮助树，C16） | 未核实 | `09-blocked.txt`：403 正文说 "Review and respond with: sbx policy approval ls"，没有 capture 运行该命令 |
| VMM 是 libkrun（talk 2026-01-14，HN 2026-08-10，C4） | 未核实 | `00-sbx-version.json` 没有给出运行时名称，`04-guest.txt` 显示内核 `7.0.14`，再无更多 |
| 沙箱在几十毫秒内启动（talk 2026-02-10，C29） | 未检查 | 计划为 K35 的计时运行没有录制 |
| 被允许的主机可以把数据带出（HN 2026-08-10，talk 2026-04-07） | 有争议 | 双方都印在[代理一节](#s-sbx-policy-log-and-the-proxy)中，没有 capture 测试这一点 |
| microVM HTTP API、Kubernetes 运行时、Warp Oz（blog 2026-05-26，blog 2026-08-21，talk 2026-03-31） | 未核实 | 没有 Docker 页面确认其中任何一项（C105，C106） |
| 存在对边界的独立审计 | 未找到 | 2026-09-26 的播客说不存在，语料库中也没有（T24） |
| `sbx ls` 在 macOS 上挂起（#163），Windows 启动失败（#350） | 未复现 | `99-final-state.txt`：`sbx ls` 在运行结束时给出了回答 |
| 最后一个会话结束后沙箱会自行停止（文档中没有） | 已观察到 | `04-auto-stop.txt`："auto-stop grace period expired, stopping runtime" |

```figure
id: fig-7-4
kind: comparison
title: 由文件确认，或仅作报告
claim: 八项论断由录制文件确认，五项未经测试即报告，社区还对另外一项有争议.
caption: 左侧是每项已确认的论断及其展示它的 capture 文件，按所属层着色。右侧虚线框是本手册未经测试即报告的论断，玫瑰色框是社区有争议的论断。 From the files named in each box.
```

## sbx diagnose，唯一的自检 {#s-kit-tck-diagnose-and-the-claims-this-manual-checked-sbx-diagnose-the-only-self-check}

**sbx diagnose：** 检查安装的唯一命令，分为[录制的输出](manuals/docker-sandboxes-101/capture/out/02-diagnose.txt)所示的四组：Installation、Platform、Storage 和 Connection。它接受 `--json`、用于把报告粘贴到 issue 的 `--output github-issue`，以及向 Docker 支持发送诊断的 `--upload` {{help-sbx sbx diagnose}}。

```listing
title: 录制主机上的平台和连接检查
source: capture/out/02-diagnose.txt
lang: text
note: Installation 和 Storage 组已删节。字节计数和大小由 kit 遮罩。
---
  Platform
  ✓ Virtualization — supported
      kern.hv_support is 1
  ✓ mkfs.erofs — found
      /opt/homebrew/Caskroom/sbx/0.47.0/Sbx.app/Contents/libexec/mkfs.erofs, default block size <n> bytes, guest kernel page size <n> bytes
…
  Connection
  ✓ Version match — v0.47.0
  ✓ Socket — responsive
  ✓ SSH client config — not configured
  ✓ Authentication — authenticated

─────────────────────────────────────────
  13 passed
```

全部 13 项检查通过，`02-diagnose.json` 中的 JSON 形式带有相同的行，以及 `pass`、`warn`、`fail` 和 `skip` 计数的 `summary`。Platform 组是 [microVM 边界一节](#s-sbx-diagnose-and-the-microvm-boundary)读取管理程序和页大小的地方。`sbx --cloud diagnose` 运行另一套检查：登录、云 API 和账户访问，并且不需要守护进程 {{docs-sbx Use cloud sandboxes}}。

## kit-tck，本版未运行 {#s-kit-tck-diagnose-and-the-claims-this-manual-checked-kit-tck-not-run-in-this-edition}

**kit-tck：** Sandbox Kit Specification v3 的一致性套件，分成彼此独立的两半，一个针对已发布的 kit 制品，一个针对运行时。规范仓库的一致性页面描述了两者（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/kit-spec-extras.md)）。`kit-tck validate <reference>` 按发布和 OCI 布局规则评判已发布的制品，BuildKit frontend 在导出前运行相同的检查。`kit-tck runtime --adapter <path>` 驱动一个 adapter，即带有 `capabilities`、`create`、`exec`、`stop`、`start`、`recreate` 和 `rm` 等动词的可执行文件。

该套件通过这些动词评判运行时的行为。adapter 在按策略拒绝请求时以 2 退出，任何其他非零码都是失败。因此无法提供必需能力的运行时必须拒绝该 kit。

```listing
title: 两套套件和制品命令
source: research/sources/kit-spec-extras.md
lang: text
note: 来自 docker/sandbox-kit-spec 的 README 的四行。task 行从检出运行，kit-tck 行运行已发布的二进制。
---
task tck:kit REF=docker.io/me/sbx-kit-gh:1.0.0   # is this artifact a conforming Kit?
task tck:runtime ADAPTER=./my-adapter            # does this runtime behave as the pages require?
…
kit-tck validate docker.io/me/sbx-kit-gh:1.0.0 --verbose
kit-tck validate docker.io/me/sbx-kit-gh:1.0.0 --format json
```

已发布的 `kit-tck` 二进制附在规范的每个 GitHub release 上，覆盖 Linux、macOS 和 Windows。`kit-tck inspect` 读取 kit 的 descriptor 和 recipe，不做评判。套件在 adapter 的环境中放入三个已知值：`KIT_TCK_HOST_SENTINEL`、`KIT_TCK_BOUND_SECRET` 和 `KIT_TCK_SKILL_NAME`。主机环境或绑定密钥的泄漏就会可见。

本版没有运行它。capture kit 构建了一个 v3 制品并推到本地 registry（`28-buildx.txt`，`28-manifest.json`），但没有对它运行 `kit-tck` 步骤。

## 智能体回归检查 {#s-kit-tck-diagnose-and-the-claims-this-manual-checked-the-agent-regression-check}

对于智能体运行，计划的检查是 `docker-agent sessions diff --fail-on-divergence`，它比较两次录制会话的工具调用，而不是助手的正文 {{help-agent docker-agent sessions diff}}。它在第一次分歧处停止。capture kit 在录制的会话上运行了它（`21-sessions-diff.txt`）。同一次运行的两次回放在五轮上完全相同，先调用 `shell` 的运行在第 0 轮分歧并以 1 退出。像 `-1` 这样的相对引用需要在前面加 `--`，否则解析器会把它读成标志。[会话一节](#s-session-db-sessions-diff-and-eval)讲解会话存储。

```takeaways
- 只有当[一次录制的运行](manuals/docker-sandboxes-101/capture/out)展示了该行为时，才把论断视为已确认。
- 先运行 `sbx diagnose`，并在任何报告上附上 `--output github-issue`。
- 对你发布的 kit 运行 `kit-tck validate`，并按它们所点名的规范章节阅读其发现。
- 为每个智能体保留两次录制的会话，并用 `sessions diff --fail-on-divergence` 比较它们。
```

Sources: docs-sbx Security model, Default security posture, Architecture, FAQ, Use cloud sandboxes, Build and distribute kits, Use local and hosted models (research/sources/docs-sandboxes.md); help-sbx sbx diagnose, sbx create (research/sources/help-sbx.md); help-agent docker-agent sessions diff (research/sources/help-docker-agent.md); research/sources/kit-spec-extras.md (README Conformance, docs/spec/conformance.md); research/sources/help-sbx-cloud.md; research/conflicts-register.md rows C4, C13, C15, C16, C26, C29, C34, C45, C56, C105, C106 and the community rows of research/plan.md; capture/out/00-sbx-version.json, 02-diagnose.txt, 02-diagnose.json, 04-auto-stop.txt, 04-env.txt, 04-guest.txt, 08-clone-commit.txt, 08-clone-host.txt, 09-allowed.txt, 09-blocked.txt, 09-check-verbose.json, 10-env-sentinel.txt, 10-receiver.log, 10-swap-curl.txt, 11-gateway-tools-static.json, 11-static-inside.txt, 12-validate.txt, 13-kit-builder-status.txt, 13-kit-v3-validate.txt, 16-toolsets.txt, 18-cassette-head.txt, 21-sessions-diff.txt, 25-doctor.txt, 25-model-pull-latest.txt, 25-run-dmr.txt, 27-inside-run.txt, 28-buildx.txt, 28-manifest.json, 99-final-state.txt
