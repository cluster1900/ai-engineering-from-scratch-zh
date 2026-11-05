---
id: skill-trust-evals
title: Skill Permissions, Evals and Supply Chain
code: SE
subtitle: 运行前审查 skill 操作、隔离它们，按评测层门控每次发布，并扫描组件包。
hue: 340
sources: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust, phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability, phases/14-agent-engineering/10-skill-libraries-voyager, projects/skill-scanner, projects/self-improving-skill-loop
source_hash: f18344df1d141366
---

## 症状、原因与修复
type: troubleshooting
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/docs/en.md, phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/code/main.py, phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/docs/en.md, phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/code/main.py, projects/self-improving-skill-loop/README.md, projects/self-improving-skill-loop/solution/dataset.py

| 症状 | 原因 | 修复 |
|---|---|---|
| `deny`，规则为 `workspace-jail` | 目标解析到根路径之外 | 把目标留在 `workspace_root` 下 |
| `command-review` 在 `approved=True` 时仍 deny | `rm` 在 `DESTRUCTIVE_EXECUTABLES` 里 | 审批不能覆盖它。用窄粒度工具 |
| `network-allowlist` 在端口 8443 上 deny | 端口 8443 是不同的 origin | 带端口把该 origin 加进去 |
| 白名单 URL 上出现 `approval-gate` | `influenced_by_untrusted_content` 为 true | 展示目标和后果。拿到审批 |
| `secret-review` deny | 负载匹配 `SECRET_PATTERNS` | 把凭证注入一个窄粒度工具 |
| Lint 问题 `orphan-file` | `SKILL.md` 没有引用该文件 | 引用该文件或删掉它 |
| `fixture_passed` 为 true，`passed` 为 false | 没有受信任的外部认证 | 传入 `--attestation` 和 `--trusted-attestation-sha256` |
| 审计 `usable` 为 false | 两个分区里有相同内容或组 | 按内容和组做并集后再划分 |

## review_action 检查顺序
type: flow
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/code/main.py

1. **policy-change**：一律 `deny`，规则为 `authority-boundary`。
2. **Kind**：不在 `allowed_kinds` 里的 kind 给出 `kind-allowlist` deny。
3. **Path**：read、write 和 delete 经 `normalize_workspace_path` 解析。逃逸给出 `workspace-jail`。
4. **Command**：`inspect_command` 检查裸名、破坏性集合、元字符和 argv 前缀。
5. **Network**：`normalize_https_origin` 补上有效端口。origin 必须在白名单里。
6. **Secrets**：`contains_secret` 匹配给出 `deny`，或在 `permit_secret_use_after_approval` 时给出 `require-approval`。
7. **Approval**：`approval_kinds` 和不受信影响需要 `approved`。否则规则为 `approval-gate`。
8. **Allow**：规则 `policy-allow`。字段 `executed` 保持 false。

## 审查一次操作
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/code/main.py, phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/docs/en.md

```python
policy = SandboxPolicy(
    workspace_root=workspace,                            # resolved with strict=True
    allowed_kinds=("read", "write", "delete", "command", "network"),
    command_allowlist=(("python3", "-m", "unittest"),),  # argv prefixes
    network_allowlist=("https://docs.example.test",),    # origins only
)
request = ActionRequest("write", target="summary.json")  # write is in approval_kinds
review_action(policy, request).to_dict()["verdict"]      # "require-approval"
request = ActionRequest("write", target="summary.json", approved=True)
review_action(policy, request).rule                      # "policy-allow"
normalize_https_origin("https://api.example.test")       # adds ":443"
```

## 运行实验与工具
type: command-table
span: 2
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/docs/en.md, phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/outputs/skill-safety-reviewer/SKILL.md, phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/docs/en.md, projects/skill-scanner/README.md, projects/self-improving-skill-loop/README.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 打印演示决策。它不启动任何进程 |
| `python3 -m unittest discover -s code/tests -v` | 运行课程测试 |
| `python3 scripts/review_action.py --policy <policy> --request <request>` | 返回一次请求的判定和规则 |
| `evaluate_skill.py --fixture-demo <bundle>` | Fixture 运行。`fixturePassed` 为 true，`productionReady` 为 false |
| `scanner examples/reviewable 3` | 用阈值 3 扫描一个组件包。打印 JSON |
| `cli.py <cases> --out experiment.json` | 提出规则并跑门控。它不晋升 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 检查参考解答的每一阶段 |

## 运行隔离演练
type: annotated-code
lang: bash
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/docs/en.md

```bash
docker build -f code/sandbox/Containerfile -t aiefs-skill-sandbox code/sandbox
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --pids-limit 64 --memory 128m --cpus 0.5 \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --mount type=bind,src="${PWD}/code/sandbox/input",dst=/input,readonly \
  --env DEMO_VALUE=bounded aiefs-skill-sandbox
# expect: /input readable, image read-only, network fails
```

## 默认值与限制
type: defaults
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/code/main.py, phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/code/main.py, projects/self-improving-skill-loop/solution/promotion.py, projects/skill-scanner/solution/cli.rs

| 设置 | 默认值 | 说明 |
|---|---|---|
| `allowed_kinds` | `("read",)` | `SandboxPolicy` 只允许读取 |
| `approval_kinds` | `("write", "delete", "network")` | 这些 kind 需要 `approved` |
| `MAX_SKILL_BODY_CHARS` | 10_000 | 超过则 lint 问题 `body-size` |
| `MAX_COMPANION_FILE_BYTES` | 1_000_000 | 超过则 lint 问题 `file-size` |
| `min_precision`、`min_recall` | 0.8 | 实验里的 `ReleaseThresholds` |
| `min_repeat_rate` | 0.9 | 最低的每用例通过率 |
| `min_gain` | 0.05 | 循环门控还需要零回归 |
| Scanner 阈值 | 3 | 阈值为 0 是错误 |

## 隔离边界
type: comparison
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/docs/en.md

| 因素 | 受限子进程 | 容器 | MicroVM |
|---|---|---|---|
| 隔离的内容 | 环境、cwd、超时、输出 | 文件系统与进程命名空间 | 独立的客户机内核 |
| 不隔离 | 内核、宿主文件系统、网络 | 共享内核、宿主挂载 | 错误挂载、凭证、出网 |
| 典型用途 | 经过审查的本地工具 | 代码仓库构建与测试 | 不信任的代码、高影响 |

## 六层评测
type: concepts
from: phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/docs/en.md

- **Structure**：不靠模型做 lint。CI 拦截 `E_*` 错误，允许已审查的 `W_*` 警告。
- **Routing**：在正向、明确负向和近邻误触发上算精确率和召回率。汇报原始计数。
- **Behavior**：基线和处理组用同一模型、工具、任务和预算。
- **Scripts**：在模型运行之外测试，覆盖空输入、畸形输入和重复输入。
- **Safety**：记录控制手段：仅指令、工具策略、审批、沙箱或验证。
- **Portability**：安装到干净的目标位置。校验已安装的副本。
- **Verdicts**：`fixturePassed`、`localEvidenceReady`、`productionReady`。`passed` 跟随 `productionReady`。

## 项目流水线
type: architecture
from: projects/skill-scanner/solution, projects/self-improving-skill-loop/solution

```arch
node | spans | 1,1 | spans | UTF-8 byte offsets | process
node | scan | 2,1 | scan | three named rules | process
node | score | 3,1 | risk_score | once per rule and line | process
node | review | 4,1 | review | review-required or below-threshold | client
node | split | 1,2 | split_cases | content and group union | store
node | eval | 2,2 | evaluate | per-case rows | process
node | prop | 3,2 | propose | dev errors, min_support 2 | process
node | gate | 4,2 | gate | gain and regressions | client
edge | spans | scan | lines
edge | scan | score | findings
edge | score | review | score
edge | split | eval | development
edge | eval | prop | errors
edge | prop | gate | candidate
```

## 代码中的任务
type: task-table
span: 2
from: phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/code/main.py, phases/14-agent-engineering/10-skill-libraries-voyager/code/main.py, projects/self-improving-skill-loop/solution

| 任务 | 代码 |
|---|---|
| Lint 一个组件包 | `lint_package(root)` |
| 给路由打分 | `classification_metrics(expected, predicted)` |
| 检查已安装的副本 | `verify_manifest(root, expected)` |
| 宿主支持矩阵 | `portability_matrix(requirements, hosts)` |
| 无泄漏划分 | `split_cases(cases, holdout_fraction=0.25)` |
| 提出规则 | `propose(development, rules, min_support=2)` |
| 门控一个候选 | `gate(holdout, baseline, candidate)` |
| 精炼一个库 skill | `register(skill, dedup=True)` 会提升版本 |

## 问题
type: qa
span: 2
from: phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust/docs/en.md, projects/skill-scanner/README.md, phases/14-agent-engineering/10-skill-libraries-voyager/docs/en.md, projects/self-improving-skill-loop/stages/04-promotion/docs/en.md

- **`allowed-tools` 会给 skill 做沙箱吗？** 不会。它影响能力或权限提示。它不是 OS 隔离。
- **哈希能证明包是安全的吗？** 不能。它证明字节与一份 manifest 匹配。
- **低于阈值的扫描就是安全的吗？** 不是。只是这些规则没有越过阈值。
- **为什么给 skill 做版本？** 钉在 v1 的父级不会捡到精炼后的 v3。
- **为什么轮换 holdout？** 在同一 holdout 上反复调参会泄漏信息。
