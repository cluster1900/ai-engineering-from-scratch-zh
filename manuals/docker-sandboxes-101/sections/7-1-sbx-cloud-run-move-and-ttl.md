# sbx --cloud run、sbx move 和 sbx ttl

> 云沙箱是 Docker 算力上的同一个 microVM，按秒计费、五种规格，TTL 上限 24 小时，并有自己的密钥和策略。

`m101-demo` 里的智能体做完一半长构建，你的笔记本进了包，沙箱随它停下。`sbx move m101-demo --to cloud` 捕获其文件系统，并在 Docker 的算力上再次启动它，那里由时钟结束它，合上盖子则不会。构建进程不会一起搬走，所以智能体会再跑一遍构建。读完本节后，你能在云上启动沙箱、沿任一方向移动沙箱，并设置结束它的时钟。

本版没有录制云运行，因为云沙箱要花钱，那次运行未获批准。下面每一条事实都来自帮助文本和文档。

## --cloud 标志及其隐藏的内容 {#s-sbx-cloud-run-move-and-ttl-the-cloud-flag-and-what-it-hides}

**云沙箱：** `sbx` 通过 Cloud Sandboxes API 而不是本地 `sandboxd` 创建的沙箱，用全局 `--cloud` 标志选择 {{help-sbx sbx}}。

```listing
title: 响应 --cloud 的动词
source: research/sources/help-sbx-cloud.md
lang: text
note: 2026-10-08 的 `sbx --cloud --help` 输出，删节为两组。缺少 daemon、prune、settings 和 skills。仅此处有 attach、ttl 和 volume。
---
Sandbox Commands:
  attach      Attach to a cloud sandbox, starting it first if it is stopped
  cp          Copy files or directories between a sandbox and the host
  create      Create a sandbox for an agent
  exec        Execute a command inside a sandbox
  ls          List sandboxes
  move        Move a sandbox between local and cloud
  ports       Manage sandbox port publishing
  rm          Remove one or more sandboxes
  run         Run an agent in a sandbox
  stop        Stop one or more sandboxes without removing them
  ttl         Inspect or extend a cloud sandbox's TTL
…
  volume      Manage persistent volumes (cloud-only)
```

云命令树去掉了 `daemon`、`prune`、`settings` 和 `skills`，带 `--cloud` 时 `rm --all` 会被拒绝 {{help-sbx sbx rm}}（[冲突 C47](#s-ref-sources-and-the-conflicts-register)）。沙箱、模板、密钥、卷和网络策略存放在单独的云存储中 {{docs-sbx Compare local and cloud sandboxes}}。

你需要 `sbx` 0.45.1 或更高版本，以及 Personal 或 Pro 账户上的按用量付费计划。文档页写的是 0.45.0，发布博客写的是 0.45.1（[冲突 C36](#s-ref-sources-and-the-conflicts-register)），Team 和 Business 账户未被提及（[冲突 C103](#s-ref-sources-and-the-conflicts-register)）。`sbx --cloud diagnose` 检查登录、云 API 和账户访问，不需要本地守护进程 {{docs-sbx Use cloud sandboxes}}。Docker Offload 是 Docker Desktop 的远程守护进程，是另一款产品，没有沙箱路径（[冲突 C98 和 C99](#s-ref-sources-and-the-conflicts-register)）。

## 规格、价格和配额 {#s-sbx-cloud-run-move-and-ttl-shapes-prices-and-quotas}

不给 `--cpus` 和 `--memory` 时，云沙箱得到 2 个 CPU 和 4 GiB {{help-sbx sbx create}}。这一对必须点名五种可计费规格之一 {{help-sbx sbx template load}}。价格来自 2026-09-24 的发布博客，文档树一份也没印（[冲突 C101](#s-ref-sources-and-the-conflicts-register)）。

| 规格 | vCPU | 内存 | 每小时价格，2026-09-24 的博客 |
|---|---|---|---|
| `micro` | 1 | 2048 MiB | $0.07 |
| `small`，默认值 | 2 | 4096 MiB | $0.14 |
| `medium` | 4 | 8192 MiB | $0.28 |
| `large` | 8 | 16384 MiB | $0.56 |
| `xl` | 16 | 32768 MiB | $1.12 |

博客按秒计量算力，文档确认了其中一半：已停止的沙箱不算算力费用 {{docs-sbx Use cloud sandboxes}}。同一篇博客里的 $250 额度是促销。一个账户起步有 10 个并发沙箱、50 个已存储沙箱、100 个卷、100 个密钥，以及 3 个准备中的镜像 {{docs-sbx-api Account quotas}}。

## sbx --cloud run 和 attach {#s-sbx-cloud-run-move-and-ttl-sbx-cloud-run-and-attach}

`sbx --cloud run claude --name cloud-project` 创建沙箱并附加到其智能体，或在已命名沙箱存在时重启它 {{help-sbx sbx run}}。`Ctrl-\` 分离，`sbx --cloud attach cloud-project` 再次加入会话 {{help-sbx sbx attach}}。`sbx --cloud ports cloud-project --publish 8080` 返回一个公共 HTTPS URL，所以它背后的服务需要自己的认证 {{docs-sbx Use cloud sandboxes}}。密钥来自 `sbx --cloud secret set anthropic`，规则来自 `sbx --cloud policy init`，后者可以再运行 {{help-sbx sbx policy init}}。HTTP 方法规则、`--protocol` 和治理 profile 在云上被拒绝 {{docs-sbx Manage cloud network policy}}。

## sbx ttl 和 --on-timeout {#s-sbx-cloud-run-move-and-ttl-sbx-ttl-and-on-timeout}

**TTL：** 云沙箱在其超时动作之前存活的时间，默认一小时，自创建起最多 24 小时 {{help-sbx sbx ttl}}。

`sbx --cloud ttl +2h cloud-project` 在该上限下延长过期时间，从不缩短它 {{help-sbx sbx ttl}}。`--on-timeout` 选择 `stop`、`restart` 或 `delete` {{help-sbx sbx create}}。省略它时，服务器停止可以恢复的沙箱，删除其余的。`restart` 需要至少一小时的 `--ttl`，由卷支撑的沙箱必须使用 `delete` {{docs-sbx Use cloud sandboxes}}。自 v0.47.0 起，已停止的沙箱报告 `stopped`，其时钟在恢复时重新开始 {{rel-sbx v0.47.0}}。卷是沙箱退出时拍摄的快照，最后一个退出的沙箱会覆盖它 {{help-sbx sbx volume}}。

## sbx move {#s-sbx-cloud-run-move-and-ttl-sbx-move}

```figure
id: fig-7-1
kind: flow
title: sbx move 带到云上的东西
claim: sbx move 把沙箱文件系统作为一张镜像复制，其余一律不带，所以密钥、挂载、本地规则和进程留在原处，而目的地启动 TTL 时钟.
caption: 先沿顶部从左到右读，再往下。绿色框随镜像带走，虚线灰色框留在主机上，琥珀色框是目的地的时钟。 From research/sources/help-sbx.md (sbx move) and docs-sandboxes.md (Move a sandbox), because no cloud run was recorded.
```

`sbx move m101-demo --to cloud` 把文件系统捕获为模板镜像、上传它，并创建一个带新 id 的沙箱，命名为 `moved-m101-demo` 加上后缀 {{help-sbx sbx move}}。kit 网络规则和本地环境随镜像旅行。主机绑定挂载、存储中的密钥、本地策略规则、主机端口绑定和正在运行的进程留在原处 {{help-sbx sbx move}}。交互式登录写入的凭据文件是普通文件，所以它们会一起走，除非你先删除它们 {{docs-sbx Move a sandbox}}。

HTTP 方法规则在移动前提示，因为云无法应用它们，`--force` 回答提示并保留警告。目的地在服务器默认的一小时后过期，除非 `--ttl` 和 `--on-timeout` 另有说明。移到本地时，最多可以在主机临时目录中暂存 32 GiB {{help-sbx sbx move}}。文档还警告，云沙箱内的 `docker exec` 可能读到 VM 文件系统而不是容器的（[冲突 C104](#s-ref-sources-and-the-conflicts-register)）。本版没有确认这一点。

```takeaways
- 对每个你想拿回工作的云 create 或 move 设置 `--ttl` 和 `--on-timeout stop`。
- 在第一次云运行之前配置 `sbx --cloud secret` 和 `sbx --cloud policy`，因为本地存储不适用。
- 把已发布的云端口当作公共端点，演示结束后取消发布。
- 在 `sbx move` 或 `template save` 之前删除沙箱内的凭据文件，因为快照会复制它们。
```

Sources: help-sbx sbx, sbx create, sbx run, sbx attach, sbx rm, sbx move, sbx ttl, sbx volume, sbx policy init, sbx template load (research/sources/help-sbx.md); research/sources/help-sbx-cloud.md; docs-sbx Cloud sandboxes, Authenticate cloud agents, Compare local and cloud sandboxes, Move a sandbox, Manage cloud network policy, Use cloud sandboxes (research/sources/docs-sandboxes.md); docs-sbx-api Compute sizes and limits, Account quotas (research/sources/docs-sandboxes-api.md); rel-sbx v0.45.0, v0.45.1, v0.47.0 (research/sources/sbx-releases.md); blog 2026-09-24 and research/conflicts-register.md rows C36, C47, C98, C99, C101, C103, C104; capture/out/01-help-sbx.txt
