---
id: sandbox-policy
title: Sandbox Policy Ladder
code: SB
subtitle: 选出成本最低的隔离配置，在运行器里拒绝不良调用，并设置 sbx 的网络、密钥和安全策略。
hue: 352
sources: phases/19-capstone-projects/26-sandbox-runner-denylist, projects/sandbox-ladder, manuals/docker-sandboxes-101
source_hash: b7be4aa7c12832ae
---

## 隔离配置阶梯
type: comparison
span: 2
from: projects/sandbox-ladder/solution/stage2.rs, projects/sandbox-ladder/solution/stage4.rs

| 因素 | process-fixture | filesystem-fixture | container-fixture | microvm-fixture |
|---|---|---|---|---|
| 成本 | 1 | 2 | 3 | 5 |
| 文件系统控制 | 否 | 是 | 是 | 是 |
| 网络拒绝 | 否 | 否 | 是 | 是 |
| 独立内核 | 否 | 否 | 否 | 是 |
| 残留 | `shared-host-kernel`、`network-not-denied` | `shared-host-kernel`、`network-not-denied` | `shared-host-kernel` | 无 |

## 运行它
type: command-table
span: 2
from: projects/sandbox-ladder/README.md, projects/sandbox-ladder/solution/cli.py, phases/19-capstone-projects/26-sandbox-runner-denylist/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 projects/sandbox-ladder/solution/cli.py untrusted=true,secrets=true,network=true,host_kernel=false --budget 3` | 策略模拟，输出 JSON |
| `... --docker-image <image>` | 加上一条 `docker run` 预览 |
| `... --docker-image <image> --execute` | 在本地镜像上运行两项探测 |
| `python3 scripts/project_test.py sandbox-ladder --stage 1 --path learning-artifacts/sandbox-ladder` | 给你的版本的第 1 阶段打分 |
| `python3 scripts/project_test.py sandbox-ladder --all --solution --strict` | 给参考解答打分 |
| `python3 code/main.py` | 课程演示，一组允许与拒绝 |
| `python3 -m pytest code/tests/ -v` | 课程测试 |

## 规划器步骤
type: flow
from: projects/sandbox-ladder/solution/stage1.rs, projects/sandbox-ladder/solution/stage2.rs, projects/sandbox-ladder/solution/stage3.rs, projects/sandbox-ladder/solution/stage4.rs, projects/sandbox-ladder/solution/cli.py, projects/sandbox-ladder/README.md

1. **needs**：解析 `key=true` 和 `key=false` 对。重复或未知的键会失败。
2. **satisfies**：untrusted 或 secrets 需要文件系统。`network=true` 需要网络拒绝。
3. **satisfies**：`host_kernel=true` 需要独立内核。
4. **select**：保留成本不超过预算的隔离配置，再取成本最低的。
5. **plan**：打印该隔离配置，以及它留下的每一项残留风险。
6. **cli.py**：把它包成 `schema_version: 1` 的 JSON，`runtime_verified` 为 false。

## 样例的规划器输出
type: annotated-code
lang: text
from: projects/sandbox-ladder/solution/stage4.rs, projects/sandbox-ladder/solution/cli.py

```text
profile=container-fixture mode=policy-simulation os_isolation=false
residual=shared-host-kernel  # no separate kernel
verify=runtime-configuration-and-escape-tests  # always printed
# JSON wrapper keys from cli.py
"mode": "policy_simulation", "runtime_verified": false
```

## Docker 探测命令
type: annotated-code
lang: bash
from: projects/sandbox-ladder/solution/cli.py, projects/sandbox-ladder/README.md

```bash
docker run --rm --pull=never \  # local image only
  --network none --read-only \  # no route, read-only root
  --cap-drop ALL --security-opt no-new-privileges \
  --pids-limit 32 --memory 64m --cpus 0.5 \
  --user 65534:65534 <image> sh -c '<probes>'  # root_write, default_route
```

## 课程运行器检查
type: architecture
from: phases/19-capstone-projects/26-sandbox-runner-denylist/code/main.py, phases/19-capstone-projects/26-sandbox-runner-denylist/docs/en.md

```arch
node | call | 1,1 | Sandbox.run() | argv, shell=False | client
node | deny | 2,1 | _check_executable_denylist | basename on denylist | process
node | interp | 3,1 | _check_argv_interpreter | -c, -e, --eval | process
node | meta | 4,1 | _check_shell_metachars | shell metachars, shell off | process
node | jail | 4,2 | _check_path_jail | realpath under root | process
node | proc | 3,2 | subprocess.run | env allowlist, timeout | process
node | res | 2,2 | SandboxResult | denied, timed_out, truncated | store
edge | call | deny |
edge | deny | interp |
edge | interp | meta |
edge | meta | jail |
edge | jail | proc | all pass
edge | proc | res | capture
```

## 课程默认值
type: defaults
from: phases/19-capstone-projects/26-sandbox-runner-denylist/code/main.py, projects/sandbox-ladder/solution/cli.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_output_bytes` | `64 * 1024` | 然后是截断标记 |
| `timeout_seconds` | 30.0 | 演示使用 2.0 |
| `DENIED_EXIT_CODE` | -100 | 任何拒绝 |
| `TIMED_OUT_EXIT_CODE` | -101 | 墙钟超时 |
| `env_allowlist` | `("PATH", "HOME", "LANG", "LC_ALL", "TERM")` | 其余变量全部丢弃 |
| `shell` | `False` | 关闭时拒绝元字符 |
| `--budget` | 3 | 规划器的成本上限 |

## sbx 网络策略任务
type: task-table
span: 2
from: manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md, manuals/docker-sandboxes-101/sections/7-2-org-policies-profiles-and-the-audit-log.md

| 任务 | 代码 |
|---|---|
| 一次性设置全局预设 | `sbx policy init balanced` |
| 列出带 id 的规则 | `sbx policy ls --wide --json` |
| 为一个沙箱允许一个主机 | `sbx policy allow network --sandbox <name> example.com` |
| 创建时拒绝一个主机 | 在 `create` 或 `run` 上加 `--deny-network <host>` |
| 预测一次判定 | `sbx policy check network --sandbox <name> <host:port> --json` |
| 读取代理做出的判定 | `sbx policy log` 加上 `--json` |
| 删除一条允许规则 | `sbx policy rm network --sandbox <name> --id <uuid> --force` |
| 查找组织规则 | `sbx policy ls --source org` |

## sbx 如何判定
type: concepts
from: manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md, manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md, manuals/docker-sandboxes-101/sections/7-2-org-policies-profiles-and-the-audit-log.md, manuals/docker-sandboxes-101/sections/3-1-sbx-diagnose-and-the-microvm-boundary.md

- **拒绝优先**：对同一主机名或 CIDR，拒绝压过允许。
- **deny_kind**：`implicit` 表示没有规则匹配。`explicit` 点名那条规则。
- **check network**：只看主机和端口，端口默认 443。拒绝时以 1 退出。
- **forward-bypass**：一条不做检查、也不注入凭据的隧道。
- **密钥**：智能体看到 `proxy-managed` 或 `sbx-cs-<rand>`，从不是那个值。
- **SSH agent**：转发默认开启。密钥留在主机上。
- **治理**：只有组织的允许规则能授予访问。本地拒绝规则仍然生效。
- **边界**：是 hypervisor，不是 VM 内部的权限分离。

## 未匹配调用的安全模式
type: comparison
from: manuals/docker-sandboxes-101/sections/5-5-permissions-safety-and-hooks.md

| 因素 | `strict` | `balanced` | `restricted` | `autonomous` |
|---|---|---|---|---|
| `safe` 标签 | ask | allow | allow | allow |
| `destructive` 标签 | ask | ask | deny | allow |
| `unknown` 标签 | ask | ask | deny | allow |

## 拒绝与修复
type: troubleshooting
from: phases/19-capstone-projects/26-sandbox-runner-denylist/code/main.py, projects/sandbox-ladder/solution/cli.py, projects/sandbox-ladder/solution/stage3.rs, projects/sandbox-ladder/solution/main.rs, manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `is on the denylist` | argv[0] 的 basename 在 `DEFAULT_DENYLIST` 中 | 换一个工具，或修改 `denylist` |
| `use a script file instead of -c/-e` | 解释器带了内联代码标志 | 把代码写到脚本文件 |
| `set shell=True to opt in` | shell 关闭时 argv 里有元字符 | 把命令拆成 argv |
| `resolves outside project root` | `../`、绝对路径，或指向外部的符号链接 | 把路径留在 `project_root` 之下 |
| 规划器的 `Limit` 错误 | 预算内没有足够的隔离配置 | 提高 `--budget`。内核需要 5 |
| `Docker probe cannot establish independent guest kernel` | `--docker-image` 与 `host_kernel=true` 一起用 | 只用策略模拟 |
| `conflicts with existing allow rule` | 同一范围内在允许之上再拒绝 | 先 `sbx policy rm network` |
| `403 Forbidden`，90 字节正文 | 没有规则匹配，需要审批 | 加上一条允许规则。这不是网络故障 |

## 问题
type: qa
from: projects/sandbox-ladder/solution/main.rs, projects/sandbox-ladder/solution/stage2.rs, projects/sandbox-ladder/README.md, projects/sandbox-ladder/solution/cli.py, phases/19-capstone-projects/26-sandbox-runner-denylist/docs/en.md, manuals/docker-sandboxes-101/sections/5-5-permissions-safety-and-hooks.md

- **`network=true` 会授予网络吗？** 不会。它表示需要网络拒绝。
- **预算 4 且四项需求都要？** `Limit`。只有 `microvm-fixture` 有内核，成本为 5。
- **Docker 探测能证明 microVM 吗？** 不能。它只测试根写入和默认路由。
- **课程里的沙箱是操作系统边界吗？** 不是。它不使用 namespaces、cgroups 或 seccomp。
- **智能体权限是边界吗？** 不是。它们在客户端执行。隔离要用沙箱。

## 提示
type: tips
from: phases/19-capstone-projects/26-sandbox-runner-denylist/docs/en.md, manuals/docker-sandboxes-101/sections/5-5-permissions-safety-and-hooks.md, manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md, manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md

- 无人值守的智能体用 `--safety restricted` 运行。
- 把破坏性命令放进 `deny`。没有哪种模式或 hook 的 allow 能覆盖它。
- 用 `sbx secret set` 保存密钥，绝不要用 `-e KEY`。
- 对你不愿让它签名的智能体，关掉 `ssh.agentForwardingEnabled`。
- 一条主机允许会放行任意正文。用 kit 的 HTTP 规则收窄 API。
- 在生产中再加上容器或 microVM，丢弃 capabilities，并把根挂载为只读。
