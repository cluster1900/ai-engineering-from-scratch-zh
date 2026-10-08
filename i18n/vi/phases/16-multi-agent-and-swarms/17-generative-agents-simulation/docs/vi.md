# Các đại lý tạo ra với xu hướng

> Park et al. 2023 (UIST '23, arXiv:2304.03442) 用三部分架构填充了 **Smallville**, một hộp chứa 25 đại lý:**memory stream**(自然语言日志)**reflection**(đại diện dựa trên dòng chảy sinh sản của các tầng cao hơn)**plan**(日级行为,然后是子计划) ―― kết quả là sự xuất hiện của bữa tiệc Ngày Valentine: một đại lý bị trồng  muốn tổ chức bữa tiệc Ngày Valentine, không có kịch bản nào khác, đã tạo ra lời mời truyền bá trong nhóm, phối hợp ngày, và cuối cùng tổ chức bữa tiệc từ 24 người bắt đầu với sự không biết về đại lý này.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Giai đoạn 16 · 04 (Mô hình sơ khai), Giai đoạn 16 · 13 (Tưởng thức chia sẻ)
**Time:** ~75 minutes

## 问题

Hầu hết các hệ thống đa đại lý đều là một nhóm có quy trình nghiêm ngặt: lập kế hoạch, lập trình lập trình, viết mã, đánh giá, kiểm tra. Điều này có thể được sử dụng để xác định nhiệm vụ rõ ràng. Nó không thể nắm bắt được như một đại lý.

Smallville 架构就是它的基准. Trước Park 2023, tốt nhất đại lý 模拟是浅层脚本跟随者; sau đó, mô hình này trở thành cấu trúc mặc định của Generative Agents trên thế giới mở. Nếu bạn sử dụng 3 thành phần của Smallville 模拟, hoặc cần phải giải thích rõ ràng tại sao không sử dụng.

## 概念

### 3 thành phần

**Memory stream。**Một chỉ thêm quan sát, động tác, suy nghĩ và kế hoạch 日志── mỗi bài có thời gian, kiểu, mô tả ([[lời tự nhiên]]) và dữ liệu sinh học:**recency****importance**(truyền cho tự đánh giá 1-10)**relevance**(Tương tự như các câu hỏi hiện tại)

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Khám phá bộ nhớ 组合三个分数:`score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`✿Top-k 条目 vào trong hiện tại prompt✿

**Reflection。**周期性地(每 N 条记忆或发生重要事件时),agent Từ gần đây 记忆 生成更高阶综合──反思 条目会写回流,并像其他记忆一样可检查──这是代理 构建理解的方式,也就是该架构中长期信念的等价──

**Plan。**自顶向下分解──首先是粗略的日级计划(去工作,吃晚饭与 Klaus)──然后是小时级计划──再是动作级计划──计划可以修改:当观察与计划 矛盾时,agent 会重新规划受影响的片段──

### Tại sao ba điều quan trọng nhất là

Park et al. đã làm phân biệt bỏ bỏ quan sát, phản ánh và kế hoạch của các sự trừu tượng.

- Không có gì**observation**, đại lý sẽ bị lỗi trên văn bản, và dựa trên hành động của niềm tin của mình.
- Không có gì**reflection**, đại lý không thể hình thành niềm tin cao hơn; giao tiếp sẽ dừng lại ở tầng thấp.
- Không có gì**plan**, hành vi sẽ trở thành tiếng ồn phản ứng; mục tiêu sẽ tiêu diệt.

Số điểm đáng tin cậy của người đánh giá được đưa ra trong ba thành phần cao nhất; loại bỏ bất kỳ thành phố nào sẽ tạo ra sự phân hủy có thể đo lường.

### Ngày Valentine của xu hướng

Một đại lý, Isabella Rodriguez, được đặt mục tiêu muốn tổ chức bữa tiệc ngày Valentine tại Hobbs Cafe vào ngày 14 tháng 2 lúc 5 giờ chiều.

1. Kế hoạch của Isabella bao gồm mời người khác.
2. Mỗi lần mời đều trở thành một quan sát trong dòng lưu niệm của hàng xóm.
3. Sự suy nghĩ của người láng giềng sinh ra niềm tin: Isabella đang tổ chức một bữa tiệc.
4. Kế hoạch của hàng xóm  vào dự bữa tiệc vào ngày 14 tháng 2
5. Lần này, người hàng xóm nói với người hàng xóm khác.
6. 2月14日下午 5 点, một số đại lý  tập hợp tại Hobbs Cafe

Đây là xu hướng trên nghĩa kỹ thuật: hệ thống cấp hành vi (một派对) từ giao tiếp địa phương (một bên mời + một bên mời) mà không có một dàn nhạc trung ương (một bên tổ chức).

### 文档记录的失败模式

Park et al. 明确 ghi lại:

- **空间规范错误。**Trưởng thức ăn trong phòng ăn không phù hợp. Mô hình không thể chỉ từ môi trường xác định quy tắc xã hội-physics.
- **Memory overflow。**️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
- **Reflection hallucination。**Nhận thức có thể tạo ra dòng nhớ 中不存在的关系──缓解方式: trong phản chiếu prompt 中包含源存储 id,并在检索时验证──

Đây là những mô hình thất bại liên quan đến sản xuất: bất kỳ đại lý nào trong năm 2026 sẽ kế thừa chúng.

### 三组件 thực hiện quy tắc

1. **Memory 是 append-only。**永远不要修改记忆 条目――更正是新条目――
2. **Importance 分数要便宜。**写入时调用 LLM 评估 1-10 của tầm quan trọng.
3. **Retrieval 是排序，不是过滤。**按组合分数取 Top-k; đừng sử dụng máy cứng 过器 (will lose on the following)
4. **Reflection 周期性运行。**Khi chưa xử lý ý tưởng tầm quan trọng 总和超过值时触发(ví dụ 150)。
5. **Plans 可以修订。**Khi quan sát mới và kế hoạch 矛盾, chỉ tái tạo các đoạn ảnh hưởng, chứ không phải toàn bộ kế hoạch.

### Các đại lý tạo ra ngoài Smallville

Các tài liệu tiếp theo trong năm 2024-2026 mở rộng cấu trúc này:

- **用于政策 / 市场研究的 multi-agent 社会模拟。**类 Smallville 群体模拟用户对功能的行为响应──比A/B test更快; sự chính xác vẫn còn tranh cãi──
- **游戏中的 NPC AI。**Với một điệp viên Smallville, RPG sẽ tạo ra một dòng truyện nổi lên, chứ không phải là nhiệm vụ biên kịch.
- **Generative-agent 评估基准。**Chỉ số không còn là tỷ lệ xác thực nhiệm vụ, mà là độ tin cậy trong quá trình dài hạn + sự phù hợp hành vi.

Các cấu trúc này là tiêu chuẩn tham khảo.

### Tại sao điều này rất quan trọng đối với kỹ thuật đa đại lý

Smallville là chứng minh khái niệm: khi các bộ phận chính xác, đa đại lý 涌现可以很便宜.**emergent social behavior**Hệ thống sản xuất đều sử dụng hình dạng này.**tight task execution**系统都会使用本阶段 前面介绍的 giám sát viên / vai trò / nguyên thủy 模式。


```figure
a5-memory-reflection
```

##  xây dựng nó

`code/main.py`Sử dụng các chính sách của Python và văn bản hóa đại lý không có thực LLM) thực hiện ba thành phần.

- `MemoryStream` 带 更新/重要/相关性检索的附加日志──
- `reflect(stream)` Nhận thức về những ký ức quan trọng gần đây
- `plan(agent_state)` 基于当前信念的日级和小时级计划──
- 场景:5 个代理――Agent 1 以抛派对在下午5开始―― 在模拟 tick 中,邀请传播,agent 聚集――

运行:

```
python3 code/main.py
```

预期输出: từng dấu vết tick. Đến dấu chấm cuối cùng,5 đại lý trong số ít nhất 3 trong kế hoạch xuất hiện bên, và chúng tập hợp đến vị trí của bên.

## Sử dụng nó

`outputs/skill-simulation-designer.md` thiết kế mô phỏng đại lý sinh hoạt: đại lý số lượng, sơ đồ nhớ, tần suất phản xạ, chân trời kế hoạch và métric đánh giá

##  phát hành nó

生产模拟规则:

- **Memory 就是数据库。**Trong quy mô, bạn chọn thực tế lưu trữ (Vektor DB, Postgres)
- **记录 retrieval trace。**Đối với mỗi hành động, ghi lại động lực của nó trí nhớ top-k. Đó là khả năng debug của bạn.
- **为每个 agent 预算 tokens。**Mỗi tick 中 mỗi đại lý của thu hồi + phản ánh + kế hoạch là O(k) LLM gọi;;N đại lý × T ticks × gọi-per-tick 可能压预算。
- **周期性 compact memory。**Kết luận-và-đặt 低重要性 条目。 Chính sách giữ lại là quyết định thiết kế, không phải细节。
- **显式检测空间 / 社会规范违规。**Các kiến trúc sẽ học được chúng.

## 练习

1. 运行 `code/main.py`❖ xác nhận 3 + đại lý  họp bên ❖ đưa đại lý  tăng lên 10  xu hướng sẽ xảy ra?
2. 移除反思步骤──行为会是什么样样?映射到Park 2023 中的放弃 发现──
3. Klaus muốn nói chuyện nghiên cứu lúc 5 giờ chiều.
4. 添加空间约束: Hobbs Cafe 最多容纳 4 đại lý...模拟会优雅处理溢出,还是会击中单人浴室失败模式?
5. 阅读 Park et al. (arXiv:2304.03442) Phần 6 (Phác nghiệm hành vi mới)  Tìm ra một hành vi không thể tái hiện được của bạn  Bạn cần tăng cường thành phần nào trong cấu trúc?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Memory stream | “agent 的日记” | 观察、动作、reflection、plan 的 append-only 日志。 |
| Recency | “这条 memory 有多新” | 按年龄计算的指数衰减分数。 |
| Importance | “agent 有多在意” | 写入时自评 1-10。已缓存。 |
| Relevance | “与当前查询有多相关” | 余弦相似度（Embedding-based）。 |
| Reflection | “更高阶信念” | 从最近 memories 生成的综合，并作为新 memory 重新摄入。 |
| Plan | “日/小时/动作分解” | 自顶向下的 plan tree。当 observation 矛盾时可修订。 |
| Smallville | “Park 2023 的 sandbox” | 产生 Valentine's Day 涌现的 25-agent 模拟。 |
| Believability | “质量指标” | 人类评分者对行为是否像一个可信 agent 的评分。 |

## 延伸阅读

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) 参考架构
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) 发表场所
- [Smallville code release](https://github.com/joonspk-research/generative_agents) 参考 Python 实现
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) 结构 hóa các đại lý bộ nhớ
