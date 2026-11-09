# sbx exec、sbx cp 和 sbx ports

> 三个动词伸进沙箱：`exec` 运行一条命令并启动已停止的沙箱，`cp` 跨边界移动文件，`ports` 除非另有说明否则绑定 `tcp4`。

`m101-demo` 里的一个服务器在端口 8080 上监听。你想从主机打开它、拷入一个文件，再把结果读出来。`docker exec`、`docker cp` 和 `docker run -p` 为容器做这些工作，`sbx` 有同样的三个动词，每个都改了一条规则。读完本节后，你能以任意用户运行命令、双向拷贝文件，并发布一个 `localhost` 能到达的端口。

## sbx exec {#s-sbx-exec-cp-and-ports-sbx-exec}

**exec：** `sbx exec [flags] SANDBOX COMMAND [ARG...]` 在沙箱内运行一条命令，并且会先启动已停止的沙箱 {{help-sbx sbx exec}}。这些标志沿用 `docker exec`，但不支持用 `-d` 或 `--detach` 做分离 exec {{help-sbx sbx exec}}，所以 `-d` 出现在帮助里只是为了说明这一点。2025 年的插件以分离方式运行 `docker sandbox exec -d`，[冲突 C31](#s-ref-sources-and-the-conflicts-register) 记录了这一点。带 `--cloud` 时，`sbx exec` 拒绝标志 `-d`、`--user` 和 `--privileged`，而不是忽略它们 {{help-sbx sbx exec}}。

命令以 `agent` 用户、uid 1000 运行，属于 `sudo` 和 `docker` 组，工作目录是工作区目录。`-u root` 以 root 运行它，帮助文本用 `apt-get update` 展示这一点，capture 用它创建 `/opt/marker-from-demo`。`-w` 设置另一个工作目录，`-e KEY=VALUE` 和 `--env-file FILE` 为这一条命令设置变量，`-it` 打开一个 shell。

在内部，沙箱知道自己的名字。自 v0.39.0 起，沙箱在环境变量 `SANDBOX_NAME` 和 `SANDBOX_ID` 中给出自己的身份 {{rel-sbx v0.39.0}}，`SANDBOX_VM_ID` 仍作为名称的已弃用副本保留。`WORKSPACE_DIR` 命名挂载，`HOME` 是 `/home/agent`。

```listing
title: 从内部看到的 m101-demo 身份
source: capture/out/04-env.txt
lang: text
note: 只保留身份和工作区变量。代理和凭据变量属于第 3 部分。
---
$ sbx exec m101-demo sh -c 'env | sort'
…
HOME=/home/agent
…
PWD=$CAPTURE/fixtures/repo
…
SANDBOX_ID=<uuid>
SANDBOX_NAME=m101-demo
SANDBOX_VM_ID=m101-demo
…
WORKSPACE_DIR=$CAPTURE/fixtures/repo
…
[exit 0]
```

## sbx cp {#s-sbx-exec-cp-and-ports-sbx-cp}

**cp：** `sbx cp SRC DST`，其中一侧是写成 `SANDBOX:PATH` 的沙箱路径，另一侧是主机路径 {{help-sbx sbx cp}}。不支持从一个沙箱拷到另一个沙箱 {{help-sbx sbx cp}}。capture 中的 `sbx cp m101-demo:/tmp/out.txt m101-demo-2:/tmp/x` 以该消息退出码 1，所以这类拷贝要经由主机中转。复制目录时，目录本身被放到目标处。当目标是已有目录时，源进入其内部，`-L` 跟随源中的符号链接。沙箱路径是容器路径，所以 capture 中的 `/tmp/in.txt` 位于工作区挂载之外，会随沙箱一起被删除。

有安全历史的那条规则是拷出。v0.38.0 于 2026-08-06 发布，修复了 `sbx cp` 拷出可以逃逸目标路径的缺陷。该缺陷是 CVE-2026-17106 {{rel-sbx v0.38.0}}。

```listing
title: 一次拷入、一次拷出，以及一次被拒绝的拷贝
source: capture/out/06-cp.txt
lang: text
note: 未删节。
---
$ sbx cp $CAPTURE/work/in.txt m101-demo:/tmp/in.txt
[exit 0]

$ sbx exec m101-demo sh -c 'cat /tmp/in.txt; printf out > /tmp/out.txt'
in
[exit 0]

$ sbx cp m101-demo:/tmp/out.txt $CAPTURE/work/out.txt
[exit 0]

$ cat $CAPTURE/work/out.txt
out
[exit 0]

$ sbx cp m101-demo:/tmp/out.txt m101-demo-2:/tmp/x
error: copying between sandboxes is not supported
  try: sbx cp --help
[exit 1]
```

## sbx ports {#s-sbx-exec-cp-and-ports-sbx-ports}

**ports：** `sbx ports SANDBOX` 列出已发布的端口，`--publish SPEC` 添加一个，`--unpublish SPEC` 移除一个。规格是 `[[HOST_IP:]HOST_PORT:]SANDBOX_PORT[/PROTOCOL]`，不给 HOST_PORT 时守护进程挑选一个空闲端口 {{help-sbx sbx ports}}。发布会在创建主机绑定之前先启动已停止的沙箱 {{help-sbx sbx ports}}，和 `exec` 一样。

要学的规则是地址族。不给 PROTOCOL 时，发布使用 `tcp4` {{help-sbx sbx ports}}，所以主机绑定只有 `127.0.0.1`。要绑定两个族，显式发布 `tcp` {{help-sbx sbx ports}}。这在 v0.42.0 改变了：已发布的端口不再监听 `::1`，除非你点名协议 {{rel-sbx v0.42.0}}。2025 年的插件绑定两个回环，[冲突 C39](#s-ref-sources-and-the-conflicts-register) 记录了这一点。

| `PROTOCOL` | 省略 `HOST_IP` 时的主机绑定 |
|---|---|
| 无 | `127.0.0.1` 作为 `tcp4`，或当 `HOST_IP` 是 IPv6 地址时在 `::1` 上用 `tcp6` |
| `tcp`、`udp` | `127.0.0.1` 和 `::1`，或沙箱仅 IPv4 时只有 `127.0.0.1` |
| `tcp4`、`udp4` | `127.0.0.1` |
| `tcp6`、`udp6` | `::1` |

capture 发布 `18081:8080`，得到 `127.0.0.1:18081 -> 8080/tcp4`，`curl` 在 `127.0.0.1` 上应答 `200`，在 `::1` 上以退出码 7 失败。

```listing
title: 一次 tcp4 绑定及其列表
source: capture/out/05-ports.txt
lang: text
note: 未删节。
---
$ sbx ports m101-demo --publish 18081:8080
Published 127.0.0.1:18081 -> 8080/tcp4
[exit 0]

$ sbx ports m101-demo
HOST IP     HOST PORT   SANDBOX PORT   PROTOCOL
127.0.0.1   18081       8080           tcp4
[exit 0]
```

```listing
title: 只有 IPv4 回环有应答
source: capture/out/05-ports-curl.txt
lang: text
note: 未删节。连接时间已掩码为 <n>。
---
$ curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:18081/README.md
200
[exit 0]

$ curl -sS -o /dev/null -w '%{http_code}\n' 'http://[::1]:18081/README.md'
curl: (7) Failed to connect to ::1 port 18081 after <n> ms: Couldn't connect to server
000
[exit 7]
```

随后 `--publish 8080/tcp` 绑定两个族，各自占用一个临时主机端口，`sbx ports --json` 把每条绑定列为 `host_ip`、`host_port`、`sandbox_port` 和 `protocol`。

```listing
title: tcp4 绑定旁边的双栈绑定
source: capture/out/05-ports-tcp.txt
lang: text
note: 只保留 publish 和 JSON 列表的最后一条记录。临时端口已掩码为 <port>。
---
$ sbx ports m101-demo --publish 8080/tcp
Published 127.0.0.1:<port> -> 8080/tcp
Published [::1]:<port> -> 8080/tcp
[exit 0]

$ sbx ports m101-demo --json
…
  {
    "host_ip": "::1",
    "host_port": "<port>",
    "sandbox_port": 8080,
    "protocol": "tcp"
  }
]
[exit 0]
```

不带协议的取消发布会移除两种情况下的映射：按同一默认发布的，或作为双栈 `tcp` 发布的 {{help-sbx sbx ports}}。capture 以 `sbx ports m101-demo --json` 打印 `[]` 结束。`sbx run` 上的 `-p` 只在创建时生效，所以之后改端口要用 `sbx ports`。`sbx ls` 在其 `PORTS` 列打印绑定，capture 中是 `127.0.0.1:18081->8080/tcp4`。在云上，已发布的端口会得到一个公共 URL，UDP 会被拒绝，如 [sbx --cloud](#s-sbx-cloud-run-move-and-ttl) 所示。

```takeaways
- 安装软件包时运行 `sbx exec -u root`，并预期已停止的沙箱会启动。
- 把 `sbx cp` 的沙箱一侧写成 `SANDBOX:PATH`，两个沙箱之间经由主机中转。
- 当客户端连接到 `::1` 时发布 `PORT/tcp`，并读 `sbx ports --json` 查看绑定了什么。
```

Sources: help-sbx sbx exec, sbx cp, sbx ports, sbx run (research/sources/help-sbx.md); rel-sbx v0.38.0, v0.39.0, v0.42.0 (research/sources/sbx-releases.md); docs-sbx usage (research/sources/docs-sandboxes.md); conflicts C31, C39 (research/conflicts-register.md); capture/out/04-env.txt, 04-guest.txt, 04-workspace.txt, 05-ports.txt, 05-ports.json, 05-ports-curl.txt, 05-ports-ls.txt, 05-ports-tcp.txt, 05-ports-unpublish.txt, 06-cp.txt, 07-template-save.txt
