# share push 与 share pull

> `share push` 把智能体文件存储为带 docker-agent 注解的 OCI artifact，用同一引用做 `share pull` 或 `run` 会从任意 registry 读回它。

同事向你要昨天用的智能体。聊天消息里的 YAML 文件没有版本，也没有可拉取的地址。registry 引用两者都有，但不能证明是谁发布的文件。Docker Agent 把智能体文件推送到 OCI registry，方式与 Docker 推送镜像相同。

读完本节后，你能推送一份智能体文件，读取它的 manifest，把它拉回来，并按引用运行它。

## 推送到 registry {#s-share-push-and-share-pull-push-to-a-registry}

**share push：** 把智能体配置文件推送到 OCI registry {{help-agent docker-agent share push}}。capture 把 `files.yaml`（一份带 `filesystem` 和 `shell` toolset 的智能体）推送到 `localhost:15000` 上的 `registry:2` 容器：

```listing
title: 一次推送到本地 registry
source: capture/out/24-share-push.txt
lang: text
---
$ docker-agent share push fixtures/agents/files.yaml localhost:15000/m101/agent:v1
Pushing agent $CAPTURE/fixtures/agents/files.yaml to localhost:15000/m101/agent:v1
Successfully pushed artifact to localhost:15000/m101/agent:v1
[exit 0]
```

该 registry 使用纯 HTTP，推送不需要 insecure-registry 设置（[这次 capture](manuals/docker-sandboxes-101/capture/README.md)）。随后它的 catalog 列出带 tag `v1` 的 `m101/agent`，以 `application/vnd.oci.image.manifest.v1+json` 提供（[这次 capture](manuals/docker-sandboxes-101/capture/out/24-registry.txt)）。

## manifest {#s-share-push-and-share-pull-the-manifest}

```listing
title: m101/agent:v1 的 manifest
source: capture/out/24-manifest.json
lang: json
---
{
  "annotations": {
    "io.docker.agent.version": "v1.149.0",
    "io.docker.cagent.version": "v1.149.0",
    "org.opencontainers.image.created": "<ts>",
    "org.opencontainers.image.description": "OCI artifact containing files.yaml"
  },
  "artifactType": "application/vnd.docker.agent.config.v1+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "size": "<n>",
    "digest": "sha256:<digest>"
  },
  "layers": [
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": "<n>",
      "digest": "sha256:<digest>"
    }
  ],
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "schemaVersion": 2
}
```

**artifactType：** OCI manifest 中标明 artifact 是什么的字段。这里它标记 Docker Agent 配置，而 config 和那一层仍使用 Docker 镜像媒体类型。`io.docker.agent.version` 记录推送该文件的发行版。`io.docker.cagent.version` 重复它，因为 v1.23.3 重命名了注解并保留旧注解以保持向后兼容 {{rel-agent v1.23.3}}。

智能体通过 `instruction_file` 读取的文件会进入 artifact。推送时，文件内容进入 artifact，所以已发布的智能体不需要别的东西 {{docs-agent Agent Configuration}}。[图](#fig-6-4) 展示推送、manifest 和两条回来的路。

```figure
id: fig-6-4
kind: structure
title: 作为 OCI artifact 的智能体文件
claim: 一次 share push 把 files.yaml 存为带四条注解的 OCI manifest，share pull 和 run 都按同一引用读回它.
caption: 先从左到右读顶行，再从上到下读 manifest 字段。紫色标出智能体文件和 docker-agent 写入的注解，灰色标出 registry 和 manifest 字段。虚线框是 --key 证明，这次 capture 没有录制它。 From capture/out/24-share-push.txt, 24-registry.txt, 24-manifest.json, 24-share-pull.txt, and 24-run-ref.txt.
```

## --key 与 --encrypt {#s-share-push-and-share-pull-key-and-encrypt}

capture 推送时没有 `--key`，所以它的 manifest 不带证明。该标志在 v1.132.0 加入 {{rel-agent v1.132.0}}，它接受内联密钥或 `file://` 路径 {{help-agent docker-agent share push}}。使用 `--key` 时，证明进入 manifest 注解，YAML 本身始终以明文推送 {{help-agent docker-agent share push}}。PEM 或 OpenSSH 密钥（Ed25519、ECDSA 或 RSA）记录签名。任何其他值都是至少 16 字节的对称密钥，记录 MAC {{help-agent docker-agent share push}}。

`--encrypt` 还会嵌入整份 YAML 的加密副本，Ed25519 密钥不能加密 {{help-agent docker-agent share push}}。自 v1.138.1 起，签名覆盖 DSSE 信封中的 in-toto statement，而不是原始 YAML 字节 {{rel-agent v1.138.1}}。帮助文本和这次 capture 都没有点名证明注解，所以本手册不打印它们。

在另一侧，`share pull --key` 检查签名或 MAC，或解密副本并比较。当 artifact 没有保护或检查未通过时，拉取失败 {{help-agent docker-agent share pull}}。两条命令都读取 `DOCKER_AGENT_ENCRYPT_KEY` 来代替该标志。

## 按引用拉取并运行 {#s-share-push-and-share-pull-pull-and-run-by-reference}

```listing
title: 拉取到当前目录
source: capture/out/24-share-pull.txt
lang: text
---
$ docker-agent share pull localhost:15000/m101/agent:v1 --force  (in work/)
Pulling agent localhost:15000/m101/agent:v1
Agent saved to localhost:15000_m101_agent:v1.yaml
[exit 0]
```

`share pull` 按引用给文件命名，把 `/` 换成 `_`，`--force` 覆盖先前的副本。拉下来的 YAML 与推送的 `files.yaml` 逐字节相同（[这次 capture](manuals/docker-sandboxes-101/capture/out/24-share-pull-agent.yaml)）。`run` 用引用代替路径，重放的运行从 registry 副本作答：

```listing
title: 直接从引用运行
source: capture/out/24-run-ref.txt
lang: text
note: 命令行在引用之后删节。
---
$ docker-agent run --exec --last --working-dir fixtures/repo --fake work/cassettes/18-files localhost:15000/m101/agent:v1 …
README.md has 1 line.
[exit 0]
```

引用也可以作为 `sub_agents` 条目。每次 `docker agent run` 都会对照 registry 检查 tag 引用 {{docs-agent Agent Distribution}}，所以把每一个锁定到 digest，`myorg/agent@sha256:…`，以便从缓存启动。`serve api --pull-interval N` 每 N 分钟再次拉取引用 {{help-agent docker-agent serve api}}。对于本地工作，`run` 也接受指向智能体文件的普通 `http://localhost` URL，完全不需要 registry {{docs-agent Agent Distribution}}。

私有仓库需要先 `docker login`。Docker Agent 只为 `docker.com` 下的 HTTPS URL 自行转发 Docker token，`docker.io` 不在其中 {{docs-agent Agent Distribution}}。所以私有 Hub 仓库需要 `docker login docker.io`。旧材料指向 Docker Hub 上的 `agentcatalog` 命名空间，v1.116.0 删除了对该命名空间的引用，因为它不再维护 {{rel-agent v1.116.0}}。

```takeaways
- 只要别人会运行该智能体，就用 `--key` 推送。
- 用匹配的 `--key` 拉取，这样未受保护的 artifact 会失败。
- 把 registry 子智能体锁定到 digest，以便可重复启动。
- 读取 `io.docker.agent.version` 以了解哪个发行版推送了 artifact。
```

Sources: help-agent docker-agent share push, share pull, serve api (research/sources/help-docker-agent.md); docs-agent Agent Configuration, Agent Distribution (research/sources/docs-docker-agent.md); rel-agent v1.23.3, v1.116.0, v1.132.0, v1.138.1 (research/sources/docker-agent-CHANGELOG.md); research/plan.md, Part 6; capture/README.md; capture/fixtures/agents/files.yaml; capture/out/24-share-push.txt, 24-registry.txt, 24-manifest.json, 24-share-pull.txt, 24-share-pull-agent.yaml, 24-run-ref.txt
