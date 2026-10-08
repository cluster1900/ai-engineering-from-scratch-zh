# Skill库与终身学习 (Voyager)

> Voyager (Wang et al., TMLR 2024) sẽ được thực hiện như một loại kỹ năng.

**类型：**Xây dựng
**语言：**Python (stdlib)
**先修：**Giai đoạn 14 · 07 (MemGPT), Giai đoạn 14 · 08 (Letta Blocks)
**时间：**~ 75 phút

## Học mục tiêu

- Nói ra ba thành phần của Voyager: chương trình giảng dạy tự động, thư viện kỹ năng, nhắc lại, và mô tả vai trò của riêng mình.
- Giải thích tại sao Voyager sẽ chuyển động thiết kế không gian thành mã, chứ không phải là lệnh ban đầu.
- Sử dụng stdlib 实现一个支持注册,检查,组合和由失败驱动改进的技能库
- Để mô hình của Voyager được hiển thị cho đến năm 2026 Claude Agent SDK kỹ năng và skillkit sinh thái hệ thống.

## 问题

Mỗi phiên đều có khả năng xây dựng lại tất cả các đại lý, sẽ phạm 3 loại sai lầm:

1. **浪费 Token。**Mỗi nhiệm vụ sẽ được đưa ra lại cùng một lý thuyết.
2. **丢失进展。**phiên A 中学到的修正不会迁移到 phiên B。
3. **无法处理长程组合。**Các nhiệm vụ phức tạp cần cấp độ năng lực; một cú bắn nhanh chóng không thể thực hiện chúng.

Câu trả lời của Voyager là: sẽ xem mỗi khả năng tái sử dụng như một phần kho chứa trong kho tên mã trong kho, có thể thông qua tìm kiếm tương đồng, có thể kết hợp với các tập hợp kỹ năng khác, và thông qua thực hiện chống lại sự cải tiến liên tục.

## 概念

### 3 thành phần

Voyager (arXiv:2305.16291) 围绕以下内容组织代理:

1. **Automatic curriculum。**Do sự tò mò thúc đẩy người đề xuất sẽ dựa trên đại lý hiện tại
2. **Skill library。**Mỗi kỹ năng đều có thể thực hiện được các mã. Sau thành công của nhiệm vụ sẽ thêm một kỹ năng mới.
3. **Iterative prompting mechanism。**Khi thất bại, đại lý sẽ nhận được lỗi thực hiện, môi trường phản  và tự kiểm tra xuất, sau đó cải thiện kỹ năng này.

Minecraft 评估(Wang et al., 2024):相比基线,物品多独特 3.3 倍, đá công cụ 快 8.5 倍, sắt công cụ 快 6.4 倍,地图遍历距离长 2.3 倍──这些数字是 Minecraft 特定的,但模式可迁移──

### 动作空间 = 代码

Đại diện đa số 输出原始命令──Voyager 输出 JavaScript 函数──一个技能是:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

由子 Skill 组合而成──按描述 和 Embedding 作为关键存储──作为程序被检查,而不是作为提示──

Đó là kỹ năng SDK của Claude Agent năm 2026.

### Kỹ năng kiểm tra

新任务是tạo một cái đinh kim cương──

1. Để mô tả nhiệm vụ  thực hiện Embedding:
2. 查询 库 技能, lấy top-k 相似技能.
3. 检索 `craftIronPickaxe``mineDiamond``placeCraftingTable`Đúng vậy.
4. 用检索到的原语 + 新逻辑组合新技能──

Đây là phương pháp thực hiện các tài nguyên MCP (Phase 13) và kỹ năng SDK của Agent: tìm kiếm trên bề mặt kiến thức/kód,并限定在当前任务范围内.

### 代改进

Chuyển đổi của Voyager:

1. Trưởng phòng viết một kỹ năng.
2. Kỹ năng trong môi trường vận hành.
3. Trở lại:`success``error`(Bên theo dấu vết)`self-verification failure`
4. Trưởng sử dụng tín hiệu này như là kỹ năng viết lại trên.
5. Chuyển đến thành công hoặc đạt được số lượng vòng lớn nhất.

Đây là Self-Refine (Đọc 05) được sử dụng để tạo mã,并用环境落地验证;;CRITIC (Đọc 05) là cùng một mô hình, chỉ sử dụng các công cụ bên ngoài như là kiểm chứng.

### Chương trình học và khám phá

Các module chương trình học của Voyager sẽ dựa trên các đại lý đã có gì, chưa làm gì, đề xuất tương tự như xây dựng một nơi trú ẩn gần hồ  của nhiệm vụ.

Đối với đại lý sản xuất, điều này sẽ chuyển thành một what is missing operator: given current Skill 库 and a domain, we haven't covered which Skills?

### Phong cách này dễ dàng xuất hiện ở nơi

- **Skill library rot。**Cùng một kỹ năng được sử dụng với mô tả khác nhau 添加 10次──写入时添加重重;检索只返回一个──
- **Composed-skill drift。**Khả năng của cha phụ thuộc vào một Khả năng của con được cải tiến sau đó.
- **Retrieval quality。**随着 Skill 库 tăng lên đến vài trăm hơn, dựa trên mô tả Skill của Vector lấy lại 会退化。 dùng thẻ lọc 和硬约束补充( chỉ có kỹ năng với `category=tooling`) 


```figure
voyager-skills
```

##  xây dựng nó

`code/main.py`实现 một bộ phận kỹ năng:

- `Skill` tên, mô tả, mã, phiên bản, thẻ, phụ thuộc.
- `SkillLibrary` đăng ký, tìm kiếm, chồng chéo mã thông báo, tổng hợp, dựa trên các mục tiêu và tinh chỉnh,
- Một nhân viên viết kịch bản: đăng ký ba kỹ năng ban đầu, tập hợp thứ tư, gặp thất bại một lần, rồi cải thiện.

运行:

```
python3 code/main.py
```

trace 会展示库写入,检索,组合,一次失败执行,以及 v2 改进,也就是 Voyager 循环的端到端过程――

## Sử dụng nó

- **Claude Agent SDK skills**(Anthropic)  2026 参考: mỗi kỹ năng đều có mô tả、 mã và hướng dẫn; 在代理会议中按需加载。
- **skillkit**(npm: skillkit)  面向 32+ AI coding agents 的跨代理技能管理──
- **Custom skill libraries**  lĩnh vực cụ thể (ví dụ: kỹ năng SQL của đại lý dữ liệu  kỹ năng Terraform của đại lý thông tin) 
- **OpenAI Agents SDK `tools`** 低配版本; mỗi công cụ đều là Lightweight Skill。

## 交付 nó

`outputs/skill-skill-library.md`Sẽ tạo ra một bộ tài liệu kỹ năng hình dạng Voyager, cho bất kỳ mục tiêu chạy thời gian 接好注册,检查, phiên bản hóa và cải tiến.

## 练习

1.  Đưa `compose()`Thêm phụ thuộc vào vòng kiểm tra. Khi kỹ năng A phụ thuộc vào B, và B phụ thuộc vào A.
2. 实现每个技能的版本固定──当父技能组合子技能 `crafting@1`时,对 `crafting@2`n cải tiến không thể lặng lẽ nâng cấp kỹ năng của cha.
3. 将 token-overlap retrieval 替换为句子变换器嵌入式(或 BM25 stdlib 实现) ⋅ 在一个50Skill toy library 上测量 retrieval@5。
4. 添加一个课程代理:给定当前库和一个域名描述,提出 5 个缺失技能──每周调用一次──
5. 阅读 Anthropic's Claude Agent SDK kỹ năng docs. 将玩具图书馆 移植到 SDK's skill schema.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Skill | “可复用能力” | 带有 description 的命名代码块，可通过相似度检索 |
| Skill library | “agent 的 how-to 记忆” | Skill 的持久化存储，可搜索、可组合 |
| Curriculum | “任务 proposer” | 由当前能力缺口驱动的自底向上目标生成器 |
| Composition | “Skill DAG” | Skill 调用 Skill；执行时进行拓扑排序 |
| Iterative refinement | “自我修正循环” | Env 反馈 + 错误 + 自验证，会折回到下一个版本中 |
| Action-space-as-code | “程序化动作” | 输出函数，而不是原始命令，用于时间跨度更长的行为 |
| Dedup on write | “Skill collapse” | 近重复 description 会合并为一个 canonical Skill |

## 延伸阅读

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) 原始 Kỹ năng thư viện 论文
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) kỹ năng của 2026 产品化形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)  kỹ năng trong thực tế và các nhân viên
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651)Chuyển đổi của Voyager
