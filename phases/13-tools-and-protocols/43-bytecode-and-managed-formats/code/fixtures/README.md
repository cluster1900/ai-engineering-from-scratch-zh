# 第 43 课测试样本

这里的每个文件都由这台机器写入，或由其旁边的源码构建。`build_fixtures.sh` 保存准确命令，并写入 `versions.txt` 和 `sha256.txt`。没有下载任何文件。

| 文件夹 | 源码 | 构建输出 | 基准文本 |
|---|---|---|---|
| `python/` | `ledger.py`（与 `ledger.c` 相同的四个函数，外加一个 `LABELS` 元组） | `ledger.cpython-31N.pyc`（经过校验的哈希模式）和 `ledger.cpython-31N.timestamp.pyc`，N 为 1、2、3、4；由 `compile_pyc.py` 在各解释器下使用 `dfile="ledger.py"` 写入 | `python3.1N -m dis ledger.py` 生成的 `ledger.cpython-31N.dis.txt`，`python3.14 -m dis -C -O ledger.py` 生成的 `ledger.cpython-314.dis-caches.txt`，以及调用 200 次后由 `dis.dis(..., adaptive=True)` 生成的 `ledger.cpython-314.adaptive.txt` |
| `java/` | `Ledger.java` | `Ledger.class`（`javac`，JDK 21.0.12.1）、`Ledger-g.class`（`javac -g`）、`Ledger-gnone.class`（`javac -g:none`）、`Ledger-jdk25.class`（`javac`，JDK 25.0.2） | `javap -c -p` 生成的 `*.javap-c.txt` 和 `javap -v -p` 生成的 `*.javap-v.txt`，两者均使用 JDK 21 |
| `wasm/` | `ledger.wat`（从手工样本复制） | `ledger.wasm`（复制而来，与 `wat2wasm ledger.wat` 的输出逐字节相同），以及 `wat2wasm --debug-names` 生成的 `ledger-names.wasm` | `wasm2wat` 生成的 `*.wasm2wat.txt` 和 `wasm-objdump -h -x -d` 生成的 `*.objdump.txt`，两者均使用 wabt 1.0.42 |
| `dotnet/` | `Ledger.cs` 和 `LedgerNet.csproj` | `LedgerNet.dll`（`dotnet build -c Release`，SDK 8.0.205，net8.0，`DebugType` 为 none） | `MetaDump/Program.cs` 生成的 `LedgerNet.metadump.txt`；该程序是基于 System.Reflection.Metadata 的读取器，会输出表、方法、IL 字节及 `System.Reflection.Emit.OpCodes` 表 |
| `native/` | `ledger.c` | 从第 33 课复制的 `ledger-x86_64-O0.o`（`clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c`） | `ledger-x86_64-O0.objdump.txt`，即第 33 课保存的 `llvm-objdump -d` 输出 |

`java/Ledger-g.r2.txt`、`wasm/ledger.r2.txt` 和 `dotnet/LedgerNet.r2.txt` 保存从源码构建的 radare2 6.2.4 的 `rabin2 -I` 与 `radare2 -qc` 输出。只有当 `rabin2` 和 `radare2` 位于 `PATH` 中时，构建脚本才会写入这些文件。

`versions.txt` 记录的解释器和工具版本为：Python 3.11.14、3.12.12、3.13.12、3.14.6；javac 21.0.12.1 和 25.0.2；wabt 1.0.42；.NET SDK 8.0.205。构建样本时未安装 Python 3.15，因此 `main.py` 中的 3.15 魔数来自 CPython 源码，而不是这里的文件。

时间戳 pyc 文件保存构建时 `ledger.py` 的 mtime，即 1791975565，以及文件大小 497。新检出的源码具有新的 mtime，因此导入时会重新编译。经过校验的哈希文件不依赖 mtime。
