# sbx template save 与 sbx template load

> 模板是沙箱运行时镜像存储中的一份快照，用 `--pull never -t TAG` 复用，导出为 tar，并在另一台主机上加载。

你在 `m101-demo` 里花了一小时安装工具链，明天第二个沙箱需要同样的工具，却不想再花那一小时。capture 在 `/opt/marker-from-demo` 留下一个标记文件，把该沙箱保存为 `m101-tpl:v1`，并从它创建 `m101-from-tpl`。读完本节后，你能保存模板、从它启动沙箱，并把它作为 tar 带到另一台主机。

## 模板保存什么 {#s-sbx-template-save-and-load-what-a-template-holds}

**模板：** 沙箱容器文件系统的已保存快照，存成镜像。用 `sbx run --pull never -t TAG AGENT [WORKSPACE]` 从它创建新沙箱 {{help-sbx sbx template}}。文档划清了镜像和 kit 的界限。模板保存镜像内容，智能体 kit 仍然提供运行时设置，例如凭据和网络规则 {{docs-sbx Saving a sandbox as a template}}。挂载的文件系统不在其中，因为已保存的模板不是整个沙箱的备份 {{docs-sbx Saving a sandbox as a template}}。

这排除了主机工作区和 `/var/lib/docker` 处的 Docker 存储。容器文件系统里的其他一切都在其中，包括智能体写到文件里的任何密钥。把凭据放在 [sbx secret](#s-sbx-secret-set-import-and-set-custom) 和代理里。像 `/home/agent/.claude/settings.json` 这样的智能体配置文件在每次创建沙箱时都会被重新写入 {{docs-sbx Limitations}}，所以那里的改动也不会保留。

每个内置智能体都从 `docker/sandbox-templates:<variant>` 启动，`m101-demo` 拉取了 `docker/sandbox-templates:shell-docker`。带 `-docker` 后缀的变体包含 Docker Engine，所以你可以在沙箱内构建并运行容器 {{docs-sbx Choose a template}}。这就是 `docker version` 在 `m101-demo` 内能回答的原因。设置了 `platform.images.useDHI` 时，默认模板 `docker/sandbox-templates:claude-code-docker` 变为 `dhi/sbx-templates:claude-code-docker` {{docs-sbx platform.images.useDHI}}，标签保持不变。

## sbx template save {#s-sbx-template-save-and-load-sbx-template-save}

`sbx template save SANDBOX TAG` 需要已停止的沙箱。capture 在正在运行的 `m101-demo` 上试了它，读到 `cannot save a running sandbox`，把它停掉，并保存为 `m101-tpl:v1`。镜像进入沙箱运行时的镜像存储 {{help-sbx sbx template save}}。该存储与主机上 Docker 守护进程的镜像存储是分开的 {{docs-sbx Load a template}}。2025 年插件的 `docker sandbox save` 默认把镜像加载进主机守护进程，`--output` 才是写到文件的方式，如 [冲突 C32](#s-ref-sources-and-the-conflicts-register) 所记录。

```listing
title: 一次被拒绝的保存、一次停止，以及一次保存
source: capture/out/07-template-save.txt
lang: text
note: 创建标记文件的 exec 已删节。capture 目录被遮盖为 $CAPTURE。
---
$ sbx template save m101-demo m101-tpl:v1 --output $CAPTURE/work/m101-tpl.tar
Sandbox m101-demo is running and must be stopped before saving. Stop it now? (y/N): error: cannot save a running sandbox; stop it first with:
  try: sbx stop m101-demo
[exit 1]

$ sbx stop m101-demo
Sandbox 'm101-demo' stopped; state preserved. Restart with: sbx run --name m101-demo
[exit 0]

$ sbx template save m101-demo m101-tpl:v1 --output $CAPTURE/work/m101-tpl.tar
Snapshotting image in sandbox ...
Exporting image to $CAPTURE/work/m101-tpl.tar ...
Exported to $CAPTURE/work/m101-tpl.tar

Save complete. To use the image as a template:
    sbx run --pull never -t docker.io/library/m101-tpl:v1 AGENT [WORKSPACE]
[exit 0]
```

`sbx template ls --json` 随后列出三个镜像：基础镜像 `docker.io/docker/sandbox-templates:shell-docker`、新的 `docker.io/library/m101-tpl:v1`（flavor 为 `shell`），以及 `docker.io/sandboxes-swap/m101-demo:bf19e491`。最后一个是运行时为已停止沙箱保留的镜像，每个沙箱都删除后它就没了。每条记录有 `id`、`repository`、`tag`、`flavor`、`created_at` 和 `size`，capture 遮盖了 id，所以本手册不陈述它的格式。

```listing
title: 镜像存储中的模板
source: capture/out/07-template-ls.json
lang: json
note: 删节为 m101-tpl:v1 的记录。
---
{
  "images": [
    …
    {
      "id": "<id>",
      "repository": "docker.io/library/m101-tpl",
      "tag": "v1",
      "flavor": "shell",
      "created_at": "<ts>",
      "size": "<n>"
    },
    …
  ]
}
```

## 用 --pull never -t 复用 {#s-sbx-template-save-and-load-reuse-with-pull-never-t}

复用方式是 `sbx run --pull never -t TAG AGENT [WORKSPACE]`，帮助文本解释了该标志：`--pull never` 使用已保存的镜像，不尝试 registry {{help-sbx sbx template save}}。capture 使用 `sbx create --pull never -t m101-tpl:v1 shell --name m101-from-tpl`，读到 `Checking image` 而不是 `Pulling image`，并在新沙箱内找到 `/opt/marker-from-demo`。指定该模板所针对的智能体。用 `codex` 运行 Claude 模板会打印警告，说沙箱可能无法正确工作 {{docs-sbx Limitations}}。

```listing
title: 从模板创建的沙箱，带有标记文件
source: capture/out/07-template-run.txt
lang: text
note: 两条命令之间的 sbx ls 已删节。
---
$ sbx create --pull never -t m101-tpl:v1 shell --name m101-from-tpl

sandbox    m101-from-tpl
agent      shell
workspace  none · no workspace bind mount
image      m101-tpl:v1
cpu        10
memory     32 GiB

Checking image
✓ Image ready
✓ Created sandbox m101-from-tpl
…
$ sbx exec m101-from-tpl sh -c 'ls -l /opt/marker-from-demo'
-rw-r--r-- 1 root root 0 <date> /opt/marker-from-demo
[exit 0]
```

`sbx template inspect` 在 v1 中只在云端可用，并且需要 `--cloud` {{help-sbx sbx template inspect}}。capture 中的本地尝试以 1 退出，并提示运行 `docker image inspect -- m101-tpl:v1`。那条命令读的是主机守护进程的存储，运行时并不共享它，所以本地模板用 `sbx template ls`。`sbx template rm m101-tpl:v1 --force` 打印 `Removed: m101-tpl:v1`，`sbx reset` 也会清掉缓存的镜像。

## 导出与加载 {#s-sbx-template-save-and-load-export-and-load}

save 上的 `--output FILE` 还会写出一个 tar。`work/m101-tpl.tar` 有 24 个条目，以 `blobs/sha256/` 开头，这是 OCI 镜像的布局。在另一台主机上，`sbx template load FILE` 把镜像从 tar 文件加载进沙箱运行时的镜像存储 {{help-sbx sbx template load}}，然后 `sbx run --pull never -t m101-tpl:v1 shell` 从它启动。capture 没有在第二台机器上加载该 tar，所以 [图](#fig-2-2) 按帮助文本绘制那一步。同一路径还可以导入你自己构建的镜像：`docker image save` 写出 tar，`sbx template load` 导入它。因此创建沙箱时不需要 registry 提供该镜像 {{docs-sbx Load a template}}。

```figure
id: fig-2-2
kind: flow
title: 从已停止的沙箱到模板、tar 和新沙箱
claim: 模板从已停止的沙箱进入运行时镜像存储，再以 tar 导出，并用 --pull never -t 进入新沙箱.
caption: 从左到右读，然后往下。实心青色箭头是写入存储或文件的持久写入。实心墨色箭头是 create 调用，虚线橄榄色箭头是你在 sbx 之外做的复制。实线步骤来自模板相关的 capture。在另一台主机上的 load 没有记录，按 sbx template load 的帮助文本绘制。
```

在云端，`sbx --cloud template load FILE NAME` 需要 `--cpus` 和 `--memory-mib`，二者合在一起指定一个计费规格 {{help-sbx sbx template load}}。规格从 micro（1 vCPU 和 2048 MiB）到 xl（16 vCPU 和 32768 MiB）。`--capture-mode all` 在磁盘 capture 上再加上内存和 microVM checkpoint。Tier C 未记录，所以本手册不展示云端清单，[sbx --cloud](#s-sbx-cloud-run-move-and-ttl) 改为引用帮助文本。

```takeaways
- 先停止沙箱，然后运行 `sbx template save SANDBOX TAG --output FILE`。
- 用 `--pull never -t TAG` 以及该模板所针对的智能体从模板启动。
- 把密钥放在 `sbx secret set` 里，因为模板会复制容器文件系统中的每个文件。
- 用 `sbx template load` 加载 tar，因为运行时存储与主机守护进程是分开的。
```

Sources: help-sbx sbx template, sbx template save, sbx template load, sbx template inspect, sbx template rm (research/sources/help-sbx.md); docs-sbx usage, Saving a sandbox as a template, Load a template, Template caching, Choose a template, platform.images.useDHI (research/sources/docs-sandboxes.md); conflict C32 (research/conflicts-register.md); capture/out/04-create.txt, 04-guest.txt, 07-template-save.txt, 07-template-ls.json, 07-template-ls.txt, 07-template-run.txt, 07-template-inspect.txt, 07-template-rm.txt, 07-template-tar-head.txt, 99-final-state.txt
