# `# syntax=docker/sandbox-kit:3` 与 kit.yaml

> v3 kit 是普通的 OCI 镜像，其 manifest 注解携带一份严格的 YAML 描述符，sbx 在创建沙箱时解析它。

你的团队希望每个 Codex 沙箱都带上同样的三件工具、同样的两个允许主机，以及同样的说明。kit 在一个文件里声明工具、主机和凭据，该文件作为镜像传播。

读完本节后，你能逐行读懂一份 v3 描述符，并说出前端写入镜像的内容。你也能分清哪些命令构建、检查和运行它。

## 一份镜像，一条注解 {#s-syntax-docker-sandbox-kit-3-and-kit-yaml-one-image-one-annotation}

**Kit：** 一份 OCI 镜像，其 manifest 注解 `vnd.docker.sandbox.kit.descriptor` 携带 kit 的声明，而其层携带内容 {{kitspec §1}}。现成工具可以拉取 kit、检查它，并在 `FROM` 中使用它。不读该注解的引擎把它当普通镜像运行 {{kitspec §1}}。

**Workload：** 一种 kit，其层是根文件系统，其镜像 config 携带启动命令。一份组合恰好有一个 {{kitspec §1}}。

**Mixin：** 一种 kit，其层是叠加在 workload 文件系统上的 overlay，每份组合零个或多个 {{kitspec §1}}。第三种 `kind` 是 `set`，只在你编写 kit 时存在。发布时，它从所列出的 kit 变成 `workload` 或 `mixin` {{kitspec §4}}。

## 描述符，逐行看 {#s-syntax-docker-sandbox-kit-3-and-kit-yaml-the-descriptor-line-by-line}

capture kit 写了一份 v3 描述符，一个带内联 recipe 和单一网络授权的 shell workload：

```listing
title: capture kit 写出的 v3 描述符
source: capture/fixtures/kits/hello-kit/kit.yaml
lang: yaml
---
# syntax=docker/sandbox-kit:3
schemaVersion: "3"
kind: workload
displayName: hello-kit
description: A shell workload with one network grant, in the v3 descriptor form.
version: "1.0.0"
licenses: [Apache-2.0]
build: |
  FROM docker/sandbox-templates:shell
  COPY HELLO.md /home/agent/HELLO.md
capabilities:
  - type: com.docker.sandbox/network-policy@2
    config:
      runtime:
        allow:
          - example.com
```

描述符的第一行 `# syntax=docker/sandbox-kit:3` 选择前端 {{kitspec §1.1}}。`schemaVersion` 必须恰好是字符串 `"3"`，`kind` 为 `workload`、`mixin` 或 `set` {{kitspec §4}}。`displayName`、`description`、`version` 和 `licenses` 是可选的展示元数据。没有 `name` 字段，因为身份就是消费 kit 时用的引用 {{kitspec §1}}。

`build:` 字段存放普通的 Dockerfile 文本 {{kitspec §3.2}}。`capabilities` 是带 `type` 和 `config` 的条目列表 {{kitspec §7}}。这里一条 `network-policy@2` 条目在 `runtime` 阶段允许 `example.com`，这是智能体的稳态 {{kitcap network-policy@2}}。

解码是严格的：解析器不认识的字段在文档任何位置都是错误 {{kitspec §1.2}}。原因是策略。拼错的键若被解析器忽略，就会变成一条缺失却没有警告的策略 {{kitspec §1.2}}。[图](#fig-4-1) 把该文件放在构建推送出的 manifest 旁边。

```figure
id: fig-4-1
kind: structure
title: v3 描述符与承载它的镜像 manifest
claim: 前端把 hello-kit 描述符复制到一条 manifest 注解中，从其字段派生另外六条注解，并在 built-by 中记录自己的发行版本.
caption: 从左到右读。左列是 hello kit 的 kit.yaml，每条注释说明该行变成什么。右列是本地 registry 返回的 index 和 arm64 manifest，来自 index 和 manifest 的 capture。青色线是前端的写入。
```

## 前端发布什么 {#s-syntax-docker-sandbox-kit-3-and-kit-yaml-what-the-frontend-publishes}

`docker buildx build ./my-kit -f ./my-kit/my-kit.yaml -t docker.io/<NAMESPACE>/my-kit:1.0.0 --push` 构建并发布 kit {{docs-sbx Publish an image}}。capture kit 用 `docker-container` builder 对着本地 registry 运行了它（`28-builder.txt`、`28-buildx.txt`），registry 返回了这份 manifest：

```listing
title: hello-kit manifest 的注解
source: capture/out/28-manifest.json
lang: json
note: config、layers 和描述符的大部分已删节。registry 把描述符存成一个 JSON 字符串，capture kit 解码它并保留 402 条 provides 条目中的五条。
---
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
…
  "annotations": {
    "org.opencontainers.image.description": "A shell workload with one network grant, in the v3 descriptor form.",
    "org.opencontainers.image.licenses": "Apache-2.0",
    "org.opencontainers.image.title": "hello-kit",
    "org.opencontainers.image.version": "1.0.0",
    "vnd.docker.sandbox.kit.built-by": "{\"name\":\"docker/sandbox-kit\",\"version\":\"3.0.0-m.8\",\"revision\":\"129be2ff45e8f9463450eb3cf04ddcb52c2b76e5\"}",
    "vnd.docker.sandbox.kit.capabilities": "com.docker.sandbox/network-policy@2",
    "vnd.docker.sandbox.kit.descriptor": {
      "schemaVersion": "3",
…
      "provides": [
        "deb/adduser@3.153",
…
        "... 397 more derived provides entries"
      ],
…
    "vnd.docker.sandbox.kit.schema-version": "3"
```

描述符注解把已发布的描述符存成紧凑 JSON {{kitspec §9.3}}，并保留 `build:` 文本。对 workload，前端还读取软件包数据库，为每个已安装软件包添加一条 `deb/` 条目 {{kitspec §9.6}}。`schema-version` 和 `capabilities` 重复两个字段，`org.opencontainers.image.*` 键复制展示字段 {{kitspec §9.3}}。构建把源放在 `/usr/share/sandbox/kit/kit`，取自 `kit.yaml` 的词干 {{kitspec §10}}。

## 哪些命令接受 v3 kit {#s-syntax-docker-sandbox-kit-3-and-kit-yaml-which-commands-accept-a-v3-kit}

冲突 [C13](#s-ref-sources-and-the-conflicts-register) 问每个命令接受哪一代，capture 给出了裁定：

```listing
title: v2 工具拒绝 v3 目录
source: capture/out/13-kit-v3-validate.txt
lang: text
---
$ sbx kit validate ./fixtures/kits/hello-kit
error: kit ./fixtures/kits/hello-kit is a v3 source kit and this load path has no kit builder configured; artifact validation failed
[exit 1]
```

```listing
title: inspect 用主机 Docker 守护进程构建 v3 源
source: capture/out/13-kit-v3-inspect.txt
lang: text
note: 错误末尾的文档链接已删节。28-kit-inspect-source.txt 重复了同一错误。
---
$ sbx kit inspect ./fixtures/kits/hello-kit --json
   → build kit ./fixtures/kits/hello-kit (sbx-kit-src:kit-<id>)
error: build kit ./fixtures/kits/hello-kit: exit status 1 ERROR: failed to build: OCI exporter is not supported for the docker driver. Switch to a different driver, or turn on the containerd image store, and try again. …
[exit 1]
```

裁定：`sbx kit validate`、`pack`、`push` 和 `pull` 是 v1 和 v2 工具。`pack` 也拒绝了该目录，因为缺少 `spec.yaml`（`13-kit-v3-pack.txt`）。文档同意：v3 kit 用 Buildx，因为 `sbx kit pack`、`push` 和 `pull` 用于 v1 和 v2 kit {{docs-sbx Publish an image}}。

v3 kit 由 `sbx run` 和 `--kit` 消费，因为 `sbx run` 和 `sbx create` 在智能体名称的位置接受 kit 引用 {{rel-sbx v0.42.0}}。推送出的 hello-kit 仍然从未进入沙箱，因为 `kit.allowedSources` 默认为 `["docker.io/"]`（[C40](#s-ref-sources-and-the-conflicts-register)，`02-settings.txt`） {{rel-sbx v0.34.0}}：

```listing
title: sbx 拒绝来自 docker.io 之外的 kit
source: capture/out/28-run-kit.txt
lang: text
note: allowlist 值之后的建议和第二条建议已删节。28-kit-inspect.txt 显示 sbx kit inspect 遇到同样的拒绝。
---
$ sbx create localhost:15000/m101/hello-kit:v1 fixtures/repo-kit --name m101-v3
error: resolve kits: kit "localhost:15000/m101/hello-kit:v1": kit "localhost:15000/m101/hello-kit:v1" cannot be installed — its source is not in your allowlist; current kit.allowedSources: docker.io/; …
  try: sbx settings set kit.allowedSources '["docker.io/","localhost:15000/m101/"]'
…
[exit 1]
```

capture kit 从不改 `sbx settings`，所以没有 capture 显示 sbx 运行 v3 kit。两条规则限制混用。沙箱不能把 v3 kit 与 v1 或 v2 kit 组合 {{docs-sbx Version compatibility}}。内置智能体名称，例如 `claude` 和 `codex`，选择 v2 kit {{docs-sbx Version compatibility}}。Docker 把它的 v3 workload 发布为 `docker/sbx-kit-*`，例如 `docker.io/docker/sbx-kit-codex:0.155.1` {{docs-sbx Run a kit}}。

## 运行与页面不一致之处 {#s-syntax-docker-sandbox-kit-3-and-kit-yaml-where-the-run-and-the-pages-disagree}

这次运行的五个结果与规范或文档矛盾，登记表的 [C113 到 C117](#s-ref-sources-and-the-conflicts-register) 行覆盖了它们。下表打印双方：

| 页面的说法 | capture 显示的 | 文件 |
|---|---|---|
| `docker buildx build -f kit.yaml --push` 会发布该 kit {{docs-sbx Publish an image}} | Desktop 4.94.0 的默认 `docker` 驱动推送了没有注解的 Docker schema 2 manifest | `28-buildx-docker-driver.txt`, `28-manifest-docker-driver.json` |
| 只要导出产生了 image index，前端就把全部四条复制到其上 {{kitspec §9.3}} | index 有一份 attestation manifest 且没有注解，arm64 manifest 带着全部八条 | `28-index.json`, `28-manifest.json` |
| 浮动的 `docker/sandbox-kit:3` 从不为 milestone 移动（规范的 README） | `:3` 解析到 2026-10-02 的 milestone `3.0.0-m.8` | `28-buildx.txt` |
| 开发期间，`sbx` 改为接受本地源目录 {{docs-sbx Publish an image}} | 对该目录的 `sbx kit inspect` 失败：「OCI exporter is not supported for the `docker` driver」 | `13-kit-v3-inspect.txt`, `28-kit-inspect-source.txt` |
| 源形式的构建在名为 `sbx-kit-builder` 的共享 builder 沙箱中运行 {{help-sbx sbx kit builder}} | 那次构建跑在主机 Docker 守护进程里，之后记录的 builder 状态读作 "not created" | `13-kit-v3-inspect.txt`, `13-kit-builder-status.txt` |

没有描述符注解的镜像对任何消费者都不是 kit {{kitspec §10}}，所以用 `docker-container` builder 构建。在 index 上找不到注解的消费者读取平台 manifest {{kitspec §9.3}}。规范自称是实验性的，正式版本目标是 Q4 2026。

kit volume 的默认大小仍有争议（[C12](#s-ref-sources-and-the-conflicts-register)）。v0.39.0 说明写的是 512 MB {{rel-sbx v0.39.0}}，研究笔记写的是 20 GiB，本手册两者都印。`kit-tck validate` 评判已发布的制品，`kit-tck inspect` 把它读回来，本手册两者都没跑。[第 7.4 节](#s-kit-tck-diagnose-and-the-claims-this-manual-checked) 列出了它核对过的论断。

```takeaways
- 每份 v3 描述符都以 syntax 行和 `schemaVersion: "3"` 开头，并把 capabilities 写成列表。
- 用 `docker-container` builder 构建 v3 kit，因为默认 `docker` 驱动会丢掉注解。
- 在运行来自 Docker Hub 之外的 kit 之前，把 registry 前缀加进 `kit.allowedSources`。
- 用引用来运行 v3 workload，用 `--kit` 添加 v3 mixin，不要混用各代。
```

Sources: kitspec §1, §1.1, §1.2, §3.2, §4, §7, §9.3, §9.6, §10 (research/sources/SPEC-v3-at-v3.0.0-m.8.md); kitcap network-policy@2 (research/sources/kit-capabilities.md); research/sources/kit-spec-extras.md (README and RELEASES.md of docker/sandbox-kit-spec, for the frontend tag and the milestone dates); docs-sbx Kits, Use kits, Build and distribute kits (research/sources/docs-sandboxes.md); help-sbx sbx kit builder (research/sources/help-sbx.md); rel-sbx v0.34.0, v0.39.0, v0.42.0 (research/sources/sbx-releases.md); research/conflicts-register.md rows C12, C13, C40, and C113 to C117; capture/README.md (the findings of K28); capture/fixtures/kits/hello-kit/kit.yaml; capture/out/02-settings.txt, 13-kit-v3-validate.txt, 13-kit-v3-pack.txt, 13-kit-v3-inspect.txt, 13-kit-builder-status.txt, 28-builder.txt, 28-buildx.txt, 28-buildx-docker-driver.txt, 28-manifest.json, 28-manifest-docker-driver.json, 28-index.json, 28-kit-inspect-source.txt, 28-kit-inspect.txt, 28-run-kit.txt
