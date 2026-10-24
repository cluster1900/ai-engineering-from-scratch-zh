# 面向 Machine Learning'ın Graf Teorisi

> Graf bir ilişki verisi yapısıdır. Eğer verileriniz bağlantıları içerirse, size grafik teorisi gerekmektedir.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-03（linear algebra, matrices）
**Time:** ~90 分钟

## Öğrenme hedefi
- 构建一个图类,包含邻属矩阵/列表表示,并实现 BFS 和 DFS 遍历
- 计算 graph Laplacian,并使用其自身值 检测连接组件 和对节点 聚类
- Bir sıra GNN 风格的 mesaj geçiş 实现为正常化邻立矩阵乘法
- Faydler vektörünü kullan  spektral gruplama uygulaması 来划分图

## 问题
Sosyal ağlar, moleküller, bilgi tabanları, sitasyon ağları, yol hariteleri, grafiklerdir.

考虑一个社交网络――你想预测某用户会购买什么产品――他们的购买历史很重要――但他们朋友的购买历史更重要――连接本身承载信号――

Ya da bir molekülü düşünerek. Bir proteine bağlanacağını tahmin ederken. Atomlar çok önemli, ama gerçekte önemli olan atomlar birbirlerine nasıl bağlanacaklarıdır.

Grafik sinir ağları (GNN) derin öğrenim içinde en hızlı büyüyen alanlardır. Bunlar ilaç keşfi, sosyal tavsiye, dolandırıcılık tespit ve bilgi grafi düşüncesini yönlendirir.

Sana dört şey lazım:
1. Bir çeşit grafikler matrisler için ifade edilir böylece onları çarpma şeklinde kullanabilirsiniz)
2. Graf yapısını keşfetmek için kullanılır
3. Laplakyan, bu spektral grafik teorisi.
4. Mesaj geçişi, GNN'lerin çalışma işlemidir.

## 概念
### Grafikler: Kısımlar ve Kenarlar

Bir grafik .$G = (V, E)$Yörüngeler (nodlar) $V$ 和 kenarları $E$组成──每条 edge 连接两个节点──

**Directed vs undirected。**Yönlendirilmemiş grafikte, kenar $(u, v)$Göster$u$Bağlantı$v$Ve$v$Ayrıca bağlantı .$u$△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                                                       $(u, v)$Göster$u$Yönlendirme$v$Ama tersine, kesinlikle geçerli değil.

**Weighted vs unweighted。**Ağırlaştırılmamış grafikte, kenarlar var mı var mı yok mı var mı var mı yok. Ağırlaştırılmış grafikte, her kenarın bir sayısal değeri var.

| Graph type | Example |
|-----------|---------|
| Undirected, unweighted | Facebook friendship network |
| Directed, unweighted | Twitter follow network |
| Undirected, weighted | Road map（distances） |
| Directed, weighted | Web page links（PageRank scores） |

### Yakınlık Matrisi

bitişiklik matrisi $A$∞ ∞ ∞ ∞ ∞ ∞$n$个节点 的图:

```math
A[i][j] = \begin{cases} 1 & \text{若存在从节点 } i \text{ 到节点 } j \text{ 的 edge} \\ 0 & \text{否则} \end{cases}
```

 yönlendirilmemiş grafikler için,$A$Simetrik:$A[i][j] = A[j][i]$❖ Ağırlaştırılmış grafikler için,$A[i][j]$= kenar $(i, j)$Ağırlık.

**示例：一个 triangle：**

```
Nodes: 0, 1, 2
Edges: (0,1), (1,2), (0,2)

A = [[0, 1, 1],
     [1, 0, 1],
     [1, 1, 0]]
```

bitişiklik matrisi = her GNN'in girişleri$A$Yukarıdaki Matrix işlemleri, yukarıdaki grafik işlemlerine karşı.

### Derece

Örgütlerin derecesi, kenarlarına bağlanmıştır.

dereceleri matrisi $D$- Diyagonal:

```math
\begin{aligned}
D[i][i] &= \text{节点 } i \text{ 的 degree} \\
D[i][j] &= 0 \quad \text{其中 } i \ne j
\end{aligned}
```

Üçgen örneği için:$D = \mathop{\mathrm{diag}}(2, 2, 2)$Çünkü her düğüm diğer iki düğüme bağlanmıştır.

Derece 告诉你节点的重要性──High degree = hub node──a network's degree distribution 揭示了它的结构──Social networks 遵循 power laws(少量 hubs,许多 leaf nodes)──Random graphs 具有Poisson-distributed degrees──

### BFS ve DFS

İki temel grafik geçiş algoritması.

**Breadth-First Search (BFS)：**Önceden tüm komşuları keşfetmek, tekrar komşuların komşularını keşfetmek.

```
BFS from node 0:
  Visit 0
  Queue: [1, 2]        (neighbors of 0)
  Visit 1
  Queue: [2, 3]        (add neighbors of 1)
  Visit 2
  Queue: [3]           (neighbors of 2 already visited)
  Visit 3
  Queue: []            (done)
```

BFS, ağırlıksız grafikler arasında en kısa yolları bulur. BFS'in ilk kez bulunduğu BFS seviyesine benzer şekilde, başlangıç noktasından herhangi bir düğümün mesafesine kadar. Bu nedenle BFS sosyal ağlardaki hop-count mesafelerinde kullanılır.

**Depth-First Search (DFS)：**Bu nedenle, bu durumun bir sonraki aşamasında, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre, bir sürece bir sürecececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece

```
DFS from node 0:
  Visit 0
  Stack: [1, 2]        (neighbors of 0)
  Visit 2               (pop from stack)
  Stack: [1, 3]         (add neighbors of 2)
  Visit 3               (pop from stack)
  Stack: [1]
  Visit 1               (pop from stack)
  Stack: []             (done)
```

DFS kullanılabilir:
- 查找连接组件(从未访问的节点 运行 DFS)
- Çember tespitleri (DFS ağacı)
- Topolojik sıralama ((反向 DFS bitme sırası)

| Algorithm | Data structure | Finds | Use case |
|-----------|---------------|-------|----------|
| BFS | Queue | Shortest paths | Social network distance, knowledge graph traversal |
| DFS | Stack | Components, cycles | Connectivity, topological sort |

### Grafik Laplakyan

$L = D - A$◊ Spektral grafi teorisi 中最重要的矩阵──

Üçgen için:

```math
D = \begin{bmatrix} 2 & 0 & 0 \\ 0 & 2 & 0 \\ 0 & 0 & 2 \end{bmatrix} \qquad A = \begin{bmatrix} 0 & 1 & 1 \\ 1 & 0 & 1 \\ 1 & 1 & 0 \end{bmatrix} \qquad L = \begin{bmatrix} 2 & -1 & -1 \\ -1 & 2 & -1 \\ -1 & -1 & 2 \end{bmatrix}
```

Laplakya 具有非常重要的性质:

1. **$L$ 是 positive semi-definite。**Tüm öz değerleri$\ge 0$- Evet.

2. **zero eigenvalues 的数量等于 connected components 的数量。**Bir bağlantılı grafik 恰好 has zero eigenvalue── bir has has 3 ′s disconnected components of graph has three zero eigenvalue──

3. **最小的 non-zero eigenvalue（Fiedler value）衡量 connectivity。**较大的Fiedler value 表示图 连接良好──较小的Fiedler value 表示图 有一个薄弱点,也就是瓶──

4. **Fiedler value 的 eigenvector（Fiedler vector）揭示最佳切分。**值为正的节点 进入一组,值为负的节点 进入另一组──这是光谱集群──

```mermaid
graph TD
    subgraph "Graph to Matrices"
        G["Graph G"] --> A["Adjacency Matrix A"]
        G --> D["Degree Matrix D"]
        A --> L["Laplacian L = D - A"]
        D --> L
    end
    subgraph "Spectral Analysis"
        L --> E["Eigenvalues of L"]
        L --> V["Eigenvectors of L"]
        E --> C["Connected components (zeros)"]
        E --> F["Connectivity (Fiedler value)"]
        V --> S["Spectral clustering"]
    end
```

### Spektral Özellikler

Yakınlık matrisi ve Laplakçi'nin öz değerleri herhangi bir geçiş yapmadan yapısal özellikleri ortaya çıkarabilir.

**Spectral clustering**Şöyle çalışmaktadır:
1. 计算 Laplak $L$
2. 找到 $L$$k$个最小 eigenvectors(跳过第一个; Bağlı grafikler için, it is全 1)
3. Bu öz vektörleri her düğümün yeni bir sitatörü olarak kullanın
4. Bu otellerde yürüyüş yapın.$k$-Böyle demek.

Neden işe yarıyor?$L$Bu nedenle, bu değerler, kendi vektörlerinin farklı değerleri elde eder. Bu değerler, kendi vektörlerin farklı değerlerini elde eder.

**Random walk connection。**Normalleştirilmiş Laplaksian 收得有多快) 取决于光谱差──

### Mesaj Geçiriliyor

Bu Graph Neural Networks'in temel işlevi. Her düğüm komşularından mesaj toplayıp onları toplayıp kendi durumunu yeniliyor.

```math
h_v^{(k+1)} = \text{UPDATE}\left(h_v^{(k)}, \text{AGGREGATE}\left(\{h_u^{(k)} : u \in \text{neighbors}(v)\}\right)\right)
```

En basit biçimde,Aggregate = ortalama,UPDATE = doğrusal dönüşüm + etkinleştirme:

```math
h_v^{(k+1)} = \sigma\left(W \cdot \text{mean}\left(\{h_u^{(k)} : u \in \text{neighbors}(v)\}\right)\right)
```

Bu aslında başka bir tür matris çarpımı şeklinde saptırılmış bir şey.$H$Tüm düğüm özelliklerinin matrisi,$A$                                                                                                                                                                                                                                                              

```math
H^{(k+1)} = \sigma\left(A_{\text{norm}} H^{(k)} W\right)
```

İçlerinden $A_{\text{norm}}$Normalleşmiş bitişiklik matrisi (((

Bir mesaj geçiyor 让每个节点 看到它的近邻――两轮让它看到邻居的邻居――$K$Her düğümün ondan alınmasını sağlayın.$K$-hop mahallesi hakkında bilgi...

```mermaid
graph LR
    subgraph "Round 0"
        A0["Node A: [1,0]"]
        B0["Node B: [0,1]"]
        C0["Node C: [1,1]"]
    end
    subgraph "Round 1 (aggregate neighbors)"
        A1["Node A: avg(B,C) = [0.5, 1.0]"]
        B1["Node B: avg(A,C) = [1.0, 0.5]"]
        C1["Node C: avg(A,B) = [0.5, 0.5]"]
    end
    A0 --> A1
    B0 --> A1
    C0 --> A1
    A0 --> B1
    C0 --> B1
    A0 --> C1
    B0 --> C1
```

### 概念与 ML 应用

| Concept | ML Application |
|---------|---------------|
| Adjacency matrix | GNN input representation |
| Graph Laplacian | Spectral clustering, community detection |
| BFS/DFS | Knowledge graph traversal, path finding |
| Degree distribution | Node importance, feature engineering |
| Message passing | GNN layers (GCN, GAT, GraphSAGE) |
| Eigenvalues of L | Community detection, graph partitioning |
| Spectral clustering | Unsupervised node grouping |
| PageRank | Node importance, web search |


```figure
graph-degree-distribution
```

## Yapın onu.
### 步骤 1: sıfırdan gerçekleştirme Graf 类

```python
class Graph:
    def __init__(self, n_nodes, directed=False):
        self.n = n_nodes
        self.directed = directed
        self.adj = {i: {} for i in range(n_nodes)}

    def add_edge(self, u, v, weight=1.0):
        self.adj[u][v] = weight
        if not self.directed:
            self.adj[v][u] = weight

    def neighbors(self, node):
        return list(self.adj[node].keys())

    def degree(self, node):
        return len(self.adj[node])

    def weighted_degree(self, node):
        return sum(self.adj[node].values())

    def adjacency_matrix(self):
        import numpy as np
        A = np.zeros((self.n, self.n))
        for u in range(self.n):
            for v, w in self.adj[u].items():
                A[u][v] = w
        return A

    def degree_matrix(self):
        import numpy as np
        D = np.zeros((self.n, self.n))
        for i in range(self.n):
            D[i][i] = self.weighted_degree(i)
        return D

    def laplacian(self):
        return self.degree_matrix() - self.adjacency_matrix()
```

bitişiklik listesi(`self.adj`) yüksek verimli depolama komşuları olabilir.

### 步骤 2: BFS ve DFS

```python
from collections import deque

def bfs(graph, start):
    visited = set()
    order = []
    distances = {}
    queue = deque([(start, 0)])
    visited.add(start)
    while queue:
        node, dist = queue.popleft()
        order.append(node)
        distances[node] = dist
        for neighbor in graph.neighbors(node):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return order, distances


def dfs(graph, start):
    visited = set()
    order = []
    stack = [start]
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        order.append(node)
        for neighbor in reversed(graph.neighbors(node)):
            if neighbor not in visited:
                stack.append(neighbor)
    return order
```

BFS 使用 deque(iki uçlı sırada) 实现$O(1)$popleft。DFS Kullanım listesini 作为堆──两者都会恰好访问每个节点 一次,时间复杂度为 $O(V + E)$- Evet.

### 步骤 3: Bağlı bileşenler 和 Laplacian öz değerleri

```python
def connected_components(graph):
    visited = set()
    components = []
    for node in range(graph.n):
        if node not in visited:
            order, _ = bfs(graph, node)
            visited.update(order)
            components.append(order)
    return components


def laplacian_eigenvalues(graph):
    import numpy as np
    L = graph.laplacian()
    eigenvalues = np.linalg.eigvalsh(L)
    return eigenvalues
```

`eigvalsh`Simetrik matrisler için kullanılan, Laplacian ise yönlendirilmemiş grafikler için daima simetriktir.

### 步骤 4: Spektral gruplama

```python
def spectral_clustering(graph, k=2):
    import numpy as np
    L = graph.laplacian()
    eigenvalues, eigenvectors = np.linalg.eigh(L)
    features = eigenvectors[:, 1:k+1]

    labels = np.zeros(graph.n, dtype=int)
    for i in range(graph.n):
        if features[i, 0] >= 0:
            labels[i] = 0
        else:
            labels[i] = 1
    return labels
```

- Evet .$k=2$,Fiedler vektörünün göstergesi grafik iki kümelere ayrılır.$k>2$Sen de orada olacaksın .$k$个 eigenvectors(排除 trivial all-one eigenvector) 上运行 $k$- Yani...

### 步骤 5: Mesaj geçiş

```python
def message_passing(graph, features, weight_matrix):
    import numpy as np
    A = graph.adjacency_matrix()
    row_sums = A.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    A_norm = A / row_sums
    aggregated = A_norm @ features
    output = aggregated @ weight_matrix
    return output
```

Bu bir GNN mesajı geçiş döngüsü. Her düğümün yeni özellikleri komşu özelliklerinin ağırlıklı ortalamasıdır.

## Kullan
Şebekeden ve numpy'den, aynı operasyonlar tek satırlı:

```python
import networkx as nx
import numpy as np

G = nx.karate_club_graph()

A = nx.adjacency_matrix(G).toarray()
L = nx.laplacian_matrix(G).toarray()

eigenvalues = np.linalg.eigvalsh(L.astype(float))
print(f"Smallest eigenvalues: {eigenvalues[:5]}")
print(f"Connected components: {nx.number_connected_components(G)}")

communities = nx.community.greedy_modularity_communities(G)
print(f"Communities found: {len(communities)}")

pr = nx.pagerank(G)
top_nodes = sorted(pr.items(), key=lambda x: x[1], reverse=True)[:5]
print(f"Top 5 PageRank nodes: {top_nodes}")
```

Networkx, optimize edilmiş C arka planlarını kullanarak herhangi bir boyutlu grafikleri işleyebilir.

### Numpy spektral analizi

```python
import numpy as np

A = np.array([
    [0, 1, 1, 0, 0],
    [1, 0, 1, 0, 0],
    [1, 1, 0, 1, 0],
    [0, 0, 1, 0, 1],
    [0, 0, 0, 1, 0]
])

D = np.diag(A.sum(axis=1))
L = D - A

eigenvalues, eigenvectors = np.linalg.eigh(L)
print(f"Eigenvalues: {np.round(eigenvalues, 4)}")
print(f"Fiedler value: {eigenvalues[1]:.4f}")
print(f"Fiedler vector: {np.round(eigenvectors[:, 1], 4)}")

fiedler = eigenvectors[:, 1]
group_a = np.where(fiedler >= 0)[0]
group_b = np.where(fiedler < 0)[0]
print(f"Cluster A: {group_a}")
print(f"Cluster B: {group_b}")
```

Fiedler vektörü 承担了主要工作──正值条目位于一个集群,负值条目位于另一个集群──不需要再进化优化,只需要一次自构──

## - Söyle.
本课产 出:
- `outputs/skill-graph-analysis.md`: Grafik yapılı verileri analiz etmek için kullanılır

## Bağlantılar

| Concept | Where it shows up |
|---------|------------------|
| Adjacency matrix | GCN, GAT, GraphSAGE input |
| Laplacian | Spectral clustering, ChebNet filters |
| BFS | Knowledge graph traversal, shortest path queries |
| Message passing | Every GNN layer, neural message passing |
| Spectral gap | Graph connectivity, mixing time of random walks |
| Degree distribution | Power-law networks, node feature engineering |
| Connected components | Preprocessing, handling disconnected graphs |
| PageRank | Node importance ranking, attention initialization |

GNN'ler 值得特别说明──GCN(Kipf & Welling, 2017) içinde grafik kıvrım işlemleri kullanılarak kendi kendini döngülerinin bitişiklik matrisini ekledi,$\hat{A} = A + I$- ...

```math
H^{(l+1)} = \sigma\left(\hat{D}^{-1/2} \hat{A} \hat{D}^{-1/2} H^{(l)} W^{(l)}\right)
```

İçlerinden $\hat{A} = A + I$(kısıtlılık加自环),$\hat{D}$Evet .$\hat{A}$Grade matrisi, self-loops, her düğümün aggregasyon sırasında öz özellikleri içerdiğini sağlamak.$\hat{D}^{-1/2} \hat{A} \hat{D}^{-1/2}$Laplacian burada ortaya çıkıyor, çünkü bu normalleşme ile $L_{\text{sym}} = I - D^{-1/2} A D^{-1/2}$相关──理解 Laplacian,就意味着理解GCNs为何有效── anlaması gerekir.

## 练习
1. **从零实现 PageRank。**Birlikte puanlar 开始──每一步:score(v) = (1-d) /n + d * sum(score(u) /out_degree(u)), u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ u ∈ ∈            ∈                                                                                                                                                                                                                

2. **使用 spectral clustering 查找 communities。**✓ İki açık ayrılıklı kümeler içeren bir grafik oluşturmak  Örneğin, iki klik ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓   ✓ ✓ ✓  ✓ ✓    ✓ ✓          ✓

3. **为 weighted graphs 中的 shortest paths 实现 Dijkstra's algorithm。**Üstteki grafikte aynı ağırlıklara sahip olanların sonuçları BFS ile karşılaştırılır.

4. **构建一个 2-layer message passing network。**İki kez mesaj geçiş kullanmak. 2 kez gösterilince, her düğümün 2 kez gönderilen mesajı kullanmak.

5. **分析一个真实世界 graph。**kullan Karate Club grafiği(34 düğüm, 78 kenar) ・・・ hesaplama derecesi dağılım、Laplacian öz değerleri 和 spektral kümeler。

### 提示

**练习 1。**Uygulamada verilen formüllerin kullanılması. Dışarı çıkış kenarları olmayan noktaların sayılarının ortalaması tüm noktalara ayırılmalıdır.`pagerank(graph)`Ben de.

**练习 2。**Kullanım`add_edge`İki klük oluştur, bir kenar kullan, onları bağla, sonra da kullan.`spectral_clustering(graph, k=2)`◊ Check each clique is whether they each get the same label── adım adım grup kenarlarını ekle 时,打印 `laplacian()`İkinci küçük özdeğer; iki grup daha yakından bağlandıkça, değer artış olacaktır.

**练习 3。**Kullanım`heapq`维护优先队,总是扩展已知距离最小节点──将每条边的重量都设为1,检查 Dijkstra 得到的每距离是否等于`bfs(graph, start)`Orta Bölüm BFS Dönemleri

**练习 4。**Benlik matrisi kullan `features`, her satır bir nokta işaretleyip iki kez uygula.`message_passing`Bu zaman, bölüm.$v$Yürüyüşlerde bulunan sıfır dışı girişler , hangi noktaların mesajını göstermektedir .$v$将这个集合与宽度第一搜索中距离不超过2的节点集合比较──

**练习 5。** `networkx.karate_club_graph()`提供 edge list,以及节点属性 `club`İçindeki temel gerçeklik. Bu kenarları bir tek olarak kopyalayacağım.`Graph`Orta, 34 节点 ve 78 条 edgesinin olup olmadığını kontrol et.`spectral_clustering`Etiketleri ve etiketleri`club`Yapabilir.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Graph | “Nodes and edges” | 一种数学结构 $G=(V,E)$，用于编码 pairwise relationships |
| Adjacency matrix | “The connection table” | 一个 $n \times n$ matrix，其中如果 nodes $i$ 和 $j$ 相连，则 $A[i][j] = 1$ |
| Degree | “一个 node 有多 connected” | 接触某个 node 的 edges 数量 |
| Laplacian | “D minus A” | $L = D - A$，其 eigenvalues 会揭示 graph structure 的 matrix |
| Fiedler value | “The algebraic connectivity” | $L$ 的最小 non-zero eigenvalue，用于衡量 graph 连接得有多好 |
| BFS | “Level-by-level search” | 在深入之前先访问所有 neighbors 的 traversal，可找到 shortest paths |
| DFS | “Go deep first” | 在回溯之前沿一条 path 走到末端的 traversal |
| Message passing | “Nodes talk to neighbors” | 每个 node 从其 neighbors 聚合信息，这是 GNNs 的核心 |
| Spectral clustering | “Cluster by eigenvectors” | 使用 graph 的 Laplacian 的 eigenvectors 来划分 graph |
| Connected component | “A separate piece” | 一个 maximal subgraph，其中每个 node 都能到达其他每个 node |

## 延伸阅读
- **Kipf & Welling (2017)**Grafik Konvolyasyon Ağları ile Yarım Denetimli Sınıflandırma.
- **Spielman (2012)**: Spektral Graph Teorisi Lecture Notları── Laplacianlar hakkında、spektral boşluklar 和 grafi bölünme hakkı──
- **Hamilton (2020)**Grafik Temsil Etme Öğrenimi.
- **Bronstein et al. (2021)**:Jometrik Derin Öğrenme: Gridler, Gruplar, Graflar, Jeodetik ve Ölçüler。统一框架论文。
- **Veličković et al. (2018)**:Graph Attention Networks──Util attention mechanisms 扩展信息传递──
