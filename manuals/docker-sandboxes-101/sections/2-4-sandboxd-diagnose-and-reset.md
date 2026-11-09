# sandboxd、sbx diagnose 和 sbx reset

> 一个守护进程拥有每一个沙箱，它的套接字和日志位于同一个状态目录下，两条命令检查这个守护进程并把它清空。

`sbx ls` 会挂起，或者一条命令以 `ensure daemon: daemon exited unexpectedly` 失败，而你需要知道是哪个进程在应答、它写到哪里，以及如何从头开始。本部分的每个动词都通过 Unix 套接字与同一个主机守护进程 `sandboxd` 交谈。读完本节后，你能找到套接字和日志，读懂 `sbx diagnose` 的十三项检查，并说出 `sbx reset` 会删除什么。

## sandboxd {#s-sandboxd-diagnose-and-reset-sandboxd}

**sandboxd：** 每个本地 `sbx` 动词背后的主机守护进程，用 `sbx daemon start`、`stop`、`restart`、`status` 和 `log-level set` 管理。settings 命令用本地守护进程读取求值后的值并管理覆盖，守护进程未运行时它们会启动它 {{help-sbx sbx settings}}。所以 `sbx settings list` 的第一次探测在表格之前打印了 `Starting sandboxd daemon...`。`sbx daemon start -d` 在后台运行它。`--policy allow-all`、`balanced` 或 `deny-all` 同时初始化全局网络策略，由 [sbx policy init](#s-sbx-policy-init-allow-deny-and-check-network) 一节讲解。`sbx daemon log-level set TARGET LEVEL` 改变一个日志类别，`proxy`、`general` 或 `all`。

`sbx daemon status --json` 给出套接字和日志的名称，两者都在录制用的 Mac 上的 `~/Library/Application Support/com.docker.sandboxes/sandboxes/sandboxd/` 下，其中 `$HOME` 是 capture 掩码。

```listing
title: 守护进程在哪里侦听和写入
source: capture/out/02-daemon-status.json
lang: json
note: 未删节。
---
{
  "status": "running",
  "socket": "$HOME/Library/Application Support/com.docker.sandboxes/sandboxes/sandboxd/sandboxd.sock",
  "logs": "$HOME/Library/Application Support/com.docker.sandboxes/sandboxes/sandboxd/daemon.log"
}
```

日志是带 `time`、`level`、`msg`、`version` 的 JSON 行，常常还有一个 `runtime`、沙箱名称，[生命周期一节](#s-sbx-run-create-stop-and-rm)读了其中两行。自 v0.43.0 起，本地守护进程在 Unix 套接字和 Windows 命名管道上检查每个连接的操作系统用户 {{rel-sbx v0.43.0}}。自 v0.46.0 起，第二个守护进程在一个正在使用的状态目录上会以错误失败，并让正在运行的守护进程不受影响 {{docs-sbx release-notes}}。

## 状态目录 {#s-sandboxd-diagnose-and-reset-the-state-directory}

**状态目录：** sandboxd 保存沙箱、镜像、策略及其套接字的目录树。在 macOS 上它是 `~/Library/Application Support/com.docker.sandboxes/`，在 Windows 上是 `%LOCALAPPDATA%\DockerSandboxes`，在 Linux 上状态分布在三个目录 {{docs-sbx Removing all state}}：`~/.local/state/sandboxes/`、`~/.cache/sandboxes/` 和 `~/.config/sandboxes/`。发行版 v0.29.0 加入了 `SANDBOXES_STORAGE_ROOT` 覆盖 {{rel-sbx v0.29.0}}，v0.31.0 把状态目录的符号链接从 `/tmp` 移到了 `~/.sbx/run/` {{rel-sbx v0.31.0}}。守护进程把它的 containerd 套接字绑定在该符号链接下。`sbx kit builder history` 的帮助页是在一个无法绑定套接字的 shell 中捕获的，结尾是 `failed to create unix socket on $HOME/.sbx/run/d/containerd/containerd.sock.ttrpc` {{help-sbx sbx kit builder history}}。

还有两棵目录树很重要。第一棵是状态目录下 `sandboxes/agent-skills` 处的共享 skills 存储 {{docs-sbx agent-skills}}。第二棵是 `~/Library/Logs/com.docker.sandboxes/sandboxes/auditkit/` 下的审计日志，每个文件命名为 `audit-<utc-timestamp>-<process-uuid>-<seq>.jsonl` {{docs-sbx audit}}。2025 插件把它的 VM 放在 `~/.docker/sandboxes/vm/` 下，镜像放在 `~/.docker/sandboxes/image-cache/` 下，由[迁移一节](#s-from-docker-sandbox-and-cagent-to-sbx-and-docker-agent)对应。[图](#fig-2-3)画出 macOS 目录树，[设置表](#s-ref-settings-keys-environment-variables-and-paths)列出三个系统上的每条路径。

```figure
id: fig-2-3
kind: tree
title: macOS 上的 sandboxd 状态目录
claim: sandboxd 在 macOS 上拥有的一切都位于同一个 Application Support 目录下，审计日志在 Logs 下，符号链接在 ~/.sbx/run.
caption: 从上往下读。实线表示包含，虚线是符号链接，灰色虚线框是 2025 插件的目录树，由 docker sandbox reset 删除。 From capture/out/02-daemon-status.json, research/sources/docs-sandboxes.md, help-sbx.md, and sbx-releases.md.
```

## sbx diagnose {#s-sandboxd-diagnose-and-reset-sbx-diagnose}

`sbx diagnose` 分四组运行十三项检查，并为每一项打印通过、警告或失败。安装组找到二进制、它的版本、守护进程和一份诊断包。平台组确认 `kern.hv_support is 1`，并找到带默认块大小和客户机内核页大小的 `mkfs.erofs`。存储组检查状态目录、它的权限和剩余空间。连接组检查版本匹配、套接字、SSH 客户端配置和登录。

页大小检查之所以存在，是因为 v0.43.0 让 diagnose 在默认块大小大于沙箱内核页大小时发出警告 {{rel-sbx v0.43.0}}。在录制用的 Mac 上，块大小是 4096 字节，客户机页大小是 16384 字节，`m101-demo` 内的 `getconf PAGESIZE` 证实了这一点。

```listing
title: 两项平台检查和摘要
source: capture/out/02-diagnose.json
lang: json
note: 只保留 Virtualization 和 mkfs.erofs 检查以及摘要。字节计数被掩码为 <n>。
---
{
  "version": "1.0",
  "checks": [
    …
    {
      "name": "Virtualization",
      "status": "pass",
      "message": "supported",
      "detail": "kern.hv_support is 1",
      "hint": ""
    },
    {
      "name": "mkfs.erofs",
      "status": "pass",
      "message": "found",
      "detail": "/opt/homebrew/Caskroom/sbx/0.47.0/Sbx.app/Contents/libexec/mkfs.erofs, default block size <n> bytes, guest kernel page size <n> bytes",
      "hint": ""
    },
    …
  ],
  "summary": {
    "pass": 13,
    "warn": 0,
    "fail": 0,
    "skip": 0
  }
}
```

`--json` 给出一个 `version`、一个带 `name`、`status`、`message`、`detail` 和 `hint` 的 `checks` 数组，以及带 `pass`、`warn`、`fail` 和 `skip` 计数的 `summary`。`-o github-issue` 把同一份报告格式化为缺陷报告，`--upload` 把一份包发送给 Docker 支持。[sbx settings list](#s-sbx-settings-list) 中的 `diagnostics.autoUpload` 是自动上传的同意项。

## sbx reset {#s-sandboxd-diagnose-and-reset-sbx-reset}

`sbx reset` 把安装恢复到刚装好的状态，帮助文本列出了这些步骤 {{help-sbx sbx reset}}：

- 停止正在运行的沙箱，超时 30 s
- 清空镜像缓存和内部 registry
- 删除全部沙箱状态和全部策略
- 移除托管的 SSH 配置
- 清空 Gordon 助手的会话和历史 {{help-sbx sbx reset}}
- 删除已存储的密钥，除非使用 `--preserve-secrets`
- 退出登录，停止守护进程，并移除状态、缓存和配置目录

文档没有给 Gordon 在沙箱中安排角色，所以本手册只复述这一项，不多做论断，如[冲突 C33](#s-ref-sources-and-the-conflicts-register)所裁定。文档在升级之后使用这条命令。更新的 `sbx` 可以把本地数据库迁到旧二进制读不了的 schema {{docs-sbx sbx reset}}。这时 `--preserve-secrets` 会在这次迁移中保留你的密钥。

最后的办法是在 `sbx reset` 之后亲手删除状态目录。你的工作区仍留在原处。文档说移除沙箱时主机工作区文件留在主机上，而 `sbx reset` 只列出状态、缓存和配置目录。帮助文本点名但帮助树未列出的命令，例如 `sbx mount`，收集在 [sbx settings list](#s-sbx-settings-list) 中。

```takeaways
- 先运行 `sbx daemon status --json`，并打开它给出的 `daemon.log`。
- 在提交 issue 之前先读 `sbx diagnose --json`，并附上 `-o github-issue` 的输出。
- 在 schema 升级之后运行 `sbx reset --preserve-secrets`，并预期每一个沙箱和策略都会消失。
```

Sources: help-sbx sbx daemon, sbx daemon start, sbx daemon log-level set, sbx diagnose, sbx reset, sbx settings, sbx kit builder history (research/sources/help-sbx.md); rel-sbx v0.29.0, v0.31.0, v0.43.0 (research/sources/sbx-releases.md); docs-sbx release-notes, Removing all state, agent-skills, audit, usage (research/sources/docs-sandboxes.md); research/sources/probes/sbx-diagnose.txt, sbx-settings-list.txt; help-legacy-docker-sandbox.md (docker sandbox reset); conflict C33 (research/conflicts-register.md); capture/out/02-daemon-status.json, 02-daemon-status.txt, 02-diagnose.json, 02-diagnose.txt, 04-auto-stop.txt, 04-guest.txt
