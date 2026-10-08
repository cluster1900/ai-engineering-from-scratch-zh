# 分块策略 so sánh

> Các phân đoạn quyết định kiểm tra máy có thể nhìn thấy những gì. Một khi biên giới đã sai, không có mô hình được nhúng, hoặc các hệ thống phân loại được sửa chữa tốt.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 11 阶段课程 04（嵌入）、06（RAG）、07（高级 RAG）；第 19 阶段 B 轨基础（第 20-29 课）
**Time:** ~90 分钟

## Học mục tiêu
- Từ đầu bắt đầu thực hiện 5 chiến lược phân đoạn: cửa sổ cố định, câu, phân đoạn chuyển tiếp, tập hợp ngữ nghĩa và Markdown cấu trúc tiêu đề.
- Trong một bộ nhớ về các câu trả lời có nhãn vàng,并 giải thích tại sao một chiến lược phù hợp với văn bản, một chiến lược khác phù hợp với văn bản kỹ thuật.
- 读取块长度分布并识别每个策略注入的故障模式:孤立句子、中间符号剪切、仅标题块、语义漂移──
- Thông qua kiểm tra ba thuộc tính để chọn giá trị mặc định của thư viện mới, và không cần phải chạy thử nghiệm cơ sở: loại tài liệu, độ dài trung bình của đoạn văn và liệu hình thức có cấu trúc rõ ràng hay không.

## 问题

Mỗi ống RAG sẽ đầu tiên đưa tài liệu nguồn vào đoạn: đoạn nhỏ để có thể đặt vào mô hình nhúng, cũng lớn để đủ để mang lại một ý tưởng độc lập.

Chỉ khi lưu giữ dừng giá trị có thể đạt được, hỏi ngân sách dừng giá trị là gì của câu hỏi sẽ thành công. Nếu cửa sổ cố định cắt giá trị được tách ra khỏi xung quanh, nhúng sẽ di chuyển đến một số khác,BM25 phân số sẽ giảm, xếp hạng lại thấy là tiếng ồn, LLM sinh ra câu trả lời cũng sẽ sai. Bài viết năm 2024 LongRAG: Tăng cường Khởi phục-Tăng thế hệ với LLM ngữ cảnh dài 测试, chỉ phân khối chọn sẽ mang lại 35% yêu cầu hồi tưởng 绝波 

Trong bài học này, bạn sẽ xây dựng 5 chiến lược, đưa chúng chạy trên bộ nhớ cụ thể của các câu trả lời có nhãn vàng, và để bạn tự đọc nhớ số chữ.

## 概念

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### Đường cửa cố định

蛮力基线── mỗi N 个字符 được cắt một lần──可选地重叠, để ở vị trí N 处剪切的句子完整地出现从位置 N 开始的块内 - 重叠──快速──确定性、边界糟糕──将其作为控制件,而不是默认值──

### 句子

Sử dụng biểu hiện chính thức hoặc đơn giản của trạng thái cơ phân chia các câu giới hạn. Bắt một hoặc nhiều câu đúc vào một khối, cho đến khi đạt được mục tiêu ký tự ngân sách.

### 递归分割

Chiến lược cấu trúc cấp bậc phổ biến trong năm 2023 của thư viện. Hãy thử phân chia phần phân chia mạnh nhất của các bộ phận, sau đó quay lại phần tiếp theo, rồi phân chia thành câu, sau đó chia thành chữ cái. Khi các khối phù hợp với ngân sách, hãy quay lại phần cuối.

### 语义聚类

嵌入每个句子──将共享主题质心的连续句子聚类──每当与质心的运行相似度下降到值以下时就进行切割──边界反映的是含义,而不是字符──构建速度较慢,依赖于嵌入模型,但对于在段落内切换主题的文档具有弹性──

### 结构化 Markdown 标题

Đối với tài liệu có cấu trúc rõ ràng (Markdown, ReStructuredText, RFC, kiểu số hóa phần), xin hãy phân chia ở biên giới tiêu đề. Mỗi phần đều chứa tiêu đề và tất cả nội dung bên dưới, cho đến khi tiêu đề tiếp theo cùng hoặc cao cấp hơn.

### recall@k 如何衡量边界选择

黄金令牌的查询带带源文档内答案范围的精确字符偏移量――分块后, bạn sẽ hỏi: các khối trước k 个块 của kiểm tra器 trả lại có chồng chất với khối băng thông vàng không? Nếu có, thì các truy vấn của recall@k 为1―― nếu không, thì là 0.―― giá trị trung bình của toàn bộ tập hợp truy vấn.


```figure
ci-chunk-boundaries
```

##  xây dựng nó

`code/main.py`实现:

- `fixed_window(text, size, overlap)`- 基线――
- `sentence_chunks(text, target)`- 简单句子打包器──
- `recursive_split(text, separators, target)`- Đang chuyển tiếp.
- `semantic_chunks(text, similarity_threshold)`- Phân tích dựa trên chất lượng dựa trên sự cố định
- `structural_markdown(text)`- 标头感知分离器.
- `mock_embed(text, dim)`- dựa trên các bản cài đặt hash, vì vậy vòng lặp có thể hoạt động ngoài mạng.
- `DenseIndex`- cùng hình dạng được sử dụng trong khóa học kiểm tra hỗn hợp của đường sắt B giai đoạn 19.
- `eval_recall(strategy, corpus, queries, k)`- So sánh vòng tròn.
- `main()`, trong bộ 语料库上运行每个策略并印回召@k 表。

运行 nó:

```bash
python3 code/main.py
```

输出是一个小表,每个策略一行,每个 k 一列──句子策略在结构化 fixture上失败──结构化 Markdown 在 Markdown fixture上胜──递归策略在混合 fixture上有一席之地,因为递归会自适应──语义聚类在没有有用结构线索的散文 fixture上胜──

## 表中不会隐藏故障模式

**孤立句子。**句打包会产生错过主题句的块──然后嵌入指向错误的──

**中间符号剪切。**Các cửa sổ cố định trong mã hoặc YAML sẽ chia các mã thông báo thành hai nửa.

**仅包含标题的 chunk。** cấu trúc Markdown sẽ phát hành chỉ bao gồm `## Title`Chuyện này, hoặc thêm một phần của phần thứ nhất.

**语义漂移。**Khi các bộ phận ngôn ngữ liên quan đến chủ đề, các nhóm ngôn ngữ sẽ bị suy yếu.

**过时的嵌入。**语义聚类使用嵌入模型──如果改模型,您也将改块──将块模型与检索模型分开固定,或一起重建索引──

## 选择默认值而不运行基准测试

Ba thuộc tính quyết định bộ phận tùy chọn của bộ thư viện ngôn ngữ mới:

|属性 |值|默认|
|----------|-------|---------|
|文件类型|没有结构的散文 |递归分割，目标 800 |
|文件类型| Markdown / RFC / API 文档 |结构化 Markdown |
|文件类型|代码| AST 感知（超出范围；请参阅第 19 阶段第 02 课）|
|段落长度|长而单一的主题 |句子，目标500 |
|段落长度|简短、混合的主题 |语义，阈值 0.6 |

Nếu có câu hỏi, hãy chọn chuyển tiếp chia rẽ. Đó là một cơ sở chiến lược mạnh nhất.

## Sử dụng nó

生产模式:

- Trước khi phát hành một đường ống mới, hãy đánh giá hoạt động; đừng tin vào chiến lược của thư viện của bạn.
- Mỗi khi bạn thay đổi các mô hình hoặc bộ sưu tập các bộ sưu tập ngôn ngữ, hãy tái triển khai đánh giá; người chiến thắng phụ thuộc vào bộ sưu tập ngôn ngữ.
- Để tên chiến lược được giữ lại trong dữ liệu của mỗi khối, để bạn có thể trở lại sau đó.

## 发货

Chương 69  Trong bài học F 端到端 RAG 系统 sử dụng các phân khối chọn lọc này như là giai đoạn đầu tiên của nó.`eval_recall`返回的相同形中读取recall@k。 chọn trong bộ phận ngôn ngữ của bạn chiến thắng chiến lược并将其向前推进。

## 练习

1. 添加第六种策略: sử dụng `tiktoken`Thay vì mã số token-window 
2. Đưa 30% mã khối vào phần mềm cố định trong.
3. Việc định nghĩa được đặt vào thay thế bằng định nghĩa được đặt vào từ nhà cung cấp thực tế của dự án.
4. cho mỗi khối 添加一个`summary`字段: 一句质心描述──重新运行 eval,并将摘要附加到块主体──测量召回提升──

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|-----------------|------------------------|
|recall@k | “我们拿到正确 chunk 了吗？” |任何前 k 个 chunk 与 gold answer span 重叠的查询比例 |
|块重叠| “滑动窗口”|将前一个块的最后 N 个字符重新包含在下一个块中 |
|结构分割器| “标题感知块” |在 H1/H2/H3 边界处切分；标题文本也是 chunk 的一部分 |
|语义分块器 | “主题感知块” |嵌入句子、按质心相似度聚类、漂移剪切 |
|质心漂移| 「话题转移」|运行平均值与下一个句子之间的余弦相似度下降超过阈值 |

## 进一步阅读

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [人择、上下文检索](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex，生产组块策略 RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- 第 11 阶段 第 06 课 - RAG 基础知识
- 第11 阶段第07 课 - 高级 RAG
- Chương 65 - Cần kiểm tra hỗn hợp về phân loại các khối được tạo ra tại đây
- Chương 68: Công cụ đánh giá lựa chọn chiến lược trong sản xuất
