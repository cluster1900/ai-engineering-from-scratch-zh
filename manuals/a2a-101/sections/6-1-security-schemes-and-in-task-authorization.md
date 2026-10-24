# 安全方案与任务内授权

> card 声明 agent 接受哪些凭据，HTTP 在每个请求上检查它们，而运行中的任务仍然可以停下来请求批准。

planner 的最后一次委派给了 `deployer`，它是 kit 中唯一保护自己端点的 agent。没有令牌的请求在任何 A2A 方法运行之前就得到 HTTP 401。带有令牌的请求会启动一次部署，部署又会停在 `TASK_STATE_AUTH_REQUIRED`，直到操作员批准。

[图](#fig-credential-path)跟踪了这个凭据从 card 到批准的过程。读完本节后，你能读懂 card 的安全字段，发送它们要求的内容，并把任务的范围限定到其所有者。

```figure
id: fig-credential-path
kind: flow
title: one credential, from the card to an in-task approval
claim: The card names the scheme, HTTP rejects a request without the token before A2A runs, and a running task can still stop for an approval.
caption: Read top to bottom, in five steps. From step 2 on, the left box is what the planner sends and the right box is what deployer answers. Grey boxes sit outside A2A. The task id is shortened to 8 characters. From capture/out/01-agent-cards.http, 18-extended-card.http, and 07-auth-required.http.
```

## card 声明了什么 {#s-security-schemes-and-in-task-authorization-what-the-card-declares}

只有 deployer 的 card 带有安全字段，所以 `test-runner` 和 `code-reviewer` 接受任何调用者。

```listing
title: the security fields on the deployer card
source: capture/out/01-agent-cards.http
lang: json
note: Cut from the deployer card. The two fields sit between capabilities and defaultInputModes.
---
  "securitySchemes": {
    "bearer": {
      "httpAuthSecurityScheme": {
        "description": "A token issued by the platform team.",
        "scheme": "Bearer"
      }
    }
  },
  "securityRequirements": [
    {
      "schemes": {
        "bearer": {
          "list": []
        }
      }
    }
  ],
```

**安全方案：** card 的 `securitySchemes` 映射中的一个条目。键（这里是 `bearer`）是 agent 选的名称。值恰好包含五种变体之一：`apiKeySecurityScheme`、`httpAuthSecurityScheme`、`oauth2SecurityScheme`、`openIdConnectSecurityScheme` 或 `mtlsSecurityScheme` {{proto SecurityScheme}}。

**安全要求：** `securityRequirements` 中的一个条目。它的 `schemes` 映射给出 `securitySchemes` 中的方案名称，每个名称映射到 "the required scopes" {{proto SecurityRequirement}}，放在一个唯一字段为 `list` 的 `StringList` 中。deployer 给出 `bearer` 和一个空的 `list`，所以只要令牌就够了。

§8.5 的示例 card 仍然写的是 `security`，而 proto 写的是 `securityRequirements` {{spec §8.5}}（[冲突 D6](#s-ref-sources)）。迁移指南称 implicit 和 password 流程已被移除 {{docs whats-new-v1}}，而 proto 把两者都保留为已弃用 {{proto OAuthFlows}}（[冲突 D11](#s-ref-sources)），所以两者都不要提供。

## 凭据如何传输 {#s-security-schemes-and-in-task-authorization-how-credentials-travel}

客户端在 A2A 之外获取凭据，并在每个 A2A 请求上把它放在传输的请求头或 metadata 中发送 {{spec §7.3}}。这个请求头带有密钥，所以生产部署必须加密流量：HTTP 绑定使用 HTTPS，gRPC 使用 TLS {{spec §7.1}}。规范建议使用 TLS 1.3 或更高版本 {{spec §7.1}}，企业指南则建议 TLS 1.2 或更高版本 {{docs enterprise-ready}}（[冲突 D18](#s-ref-sources)）。

没有凭据时，`deployer` 在任何 A2A 方法运行之前就以 HTTP 401 和一个 `WWW-Authenticate` 质询回答，如[扩展 card 与签名](#s-extended-cards-and-signatures)一节所示。

```rule
label: every request, checked against the card
source: spec §7.4
---
The server must authenticate every incoming request with the credentials that it receives and the authentication requirements that it declares.
```

## 授权范围：你看不到的任务就不存在 {#s-security-schemes-and-in-task-authorization-authorization-scope-a-task-you-cannot-see-does-not-exist}

每个实现自行决定其授权逻辑 {{spec §7.5}}。规范固定了拒绝的样子：当客户端无权访问某个资源时，服务器不得透露该资源存在 {{spec §3.3.2}}。所以另一个调用者的任务得到的 `TaskNotFoundError`，与从未存在过的任务一样。同一节为授权错误列出了一种情况：访问另一个用户创建的任务 {{spec §3.3.2}}。那个错误会证实任务存在（[冲突 D36](#s-ref-sources)）。以未找到错误回答。

检查先运行：授权检查必须在任何可能泄露信息的数据库查询或操作之前进行 {{spec §13.1}}。即使请求没有过滤条件，`ListTasks` 也必须把结果限定在调用者的范围内 {{spec §13.1}}。各 SDK 在谁是所有者的问题上不同：

| 实现 | 所有者范围 | 另一个调用者的任务 |
|---|---|---|
| Kit | 无，deployer 只需要一个共享的 bearer 令牌 | 返回 |
| a2a-python 1.2.2 | 任务存储以调用上下文的 `user_name` 为键，每个未认证的调用者的名称都为空 {{sdk src/a2a/server/owner_resolver.py}} {{sdk src/a2a/auth/user.py}} | `TaskNotFoundError` |
| a2a-js 1.3.0 | 每个存储中都有租户和所有者，匿名调用者为 `unknown` {{sdk-js src/server/owner_resolver.ts at v1.3.0}} | `TaskNotFoundError` |
| a2a-java 1.4.0.Final | 一个 `TaskAuthorizationProvider` 接口，该版本中没有实现，没有实现时每个任务操作都以拒绝方式失败 {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/auth/TaskAuthorizationProvider.java at v1.4.0.Final}} | `TaskNotFoundError` |
| a2a-go 2.6.0 | 内存存储记录调用的用户名，名称为空时 `ListTasks` 以 `ErrUnauthenticated` 失败 {{sdk-go a2asrv/taskstore/inmemory.go at v2.6.0}} | 设置名称后返回 `ErrTaskNotFound` |
| a2a-dotnet 1.0.0-preview2 | 无，因为存储和处理器都不带主体 {{sdk-dotnet src/A2A/Server/ITaskStore.cs at v1.0.0-preview2}} | 返回 |
| a2a-rs a2a-server-lf-v0.5.1 | 存储中没有，可选的 `RequestAuthorizer` 只能看到请求头和任务 id {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}} | 返回 |

没有填入用户的认证中间件，每个任务都对每个调用者可见。

## 任务内授权 {#s-security-schemes-and-in-task-authorization-in-task-authorization}

**任务内授权：** agent 在任务进行到一半时通过 `TASK_STATE_AUTH_REQUIRED` 请求许可 {{spec §7.6}}，[中断状态](#s-input-required-and-auth-required)一节逐帧跟踪了这个过程。kit 的 `POST /approve/<task id>` 不检查任何凭据，所以任何得知任务 id 的人都能批准。真正的批准渠道会认证操作员，并记录是谁批准的。

本身是 agent 的客户端可以沿着处于 `TASK_STATE_AUTH_REQUIRED` 的任务链向上传递请求 {{spec §7.6.2}}。这样，带内凭据会经过链中的每个 agent {{spec §7.6.3}}。所以要把它绑定到提出请求的 agent，只有那个 agent 能使用它 {{spec §7.6.3}}。

[PR #2081](https://github.com/a2aproject/A2A/pull/2081) 于 2026-07-30 在 v1.0.1 之后把 §7.6.4 加入了 main，目前还没有 release 包含它。它说 agent 不得把转入 `TASK_STATE_AUTH_REQUIRED` 本身当作对任何操作的许可 {{spec-main §7.6.4}}。在那里获得的凭据不授权之后的消息，除非实现、签发方或某个扩展这样规定 {{spec-main §7.6.4}}。kit 以任务 id 为每次批准的键，所以一次批准恢复一次部署，而它的 bearer 检查在之后的每个请求上都会运行。

```takeaways
- 在每个请求上，把 `securityRequirements` 指定的凭据放在 HTTP 请求头中发送。
- 对调用者无权查看的每个任务都回答 `TaskNotFoundError`。
- 让 `TASK_STATE_AUTH_REQUIRED` 中的每次批准都经过一个会认证操作员的渠道。
- 把一次批准视为只涵盖一个任务，并在之后的每条消息上再次检查授权。
```

Sources: spec §3.3.2, §7.1, §7.3, §7.4, §7.5, §7.6, §7.6.2, §7.6.3, §8.5, §13.1 (research/sources/specification.md); spec-main §7.6.4 (research/sources/specification-main.md, main 679ab3a, unreleased); proto SecurityScheme, SecurityRequirement, StringList, OAuthFlows (research/sources/a2a.proto); docs/topics/enterprise-ready.md and docs/whats-new-v1.md at v1.0.1; sdk src/a2a/server/owner_resolver.py, src/a2a/auth/user.py, src/a2a/server/tasks/inmemory_task_store.py at a2a-python 1.2.2; sdk-js src/server/owner_resolver.ts at v1.3.0; sdk-java server-common/src/main/java/org/a2aproject/sdk/server/auth/TaskAuthorizationProvider.java at v1.4.0.Final; sdk-go a2asrv/taskstore/inmemory.go at v2.6.0; sdk-dotnet src/A2A/Server/ITaskStore.cs at v1.0.0-preview2; sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1; a2aproject/A2A PR #2081 (unreleased, on main); capture/out/01-agent-cards.http, 07-auth-required.http, 18-extended-card.http; capture/planner.py, capture/a2a_ref.py, capture/README.md
