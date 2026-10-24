# 扩展 card 与签名

> `GetExtendedAgentCard` 向经过认证的调用方返回一张更完整的 card，而 `signatures` 让任何调用方都能检查一张 card 是否就是其发布者签名的那张。

planner 持有一个 bearer token，并读取 `deployer` 的公开 card。这张 card 带有签名，它的 `extendedAgentCard` 标志表明经过认证的调用方能看到更多内容。

读完本节后，你能获取扩展 card，并按规范的规定对 card 签名和验证。

## GetExtendedAgentCard {#s-extended-cards-and-signatures-getextendedagentcard}

**扩展 card：** agent 通过 `GetExtendedAgentCard` 返回给经过认证的调用方的更完整的 card，比公开 card 有更多细节或 skill {{spec §3.1.11}}。

这次调用需要凭据。客户端必须用公开 card 在 `AgentCard.securitySchemes` 和 `AgentCard.security` 中声明的某个方案对请求进行认证 {{spec §3.1.11}}。这条规则仍写作 `security`，而 1.0 已把它换成 `securityRequirements` {{proto AgentCard}}（[冲突 D6](#s-ref-sources)）。[PR #2046](https://github.com/a2aproject/A2A/pull/2046) 在 main 上修复了 §8.5 的示例，而 §3.1.11 的正文仍写作 `security`。

附录 A.2.2 把 0.3 版的标志称为 `supportsExtendedAgentCard`，而迁移指南写作 `supportsAuthenticatedExtendedCard` {{spec §A.2.2}} {{docs whats-new-v1}}（[冲突 D40](#s-ref-sources)）。它给新标志的字段编号是 5，而 proto 使用 4 {{spec §1.4}} {{proto AgentCapabilities}}（[冲突 D7](#s-ref-sources)）。

[图](#fig-extended-card)展示了 `deployer` 在没有 token 时拒绝这次调用，然后返回公开 card 再加上第二个 skill，不带 `signatures`。

```figure
id: fig-extended-card
kind: sequence
title: earning the extended card
claim: The same `GetExtendedAgentCard` call fails with HTTP 401 before any A2A method runs, then returns a card with a second skill once a token is attached.
caption: Time runs down. Steps 1 and 2 come from the captured agent cards. Steps 3 and 4 are exchange 1 of the extended-card capture, and steps 6 and 7 are exchange 2. The token comes from the platform team, outside A2A.
```

```listing
title: GetExtendedAgentCard with a token, and the skill it adds
source: capture/out/18-extended-card.http
lang: http
note: Exchange 2, cut to the token and the second skill. The rest of the card equals the public card, without its signatures.
---
### 2 · GetExtendedAgentCard: with a token
…
Authorization: Bearer dpl_test_7c1e4b
…
HTTP/1.1 200 OK
…
      {
        "id": "rollback",
        "name": "Roll back a deploy",
        "description": "Return staging to the previous build. Shown only to authenticated callers.",
        "tags": [
          "deploy",
          "rollback"
        ]
      }
```

客户端应使用扩展 card 取代它缓存的公开 card。这在经过认证的会话的剩余时间内有效，或者直到 card 的 `version` 改变 {{spec §3.1.11}}。这样的 card 不应包含泄露后可被攻击者利用的敏感信息 {{spec §13.3}}。声明了标志但背后没有 card 时，返回 `ExtendedAgentCardNotConfiguredError`，即 `-32007` {{spec §3.3.4}} {{spec §5.4}}。

官方 SDK 把凭据检查留给宿主，下表说明当宿主什么都不加时谁会收到这张 card。

| SDK | 没有宿主检查时谁会收到扩展 card |
|---|---|
| Python 1.2.2 | 任何调用方。`extended_card_modifier` hook 接收调用上下文，可以改变 card {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}。 |
| Go v2.6.0 | 任何调用方。`CallInterceptor` 或 card producer 可以拒绝调用 {{sdk-go a2asrv/handler.go at v2.6.0}}。 |
| Java v1.4.0.Final | 在核心处理器中是任何调用方，这是有意设计的。Quarkus 参考服务器把路由标记为 `@Authenticated` {{sdk-java SECURITY.md at v1.4.0.Final}} {{sdk-java reference/jsonrpc/src/main/java/org/a2aproject/sdk/server/apps/quarkus/A2AServerRoutes.java at v1.4.0.Final}}。 |
| JS v1.3.0 | card 是静态对象时为经过认证的用户，其他人得到公开 card 且没有错误。provider 函数自行决定 {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}}。 |
| .NET v1.0.0-preview2 | 默认没有人，因为该方法抛出 `ExtendedAgentCardNotConfiguredError`。应用会覆盖它并加上自己的检查 {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}}。 |
| Rust a2a-server-lf-v0.5.1 | 任何调用方。resolver 能看到请求 header，可以改变 card {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}}。 |

## 对 card 签名 {#s-extended-cards-and-signatures-signing-a-card}

**Card 签名：** `signatures` 中的一个可选条目，存放一个针对该 card 的 JSON Web Signature，其定义见 RFC 7515 {{spec §8.4}}。

每个条目都存放 base64url 编码的 `protected` header 和 `signature` {{proto AgentCardSignature}}，验证方按三条规则根据收到的 card 重建被签名的字节 {{spec §8.4.1}}：

1. **字段存在性。** 标记为 `REQUIRED` 的字段必须始终存在，即使它的值是默认值 {{spec §8.4.1}}。带 `optional` 关键字的字段只要被设置过就保留，其他处于默认值的字段则被删去。
2. **RFC 8785。** JSON Canonicalization Scheme 对对象的键排序，为每个值固定一种形式，并去掉空白 {{spec §8.4.1}}。
3. **不含 signatures。** `signatures` 字段必须排除在被签名的内容之外，因为签名不能覆盖它自己 {{spec §8.4.1}}。

protected header 包含 `alg`、`typ` 和 `kid` {{spec §8.4.2}}，而 `typ` 那一行在 MUST 标题下写的是 SHOULD（[冲突 D20](#s-ref-sources)）。可选的 `jku` 指向一个包含公钥的 JSON Web Key Set {{spec §8.4.2}}。

签名时，用句点连接 base64url 编码的 header 和规范化的 payload，再用 `kid` 指定的密钥对这个输入签名 {{spec §8.4.2}}。

```listing
title: the deployer card, canonicalized, signed, and checked
source: capture/out/17-signed-card.txt
lang: text
note: The payload and the signing input are cut inside their lines. Step 2 prints the header with spaces, and the encoded bytes have none.
---
# 1. canonical payload (RFC 8785): the card without signatures, keys sorted, no spaces
{"capabilities":{"extendedAgentCard":true,"streaming":true},…"version":"1.4.1"}

# 2. protected header, decoded
{"alg": "HS256", "typ": "JOSE", "kid": "deployer-key-1"}

# 3. JWS signing input: BASE64URL(header) '.' BASE64URL(payload)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpPU0UiLCJraWQiOiJkZXBsb3llci1rZXktMSJ9.eyJjYXBhYmlsaXRpZXMiOnsi…

# 4. the signature entry published in the card
{
  "protected": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpPU0UiLCJraWQiOiJkZXBsb3llci1rZXktMSJ9",
  "signature": "yPk834ji_dOVmxElhzV3yTYBT9NVp8Bx1j5K0LQmOww"
}

# 5. verify the published card: True
# 6. verify after changing the description to name production: False
```

kit 用 `HS256` 签名，[kit 的 README](manuals/a2a-101/capture/README.md) 列出了这一点。真实的 card 使用 `ES256` 或 `RS256` {{spec §8.4.2}}，因为 HMAC 的验证方持有签名密钥。

## 验证 card {#s-extended-cards-and-signatures-verifying-a-card}

验证有六个 MUST 步骤 {{spec §8.4.3}}。它们取出一个签名，根据 `kid` 和 `jku` 或从可信存储获取公钥，并对照重建的 payload 进行检查。

重建时要应用规则 1。签名和验证的步骤都说要删去具有默认值的属性 {{spec §8.4.2}} {{spec §8.4.3}}（[冲突 D21](#s-ref-sources)，以 [issue #2249](https://github.com/a2aproject/A2A/issues/2249) 的形式未解决）。

kit 的检查在发布的 card 上通过，在 description 写成 production 的副本上失败，因为规范化后的字节变了。[图](#fig-card-signature)展示了这两次检查。

```figure
id: fig-card-signature
kind: flow
title: signing and verifying the deployer card
claim: The signature covers the RFC 8785 bytes of the card without `signatures`, so an edit to the description changes those bytes and verification fails.
caption: Read the top half left to right and down, then the bottom half left to right. Steps 5 and 6 are the last two lines of the signed-card capture. Values are shortened to 8 characters.
```

客户端在信任一张 Agent Card 之前应至少验证一个签名 {{spec §8.4.3}}，并且绝不使用已过期或已吊销的密钥。像参考 SDK 那样给验证方一个明确的允许算法列表，以防止算法混淆攻击 {{sdk src/a2a/utils/signing.py}}。[安全要求](#s-security-requirements)一节讲解 card 伪造。

```takeaways
- 调用 `GetExtendedAgentCard` 时发送一个已声明的凭据，并在你的服务器上在它前面加一道认证检查。
- 用 `ES256` 或 `RS256` 和一个已发布的公钥，对不含 `signatures` 的 card 的 RFC 8785 字节签名。
- 在信任一张 card 之前，用明确的允许算法列表至少验证一个签名。
```

Sources: spec §1.4, §3.1.11, §3.3.4, §5.4, §8.4, §8.4.1, §8.4.2, §8.4.3, §13.3, §A.2.2 (research/sources/specification.md); proto AgentCard, AgentCapabilities, AgentCardSignature (research/sources/a2a.proto); docs/whats-new-v1.md at v1.0.1; sdk src/a2a/server/request_handlers/default_request_handler_v2.py, src/a2a/utils/signing.py; sdk-go a2asrv/handler.go at v2.6.0; sdk-java SECURITY.md, reference/jsonrpc/src/main/java/org/a2aproject/sdk/server/apps/quarkus/A2AServerRoutes.java at v1.4.0.Final; sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0; sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2; sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1; capture/README.md, capture/run.py; capture/out/01-agent-cards.http, 17-signed-card.txt, 18-extended-card.http
