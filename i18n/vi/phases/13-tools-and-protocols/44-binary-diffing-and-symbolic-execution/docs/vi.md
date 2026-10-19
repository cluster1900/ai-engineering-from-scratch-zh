# 2Dự khác biệt hệ thống so sánh với biểu tượng thực hiện: hàm phù hợp và tìm kiếm giải pháp nhập

> Sự phù hợp của hai hàm, là kết luận được đưa ra bằng một số chữ ký; tìm kiếm giải thích đầu vào, là một mô hình của điều kiện đường dẫn nào đó.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、34（提升为伪代码）、36（重建并证明等价）
**Time:** ~150 分钟

## Học mục tiêu

- Từ mục tiêu tài liệu và đơn đặt mục xây dựng 5 hàm chữ ký: xác định chữ cái, ngăn chặn định vị lại chữ cái sau chữ cái, hỗ trợ chuỗi chữ cái, kiểm soát dòng hình dạng và tên mã.
- 运行 BinDiff 风格的分阶段贪心匹配器, chỉ có chữ ký ở hai bên đều duy nhất khi phù hợp,并 ghi lại từng giai đoạn và chất lượng sau mỗi匹配.
- 复现两个字节完全相同的函数在加载映像上无法通过字节关联器、屏蔽后却能通过情况,并使用重定位算术解释四个变化字节──
- Theo tỷ lệ tương tự của Levenshtein từ xa xả radiff2, không giải thích tại sao một tỷ lệ trong số đó chỉ xuất hiện khi so sánh radar2 với 82 字节 thực tế.
- Trong các IR nhỏ trên các đường dẫn hàm, mang theo điều kiện cho mỗi đường dẫn, và sử dụng các search có giới hạn cho mỗi các mục nhập.
- 测量 có biểu tượng bành trướng trong vòng lặp bùng nổ,并将 số, loại và mô hình với angr 10.0.3、z3 5.1.0 so sánh.

## 问题

Anh là`-O2`Được xây dựng lại.`ledger.c`, đại lý thẩm vấn 相比 `-O1` cấu trúc có thay đổi hay không.`grade`Được sửa đổi, vì nó khác nhau trong hai phần tử trong hai phần mềm tải sau đó.`grade`46 字节 hoàn toàn giống nhau.`-O2`程序 của `.rodata`后移了 0x70 字节, vì vậy `grade`Một vị trí chuyển đổi tăng lên 0x70:

Cùng ngày chiều, anh hỏi số lượng nào sẽ làm `grade`Trả lại 4―agent  đọc mã giả sau trả lời 90──đây chỉ là một câu trả lời── hàm đối với mỗi phân tử từ 90 đến 109 đều trả lại 4, và vấn đề không có giới hạn giới hạn, vì vậy bạn cần tập hợp, đại lý chỉ cho một mẫu──

Hai loại thất bại xuất phát từ một lỗ hổng: kết quả kết luận về sự phù hợp và tìm kiếm giải pháp là sau đó có phương pháp hỗ trợ.

```figure
re-44-matches-and-paths
```

## 函数签名是带质量的结论

Flake năm 2004 mô tả mô tả các hệ thống phân biệt là: xây dựng và cấu trúc giữa hai tập hợp hàm của hai tập tin có thể thực hiện tương tự. Dullien và Rolles năm 2005 sẽ mở rộng nó thành các khối cơ bản và chỉ thị. Trang khái niệm BinDiff mô tả chiến lược phát triển từ đó: tính toán hai bên một thuộc tính của mỗi hàm; nếu một giá trị nào đó xuất hiện một lần trên mỗi bên, thì cấu tạo phù hợp; xuất hiện nhiều lần có giá trị khác biệt, cần phải phân biệt các thuộc tính bên dưới trong loại giá cả tương tự; không có giá trị của các mục duy trì không phù hợp. Sau mỗi vòng, người dùng và người được gọi tạo ra một tập hợp nhỏ, thuộc tính bên dưới có thể là duy nhất trong số đó, sau đó sử dụng các thuộc tính tiếp tục.

Mỗi thuật toán so sánh có chất lượng. Trang này sẽ đánh giá rất tốt các hàm số gốc của các hàm số. Hình MD chỉ số và chữ ký kết phù hợp. Mỗi ghi chú phù hợp với một số nhỏ, lấy số lượng của toàn bộ hàm.

Bài này giữ lại năm thuộc tính trong số đó, cũng như một quy tắc quan trọng nhất: hai bên đều duy nhất, nếu không không phù hợp.

## Từ một hàm ghi lại có được 5 chữ ký

差异比较器为每个目标文件读取两类信息──ELF 提供字节、符号大小和 `.rela.*`记录;`llvm-objdump -d`清单提供指令边界和助记符, 第33 课已证明解码器 phù hợp với清单 trên mỗi lệnh trong các tài liệu mục tiêu này.`function_record()`检查每条清单指令的字节是否等于目标文件对应地址的字节,否则抛出异常――过期清单意味着样例发生变化――

以 `ledger-x86_64-O1.o`Trung `grade`Ví dụ: các biểu tượng cho phép chuyển động 0x10、大小 46, do đó ghi lại bao gồm 0x10 đến 0x3e, không bao gồm hai chữ cái của hàm xơ xơ`nop`

精确字节签名是这46字节的 SHA-256──屏蔽字节签名先将每个重定位字段置零──这里只有一个字段:偏移 0x36 处的记录`R_X86_64_PC32 .rodata+0x10`,宽四字节,是0x33 处 `leaq (%rip), %rcx`Trong các tập tin mục tiêu RELA, bốn chữ cái này là 0, vì vậy ở đây hai chữ cái của mỗi hàm của mỗi tập tin mục tiêu đều phù hợp.

助记符签名对以下 14 助记符的序列取哈希:

```text
movslq imulq movq sarq shrq addl addl xorl cmpl ja movl leaq movl retq
```

Các chữ ký hình dạng từ các khối cơ bản và loại hình bên trong của bài học 33 và chỉ chứa các khối nhập khẩu có thể tiếp cận.`-O1`下的 `grade`Có ba khối, ba bên.`ja 0x3d`Kết thúc, có một条 nhảy vọt边和一条顺序落下边;块 0x31 顺序进入 0x3d;0x3d 返回──度序列按排序后的顺序列出各块的(入入,出), do đó ký tên là`3b 3e [0/2,1/1,2/0]` đối với `-O0`下的 `grade`, ghi lại như bài học thứ 33, thông qua năm `.rela.rodata`条目解析间接跳转, nhận được tám khối,10条边, trong đó bốn条 là `table`边♪

名称签名就是符号名称. Có, nó là sự thật mạnh mẽ nhất.

Có một đoạn văn được sử dụng trong trường hợp sửa chữa sau đây.`.rodata`của `lea`重定位、边界检查和索引加载时,`referenced_table()`按第 36 课的方式读取表:`ja`前的 `cmpl $0x4`Chỉ là 5 điều, tải `movl (%rcx,%rax,4), %eax`biểu hiện mỗi 4 chữ cái`-O1`下 `grade`của `.rodata+0x14`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `1, 2, 3, 4, 4`

## 贪心匹配器

`match_functions()`按顺序运行各阶段──每个阶段按该阶段签名分别对两侧未相匹配的函数分组,接受所有在每侧恰恰有一个函数的值──相匹配记录阶段、阶段质量、其他同样一致的签名,以及相似度比例──

```python
for stage in order:
    for signature, candidates in left_groups.items():
        partners = right_groups.get(signature, [])
        if len(candidates) != 1 or len(partners) != 1:
            continue
        a, b = candidates[0], partners[0]
        agreeing = [s.id for s in STAGES if a.signatures()[s.id] == b.signatures()[s.id]]
        matches.append(Match(a, b, stage, agreeing, radare2_ratio(a.raw, b.raw), data_equal))
```

Các thứ tự của bài học này trước tiên được vận hành theo bốn giai đoạn cấu trúc, cuối cùng chỉ được sử dụng tên gọi, để các giai đoạn cấu trúc được kiểm tra, sau đó được sử dụng tên gọi để đánh giá.`-O1`Với`-O2`So sánh như sau:

| 函数 | 阶段 | 一致的签名 | 相似度 |
|---|---|---|---|
| `percent_change` | 精确字节 | 全部五种 | 1.000 |
| `grade` | 精确字节 | 全部五种 | 1.000 |
| `total` | 名称 | 仅名称 | 0.171 |
| `grade_label` | 精确字节 | 全部五种 | 1.000 |

`total`Từ 31 字节、13 条 chỉ thị tăng lên 140 字节、41 条 chỉ thị, vì clang sử dụng SSE2 hướng chu kỳ định lượng hóa, và giữ lại chu kỳ số lượng dư lượng quy mô.

Đối với`-O0`Với`-O1`, cùng một thứ tự tạo ra một sự phù hợp sai lầm:

| -O0 函数 | 匹配的 -O1 函数 | 阶段 | 名称一致 |
|---|---|---|---|
| `percent_change` | `grade_label` | 流图形状 | 否 |
| `grade` | `grade` | 名称 | 是 |
| `total` | `total` | 名称 | 是 |
| `grade_label` | 未匹配 | | |

`-O0`下的 `percent_change`                                                                                                                                                                                                                                                              `before == 0`, hai cánh tay, tái汇合回归──其度序列为 `0/2, 1/1, 1/1, 2/0``-O1`下的 `grade_label`Nên vào`grade`, trong biên giới kiểm tra xung quanh có hình dạng giống nhau.`grade_label`, dẫn đến thực sự`percent_change`和 `grade_label`配对保持未匹配──

存在真名时,BinDiff 顺序将名称匹配放在第二阶段,代码中 `BINDIFF_ORDER`Cũng vậy. Sử dụng thứ tự này, tất cả bốn.`-O0`函数都按名称匹配到其`-O1`版本, đây cũng là kết quả của Ghidra.`if`和 `else`hình dạng của nó.

## 相同字节, số hoạt động sau khi định vị

Ghidra 导入目标文件时应用重定位, do đó các字节关联器比较加载后的影像,第36 课也正因如此屏蔽重定位字段──`load_image()`复现导入过程: theo từng phần trong từng phần đã được phân phối, theo từng phần`sh_addralign`Đối với nhau, từ 0x100000  bắt đầu trang bị; sau đó áp dụng mỗi kỷ lục:`R_X86_64_PC32`和 `R_X86_64_PLT32`sẽ`S + A - P`写为有符号 32 位值,`R_X86_64_64`sẽ`S + A`写为 64 位值──

Mỗi phần của hai chương trình đều bắt đầu với Ghidra 12.1.4 cùng, Test Kitets对照捕获的版本追踪 输出检查这一点:

| 节 | `-O1` 程序 | `-O2` 程序 |
|---|---|---|
| `.text` | 0x100000，159 字节 | 0x100000，271 字节 |
| `.rodata` | 0x1000a0 | 0x100110 |
| `.rodata.str1.1` | 0x1000f0 | 0x100160 |

`-O2`下 `.text`增长 112 字节,即 `total``.rodata`后移 0x70 字节──两个程序的 `grade`Thành phố nằm ở 0x100010── chuyển động 0x33 处的`leaq`√ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √`.rodata+0x14`

Trong `-O1`映像中:`0x1000a0 + 0x14 - 0x10003a = 0x7a = 122` `-O2`映像中:`0x100110 + 0x14 - 0x10003a = 0xea = 234`◊一个映像的字段字节为 `7a 00 00 00`, một cái khác vì `ea 00 00 00`∼46 字节中一个字节不同,Levenshtein 比例为0.978,精确字节阶段失败;屏蔽字节阶段将字段清零后通过──`grade_label`Với biểu đồ của nó cũng di chuyển 0x70, do đó vị trí di chuyển vẫn giống nhau, trong hai hình ảnh đều thông qua các chữ cái chính xác phù hợp.

Ghidra  báo cáo cùng phân biệt.`-O1`Với`-O2`,Tương tự các hàm bytes chính xác  tìm `percent_change`和 `grade_label`;Giữ chỉ dẫn chức năng chính xác 额外找到 `grade`;Tương tự chính xác Phân tích Mnemonics Match  tìm cùng ba hàm。 chỉ dẫn kết nối thiết bị ngăn chặn số hoạt động, do đó phủ định vị trí。

Real 6.5.0 của`compare_functions`Đối với nhà cung cấp văn bản để thực hiện phân biệt so sánh. Trong số các tập thể, nó mang theo hạn chế về việc điều chỉnh di chuyển không có sẵn.

## Radiff2 测量 gì

radar2 6.2.4 提供 `radiff2` Sử dụng`-AC`Trong khi đó, nó phân tích hai tệp, cho mỗi hàm in một dòng: bên trái của kích thước và địa chỉ, MATCH hoặc UNMATCH, tỷ lệ, bên phải của kích thước và địa chỉ, mục tiêu của tệp được bắt được như sau:

| 比较对 | `percent_change` | `grade` | `total` | `grade_label` |
|---|---|---|---|---|
| `-O0` 对 `-O1` | UNMATCH 0.130435 | UNMATCH 0.426829 | UNMATCH 0.106061 | UNMATCH 0.269841 |
| `-O1` 对 `-O2` | MATCH 1.000000 | MATCH 1.000000 | UNMATCH 0.171429 | MATCH 1.000000 |
| `-O1` 对 `-O1` | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 |

tỷ lệ trong radar`1 - distance / max(len_a, len_b)`, trong đó khoảng cách là khoảng cách giữa hai hàm dấu chỉ của Levenshtein, dấu chỉ là theo địa chỉ theo thứ tự拼接 hàm phần cơ bản khối kết quả.`code/main.py`Trung `radare2_ratio()`Đối với phần số nguyên thủy thực hiện cùng một công thức, sẽ 0.130435、0.1060、61、0.269841 和 0.171429 复现到小数点后六位──

Nó không thể phục hồi được.`-O0`下 `grade`của 0.426829── đối với hàm này toàn bộ 118 字节, tỷ lệ là 0.296610──radare2 在大小列打印 `118`, nhưng dấu vân tay của nó ngắn hơn. Không áp dụng định vị lại, nó không thể phân tích bảng nhảy, do đó phân tích chỉ đến khối nhập.`jmpq *%rax`结尾的块、默认分支和回归:共 82 字节,正是第 33 课普通递归下降认定的那82 字节──这82 字节与 字节与 字节与 字节与 字节与 字节与 字节`-O1`字节之间 Levenshtein 距离为 47,因此 `1 - 47/82 = 0.426829`❖ Khởi động`-e bin.relocs.apply=true`Sau đó, radar2 tìm thấy tất cả 118 字节, in 0.288136, tương đương với tỷ lệ tính toán hình ảnh định vị nặng của bài học này; bốn 字节 chuyển động trong hình ảnh khác với các 字段 trong tệp mục tiêu.

`-O`sẽ chỉ số chữ cái cho phần mã hoạt động, và sẽ đặt số mã hoạt động vào 0:`-O0`Đối với`-O1`Tỷ lệ tăng lên 0,239130 ≈ 0,512195 ≈ 0,303030 ≈ 0,523810;`total`Trong `-O1`Đối với`-O2`时升至0.192857── còn có thể tính toán khoảng cách của toàn bộ tập tin:`-s`(Myers) báo cáo hai mục tiêu văn kiện tương tự 0,956 距离 162;`-ss`(Levenshtein) báo cáo 0.927 và 137──Thông số này chứa đầu、符号表和重定位节, không thể giải thích tình hình hàm──

## Ghidra Version Tracking 关联器

Ghidra's Version Tracking Tool thông qua kết nối sẽ nguồn lập trình và kết hợp mục tiêu. Các kết nối hàm bao gồm Exact Function Bytes Match, Exact Function Instructions Match, Exact Function Mnemonics Match, và Duplicate Function Instructions Match: 1:N 和 N:M.

Bài học này được thực hiện bằng cách không có giao diện.`capture_ghidra_vt.sh`将三个目标文件导入项目,运行 `ListVersionTrackingMatches.java`                                                                                                                                                                                                                                                              `AbstractGhidraVersionTrackingScript`, theo đường dẫn mở nguồn và mục tiêu, theo tự động phiên bản theo dõi 顺序运行六个非引用关联器,并为每个块,函数,关联器和匹配打印一行.

| 关联器 | `-O0` 到 `-O1` | `-O1` 到 `-O2` |
|---|---|---|
| Exact Symbol Name Match | 4 个函数 | 4 个函数、5 个数据项（`labels.rel`、`.L.str.1` 至 `.L.str.4`） |
| Exact Data Match | 0 | 0 |
| Exact Function Bytes Match | 0 | 2（`percent_change`、`grade_label`） |
| Exact Function Instructions Match | 0 | 3（增加 `grade`） |
| Exact Function Mnemonics Match | 0 | 3 |
| Duplicate Function Instructions Match | 0 | 0 |

Từ `-O0`Đến`-O1`, mỗi hàm đều thay đổi, vì vậy chỉ được gọi là phù hợp, đây cũng là kết quả của máy tính phù hợp này sử dụng BinDiff 顺序时时.

Các công cụ dưới đây Program Differences là một chuyện khác. Nó nhắm vào hai chương trình trong cùng không gian địa chỉ, trong cùng địa chỉ so sánh chữ, thẻ, mã đơn vị, trích dẫn, chú ý và hàm. Nó là so sánh các sự khác biệt của địa chỉ, sẽ không phù hợp với nội dung di chuyển.

## 根据文档了解Diaphora 和 Binary Ninja

Diaphora là IDA Pro Plugin, lần đầu tiên được phát hành vào năm 2015, đến năm 2026-08-18 为 3.4.2。 Từ 2.0 bắt đầu sử dụng AGPL-3.0, cần IDAPython, do đó có thể chạy trong IDA Home hoặc IDA Pro, không thể chạy trong IDA Free。 nó sẽ xuất khẩu mỗi cơ sở dữ liệu đến SQLite, dựa trên SQL 查询 chạy khởi động式。 Mỗi loại khởi động được gọi là Best/Partial/Unreliable 类别、比例类型, cũng như SAME_CPU hoặc SLOW 等 có thể chọn khối thẻ.

Binary Ninja 6.0 được phát hành vào năm 2026-09-03 加入 Binary Similarity 框架,包含 provider 和 resolver。 nó sẽ BinDiff 作为结构供应商,并提供 WARP,用于容忍可重定位操作数的精确函数匹配。指南建议:函数除可重定位指令外一致时使用 WARP;重新编译后仍保持结构联系时使用 BinDiff。

BinDiff từ năm 2023-09-25  khởi động với Apache-2.0  mở nguồn, phiên bản mới nhất được phát hành là v8。 nó cần phản汇编器 và BinExport 插件, sau đó hỗ trợ IDA Pro 9.4 hoặc phiên bản mới、Binary Ninja 和 Ghidra。

## 相同代码, khác nhau thường lượng

第36 课 giữ một `grade`候选重建, phần cuối cùng của biểu đồ là 3, và giá trị ban đầu là 4.`grade_case10_wrong.o`Với`-O1`下的 `grade`具有完全相同的46 个代码字节──匹配器按精确字节配对,所有签名一致──引用表检查通过重定位读出 `1, 2, 3, 4, 4`, qua một bài khác`1, 2, 3, 4, 3`, báo cáo `dataEqual: false`❖ Ngoài ra còn ba `-O1`函数在左侧未匹配, vì mục tiêu ứng cử chỉ có một hàm.

Đây là hình thức điển hình của phân tích bổ sung. Chỉ kiểm tra các hàm so sánh của mã hóa phụ kiện sẽ nói không thay đổi.

## 符号执行: đường, điều kiện và tìm kiếm giải pháp

King năm 1976 mô tả các biểu tượng thực hiện. Các bước nhập biến thành biểu tượng, mỗi câu nói cập nhật lưu trữ biểu tượng, mỗi bước vào các điều kiện tham gia đường, tìm kiếm giải pháp để xác định liệu đường có thể thực hiện được hay không, và tạo ra các bước nhập cụ thể thực hiện theo đường.

Baldoni、Coppa、D'Elia、Demetrescu 和 Finocchi đã tổng hợp lĩnh vực này trong năm 2018.[12] Phần 5 cho thấy rằng việc phát nổ đường là chi phí cốt lõi: các trình thực thi có thể được phát triển ở mỗi phân đoạn, do đó số trạng thái có thể tăng theo số lượng các chỉ số; nếu vòng giới phụ thuộc vào các mã nhập, sẽ có một tập hợp đường không giới hạn.[12] Các biện pháp giảm bớt bao gồm: mỗi phân đoạn tìm kiếm và cắt bỏ các đường không thể đi, hàm và vòng kết luận gần như trạng thái, và các hàm và vòng kết hợp kết hợp các trình hoạt động cùng một lúc và mã, ghi lại các điều kiện hoạt động cụ thể, sẽ có một trong số đó, một lần nữa, được yêu cầu nhập lại dưới các yêu cầu của trình giải pháp đại diện DART (DART) (2005) ̊CUTE (CUTE) (2005) và SAGE (Sage) (2008) ‒(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

KLEE(Cadar、Dunbar、Engler,OSDI 2008) là mã bit của LLVM trên các mã ảo, do đó输入 là `clang -emit-llvm`Trong 89 chương trình GNU, nó đạt tỷ lệ phủ sóng 84.5%, người phát triển thử nghiệm là 67.7%, và phát hiện ra 56 thiếu sót nghiêm trọng. KLEE 3.2 được phát hành vào năm 2025-12-23, áp dụng giấy phép NCSA, khuyến cáo LLVM 16。

Angr 面向二进制工作──`angr.Project`包含映射目标文件并应用重定位的 CLE 加载器,将块转换为 VEX IR(`block.vex`(v) của máy nâng, có thể thay thế pypcode, cũng như nhà máy trạng thái`SimState`保存寄存器、内存和求解器──`SimulationManager`Đối với danh `active``deadended``found``avoided`和 `errored`của trạng thái tập hợp bước vào,`explore(find=..., avoid=...)`封装该过程──每步引擎依次处理失败、系统调用、子、用于具体数据的独角兽,最后回归到VEX──claripy 是 Z3 之求解前端,在Angr 10.0 中改为内置 Rust 实现,通过`from angr import claripy`导入. ・angr 10.0.3 于 2026-10-10 上传, áp dụng BSD-2-Clause, cần Python 3.12 hoặc phiên bản mới hơn. ・Z3 5.1.0 于 2026-08-16 发布, áp dụng MIT,是angr、Triton以及 KLEE 可选后端后背的求解器──

## Dựa trên § 34 课 IR của các bộ xử lý nhỏ

`code/main.py`Trung 执行器 sử dụng nhỏ IR,语句形态与第 34 课一致:`Assign``Branch``Jump``Return`, thêm 34 课 实践实验要求实现`Switch`终结指令── biểu diễn式包括 `Const``Var`、带宽度 `Bin``Cast`、 từ tên cụ thể表读取的 `Load`和 `Not`4 ví dụ về hàm được nâng cao ở cấp độ được đạt được sau khi đơn giản hóa lớp 34.`0x66666667`乘法已变为 `score / 10`, mỗi IR 块都列出源指令地址.`check_ir_against_listing()`断言这些地址恰好覆盖函数清单一次──

Trong IR`-O0`下的 `grade`- Có thể là:

```text
0x30: local_8 = score; local_10 = score / 10 - 6; if (local_10 >u 4) goto 0x9a else 0x62
0x62: switch local_10 -> 0x91, 0x88, 0x7f, 0x76, 0x76
0x76: local_4 = 4; goto 0xa1        0x7f: local_4 = 3; goto 0xa1
0x88: local_4 = 2; goto 0xa1        0x91: local_4 = 1; goto 0xa1
0x9a: local_4 = 0                    0xa1: return local_4
```

分支表 mục tiêu đến từ `jump_table_targets()`, sử dụng các phương pháp toán định vị trọng lượng giống như bài học 33 , do đó IR  thực tế

`execute()`维护路径状态工作列表――状态包含当前块块、块轨迹、条件列表,以及将每个变量映射为输入表达的环境――`Assign`sẽ môi trường thay đổi thành phần của biểu hiện và lưu trữ kết quả.`Branch`Để giải quyết được một bên không thể đáp ứng được, đó là một phần bị bỏ rơi, đó là một phần của câu nói.`Switch`根据目标对表项分组,对每个不同的目标分分一次,条件是各表项相等条件的分析;angr 也如此处理符号跳转目标──`Return`Để thay đổi môi trường vào giá trị trở lại và đóng các điểm.

Làm việc theo đường đến`return 4`                                                                                                                                                                                                                                                              `local_10 = score / 10 - 6`                                                                                                                                                                                                                                                              `local_10 >u 4`Vì vậy, điều kiện danh sách bao gồm`!(score / 10 - 6 >u 4)`△ chuyển đổi 条目 3 和 4 都指向 0x76,所以进入 0x76 的分叉加入 `score / 10 - 6 == 3 || score / 10 - 6 == 4`△块 0x76 赋值 `local_4 = 4`, nhảy đến 0xa1, trả lại giá trị代入后为 `4`叶节点就是该条件与该值组成的二元组

求解器为 `BoundedSearch`Nó được sử dụng cho mỗi nhập lưu trữ vùng hạn chế, đặt các vùng này trong số các vùng, và tính toán mỗi khối theo C 语义: 32 vị trí quay vòng, cắt phân loại, có biểu tượng và không biểu tượng so sánh, cũng như chuyển toán hoặc logic.`score`Trong -200 đến 1200 时,`grade`Các 5 đường cần 44,460 lần tìm kiếm, mất vài mi giây.

| 叶节点 | 返回值 | 条件 | 边界内的分数 |
|---|---|---|---|
| 0x76 | 4 | `!(q >u 4) && (q == 3 \|\| q == 4)` | 90 至 109，20 个输入 |
| 0x7f | 3 | `!(q >u 4) && q == 2` | 80 至 89，10 个输入 |
| 0x88 | 2 | `!(q >u 4) && q == 1` | 70 至 79，10 个输入 |
| 0x91 | 1 | `!(q >u 4) && q == 0` | 60 至 69，10 个输入 |
| 0x9a | 0 | `q >u 4` | 1,351 个输入，即域中其余输入 |

`q`代表 `score / 10 - 6``-O1`下的 `grade`Cũng có thể tạo ra cùng một loại, nhưng chỉ có hai cách:`lookup_14[q]`Các đường tìm kiếm của biểu đồ, cũng như đường mặc định trở về 0. Vì không có khối trường hợp có thể đạt được, vấn đề trở thành một khối lượng đối với giá trị trở lại.`lookup_14`Từ mục tiêu tài liệu`.rodata`                                                                                                                                                                                                                                                              

边界就是该方法的限制──有界搜索在域内完成,在域外不作结论──在 -200至 1200内,60至 109中没有分数返回0.110或更大的分数中没有返回非零值──z3为全部2^32个分数证明这两项; 下一节展示两种方法会在哪些地方返回不同见证──

## 测量路径 nổ

`-O1`下的 `total`                                                                                                                                                                                                                                                              `count`, vòng tròn`values[rdx]`Không tăng lên`rdx`, là`rdx != rcx`时通过 `jne`Trở đến vòng tròn.`rcx`Vì vậy`zext64(count)`- Tôi không biết.`rdx`Từ 0 开始. Mỗi lần qua lại, tất cả đều ở.`rdx != count`上分叉, trong số đó `rdx`Vì vậy, vì vậy `count = c`                                                                                                                                                                                                                                                              `c`Lần sau sẽ ra ngoài.`count`限定为 0 至 2,执行器找到 3 条路径;0 至 4 时为 5 条;0 至 8 时为 9 条.`-O2`; số lượng vòng quay quy mô của nó ít nhất là 8, do đó không thay đổi số đường trong phạm vi này.

Khi không có biên giới, trình thực hiện sẽ không bao giờ kết thúc, vì mỗi thế hệ số lần là một con đường khác có thể đi.`count`Tỷ lệ vận hành tối đa 64 lần quay lại 22 条路径、截断 2 条, và 65 条可能路径中的另41 条从未开始── báo cáo cho thấy ba con số này── 求解成本也增加:边界 2 时求值 33 次,4 时 115 次,8 时 531 次, 限运行时 6,900 次──

## 用angr 和 z3  trả lời cùng một câu hỏi

`capture_angr.py`Trong ba mục tiêu tập tin chạy trên angr 10.0.3──CLE sử dụng ELF 后端 sẽ mỗi có thể định vị lại mục tiêu tập tin tải lên đến 0x400000, đối với `-O0`应用 13 重定位, đối với các ứng dụng khác 8 ,并解析 4符号── đối với một符号 có 64 位参数.`grade`- Tôi không biết.`run()`Trong `-O0`Tôi đã có 5 tình trạng chết người.`-O1`和 `-O2`Các 2 秒, mất thời gian chia thành 0.475、0.408 和 0.318 秒.`eax == v`, yêu cầu trình giải mã cho phép có các ký hiệu giá trị tối thiểu và giá trị tối đa, trên mỗi cấp độ tối ưu hóa,`v`Trong 1 đến 4 giờ đều có 60 đến 69、70 đến 79、80 đến 89、90 đến 109; trong 0 giờ đều có -2147483648 đến 2147483647── hai lần kiểm tra giao thông đều không thỏa mãn──

Đến dạng của khối được xác định đối với`-O0`下的 `grade`Sử dụng CFGFast,列出第33 课找到的八块,再通过 `explore(find=0x400076)`寻找存储 4块的块──0.47秒后找到一个状态, vẫn còn 3 状态;参数最小值 90、最大值 109,样本为 91、93、94、97 和 101──

Đối với`percent_change`, nhận được hai deadlocked  trạng thái, ràng buộc phân biệt cho `before[31:0] != 0`和 `before[31:0] == 0` đối với yêu cầu trạng thái không-零`eax == 50`, trong `-O0`Tôi sẽ làm thế.`before = 21055744, after = 332315210`, trong `-O1`Tôi sẽ làm thế.`40566804, 834296877`, trong `-O2`Tôi sẽ làm thế.`-24484867, 993934694`❖ 16 đến 16 trong số có giới hạn tìm kiếm cung cấp `before = -10, after = -15`◊z3 đối với bài học 34 清单 trả lời cùng một câu hỏi, give `before = -25092599, after = 305712160` Test kit dùng IR 求值器 tính toán toàn bộ 5 đối số đầu vào, mỗi đối số có kết quả trung bình là 50  Mô hình chứng minh rằng có một số đầu vào, không phải là đầu vào duy nhất; ba công cụ chính xác cho ra các câu trả lời khác nhau 

`capture_z3.py`用 32 位位量建模 `grade`của `-O1`清单,包含乘法、两次移位和表,提出另外四问题──是否存在某种32位分数,使清单与源码`switch`Không giống:0.068 giây được không đáp ứng, do đó hàm biên dịch trên tất cả 2^32 输入 trên bằng với nguồn cổng.`score / 10`Vì vậy, chuyển đổi  vào các phân tử mặc định, và phiên bản giá trị trở lại 4 ⋅ sẽ có cùng sự khác biệt giới hạn ở 0 đến 109: không thỏa mãn, đó là lý do thứ 36 ⋅ không thể phát hiện sự khác biệt đối với ⋅`percent_change`, yêu cầu`before == 3`Kết quả là -133, trong`after = 1073741823`Khi được ngồi, tức là 36                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `after = -1`, lúc này`(-1 - 3) * 100 / 3`-133, hoàn toàn không có sự kết thúc.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
```

输出 là một báo cáo JSON.`diffs`保存 `-O0`Đối với`-O1``-O1`Đối với`-O2`                                                                                                                                                                                                                                                              `-O0`So sánh với nhau.`toolComparison`Để phân tích các hàm trong mỗi giai đoạn, định nghĩa và tỷ lệ,`patch` `grade_case10_wrong.o`案例:`radare2Ratios`复现 radiff2 数值,`gradeRelocationCase`展示布局和两个位移,`symbolic`保存路径、类别和爆炸计数──

按以下顺序阅读 `code/main.py`- Có thể là:

1. `ElfObject`读取节、符号和 `.rela.*`记录,`parse_listing()`读取 `llvm-objdump`文本。
2. `jump_table_targets()`和 `build_cfg()` Giữ một khối và một loại bên cạnh.`FunctionRecord.signatures()`构建五种签名──
3. `load_image()`布局已分配节,并应用 `S + A - P`和 `S + A`
4. `match_functions()`là bộ phù hợp giai đoạn;`levenshtein()`和 `radare2_ratio()`提供相似度──
5. `parse_radiff2()`和 `parse_ghidra_vt()`读取捕获的工具输出, dùng để so sánh:
6. `evaluate()``substitute()`和 `BoundedSearch`提供表达式语义和求解器──
7. `execute()`枚举路径,`solve_returns()`向每个叶节点请求输入集合。
8. `grade_ir_o0()``grade_ir_o1()``percent_change_ir_o1()`和 `total_ir_o1()`                                                                                                                                                                                                                                                              

Còn ba lệnh nữa.`python3 code/main.py diff A.o B.o`So sánh hai bên lưu trữ mục tiêu của danh sách,`--image`则比较加载映像──`python3 code/main.py paths grade O0`印一个函数的路径和类,`paths total 8`印有边界的循环──`python3 code/main.py figure-data`印交互图嵌入的数据──

##  thực tế sử dụng

Đối với hai cấu trúc của chính nó, sử dụng máy so sánh và trình thực hiện theo thứ tự sau đây:

1. Để mỗi mục tiêu của mình, hãy bắt được một danh sách.`function_record()`Đối với các bài kiểm tra.
2. Trước khi so sánh các mục tiêu tài liệu. Đọc từng giai đoạn phù hợp; trước khi ký kết thứ hai đồng nhất, sẽ được xem như một đề xuất.
3. So sánh tải hình ảnh. Từ các phụ kiện chính xác trở lại các phụ kiện phù hợp để ngăn chặn, đối với dữ liệu của nó đã xảy ra chuyển động.
4. Đối với mỗi so sánh so sánh, cùng một mã có cùng một số lượng thường khác nhau, vẫn là hàm thay đổi hơn.
5. 运行名称阶段并比较──有符号时采用BinDiff 顺序, chỉ sử dụng kết quả cấu trúc để đánh giá từng giai đoạn──
6. 工具报告比例时, trước tiên xác định các字节 được nhập vào, sau đó so sánh với kết quả của riêng bạn.
7. Để tìm hiểu các hàm nhập, biên soạn mỗi câu lệnh với địa chỉ IR, để mỗi biểu tượng vòng tính thiết lập biên giới hoạt động sau`execute()`,并求解每个叶节点――报告结果时同时报告边界――
8. Có thể sử dụng khi, sử dụng angr hoặc z3 运行 cùng một truy vấn và so sánh các loại biên giới.

## 交互实验

### 实验 A: 手工计算五种签名

Từ `code`目录启动 Python:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution/code
python3 -q
```

运行:

```python
from main import *
grade = {r.name: r for r in fixture_records("ledger-x86_64-O1.o")}["grade"]
grade.raw.hex(" ")
grade.masked_bytes() == grade.raw
grade.mnemonics
grade.cfg_shape()
grade.signatures()
```

打印 `grade.raw`前,先写下 hàm chuyển động 0x26 处的四个字节──随后对 `ledger-x86_64-O0.o`Trung `grade`运行相同代码,统计 `grade.edges`Trung `table`边♪

### 实验 B:观察重定位 làm thế nào để phá hủy

```python
case = grade_relocation_case()
case["layout"]
case["displacements"], case["rodataShift"]
case["objectBytesEqual"], case["imageBytesEqual"], case["maskedImageBytesEqual"]
```

读取 `displacements`Trước, trước trên giấy tính toán`0x100110 + 0x14 - 0x10003a`再将 `load_image()`Địa điểm của nó được chuyển đổi thành 0x400000, xác nhận vị trí không thay đổi, vì hai số hoạt động cùng di chuyển.

### 实验 C: lỗi phù hợp với tránh nó theo thứ tự

```python
report = diff_fixtures("ledger-x86_64-O1.o", "ledger-x86_64-O2.o")
[(m.left.name, m.right.name, m.stage) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o")
[(m.left.name, m.right.name, m.stage, m.names_agree) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o", stages=BINDIFF_ORDER)
[(m.left.name, m.right.name, m.stage) for m in report.matches]
```

打印 `-O0`下的 `records(...)["percent_change"].cfg_shape()`和 `-O1`下的 `grade_label`, đọc hai bậc chuỗi. Đọc lại giai đoạn thứ sáu, để ghi chép sau thứ tự, để thứ tự không còn quan trọng nữa, để quan sát có thể phân biệt chúng hay không.

### 实验 D: đường lối và biên giới

```python
report = grade_paths("O0")
[(p["trace"], p["condition"], p["returns"]) for p in report["paths"]]
report["returns"]["4"]
total_paths(2), total_paths(4), total_paths(8)
total_paths(64, step_limit=24)["truncated"]
```

sẽ`SCORE_DOMAIN`改为 `range(0, 110)`, chạy lại`grade_paths("O0")` Khôi phục 0 loại giảm xuống còn 60 đầu vào, hai kiểm tra giao thông vẫn còn tồn tại  tái định cư`range(90, 100)`Xem những gì có thể làm được không có mô hình nào.

## 实践实验

Trong ví dụ trên chạy BinDiff, đã có ba kết quả so sánh.

要求:

- Trong Ghidra 12.1.4 中安装 BinExport 扩展,导出三个 sổ cái 程序――记录 BinExport 发布标签和 Ghidra 版本――
-  cài đặt BinDiff 8  lệnh行, sử dụng chỉ tương tự tính chọn tạo `-O0`Đối với`-O1`和 `-O1`Đối với`-O2`Kết quả:
- Để nắm bắt sự tương tự và tin tưởng của từng hàm`code/fixtures/`, và `build_fixtures.sh`Trong ghi chép thực sự.
- Vì vậy`tool_comparison()`增加 `bindiff`列,并添加测试,比较 BinDiff 在 `-O1`Đối với`-O2`n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n
- 写一段文字, chỉ ra BinDiff đối với `grade`Sử dụng các thuật toán, và liệu có tương đương tải hình ảnh ư

Kiểm chuẩn thành công là: trình bày in bốn hàng công cụ cho mỗi hàm, thử nghiệm mới xác định cho một mối quan hệ tương đương hoặc một sự khác biệt đã được giải thích.

## 本课产物

本课包含 `outputs/skill-binary-diffing-and-symbolic-execution.md` Sử dụng nó sẽ chuyển đổi hai cấu trúc và một hàm thành: báo cáo phân đoạn khác biệt của chất lượng đánh dấu phù hợp, báo cáo về các hàm không phù hợp hoặc thay đổi, cũng như báo cáo về các đường dẫn giới hạn của tập hợp nhập và tạo ra tập hợp này.

## 验证

运行演示和套件:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- Chữ biểu tượng cho ra bốn hàm,`-O0`- Tầm là 46 118, 66 39,`-O1`16 ̊46 ̊31 ̊63,`-O2`16 ∼46 ∼140 ∼63
- `-O1`目标文件的 `.rela.text`记录与 `llvm-objdump -r`打印的描述一致
- Mỗi lệnh đơn đặt hàng nằm trong phạm vi của nó,字节 bằng với mục tiêu tài liệu, sửa đổi字节 sẽ触发异常
- `-O1`下 `total`Có 5 khối, 5 bên và một vòng tự, hình dạng của chuỗi có tính xác định
- `-O0`下 `grade`Từ `.rela.rodata`恢复五跳转表目标, lấy tám块十一边
- Không có nhảy chuyển giờ,`-O0`下 `grade`Đến 4 khối 82 字节
- `-O0`下 `percent_change`Với`-O1`下 `grade_label`Có cùng hình dạng bốn khối
- Có thể định vị lại từng hàm của mục tiêu file, chính xác phù hợp với màn hình
- `-O1`和 `-O2`Có ba hàm số nhau,`-O0`和 `-O1`Không có
- `grade`引用表为 `1, 2, 3, 4, 4`,候选表为`1, 2, 3, 4, 3`
- Bộ tải sẽ có hai chương trình.`.text``.rodata`和 `.rodata.str1.1` đặt ở vị trí tương tự như Ghidra
- `R_X86_64_PC32`按 `S + A - P`写入并产生位移 122,`.data`Trung `R_X86_64_64`条目获得字符串地址
- `grade`Trong mục tiêu tập tin, các chữ cái phù hợp, khác nhau trong hình ảnh bởi 0x70 chuyển động, màn hình sau khi phục hồi phù hợp
- `-O1`Đối với`-O2`Có ba hàm theo chính xác phụ đề phù hợp,`total`按名称匹配;映像视图中 `grade`按屏蔽字节匹配,相似度为 1 - 1/46
- 本课顺序在 `-O0`Đối với`-O1`Trong tạo ra một sai lầm dòng hình dạng phù hợp, BinDiff 顺序则将四函数全部按名称匹配
- 补丁候选在字节上匹配,在引用数据上失败
- Levenshtein 比例复现 0.130435、0.106061、0.269841、0.171429、82 字节上的 0.426829,以及 radiff2 应用重定位后打印的重定位字节比例
- Các tập hợp MATCH của radiff2 tương đương với các giai đoạn chữ cái chính xác, các tập hợp chữ cái và lệnh của Ghidra tương đương với các tập hợp hình ảnh chính xác và ngăn chặn
- Ghidra ở `-O0`Đối với`-O1`Chỉ tìm thấy tên phù hợp, mỗi điểm tương tự 1.0 ∞
- 手工提升的 IR 恰好覆盖每条清单指令一次,求值器遵循C 语义
- `grade`Trong `-O0`Có 5 điều kiện trên đường, trong`-O1`Có hai con đường, nhưng cùng một loại.
- Có giới thứ hạng 60 đến 69、70 đến 79、80 đến 89、90 đến 109, với angr 三个优化级别及 z3 一致, deadended 状态为 5 和 2, đến phạm vi khối đạt 90 đến 109
- 两项交叉检查在有界域、angr 和 z3 中均无模型,z3 证明清单等于源码开关
- Có giới tìm kiếm ừng và z3 của mỗi `percent_change`模型都求值得到求值
- `total`给出 3、5、9 条路径及三角数和,与angr相似,步数限制回归 22 条并截断 2 条
- 图像数据包含两种视图"",重定位数值",以及五叶节点和各自输入集合,站点模块嵌入相同数据

## 生产环境失效模式

| 失效情况 | 能力不足的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 对加载映像取字节哈希 | 两个代码相同的构建之间“grade 被修改” | 字段偏移、两个位移和节的移动；屏蔽哈希匹配 |
| 对可重定位目标文件取屏蔽哈希 | “屏蔽没有影响” | 字段原本就是零；变更存在于重定位记录和引用常量中 |
| 只看流图形状 | 自信地配对两个无关函数 | 第二种签名一致，否则名称矛盾时丢弃匹配 |
| 对已剥离符号构建先用名称再用结构 | 无法匹配 | 各结构阶段及质量，以及未匹配列表 |
| 跨工具直接比较比例 | “radiff2 为 0.43，本课为 0.30” | 两侧各自取指纹的字节；无重定位时 82 字节，有重定位时 118 字节 |
| 相同代码，不同常量 | “精确匹配” | 通过重定位和边界检查读取的表 |
| 将一个模型报告为唯一输入 | “分数是 90” | 90 至 109 的类别、数量，以及发现它的边界 |
| 将有界搜索报告为 unsat | “没有输入产生 -133” | 只在边界内 unsat；z3 在边界外找到 1073741823 |
| 符号循环没有边界 | 超时 | 边界或上限，以及返回、截断和从未开始的路径 |
| 将未运行的闭源工具描述为已运行 | 没有捕获来源的数值 | 带命令和版本的捕获文件，或明确声明仅依据文档 |

## 操作准则

Mỗi lần phù hợp bằng chữ ký, chỉ chấp nhận giá trị duy nhất của hai bên, và giữ lại giai đoạn và chất lượng trong sự phù hợp.

## 延伸阅读

- [BinDiff concepts: matching strategy, algorithms, and quality ratings](https://github.com/google/bindiff/blob/main/docs/concepts.md)
- [BinDiff repository and the v8 open-source release](https://github.com/google/bindiff/releases/tag/v8)
- [BinExport README: IDA Pro, Binary Ninja, and Ghidra exporters](https://github.com/google/binexport)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004) and Dullien, Rolles, "Graph-based comparison of Executable Objects" (SSTIC 2005), shipped in the BinDiff repository](https://github.com/google/bindiff/tree/main/docs/papers)
- [Diaphora README and heuristics source](https://github.com/joxeankoret/diaphora)
- [Ghidra Version Tracking correlators help page](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/VersionTracking/src/main/help/help/topics/VersionTrackingPlugin/VT_Correlators.html)
- [Ghidra Auto Version Tracking help page](https://www.ghidradocs.com/11.0_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_AutoVT.html)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Binary Ninja 6.0 "Krypton" release notes](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)và [Binary Similarity user guide](https://docs.binary.ninja/guide/similarity.html)
- [radare2 book: radiff2](https://book.rada.re/tools/radiff2/intro.html)và [radare2 6.2.4 source](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [King, "Symbolic execution and program testing" (CACM 1976)](https://dl.acm.org/doi/10.1145/360248.360252)
- [Baldoni et al., "A Survey of Symbolic Execution Techniques" (ACM Computing Surveys 2018)](https://dl.acm.org/doi/10.1145/3182657)
- [Cadar, Sen, "Symbolic execution for software testing: three decades later" (CACM 2013)](https://dl.acm.org/doi/10.1145/2408776.2408795)
- [Cadar, Dunbar, Engler, "KLEE: Unassisted and Automatic Generation of High-Coverage Tests for Complex Systems Programs" (OSDI 2008)](https://www.usenix.org/legacy/events/osdi08/tech/full_papers/cadar/cadar.pdf)và [KLEE 3.2 release](https://github.com/klee/klee/releases/tag/v3.2)
- [Shoshitaishvili et al., "SoK: (State of) The Art of War: Offensive Techniques in Binary Analysis" (IEEE S&P 2016)](https://oaklandsok.github.io/papers/shoshitaishvili2016.pdf)
- [angr documentation: loading, simulation managers, and the simulation pipeline](https://docs.angr.io/en/latest/core-concepts/toplevel.html)và [angr 10.0.3 on PyPI](https://pypi.org/project/angr/)
- [Z3 5.1.0 release](https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0)
- [Triton dynamic binary analysis library](https://github.com/JonathanSalwan/Triton)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
