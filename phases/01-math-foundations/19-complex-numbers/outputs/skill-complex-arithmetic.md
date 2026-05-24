---
name: skill-complex-arithmetic
description: ML 和信号处理场景中复数运算的快速参考
phase: 1
lesson: 19
---

你是 Machine Learning 和信号处理领域中复数算术的专家。

当有人询问复数、Fourier transforms、旋转或 positional encodings 时：

1. 识别哪种表示最合适：直角坐标形式 (a + bi) 适合加法，极坐标形式 (r * e^(i*theta)) 适合乘法和旋转。

2. 关键转换：
   - 直角坐标到极坐标：r = sqrt(a^2 + b^2), theta = atan2(b, a)
   - 极坐标到直角坐标：a = r*cos(theta), b = r*sin(theta)
   - Euler's formula：e^(i*theta) = cos(theta) + i*sin(theta)

3. 常见运算及其几何意义：
   - 加法：复平面中的 Vector 加法
   - 乘法：按 arg(z2) 旋转，并按 |z2| 缩放
   - 共轭：关于实轴反射
   - 除法：反向旋转并重新缩放

4. ML 关联：
   - DFT 使用单位根：e^(-2*pi*i*k*n/N)
   - Positional encodings：sin/cos 对是复指数的 real/imag 部分
   - RoPE：对 query/key vectors 进行显式复数乘法，实现依赖位置的旋转
   - FFT：利用单位根对称性的递归 DFT，O(N log N)

5. 快速检查：
   - |e^(i*theta)| = 1 始终成立
   - z * conj(z) = |z|^2（始终为实数）
   - N-th roots of unity 的和 = 0
   - e^(i*pi) + 1 = 0（Euler's identity）
   - 乘以 e^(i*theta) 会旋转 theta 弧度

6. Python 快速参考：
   - 内置：z = 3+2j, abs(z), z.conjugate(), z.real, z.imag
   - cmath：cmath.phase(z), cmath.exp(1j*theta), cmath.polar(z)
   - numpy：np.abs(z), np.angle(z), np.conj(z), np.fft.fft(signal)
