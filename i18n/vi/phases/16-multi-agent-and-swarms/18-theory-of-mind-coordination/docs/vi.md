# Lý thuyết của tâm trí và sự phối hợp hiện tại

> Li et al. (arXiv:2310.10701) 表明,合作型文本游戏中的 LLM đại lý 会表现出**涌现式高阶 Theory of Mind**(ToM)                                                                                                                                                                                                                                                             **只有**ToM-quan 条件 sẽ tạo ra sự phân bổ và hướng mục tiêu liên quan đến danh tính; LLM năng lực thấp chỉ biểu hiện sự xuất hiện giả mạo.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Giai đoạn 16 · 07 (Xã hội tâm trí và tranh luận), Giai đoạn 16 · 17 (Các tác nhân tạo)
**Time:** ~75 minutes

## 问题

đa đại lý 协调 thường trông rất kỳ lạ: đại lý 分工、预判彼此、避免重复── thường sự xuất hiện này là sản phẩm của kỹ thuật nhanh  Người ta nói với đại lý phải  phối hợp──移除 prompt,协调也随之消失──

Riedl 2025 phát hiện nghiêm ngặt hơn: trong điều kiện được kiểm soát, chỉ khi các đại lý được yêu cầu đưa ra quyết định**其他 agents 的 minds**(ToM) 时,协调才会涌现. Không có ToM prompt, ngay cả các mô hình mạnh cũng sẽ xuất hiện không thể thông qua thống kê kiểm soát của mô hình phối hợp.

本课把 ToM 视为一种具体能力 (论论信仰的信念), xây dựng một trung tâm ít nhất ToM- nhận thức,并测量 sự khác biệt giữa sự phối hợp thực sự và nhanh chóng sửa đổi biểu tượng.

## 概念

### ToM là gì

发展心理学:3 岁儿童认为任何人的内在世界都与自己一致──5 岁儿童理解他人有不同信仰──7 岁儿童会推论关于信仰的信念──她认为我认为球在杯子下面)──这些分别是零阶段,一阶段和二阶段 ToM──

Đối với các đại lý LLM, ToM 阶 số đối phó là:

- **Zeroth-order:**Không có mô hình của người khác. Chỉ dựa trên hành động quan sát của mình.
- **First-order:**- Không, không, không. - Không, không.
- **Second-order:**Alice tin rằng Bob tin X.

Li et al. 2023 phát hiện ra, giai đoạn 1 và giai đoạn 2 ToM sẽ xuất hiện trong các đại lý LLM trong trò chơi hợp tác, nhưng sẽ trôi qua theo chân trời dài và không thể tin cậy và trở nên kém.

### Thử nghiệm Sally-Anne 简述

Một bài kiểm tra niềm tin sai lầm năm 1985: Sally đặt một viên viên ngọc vào hộp A, sau đó rời đi.

Các chương trình LLM thời GPT-4 có thể được thông qua trong các bài kiểm tra kiểu Sally-Anne được đề xuất trực tiếp. Khi câu chuyện dài, tình huống thay đổi nhiều lần, hoặc vấn đề được diễn tả gián tiếp, chúng sẽ thất bại.

### Riedl's coordonnêmesure

Riedl (arXiv:2510.05174) 构建一个群体规模测试:N 个代理,一个合作目标,可变快速条件――测量:

1. **Identity-linked differentiation.**Các đại lý có phải là theo thời gian hình thành một vai trò ổn định phân biệt?
2. **Goal-directed complementarity.**hành động của các đại lý có phải là sự bổ sung khác nhau của nhiệm vụ), thay vì lặp lại?
3. **Higher-order synergy.**Một thước đo thống kê, để quyết định liệu nhóm có đạt được kết quả mà bất kỳ tập hợp nào không thể đạt được hay không.

Kết quả: Chỉ trong điều kiện ToM prompt, ba chỉ số mới có thể tạo ra các tín hiệu cao hơn đường cơ sở. Không có ToM prompt, chỉ số của mô hình năng lực trung bình gần như xảy ra.

### 协调幻觉

Không có kiểm soát thống kê, sự phối hợp nổi bật trong các bản demo thường phản ánh:

- Công nghệ nhanh 把协调内置进去( hệ thống yêu cầu 写着一起工作)
- 观察者偏差 (我们会看到自己期待的模式)
- Sự việc sau sự lựa chọn thành công.

Nếu hệ thống sản xuất tuyên bố sự phối hợp mới trong tình trạng không có tín hiệu có thể xác định, nên xem nó như là tiếp thị.

### Một đại lý ít nhất biết về TM

结构:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

`other_models`属性就是 ToM trạng thái.`other_models[i][other_models_of_j]` Tôi nghĩ là đại lý tôi nghĩ là đại lý tôi tin gì.

### Tại sao đường chân trời dài sẽ bị tổn thương

Li et al.  ghi lại: giới hạn ngữ cảnh sẽ dẫn đến các đại lý  quên đi những niềm tin thuộc về ai.

论文和 2024-2026 后续研究中记录的缓解方式:

- **在 prompt 中显式写出 ToM state.**结构化格式:`{agent_id: belief_list}`❖ Cung cấp bắt buộc ❖
- **更短的 reasoning chains.**Mỗi lần cập nhật ToM ít hơn có thể làm giảm ảo giác.
- **外部 ToM store.**Trong bối cảnh LLM  ngoài mô hình bảo trì; mỗi vòng chỉ nhập vào các phần liên quan.

### ToM trong sản xuất trong sản xuất sẽ thất bại

- **Adversarial settings.** Những người có công tác tốt hơn dễ bị thao túng hơn.
- **Heterogeneous teams.**Khi mô hình khác nhau, áp dụng cho mô hình ToM của đối thủ không sẽ phổ biến.
- **Ground-truth-dependent tasks.**Để n quan tâm đến niềm tin; nếu sự chính xác phụ thuộc vào sự thật, để n có thể phân tán sự chú ý.

### Bạn thực sự có thể đo lường phối hợp

判断团队协调是真实的,而不是快速修改的三个实用信号:

1. **Complementarity over time.**Trong nhiệm vụ đa lượt, hành động của các đại lý có bao gồm không chồng lên các nhiệm vụ phụ không?
2. **Anticipation.**Hành động của đại lý A trong lượt T+1 có phụ thuộc vào dự đoán của hành động của B trong T+2 và dự đoán sau đó được chứng minh là đúng không?
3. **Correction.**Khi A trong lượt T 误读 B của niềm tin, A có phải trong lượt T + 2 trước sửa chữa?

Tất cả những điều này đều được đo lường trong hệ thống đa đại lý của cuốn nhật ký.


```figure
sw-theory-of-mind
```

##  xây dựng nó

`code/main.py`实现:

- `ToMAgent` Theo niềm tin của chính mình và mô hình niềm tin của mỗi đại lý khác.
- Một nhiệm vụ hợp tác: ba đại lý phải thu thập ba mã thông báo từ ba hộp; mỗi hộp chỉ có thể chứa một mã thông báo.
- 两种配置:`zeroth_order`(无 ToM) và `first_order`(Tình hình của một tầng niềm tin)
- Trong 200 lần thử nghiệm tự động 上测量: hoàn thành tỷ lệ, tỷ lệ lặp lại tỷ lệ, hai đại lý  mục tiêu cho cùng một hộp)

运行:

```
python3 code/main.py
```

预期输出: các đại lý lệnh không sẽ làm việc với tỷ lệ tái nỗ lực khoảng 35% và hoàn thành khoảng 60% thử nghiệm trong 10 vòng.

## Sử dụng nó

`outputs/skill-tom-auditor.md`là một kỹ năng, được sử dụng để kiểm toán hệ thống đa đại lý cho các tuyên bố về sự phối hợp mới.

##  phát hành nó

协调声明 danh sách kiểm tra:

- **Control condition.**Hệ thống của bạn đã bỏ qua phối hợp nhanh 后版本──两者都必须测量──
- **Statistical test.**Trên chỉ số của bạn, hệ thống và sự khác biệt trong kiểm soát có trong `p < 0.05`- Có gì đáng chú ý không?
- **Complementarity measure.**随着时间的行动不重叠性,而不仅仅是最终成功.
- **Failure-case log.**Khi các nhân viên phối hợp thất bại, tình trạng của chúng ta là gì?
- **Model-capacity disclosure.**Nếu hiệu quả trên mô hình nhỏ hơn biến mất, hãy rõ ràng.

## 练习

1. 运行 `code/main.py`❖ xác nhận một giai đoạn ToM sẽ giảm tỷ lệ lặp lại khoảng 7 lần.
2. 实现二阶 ToM(agent A 建模 B 如何看待C) ・・・ nó có tốt hơn một阶级?
3. Đến với tiểu bang vào một lần **hallucination**Mỗi vòng có thể thay đổi một niềm tin.
4. 阅读 Li et al. (arXiv:2310.10701)。复现长视线降低发现:当轮数从10 增加到30 时,你的一阶 ToM 性能如何变化?
5. 阅读 Riedl 2025 (arXiv:2510.05174) ―― trong mô hình của bạn để đạt được các thống kê đồng bộ cấp cao hơn―― không có ToM prompt 条件时, hiệu quả này có tồn tại không?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Theory of Mind | “理解他人的 minds” | 建模另一个 agent 信念的能力。按阶数分级（0、1、2+）。 |
| Sally-Anne test | “false-belief test” | 1985 年发展心理学；LLMs 能通过简单版本，但会在复杂版本失败。 |
| First-order ToM | “A believes X” | 建模一个他人关于事实的信念。 |
| Second-order ToM | “A believes B believes X” | 更深一层的递归建模。 |
| Identity-linked differentiation | “随时间保持稳定角色” | Riedl 的指标：角色持续存在，而不是随机。 |
| Goal-directed complementarity | “不重叠行动” | agents 目标指向不同子任务，而不是同一个。 |
| Higher-order synergy | “群体超过任何子集” | Riedl 用于真实协调的统计度量。 |
| Coordination illusion | “看起来协调” | 没有可测信号的 prompt 修饰式协调表象。 |

## 延伸阅读

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) 合作游戏中的涌现式 ToM;nguyên tắc thất bại trong đường chân trời dài
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) 群体规模测量;Từ khi thúc đẩy là chịu nặng điều kiện
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) ToM 概念在 1978 年的起源
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/) Sally-Anne 论文(1985)
