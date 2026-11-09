# sbx 与 docker-agent

> 每个二进制各管一件事：sbx 管 microVM、它的代理和它的密钥存储，docker-agent 管模型、工具和子智能体之间的循环。

你想让编码智能体处理一个仓库，但不想让它读取你的 SSH 密钥或随意调用任意主机。Docker 为此提供了两个命令行程序：`sbx` 和 `docker-agent`。装有 Docker Desktop 的 Mac 还有第三个名字 `docker agent`，本节划清这三者的界限。

读完本节后，你能说出沙箱运行各部分的所有者并选择一条启动路径。你还能分辨同一台机器上的两个智能体二进制。

## sbx 拥有什么 {#s-sbx-and-docker-agent-what-sbx-owns}

**沙箱：** `sbx` 为单个智能体创建的 microVM。每个沙箱运行在带有自己 Linux 内核的小型 microVM 中 {{docs-sbx Isolation layers}}，并拥有私有的 Docker Engine。在 `m101-demo` 内部，capture 读到 Ubuntu 26.04.1 上的 Linux 7.0.14 和 Docker Engine 29.8.1（[这次 capture](manuals/docker-sandboxes-101/capture/out/04-guest.txt)）。工作区出现在相同的绝对路径上，智能体启动的容器不会出现在主机的 `docker ps` 中 {{docs-sbx Develop and test locally}}。

**sandboxd：** 每条本地 `sbx` 命令背后的主机守护进程，通过 `$HOME/Library/Application Support/com.docker.sandboxes/sandboxes/sandboxd/sandboxd.sock` 访问（[这次 capture](manuals/docker-sandboxes-101/capture/out/02-daemon-status.txt)）。`sbx` 不需要 Docker Desktop，也不需要 Docker Engine {{docs-sbx Install Docker Sandboxes}}。你需要用 `sbx login` 做 Docker 登录，`sbx diagnose` 会把它报告为 `Authentication — authenticated`（[这次 capture](manuals/docker-sandboxes-101/capture/out/02-diagnose.txt)）。[冲突 C15](#s-ref-sources-and-the-conflicts-register) 记录了这两条论断为何同时成立。

守护进程还运行代理，它的两个日志类别之一是 `proxy` {{help-sbx sbx daemon log-level set}}。沙箱的每条出站 TCP 连接都经过主机上的代理 {{docs-sbx Architecture}}。在 macOS 上，`sbx secret set` 把每个密钥保存在系统 Keychain 中 {{docs-sbx Where secrets are stored}}。代理在请求离开 VM 之后把密钥加到请求上，所以 VM 只看到占位符 `proxy-managed`（[这次 capture](manuals/docker-sandboxes-101/capture/out/04-env.txt)）。[代理](#s-sbx-policy-log-and-the-proxy)和[密钥](#s-sbx-secret-set-import-and-set-custom)两节分别拆开讲解，[图](#fig-1-1)展示谁拥有什么。

```figure
id: fig-1-1
kind: layers
title: sbx 拥有什么、docker-agent 拥有什么
claim: sbx 拥有从守护进程到 guest 内核的每一层，docker-agent 拥有它的二进制、它的文件，以及 guest 内的循环.
caption: 从主机色带往下读每一列，穿过虚线 hypervisor 线。内核和引擎来自 guest 和环境 capture 中的 m101-demo。docker-agent 一列来自沙箱运行的 capture。
```

```listing
title: sbx 的命令组
source: capture/out/01-help-sbx.txt
lang: text
note: 每组只保留本部分点名的命令，其余组和标志已删节。
---
$ sbx --help
Docker Sandboxes creates isolated sandbox environments for AI agents, powered by Docker.
…
Sandbox Commands:
…
  create      Create a sandbox for an agent
  exec        Execute a command inside a sandbox
…
  run         Run an agent in a sandbox
…
Management Commands:
  daemon      Manage sandboxd daemon
  diagnose    Diagnose common issues with your sbx installation
  mcp         Manage MCP servers
  policy      Manage sandbox policies
…
  secret      Manage stored secrets
…
```

## sbx 运行的智能体 {#s-sbx-and-docker-agent-the-agents-sbx-runs}

`sbx run` 接受十一个智能体名称：claude、codex、copilot、cursor、devin、docker-agent、droid、gemini、kiro、opencode 和 shell {{help-sbx sbx run}}。`sbx create` 把其中八个作为子命令，漏掉了 copilot、droid 和 kiro。这三者已迁到公开 kit，自 v0.43.0 起可以再次按名称启动 {{rel-sbx v0.43.0}}。`sbx create docker-agent` 也响应别名 `cagent` {{help-sbx sbx create docker-agent}}。`shell` 在沙箱中给你一个 Bash 登录 shell，不安装智能体二进制 {{docs-sbx Shell}}。[冲突 C9](#s-ref-sources-and-the-conflicts-register) 列出了旧帖中更短的智能体列表。

## docker-agent 拥有什么 {#s-sbx-and-docker-agent-what-docker-agent-owns}

**智能体文件：** 一份 YAML 文件，命名智能体、它们的模型、它们的 toolset，以及它们之间的规则。Docker Agent 是一个开源框架，面向由专门 AI 智能体组成的团队 {{docs-agent Docker Agent}}。它的 `run` 命令驱动循环：一次模型调用、模型要求的工具调用，以及它委派给的子智能体。[智能体循环课程](phases/14-agent-engineering/01-the-agent-loop)讲解这个循环，[第 6 部分](#p-6)对外提供并分享同一份文件。

`docker-agent` 二进制本身不隔离任何东西。在主机上，它的 `shell` toolset 运行命令「in the user's environment」（[这次 capture](manuals/docker-sandboxes-101/capture/out/16-toolsets.txt)）。

```listing
title: docker-agent 的命令组
source: capture/out/01-help-docker-agent.txt
lang: text
note: 只保留核心组和四条高级命令。diagnose 组、其余命令和标志已删节。
---
$ docker-agent --help
Docker AI Agent Runner.
…
Core Commands:
  getting-started Learn docker agent with a hands-on interactive tour
  run             Run an agent
  setup           Interactively set up a model (built-in provider, local, custom endpoint, or Claude Code)
  share           Share agents
…
Advanced Commands:
…
  eval            Run evaluations for an agent
…
  sandbox         Manage docker-agent sandbox settings
  serve           Start an agent as a server
  sessions        Inspect recorded sessions
…
```

## 两条启动路径 {#s-sbx-and-docker-agent-two-launch-paths}

`sbx run docker-agent ~/my-project` 从 sbx 启动。沙箱使用 `docker/sandbox-templates:docker-agent`，在你不传参数时运行 `docker-agent run --yolo` {{docs-sbx Docker Agent}}。只有工作区中的项目级配置能到达它。

`docker-agent run --sandbox agent.yaml` 从你的智能体文件启动。这里 `docker-agent` 驱动你安装的 `sbx` CLI {{docs-agent Sandbox Mode}}，`--template` 默认是 `docker/docker-agent-sbx-templates:latest` {{help-agent docker-agent run}}。两条路径使用两个镜像，如 [冲突 C61](#s-ref-sources-and-the-conflicts-register) 所裁定。capture kit 只录制了第二条路径，[下一节](#s-docker-agent-run-sandbox-end-to-end)跟随它。

```figure
id: fig-1-2
kind: comparison
title: 在沙箱中启动 docker-agent 的两种方式
claim: 两条路径最终都是 microVM 里的 docker-agent，但 sbx run 从模板镜像启动，docker-agent run --sandbox 从你的智能体文件启动.
caption: 按行横向阅读。路径 A 来自 docs-sbx 下的 Docker Agent 文档页，因为没有 capture 运行它。路径 B 来自沙箱运行的 capture。
```

## 一台机器上的两个智能体二进制 {#s-sbx-and-docker-agent-two-agent-binaries-on-one-machine}

Docker Desktop 4.94.0 捆绑 Docker Agent v1.144.0 {{docs-desktop 4.94.0}} 作为 CLI 插件 `docker agent`。Homebrew 把 v1.149.0 安装为 `docker-agent`，文档说它也可以作为独立二进制使用 {{docs-agent Docker Agent}}。

```listing
title: capture Mac 上的两个智能体二进制
source: capture/out/29-docker-agent-plugin.txt
lang: text
note: 未删节。
---
$ docker agent version
docker agent version v1.144.0
Commit: 3873760f47ecf22f72f65bd776c056a337d6f35c
[exit 0]

$ docker-agent version
docker-agent version v1.149.0
Commit: Homebrew
[exit 0]
```

v1.149.0 打印的提示仍写 `docker agent sandbox allow <host>`（[这次 capture](manuals/docker-sandboxes-101/capture/out/16-sandbox-list.txt)），而在这台 Mac 上该命令运行的是 v1.144.0。本手册每条命令都写 `docker-agent` 并锁定 v1.149.0，如 [冲突 C48](#s-ref-sources-and-the-conflicts-register) 所裁定。第三个构建运行在沙箱模板内部，如 [下一节](#s-docker-agent-run-sandbox-end-to-end) 所示。

同一份插件列表里有 `sandbox v0.13.0`，`docker sandbox` 只打印它的移除通知（[这次 capture](manuals/docker-sandboxes-101/capture/out/29-docker-sandbox.txt)）。[迁移一节](#s-from-docker-sandbox-and-cagent-to-sbx-and-docker-agent)对照它的命令。列表里还有 `ai v1.31.0`，即 `docker ai` 背后的插件，文档称之为 Gordon，Docker 内置的 AI 助手 {{docs-agent Docker Agent}}。Gordon 不在本手册范围内。

```takeaways
- 安装 `sbx`，用 `sbx login` 登录，即可在没有 Docker Desktop 的情况下运行沙箱。
- 输入 `docker-agent`，在听从写出 `docker agent` 的提示之前，先检查 `docker agent version`。
- 模板运行用 `sbx run docker-agent` 启动，自己的智能体文件用 `docker-agent run --sandbox` 启动。
```

Sources: help-sbx sbx run, sbx create, sbx create docker-agent, sbx daemon log-level set (research/sources/help-sbx.md); help-agent docker-agent run (research/sources/help-docker-agent.md); docs-sbx Isolation layers, Develop and test locally, Install Docker Sandboxes, Architecture, Where secrets are stored, Shell, Docker Agent (research/sources/docs-sandboxes.md); docs-agent Docker Agent, Sandbox Mode (research/sources/docs-docker-agent.md); docs-desktop 4.94.0 (research/sources/docs-desktop-release-notes.md); rel-sbx v0.43.0 (research/sources/sbx-releases.md); research/conflicts-register.md rows C9, C15, C48, C61, C72; capture/out/01-help-sbx.txt, 01-help-docker-agent.txt, 02-daemon-status.txt, 02-diagnose.txt, 04-env.txt, 04-guest.txt, 16-sandbox-list.txt, 16-toolsets.txt, 27-sandbox-run.txt, 27-inside.txt, 29-docker-agent-plugin.txt, 29-docker-plugins.txt, 29-docker-sandbox.txt
