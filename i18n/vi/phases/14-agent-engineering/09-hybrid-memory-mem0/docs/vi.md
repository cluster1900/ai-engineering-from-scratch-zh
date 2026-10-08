# Tưởng nhớ lai: Vector + Graph + KV (Mem0)

> Mem0 (Chhikara et al., 2025) sẽ xem trí nhớ như ba dòng lưu trữ: Vector dùng để ngữ义相似性, KV dùng để nhanh chóng thực tế tìm kiếm, Graph dùng để lý luận về quan hệ thực tế.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## Học mục tiêu
- 解释 tại sao một bộ nhớ đơn lẻ chỉ có vector, chỉ có graph, chỉ có KV không đủ để hỗ trợ đại lý  nhớ.
- Nói về ba bộ nhớ lưu trữ cùng, cũng như mục tiêu tối ưu hóa mỗi bộ nhớ.
- Mô tả Mem0 của sự kết hợp đánh giá: liên quan, tầm quan trọng, gần hạn, và giải thích tại sao nó là tăng cường và, chứ không phải là cấu trúc cấp bậc.
- Sử dụng một bộ nhớ lưu trữ, trong đó có một`add()`写入全部三个存储,`search()`Kết quả kết hợp

## 问题
Đối với một trong ba loại truy vấn, một bộ nhớ tổng thể xuất hiện:

- **语义相似性**                                                                                                                                                                                                                                                              
- **事实查找**  người dùng's điện thoại số là gì? KV 胜出; Dòng 浪费资源, đồ thị  quá phức tạp.
- **关系推理**                                                                                                                                                                                                                                                              

Các đại lý trong môi trường sản xuất sẽ phát hành tất cả ba loại truy vấn trong cùng một phiên. Một bộ nhớ lưu trữ duy nhất về hai loại trong đó là không phù hợp.`add`- Không.`search`表面后,并用评分函数融合它们──

## 概念
### 三个并行存储

Mem0 (arXiv:2504.19413, tháng 4 năm 2025)`add(text, user_id, metadata)`时:

1. Từ văn bản中提取候选事实 (một bước dẫn dắt của LLM)
2. 将每个事实写入 Vector store (trình tích hợp) được sử dụng để tìm kiếm ngữ义.
3. 将每个事实写入 KV store,以 (user_id, fact_type, entity) 为关键,用于 O(1) 查找。
4. Để mỗi sự kiện được đánh dấu như cạnh 写入 Graph store (Mem0g), dùng để truy vấn liên quan.

Trong `search(query, user_id)`时:

1. Khoan khoan vector 按 Nhập cosine 返回 top-k。
2. KV store 返回基于查询派生的 (user_id, type, entity) key 的直接命中──
3. Chỗ lưu trữ đồ họa  quay lại từ thực thể truy vấn đến phụ đồ
4. Một phân tích kết hợp.

### Điểm số hợp nhất

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性** Vêct cosine KV 精确匹配 图路重──
- **重要性** Trong thời gian viết 打标签或学习得到 (((某些事实更重要:姓名、ID、政策)
- **近期性**   giảm chỉ số dựa trên khoảng cách thời gian viết hoặc đọc lần trước.

权重按产品调优──聊天代理 使用更高的 `w_recency`; hợp pháp đại lý 使用更高的 `w_importance`; kiểm tra đại lý 使用更高的 `w_relevance`

### Mem0g và lý luận thời gian

Mem0g  tăng cường máy kiểm tra xung đột. Khi những sự kiện mới và những sự nghịch ng ngẫu nhiên hiện có, những sự nghịch ngẫu nhiên hiện có sẽ được đánh dấu là không hiệu lực, nhưng sẽ không bị xóa.

Đây là mô hình vô hiệu hóa của Letta và là hành vi theo quy định của nó.

### Số điểm chuẩn

Mem0 paper 报告了以下结果(2025):

- **LoCoMo**(长篇对话记忆): 91.6
- **LongMemEval**(长时间跨度 ký ức tập thể): 93.4
- **BEAM 1M**(1M-token 记忆 chuẩn): 64.1

Đối với các đường cơ sở (full-context 128k LLM, Flat Vector Store, Flat KV) đều bị rơi sau 10+ 分── chỉ dựa trên điểm tham khảo không thể chứng minh lựa chọn hợp lý, hình thức vận hành chỉ là quan trọng, nhưng những mô tả kỹ thuật số này về sự kết hợp thiết kế không phải là một sự nhầm lẫn──

### Định dạng phân loại phạm vi

Mem0 按范围 划分记忆:

- **用户记忆** 跨会议 持久化,以 `user_id`- Chìa khóa.
- **Session 记忆** Trong một chuỗi trong suốt.
- **Agent 记忆** Tình trạng của mỗi trường hợp đại lý

Mỗi lần viết vào bạn sẽ chọn một phạm vi. Tìm kiếm có thể sử dụng quyền vượt qua phạm vi của mỗi phạm vi. Tìm kiếm. Không nghĩ về các phạm vi hỗn hợp.

### Mô hình này dễ dàng xuất hiện ở nơi

- **Embedding drift.**Kết quả vector trong 100 lần truy vấn trước trông đúng, nhưng sẽ theo dõi sự tăng trưởng và giảm đi.
- **KV schema creep.** `(user_id, type, entity)`Nhìn như đơn giản, cho đến khi mỗi đội gia nhập riêng của mình.`type`◊ Mỗi kỳ kiểm toán loại 集合。
- **Graph explosion.**Một máy thu âm mỗi tin nhắn  thêm 50 条 cạnh  hạn chế mỗi lần `add`调用图 写入数;丢弃低置信度边缘──


```figure
ae-memory-fusion
```

##  xây dựng nó
`code/main.py`Sử dụng sdlib 实现三存储模式:

- `VectorStore` 用朴素符号重叠相似之作为 嵌入 替代之作为 嵌入 替代之作为 嵌入 替代之作为
- `KVStore` 以 `(user_id, fact_type, entity)`Vì điều quan trọng.
- `GraphStore` các cạnh được đánh dấu ((thể, mối quan hệ, đối tượng, hợp lệ)
- `Mem0` 顶层 mặt tiền,包含 `add()``search()`、 điểm kết hợp và thu thập thông tin về phạm vi.
- Một người dùng nhiều lần, nhiều phiên để theo dõi toàn bộ các cuộc trò chuyện.

运行:

```
python3 code/main.py
```

输出会显示三条独立回忆路,以及融合后的顶-k――修改 `main()`Đánh nặng điểm trên, xem xếp hạng thay đổi như thế nào.

## Sử dụng nó
- **Mem0 (Apache 2.0)** 生产就绪──可用 Postgres + Qdrant + Neo4j 自托管, cũng có thể sử dụng đám mây quản lý──
- **Letta** 三层 core/recall/archival;自带 Vector 和 Graph backends。
- **Zep** 商业替代方案,带时间 KG 和 fact extraction──
- **Custom builds** Khi bạn cần phải kiểm soát chính xác đối với các chất thu hút (合规) hoặc trọng lượng hợp nhất (fusion)

## 交付 nó
`outputs/skill-hybrid-memory.md`Sẽ tạo ra một bộ nhớ bộ nhớ, trong đó kết nối với điểm số kết hợp, phân loại phạm vi và vô hiệu hóa thời gian.

## 练习
1. 将玩具级向量相似性 替换为真实嵌入模型 ((句子变换器、Ollama、OpenAI嵌入) ⋅在合成长对话上测量 recall@10──排名会在 1000 次写入后漂移 ⋅
2. 添加时间查询:`search(query, as_of=timestamp)` chỉ quay lại các hồ sơ đã có hiệu lực trong thời gian này hoặc trước đó                                                                                                                                                                                                                                                     
3. 实现冲突检测器: If传入事实与图边 矛盾,无效 旧边,并同时记录两者──在 user lives in Berlin -> user lives in Lisbon 上测试──
4. 扩展 hợp nhất điểm số,加入 `user_feedback`维度(对检索记录 点赞) ――你怎么防止游戏(agent只返回它已经喜欢的记录)?
5. 阅读 Mem0 docs (`docs.mem0.ai`                                                                                                                                                                                                                                                              `mem0`Các cuộc gọi của khách hàng. Trong 20 cuộc hỏi thử nghiệm trên cùng một.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hybrid memory | “Vector plus graph plus KV” | 三个并行写入的存储，在检索时融合 |
| Fact extraction | “Memory ingestion” | 将文本拆解为 (entity, relation, fact) tuples 的 LLM 步骤 |
| Fusion scoring | “Relevance ranking” | 相关性、重要性、近期性的加权和 |
| Scope | “Memory namespace” | user / session / agent，决定谁能看到什么 |
| Mem0g | “Memory graph” | 带时间有效性的 typed edges，用于关系查询 |
| Temporal invalidation | “Soft delete” | 将矛盾 edges 标记为 invalid；绝不删除 |
| Embedding drift | “Retrieval rot” | Vector 质量随 corpus 增长而下降；周期性 re-embed |

## 延伸阅读
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) Bảng giấy nguyên thủy
- [Mem0 docs](https://docs.mem0.ai/platform/overview) 生产 API, SDK, quản lý đám mây
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) ngữ cảnh ảo 前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Thiết kế 3 tầng
