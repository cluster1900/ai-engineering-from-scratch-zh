# sbxenv.yaml 与 `sbx env plan`

> 环境文件声明智能体、kit、工作区、密钥、端口、MCP 服务器和主机命令，`sbx env plan` 在 `create` 或 `run` 应用之前打印每一项变更。

新贡献者 clone 你的仓库，需要你使用的沙箱。也就是 shell workload、`hello-mixin`、一个已发布端口、一个问候变量，以及一条准备工作区的主机命令。你可以发一份标志列表。环境文件把同样的东西作为一份已入库的文件发送，贡献者在任何东西运行之前就能看到一份计划。

读完本节后，你能编写一份 `sbxenv.yaml`，逐个符号读懂它的计划，并说出哪些编辑要等到下一次 create。

## 文件 {#s-sbxenv-yaml-and-sbx-env-plan-the-file}

**环境文件：** 一份声明单个沙箱及其周围主机资源的 `sbxenv.yaml`，由五条 `sbx env` 命令读取 {{help-sbx sbx env}}。capture kit 写了这一份：

```listing
title: capture kit 写的环境文件
source: capture/fixtures/env/sbxenv.yaml
lang: yaml
---
schemaVersion: "1"
name: m101-env
agent: shell
workspace: .
args:
  greeting:
    default: hello
    description: Greeting word
kits:
  - source: ../kits/hello-mixin
env:
  GREETING: ${{ env.args.greeting }}
lifecycle:
  initialize:
    - command: echo init
ports:
  - sandbox: 8080
    host: 18083
```

| 键 | 它声明什么 |
|---|---|
| `schemaVersion`, `name`, `agent` | 文件版本 `"1"`、沙箱名称、内置智能体或 kit |
| `args` | 带 `default` 或 `required: true` 的输入，以 `${{ env.args.NAME }}` 读取 |
| `kits` | mixin，作为引用或作为 `source` 加 `args` |
| `workspace`, `additionalWorkspaces` | 要挂载的主机目录，clone 模式用对象形式 |
| `env` | 沙箱的变量 |
| `secrets`, `bindings`, `registries` | 带 `value`、`ref` 或 `command` 的凭据，以及它们到达的域名 |
| `mcp.servers` | 向网关注册的 MCP 服务器 |
| `ports` | 已发布端口，`sandbox`、`host`、`protocol`、`hostIP` |
| `lifecycle` | `initialize`、`postCreate`、`preRemove` 下的主机命令 |
| `sandboxOptions` | `template`、`memory`、`cpus`、`skills`、`writableEnvFiles` 以及更多 |

这些键来自文件参考 {{docs-sbx Top-level fields}} 和命令自己的帮助。三个占位符会展开：`${{ env.args.NAME }}`、`${{ env.projectDir }}` 和 `${{ env.fileDir }}`，其他地方的 `$` 是字面文本 {{help-sbx sbx env create}}。相对的 kit 路径或工作区相对于声明它的文件所在目录解析，所以 `workspace: .` 挂载文件自己的目录 {{help-sbx sbx env}}。没有 `workspace` 的文件什么都不挂载 {{rel-sbx v0.42.0}}。

## 计划 {#s-sbxenv-yaml-and-sbx-env-plan-the-plan}

`sbx env plan` 读取文件并打印应用它会建立什么。它不应用、不批准、不记录任何东西 {{help-sbx sbx env plan}}。

```listing
title: m101-env 的第一份计划
source: capture/out/14-env-plan.txt
lang: text
note: LOAD ENVIRONMENT 块已删节。
---
── ENVIRONMENT PLAN
   m101-env

   kits:
+    - source: $CAPTURE/fixtures/kits/hello-mixin

   workspace:  (present, not recorded as applied, needs your approval)
     path: $CAPTURE/fixtures/env

   env:
+    GREETING: hello

+  sandbox:
+    name: m101-env
+    agent: shell

   ports:
+    - sandbox: 8080
+      protocol: tcp4
+      host: 18083

   lifecycle:
     initialize:
+      - command: echo init
+        workdir: $CAPTURE/fixtures/env
+        envFiles:
+          - $CAPTURE/fixtures/env/sbxenv.yaml

   Plan: + 5 to add, ~ 0 to change, - 0 to destroy.

   this plan runs commands on this machine, outside the sandbox, with your own privileges
   ✓ not approved yet; applying asks once
```

计划具有你的文件的形状，页边带有裁定。共有五个符号 {{help-sbx sbx env}}。`+` 表示添加，`~` 表示更改，`-` 表示销毁。`>` 标出再次运行的命令，`!` 标出环境已应用但不再声明的资源。

未更改且已批准的行会被省略。字面密钥值显示为它的 SHA-256 digest {{docs-sbx Review an environment plan}}。文件中没有 `tcp4` 协议：自 v0.42.0 起，已发布端口默认使用它 {{rel-sbx v0.42.0}}。[图](#fig-4-4) 跟随文件经过计划到达状态记录。

```figure
id: fig-4-4
kind: flow
title: 环境文件变成计划、批准和状态记录
claim: sbx env plan 把文件变成带页边标记的行，create 时的批准记录它们，之后的计划只打印有变动的行.
caption: 从上往下读。计划行来自 env plan capture，右分支是第二份计划 capture，问候参数已更改。批准之后的左分支跟随 sbx env 的帮助文本，因为 kit 从未应用该计划。
```

## 主机命令与批准 {#s-sbxenv-yaml-and-sbx-env-plan-host-commands-and-approval}

`lifecycle` 块在主机上、沙箱外、以你自己的权限运行。`initialize` 在每次 `create` 和每次 `run` 时运行，`postCreate` 在沙箱存在之后运行一次，`preRemove` 在你确认 `sbx env rm` 之后运行 {{help-sbx sbx env}}。命令通过你的 shell 从项目目录运行，每条命令可以有 `workdir` 和 `timeout`。带有其中任何一条的环境在每次调用时都会询问，即使这次调用并不运行它们 {{help-sbx sbx env}}。原因是批准一条命令也信任它调用的脚本。`--skip-host-commands` 一条都不运行，`--auto-approve` 回答一次 yes，`sbx settings set env.rememberHostCommands true` 只在命令变化时再次询问。

## 状态记录与第二份计划 {#s-sbxenv-yaml-and-sbx-env-plan-the-state-record-and-the-second-plan}

`sbx` 把你为每个环境批准的内容记录在它的状态目录中，而不是文件旁边 {{help-sbx sbx env}}。之后的调用只询问有变化的部分 {{help-sbx sbx env}}。确切路径没有被 capture，因为 kit 运行了 `plan` 而从未运行 `create`。第二次 capture 则改了一个输入：

```listing
title: 同一份文件，改了一个参数
source: capture/out/14-env-plan-arg.txt
lang: text
note: 只显示有变化的行和合计。
---
$ sbx env plan --env-arg greeting=servus ./fixtures/env
…
+    GREETING: servus
…
   Plan: + 5 to add, ~ 0 to change, - 0 to destroy.
```

每一行仍是 `+`，因为什么都没有应用。`create` 之后，同样的编辑打印 `~ GREETING: hello -> servus`，别无其他，形式与帮助文本对已更改 kit 参数所显示的相同 {{help-sbx sbx env}}。对工作区、kit、端口、密钥、绑定和 `sandboxOptions` 的更改要等到下一次 create。新的 `env` 值在下一次会话到达 {{docs-sbx Update an environment}}。

多个 `PATH` 参数按顺序深度合并，后出现的文件覆盖先出现的 {{help-sbx sbx env create}}，像 `ports` 这样的列表是拼接而不是覆盖。没有 `PATH` 时，主目录中的 `.sbxenv.yaml` 作为基础层合并在下面 {{help-sbx sbx env create}}。项目中隐藏的 `.sbxenv.yaml` 不再被读取。

## rm、只读文件和 --cloud {#s-sbxenv-yaml-and-sbx-env-plan-rm-the-read-only-file-and-cloud}

`sbx env rm` 删除沙箱及其作用域内配置的密钥。绑定会留下，因为它们属于用户。要同时删除此环境声明的绑定，传入 `--prune-bindings` {{help-sbx sbx env rm}}。文件本身在沙箱内被只读绑定，因为能编辑它的智能体决定着下一份计划询问什么。`sandboxOptions.writableEnvFiles: true` 解除这一点 {{help-sbx sbx env}}。

使用 `--cloud` 时，`workspace`、`additionalWorkspaces` 和 `clone` 会被拒绝，因为它们命名云沙箱无法挂载的主机目录 {{help-sbx sbx env}}。此外，主机端口绑定、MCP 定义和动态密钥源会在任何主机命令运行之前被拒绝。[云沙箱一节](#s-sbx-cloud-run-move-and-ttl) 展示还剩下什么。

```takeaways
- 预期 `sbxenv.yaml` 在沙箱内是只读的，只在智能体必须编辑它时才设置 `writableEnvFiles`。
- 在 `create` 或 `run` 之前运行 `sbx env plan`，读懂每一个 `+`、`~`、`-`、`>` 和 `!`。
- 文件声明主机命令时，预期每次调用都会提示。
- 更改 kit、端口、密钥或 `sandboxOptions` 之后，重新创建环境。
```

Sources: help-sbx sbx env, sbx env create, sbx env plan, sbx env rm (research/sources/help-sbx.md); docs-sbx Sandbox environment files (research/sources/docs-sandboxes.md); rel-sbx v0.42.0 (research/sources/sbx-releases.md); capture/fixtures/env/sbxenv.yaml; capture/out/14-env-plan.txt, 14-env-plan-arg.txt
