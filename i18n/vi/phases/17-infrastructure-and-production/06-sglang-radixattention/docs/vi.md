# 面向 Prefix-Heavy Workloads 的 SGLang 与 RadixAttention

> SGLang sẽ xem KV cache như một loại ∞ có thể sử dụng được tài nguyên, và lưu trữ trong cây gốc ∞vLLM ∞FCFS(lần đầu tiên đến, lần đầu tiên phục vụ) yêu cầu điều chỉnh, trong khi lập trình viên cache-thông thức của SGLang sẽ ưu tiên xử lý yêu cầu có tiền đề chia sẻ dài hơn, bản chất là đi sâu đầu tiên trên đường gốc, để các nhánh nóng ∞ giữ ở trong HBM. Trong Llama 3.1 8B ∞với các yêu cầu 1KGPT giống như GPU.

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**前置要求：**Giai đoạn 17 · 04 (vLLM Serving Internals), Giai đoạn 14 (Agentic RAG)
**Time:** ~75 minutes

## Học mục tiêu
- 画出 RadixFattention:prefixes 如何存储在radix树中,以及KV blocks 如何在根根于同一分支的序列 之间共享──
- 解释 lập trình lưu trữ cache, cũng như tại sao FCFS không phù hợp với giao thông cao cấp.
- 给定 tiền tố- cache hit rate 和 prompt length distribution, tính toán một số tải trọng công việc dự kiến tăng tốc.
- Nói ra để 6.4x số này thực sự xuất hiện ư không phải là lỗi thu nhập kỷ luật đơn giản.

## 问题
经典服务 会把每个请求的提示 当作不透明──即使5000 RAG 请求都用同一个2000-Token系统提示加同一个检索序言 开头,vLLM也会对这个2000-Token序词预填5000次──GPU 一次又一次地做同一个工作──

观察结论是:agentic 和 RAG workloads 中的提示 几乎总是共享长久的预写. 系统提示,工具方案,几次举例,检索头条,对话历史,全都会在请求之间重复.

RadixAttention chính là làm như vậy. Các mã thông báo được chỉ dẫn vào cây gốc; mỗi nút có chuỗi mã thông báo từ gốc đến node trên đường đi đối với các khối KV tương ứng.

挑战 nằm trong lập trình. Nếu hai yêu cầu chia sẻ 2000 Token prefix, và yêu cầu thứ ba chỉ chia sẻ 200 Token trong số đó, bạn sẽ muốn đặt hai yêu cầu chia sẻ dài cùng nhau, để cho phép prefix dài 留在HBM.

## 概念
### 作为 KV index 的根树

cây radix(tried nhỏ gọn) lưu trữ chuỗi token。 mỗi nút 拥有一个 Token range, cũng như cho phạm vi này 计算出的 KV khối。Children 会把序列 扩展一个或多个 Token。

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

Một yêu cầu mới với hệ thống yêu cầu + "Context: <doc A>" + "Question: Carol" 进来──调度器遍历:system prefix 匹配(复用124 khối),doc-A branch 匹配(复用31 khối), sau đó chỉ để "Question: Carol" phân chia các khối tươi(4 khối)──Tốc phí dự kiến: 4 khối của New Token──没有这棵树:160 khối──预填省约 ~40x──

### Lịch trình lưu trữ

Nếu cache không ngừng churn, dựa trên cây radix của tái sử dụng là không có ý nghĩa.

1. **Depth-first dispatch**◊ Từ hàng trong queue chọn 下一个请求时, ưu tiên chọn với hiện tại đang chạy đặt 根根于同一分支的请求──这将让热分支保持结──
2. **Branch level 的 LRU，而不是 block level 的 LRU**◊驱逐整条枝 (từ lá ngắn nhất được sử dụng 开始), thay vì các khối riêng biệt, hình dạng cache 才与基根形匹配──

FCFS 违反这两点――共享2000 Token请求排在共享50 Token请求后面, sau đó 2.000-Token chi nhánh bị trục xuất, để chứa50 Token 那个请求――

### Bạn nên nhớ được điểm chuẩn số

- Llama 3.1 8B、H100、ShareGPT 1K yêu cầu:SGLang ~16,200 tok/s, đối với vLLM ~12,500(khoảng 29% 优势)。
- Prefix-heavy RAG( cùng hệ thống + 相同 doc, biến đổi câu hỏi):SGLang 上最高可达6.4x。
- Nồng độ công việc nhân bản giọng nói: 86,4% tỷ lệ hit prefix-cache。
- Tỷ lệ sản xuất của khách hàng SGLang:取决于迅速纪律,为 50-99%.
- 2026 đã được triển khai trên 400.000+ GPU.

### đặt hàng 陷

6.4x số này phụ thuộc vào quy trình đơn đặt hàng mẫu đơn giản phù hợp. Nếu khách hàng của bạn trong một số yêu cầu tạo ra các đơn giản`[system, tools, context, history, question]`, trong một số yêu cầu khác tạo ra`[system, context, tools, history, question]`,tree 就找不到共享前── đối với loài người trông giống như những thứ được chia sẻ, đối với cây gốc là hai chuỗi khác nhau──

工程师的杆:你的提示模板就是缓存键──固定顺序──把所有不可变的内容(系统、工具、方案) đặt trước面──然后放回收文本──最后放用户问题──不要把动态内容 交错插入前──

Nghiên cứu trong trường hợp thực tế: chuyển nội dung động  chuyển từ tiền tố có thể lưu trữ, để một lần triển khai tỷ lệ hit cache  thông qua một lần thay đổi từ 7%  nâng lên 74% 👇

### RadixAttention 赢在哪里,输在哪里

Chiến thắng:
- RAG ((những câu hỏi khác nhau trong câu hỏi này)
- Các đại lý (sự hình thức công cụ, biến đổi truy vấn)
- 带长 hệ thống nhanh chóng của trò chuyện.
- 具有重复 tiền đề của tiếng nói / thị giác tải trọng làm việc:.

Lose (đưa lại độ thông qua ở mức vLLM):
- Sử dụng các lời nhắc độc đáo của một lần chụp thế hệ mã hoàn thành không có hệ thống nhắc mở trò chuyện)。
- Mỗi yêu cầu đều đưa nội dung độc đáo 交错插入 tiền tố động của các yêu cầu.

### Tại sao đây là vấn đề lập trình viên, không chỉ là vấn đề hạt nhân

Bạn có thể thực hiện KV tái sử dụng thành một thủ thuật hạt nhân。SGLang của洞见是, chỉ khi điều chỉnh máy làm cho phân nhánh nóng 保持 resident 时,reuse 才会有收益。 một đơn giản 可用就复用策略会在混合负载下让缓存 churn。radix-tree-indexed scheduler 才是把核心 thủ thuật 转化成29% 生产优势的关键──

### Sự tương tác với vLLM

Hai hệ thống này không phải là một mối quan hệ cạnh tranh nghiêm ngặt. Năm 2026, vLLM đã tăng thêm cache tiền tố.`--enable-prefix-caching`(vLLM là sau nối lên trên trên đó, đối với các tải trọng công việc chủ yếu do tiền tố tái sử dụng, SGLang vẫn là một lựa chọn mặc định. Đối với không có các mô hình tiền tố mạnh mẽ phục vụ mục đích chung, vLLM vẫn tương đương hoặc tốt hơn.


```figure
roofline
```

## Sử dụng nó
`code/main.py`实现 một toy radix-tree KV cache, cũng như một bộ lập trình có hai chiến lược:FCFS và cache-aware. Nó sẽ cho phép cùng một tải trọng làm việc phân biệt thông qua hai vận hành, báo cáo tỷ lệ hit tiền tố-cache và thông qua delta.

## 交付 nó
本课会生成 `outputs/skill-radix-scheduler-advisor.md` Đưa ra mô tả tải trọng công việc (quantify) (quantify) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích) (giải thích)

## 练习
1. 运行 `code/main.py`◊ Trong cùng một khối lượng công việc 上比较 FCFS 和 cache-aware──delta từ đâu đến, là tiết kiệm prefill ‧ tiết kiệm decode, hay trì hoãn hàng?
2. 修改 workload,让提示 随机排列 `[system, tools, context]`                                                                                                                                                                                                                                                              
3. 计算在 Llama 3.1 8B 上, như một nhánh gốc 保持一个2000-Token hệ thống nhanh chóng cư dân của HBM cost──与没有预写重用的16序列批次成本做比──
4. 阅读 SGLang RadixAttention paper。用三句话解释为什么在前重负载 下,树形 LRU 优于块形 LRU。
5. 某客户报告缓存 hit rate chỉ 8%  nói ra ba lý do có thể, cũng như bạn sẽ chạy cho mỗi lý do chẩn đoán

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "SGLang 那个东西" | KV cache 以 radix tree 索引，使 shared prefixes 能复用 blocks |
| Radix tree | "compact trie" | 每个 node 拥有一个 Token range 及其 KV blocks 的 tree |
| Cache-aware scheduler | "hot-branch-first" | 优先处理共享 resident branch 的请求的调度器 |
| Prefix-cache hit rate | "你的 prompt 有多少是免费的" | 从复用 KV blocks 服务的 prompt Tokens 比例 |
| FCFS | "first-come first-served" | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | "驱逐 leaf" | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | "cache key" | prompt 的 component order 决定 tree 能共享什么 |
| System prompt pinning | "resident prefix" | 保持 immutable system portion pinned，以避免 eviction thrash |

## 延伸阅读
- [SGLang GitHub](https://github.com/sgl-project/sglang) nguồn 和 docs。
- [SGLang documentation](https://sgl-project.github.io/) RadixAttention 和 lập lịch 细节──
- [SGLang paper — 高效编程 Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) 设计 tham chiếu
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) điểm số và lý luận lập trình viên
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) vLLM  tự mình giống như gốc 实现,用于比较。
