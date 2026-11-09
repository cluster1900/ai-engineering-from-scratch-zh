---
id: docker-sandboxes
title: Docker Sandboxes for Agents
code: DS
subtitle: 在 microVM 里运行智能体，控制它的网络和密钥，并取回它的提交。sbx 0.47.0，docker-agent 1.149.0。
hue: 210
sources: manuals/docker-sandboxes-101
source_hash: 27c0ba82cd494898
---

## 各部分在哪里运行
type: architecture
from: manuals/docker-sandboxes-101/sections/1-1-sbx-and-docker-agent.md, manuals/docker-sandboxes-101/sections/2-2-sbx-exec-cp-and-ports.md, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md, manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md, manuals/docker-sandboxes-101/sections/2-4-sandboxd-diagnose-and-reset.md

```arch
node | cli | 1,1 | sbx CLI | host
node | daemon | 2,1 | sandboxd | sandboxd.sock, daemon.log
node | keys | 3,1 | Secret store | macOS Keychain
node | vm | 1,2 | Sandbox microVM | own kernel, private Docker Engine
node | agent | 2,2 | Agent | user agent, uid 1000
node | proxy | 3,2 | Forward proxy | gateway.docker.internal:3128
node | ws | 1,3 | Workspace | virtiofs, same absolute path
node | net | 3,3 | Allowed hosts | policy rules
edge | cli | daemon | socket
edge | daemon | vm | starts
edge | vm | agent | runs
edge | agent | proxy | HTTPS_PROXY
edge | keys | proxy | swap
edge | proxy | net | allowed
edge | vm | ws | mount
```

## 一次请求离开沙箱
type: flow
from: manuals/docker-sandboxes-101/sections/2-1-sbx-run-create-stop-and-rm.md, manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md, manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md

1. **sbx create**：sandboxd 拉取模板并启动 microVM。
2. **智能体**：把请求发到主机上的正向代理。
3. **授权器**：匹配的拒绝胜出。没有匹配的允许就是隐式拒绝。
4. **被阻止**：代理在 TLS 内部以 "Approval required" 回答 403。
5. **已允许**：代理把该主机作为 `forward-bypass` 做成隧道。
6. **已绑定密钥**：代理把哨兵值换成已存储的值。
7. **policy log**：每个主机一行，带上代理类型和规则。

## 沙箱生命周期
type: task-table
from: manuals/docker-sandboxes-101/capture/out/04-create.txt, manuals/docker-sandboxes-101/capture/out/07-template-save.txt, manuals/docker-sandboxes-101/capture/out/06-cp.txt, manuals/docker-sandboxes-101/capture/out/05-ports.txt, manuals/docker-sandboxes-101/capture/out/04-stop.txt, manuals/docker-sandboxes-101/capture/out/04-prune.txt, manuals/docker-sandboxes-101/capture/out/04-ls.txt, manuals/docker-sandboxes-101/sections/2-1-sbx-run-create-stop-and-rm.md

| 任务 | 代码 |
|---|---|
| 在仓库上创建 | `sbx create shell <path> --name <name>` |
| 再次附加 | `sbx run --name <name>` |
| 以 root 运行一条命令 | `sbx exec -u root <name> sh -c '<cmd>'` |
| 拷入一个文件 | `sbx cp <host-file> <name>:/tmp/in.txt` |
| 发布一个端口 | `sbx ports <name> --publish 18081:8080` |
| 停止并保留状态 | `sbx stop <name>` |
| 删除已停止的沙箱 | `sbx prune --force` |

## 密钥、MCP 与健康检查
type: task-table
from: manuals/docker-sandboxes-101/capture/out/10-set-custom.txt, manuals/docker-sandboxes-101/capture/out/10-import-dry-run.txt, manuals/docker-sandboxes-101/capture/out/11-mcp-add.txt, manuals/docker-sandboxes-101/capture/out/11-load.txt, manuals/docker-sandboxes-101/capture/out/02-daemon-status.txt, manuals/docker-sandboxes-101/capture/out/02-diagnose.txt, manuals/docker-sandboxes-101/capture/out/07-template-save.txt, manuals/docker-sandboxes-101/capture/out/27-sandbox-run.txt

| 任务 | 代码 |
|---|---|
| 把密钥绑定到主机 | `sbx secret set-custom --host <host> --env <VAR> --value <value>` |
| 在主机环境里查找密钥 | `sbx secret import --dry-run` |
| 注册一个 MCP 服务器 | `sbx mcp add <name> --url <url>` |
| 把它附加到一个沙箱 | `sbx mcp load <name> --sandbox <sandbox>` |
| 运行这 13 项检查 | `sbx diagnose` |
| 保存一个模板 | `sbx template save <name> <tag> --output <file>.tar` |
| 在沙箱里运行智能体文件 | `docker-agent run --sandbox --exec <agent-file> '<prompt>'` |

## Clone 模式往返
type: annotated-code
lang: bash
from: manuals/docker-sandboxes-101/capture/out/08-clone-create.txt, manuals/docker-sandboxes-101/capture/out/08-clone-host.txt, manuals/docker-sandboxes-101/capture/out/08-clone-rm.txt, manuals/docker-sandboxes-101/sections/3-2-clone-and-run-sandbox-source.md, manuals/docker-sandboxes-101/sections/2-1-sbx-run-create-stop-and-rm.md

```bash
sbx create --clone shell <repo> \  # private clone, host repo read-only
  --name <name>  # source at /run/sandbox/source
sbx exec <name> sh -c '<edit and git commit>'  # agent commits in the clone
git -C <repo> remote -v  # sbx added sandbox-<name>
git -C <repo> fetch sandbox-<name>  # bring the commits back
sbx rm --force <name>  # VM, state and scoped secrets go
```

## 调试被阻止的主机
type: annotated-code
lang: bash
from: manuals/docker-sandboxes-101/capture/out/03-policy-init.txt, manuals/docker-sandboxes-101/capture/out/09-create.txt, manuals/docker-sandboxes-101/capture/out/09-blocked-by-rule.txt, manuals/docker-sandboxes-101/capture/out/09-policy-log.txt, manuals/docker-sandboxes-101/capture/out/09-allow.txt, manuals/docker-sandboxes-101/capture/out/09-rm-allow.txt, manuals/docker-sandboxes-101/capture/run.py

```bash
sbx policy init balanced  # once, before the first sandbox
sbx create shell --name m101-policy  # no workspace mount
sbx exec m101-policy sh -c \
  'curl -sS --max-time 10 https://example.com'  # Approval required
sbx policy log m101-policy  # forward, default deny
sbx policy allow network \
  --sandbox m101-policy example.com  # rule for one sandbox
sbx policy check network example.com \
  --sandbox m101-policy --verbose --json  # read allowed, rule
```

## 智能体在内部看到什么
type: command-table
from: manuals/docker-sandboxes-101/capture/out/04-env.txt, manuals/docker-sandboxes-101/capture/out/10-env-sentinel.txt, manuals/docker-sandboxes-101/capture/out/09-policy-log.txt, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md, manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md

| 命令 | 作用 |
|---|---|
| `HTTPS_PROXY=http://gateway.docker.internal:3128` | HTTP 和 HTTPS 的正向代理 |
| `ANTHROPIC_API_KEY=proxy-managed` | 哨兵值。真实密钥留在主机上 |
| `M101_RECV_KEY=sbx-cs-<rand>` | 自定义密钥的占位符 |
| `SSH_AUTH_SOCK=/run/ssh-agent.sock` | 主机 SSH agent，默认转发 |
| `forward-bypass` | 日志中的代理类型。隧道，不做检查 |
| `transparent` | 日志中的代理类型。其他 TCP，不注入 |
| `"deny_kind": "explicit"` | 一条规则拒绝了它。`implicit` 表示没有允许 |

## 默认值
type: defaults
from: manuals/docker-sandboxes-101/sections/r-1-sbx-commands.md, manuals/docker-sandboxes-101/sections/r-3-settings-keys-environment-variables-and-paths.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--name` | `<agent>-<workdir>` | 设上它，这样两个智能体彼此分开 |
| `-m, --memory` | 主机内存的 50% | 钳制在 512 MiB 到 32 GiB |
| `--pull` | `always` | 也可以是 `missing` 或 `never` |
| `--skills` | `readonly` | 也可以是 `off` 或 `readwrite` |
| `secret set --refresh` | `55m` | 动态源的刷新 |
| `ssh.agentForwardingEnabled` | `true` | 对你不信任的智能体关掉它 |
| `sandbox.disk.dockerVolume` | `10g` | `/var/lib/docker` 的大小 |
| `kit.allowedSources` | `["docker.io/"]` | 允许的远程 kit 源 |

## 关键概念
type: concepts
from: manuals/docker-sandboxes-101/sections/r-8-glossary-and-index-of-figures.md, manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md

- **沙箱**：带有自己的内核和私有 Docker Engine 的 microVM。
- **Clone 模式**：`--clone`。智能体在私有 clone 上工作。提交通过一个 remote 返回。
- **预设**：`allow-all`、`balanced` 或 `deny-all`，用 `sbx policy init` 设置一次。
- **策略范围**：`global` 用于所有沙箱，或用 `--sandbox` 指定一个沙箱。
- **拒绝优先**：对同一主机，拒绝规则压过允许规则。
- **哨兵值**：智能体看到的、用来代替密钥的占位符。

## 排障
type: troubleshooting
from: manuals/docker-sandboxes-101/capture/out/09-blocked.txt, manuals/docker-sandboxes-101/capture/out/05-ports-curl.txt, manuals/docker-sandboxes-101/capture/out/06-cp.txt, manuals/docker-sandboxes-101/capture/out/09-deny-conflict.txt, manuals/docker-sandboxes-101/capture/out/09-rm-allow.txt, manuals/docker-sandboxes-101/capture/out/07-template-save.txt, manuals/docker-sandboxes-101/sections/2-2-sbx-exec-cp-and-ports.md, manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md, manuals/docker-sandboxes-101/sections/3-2-clone-and-run-sandbox-source.md, manuals/docker-sandboxes-101/sections/2-4-sandboxd-diagnose-and-reset.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `Approval required for example.com:443.` | 没有允许规则匹配 | `sbx policy allow network --sandbox <name> <host>` |
| 对 `::1` 的 curl 以退出码 7 失败 | 端口以 `tcp4` 发布 | 为两个地址族发布 `8080/tcp` |
| `copying between sandboxes is not supported` | `cp` 需要主机这一侧 | 经主机拷贝 |
| 拒绝 `conflicts with existing allow rule` | 同一范围内既有允许又有拒绝 | 先 `sbx policy rm network --id <uuid>` |
| 从 `~/.zshrc` 拿不到 API 密钥 | 自 v0.35.0 起不再读取主机环境 | `sbx secret set` 或 `sbx secret import` |
| `ensure daemon: daemon exited unexpectedly` | sandboxd 出了问题 | `sbx daemon status --json`，阅读 `daemon.log` |

## 问题
type: qa
from: manuals/docker-sandboxes-101/sections/1-1-sbx-and-docker-agent.md, manuals/docker-sandboxes-101/sections/2-1-sbx-run-create-stop-and-rm.md, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md, manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md, manuals/docker-sandboxes-101/sections/3-2-clone-and-run-sandbox-source.md

- **需要 Docker Desktop 吗？** 不需要。你需要 `sbx login`。智能体的容器从不会出现在主机的 `docker ps` 里。
- **用 stop 还是 rm？** `sbx stop` 保留状态。`sbx rm` 删除沙箱、它的状态和范围内的密钥。
- **主机允许会拦住 gist 上传吗？** 不会。一条主机允许会放行任意方法、路径和正文。
- **智能体能看到我的密钥吗？** 不能。它看到的是 `proxy-managed`。代理在 VM 之后才加上密钥。

## 提示
type: tips
from: manuals/docker-sandboxes-101/sections/2-1-sbx-run-create-stop-and-rm.md, manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md, manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md, manuals/docker-sandboxes-101/sections/2-4-sandboxd-diagnose-and-reset.md, manuals/docker-sandboxes-101/sections/2-2-sbx-exec-cp-and-ports.md

- 在创建时设置内存、端口、skills 和静态 MCP 服务器。重新附加会忽略它们。
- prune 之前先运行 `sbx prune --dry-run`。
- 用 `--sandbox` 添加窄规则。每个智能体都需要的主机留给全局规则。
- 用 `sbx secret set` 保存密钥，绝不要用 `-e KEY`。
- 把自定义密钥绑定到确切的主机。代理会在任何位置替换占位符。
