# 公平性标准  群体、个体、反事实

> 三个家族构成公平 文献的结构――Trong nhóm công bằng: sự bình đẳng dân số, tỷ lệ cược bình đẳng, sự chính xác sử dụng điều kiện, bình đẳng  2012):相似个体获得相似决策;对决策映射施加 Lipschitz điều kiện. 2017): Nếu trong tương phản thực tế địa sự thay đổi thuộc tính nhạy cảm khi quyết định giữ vững, thì đó là quyết định đối với cá thể là công bằng của.2024 kết quả lý thuyết(NeurIPS 2024):CF và chính xác  tồn tại trong trong thương mại; một phương pháp mô hình-nhận thức có thể chuyển đổi dự đoán tối ưu nhưng không công bằng thành dự đoán CF,并 làm cho sự mất chính xác có giới hạn.

**类型：**Học hỏi
**语言：**Python(stdlib,công so sánh ba tiêu chí)
**先修：**Giai đoạn 18 · 20 ((những quan điểm),Giai đoạn 02 ((các loại ML)
**时间：**约60分钟

## Học mục tiêu

- Nói ra ba tiêu chí công bằng nhóm: (nhiều điểm dân số, tỷ lệ cược bình đẳng, độ chính xác sử dụng điều kiện) và một kết quả không thể có được:
- Thông qua Dwork et al. 2012 của Lipschitz công thức mô tả sự công bằng cá nhân.
- Mô tả tính công bằng đối lập và sự phụ thuộc của nó đối với biểu đồ nguyên nhân.
- Giải thích các đối số ngược lại, cũng như lý do tại sao chúng có thể xoay quanh sự can thiệp thuộc tính bảo vệ 问题。

## 问题

Bài 20 thảo luận về đo lường thiên vị. Bài 21 thảo luận về định nghĩa đo lường 应服务的公平标准.

## 概念

### Sự công bằng trong nhóm

- **Demographic parity.**P  Y=1  A=a = P  Y=1  A=a'), với tất cả các nhóm thành lập   
- **Equalized odds.**P(Y=1 √ Y*=y, A=a) = P(Y=1 √ Y*=y, A=a') √
- **Conditional use accuracy equality.**P(Y*=y √ Y=y, A=a) = P(Y*=y √ Y=y, A=a') √

Không thể (Chouldechova, Kleinberg-Mullainathan-Raghavan 2017): Trong tỷ lệ cơ bản 不相等时,这三者不能同时满足──

### Sự công bằng cá nhân

Dwork et al. 2012── Nếu đối với một số phép đo tương đồng cụ thể về nhiệm vụ d, bản đồ quyết định f 满足 f x) - f x') <= L * d x, x'), trong đó L là một số định vị Lipschitz, thì f là một cách cá nhân công bằng──相似个体获得相似决策──

Điều này đòi hỏi phải xác định d. Đây là một câu hỏi chính sách, chứ không phải là một câu hỏi thống kê.

### Sự công bằng trái ngược thực tế

Kusner et al. 2017。 Nếu trong mô hình nhân quả của dân số 下, khi thuộc tính nhạy cảm của cá thể i được thay đổi ngược lại, quyết định giữ không thay đổi, thì quyết định này đối với cá thể i là ngược lại công bằng của。

Điều này đòi hỏi một DAG nguyên nhân. DAG là một lựa chọn mô hình. Sự hợp lý của sự công bằng đối lập chỉ mạnh như sự hợp lý của DAG.

### Thỏa thuận CF-View-Correctness

NeurIPS 2024 lý thuyết: tính công bằng đối lập với tính chính xác dự đoán 之间存在内在 trade-off── một phương pháp mô hình-nhận thức có thể chuyển đổi một dự đoán tối ưu nhưng không công bằng thành dự đoán CF,并付出有界的精度成本──

### Các đối số ngược

ArXiv:2401.13935(2024 年 1 月)  Các đối nghịch truyền thống  yêu cầu can thiệp vào thuộc tính nhạy cảm   Nếu người này là giới tính khác, quyết định sẽ thay đổi ;;

Trở lại ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược ngược.

### Sự hòa giải triết học

Các bài đăng trên blog của ICLR năm 2024── trong đó có biểu đồ nguyên nhân 时,满足某些群-fairness measures 会含反事实性公平──

Điều này không thể giải quyết các lý thuyết bất khả thi (tỷ lệ cơ bản 不相等 vẫn sẽ ngăn chặn sự công bằng đồng thời của nhóm) nhưng nó cho thấy, nhóm và cá nhân / đối lập                                                                                                                                                                                                                                         

### Bài học này nằm ở vị trí giữa giai đoạn 18

Bài học 20 là đo lường thiên vị. Bài học 21 là định nghĩa công bằng. Bài học 22 là quyền riêng tư. Bài học 23 là đánh dấu nước.


```figure
an-fairness-trilemma
```

## Sử dụng nó

`code/main.py`Xây dựng một bộ dữ liệu phân loại nhị phân đồ chơi, trong đó có một thuộc tính nhạy cảm 和不相等的基率. Trong một phân loại đơn giản, tính toán tỷ lệ tỷ lệ dân số trên, tỷ lệ tỷ lệ bình đẳng và tỷ lệ sử dụng chính xác theo điều kiện.

## 交付 nó

本课会生成 `outputs/skill-fairness-criterion.md` Đưa ra một tuyên bố công bằng hoặc chính sách, nhận ra tuyên bố của nó là tiêu chí nào  trong tuyên bố tỷ lệ cơ sở không bình đẳng mô hình dưới đây liệu có thể đáp ứng các tiêu chí còn lại, cũng như tuyên bố này phụ thuộc vào DAG nguyên nhân nào 

## 练习

1. 运行 `code/main.py` báo cáo về ba số liệu nhóm trên dữ liệu thông thường.

2. Sử dụng các đặc điểm không nhạy cảm trên L2  thực hiện Dwork et al. 2012 của métric công bằng cá nhân.

3. 阅读 Kusner et al. 2017。为复习得分 构建一个简单的两特性因果 DAG,并识别它含的反事实性公平条件──

4. 2024 ngược lại-phản lý 论文 đã tránh sự can thiệp của các thuộc tính được bảo vệ.

5. ICLR 2024 hòa giải 认为 nhóm công bằng và đối thực công bằng là những khía cạnh khác nhau của cùng cấu trúc.`code/main.py`Trong khi chọn ba tiêu chí, hai trong số đó sẽ làm cho chúng giống nhau giả định nguyên nhân.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Demographic parity | “equal rates” | P(Y=1 | A=a) 在群体之间相等 |
| Equalized odds | “equal TPR/FPR” | 群体之间相等的 true-positive 和 false-positive rates |
| Conditional use accuracy | “equal PPV/NPV” | 群体之间相等的 predictive values |
| Individual fairness | “Lipschitz condition” | 相似个体获得相似决策 |
| Counterfactual fairness | “causal alteration invariance” | 在 counterfactual attribute alteration 下决策保持不变 |
| Backtracking counterfactual | “explain via actuals” | Counterfactual 是从 outcome 向后推理，而不是从 attribute 向前推理 |
| Impossibility theorem | “the three conflict” | Chouldechova / KMR 2017：在 base rates 不相等时，group criteria 相互排斥 |

## 延伸阅读

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) Công bằng cá nhân
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) tính công bằng đối với thực tế
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056) không thể
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) các biện pháp can thiệp thuộc tính bảo vệ
