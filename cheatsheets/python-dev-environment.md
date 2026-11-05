---
id: python-dev-environment
title: Python Dev Environment for AI
code: PD
subtitle: 安装 uv，每个项目一个 venv，用 lockfile 钉住，检查路线，配置 VS Code，避开静默 Python 错误。
hue: 210
sources: phases/00-setup-and-tooling/01-dev-environment, phases/00-setup-and-tooling/06-python-environments, phases/00-setup-and-tooling/08-editor-setup, phases/00-setup-and-tooling/13-python-for-ai-engineering
source_hash: c1902990e64b40be
---

## 四层技术栈
type: architecture
from: phases/00-setup-and-tooling/01-dev-environment/docs/en.md

```arch
node | sys | 1,1 | 1. System Foundation | OS, shell, git, editor, GPU drivers | process
node | pkg | 2,1 | 2. Package Managers | uv, pnpm, cargo, juliaup | store
node | run | 3,1 | 3. Language Runtimes | Python 3.11+, Node 20+, Rust, Julia | process
node | lib | 4,1 | 4. AI/ML Libraries | PyTorch, JAX, transformers | model
edge | sys | pkg | install first
edge | pkg | run |
edge | run | lib |
```

## 安装工具链
type: command-table
from: phases/00-setup-and-tooling/01-dev-environment/docs/en.md
span: 2

| 命令 | 作用 |
|---|---|
| `xcode-select --install` | macOS 构建工具和 git |
| `sudo apt install -y build-essential git curl wget unzip` | Ubuntu 或 Debian 基础工具 |
| `wsl --install -d Ubuntu-24.04` | Windows：使用 WSL2 |
| `curl -LsSf https://astral.sh/uv/install.sh \| sh` | 安装 uv |
| `uv python install 3.12` | 安装 Python 3.12 |
| `fnm install 22` 然后 `fnm use 22` | TypeScript 课用的 Node.js 22 |
| `npm install -g pnpm` | 安装 pnpm |

## 创建环境
type: task-table
from: phases/00-setup-and-tooling/06-python-environments/docs/en.md
span: 2

| 任务 | 代码 |
|---|---|
| uv venv（推荐） | `uv venv` 然后 `source .venv/bin/activate` |
| 带 pyproject.toml 的新项目 | `uv init my-ai-project` 然后 `uv add torch numpy matplotlib` |
| 内置 venv | `python3 -m venv .venv` |
| 在 Windows 上激活 | `.venv\Scripts\activate` |
| Conda env | `conda create -n myproject python=3.12` 然后 `conda activate myproject` |
| 安装一个 extra 组 | `uv pip install -e ".[torch,llm]"` |
| 做一份 lockfile | `uv pip compile pyproject.toml -o requirements.lock` |
| 从 lockfile 安装 | `uv pip install -r requirements.lock` |

## 带 extras 的 pyproject.toml
type: annotated-code
lang: toml
from: phases/00-setup-and-tooling/06-python-environments/docs/en.md

```toml
[project]
name = "ai-engineering-from-scratch"
version = "0.1.0"
requires-python = ">=3.11"            # course minimum
dependencies = [
    "numpy>=1.26",
    "matplotlib>=3.8",
    "jupyter>=1.0",
    "scikit-learn>=1.4",
]
[project.optional-dependencies]
torch = ["torch>=2.3", "torchvision>=0.18"]   # uv pip install -e ".[torch]"
llm = ["anthropic>=0.39", "openai>=1.50"]     # uv pip install -e ".[llm]"
```

## 检查路线
type: command-table
from: phases/00-setup-and-tooling/01-dev-environment/docs/en.md, phases/00-setup-and-tooling/01-dev-environment/code/verify.py, phases/00-setup-and-tooling/06-python-environments/docs/en.md, phases/00-setup-and-tooling/06-python-environments/code/env_setup.sh

| 命令 | 作用 |
|---|---|
| `verify.py --route beginner` | 默认路线。需要 python 和 git |
| `--route ml-foundations` | 还需要 numpy |
| `--route agent-skills` | 需要 python、git、node 和 npx |
| `--route llm-engineering`、`agents`、`mcp`、`certification` | 需要 python 和 git |
| `--show-later` | 也检查可选和后续工具 |
| `[PASS]`、`[FAIL]`、`[LATER]` | 每项探测的状态。有 FAIL 时退出码 1 |
| `bash .../code/env_setup.sh` | 在仓库根目录做 `.venv` 并验证它 |

## 安装 PyTorch 并检查 GPU
type: annotated-code
lang: bash
from: phases/00-setup-and-tooling/01-dev-environment/docs/en.md, phases/00-setup-and-tooling/06-python-environments/docs/en.md

```bash
nvidia-smi                                    # driver CUDA version
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
uv pip install torch torchvision torchaudio   # macOS: plain build with MPS
python -c "import torch; print(torch.version.cuda)"   # PyTorch CUDA version
python -c "import torch; print(torch.__version__)"    # install worked
which python                                  # must show .venv/bin/python
```

## VS Code 设置
type: defaults
from: phases/00-setup-and-tooling/08-editor-setup/docs/en.md, phases/00-setup-and-tooling/08-editor-setup/code/vscode/settings.json

| 设置 | 默认值 | 说明 |
|---|---|---|
| `python.analysis.typeCheckingMode` | `"basic"` | 在运行前抓住错误的参数类型 |
| `editor.formatOnSave` | `true` | 每次保存都用 Black 格式化 |
| `black-formatter.args` | `["--line-length", "88"]` | Black 在 88 处换行 |
| `editor.rulers` | `[88, 120]` | 120 标出过长的 docstring |
| `notebook.output.scrolling` | `true` | 长训练输出保持较小 |
| `files.autoSave` | `"afterDelay"` | `files.autoSaveDelay` 是 1000 |
| `terminal.integrated.scrollback` | 10000 | 终端里保留的行数 |
| `ruff.lint.run` | `"onSave"` | 每次保存都用 Ruff 做 lint |

## 排障
type: troubleshooting
from: phases/00-setup-and-tooling/01-dev-environment/docs/en.md, phases/00-setup-and-tooling/06-python-environments/docs/en.md, phases/00-setup-and-tooling/08-editor-setup/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 运行时缺少 packages | venv 未激活 | `source .venv/bin/activate` |
| `which python` 显示 `/usr/bin/python` | 全局安装 | 先激活，再安装一次 |
| Conda env 坏了 | 把 `pip install` 混进 conda | 先 conda，pip 包放最后 |
| 没用上 GPU | PyTorch CUDA 高于驱动 CUDA | PyTorch CUDA 必须 <= 驱动 CUDA |
| 在 Mac 上装 Torch 失败 | `--index-url .../cuXXX` wheels | 安装普通构建 |
| `Not installing fnm due to missing dependencies.` | 没有 `unzip` | `sudo apt install -y unzip` |
| `Cannot install under Rosetta 2` | 终端以 `i386` 运行 | `arch -arm64 brew install fnm` |
| macOS 上找不到 `code` | Shell 命令不在 PATH 里 | "Install 'code' command in PATH" |

## 静默的 Python 错误
type: annotated-code
lang: python
from: phases/00-setup-and-tooling/13-python-for-ai-engineering/docs/en.md, phases/00-setup-and-tooling/13-python-for-ai-engineering/code/main.py

```python
independent = list(weights)                  # assignment does not copy
grid = [[0] * 3 for _ in range(2)]           # not [[0] * 3] * 2
def add_good(item, bucket=None): ...         # never bucket=[]
hidden: list[int] = field(default_factory=lambda: [64, 32])
random.Random(seed).shuffle(order)           # private generator
sum(x * y for x, y in zip(a, b, strict=True))  # ValueError on a length mismatch
for epoch in range(2):
    sizes = [len(b) for b in batches(range(10), 4)]  # new generator each epoch
raise ValueError(f"label must be an integer, got {text!r}") from None
if __name__ == "__main__":                   # tests import without the demo
```

## 问题
type: qa
from: phases/00-setup-and-tooling/06-python-environments/docs/en.md, phases/00-setup-and-tooling/13-python-for-ai-engineering/docs/en.md, phases/00-setup-and-tooling/01-dev-environment/docs/en.md

- **整门课共用一个 env？** 不要。各 phase 需要互相冲突的依赖。用按 phase 的策略。
- **什么时候用 conda？** 需要 CUDA toolkit 又不想系统安装时，或在共享集群上。
- **把 `.venv` 提交进去？** 不要。把 `.venv/` 加进 `.gitignore`。提交 `pyproject.toml` 和 lockfile。
- **Mac 上没有 CUDA？** 这是预期情况。MPS 是 Apple 的 GPU 后端。
- **为什么 `(3, 2)` 和 `(3,)` 会失败？** 末尾的 2 和 3 不同。用 `keepdims=True`。

## 提示
type: tips
from: phases/00-setup-and-tooling/01-dev-environment/docs/en.md, phases/00-setup-and-tooling/06-python-environments/docs/en.md, phases/00-setup-and-tooling/13-python-for-ai-engineering/docs/en.md

- 每条课文命令都从仓库根目录运行。
- 先修好第一条失败的预检行，再看下一条。
- 等某课需要时再装后续工具。
- 每次打开文件都给 `encoding="utf-8"`。用 `newline=""` 打开 CSV 文件。
- 在标准化之前拆分数据。只在训练集上拟合统计量。

## 编辑器与 SSH 命令
type: command-table
from: phases/00-setup-and-tooling/08-editor-setup/docs/en.md

| 命令 | 作用 |
|---|---|
| `code --install-extension <id>` | 按 ID 安装一个扩展 |
| `code --list-extensions` | 列出已安装扩展的 ID |
| `ssh-keygen -t ed25519 -C "<email>"` | 做一把 SSH 密钥 |
| `ssh-copy-id user@your-gpu-box-ip` | 免密登录 GPU 机器 |
| `Remote-SSH: Connect to Host` | 把远程文件夹当本地打开 |
| `watch -n 1 nvidia-smi` | 在分屏终端里看 GPU |
