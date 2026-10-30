# Evidence: cheatsheets/python-dev-environment.md

Abbreviations: P0 = phases/00-setup-and-tooling. D1 = P0/01-dev-environment/docs/en.md, V = P0/01-dev-environment/code/verify.py, D6 = P0/06-python-environments/docs/en.md, E = P0/06-python-environments/code/env_setup.sh, D8 = P0/08-editor-setup/docs/en.md, S = P0/08-editor-setup/code/vscode/settings.json, D13 = P0/13-python-for-ai-engineering/docs/en.md.

## 四层技术栈 (architecture, 4 nodes, 3 edges)
- 1. System Foundation: OS, shell, git, editor, GPU drivers: D1:31
- 2. Package Managers: uv, pnpm, cargo, juliaup: D1:30
- 3. Language Runtimes: Python 3.11+, Node 20+, Rust, Julia: D1:29
- 4. AI/ML Libraries: PyTorch, JAX, transformers: D1:29
- Edges: install bottom-up, each layer depends on the one below: D1:34

## 安装工具链 (command-table, 7)
- `xcode-select --install`: D1:47-48
- apt install build-essential git curl wget unzip: D1:51-52
- `wsl --install -d Ubuntu-24.04`, use WSL2: D1:54-55
- uv install script: D1:63
- `uv python install 3.12`: D1:65
- `fnm install 22`, `fnm use 22`, TypeScript lessons: D1:87, 91-92
- `npm install -g pnpm`: D1:94

## 创建环境 (task-table, 8)
- uv venv recommended, `source .venv/bin/activate`: D6:55, 65-66
- `uv init my-ai-project`, `uv add torch numpy matplotlib`: D6:75-80
- `python3 -m venv .venv`: D6:88
- `.venv\Scripts\activate` on Windows: D6:90
- `conda create -n myproject python=3.12`, `conda activate myproject`: D6:110-111
- `uv pip install -e ".[torch,llm]"`: D6:166
- `uv pip compile pyproject.toml -o requirements.lock`: D6:178
- `uv pip install -r requirements.lock`: D6:179

## 带 extras 的 pyproject.toml (annotated-code, 13 lines)
- [project] name, version, requires-python ">=3.11", dependencies: D6:145-154
- optional torch and llm groups: D6:156-158
- install commands for each extra in comments: D6:164-165

## 检查路线 (command-table, 7)
- `--route beginner` default, required python and git: V:172-175, 227-230
- ml-foundations requires numpy: V:178-180
- agent-skills requires python, git, node, npx: V:202-204
- llm-engineering, agents, mcp, certification require python and git: V:184-186, 190-192, 196-198, 212-214
- `--show-later` checks optional and later tools: V:232-236, D1:180
- PASS, FAIL, LATER status and return 1 when not ready: V:243-248, 290-291
- env_setup.sh makes `.venv` at the repo root and verifies it: D6:251-254, E:6, 18-19

## 安装 PyTorch 并检查 GPU (annotated-code, 6 lines)
- `nvidia-smi` shows driver CUDA version: D6:239
- cu124 install line: D1:138
- macOS plain build with MPS: D1:141-144
- `torch.version.cuda` shows PyTorch CUDA version: D6:240
- `torch.__version__` means the install worked: D1:218
- `which python` must show .venv/bin/python: D6:198

## VS Code 设置 (defaults, 8)
- typeCheckingMode "basic", catches wrong argument types: S:2, D8:101
- formatOnSave true, Black: S:9, D8:102
- black-formatter.args line-length 88, Black wraps at 88: S:15, D8:103
- rulers [88, 120], 120 marks long docstrings: S:19, D8:103
- notebook.output.scrolling true: S:40, D8:104
- files.autoSave "afterDelay", files.autoSaveDelay 1000: S:27-28
- terminal.integrated.scrollback 10000: S:44
- ruff.lint.run "onSave": S:17

## 排障 (troubleshooting, 8)
- Forgot to activate, packages missing: D6:214-219
- Global install, `which python` shows /usr/bin/python: D6:186-199
- pip mixed into conda, conda first then pip last: D6:116, 202-212
- CUDA mismatch, PyTorch CUDA must be <= driver CUDA: D6:236-243
- `--index-url .../cuXXX` fails on a Mac, install the plain build: D1:141
- fnm missing unzip message, `sudo apt install -y unzip`: D1:99
- Rosetta 2 error, `arch` prints i386, `arch -arm64 brew install fnm`: D1:101-104
- `code` not found on macOS, Install 'code' command in PATH: D8:51

## 静默的 Python 错误 (annotated-code, 10 lines)
- `independent = list(weights)`, assignment does not copy: D13:112, 55
- comprehension grid vs `[[0] * 3] * 2`: D13:116-122, 132
- `bucket=None` default, not `bucket=[]`: D13:250-259, 273
- `field(default_factory=lambda: [64, 32])`: D13:293, 316
- `random.Random(seed).shuffle(order)` private generator: D13:694, 715
- `zip(a, b, strict=True)` raises ValueError on a length mismatch: D13:768, 810
- new `batches()` call for each epoch: D13:744-746, 759
- `raise ValueError(...) from None`: D13:448, 467
- main guard lets tests import main.py: D13:495, 507

## 问题 (qa, 5)
- One env for the course: no, per-phase strategy: D6:118-122
- When conda: CUDA toolkit without system install, shared cluster: D6:99-103
- Do not commit .venv, add to .gitignore, commit pyproject.toml and lockfile: D6:228-234
- No CUDA on a Mac is expected, MPS backend: D1:141
- (3, 2) with (3,) fails, trailing 2 and 3, keepdims=True: D13:1008-1010

## 提示 (tips, 5)
- Run every command from the repository root: D1:161
- Fix the first failed line first: D1:216
- Install later tools when a lesson asks: D1:193
- encoding="utf-8" and newline="" for CSV: D13:511, 555
- Split before standardization, fit on train only: D13:717, 814

## 编辑器与 SSH 命令 (command-table, 6)
- `code --install-extension <id>`: D8:58, 201
- `code --list-extensions`: D8:201
- `ssh-keygen -t ed25519 -C ...`: D8:146
- `ssh-copy-id user@your-gpu-box-ip`: D8:147
- Remote-SSH: Connect to Host: D8:134, 139
- `watch -n 1 nvidia-smi` in a split terminal: D8:130
