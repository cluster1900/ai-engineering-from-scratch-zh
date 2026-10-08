# 角色专业化  Kế hoạch viên, phê bình, thực thi viên, kiểm tra viên

> Sự phân hủy đa đại lý phổ biến nhất năm 2026: một đại lý chịu trách nhiệm lập kế hoạch, một thực hiện, một phê bình hoặc xác nhận.`Code = SOP(Team)` ChatDev (arXiv:2307.07924) 通过"chat chain" 串联设计师、程序员、评论员、测试员,并使用"communicative dehallucination"(agents 明确请求缺失细节)  Verifier 是承重角色:Cemri et al. (MAST, arXiv:2503.13657) 表明, mỗi đa-agent 失败 có thể bắt nguồn từ sự mất mát hoặc bị hỏng của xác minh  PwC 报告称, trong CrewAI sử dụng vòng xác thực cấu trúc 后,准确率提升10% 7×( → 70%) 

**类型：**Học + xây dựng
**语言：**Python (stdlib)
**先修：**Giai đoạn 16 · 04 (Tình mẫu sơ khai), Giai đoạn 16 · 05 (Nhà giám sát)
**时间：**~ 60 phút

## 问题

Hệ thống đa đại lý sẽ sản xuất ra kết quả chung. Ba bộ lập trình trong nhóm sẽ viết ra ba loại mã bình đẳng. Bạn có thể thêm nhiều đại lý, thêm nhiều vòng, nhưng vẫn không thể vượt qua các cửa hàng chất lượng.

修复方法 không phải là nhiều đại lý, mà là các đại lý khác nhau.  phân bổ các vai trò khác nhau. 给Critic 配备 Planner 没有工具. 给Verifier một bộ thử nghiệm khách quan.

## 概念

### 4 vai trò của giáo phái

**Planner.**阅读目标,产出步列或 spec――Tools:knowledge retrieval、docs──Output:structured plan──

**Executor.**Một lần đọc một bước kế hoạch, sản xuất tạo vật.

**Critic.**根据 Planner 的意图审阅执行人的输出──工具:对文物的仅读访问、静态分析──输出:接受/拒绝,并给出原因──

**Verifier.**读取 artefact 并运行确定性检查──Tools: test runner、type checker、schema validator──Output:pass/fail,并附证──

Phân tích là chủ quan, có quan điểm, thường dựa trên LLM.

### Mô hình SOP của MetaGPT

MetaGPT (arXiv:2308.00352) sẽ thiết kế phần mềm SOP 编码为角色提示:

- **Product Manager**编写 PRD。
- **Architect**产出 hệ thống thiết kế:
- **Project Manager**拆分任务――
- **Engineer**实现──
- **QA Engineer**运行 thử nghiệm.

Mỗi vai trò đều có một quy trình đầu vào/phục xuất nghiêm ngặt.`Code = SOP(Team)`Sự biểu diễn này có nghĩa là: SOP xác định sẽ biến một tập hợp LLM thành một đường ống dự đoán.

### ChatDev của giao tiếp dehallucination

ChatDev  thêm một động tác quan trọng: khi người thực thi cần kế hoạch không có chi tiết cụ thể trong đó, nó sẽ tiếp tục rõ ràng hỏi thiết kế.

实现方式:role prompt 包含当你需要未被提供具体信息时,在产出输出 之前按名称询问相关角色──

### Tại sao Verifier quan trọng nhất

Cemri et al. (MAST) đã theo dõi 1642 sự thất bại trong việc thực hiện đa đại lý. Trong đó, 21,3% là lỗ hổng xác minh. Hệ thống đã giao một câu trả lời không ai kiểm tra.

PwC  báo cáo称(CrewAI triển khai, 2025), tham gia vòng xác thực cấu trúc ế, tỷ lệ xác thực tăng từ 10% 提升到70%── một vai trò 带来 7× 提升──

### Đánh giá đối với xác minh

- Phân tích là xem xét các tác phẩm chất lượng LLM.
- Verifier là một hành động trên các thủ công xác định.

两者都用──Critic 能捕捉 Verifier 无法表达的品味问题──Verifier 能捕捉 评论 看不到的 bug, vì những lỗi này chỉ xuất hiện trong thời gian chạy──

### 反模式

Mỗi vai trò trong hệ thống đều là LLM, và mỗi vai trò đều là "có vẻ tốt với tôi". Đây là chế độ thất bại MAST cổ điển.

### Bản đồ khung

- **CrewAI** `Agent(role, goal, backstory)`là bề mặt chuyên môn điển hình.
- **LangGraph** các nút có thể có các lời nhắc chuyên dụng; cạnh 强制执行管道。
- **AutoGen** Trong GroupChat 中使用带单词名称的角色特定的可交谈的代理子──
- **OpenAI Agents SDK** 在角色专业代理 之间使用交付工具──


```figure
swarm-roles
```

## 构建

`code/main.py`实现 một đường ống 4 vai trò để xây dựng chức năng Python đơn giản:

- **Planner**产出 spec:
- **Executor**生成 mã chuỗi.
- **Critic**(LLM-simulated) 标记明显问题──
- **Verifier**Trong hộp cát`exec`) trong trường hợp thử nghiệm 运行生成的代码──

Demo 运行两次:一次执行器 产出正确代码(Critic + Verifier 都通过),一次执行器 产出偏离规范的代码(Critic 漏掉 bug,因为它看起来合理;Verifier 捕捉到 bug,因为测试 失败)

运行:

```
python3 code/main.py
```

## 使用

`outputs/skill-role-designer.md`接收一个任务,并产出角色名单 (rôle)  3-5 个角色)  每个角色的输入/输出方案,以及验证器检查──在把代理 接入框架 之前使用它──

## 交付

Danh sách kiểm tra:

- **至少一个确定性 Verifier。**Không phải là LLM.
- **每个 role 都有明确 I/O schema。**Planner 返回 spec, chứ không phải prose;Executor 读取该 schema。
- **Communicative dehallucination。**Khi thông tin bị thiếu, Nhà điều hành phải hỏi kế hoạch viên; tuyệt đối không được xây dựng.
- **Critic/verifier 顺序。**先运行 Critique (đặc biệt là: 便宜, bắt đầu các vấn đề thiết kế),再运行 Verifier (được kiểm tra)
- **Loop budget。**Trong nâng cấp cho con người 之前, tối đa 2 vòng phê bình-hành động sửa đổi.

## 练习

1. 运行 `code/main.py`, observer Verifier 如何捕捉批评漏掉的 bug──添加一个静态分析检查(统计 `return`(đáng ra số lần) như là một kiểm tra viên bổ sung. Nó có thể nắm bắt đến runtime test.
2. 添加第 5 个角色:"Điều kiện phân tích",把用户愿望转换为Planer-ready spec―― những yêu cầu giải ảo giác giao tiếp nào 应该向上流向它?
3. 阅读 MetaGPT Phần 3 ("Hội tác") ――列出 MetaGPT 5 个角色中每个角色的输入/输出方案──
4. 阅读 ChatDev's chate-chain diagram(arXiv:2307.07924 Hình 3)  nhận ra sự mất ảo giác giao tiếp 在哪里打断一个本来会无限持续的循环──
5. Phân tích 7x  độ xác thực của PwC tăng từ vòng xác minh. giả định ba thêm Verifier cũng không giúp đỡ các nhiệm vụ. Trong những nhiệm vụ này, kiểm tra tính xác thực không thể hoặc chi phí cao đến không thể chấp nhận.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | 针对 Planner/Executor/Critic/Verifier roles 调优的不同 system prompts。 |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT 的 framing：每个 role 的严格 I/O schemas 将 team 转换为 pipeline。 |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern：当细节缺失时，Executor 会询问 Planner，而不是自行编造。 |
| Critic | "LLM reviewer" | 主观、有观点的 reviewer。捕捉品味问题。可能被看似合理的 prose 欺骗。 |
| Verifier | "Deterministic check" | 基于 code 的 pass/fail。Test runner、type checker、schema validator。不会被欺骗。 |
| Verification gap | "No one checked" | MAST failures 的 21.3%。答案在没有能捕捉 bug 的 check 的情况下被交付。 |
| Revision loop | "Critic sends it back" | Critic rejection 会触发 Executor 带 feedback 重新运行。需要 budget。 |
| All-LLM anti-pattern | "Looks good to me" | 每个 role 都是 LLM，没有确定性 check。经典 MAST failure。 |

## 延伸阅读
- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) SOP-as-role-prompt 参考论文
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) chuỗi trò chuyện + sự giải ảo thông tin
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Định dạng phân loại MAST;Các khoảng trống kiểm tra chiếm 21,3% các thất bại
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) bề mặt đặc điểm vai trò sản xuất
