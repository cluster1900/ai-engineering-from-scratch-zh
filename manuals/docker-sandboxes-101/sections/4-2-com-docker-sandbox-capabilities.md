# `com.docker.sandbox/*` 能力

> kit 不会自行授予任何东西：每项能力都带类型和版本，解析器把一个 workload 与它的 mixin 做并集，更新时任何扩大都会停下来等待批准。

同事发布的 `gh` mixin 用你的 token 访问 `api.github.com`。你想确切知道它能用那个 token 发出哪些请求，以及版本 2 到来时会改变什么。两个答案都在它的 `capabilities` 列表里。

读完本节后，你能读懂那个列表，预测合并后的授权集合，并说出哪次更新会停下来询问。

## 带类型和版本的请求 {#s-com-docker-sandbox-capabilities-typed-versioned-requests}

**能力：** kit 的 `capabilities` 列表中一项带类型的请求，针对 kit 需要而又无法自己提供的东西 {{kitspec §7}}。主机对每一项作出回答：授予、拒绝，或询问。

每个条目有一个形如 `<namespace>/<name>@<version>` 的 `type`、一个可选的显示 `name`，以及一个 `optional` 标志 {{kitspec §7}}。它的 `config` 按规范定义的类型严格解码，所以未知键是错误 {{kitspec §7}}。版本命名 config schema，所以 `network-policy@1` 和 `@2` 都存在，描述符声明其中之一 {{kitspec §7.1}}。描述策略的类型出现一次 {{kitspec §7.1}}，而实例形态的类型按所请求的每一项重复，例如每个服务和阶段一个 `credential@1`。

未知类型按设计是允许的，因为新类型就是格式成长的方式 {{kitspec §7.3}}。一个必需的未知类型会让解析失败，可选的则被跳过并记录。

## 锁定版本处的十九种类型 {#s-com-docker-sandbox-capabilities-the-nineteen-types-at-the-pin}

| 类型 | 形态 | 它请求什么 |
|---|---|---|
| `network-policy@1` | 单例 | 沙箱按阶段可以到达的主机 |
| `network-policy@2` | 单例，与 `@1` 互斥 | 主机加上 HTTP 方法和路径 |
| `credential@1` | 按服务和阶段 | workload 向其认证的一个服务 |
| `ssh-agent@1` | 按阶段 | 转发的 SSH agent 签名什么 |
| `volume@1` | 按路径 | 持久或 tmpfs 存储 |
| `host-mount@1` | 按路径 | 一个主机目录，与 `volume@1` 共享存储键 |
| `port@1` | 按容器端口和传输 | 一个已发布的端口 |
| `usb-device@1` | 实例 | 一个 USB 设备匹配 |
| `resources@1` | 单例 | CPU、内存和 GPU 限制，是约束而不是授权 |
| `privileged@1` | 单例，无 config | 一个特权容器 |
| `long-running@1` | 单例，无 config | 在没有会话附着时保持运行 |
| `lifecycle@1` | 单例 | 安装 hook、启动 hook、文件、交互式 argv |
| `agent-context@1` | 单例 | 智能体的 instruction 文件 |
| `agent-sessions@1` | 单例 | 无终端 prompt 和 resume 动词 |
| `agent-skills@1` | 按路径 | 智能体读取 skills 的位置 |
| `agent-skill@1` | 按有效名称 | 一个打包的 skill |
| `git-identity@1` | 单例，无 config | 运行时的 git 名称和邮箱 |
| `kit-registry@1` | 单例，无 config | 到达运行时自己的 kit registry，构建在那里推送和拉取 |
| `sbx@1` | 单例，无 config | 以特定方式启动 workload，使用镜像声明的身份 |

这张表是 `v3.0.0-m.8` tag 处的 `kitspec §7.2`。main 分支增加第二十种，`com.docker.sandbox/agent-interactive-sessions@1`，作为单例 {{kitspec-main §7.2}}，在锁定版本处尚未发布。sbx 自身最新的类型随这次锁定的发行版到来。kit 可以声明 `com.docker.sandbox/long-running@1`，让本地沙箱在全部会话断开之后继续运行 {{rel-sbx v0.47.0}}。

## network-policy@2 和 credential@1 {#s-com-docker-sandbox-capabilities-network-policy-2-and-credential-1}

一个 `network-policy@2` 条目是普通的主机字符串，或带 `hosts`、`methods` 和 `paths` 的对象 {{kitcap network-policy@2}}。主机字符串按任意协议授予连接，与 `@1` 一样。带 `methods` 或 `paths` 的条目是有界的：它授予那些 HTTP 请求，该主机上其他一律不授予。拒绝条目列出要拒绝的内容，拒绝优先 {{kitcap network-policy@2}}。被拒绝的请求会得到一个状态，因为运行时必须以 HTTP 状态 `403` 应答它 {{kitcap network-policy@2}}。执行这一点的代理就是[策略日志一节](#s-sbx-policy-log-and-the-proxy)中的那个。

一个 `credential@1` 条目点名一个 `service` 和一个 `phase`，从不点名密钥存放的位置 {{kitcap credential@1}}。使用 `apiKey.proxyManaged` 时，真实值留在主机上 {{kitcap credential@1}}。每个 `inject` 域必须出现在同一阶段的允许列表中 {{kitcap credential@1}}。应答它的绑定就是[密钥一节](#s-sbx-secret-set-import-and-set-custom)存储的那个。

## 解析与合并集合 {#s-com-docker-sandbox-capabilities-resolution-and-the-merged-set}

运行时必须在每次组合中恰好包含一个 `workload` kit {{kitspec §5.3}}。两个 kit 提供同一规范化名称时必须失败 {{kitspec §5.3}}，所以 `claude` 加 `claude-mixin` 会被拒绝。在整个集合上，允许条目按阶段取并集，拒绝条目按阶段取并集，结果上拒绝优先 {{kitcap network-policy@2}}。当一个 kit 无界地允许某主机时，另一 kit 对该主机的有界条目会被丢掉，因为并集是无界授权 {{kitspec §9.5}}。[图](#fig-4-2)在三个 kit 上做这道运算。

```figure
id: fig-4-2
kind: tree
title: 三个 kit 解析成一个授权集合
claim: 一个 workload 和两个 mixin 合并成一个授权集合，允许取并集，拒绝优先，下一版本去掉一条拒绝会停下来等待批准.
caption: 从上往下读。三个 kit 是捕获的 hello-kit、kitspec §2 的 gh 示例，以及其能力页的 network-policy@2 config 示例。teal 块是锁。 From capture/fixtures/kits/hello-kit/kit.yaml, kitspec §5.3, §7.4, §9.5, and the kitcap pages.
```

## 授权在 sbx 内部是什么样 {#s-com-docker-sandbox-capabilities-what-a-grant-looks-like-inside-sbx}

录制主机运行了一个 v2 mixin，所以捕获的行来自 `permissions.network.allow` 而不是 v3 条目。守护进程把授权存为沙箱所有者无法编辑的策略规则：

```listing
title: kit 在沙箱 m101-kit 上的允许规则
source: capture/out/12-policy-kit.json
lang: json
note: rules 数组有一个元素，只保留正文点名的字段。
---
      "name": "kit:m101-kit",
…
      "scope": "sandbox:m101-kit",
…
      "resource_type": "network",
      "decision": "allow",
      "resources": [
        "example.com"
      ],
…
      "editable": false,
…
        "created_via": "provisioned",
```

`sbx policy check network example.com --sandbox m101-kit --json` 随后回答 `"allowed": true`（[这次 capture](manuals/docker-sandboxes-101/capture/out/12-check-kit.json)）。这条规则带着 `created_via: provisioned`，并响应 `--source kit`，这就是[策略一节](#s-sbx-policy-init-allow-deny-and-check-network)区分 kit 规则和你添加的规则的方式。

## 更新与锁 {#s-com-docker-sandbox-capabilities-updates-and-the-lock}

每一项授权都映射到一个规范化集合。控制更新的消费者把该集合存在它的锁文件中，并把每个候选与之比较 {{kitspec §7.4}}。新版本的集合仍落在已存储集合之内时可以静默应用。任何扩大都必须停下来等待批准。

这个列表是明确的。它包括一条新的允许条目、一条被去掉的拒绝条目，以及一个新的凭据、路径或端口。只读 skills 路径上的写访问也在其中。去掉一条拒绝也算，因为那条拒绝是让授权可接受的一部分 {{kitspec §7.4}}。`optional` 不改变这个集合 {{kitspec §7.4}}。六种类型对它没有贡献：`resources@1`、`lifecycle@1`、`agent-context@1`、`agent-sessions@1`、`sbx@1` 和 `long-running@1` {{kitspec §7.4}}。

```takeaways
- 运行 kit 之前先读它的 `capabilities` 列表，并把每个条目当作你要回答的一项请求。
- 预期允许在 kit 之间取并集，并在另一 kit 不得扩大某主机时写一条 `deny`。
- 审查每一次增加允许、凭据、路径或端口，或去掉一条拒绝的更新。
```

Sources: kitspec §5.3, §7, §7.1, §7.2, §7.3, §7.4, §9.5 (research/sources/SPEC-v3-at-v3.0.0-m.8.md); kitspec-main §7.2 (research/sources/SPEC-v3.md, unreleased); kitcap network-policy@2, credential@1 (research/sources/kit-capabilities.md); rel-sbx v0.47.0 (research/sources/sbx-releases.md); capture/fixtures/kits/hello-kit/kit.yaml; capture/out/12-policy-kit.json, 12-policy-kit.txt, 12-check-kit.json
