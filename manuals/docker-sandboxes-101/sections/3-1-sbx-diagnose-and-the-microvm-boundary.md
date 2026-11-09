# sbx diagnose 与 microVM 边界

> 智能体作为容器运行在主机 hypervisor 上的客户机内核里，带有私有的 Docker Engine，它做的任何事都到不了主机守护进程。

你在一个仓库上启动了 `sbx run claude`，智能体正在内部运行 `docker build`。在主机上，`docker ps` 没有显示任何新东西，你想知道那些镜像去了哪里，以及智能体还能碰到什么。`sbx diagnose` 是要运行的第一条命令，因为它点名了智能体和你的机器之间的每一层。

读完本节后，你能读懂 `sbx diagnose`，点名智能体和主机之间的五层，并点名穿过它们的通道。

## sbx diagnose 检查什么 {#s-sbx-diagnose-and-the-microvm-boundary-what-sbx-diagnose-checks}

**sbx diagnose：** 对安装、平台、存储以及与守护进程的连接做只读检查，带 `--output json|github-issue` 和 `--upload` {{help-sbx sbx diagnose}}。在 capture 用的 Mac 上它跑了 13 项检查，全部通过：

```listing
title: sbx diagnose 的 Platform 和 Connection 两组
source: capture/out/02-diagnose.txt
lang: text
note: Installation 和 Storage 两组已删节。capture kit 把字节数和块大小掩码为 <n>。
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
…
  13 passed
```

`kern.hv_support is 1` 是 macOS 的硬件虚拟化标志。客户机运行在主机 hypervisor 上：macOS 上是 Hypervisor.framework，Windows 上是 Windows Hypervisor Platform，Linux 上是 KVM（[冲突 C3](#s-ref-sources-and-the-conflicts-register)）。`mkfs.erofs` 那一行点名客户机根文件系统格式及其页面大小，内部的 `getconf PAGESIZE` 报告为 `16384`（[冲突 C45](#s-ref-sources-and-the-conflicts-register)）。最后一行是登录检查。`sbx` 可以不依赖 Docker Desktop 运行，但没有 Docker 账号它仍拒绝创建沙箱（[冲突 C15](#s-ref-sources-and-the-conflicts-register)）。

FAQ 给出两个理由：沙箱属于一个真实的人，并且它针对 Docker 基础设施做认证 {{docs-sbx FAQ}}。它还列出了产品自己的出站主机，从 `login.docker.com` 开始。

## 从内核往上的五层 {#s-sbx-diagnose-and-the-microvm-boundary-five-layers-from-the-kernel-up}

在 `m101-demo` 内部，这次 capture 运行了 `uname`、`id`、`docker version` 和 `mount`：

```listing
title: 从 m101-demo 内部看到的客户机
source: capture/out/04-guest.txt
lang: text
note: os-release 块、Docker 客户端块、df 输出和 /etc/hosts 已删节。
---
Linux m101-demo 7.0.14 #1 SMP PREEMPT Mon Sep 21 06:45:23 UTC 2026 aarch64 GNU/Linux
…
PRETTY_NAME="Ubuntu 26.04.1 LTS"
…
uid=1000(agent) gid=1000(agent) groups=1000(agent),27(sudo),1001(docker)
16384
…
Server: Docker Engine - Community
 Engine:
  Version:          29.8.1
…
 containerd:
  Version:          v2.3.5
…
bind-<id> on /etc/resolv.conf type virtiofs (ro,relatime)
host on $CAPTURE/fixtures/repo type virtiofs (rw,nosuid,nodev,relatime)
```

文档点名五层隔离：hypervisor、网络、Docker Engine、工作区和凭据 {{docs-sbx Isolation layers}}。清单从内部展示了其中四层。客户机内核是 `aarch64` 上的 `7.0.14`，页面大小 16 KiB，系统是 Ubuntu 26.04.1。假定 4 KiB 页面的构建会在这里失败，一位 Docker Captain 在 2026-05-26 报告过 {{blog 2026-05-26 B16}}。智能体是用户 `agent`，uid 1000，在 `sudo` 和 `docker` 组中，文档把控制放在别处：

```rule
label: 边界在哪里
source: docs-sbx Isolation layers
---
智能体在 VM 内以带有 sudo 权限的非 root 用户运行。隔离智能体的是 hypervisor 边界。VM 内部的权限分离做不到这一点。
```

清单里的 Docker Engine 29.8.1 和 containerd v2.3.5 属于 VM，智能体构建的每个镜像也是。文档说出了后果：智能体到不了你主机上的 Docker 守护进程 {{docs-sbx Docker Engine isolation}}。

主机侧也没有面向沙箱的 Docker API。Kevin Wittek 在 2026-04-23 说主机不提供 Moby API {{talk 2026-04-23 T06}}。期望它的 REST 客户端对沙箱无效，`sbx exec` 才是入口，如 [sbx exec、cp 和 ports](#s-sbx-exec-cp-and-ports) 所示。

**VMM：** 启动客户机的虚拟机监视器。Docker 自己写了一个，并在 2026-08-10 的 Hacker News 上说它不是 Firecracker（[冲突 C4](#s-ref-sources-and-the-conflicts-register)）。它基于 libkrun 构建的说法仍未核实。产品暴露的名字很少。`sandboxd` 是守护进程，`sbx daemon status` 打印它的 socket。`containerd` 在客户机内运行，EROFS 出现在 diagnose 那一行，virtiofs 出现在挂载表，`nerdbox` 出现在发行资源中。

## 穿过边界的通道 {#s-sbx-diagnose-and-the-microvm-boundary-the-doors-through-the-boundary}

Kevin Wittek 在 2026-09-04 点名了进入沙箱的四个入口：绑定挂载、网络、密钥注入和 MCP {{talk 2026-09-04 T02}}。这次 capture 在客户机里用一行展示每一个。工作区是 `host on $CAPTURE/fixtures/repo type virtiofs (rw,...)`，挂载在与主机相同的路径。`/etc/resolv.conf` 是第二个、来自主机的只读 virtiofs 绑定，所以解析器是主机的。网络通道是环境中的 `HTTPS_PROXY=http://gateway.docker.internal:3128`（[这次 capture](manuals/docker-sandboxes-101/capture/out/04-env.txt)）。密钥通道是 `ANTHROPIC_API_KEY=proxy-managed`，一个哨兵值。

MCP 通道是 `MCP_GATEWAY_URL=http://mcp-gateway.docker.internal/mcp`。第五行，`SSH_AUTH_SOCK=/run/ssh-agent.sock` 加上 `SSH_AUTH_SOCK_GATEWAY=gateway.docker.internal:3129`，是转发的 SSH agent，演讲没有点名的一条通道。文档默认打开该转发 {{docs-sbx Credential isolation}}，[密钥](#s-sbx-secret-set-import-and-set-custom) 一节会再讲到它。[图](#fig-3-1)叠起各层并画出通道。

VM 有自己的限制。`--memory` 默认为主机内存的 50%，限制在 512 MiB 到 32 GiB {{help-sbx sbx create}}。`--cpus 0` 表示全部主机 CPU，在 Linux arm64 上最多 16 个 {{help-sbx sbx create}}。`m101-policy` 在 capture 用的 Mac 上得到了 `cpu 10` 和 `memory 32 GiB`（[这次 capture](manuals/docker-sandboxes-101/capture/out/09-create.txt)）。

```figure
id: fig-3-1
kind: layers
title: m101-demo 的各层及其通道
claim: 智能体位于客户机内核里的私有 Docker Engine 上，五条通道穿过 hypervisor 线：挂载、网络、密钥、MCP 和 SSH agent.
caption: 从主机那一行往下读。虚线是 hypervisor，它下面的每个框都在 VM 里。右侧每条通道标出打开它的客户机行。 From capture/out/04-guest.txt and 04-env.txt.
```

```takeaways
- 先运行 `sbx diagnose`，读 Virtualization、mkfs.erofs 和 Authentication 这几行。
- 把 VM 边界当作控制点：智能体在内部有 sudo 和私有 Docker Engine。
- 预期 16 KiB 页面和单独的镜像存储，所以内部的构建永远不会出现在主机上。
- 打开沙箱之前先点名通道：挂载、网络、密钥、MCP 和 SSH agent。
```

Sources: help-sbx sbx diagnose, sbx create, sbx daemon start (research/sources/help-sbx.md); docs-sbx Security model, Isolation layers, Default security posture, Architecture, FAQ (research/sources/docs-sandboxes.md); research/conflicts-register.md rows C3, C4, C15, C45; talk T02 (2026-09-04), T06 (2026-04-23), blog B16 (2026-05-26), HN01 (2026-08-10) from research/plan.md; capture/out/02-diagnose.txt, 02-diagnose.json, 02-daemon-status.txt, 04-guest.txt, 04-env.txt, 09-create.txt
