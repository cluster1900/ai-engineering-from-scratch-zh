# MCP Registry 供应链：准入、Drift 与回滚

> Registry 条目告诉你发布者声明了什么。生产准入则证明你获取了什么、观察到了什么、批准了什么，以及可以安全恢复什么。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 17（gateway 与 Registry），Phase 13 · 18（生产环境身份验证）
**Time:** ~90 分钟

## 学习目标

- 区分 Registry 发布、package provenance、Runtime 发现和本地审批。
- 在不信任 MCP server 自有记录中名称的情况下验证其 namespace。
- 固定不可变的发布、执行来源、provenance 和实时 descriptor 证据。
- 检测准入后的 Registry 状态变化和 Runtime drift。
- 将路由回滚到先前已准入的版本，而不重写历史记录。
- 维护一个能够解释每项决策且可检测篡改的准入 ledger。

## 问题

你在 Registry 中发现了 `com.example/inventory`。它的描述看起来正确，package 也确实存在。server 会响应 `server/discover`。

这并不是一个事实，而是来自不同权威来源的一系列事实：

1. 通过 namespace 身份验证的发布者提交了一条记录。
2. Package Registry 提供了具有特定身份和 digest 的产物。
3. 正在运行的 endpoint 报告了协议版本、capability、Tool 和诊断性 server 信息。
4. 你的组织决定允许这一精确组合。

将这些事实压缩为“它存在于 Registry 中，所以可以信任”，会造成供应链盲区。有效发布仍可能被弃用。如果不固定 digest，package tag 可能指向意料之外的产物。server 可能在审查后添加具有破坏性的 Tool。回滚可能悄然选择一个从未准入的版本。

解决方案是在每个边界都保留证据的准入控制器。

## Registry 是索引，而不是你的审批系统

官方 MCP Registry 存储 server metadata。其 `server.json` 记录为 server 版本命名，并声明一个或多个 package 或远程 endpoint。发布规则还包括 namespace 身份验证、package 所有权检查、受限制 Registry 规则，以及范围有限的发布者 metadata 位置。

这些控制解决的是发布问题。你的生产策略仍需解决部署问题：

| 边界 | 问题 | 证据所有者 |
|---|---|---|
| Namespace | 发布者是否获准使用这个名称？ | Registry 身份验证，以及你已验证的 namespace 输入 |
| 记录 | 发布者为这个版本声明了什么？ | 不可变的 `server.json` digest |
| 执行来源 | 将执行哪个 package 或远程 endpoint？ | 已声明的来源字段、已验证的所有权结果、Transport 和可信 digest |
| Runtime | endpoint 当前暴露了什么？ | `server/discover` 和 Tool descriptor |
| 准入 | 你的策略是否批准了这一精确集合？ | 本地 pin 和 ledger 条目 |
| 运维 | 它是否仍然安全，什么可以替代它？ | Drift 检查、状态同步、健康状况和回滚路由 |

Registry schema 版本与 MCP 协议版本彼此独立。一条记录可以使用已发布的 `2025-12-11` server schema，而实时 server 支持 MCP `2026-07-28`。绝不要从其中一个推断另一个。

```figure
mcp-registry-admission
```

## 一次准入决策中的七项控制

### 1. Namespace 验证

官方 Registry 名称使用经过身份验证的 namespace。已验证的域名可以映射到反向域名前缀。例如，对 `example.com` 的控制权可以确立 `com.example/*`。

不要接受字符串前缀检查：

```python
server_name.startswith("com.example")
```

这也会接受 `com.exampleevil/tool`。在 `/` 处分割名称，要求 slug 非空，并精确比较 namespace 部分。更重要的是，应从身份验证结果中将已验证的 namespace 传入准入流程。不要根据不可信记录推导信任。

基于 GitHub 的 namespace 和基于域名的 namespace 使用不同的身份验证路径。将任一路径规范化为同一种准入输入：精确的已验证 namespace 字符串。

### 2. Provenance 关联

对于 package 记录，声明与获取到的产物必须通过明确字段进行关联：

- Package Registry 类型
- package 标识符
- package 版本
- 已验证的所有权结果
- 下载产物的 digest

还要验证声明的 package Transport。仅包含远程 endpoint 的记录同样有效，不能因为缺少 package 而拒绝。对于远程来源，将声明的 URL 和 Transport 类型，与独立验证的 endpoint 所有权以及可信连接或部署证据的 digest 进行关联。

本课代码支持两种来源类型，并将选定来源与 Registry 来源、server 名称、Registry 版本、记录 digest 和证据 digest 一同进行 hash。最终得到的 provenance digest 是指向完整证据集的紧凑指针，不能替代对证据本身的保留。

绝不要接受仅由待验证产物自身提供的 digest。应在可信获取边界计算 digest，或从 package 服务接收 digest，并验证该服务给出的验证结果。

### 3. 固定决策，而不只是版本

Registry 版本是唯一的发布标识符。已发布的 metadata 不可变。修改后的记录需要使用新版本。推荐使用 semantic versioning，但 Registry 不作强制要求，也不接受版本范围。

这意味着 `^1.4` 不是准入 pin，“latest”也不是。一个实用的 pin 包含：

```json
{
  "server": "com.example/inventory",
  "version": "1.0.0",
  "recordDigest": "...",
  "source": {"kind": "package", "registryType": "pypi"},
  "sourceDigest": "...",
  "toolsetDigest": "...",
  "provenanceDigest": "...",
  "registryStatus": "active"
}
```

固定多个层次可以帮助你识别发生变化的具体边界。同一 Registry 版本下的记录 digest 发生变化，属于 Registry 完整性故障。同一 package coordinate 或远程部署下的来源 digest 发生变化，属于执行来源完整性故障。Toolset digest 发生变化则属于 Runtime drift。

### 4. 实时 Drift 检测

准入流程应观察实际将接收流量的 server。调用 `server/discover`，通过可信路径列出或以其他方式取得暴露的 Tool descriptor，并验证：

- `supportedVersions` 中包含 `2026-07-28`
- 存在本地要求的全部 capability
- 每个 Tool descriptor 都具有要求的身份和 schema 表面
- 后续检查中，规范化后的 descriptor digest 与已准入 pin 一致

可选结果 `_meta["io.modelcontextprotocol/serverInfo"]` 的值是 server 自行报告的显示、日志和调试 Context。将它记录为诊断证据，但绝不要用它确立 namespace、package 所有权、endpoint 所有权、准入或任何其他安全决策。`_meta` 之外的直接 `serverInfo` alias 不是契约字段，不应提升为诊断证据。

只规范化顺序没有含义的字段。示例在进行 hash 前按稳定名称对 Tool 列表排序，因此无害的列表顺序变化不会导致 drift。它不会丢弃 descriptor 字段。新增 Tool、修改 schema、修改描述或新增 annotation 都会改变 pin。

示例将格式错误的 descriptor 和任何 descriptor digest 变化视为 drift，隔离该 pin、移除其活跃路由，并阻止将该版本作为回滚目标。生产策略可以只在重新审查后才允许编辑性变更，因为描述会影响 Model 的 Tool 选择。“表面上的” metadata 可能改变 Agent 行为。

### 5. Registry 状态是实时状态

Registry API 会在每条 server 记录旁附加响应级 `_meta` 对象。由 Registry 管理的字段位于 `_meta["io.modelcontextprotocol.registry/official"]` 下。将响应的 `_meta` 对象传给准入流程，并读取 `_meta["io.modelcontextprotocol.registry/official"].status`。直接使用 `_meta.status` 并不符合官方通信结构。不要混淆响应 metadata 与发布记录自身的 `_meta`。状态可以是：

- `active`：默认返回，并且符合本地准入条件
- `deprecated`：仍可被发现并带有警告，但不再适合自动选择
- `deleted`：默认隐藏，但其历史记录仍可通过已删除视图或增量视图访问

准入后同步状态。如果活跃版本变为 deprecated 或 deleted，则隔离其 pin，并停止将新工作路由到该版本。保留证据。从默认列表中删除并不代表可以抹除审计轨迹。

发布者提供的自定义 metadata 只能位于发布记录中的 `_meta.io.modelcontextprotocol.registry/publisher-provided` 下。由 Registry 管理的响应 metadata 与之分离。不要允许发布者设置自己的官方状态。

### 6. 回滚意味着恢复路由

回滚期间不会编辑不可变发布。回滚会选择一个先前已准入且当前仍符合条件的 pin，并更改活跃路由。

安全的目标必须：

1. 具有完整的准入记录。
2. 根据你的策略，仍处于 active Registry 状态。
3. 未因 Runtime 或安全证据而被隔离。
4. 仍能解析到已固定的 package 和实时 descriptor 集合。
5. 通过当前健康检查。

示例重点处理前三项条件。实际的 reconciler 应在激活前重新获取 package，并重新检查实时 endpoint。

### 7. 追加准入 Ledger

准入数据库说明当前活跃的内容。ledger 则解释原因。

每个示例条目包含序号、时间、event、server、版本、结果、原因、证据、前一条目的 hash，以及自身的 hash。修改较早的结果会破坏该条目及之后每个链接的验证。

这能检测篡改，但并非凭空实现防篡改。应在独立的信任域中定期锚定 ledger head，例如带签名的发布 metadata 或 write-once 存储。限制拥有追加权限的身份。不要在证据中包含授权 Token、package credential、Tool 参数和私有 endpoint 数据。

## 构建它

可运行的控制器位于 `code/main.py`，仅使用 Python standard library。

从有限演示开始：

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
```

演示执行五项操作：

1. 使用匹配的 namespace、package provenance、协议、capability 和 Tool 准入 `1.0.0`。
2. 准入 `1.1.0` 并将其设为 active。
3. 在 Runtime 观察到意外的删除 Tool。
4. 观察到 `1.1.0` 的 Registry 状态变为 `deprecated`。
5. 将路由恢复到仍已准入的 `1.0.0` pin。

预期结构：

```json
{
  "admitted": [true, true],
  "driftAllowed": false,
  "rollbackAllowed": true,
  "activeVersion": "1.0.0",
  "ledgerValid": true
}
```

按以下顺序阅读实现：

1. `namespace_for_domain()` 和 `namespace_matches()` 确立精确的命名权限。
2. `digest()` 和 `normalized_tools()` 生成确定性证据。
3. `RegistryAdmissionController.admit()` 关联发布、provenance、Runtime 和策略。
4. `check_live()` 将新观测结果与 pin 进行比较。
5. `observe_registry_status()` 隔离 Registry 状态发生变化的版本。
6. `rollback()` 只激活先前已准入且符合条件的目标。
7. `AdmissionLedger.verify()` 检测已记录历史是否发生变化。

## 使用它

将控制器放在发现流程与路由之间：

```text
Registry sync -> artifact verifier -> live discovery -> admission controller -> route table
                                               |                 |
                                               v                 v
                                          evidence store    admission ledger
```

为这些任务使用不同身份。Registry 同步 worker 需要 metadata 读取权限。产物验证器需要 package 获取权限。路由 reconciler 需要激活已批准 pin 的权限。它们都不需要拥有全部 credential。

显式表示发布状态。“Approved”表示证据通过了策略。“Active”表示路由当前选择了它。“Quarantined”表示它不能接收新工作。“Superseded”表示另一个已准入版本当前处于 active。不要用一个 Boolean 编码全部四种含义。

在 `tools/list` 中暴露 server 之前执行准入。否则，客户端可能在发布与策略评估之间的空档期发现 Tool。

## 交互式 Lab

你将逐一观察每个边界发生故障。

### Lab A：namespace 冲突

从代码目录打开 Python shell：

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code
python3 -q
```

然后运行：

```python
from main import namespace_matches
namespace_matches("com.example/inventory", "com.example")
namespace_matches("com.exampleevil/inventory", "com.example")
```

第一个结果是 `True`，第二个是 `False`。在本地将精确比较替换为 `startswith`，并观察第二个名称为何会越过边界。继续之前恢复精确比较。

### Lab B：descriptor drift

```python
from main import *
times = iter(f"2026-08-21T12:00:{n:02d}+00:00" for n in range(10))
c = RegistryAdmissionController(clock=lambda: next(times))
meta = {OFFICIAL_META_KEY: {"status": "active"}}
c.admit(sample_record("1.0.0"), meta, "com.example", evidence_for("1.0.0"), sample_live("1.0.0"))
c.check_live("com.example/inventory", "1.0.0", sample_live("1.0.0", True))
```

检查原因和路由状态。package 和 Registry 记录并未改变，但 Runtime Tool 表面发生了变化，因此控制器隔离并停用了该 pin。这就是供应链控制必须在安装后继续进行的原因。

### Lab C：状态与回滚

准入 `1.1.0`，将其标记为 deprecated，然后尝试两个回滚目标：

```python
c.admit(sample_record("1.1.0"), meta, "com.example", evidence_for("1.1.0"), sample_live("1.1.0"))
c.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
c.rollback("com.example/inventory", "1.1.0", "unsafe retry")
c.rollback("com.example/inventory", "1.0.0", "restore known release")
c.ledger.verify()
```

被隔离的目标会被拒绝。较早的 active pin 会被接受。ledger 仍然有效。

## 实践 Lab

使用双人审批 gate 扩展控制器。

要求：

- 将审批存储为带签名的证据引用，而不是 pin 中的可变名称。
- 对包含 `destructiveHint: true` Tool 的 Toolset，要求两个不同的审查者身份。
- 拒绝重复的审查者身份。
- 审批不完整时，在 ledger 中保留原始准入尝试。
- 为零个、一个、重复身份和两个不同身份的审批添加测试。
- 不要记录签名、credential 或完整的私有 Tool 参数。

成功标准是：在两个身份都批准了精确的记录、package 和 Toolset digest 前，破坏性 Tool 不能变为 active。

## 交付产物

本课交付 `outputs/skill-mcp-registry-admission.md`。在审查新的 Registry 版本或调查 drift 时，可将它作为扁平且可复用的操作手册。它定义了输入、拒绝规则、证据包、状态对账和回滚证明，且不依赖示例 class 名称。

## 验证它

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明：

- 精确的 namespace 边界会拒绝相似前缀
- 只有官方 namespaced Registry 状态才能使版本符合条件
- 未验证或不匹配的 package 和远程证据会被拒绝
- 发布者 metadata 无法冒充由 Registry 管理的 metadata
- Tool 排序会被规范化，但不会隐藏 descriptor 变化
- 格式错误的 package 和 Tool 结构会被安全拒绝
- `serverInfo` 始终只用于诊断，绝不提供准入权限
- descriptor drift 会隔离、停用 pin，并阻止回滚到该 pin
- 状态变化会隔离 active pin
- 回滚不能选择已隔离或未知的版本
- ledger 篡改可以被检测

## 生产环境故障模式

| 故障 | 发生原因 | 必需的响应 |
|---|---|---|
| 名称看似有效，但 namespace 从未经过身份验证 | 策略信任了记录文本 | 拒绝准入，直到可信 namespace 验证器提供精确前缀 |
| 相同 package coordinate 返回新的字节 | 可变上游或遭破坏的分发渠道 | 停止激活，保留两个 digest，并调查获取边界 |
| “Latest”未经审查便发生变化 | 浮动选择逃逸了 pin | 只解析精确的已准入版本和 digest |
| 审批后出现新 Tool | Runtime drift 或不同部署 | 隔离路由，并捕获新的 descriptor 观测结果 |
| Deprecated 版本仍处于 active | 状态同步缺失或延迟 | 按计划定期对账状态，并在激活前进行对账 |
| Deleted 记录从默认同步中消失 | 客户端只请求了 active 记录 | 使用增量或感知 deleted 状态的对账，并保留本地历史 |
| 回滚目标从未准入 | 路由控制与审批状态彼此脱节 | 拒绝回滚，并为目标执行新的准入流程 |
| 攻击者重写所有条目后，ledger 仍能在本地通过验证 | Hash chain 没有外部 anchor | 将带签名的 ledger head 发布到独立信任域 |
| 证据包含 bearer Token 或 Tool 参数 | 日志记录复制了完整请求 | 在采集时执行脱敏，并只存储最少量的证明 |

## 运维规则

发布回答“这个身份能否发布这个名称？”准入回答“我们是否会执行这一精确产物，并暴露这一精确行为？”将这些决策分开，固定每个关联点，并让回滚依据证据而不是记忆进行选择。

## 延伸阅读

- [官方 Registry server.json 要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [官方 Registry OpenAPI 契约](https://registry.modelcontextprotocol.io/openapi.yaml)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
