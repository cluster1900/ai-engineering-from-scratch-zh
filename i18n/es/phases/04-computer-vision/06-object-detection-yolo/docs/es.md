# 目标检测  Desde el zero realizar YOLO

> La detección es la clasificación + Regressión, en cada ubicación del mapa de características, y luego con la supresión no máxima 清理结果──

**类型：**Construcción
**语言：**Python
**前置要求：**Fase 4 Lección 03 (CNNs), Fase 4 Lección 04 (Clasificación de imágenes), Fase 4 Lección 05 (Aprendizaje de transferencia)
**时间：**75 minutos

## El objetivo del aprendizaje

-  explicar la cuadrícula y el anclaje  diseñar cómo transformar la detección  convertir en predicción densa  problemas,并说明输出テンসর 中每个数字的含义
- 计算 box   间 交叉-over-Union,并从零 lograr la supresión no máxima
- En la columna vertebral preentrenada construye una cabeza de estilo YOLO mínimo, incluyendo la clasificación ∙ objetos y cajas de pérdidas de regresión
- 读懂一行检测测指标(precision@0.5, recall, mAP@0.5, mAP@0.5:0.95),并判断下一步应该调整哪个扣

##  problemas

Clasificación 会说 Este gráfico es un perro ── Detección 会说 en píxeles (112, 40, 280, 210) 处有一只狗,处在 (400, 180, 560, 310) 处有一只猫,画面中没有其他东西── esta variación estructural预测数量可变带标签盒, en lugar de cada gráfico una etiqueta  es cada sistema de conducción automática、 cada producto de control、 cada archivo diseño parser 和每条工厂视觉产线的依赖能力──

Detección también es donde todos los proyectos de la visión se producen simultáneamente. Tú quieres que la caja 准确(cabeza de regresión), espera que cada caja de clase 正确(cabeza de clasificación), espera que el modelo sepa cuándo no hay nada que necesita la detección.

YOLO(You Only Look Once, Redmon et al. 2016) es un diseño que pasa a través de la red de conexión de un solo paso adelante 让所有这些实时运行起来; similar estructural决策至今仍是现代探测器 (YOLOv8, YOLOv9, YOLO-NAS, RT-DETR) de la columna vertebral de la base. Después de tomar posesión del núcleo, cada variable es simplemente una reorganización de los mismos componentes.

## 概念

### Detección  como predicción densa

Clasificador Cada张图输出 C 个数字――YOLO 风格探测器 每张图输出 `(S x S x (5 + C))`个数字, entre ellos S es el tamaño de la cuadrícula espacial.

```mermaid
flowchart LR
    IMG["Input 416x416 RGB"] --> BB["Backbone<br/>(ResNet, DarkNet, ...)"]
    BB --> FM["Feature map<br/>(C_feat, 13, 13)"]
    FM --> HEAD["Detection head<br/>(1x1 convs)"]
    HEAD --> OUT["Output tensor<br/>(13, 13, B * (5 + C))"]
    OUT --> DEC["Decode<br/>(grid + sigmoid + exp)"]
    DEC --> NMS["Non-max suppression"]
    NMS --> RESULT["Final boxes"]

    style IMG fill:#dbeafe,stroke:#2563eb
    style HEAD fill:#fef3c7,stroke:#d97706
    style NMS fill:#fecaca,stroke:#dc2626
    style RESULT fill:#dcfce7,stroke:#16a34a
```

Cada uno .`S * S`celdas de la rejilla 会预测 `B`个盒子──对于每一个盒子:

- 4 个数字描述几何信息:`tx, ty, tw, th`¿Qué es eso?
- 1 个数字是对象性分数: ¿Hay un objeto en el centro de esta célula?
- C 个数字 es probabilidades de clase.

El total de cada célula:`B * (5 + C)` Para el VOC, si`S=13, B=2, C=20`, es cada célula 50 números.

### ¿Por qué necesitas redes y anclas?

朴素 Regression 会为每个对象 预测绝对坐标形式的 `(x, y, w, h)` Esto es difícil de decir en la red conve, ya que la imagen plana no debería hacer que todas las predicciones se muevan de la misma manera  Cada objeto está en el espacio                                                                                                                                                                                                                                                                                

Ancillos  resolver el segundo problema―3x3 conv  muy difícil de la célula de 16 píxeles de campo receptivo de la característica dentro de la Regresión salir de una caja de 500 píxeles de ancho― por lo tanto, estamos en cada célula  predefinido `B`个先验盒形(ankores),并从每个ankor 预测小的deltas──模型学习选择正确的ankor 并微调它,而不是从零 Regressión──

```
Anchor box priors (example for 416x416 input):

  small:   (30,  60)
  medium:  (75,  170)
  large:   (200, 380)

At each grid cell, every anchor emits (tx, ty, tw, th, obj, c_1, ..., c_C).
```

Los detectores modernos suelen usar FPN, en diferentes resoluciones, en diferentes conjuntos de anclajes, en mapas de alta resolución de nivel bajo, en maps de baja resolución de nivel bajo, en maps de bajo nivel, en maps de bajo nivel, en maps de gran resolución.

### 解码 predicciones

Originario `tx, ty, tw, th`No son coordenadas de caja; son objetivos de Regresión que necesitan ser transformados en el dibujo previo:

```
centre x  = (sigmoid(tx) + cell_x) * stride
centre y  = (sigmoid(ty) + cell_y) * stride
width     = anchor_w * exp(tw)
height    = anchor_h * exp(th)
```

`sigmoid`La concentración del centro se limita a la célula.`exp`让宽可以从基自由缩缩而不会发生符号翻转.`stride`Coloque las coordenadas de la cuadrícula en pixeles. Este decodificación es el mismo en cada versión de YOLO.

### El mismo

Detección en medio de la medida de dos cajas de comparabilidad de métricas generales:

```
IoU(A, B) = area(A intersect B) / area(A union B)
```

IoU = 1 muestra completamente igual; IoU = 0 muestra no hay sobreposición. La predicción y la caja de verdad fundamental entre IoU decide si una predicción es o no calculada como positiva verdadera.

### Represión no máxima

En las anclas vecinas, la red de conexión de entrenamiento suele estar en el mismo objeto  predicción sobreposición de caja。 NMS Mantenga confianza en la predicción máxima, y elimina cualquier otra predicción de IoU superior avalor。

```
NMS(boxes, scores, iou_threshold):
    sort boxes by score descending
    keep = []
    while boxes not empty:
        pick the top-scoring box, add to keep
        remove every box with IoU > iou_threshold to the picked box
    return keep
```

典型值:object detection 中为0.45──近期探测器 会用 `soft-NMS`¿Qué es esto?`DIoU-NMS`替代标准 NMS, o directamente aprender supresión (RT-DETR), pero el propósito estructural es el mismo.

### Las pérdidas

YOLO pérdida es tres pérdidas de peso.

```
L = lambda_coord * L_box(pred, target, where obj=1)
  + lambda_obj   * L_obj(pred, 1,     where obj=1)
  + lambda_noobj * L_obj(pred, 0,     where obj=0)
  + lambda_cls   * L_cls(pred, target, where obj=1)
```

只有包含对象的细胞 才会贡献框回归和分类损失──不含对象的细胞 只贡献对象性损失──教模型保持沉默)──`lambda_noobj`Normalmente es menor (cerca de 0,5), ya que la mayoría de las células están vacías, de lo contrario, se producirá la pérdida total.

现代变体会把 MSE box loss 换成 CIoU / DIoU(直接优化 IoU), con la pérdida focal 处理类失衡,并用质量焦失平衡对象性──三组件结构保持不变──

### Metricas de detección

La precisión no puede transferirse directamente a la detección.

- **Precision@IoU=0.5** En las predicciones que se consideran positivas, hay muchas verdaderas prácticas.
- **Recall@IoU=0.5** En los objetos reales, hemos encontrado mucho.
- **AP@0.5** Umbral de IoU 0.5 下 curva de recalco de precisión 面积; cada clase una una cantidad
- **mAP@0.5:0.95** En los umbrales de la UIE 0,5, 0,55, ..., 0,95 上对 AP 求平均──COCO métrica; más estricta, también más tiene información──

Si un detector en mAP@0.5 上很强, pero en mAP@0.5:0.95 上很弱,说明定位大致正确但不够紧; usar mejor pérdida de regresión de caja 修复──如果 detektor de precisión alta, recordar baja,说明它过于保守;降低信心门或提高对象权重──


```figure
object-detection-nms
```

## Construirlo

### Paso 1: YoU

整节课的核心工具──作用于两个 `(x1, y1, x2, y2)`Arrays de caja de formato

```python
import numpy as np

def box_iou(boxes_a, boxes_b):
    ax1, ay1, ax2, ay2 = boxes_a[:, 0], boxes_a[:, 1], boxes_a[:, 2], boxes_a[:, 3]
    bx1, by1, bx2, by2 = boxes_b[:, 0], boxes_b[:, 1], boxes_b[:, 2], boxes_b[:, 3]

    inter_x1 = np.maximum(ax1[:, None], bx1[None, :])
    inter_y1 = np.maximum(ay1[:, None], by1[None, :])
    inter_x2 = np.minimum(ax2[:, None], bx2[None, :])
    inter_y2 = np.minimum(ay2[:, None], by2[None, :])

    inter_w = np.clip(inter_x2 - inter_x1, 0, None)
    inter_h = np.clip(inter_y2 - inter_y1, 0, None)
    inter = inter_w * inter_h

    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a[:, None] + area_b[None, :] - inter
    return inter / np.clip(union, 1e-8, None)
```

 Retorno a uno `(N_a, N_b)`de par de IoU Matrix―                                                                                                                                                                                                                                                           `(1, 4)`¿Qué es eso?

### 步骤 2: Represión no máxima

```python
def nms(boxes, scores, iou_threshold=0.45):
    order = np.argsort(-scores)
    keep = []
    while len(order) > 0:
        i = order[0]
        keep.append(i)
        if len(order) == 1:
            break
        rest = order[1:]
        ious = box_iou(boxes[[i]], boxes[rest])[0]
        order = rest[ious <= iou_threshold]
    return np.array(keep, dtype=np.int64)
```

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `O(N log N)`complejidad, y en la misma entrada corresponde `torchvision.ops.nms`De comportamiento.

### 步骤 3:Codificación y decodificación de caja

En las coordenadas de píxeles y red  Regressión real `(tx, ty, tw, th)`Los objetivos se han convertido en objetivos.

```python
def encode(box_xyxy, cell_x, cell_y, stride, anchor_wh):
    x1, y1, x2, y2 = box_xyxy
    cx = 0.5 * (x1 + x2)
    cy = 0.5 * (y1 + y2)
    w = x2 - x1
    h = y2 - y1
    tx = cx / stride - cell_x
    ty = cy / stride - cell_y
    tw = np.log(w / anchor_wh[0] + 1e-8)
    th = np.log(h / anchor_wh[1] + 1e-8)
    return np.array([tx, ty, tw, th])


def decode(tx_ty_tw_th, cell_x, cell_y, stride, anchor_wh):
    tx, ty, tw, th = tx_ty_tw_th
    cx = (sigmoid(tx) + cell_x) * stride
    cy = (sigmoid(ty) + cell_y) * stride
    w = anchor_wh[0] * np.exp(tw)
    h = anchor_wh[1] * np.exp(th)
    return np.array([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2])


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))
```

测试:encode una caja Reencode Usted debería conseguir muy cerca del resultado original`tx`No se encuentra en el rango postsigmoide, la inversa sigmoide no es completamente reversible, por lo que habrá ligeras diferencias.

### Paso 4: Una cabeza de YOLO más pequeña

Mapa de características de una 1x1 conv, remodelación por `(B, S, S, num_anchors, 5 + C)`¿Qué es eso?

```python
import torch
import torch.nn as nn

class YOLOHead(nn.Module):
    def __init__(self, in_c, num_anchors, num_classes):
        super().__init__()
        self.num_anchors = num_anchors
        self.num_classes = num_classes
        self.conv = nn.Conv2d(in_c, num_anchors * (5 + num_classes), kernel_size=1)

    def forward(self, x):
        n, _, h, w = x.shape
        y = self.conv(x)
        y = y.view(n, self.num_anchors, 5 + self.num_classes, h, w)
        y = y.permute(0, 3, 4, 1, 2).contiguous()
        return y
```

输出 forma:`(N, H, W, num_anchors, 5 + C)`❖ Última dimensión de conservación `[tx, ty, tw, th, obj, cls_0, ..., cls_{C-1}]`¿Qué es eso?

### 步骤 5: asignación de la verdad fundamental

Para cada caja de verdad, decide cuál.`(cell, anchor)`- ¿Qué pasa?

```python
def assign_targets(boxes_xyxy, classes, anchors, stride, grid_size, num_classes):
    num_anchors = len(anchors)
    target = np.zeros((grid_size, grid_size, num_anchors, 5 + num_classes), dtype=np.float32)
    has_obj = np.zeros((grid_size, grid_size, num_anchors), dtype=bool)

    for box, cls in zip(boxes_xyxy, classes):
        x1, y1, x2, y2 = box
        cx, cy = 0.5 * (x1 + x2), 0.5 * (y1 + y2)
        gx, gy = int(cx / stride), int(cy / stride)
        bw, bh = x2 - x1, y2 - y1

        ious = np.array([
            (min(bw, aw) * min(bh, ah)) / (bw * bh + aw * ah - min(bw, aw) * min(bh, ah))
            for aw, ah in anchors
        ])
        best = int(np.argmax(ious))
        aw, ah = anchors[best]

        target[gy, gx, best, 0] = cx / stride - gx
        target[gy, gx, best, 1] = cy / stride - gy
        target[gy, gx, best, 2] = np.log(bw / aw + 1e-8)
        target[gy, gx, best, 3] = np.log(bh / ah + 1e-8)
        target[gy, gx, best, 4] = 1.0
        target[gy, gx, best, 5 + cls] = 1.0
        has_obj[gy, gx, best] = True
    return target, has_obj
```

La selección de anclaje es  con la verdad de la tierra  具有最佳形状 IoU es una proxy barata, correspondiente a la asignación de YOLOv2/v3──v5 及后续版本使用更复杂的策略(task-aligned matching, dynamic k) 來细化相同思路──

### Paso 6: Tres pérdidas

```python
def yolo_loss(pred, target, has_obj, lambda_coord=5.0, lambda_obj=1.0, lambda_noobj=0.5, lambda_cls=1.0):
    has_obj_t = torch.from_numpy(has_obj).bool()
    target_t = torch.from_numpy(target).float()

    # box-regression loss: only on cells with objects
    box_pred = pred[..., :4][has_obj_t]
    box_true = target_t[..., :4][has_obj_t]
    loss_box = torch.nn.functional.mse_loss(box_pred, box_true, reduction="sum")

    # objectness loss
    obj_pred = pred[..., 4]
    obj_true = target_t[..., 4]
    loss_obj_pos = torch.nn.functional.binary_cross_entropy_with_logits(
        obj_pred[has_obj_t], obj_true[has_obj_t], reduction="sum")
    loss_obj_neg = torch.nn.functional.binary_cross_entropy_with_logits(
        obj_pred[~has_obj_t], obj_true[~has_obj_t], reduction="sum")

    # classification loss on cells with objects
    cls_pred = pred[..., 5:][has_obj_t]
    cls_true = target_t[..., 5:][has_obj_t]
    loss_cls = torch.nn.functional.binary_cross_entropy_with_logits(
        cls_pred, cls_true, reduction="sum")

    total = (lambda_coord * loss_box
             + lambda_obj * loss_obj_pos
             + lambda_noobj * loss_obj_neg
             + lambda_cls * loss_cls)
    return total, {"box": loss_box.item(), "obj_pos": loss_obj_pos.item(),
                   "obj_neg": loss_obj_neg.item(), "cls": loss_cls.item()}
```

5 hiperparámetros, cada tutorial de YOLO, ¿qué es el código duro, qué es el barro?`lambda_coord=5, lambda_noobj=0.5`El papel original YOLOv1 se ha adaptado y hasta el momento sigue siendo un valor de referencia razonable.

### Paso 7: Linea de la inferencia

Decode la salida de la cabeza original, aplica sigmoid/exp, según el umbral de objetividad 过, luego ejecuta NMS。

```python
def postprocess(pred_tensor, anchors, stride, img_size, conf_threshold=0.25, iou_threshold=0.45):
    pred = pred_tensor.detach().cpu().numpy()
    grid_h, grid_w = pred.shape[1], pred.shape[2]
    num_anchors = len(anchors)

    boxes, scores, classes = [], [], []
    for gy in range(grid_h):
        for gx in range(grid_w):
            for a in range(num_anchors):
                tx, ty, tw, th, obj, *cls = pred[0, gy, gx, a]
                score = sigmoid(obj) * sigmoid(np.array(cls)).max()
                if score < conf_threshold:
                    continue
                cls_idx = int(np.argmax(cls))
                cx = (sigmoid(tx) + gx) * stride
                cy = (sigmoid(ty) + gy) * stride
                w = anchors[a][0] * np.exp(tw)
                h = anchors[a][1] * np.exp(th)
                boxes.append([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2])
                scores.append(float(score))
                classes.append(cls_idx)

    if not boxes:
        return np.zeros((0, 4)), np.zeros((0,)), np.zeros((0,), dtype=int)
    boxes = np.array(boxes)
    scores = np.array(scores)
    classes = np.array(classes)
    keep = nms(boxes, scores, iou_threshold)
    return boxes[keep], scores[keep], classes[keep]
```

Éste es el total de evaluaciones.

## Usalo

`torchvision.models.detection` proporcionó detectores de producción de la misma estructura conceptual                                                                                                                                                                                                                                                        

```python
import torch
from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2

model = fasterrcnn_resnet50_fpn_v2(weights="DEFAULT")
model.eval()
with torch.no_grad():
    predictions = model([torch.randn(3, 400, 600)])
print(predictions[0].keys())
print(f"boxes:  {predictions[0]['boxes'].shape}")
print(f"scores: {predictions[0]['scores'].shape}")
print(f"labels: {predictions[0]['labels'].shape}")
```

 para las tuberías de inferencia en tiempo real,`ultralytics`(YOLOv8/v9) es el estándar:`from ultralytics import YOLO; model = YOLO('yolov8n.pt'); model(img)` El modelo se encargará de procesar internamente el decodificación y NMS, y volverá a la misma estructura que se construyó en el mismo.`boxes / scores / labels`Tres grupos.

##  entregarlo

Encuentro de trabajo:

- `outputs/prompt-detection-metric-reader.md` Una llamada, ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡`precision, recall, AP, mAP@0.5:0.95`转换为一句诊断和最有用的下一个实验──
- `outputs/skill-anchor-designer.md` Una habilidad, dado las cajas de la verdad de fondo DATABET, después `(w, h)`上运行 k-means,并返回 cada nivel de FPN de los conjuntos de anclaje y así como seleccionar el anclaje correcto Número de estadísticas de cobertura necesarias―

##  ejercicios

1. **（简单）**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `box_iou`, y 1000 grupos de cajas de pares de arriba con `torchvision.ops.box_iou`Para comparar, la mayor diferencia absoluta es menor que la de`1e-6`¿Qué es eso?
2. **（中等）**¿ Qué ?`yolo_loss`移植为使用 `CIoU`En un conjunto de datos sintéticos de 100 imágenes 上展示: en la misma época 数下,CIoU 收到更好最终 mAP@0.5:0.95。
3. **（困难）**实现 inferencia a múltiples escalas: en tres resoluciones, realizará las mismas imágenes de entrada de modelos, combinará las predicciones de la caja, y finalmente ejecutará una vez NMS── en un conjunto de medidas en el que se haga una sola escala 提升──

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|----------------------|
| Anchor | “Box prior” | 每个 grid cell 上的预定义 box shape，network 从中预测 deltas，而不是预测绝对坐标 |
| IoU | “Overlap” | 两个 box 的 Intersection-over-union；detection 中通用的相似度度量 |
| NMS | “Deduplicate” | 贪心算法，保留最高分 predictions，并移除高于阈值的重叠 predictions |
| Objectness | “Is there something here” | 每个 anchor、每个 cell 的 scalar，用于预测是否有 object 的中心落在该 cell 中 |
| Grid stride | “Downsample factor” | 每个 grid cell 对应的 pixels 数；416-px input 配 13-grid head 时 stride 为 32 |
| mAP | “Mean average precision” | precision-recall curve 下方面积的平均值，对 classes 求平均，并且（对 COCO）也对 IoU thresholds 求平均 |
| AP@0.5 | “PASCAL VOC AP” | IoU threshold 0.5 下的 average precision；该 metric 的宽松版本 |
| mAP@0.5:0.95 | “COCO AP” | 在 IoU thresholds 0.5..0.95、步长 0.05 上求平均；严格版本，也是当前社区标准 |

## 延伸阅读

- [YOLOv1: You Only Look Once (Redmon et al., 2016)](https://arxiv.org/abs/1506.02640) Papel de fundación; cada uno de los siguientes años fue un mejoramiento de la estructura
- [YOLOv3 (Redmon & Farhadi, 2018)](https://arxiv.org/abs/1804.02767)  Introducción de un papel de cabezas de estilo FPN a múltiples escalas; hasta el momento todavía hay un diagrama más claro
- [Ultralytics YOLOv8 docs](https://docs.ultralytics.com) 当前生产参考; abarcan formatos de conjuntos de datos, aumentos, recetas de formación
- [The Illustrated Guide to Object Detection (Jonathan Hui)](https://jonathan-hui.medium.com/object-detection-series-24d03a12f904) Para el zoológico de detectores completos 导览; Para entender la relación entre DETR、RetinaNet、FCOS y YOLO es muy valiosa
