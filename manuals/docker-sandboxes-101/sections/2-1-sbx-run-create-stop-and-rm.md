# sbx run、sbx create、sbx stop 和 sbx rm

> `sbx run` 在沙箱不存在时创建它并附加上去，`sbx create` 只创建，而 `stop`、`rm` 和 `prune` 以三种不同方式结束沙箱。

你有一个带两次提交和一份 README 的仓库，希望一个 shell 智能体只在它上面工作、不碰别的。capture 用 `sbx create shell $CAPTURE/fixtures/repo --name m101-demo` 做到这一点，其中 `$CAPTURE` 代表 capture 目录，本部分的其余内容复用这个沙箱。读完本节后，你能说出创建、附加、停止、删除或 `prune` 沙箱的动词，以及每个动词会保留什么。

## 智能体和工作区 {#s-sbx-run-create-stop-and-rm-the-agent-and-the-workspace}

**智能体：** `sbx run` 和 `sbx create` 的第一个位置参数：内置智能体名称，或对沙箱 kit 的引用 {{help-sbx sbx run}}。内置名称是 claude、codex、copilot、cursor、devin、docker-agent、droid、gemini、kiro、opencode 和 shell。kit 引用可以是目录、ZIP 文件、git 仓库或 OCI 引用。相对路径必须写明确，例如 `./my-kit` 或 `../my-kit.zip` {{help-sbx sbx run}}。所以 `sbx run my-kit` 会查找名为 `my-kit` 的智能体，而 `sbx run ./my-kit` 会读取一个 kit，如[kit 描述符](#s-syntax-docker-sandbox-kit-3-and-kit-yaml)一节所述。

**工作区：** 智能体后面的目录，以相同的绝对路径挂载进 microVM。在 `m101-demo` 内部，`pwd` 打印 `$CAPTURE/fixtures/repo`，`mount` 把该路径列为 `virtiofs` 挂载。不给路径时，`sbx run` 挂载当前目录。不带路径的 `sbx create` 会创建一个没有挂载的沙箱。

此时智能体在容器的文件系统中工作，而不是在你的文件上 {{help-sbx sbx create}}。额外路径跟在第一条后面，`:ro` 把其中一条挂载为只读。只读参数可以命名单个文件。这样在沙箱其余部分可写的工作区里，有一条路径它够不着 {{help-sbx sbx run}}。

```listing
title: create 命令及其摘要
source: capture/out/04-create.txt
lang: text
note: 未删节。镜像层已掩码为 <layers>。
---
$ sbx create shell $CAPTURE/fixtures/repo --name m101-demo

sandbox    m101-demo
agent      shell
workspace  $CAPTURE/fixtures/repo (rw)
image      docker/sandbox-templates:shell-docker
cpu        10
memory     32 GiB

Pulling image
  <layers>
✓ Image ready
✓ Created sandbox m101-demo

To connect to this sandbox, run:
  sbx run --name m101-demo
[exit 0]
```

```listing
title: 从内部看到的工作区
source: capture/out/04-workspace.txt
lang: text
note: 目录列表和 README 文本已删节。
---
$ sbx exec m101-demo sh -c 'pwd; echo; ls -la; echo; cat README.md; echo; git log --oneline'
$CAPTURE/fixtures/repo
…
c7dfd56 second
086df68 first
[exit 0]
```

## 名称和重新附加 {#s-sbx-run-create-stop-and-rm-names-and-re-attach}

**名称：** 沙箱在之后每条命令中的键，默认是 `<agent>-<workdir>`，即智能体名称和工作区目录名。名称至少两个字符，以字母或数字开头。它只包含字母、数字、连字符和句点，而 `--cloud` 拒绝句点。名称 `default` 是保留的 {{help-sbx sbx create}}。自 v0.43.0 起，守护进程还会拒绝长于 63 个字符、或以连字符或句点结尾的名称 {{rel-sbx v0.43.0}}。2025 年的插件允许名称中使用 `_` 和 `+`，[冲突 C25](#s-ref-sources-and-the-conflicts-register) 记录了这一变化。

两个沙箱可以共享一个工作区。capture 在同一个 `fixtures/repo` 上创建了 `m101-demo-2`，`sbx ls --json` 把两者都列为 running。2026-03-11 的一篇博文说 Docker 强制每个工作区只有一个沙箱 {{blog 2026-03-11}}。2026-08-13 的一次演讲在两个终端里对同一个工作区运行 claude 和 codex {{talk 2026-08-13}}，而 [S27](#s-ref-sources-and-the-conflicts-register) 裁定由名称决定。

`sbx run` 上的 `--name` 重新附加到已有沙箱，之后可以省略智能体。`sbx run` 从已有沙箱的 spec 中读取它 {{help-sbx sbx run}}。也给出智能体时，`sbx run` 会对照已存储的那个检查。`sbx create` 在输出末尾打印这条重新附加命令。

```listing
title: 同一个工作区上的两个沙箱
source: capture/out/04-second-sandbox.json
lang: json
note: 只保留每条记录的 name、status 和工作区。m101-demo 的端口属于下一节。
---
{
  "sandboxes": [
    {
      "name": "m101-demo",
      …
      "status": "running",
      …
      "workspaces": [
        "$CAPTURE/fixtures/repo"
      ],
      …
    },
    {
      "name": "m101-demo-2",
      …
      "status": "running",
      …
      "workspaces": [
        "$CAPTURE/fixtures/repo"
      ],
      …
    }
  ]
}
```

## 创建时固定的内容 {#s-sbx-run-create-stop-and-rm-what-is-fixed-at-creation}

有些标志在每次附加时都生效，大多数只在创建沙箱时生效一次。用不同的 `-p` 或 `--skills` 重新附加不会改变任何东西，帮助文本按标志逐一说明了这一点。

| 标志 | 何时生效 | 帮助页 |
|---|---|---|
| `-e KEY=VALUE`、`--env-file FILE` | 每次附加时的智能体会话，并且在本次运行创建沙箱时存入沙箱 | `sbx run` |
| `--cpus N`、`-m SIZE` | 创建时，内存默认为主机内存的一半，介于 512 MiB 和 32 GiB 之间 | `sbx create` |
| `-p PORT`、`--deny-network HOST` | 创建时，重新附加时忽略 `-p` | `sbx run` |
| `--skills MODE`、`--static-mcp NAMES`、`--profile NAME` | 仅创建时 | `sbx run` |
| `-t IMAGE`、`--pull POLICY` | 创建时，`--pull` 为 `always`、`missing` 或 `never`，默认 `always` | `sbx run` |
| `-d` | 打印沙箱 id 并退出，不打开会话 | `sbx run` |
| `--rm` | 智能体会话退出后删除沙箱，v0.47.0 新增 | `sbx run` |

录制用的 Mac 给 `m101-demo` 分配了 `cpu 10` 和 `memory 32 GiB`，即内存钳制的上限。`--rm` 不能与 `--detached` 一起使用 {{rel-sbx v0.47.0}}，因为分离运行没有可结束的会话。

## stop、rm 和 prune {#s-sbx-run-create-stop-and-rm-stop-rm-and-prune}

`sbx stop` 保留沙箱并结束其 microVM。capture 打印 `state preserved` 以及重启命令。文档列出了 stop 再重启后仍然保留的内容 {{docs-sbx usage}}。即已安装的软件包、Docker 镜像、配置更改、命令历史，以及不在挂载上的工作区文件。守护进程也会自行停止沙箱。capture 关闭最后一次会话并等待之后，`sbx ls` 显示 `m101-demo` 为 `stopped`，`daemon.log` 给出原因。

```listing
title: 守护进程停止空闲沙箱
source: capture/out/04-auto-stop.txt
lang: text
note: 只保留日志查询及其两行。时间戳已掩码为 <ts>。
---
$ grep auto-stop daemon.log | grep m101-demo | tail -2
{"time":"<ts>","level":"INFO","msg":"auto-stop grace period expired, stopping runtime","version":"v0.47.0 0411f50ee4700fe7bd37e6e7e3aced563e850ca9","runtime":"m101-demo"}
{"time":"<ts>","level":"INFO","msg":"auto-stopped runtime after last session disconnected","version":"v0.47.0 0411f50ee4700fe7bd37e6e7e3aced563e850ca9","runtime":"m101-demo"}
```

对已有沙箱执行 `sbx run -d`，会在会话断开后让它继续运行，直到你停止或删除它 {{docs-sbx release-notes}}。kit 可以声明 `com.docker.sandbox/long-running@1` 达到同样效果，如[capabilities 一节](#s-com-docker-sandbox-capabilities)所示。

`sbx rm` 是 stop 的反面。对于本地沙箱，它停止沙箱、删除其容器，并清理其 Git worktree。它还会删除该沙箱的状态和密钥 {{help-sbx sbx rm}}。`--force` 跳过提示并删除带有打开 SSH 连接的沙箱，`--all` 删除每一个本地沙箱。

`sbx prune` 只删除已停止的沙箱，因为 prune 从不删除正在运行的沙箱 {{help-sbx sbx prune}}。`--filter until=168h` 保留最近一周内停止的任何沙箱，守护进程无法报告停止时间的沙箱则放过。`--dry-run --json` 在你确认之前显示这两类。

```listing
title: 一次 stop 之后的试运行
source: capture/out/04-prune-dry-run.json
lang: json
note: 未删节。m101-demo 当时仍在运行。
---
{
  "would_remove": [
    {
      "name": "m101-demo-2",
      "agent": "shell",
      "stopped_at": "<ts>",
      "workspaces": [
        "$CAPTURE/fixtures/repo"
      ]
    }
  ],
  "skipped_unknown_stop": []
}
```

```listing
title: 结束本部分的 prune
source: capture/out/04-prune.txt
lang: text
note: prune 之前对 m101-demo 的 stop 已删节。
---
$ sbx prune --force
Deleting sandbox m101-demo...
Sandbox 'm101-demo' removed
Deleting sandbox m101-demo-2...
Sandbox 'm101-demo-2' removed
[exit 0]

$ sbx ls --json
{
  "sandboxes": []
}
[exit 0]
```

`rm` 和 `prune` 都会删除限定在该沙箱范围内的密钥，[sbx secret](#s-sbx-secret-set-import-and-set-custom) 一节会讲解。[图](#fig-2-1) 把这些动词放在一台状态机的边上。

```figure
id: fig-2-1
kind: state
title: 本地沙箱的四种状态
claim: 沙箱处于不存在、运行中、已停止或已删除，本节中的每个 sbx 动词都沿恰好一条边移动它.
caption: 从左到右读。虚线琥珀色箭头是状态变化，名称是 capture 的两个沙箱，虚线框内没有正在运行的 microVM。 From capture/out/04-create.txt, 04-stop.txt, 04-auto-stop.txt, and 04-prune.txt.
```

```takeaways
- 用 `--name` 给每个沙箱命名，这样同一目录上的两个智能体彼此分开。
- 在创建时设置内存、端口、skills 和静态 MCP 服务器，因为重新附加会忽略它们。
- 用 `sbx stop` 保留状态，用 `sbx rm` 删除状态，并先运行 `sbx prune --dry-run`。
```

Sources: help-sbx sbx run, sbx create, sbx stop, sbx rm, sbx prune (research/sources/help-sbx.md); rel-sbx v0.43.0 and v0.47.0 (research/sources/sbx-releases.md); docs-sbx usage and release-notes (research/sources/docs-sandboxes.md); conflicts C25, S27 (research/conflicts-register.md); capture/out/04-create.txt, 04-workspace.txt, 04-guest.txt, 04-ls.json, 04-second-sandbox.txt, 04-second-sandbox.json, 04-stop.txt, 04-auto-stop.txt, 04-prune-dry-run.json, 04-prune.txt
