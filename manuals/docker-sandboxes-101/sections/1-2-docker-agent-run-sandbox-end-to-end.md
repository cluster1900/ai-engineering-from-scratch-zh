# docker-agent run --sandbox，一次端到端运行

> 一次录制的 `docker-agent run --sandbox` 展示 kit、沙箱和允许列表，对同一台 VM 的一次 `sbx exec` 展示经代理发出的模型调用。

你有一份带 `filesystem` 和 `shell` toolset 的智能体文件，它的模型是你 Mac 上 Docker Model Runner 中的 `ai/qwen3:4b`。在主机上，`shell` 以你的权限运行。`--sandbox` 把工具移入 microVM，把模型留在主机上。

本节逐步跟随[这次录制的运行](manuals/docker-sandboxes-101/capture/out)，[图](#fig-1-3)画出它。读完本节后，你能读懂一次沙箱运行的启动摘要，并解释这次运行遇到的两次失败。

```figure
id: fig-1-3
kind: sequence
title: 一次 docker-agent run --sandbox，逐步展开
claim: docker-agent 暂存一个 kit，让 sbx 创建 VM，并在代理上打开两个主机，随后来自内部的模型调用经该代理离开.
caption: 从上往下读，每一步一行编号，第 8 行是结束这次运行的失败。第 1 到 8 行来自 allow、run 和 kit-cache 的 capture。第 9 到 15 行来自内部运行和删除的 capture。第 12 行的 chunk 名是 cassette 的流格式。
```

## 智能体文件 {#s-docker-agent-run-sandbox-end-to-end-the-agent-file}

智能体文件与主机版本的唯一差别在于它的 provider。从沙箱内部无法到达主机的 `127.0.0.1` {{docs-sbx Accessing host services from a sandbox}}，所以 provider 指向 `host.docker.internal`：

```listing
title: 沙箱智能体文件的 provider 块
source: capture/fixtures/agents/files-sandbox.yaml
lang: yaml
note: 只保留 version、provider 和 model。智能体、它的 instruction 和它的两个 toolset 已删节。
---
version: "16"

providers:
  host-runner:
    provider: dmr
    base_url: http://host.docker.internal:12434/engines/llama.cpp/v1

models:
  local:
    provider: host-runner
    model: ai/qwen3:4b
    temperature: 0
…
```

## 第 1 步：允许模型主机 {#s-docker-agent-run-sandbox-end-to-end-step-1-allow-the-model-host}

**持久允许列表：** `docker-agent sandbox allow` 存储的主机，docker-agent 在之后每次 `--sandbox` 运行时把它们加入沙箱代理的允许规则 {{help-agent docker-agent sandbox allow}}。帮助文本把它称为 `Blocked by network policy` 403 的修复办法。代理把 `host.docker.internal` 翻译成 `localhost`，所以 capture 在运行前允许 `localhost:12434`：

```listing
title: 向持久允许列表添加的一台主机
source: capture/out/27-sandbox-allow.txt
lang: text
note: 首次运行的欢迎横幅和遥测通知已删节，第二条命令也已删节。
---
$ docker-agent sandbox allow localhost:12434  (--config-dir, --data-dir, --cache-dir under fixtures/repo-sandbox/.m101, inside the workspace)
…
Added 1 host(s) to the persistent sandbox allowlist:
  + localhost:12434
[exit 0]
…
```

## 第 2 步：把状态目录放在工作区里 {#s-docker-agent-run-sandbox-end-to-end-step-2-keep-the-state-directories-in-the-workspace}

capture kit 用 `--data-dir`、`--cache-dir` 和 `--config-dir` 把 docker-agent 挡在 `~/.cagent` 之外。使用 `--sandbox` 时，工作区外的数据目录会被拒绝，帮助文本只给出默认值 `~/.cagent` {{help-agent docker-agent run}}。因此 capture kit 把这三个目录都放在工作区的 `.m101/` 下：

```listing
title: 工作区外的数据目录
source: capture/out/27-data-dir-outside.txt
lang: text
note: 命令行已删节。
---
…
Error: --data-dir must be inside the sandbox's writable workspace $CAPTURE/fixtures/repo-sandbox
[exit 1]
```

## 第 3 步：启动摘要 {#s-docker-agent-run-sandbox-end-to-end-step-3-the-launch-summary}

```listing
title: docker-agent run --sandbox 的启动摘要
source: capture/out/27-sandbox-run.txt
lang: text
note: 命令行和镜像拉取进度已删节。其余输出在第 5 步继续。
---
…
Models gateway: none configured
Models catalog: allowlisting models.dev in the sandbox proxy
User sandbox allowlist: allowlisting 1 host(s) from `docker agent sandbox allow`:
  - localhost:12434

sandbox    docker-agent-<hash>
agent      docker-agent
workspace  $CAPTURE/fixtures/repo-sandbox (rw)
           $CAPTURE/fixtures/agents (ro)
           $CAPTURE/fixtures/repo-sandbox/.m101/cache/sandbox-kits/<hash> (ro)
           $CAPTURE/fixtures/repo-sandbox/.m101/cfg (ro)
image      docker/docker-agent-sbx-templates:latest
cpu        10
memory     32 GiB
…
✓ Created sandbox docker-agent-<hash>
```

这次运行没有设置 `--models-gateway`。它允许 `models.dev`，因为没有该主机时，第一次 catalog 查找会以 `403 Blocked by network policy` 失败 {{docs-agent Auto-Kit}}。下一行重复第 1 步的主机。

**Auto-kit：** docker-agent 在主机上暂存并只读挂载进 VM、路径相同的目录 {{docs-agent Auto-Kit}}。这里它是 `.m101/cache/sandbox-kits/<hash>`，它的 `manifest.json` 只含 `agent_ref` 和 `built_at`（[这次 capture](manuals/docker-sandboxes-101/capture/out/27-kit-cache.txt)）。工作区是读写的，智能体文件的目录、kit 和配置目录是只读的。

## 第 4 步：一个普通沙箱 {#s-docker-agent-run-sandbox-end-to-end-step-4-an-ordinary-sandbox}

运行期间，`sbx ls` 列出 `docker-agent-<hash>`，智能体为 `docker-agent`，状态为 `running`，以及同样的四个工作区，其中三个是 `:ro`（[这次 capture](manuals/docker-sandboxes-101/capture/out/27-sbx-ls.txt)）。这个沙箱是普通沙箱，`sbx` 像对待其他沙箱一样列出并删除它。

## 第 5 步：会话存储失败 {#s-docker-agent-run-sandbox-end-to-end-step-5-the-session-store-fails}

在 VM 内部，运行在任何模型调用之前就停了：

```listing
title: 这次沙箱运行的结尾
source: capture/out/27-sandbox-run.txt
lang: text
note: 错误之前的两条自更新警告已删节。
---
…
Error: creating session store: migration failed even after database reset: failed to create migrations table: attempt to write a readonly database (1032)
Error: 
[exit 1]
```

数据目录位于 `virtiofs` 工作区挂载上，`mount` 把它列为 `rw`。在同一挂载上的 Python `sqlite3` 写入以同样方式失败（[这次 capture](manuals/docker-sandboxes-101/capture/out/27-sqlite-probe.txt)），所以在这台主机上 SQLite 无法通过该挂载写入。这次运行没有打印 safety mode，所以 [冲突 C62](#s-ref-sources-and-the-conflicts-register) 仍未关闭。Docker Agent 退出，但它不停止也不删除沙箱 VM {{docs-agent Sandbox Mode}}，VM 保持 `running`。

## 第 6 步：来自内部的模型调用 {#s-docker-agent-run-sandbox-end-to-end-step-6-the-model-call-from-inside}

```listing
title: VM 内部的智能体二进制和代理设置
source: capture/out/27-inside.txt
lang: text
note: 只保留版本、四行环境和 VM 内允许列表。其余变量和自更新警告已删节。
---
docker-agent version main
Commit: 154b78f2d517dae1397866dfb7586c4a302a3151
…
ANTHROPIC_API_KEY=proxy-managed
…
HTTP_PROXY=http://gateway.docker.internal:3128
…
NO_PROXY=localhost,127.0.0.1,::1,gateway.docker.internal
OPENAI_API_KEY=proxy-managed
…
Persistent sandbox allowlist is empty.
```

模板运行的是 `docker-agent version main`，不是 v1.149.0，尽管文档说 `:latest` 由最近的 `v*` 发行版构建 {{docs-agent Sandbox Mode}}。provider 密钥读作 `proxy-managed`。VM 内允许列表是空的，因为被允许的主机作为代理规则从主机到达。

随后 capture 在 VM 内部手工启动同一份智能体文件，状态放在 `/tmp/m101`。这次运行展示从 VM 出发的模型路径，而不是一次能工作的 `--sandbox` 启动：

```listing
title: 来自 VM 内部的模型调用
source: capture/out/27-inside-run.txt
lang: text
note: 命令行在状态标志之后删节，两条自更新警告已删节。
---
$ sbx exec docker-agent-<hash> sh -c 'docker-agent --config-dir /tmp/m101 --data-dir /tmp/m101 --cache-dir /tmp/m101 run --exec --last …
…
The working directory contains README.md with 1 line.
[exit 0]
```

发往 `host.docker.internal:12434` 的请求经 `HTTP_PROXY` 离开，因为该主机不在 `NO_PROXY` 中。沙箱代理在转发请求之前把 `host.docker.internal` 改成 `localhost` {{docs-sbx Accessing host services from a sandbox}}，第 1 步的规则放行它。回答是对的：capture kit 把同一份 README 复制到每个工作区，其中只有一行 `hello`（[这次 capture](manuals/docker-sandboxes-101/capture/out/04-workspace.txt)）。

## 第 7 步：删除沙箱 {#s-docker-agent-run-sandbox-end-to-end-step-7-remove-the-sandbox}

```listing
title: 删除
source: capture/out/27-sbx-rm.txt
lang: text
note: 未删节。
---
$ sbx rm --force docker-agent-<hash>
Deleting sandbox docker-agent-<hash>...
Sandbox 'docker-agent-<hash>' removed
[exit 0]
```

之后从同一工作区的运行会复用这台 VM，只有挂载集合变化时才创建新的 {{docs-agent Sandbox Mode}}。

```takeaways
- 第一次沙箱运行之前，用 `docker-agent sandbox allow localhost:PORT` 允许每个主机服务。
- 预期 `--sandbox` 会拒绝工作区外的 `--data-dir`，并先测试 SQLite 能否在其中写入。
- 从启动摘要读取每个挂载模式、镜像和每个被允许的主机。
- 不再需要沙箱时用 `sbx rm` 删除它，因为 docker-agent 会让它继续运行。
```

Sources: help-agent docker-agent run, docker-agent sandbox allow (research/sources/help-docker-agent.md); docs-agent Sandbox Mode, Auto-Kit (research/sources/docs-docker-agent.md); docs-sbx Accessing host services from a sandbox (research/sources/docs-sandboxes.md); research/conflicts-register.md rows C61, C62; capture/README.md; capture/fixtures/agents/files-sandbox.yaml; capture/out/27-sandbox-allow.txt, 27-data-dir-outside.txt, 27-sandbox-run.txt, 27-kit-cache.txt, 27-sbx-ls.txt, 27-sqlite-probe.txt, 27-inside.txt, 27-inside-run.txt, 27-sbx-rm.txt, 04-workspace.txt; capture/cassettes/18-files.yaml.gz
