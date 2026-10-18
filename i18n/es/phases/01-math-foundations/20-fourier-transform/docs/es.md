# Transformación de Fourier

> Cada señal es una superposición de ondas sinusoideas. La transformación de Fourier te dirá cuáles son.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04, 19 (complex numbers)
**Time:** ~90 分钟

## El objetivo del aprendizaje
- Desde el 0 de la realización de DFT,并用 $O(N \log N)$De Cooley-Tukey FFT 验证它
- Comprender los coeficientes de frecuencia: de señal en el espectro de amplitud, fase y potencia
-  aplicación del teorema de la convolución, a través de la multiplicación FFT  ejecutar la convolución
- La descomposición de la frecuencia de Fourier con los codificadores posicionales del transformador y las capas de convolución de CNN  enlace

##  problemas
Una serie de valores de la presión que cambian con el tiempo. El precio de la acción es una serie de valores de la intensidad de los píxeles en el espacio.

Pero muchos patrones en el dominio del tiempo son invisibles. ¿Esta señal de audio es tono puro o acorde? ¿Existe un ciclo semanal? ¿Esta imagen tiene textura repetitiva?

La transformación de Fourier transformará los datos del dominio del tiempo 转换到频域── recibe una señal,并将其分解成不同频率的弦波── cada una de las ondas sine tiene una amplitud (强度) y una fase (起始位置)──La transformación de Fourier transformará simultáneamente para indicarles estas dos cosas──

Esto es importante para el ML, porque el pensamiento de dominio de frecuencia 隨處可见──Convolución de redes neuronales  ejecutar la convolución, mientras que la convolución en el dominio de frecuencia es la multiplicación──Transformar codificaciones posicionales Utiliza la descomposición de frecuencia para indicar la posición──Modelos de audio(Reconocimiento de habla、 generación de música) procesar espectrogramas, es decir, representaciones de frecuencia de sonido──Modelos de serie de tiempo 会寻找周期模式──entender la transformación de Fourier, hacerte equipar para tratar estos problemas el vocabulario necesario──

## 概念
### La definición de DFT

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $N$个 muestras $x[0], x[1], \ldots, x[N-1]$,Discrete Fourier Transform 会生成 $N$个 coeficientes de frecuencia $X[0], X[1], \ldots, X[N-1]$¿Qué es esto ?

```math
X[k] = \sum_{n=0}^{N-1} x[n] \, e^{-2\pi i k n/N} \qquad \text{其中 } k = 0, 1, \ldots, N-1
```

Cada uno .$X[k]$Es un número complejo. Su magnitud.$\lvert X[k] \rvert$Indicar la frecuencia $k$La amplitud... su fase.$\angle X[k]$Indicar la desviación de la fase de la frecuencia.

¿Qué es esto?$e^{-2\pi i k n/N}$Es una frecuencia.$k$旋转的phasor──DFT 计算是信号与 $N$个等间隔频率 中每一个的相关性.$k$La correlación es muy grande.

### El significado de cada uno de los números

**$X[0]$: DC component。**Es la suma de todas las muestras, con la proporción de 成比例 media.

```math
X[0] = \sum_{n=0}^{N-1} x[n] \, e^0 = \text{全部 samples 之和}
```

**$X[k]$ for $1 \le k \le N/2$: positive frequencies。** $X[k]$Muestra cada uno$N$个 muestras 中 $k$个 ciclos de frecuencia:$k$越大, frecuencia 越高 oscillación 越快)

**$X[N/2]$: Nyquist frequency。**Es el .$N$个样本 能表示的最高频率──超越这个频率,就会出现别名,也就是高频率──伪装成低频率──

**$X[k]$ for $N/2 < k < N$: negative frequencies。** para las señales de valor real,$X[N-k] = \overline{X[k]}$Las frecuencias negativas son el reflejo de las positivas.$N/2 + 1$个 coeficientes 中──

### DFT inverso

Reverso DFT de los coeficientes de frecuencia de la reunión 重建原始信号:

```math
x[n] = \frac{1}{N} \sum_{k=0}^{N-1} X[k] \, e^{2\pi i k n/N} \qquad \text{其中 } n = 0, 1, \ldots, N-1
```

La única diferencia entre el DFT de adelante y el exponente de la posición es que el símbolo de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la posición de la cuento es es es es es es es es es es es es es es es es es es es es es es es es es una de la posición de la posición de la posición de la posición$1/N$Factor de normalización

La DFT inversa es una reconstrucción perfecta. No perderá ningún tipo de información. Puedes pasar del dominio del tiempo al dominio de la frecuencia, volver y volver sin producir ningún error.

### El FFT: hacerlo rápido

Como se define anteriormente, la DFT es$O(N^2)$Por lo tanto ,$N$个 de producción coeficientes de entre cada uno, todos por $N$个 muestras de entrada 求和──当 $N$= 1 millón, esto es todo.$10^{12}$Las siguientes operaciones.

Transformación rápida de Fourier (FFT) 会以$O(N \log N)$計算同样结果──当 $N$= 1 millón de veces, esto es aproximadamente 20 millones de operaciones, no un millón de veces. Esto hace que el análisis de frecuencia se haga posible.

Algorithm Cooley-Tukey (FFT) utiliza dividir y conquistar:

1. Se dividirá la señal en muestras de índice par y impar.
2. 递归计算每一半的 DFT──
3. Usando "factores gemelos" $e^{-2\pi i k/N}$合并两个 DFT de medio tamaño.

```math
\begin{aligned}
X[k] &= E[k] + e^{-2\pi i k/N} \, O[k] && \text{其中 } k = 0, \ldots, N/2 - 1 \\
X[k + N/2] &= E[k] - e^{-2\pi i k/N} \, O[k] && \text{其中 } k = 0, \ldots, N/2 - 1 \\[6pt]
\text{其中 } E &= \text{偶数索引 samples 的 DFT} \\
O &= \text{奇数索引 samples 的 DFT}
\end{aligned}
```

Esta simetría significa cada uno de los niveles de ejecución de la recesiva.$O(N)$trabajo, y hay$\log_2(N)$层――总计:$O(N \log N)$¿Qué es eso?

```mermaid
graph TD
    subgraph "8-point FFT (Cooley-Tukey)"
        X["x[0..7]<br/>8 samples"] -->|"split even/odd"| E["Even: x[0,2,4,6]"]
        X -->|"split even/odd"| O["Odd: x[1,3,5,7]"]
        E -->|"4-pt FFT"| EK["E[0..3]"]
        O -->|"4-pt FFT"| OK["O[0..3]"]
        EK -->|"combine with twiddle factors"| XK["X[0..7]"]
        OK -->|"combine with twiddle factors"| XK
    end
    subgraph "Complexity"
        C1["DFT: O(N^2) = 64 multiplications"]
        C2["FFT: O(N log N) = 24 multiplications"]
    end
```

FFT  requerir longitud de señal es de 2 ── En la práctica, las señales normalmente se cero-pad hasta el siguiente de 2 ──

### Análisis espectral

**power spectrum**Sí $\lvert X[k] \rvert^2$, es la magnitud cuadrada de cada coeficiente de frecuencia. Muestra que cada frecuencia tiene mucha energía.

**phase spectrum**Sí $\angle X[k]$,也就是每个频率的相对应──对于大多数分析任务,你关心的是功率谱,并会忽略相──

```math
\begin{aligned}
\text{频率 } k \text{ 处的 Power：} \quad P[k] &= |X[k]|^2 = \mathop{\mathrm{Re}}(X[k])^2 + \mathop{\mathrm{Im}}(X[k])^2 \\
\text{频率 } k \text{ 处的 Phase：} \quad \phi[k] &= \mathop{\mathrm{atan2}}(\mathop{\mathrm{Im}}(X[k]), \mathop{\mathrm{Re}}(X[k]))
\end{aligned}
```

### Resolución de frecuencia

Resolución de frecuencia de DFT  Depende de las muestras $N$y la tasa de muestreo $f_s$¿Qué es eso?

```math
\begin{aligned}
\text{bin } k \text{ 对应的频率：} \quad & f_k = k \cdot f_s / N \\
\text{频率分辨率：} \quad & \Delta f = f_s / N \\
\text{最高频率：} \quad & f_{\max} = f_s / 2 \quad \text{(Nyquist)}
\end{aligned}
```

Para distinguir dos frecuencias muy cercanas, necesitas más muestras... para capturar frecuencias altas, necesitas una tasa de muestreo más alta...

### El teorema de la convolución

Este es uno de los resultados más importantes del procesamiento de señales, y está directamente relacionado con las CNN.

**time domain 中的 convolution 等于 frequency domain 中的 pointwise multiplication。**

```math
\begin{aligned}
& x * h = \text{IFFT}(\text{FFT}(x) \cdot \text{FFT}(h)) \\[4pt]
& \text{其中 } * \text{ 表示 convolution，} \cdot \text{ 表示 element-wise multiplication}
\end{aligned}
```

¿Por qué es importante ?

- 两个长度为 $N$Y $M$Las señales  direct convolución  necesitan $O(NM)$Operaciones
-  Basado en la convolución de FFT  necesita $O(N \log N)$:transform 两者、multiplicar、transform back──
-  Para los núcleos grandes, la convolución FFT 会快得多──
- Esto es lo que ocurre en las capas convolutivas de campos receptivos grandes.

Nota:DFT  calcular es una convolución circular (signal 会 wrap around) ・・・ Para la convolución lineal (linear convolución)  sin envoltura, por favor en el cálculo anterior se darán dos señales de cero pad hasta la longitud $N + M - 1$¿Qué es eso?

```mermaid
graph LR
    subgraph "Time Domain"
        TA["Signal x[n]"] -->|"convolve (slow: O(NM))"| TC["Output y[n]"]
        TB["Filter h[n]"] -->|"convolve"| TC
    end
    subgraph "Frequency Domain"
        FA["FFT(x)"] -->|"multiply (fast: O(N))"| FC["FFT(x) * FFT(h)"]
        FB["FFT(h)"] -->|"multiply"| FC
        FC -->|"IFFT"| FD["y[n]"]
    end
    TA -.->|"FFT"| FA
    TB -.->|"FFT"| FB
    FD -.->|"same result"| TC
```

### Las ventanas

DFT 假设 señal es periódico,也就是把 $N$个样本 视为无限重复信号的一个周期──如果信号的起点和终点不是同一个值,就会在边界产生不连续性,并表现为虚假的高频内容──这称为光谱泄漏──

Las ventanas se encuentran en el cálculo de DFT, de modo que la señal de los dos extremos se reduce a cero, lo que reduce la fuga.

常见 ventanas:

| Window | Shape | Main lobe width | Side lobe level | Use case |
|--------|-------|----------------|-----------------|----------|
| Rectangular | 平坦（无 window） | 最窄 | 最高 (-13 dB) | 当 signal 在 N 个 samples 中正好 periodic 时 |
| Hann | Raised cosine | 中等 | 低 (-31 dB) | 通用 spectral analysis |
| Hamming | Modified cosine | 中等 | 更低 (-42 dB) | Audio processing、speech analysis |
| Blackman | Triple cosine | 宽 | 非常低 (-58 dB) | 当 side lobe suppression 至关重要时 |

```math
\begin{aligned}
\text{Hann window：} \quad & w[n] = 0.5 \left(1 - \cos\frac{2\pi n}{N-1}\right) \\
\text{Hamming window：} \quad & w[n] = 0.54 - 0.46 \cos\frac{2\pi n}{N-1}
\end{aligned}
```

Antes de DFT, la ventana se aplicará a la señal haciendo la multiplicación de elementos para la ventana:`X = DFT(x * w)`¿Qué es eso?

### Propiedades de DFT

| Property | Time Domain | Frequency Domain |
|----------|-------------|-----------------|
| Linearity | $ax + by$ | $aX + bY$ |
| Time shift | $x[n - k]$ | $X[f] e^{-2\pi i f k/N}$ |
| Frequency shift | $x[n] e^{2\pi i f_0 n/N}$ | $X[f - f_0]$ |
| Convolution | $x * h$ | $X \cdot H$ (pointwise) |
| Multiplication | $x \cdot h$ (pointwise) | $X * H$ (circular convolution, scaled by $1/N$) |
| Parseval's theorem | $\sum \lvert x[n] \rvert^2$ | $\frac{1}{N} \sum \lvert X[k] \rvert^2$ |
| Conjugate symmetry (real input) | $x[n]$ real | $X[k] = \overline{X[N-k]}$ |

El teorema de Parseval expresa la energía total en dos dominios entre los mismos.

### Enlace con codificación posicional

Original Transformer Utiliza codificaciones posicionales sinusoidales:

```math
\begin{aligned}
PE(pos, 2i) &= \sin\left(pos / 10000^{2i/d_{\text{model}}}\right) \\
PE(pos, 2i+1) &= \cos\left(pos / 10000^{2i/d_{\text{model}}}\right)
\end{aligned}
```

Cada uno de las dimensiones$(2i, 2i+1)$Las frecuencias de las frecuencias de las frecuencias de las frecuencias de las dimensiones de la alta a la baja, de las dimensiones de la última a la alta, de las dimensiones de la última a la última, de acuerdo con el espacio geométrico, de acuerdo a la clasificación. Esto permite que cada posición en todas las bandas de frecuencia tenga un patrón único, similar a los coeficientes de Fourier, que identifica únicamente una señal.

Ofrece propiedades clave:

- **Uniqueness:**Cualquier dos posiciones no tendrán la misma codificación.
- **Bounded values:**Sin y cos siempre en$[-1, 1]$En el interior.
- **Relative position:**posición $p+k$La codificación puede representarse como posición $p$处 codificación de la función lineal──modelo puede aprender a concentrarse en las posiciones relativas──

### Conexión con las CNN

La capa de conversión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Según el teorema de la convolución, esto es lo siguiente:
1. Para la entrada  ejecutar FFT
2. Para ejecutar el FFT
3. En el dominio de frecuencia multiplicar
4. Para el resultado de la ejecución de la IFFT

标准 CNN 实现使用直接卷积 (convolucción directa) 对小型3x3 kernels 更快) 但是对于大型 kernels或全球卷积,基于FFT的方法会显著更快──一些架构 (例如 FNet) 完全使用FFT 替代注意,在$O(N \log N)$Y no$O(N^2)$La complejidad, la precisión y la competitividad.

### Espectogramas y Transformación de Fourier de corto plazo

单次 FFT dará el contenido de frecuencia de toda la señal, pero no puede decirte estas frecuencias cuándo aparecen.                                                                                                                                                                                                                                                 

La transformación de Fourier de tiempo corto (STFT) 通过在信号的重叠窗户上计算 FFT来解决这个问题──结果是光谱:一种2D representación, una de las cuales es el tiempo, otro eje es la frecuencia──intensidad de cada punto indicando el tiempo arriba de esta frecuencia──energía──

```
STFT procedure:
1. Choose a window size (e.g., 1024 samples)
2. Choose a hop size (e.g., 256 samples -- 75% overlap)
3. For each window position:
   a. Extract the windowed segment
   b. Apply a Hann/Hamming window
   c. Compute FFT
   d. Store the magnitude spectrum as one column of the spectrogram
```

Los espectrogramas son la representación estándar de los modelos de audio ML. Los modelos de reconocimiento de voz (Whisper, DeepSpeech) procesan los espectrogramas mel, es decir, las frecuencias se proyectan a escala mel, lo que se ajusta más a la percepción de tono humana.

### Alfabetización

Si la señal 含高于 $f_s/2$Las frecuencias de (frecuencia Nyquist)$f_s$El muestreo producirá copias alias. Una señal de 90 Hz de muestreo de 100 Hz parece la misma que la señal de 10 Hz. Sólo con muestras no se pueden distinguir.

```
Example:
  True signal: 90 Hz sine wave
  Sampling rate: 100 Hz
  Apparent frequency: 100 - 90 = 10 Hz

  The samples from the 90 Hz signal at 100 Hz sampling rate
  are identical to the samples from a 10 Hz signal.
  No amount of math can recover the original 90 Hz.
```

Es por eso que los convertidores analógicos a digitales contendrán filtros antialiasing, en muestreo de la muestreo anterior a la transferencia de frecuencias de Nyquist. En ML, cuando no hay un filtro de bajo paso apropiado en cuanto a mapas de características de muestreo de abajo, surgirá aliasing; algunas arquitecturas utilizan capas de aglutinamiento antialiasing para tratar este problema.

### El empate cero no mejora la resolución

Un error común es: en FFT antes de la señal  realizar empadeo cero 会提升频分辨率──它不会──零padding 只是插在现有频段之间,让频谱看起来更平滑──但它无法揭示原始样本中不存在的频率细节──

La resolución de frecuencia real depende del tiempo de observación .$T = N / f_s$                                                                                                                                                                                                                                                              $\Delta f$De las dos frecuencias, usted necesita al menos $T = 1 / \Delta f$秒的数据── no importa cuánto haga el empate cero, todo no puede cambiar este límite fundamental―


```figure
fourier-synthesis
```

## Construirlo
### 步骤 1: DFT desde cero

$O(N^2)$DFT  directamente de la definición.

```python
import math

class Complex:
    ...

def dft(x):
    N = len(x)
    result = []
    for k in range(N):
        total = Complex(0, 0)
        for n in range(N):
            angle = -2 * math.pi * k * n / N
            w = Complex(math.cos(angle), math.sin(angle))
            xn = x[n] if isinstance(x[n], Complex) else Complex(x[n])
            total = total + xn * w
        result.append(total)
    return result
```

### 步骤 2: DFT inverso

结构 igual, exponente 为正,并除以 $N$¿Qué es eso?

```python
def idft(X):
    N = len(X)
    result = []
    for n in range(N):
        total = Complex(0, 0)
        for k in range(N):
            angle = 2 * math.pi * k * n / N
            w = Complex(math.cos(angle), math.sin(angle))
            total = total + X[k] * w
        result.append(Complex(total.real / N, total.imag / N))
    return result
```

### 步骤 3: FFT (Cooley-Tukey)

FFT recursiva 要求长度为 2 的──拆分为 even 和 odd,递归, luego con factores de doble 合并──

```python
def fft(x):
    N = len(x)
    if N <= 1:
        return [x[0] if isinstance(x[0], Complex) else Complex(x[0])]
    if N % 2 != 0:
        return dft(x)

    even = fft([x[i] for i in range(0, N, 2)])
    odd = fft([x[i] for i in range(1, N, 2)])

    result = [Complex(0)] * N
    for k in range(N // 2):
        angle = -2 * math.pi * k / N
        twiddle = Complex(math.cos(angle), math.sin(angle))
        t = twiddle * odd[k]
        result[k] = even[k] + t
        result[k + N // 2] = even[k] - t
    return result
```

### 步骤 4: Auxiliares de análisis espectral

```python
def power_spectrum(X):
    return [xk.real ** 2 + xk.imag ** 2 for xk in X]

def convolve_fft(x, h):
    N = len(x) + len(h) - 1
    padded_N = 1
    while padded_N < N:
        padded_N *= 2

    x_padded = x + [0.0] * (padded_N - len(x))
    h_padded = h + [0.0] * (padded_N - len(h))

    X = fft(x_padded)
    H = fft(h_padded)

    Y = [xk * hk for xk, hk in zip(X, H)]

    y = idft(Y)
    return [y[n].real for n in range(N)]
```

## Usalo
En el trabajo real, usando FFT de numpy, es apoyado por bibliotecas C altamente optimizadas.

```python
import numpy as np

signal = np.sin(2 * np.pi * 5 * np.arange(256) / 256)
spectrum = np.fft.fft(signal)
freqs = np.fft.fftfreq(256, d=1/256)

power = np.abs(spectrum) ** 2

positive_freqs = freqs[:len(freqs)//2]
positive_power = power[:len(power)//2]
```

 Para el análisis espectral de ventanas y más avanzado:

```python
from scipy.signal import windows, stft

window = windows.hann(256)
windowed = signal * window
spectrum = np.fft.fft(windowed)
```

 Para la convolución:

```python
from scipy.signal import fftconvolve

result = fftconvolve(signal, kernel, mode='full')
```

 Para los espectrogramas:

```python
from scipy.signal import stft

frequencies, times, Zxx = stft(signal, fs=sample_rate, nperseg=256)
spectrogram = np.abs(Zxx) ** 2
```

Es la forma de la matriz de espectro es (n_frecuencias, n_time_frames) ⋅ cada una de las filas son una ventana de tiempo ⋅ el espectro de potencia de la matriz ⋅ esto es el audio de los modelos ML ⋅ como entrada ⋅ consumo ⋅ contenido

##  entregarlo
运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/fourier.py`¿Qué es esto ?`outputs/prompt-spectral-analyzer.md`¿Qué es eso?

##  ejercicios
1. **Pure tone identification。**创建一个信号,其中包含一个未知频率(1到50 Hz 之间) de una sola onda senoidal, con muestreo de 128 Hz 1 秒──使用你的DFT 识别频率──验证答案是否匹配──现在加入标准偏差为0.5的高斯噪音,并重复──噪音 如何影响光谱?

2. **FFT vs DFT verification。**Se produce una señal aleatoria de 64 dimensiones.$O(N^2){}$) y FFT──verificación de todos los coeficientes en 1e-10 以内匹配── en longitud de 256、512、1024 y 2048 señales 上分別计时两个 funciones──绘制 DFT tiempo y FFT tiempo ratio──

3. **Convolution theorem proof by example。**创建信号 x = [1, 2, 3, 4, 0, 0, 0, 0] 和 filter h = [1, 1, 1, 0, 0, 0, 0, 0]──直接计算它们的圆卷 (圆卷) 嵌套)──然后通过FFT 计算(转换、乘用、逆转)──验证结果匹配──现在通过适当的零执行线性卷──

4. **Windowing effects。**Crear una señal, es 10 Hz y 12 Hz ((muy cerca) dos ondas senolares de y ⋅ en 128 Hz muestreo 1 segundo separado en sin ventana ⋅ ventana Hann y ventana Hamming ⋅ en el cálculo del espectro de potencia ⋅ en qué ventana es más fácil distinguir entre dos picos? ¿Por qué?

5. **Positional encoding analysis。**Por d_modelo = 128 和 max_pos = 512 生成 sinusoidal codificación posicional$(p_1, p_2)$, calcular los códigos de producto de puntos.$\lvert p_1 - p_2 \rvert$, sin depender de posiciones absolutas, ¿con la distancia, aumentando, el producto punto ¿qué pasará?

### 提示

**练习 1。**En un segundo, 128 veces, Bin.$k$En el caso de la$k$Hz, por lo tanto, para la frecuencia de los números enteros, los binos 1 a 63 el índice de valor máximo es la frecuencia. Elige una frecuencia de Hz de un número entero.`generate_signal`Y `magnitude_spectrum` Después de unirse al ruido, comprobar si el valor máximo se encuentra en el mismo contenedor, mientras que el valor de los demás contenedores aumenta de forma significativa.

**练习 2。**Uso de 2 veces, porque`fft`Se puede ver el resultado de la prueba de la prueba de la prueba.`max(abs(a - b))`◊ El tiempo que se consume debe ser de gran envergadura$N / \log_2 N$增长── en el mismo lugar.

**练习 3。**Para la convolución circular, mano$n$= 0 、1 、2 时的 $y[n] = \sum_k h[k] x[(n-k) \bmod 8]$,并比较 `convolve_direct`Y `convolve_fft`La longitud de la convolución lineal es de 4 + 3 - 1 = 6, por lo que primero comprueba la longitud 8 si ya es suficiente.

**练习 4。**Uso `hann_window`¿Qué es esto?`hamming_window`¿Qué es esto?`apply_window`Y `power_spectrum`, y se calcula que entre 9 y 13 Hz hay varias picas de separación: 10 Hz y 12 Hz en 1 segundo, y que no hay más ventanas, puede parecer mejor.

**练习 5。**Uso `positional_encoding(pos, 128)`計算每加码──比较位置 (0, 10) 的点 product 和位置 (100, 110) 的点 product: la diferencia entre ambos debe estar en aproximadamente 1e-10 以内──然后固定一个 $p_1$, dibujar puntos de producto$\lvert p_1 - p_2 \rvert$变化的曲线──

## 关键术语: "El hombre es un hombre"
| Term | What it means |
|------|---------------|
| DFT (Discrete Fourier Transform) | 将 $N$ 个 time-domain samples 转换为 $N$ 个 frequency-domain coefficients。每个 coefficient 都是与该 frequency 上 complex sinusoid 的 correlation |
| FFT (Fast Fourier Transform) | 用于计算 DFT 的 $O(N \log N)$ algorithm。Cooley-Tukey algorithm 递归拆分 even/odd indices |
| Inverse DFT | 从 frequency coefficients 重建 time-domain signal。公式与 DFT 相同，但 exponent sign 相反，并带有 $1/N$ scaling |
| Frequency bin | DFT output 中的每个 index $k$ 表示 frequency $k f_s/N$ Hz。"bin" 是离散的 frequency slot |
| DC component | $X[0]$，zero-frequency coefficient。与 signal mean 成比例 |
| Nyquist frequency | $f_s/2$，在 sampling rate $f_s$ 下可表示的最大 frequency。高于它的 frequencies 会 alias |
| Power spectrum | $\lvert X[k] \rvert^2$，每个 frequency coefficient 的 squared magnitude。显示 energy 在 frequencies 上的分布 |
| Phase spectrum | $\angle X[k]$，每个 frequency component 的 phase offset。在 analysis 中通常会忽略 |
| Spectral leakage | 将 non-periodic signal 当作 periodic 处理导致的虚假 frequency content。可通过 windowing 减少 |
| Window function | 在 DFT 前应用的 tapering function（Hann、Hamming、Blackman），用于减少 spectral leakage |
| Twiddle factor | FFT butterfly computation 中用于合并 sub-DFTs 的 complex exponential $e^{-2\pi i k/N}$ |
| Convolution theorem | time domain 中的 convolution 等于 frequency domain 中的 pointwise multiplication。它是 signal processing 和 CNNs 的基础 |
| Circular convolution | signal 会 wrap around 的 convolution。这是 DFT 自然计算的内容 |
| Linear convolution | 没有 wraparound 的标准 convolution。通过在 DFT 前 zero-padding 实现 |
| Parseval's theorem | 总 energy 在 Fourier transform 中保持不变。$\sum \lvert x[n] \rvert^2 = \frac{1}{N} \sum \lvert X[k] \rvert^2$ |
| Aliasing | 当 sampling rate 不足时，高于 Nyquist 的 frequencies 表现为较低 frequencies |

## 延伸阅读
- [Cooley & Tukey: An Algorithm for the Machine Calculation of Complex Fourier Series (1965)](https://www.ams.org/journals/mcom/1965-19-090/S0025-5718-1965-0178586-1/)-   modificar la informática  original FFT 论文
- [3Blue1Brown: But what is the Fourier Transform?](https://www.youtube.com/watch?v=spUNpyF58BY)-  Sobre las mejores visibilidades de las transformaciones de Fourier
- [Lee-Thorp et al.: FNet: Mixing Tokens with Fourier Transforms (2021)](https://arxiv.org/abs/2105.03824)- En transformadores en el uso de FFT  sustitución de la auto-atención
- [Smith: The Scientist and Engineer's Guide to Digital Signal Processing](http://www.dspguide.com/)- 免费在线教材, en profundidad, FFT, ventanas y análisis espectral
- [Vaswani et al.: Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762)- Descomposición de la frecuencia de Fourier  Derivados codificadores sinusoidales de posición
- [Radford et al.: Whisper (2022)](https://arxiv.org/abs/2212.04356)- Utiliza mel-spectrogramas  como representación de entrada de reconocimiento de voz
