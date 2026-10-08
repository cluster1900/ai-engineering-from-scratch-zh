# 显式权限范围与无状态 征求

> 根在 MCP 2026-07-28 规范中已经被废弃,而且它从来不是安全沙箱. 请将权限范围 (范围) 置于可见的工具 参数或资源URI中,由服务器进行识别权,并使用该工具.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## 学习目标

- 使用显式工作区参数、资源URI或服务器 静态配置替代已废弃的 Roots。
- 限制的范围 提示与识别权,路径限制) 和操作系统级
- 通过MRTR 的`input_required`结果交付表单模式(形式模式) 的`elicitation/create`,我知道.
- 在每个请求的客户端能力中声明请求支持并拒绝不支持模式.
- 严谨的校验`accept`,我知道.`decline`和 `cancel`这三种截然不同的交互结果.
- 将破坏性确认绑定到识别权主体,原始参数,候选集合和过期时间.

## 两个看似相似的问题

一个注释工具 收到了如下请求: 删除旧的TPS 报告.

服务器必须回答两个不同的问题:

1. 这次操作允许触摸哪个工作区?
2. 根据用户的指数,

第一个问题关乎范围 (范围) 和鉴定权 (权限) 问题第二问题属于交互式消除歧义 (互动歧义) 问题将第二者混为一谈会导致极其危险的设计

## 根源仅为迁移过渡表面

早期的MCP规范允许客户端声明 根,并在列表发生变化时通知服务器──然而根 仅仅是提示的引导信息 (信息指导)──它既没有限制服务器的进程实际上可以读取哪些文件,也没有对调用者完成识别权,也没有建立任何操作系统级别的安全沙箱──

针对新设计全面废弃了`roots/list`与`notifications/roots/list_changed`△推使用以下显式方案作为替代方案:

- 当范围随着调用发生变化时,使用`workspaceUri`或`directory`工具参数――
- 当操作本身针对特定资源时,使用资源URI.
- 当特定部署单例独占固定工作区时,使用服务器配置文件.
- 当必须从技术上阻止代码越界时,使用进程沙箱 (process sandbox) 或隔离文件系统 (jailed file system) .

如果目前的2026-07-28 接入方案仍在废弃的过渡期需要`roots/list`服务器应将其嵌入到MRTR的内部.`inputRequests`它们是转移适配器的,新编写的处理器应直接接收显而易见的范围.

模型能够看清并复述显式的句柄 (手柄) ──而隐藏在传输层会议中的隐式范围则更难审查,重放,审计和路由──

### 三层防守原则

显而易见的URI本身并没有自带合法性证明.

1. **鉴权（Authorization）：**经过鉴定权的主体是否允许使用该工作区?
2. **路径限制（Containment）：**规范后的目标 URI是否严格保持在受权工作区边界内?
3. **沙箱隔离（Sandbox）：**如果服务器遭遇入侵,操作系统能否有效阻止其逃离界限?

可运行的服务器 会维护一个信任工作区 URI 白名单,规范化处理百分号编码的路径,校验真实的路径组件边界,并执行物理删除前即时重新检查路径限制.

幼稚的字符串前检查是存在严重漏洞的:

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

这两条恶意路径都看起来像合法的字符串开头. 必须先规范化,然后再逐步对路径组件进行排序.

## 引发仍然存在,但交互方式已经发生了变化.

引发是现代规范中使用在`tools/call`,我知道.`prompts/get`或`resources/read`执行期间收集用户输入的客户端特性――方法名称仍然是`elicitation/create`△真正改变的是数据在网络连线上的流动方向.

2026-07-28 的服务器 不会发送反向 JSON-RPC 请求――它直接返回`InputRequiredResult`其他:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

接待者可选择提交接受 (接受) 显式拒绝 (拒绝) 否则直接取消/关闭 (取消) 否则客户端携带全新的ID 重试原始的`tools/call`其他:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

在两次调用之间没有任何协议会话. 服务器验证回显的状态,根据预期的方案验证响应内容,确认选中的笔记包含在经签名的候选集合中,重新对工作区的识别权,重新检查路径限制,最后才执行删除.

## 针对每一个请求的能力 协商

支持单单模式调用的客户 会声明:

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

空的诱导能力`"elicitation": {}`) 对于兼容性考虑仍然等于仅支持单一模式――明确声明`"elicitation": {"form": {}}`同样支持单个模式――但只声明URL模式`"elicitation": {"url": {}}`)则不支持表单――服务器绝不能内嵌当前请求的功能 中所缺失的模式,甚至当前请求曾声明该模式――

每个请求都必须带着`io.modelcontextprotocol/protocolVersion`△版本缺失或非字符串类型返回 `-32602`△不支持的版本字符串返回 `-32022`没有确切的`supported`与`requested`数据――缺失或仅支持URL的发出 会返回 `-32021`并将`data.requiredCapabilities`设为`{"elicitation":{"form":{}}}`,我知道.

没有JSON-RPC`id`封信属于通知.直接处理它,不要发出 JSON-RPC 成功或错误响应. 在流式HTTP上,已接受的通知会收到无文的.`202 Accepted`,我知道.

`clientInfo`应用于诊断排列,但它是自发声明的,绝不能用于识别用户身份.

服务器实现了`server/discover`并返回包含`resultType: "complete"`的`supportedVersions`能力`ttlMs`及`cacheScope`对于这种现代设计,它不会向外宣告 根源.`tools/list`△该结果返回确定性`notes_delete`描述符、合法的对象 类型 `inputSchema`、服务器身份元数据以及公共缓存提示──

## 表单模式(表格模式)

表单模式使用专为可用对话框设计的限量JSON方案.根节点必须是对象,其属性仅限于平的原始字段 (原始字段) 或被支持的枚举数组.深度嵌套的对象和通用文档方案绝对不属于确认对话框的范.

表单模式适用于:

- 在一些候选项目中挑选一个;
- 确认某项破坏性操作;
- 收集不含敏感信息的配置偏好;
- 采集少量必须由人而不是模型决定的数值.

绝不要使用单个模式来收集密码,API密钥,访问令牌或支付证券.

服务器必须再次对传输内容进行检验. 客户端的表单验证只能提高用户体验,绝不能构成信任依据.

## URL模式(URL模式)

模式发送一个安全的网址以进行带外 (out-of-band) 交互:

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

当敏感信息必须直接输入由服务器控制的Web流程 (例如第三方授权) 时,请使用URL模式――客户向用户展示完整的跳转目标,并在打开之前获得用户同意――客户绝不能预装该URL (预装) .

`accept`响应仅表示用户同意打开URL,并不证明外部交互已顺利完成. 在重试时,服务器会检查自己的状态,要么执行完成,要么返回另一个.`input_required`结果.

URL生成绝对不能替代MCP客户端和MCP服务器之间的识别权机制――它是为了让MCP服务器代表用户执行设计的外部交互――服务器必须与浏览器端用户密切联系到发起MCP操作的相同识别权主体――

## 应分支与处理分支

请将各种行动视作严格的产品逻辑决策,而不是同义别名:

| 动作 | 含义 | 安全的 Server 处理行为 |
|---|---|---|
| `accept` | 用户提交了交互内容 | 校验内容并继续执行 |
| `decline` | 用户明确表示拒绝 | 返回一个执行完成且非错误的拒绝结果 |
| `cancel` | 用户关闭对话框或未能完成交互 | 安全停止并允许稍后重试 |

绝不要将缺失内容解读为默许同意.

## 保护破坏性MRTR 状态

候选人列表绝不能仅仅存在于即时或未签署的Base64值中.

本课程对状态负载进行签名,内容包括:

- 经过鉴定权的主体;
- 发起调用原始方法;
- `workspaceUri`与`title`的摘要;
- 表单中展示的合法笔记ID列表;
- 操作执行阶段;
- 较短的过期时间.

在执行变更之前,服务器还会查看最新的存活笔记记录.

对于一次性金融交易或不可逆操作,仅凭HMAC无法阻止合法状态在有效期内被重置.必须在所有交易者 实例共享的防重置储存中,严格使用原子操作生成并消耗一次性随机数量.

在声明中,必须先验证交互的合法性.`cancel`没有任何变化,并允许该状态在过期前重试.`decline`属于终态,因此本课会消费该不执行任何删除.

```figure
t3-roots-boundary
```

## 手写实现

`code/main.py`演示了一个现代化的`notes_delete`工具:

- `tools/list`返回确定性、可缓存的描述符,包含必要的工作空间和标题方案──
- 权限范围通过显而易见的`workspaceUri`参数传递――
- 服务器配置为当前课程主体授予该工作区的访问权限.
-  URI 规范化有效拒绝前混与编码后的目录遍历攻击.
- 所有的破坏性删除均强制要求表单模式的诱导.
- 发出封装在`resultType: "input_required"`传输中
- 签名的`requestState`绑定精确的候选人列表与原始参数.
- 输入的防重存存储能够在多个服务器中拒绝复制相同的接受或下降状态.
- 重试调用采用全新的请求ID 并返回`resultType: "complete"`,我知道.

数据库采用内存实现,以便清晰审查协议行为. 如果连接到数据库,安全规则完全一致.

## 使用与运行

在仓库根目录下运行:

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- 发现声明工具 且不包含根.
- 工具发现 返回 `notes_delete`附带`resultType`、服务器身份与缓存提示────────────
- 请问你的身份`1`在`inputRequests.delete_choice`中返回表单.
- 请问你的身份`2`回显签名状态并完成删除.
- 欺骗路径与编码路径均触发路径限制失败.
- 改标题 无法复用前前的确认状态──
- 执行下降 会保留笔记完好无损.
- 共有笔记与重放状态的两个服务器对象无法重复执行一次确认.
- 配置和表单声明均能正常工作,而仅声明URL支持则精准返回`-32021`单单需求错误.
- 不支持版本的错误响应使用精确的`-32022`数据结构
- 没有 id 的通知 不产生任何 JSON-RPC 响应.

## 交付产物

`outputs/skill-elicitation-form-designer.md`能够辅助设计显式范围、识别权检查、MRTR表单、响应分支与状态绑定――它严格禁止已废弃的根当作沙箱使用,也禁止通过表单模式收集敏感机密――

## 课后练习

1. 将内存防重存储备用为SQLite. 在单个事务中原子化声明不存在并删除笔记,证明两个进程不能同时提交成功.
2. 增加`url`能力 协商与带外设置流程──确保第三方凭证不流入`inputResponses`,我知道.
3. 将内存笔记本字典替换为临时的SQLite数据库.
4. 为真实文件系统实现设计符号链接(符号链接) 安全策略――解释为什么仅仅凭 URI 词法包含检查无法阻止符号链接逃逸――
5. 设计一个 2025-11-25 适配器,将现代MRTR处理器输出映射为旧式服务器发起的发动,并保持其与当前处理器的代码隔离.

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Roots | 已弃用的提示性工作区指引，不具备鉴权或沙箱隔离能力 |
| 显式权限范围（Explicit scope） | 在请求参数中清晰可见的工作区、目录或 resource 句柄 |
| 路径限制（Containment） | 规范化路径组件校验，确保目标严格限制在受控边界之内 |
| Elicitation | 在 MCP 操作执行期间用于获取用户输入的 client 特性 |
| 表单模式（Form mode） | 使用受限扁平 schema 的带内（in-band）结构化用户输入 |
| URL 模式（URL mode） | 针对敏感或外部工作流的带外（out-of-band）Web 交互 |
| MRTR | 多轮往返请求，返回 input-required 结果后由 client 发起全新重试 |
| `requestState` | 不透明的状态凭证，由 client 原样回显并由 server 进行完整性校验 |
| Decline（拒绝） | 用户明确作出的拒绝操作 |
| Cancel（取消） | 用户主动关闭界面或在未获批准的情况下中断交互 |

## 旧版兼容性

对于固定在2025-11-25版本的对端,`roots/list`,我知道.`notifications/roots/list_changed`及实时服务器发起`elicitation/create`可能仍然存在. 请将该适配器明确标记为遗产.绝不能允许旧版本的根列表绕过服务器的识别权检查,也不要将协议会话的假设引入现代处理器中.

## 延伸阅读

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
