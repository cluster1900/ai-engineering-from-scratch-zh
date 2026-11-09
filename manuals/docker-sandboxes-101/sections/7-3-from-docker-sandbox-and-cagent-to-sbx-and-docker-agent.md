# 从 docker sandbox 和 cagent 到 sbx 和 docker-agent

> 两次更名和一次 CLI 重组改掉了 2025 年和 2026 年初资料里的每条命令，本节把每条旧命令映射到当前形式。

2026-02-23 的一篇博文让你运行 `docker sandbox run claude`，并把代理指向 `host.docker.internal:3128`。2025-09-24 的一次演讲展示了 `cagent run agent.yaml` 和 `cagent push`。在一台装着 Docker Desktop 4.94.0、sbx 0.47.0 和 docker-agent 1.149.0 的机器上，这两条命令都不存在。读完本节后，你能把那些资料里的任意命令映射到当前形式，并说出改掉它的版本。

## 两条线和三次移除 {#s-from-docker-sandbox-and-cagent-to-sbx-and-docker-agent-two-tracks-and-three-removals}

沙箱产品有过四段生命。计划的时间线把基于容器的 `docker sandbox run` 定在 2025-11-06 的 Docker Desktop 4.50.0，预览博文随后出现在 2025-11-25 {{blog 2025-11-25}}。Desktop 4.58.0 在 2026-01-26 用 microVM 替换了它 {{docs-desktop 4.58.0}}，Desktop 4.61.0 在 2026-02-18 捆绑了插件 v0.12.0 {{docs-desktop 4.61.0}}。本节引用的帮助就来自那个插件。独立的 `sbx` 二进制的第一个公开 tag 是 2026-03-31 的 v0.21.0 {{rel-sbx v0.21.0}}。随后 Desktop 4.80.0 在 2026-06-29 结束了该插件：

```rule
label: 移除说明
source: docs-desktop 4.80.0
---
Docker Desktop 移除了实验性的 `docker sandbox` 插件。请改用 `docker sbx`。
```

任何帮助树里都没有 `docker sbx` 命令，二进制是 `sbx`（[冲突 C1](#s-ref-sources-and-the-conflicts-register)）。

智能体产品有过三个名字。它以 cagent 之名在 2025-09-18 的博文中推出 {{blog 2025-09-18}}，Desktop 4.49.0 在 2025-10-23 捆绑了它。4.49.0 的 Desktop 说明现在用的是当前名字 Docker Agent {{docs-desktop 4.49.0}}。智能体文档说 Docker Desktop 4.49 到 4.62 把该功能叫做 cagent {{docs-agent Installation}}，`docker agent` 插件随 v1.23.3 在 2026-02-16 到来 {{rel-agent v1.23.3}}。

1.23.4 版三天后重组了命令，v1.30.0 在 2026-03-09 完成更名 {{rel-agent v1.30.0}}。文档把 Desktop 中的 Docker Agent 定在 4.63，而第一条点名它的发行说明是带 v1.27.1 的 4.64.0（[冲突 C49](#s-ref-sources-and-the-conflicts-register)）。Desktop 4.81.0 在 2026-07-06 移除了已弃用的 `cagent` 二进制 {{docs-desktop 4.81.0}}。Desktop 4.94.0 捆绑 Docker Agent v1.144.0 {{docs-desktop 4.94.0}}，比本手册锁定的 v1.149.0 二进制落后五个发行版。许多 Desktop 说明完全不写捆绑版本（[冲突 C50](#s-ref-sources-and-the-conflicts-register)）。

```figure
id: fig-7-3
kind: timeline
title: 从 2025-09 到 2026-10 的两条产品线
claim: 每个旧名字都比继任者多活了几个月，Docker Desktop 相隔一周移除了这两个旧名字，分别在 2026-06-29 和 2026-07-06.
caption: 在一条日期轴上从左往右读。灰色条是旧名字，蓝色和紫色条是当前名字，玫瑰色线标出三次移除。下方编号图例用版本点名每个事件。 From research/sources/docs-desktop-release-notes.md, sbx-releases.md, and docker-agent-CHANGELOG.md.
```

## 旧的命令树 {#s-from-docker-sandbox-and-cagent-to-sbx-and-docker-agent-the-old-command-trees}

```listing
title: docker sandbox 插件，v0.12.0
source: research/sources/help-legacy-docker-sandbox.md
lang: text
note: 根帮助和代理标志，于 2026-10-08 从 Desktop 4.61.0 捆绑的插件录得。create、exec 和 save 各节已删节。
---
Management Commands:
  create      Create a sandbox for an agent
  network     Manage sandbox networking

Commands:
  exec        Execute a command inside a sandbox
  ls          List VMs
  reset       Reset all VM sandboxes and clean up state
  rm          Remove one or more sandboxes
  run         Run an agent in a sandbox
  save        Save a snapshot of the sandbox as a template
  stop        Stop one or more sandboxes without removing them
  version     Show sandbox version information
…
      --bypass-cidr string   Bypass MITM proxy for an IP range in CIDR
                             notation (can be specified multiple times)
      --bypass-host string   Bypass MITM proxy for a domain or IP (can be
                             specified multiple times)
…
      --policy allow|deny    Set the default policy
```

```listing
title: docker agent 插件，v1.32.4
source: research/sources/help-legacy-docker-agent.md
lang: text
note: 根帮助和三个 run 标志，录于 2026-10-08。全局标志已经点名 cagent 目录。
---
Core Commands:
  new         Create a new agent configuration
  run         Run an agent
  share       Share agents

Advanced Commands:
  alias       Manage aliases
  eval        Run evaluations for an agent
  serve       Start an agent as a server
…
      --sandbox                   Run the agent inside a Docker sandbox (requires Docker Desktop with sandbox support)
…
      --template string           Template image for the sandbox (passed to docker sandbox create -t)
…
      --yolo                      Automatically approve all tool calls without prompting
```

在它们旁边，[capture 到的 sbx 帮助](manuals/docker-sandboxes-101/capture/out/01-help-sbx.txt) 里的 v0.47.0 树把 `policy`、`secret`、`template` 和 `mcp` 归到 Management Commands 下，`network` 和 `save` 已经没有了。[capture 到的 docker-agent 帮助](manuals/docker-sandboxes-101/capture/out/01-help-docker-agent.txt) 里的 v1.149.0 树增加了 `setup`、`doctor`、`models`、`toolsets`、`sessions`、`debug`、`sandbox` 和 `serve chat`，由 [第 5 部分](#s-docker-agent-run-new-and-doctor) 讲解。

## 命令对照 {#s-from-docker-sandbox-and-cagent-to-sbx-and-docker-agent-the-command-map}

| 旧命令或习惯 | 出现位置 | 不再成立的时间 | 现在这样做 |
|---|---|---|---|
| `docker sandbox run <agent>` | Desktop 文档、博文、视频 | Desktop 4.80.0，2026-06-29 | `sbx run <agent>` |
| `docker sandbox run --mount-docker-socket kiro` | re:Invent 博文，2025-12-12 | Desktop 4.58.0，2026-01-26 | 无需操作：每个沙箱都有私有的 Docker Engine |
| `--load-local-template` | Desktop 4.58 到 4.60 | Desktop 4.61，2026-02-18 | `sbx template load FILE`，然后 `--pull never -t TAG` |
| `--pull-template missing`，默认值 | 插件 v0.12.0 | v0.21.0，2026-03-31 | `--pull always`、`missing` 或 `never`，默认 `always` |
| `docker sandbox create cagent .` | 插件 v0.12.0，博文 2026-03-11 | Desktop 4.80.0 | `sbx create docker-agent .`，`cagent` 仍是别名 |
| `docker sandbox network proxy S --allow-host api.example.com` | 旧文档，博文 2026-02-23 | Desktop 4.80.0 | `sbx policy allow network api.example.com --sandbox S` |
| `--bypass-host`、`--bypass-cidr` | 插件 v0.12.0 | Desktop 4.80.0 | v0.47.0 的帮助中没有替代项，见[这次 capture](manuals/docker-sandboxes-101/capture/out/09-bypass-grep.txt) |
| `docker sandbox network log --json` | 旧文档 | Desktop 4.80.0 | `sbx policy log S --json` |
| `docker sandbox save S TAG` 存进主机 Docker | 插件 v0.12.0，博文 2026-02-23 | Desktop 4.80.0 | `sbx template save S TAG -o FILE` 存进沙箱运行时自己的存储 |
| `docker sandbox exec -d` | 插件 v0.12.0 | sbx | `sbx exec -d` 是 "not supported" |
| 带 `_`、`+` 或 `.` 的名字 | 插件 v0.12.0 | v0.43.0，2026-09-15 | 2 到 63 个字符，字母、数字、连字符、句点；带 `--cloud` 时不能有句点 |
| 手工把代理设到 `host.docker.internal:3128` | 博文 2026-02-23 和 2026-05-26 | sbx | 无需操作：守护进程会设置 `gateway.docker.internal:3128`，见[这次 capture](manuals/docker-sandboxes-101/capture/out/04-env.txt) |
| API 密钥放在 `~/.zshrc` 里，然后重启 Desktop | 2026-07 之前的教程 | v0.35.0，2026-07-10 | `sbx secret set SERVICE` 或 `sbx secret import` |
| `sbx run claude --branch` | 博文 2026-05-26，视频 | v0.31.0，2026-05-28 | `sbx run claude --clone` |
| kit v1 语法，`schemaVersion: "1"`，`network.allowedDomains` | 博文 2026-08-03 | v2 在 2026-09-09，v3 在 2026-09-24 | 给 `sbx kit` 用 v2 的 `spec.yaml`，v3 用带 `# syntax=docker/sandbox-kit:3` 的 `kit.yaml` |
| `sbx mcp catalog` | 0.45.0 之前的文档 | v0.45.0，2026-09-21 | `sbx mcp add --url URL` |
| `sbx mcp enable github-official` | 产品页，2026-10-07 | 从未存在 | `sbx mcp add`，然后 `--static-mcp` 或 `sbx mcp load` |
| `-p 3000:8080` 绑定 IPv4 和 IPv6 | v0.42.0 之前 | v0.42.0，2026-09-07 | 默认 tcp4，两边都要就写 `3000:8080/tcp` |
| 来自任意仓库的 kit | v0.34.0 之前 | v0.34.0，2026-06-26 | 把前缀加到 `kit.allowedSources` |
| 相对路径的 `--command ./helper` 密钥源 | v0.46.0 之前的文档 | v0.46.0，2026-09-28 | 可写沙箱挂载之外的绝对路径 |
| Windows 10 | 2026 年初 | v0.35.0，2026-07-10 | Windows 11，需 Windows Hypervisor Platform |
| `host.docker.internal:8811` 上的 Toolkit gateway，五个手工步骤 | re:Invent 博文，2025-12-12 | v0.38.0，2026-08-06 | `sbx mcp add` 和 `sbx mcp load`，Toolkit gateway 是分开的 |
| "one sandbox per workspace" | 博文 2026-03-11 | sbx 名字默认为 `<agent>-<workdir>` | 同一目录上的第二个沙箱用 `--name`，见[这次 capture](manuals/docker-sandboxes-101/capture/out/04-second-sandbox.txt) |
| `cagent run agent.yaml`、`cagent new`、`cagent exec` | 2025 年博文和演讲 | v1.23.4，2026-02-19，以及 Desktop 4.81.0 | `docker agent run`、`docker agent new`、`docker agent run --exec` |
| `cagent push`、`cagent pull`、`cagent acp`、`api`、`mcp`、`a2a` | 2025 年博文 | v1.23.4 | `docker agent share push` 和 `pull`，`docker agent serve acp`、`api`、`mcp`、`a2a` |
| `cagent config`、`feedback`、`build`、`catalog` | 2025 年到 2026 年初 | v1.23.4 | 已移除，catalog 是 Hub 命名空间 `agentcatalog/*` |
| `cagent version`、`brew install cagent` | 博文 2025-11-13 | v1.30.0 和 Desktop 4.81.0 | `docker agent version`、`brew install docker-agent`、`winget install Docker.Agent` |
| "Docker Agent v2.x renamed the CLI" | 一篇第三方教程 | 从未成立 | 最新 tag 是 v1.149.0 |
| `docs.docker.com/ai/cagent/` | 博文 2026-03-11，旧链接 | v1.30.0 | `docs.docker.com/ai/docker-agent/` |
| `CAGENT_MODELS_GATEWAY`、`CAGENT_CONFIG_DIR`、`CAGENT_PPROF_ADDR` | 较旧的文档和 issue | v1.30.0，仍然接受 | `DOCKER_AGENT_MODELS_GATEWAY`、`DOCKER_AGENT_CONFIG_DIR`、`DOCKER_AGENT_PPROF_ADDR` |
| `docker/sandbox-templates:cagent` | 旧的智能体页面 | 更名 | `docker/sandbox-templates:docker-agent` |
| 用 `docker cp` 把智能体二进制拷进沙箱，然后在里面跑 `agent run dev-team.yaml` | 博文 2026-03-11 | `docker-agent` 模板 | `sbx run docker-agent .` 或 `docker agent run --sandbox agent.yaml` |
| `--yolo` | 到处都是 | 仍然接受 | `--safety autonomous`，`--yolo` 是它的别名 |
| eval 评判器是付费的 Anthropic 模型 | v1.32.4 帮助 | v1.147.0，2026-10-05 | 默认为 `openai/gpt-5.6-terra`，或任意 `provider/model` |
| `--sandbox` 需要带沙箱支持的 Docker Desktop | v1.32.4 帮助 | sbx | `--sbx` 默认为 true，Desktop 4.80.0 之后 `--sbx=false` 没有目标 |
| GitHub Action 中的 mcp-gateway v0.22.0 | 该 action 的默认值 | 仓库已到 v0.44.1 | 自行固定 gateway 版本 |

这些行重述了登记表的过时建议列表 S1 到 S30 以及插件行 C107 到 C112，[来源一节](#s-ref-sources-and-the-conflicts-register) 全文印出。

## 哪些还留着旧名字 {#s-from-docker-sandbox-and-cagent-to-sbx-and-docker-agent-what-kept-the-old-name}

更名没有动这些目录。`docker-agent --help` 仍把 `--data-dir` 默认为 `~/.cagent`，`--config-dir` 默认为 `~/.config/cagent`，`--cache-dir` 默认为 `~/Library/Caches/cagent` {{help-agent docker-agent}}。v1.32.4 插件打印了同样的三个值，debug 日志仍在 `~/.cagent/cagent.debug.log`（[冲突 C54](#s-ref-sources-and-the-conflicts-register)）。`CAGENT_*` 变量仍与 `DOCKER_AGENT_*` 一起被读取 {{rel-agent v1.30.0}}。

OCI 注解变成了 `io.docker.agent.version`，旧名字保留 {{rel-agent v1.23.3}}。Hub 镜像从 `docker/cagent` 迁到 `docker/docker-agent`，镜像里仍把 `cagent` 作为符号链接 {{rel-agent v1.30.0}}。在 `sbx` 中，`cagent` 仍是 `docker-agent` create 子命令的别名 {{help-sbx sbx create docker-agent}}。

沙箱状态没有迁移。插件把 VM 状态放在 `~/.docker/sandboxes/vm/` 下，镜像缓存在 `~/.docker/sandboxes/image-cache/` 下，它自己的 `reset` 帮助就是这么说的。`sbx` 把它的 socket 和日志放在 `~/Library/Application Support/com.docker.sandboxes/sandboxes/sandboxd/` 下（[这次 capture](manuals/docker-sandboxes-101/capture/out/02-daemon-status.txt)），没有任何页面描述迁移（[冲突 C17](#s-ref-sources-and-the-conflicts-register)）。没有 capture 列出残留目录。

在 Desktop 4.94.0 上，`docker info` 仍把该插件列为 `sandbox v0.13.0`（`29-docker-plugins.txt`），它的每条命令都打印移除通知：

```listing
title: Docker Desktop 4.94.0 上的 docker sandbox
source: capture/out/29-docker-sandbox.txt
lang: text
note: docker sandbox version 打印同样的通知，已删节。
---
$ docker sandbox --help
"docker sandbox" is deprecated and has been removed.

Please migrate to Docker Sandboxes: https://www.docker.com/products/docker-sandboxes
[exit 1]
```

这条通知点名的是产品页，不是 4.80.0 说明里的 `docker sbx`。在同一台主机上，捆绑的 `docker agent version` 打印 v1.144.0，Homebrew 的 `docker-agent version` 打印 v1.149.0（`29-docker-agent-plugin.txt`）。

```takeaways
- 在跟随 2025 年或 2026 年初的任何文章之前，把 `docker sandbox` 换成 `sbx`，把 `cagent` 换成 `docker agent`。
- 输入命令之前，用版本列核对文章的日期。
- Desktop 4.80.0 之后检查 `~/.docker/sandboxes/`，删除前先做一份拷贝，因为没有任何东西会迁移它。
- 把 `~/.cagent` 和 `~/.config/cagent` 留在原地，因为更名没有动它们。
```

Sources: docs-desktop 4.49.0, 4.58.0, 4.61.0, 4.64.0, 4.80.0, 4.81.0, 4.94.0 (research/sources/docs-desktop-release-notes.md); rel-agent v1.23.3, v1.23.4, v1.30.0, v1.147.0 (research/sources/docker-agent-CHANGELOG.md); rel-sbx v0.21.0, v0.31.0, v0.35.0, v0.42.0, v0.43.0, v0.45.0 (research/sources/sbx-releases.md); docs-agent Installation (research/sources/docs-docker-agent.md); help-sbx sbx create docker-agent (research/sources/help-sbx.md); help-agent docker-agent (research/sources/help-docker-agent.md); research/sources/help-legacy-docker-sandbox.md; research/sources/help-legacy-docker-agent.md; blog 2025-09-18, 2025-11-25, and research/conflicts-register.md rows C1, C17, C49, C50, C54, C107 to C112, S1 to S30; research/plan.md (the timeline); capture/out/01-help-sbx.txt, 01-help-docker-agent.txt, 02-daemon-status.txt, 04-env.txt, 04-second-sandbox.txt, 09-bypass-grep.txt, 29-docker-sandbox.txt, 29-docker-plugins.txt, 29-docker-agent-plugin.txt
