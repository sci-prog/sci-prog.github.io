---
title: "Introducción a NumPy"
date: "2018-05-01T22:30:18-03:00"
tags: [python, numpy]
---

Que *Python es demasiado lento* es una de las razones para usar cualquier otro
lenguaje cuando se trata de simulación y manipulación de datos, no obstante
Python es una herramienta excelente cunado se trata de unir programas escritos
en otros lenguajes, uno de los ejemplos mas poderosos del poder de Python como
pegamento es la librería [NumPy] y en general todas las librerías del
ecosistema [SciPy].  Estas librerías traen el poder de paquetes tradicionales
muy fuertes como BLAS y LAPACK al servicio de programas en Python, dando como
resultado un excelente balance entre el rendimiento de los lenguajes de bajo
nivel y usabilidad de Python. En las presente introducción vamos a explorar las
capacidades de la estructura de datos básica que nos ofrece NumPy
`numpy.array`.

## Tamaño y ejes

Para estudiar el tamaño o forma _(size or shape)_ de un arreglo, estudiamos
algunas de las funciones que nos ofrece NumPy para la creación de arreglos,
empecemos con la más humilde 😅, construir un arreglo (o matriz) convirtiendo
una lista de listas en una matriz:

```python
import numpy
matrix = numpy.array([
  [1, 0],
  [0, 1],
])
print(matrix.shape) # (2,2)
```

NumPy ofrece herramientas un poco más avanzadas para crear arreglos como:

- Crear un arreglo lleno de unos (`1`) con un tamaño definido (`numpy.ones`)
- Crear un arreglo lleno de ceros (`0`) con un tamaño igual al de otro arreglo
  (`numpy.zeros_like`)
- Crear un arreglo lleno de números aleatorios con distribución normal con un
  tamaño definido (`numpy.random.normal`).

Este es un simple subconjunto de todas las herramientas que ofrece NumPy para
crear arreglos, aquí ofrecemos algunos ejemplos.

```python
import numpy
ones = numpy.ones(10)
print(ones.shape) # (10,)
zeros = numpy.zeros_like(ones)
print(zeros.shape) # (10,)
speed = numpy.random.normal(size=(10, 2))
print(speed.shape) # (10,2)
```

Ahora, el tema que nos atañe es el tamaño o forma y los ejes, pues bien, los
arreglos de NumPy son arreglos *n*-dimensionales, un arreglo de una dimensión
es un vector, un arreglo de dos dimensiones es una matriz y un cubo de datos
sería un arreglo de tres dimensiones, los arreglos *n*-dimensionales pueden
tener más dimensiones, pero a partir de tres dimensiones es un poco difícil de
visualizar. Ahora el tamaño o forma de un arreglo es la cantidad de elementos
en cada dimensión, por ejemplo un vector en 3 dimensiones tendrá una forma
`(3,)`[^1], una matriz de 2 por 2 tendrá forma `(2,2)`, las dimensiones también
se conocen como ejes, la primera dimensión de una matiz sería `axis=0`.

## Operaciones aritméticas

### Arreglo con escalar

Una vez creados los arreglos estos pueden ser operados con escalares. Siendo
un arreglo de cualquier forma `A` y un escalar `c`, algunas operaciones que
se pueden realizar con NumPy son:

- `A + c`  suma a cada uno de los elementos del arreglo `A` la constante `c`.
- `A - c`, `A * c`, `A / c` hacen cada operación con cada uno de los elementos
  del arreglo `A`.

```python
import numpy
A = numpy.array([1, 2, 3])
c = 1
D = A + c # [2, 3, 4]
```

### Arreglos de forma congruente

Las operaciones aritméticas entre arreglos de forma congruente son, en general,
elemento a elemento, si tenemos arreglos de la misma forma `A` y `B` se pueden
efectuar las operaciones `A + B`, `A - B`, `A * B` y `A / B`,

```python
import  numpy
A = numpy.array([1, 3])
B = numpy.array([1, 1])
C = A + B # [2, 4]
```

Python recientemente ha introducido un operador para multiplicación de
matrices, por ejemplo, si tenemos una matriz `A` de forma `(2, 3)` y una matriz
`B` de forma `(3, 2)`, entonces el producto entre matices `C` se escribiría en
Python `C = A @ B` y tendría forma `(2, 2)` por otra parte otro producto entre
matrices `D = B @ A`

```python
import numpy
A = numpy.array([[1, 1, 1], [2, 2, 2]])
B = numpy.array([[3, 3], [4, 4], [5, 5]])
C = A @ B # [[12, 12], [24, 24]]
```

## Arreglos de forma aparentemente incongruente (Broadcasting)

NumPy tiene una característica llamada _[broadcasting]_, esta característica
permite operar sobre arreglos de diferentes forma y número de dimensiones las
reglas para estas operaciones son bastante simples, sin embargo, debemos tener
en cuenta que un vector tridimensional tiene forma: `(3,)` pero también se
puede ver como una matriz de forma `(1,3)`, o como un cubo de datos de forma
`(1,1,3)`.

Por medio del _broadcasting_ se pueden realizar operaciones componente a
componente sobre matrices si sus dimensiones, comparadas de la última hacia
atras, cumplen una de las siguientes condiciones:

- Son iguales
- Una de las dos es 1

En este caso, dos arreglos de formas `(3,)` y `(4,)`, no se pueden operar,
mientras que dos arreglos de la forma `(3,)` sí se podrán operar (como es de
esperarse). Pero estas reglas tienen la consecuencia de que dos arreglos de
formas `(3,1)` y `(4,)` sí se pueden operar porque comparando sus formas de
derecha a izquierda encontramos que:

- 1 y 4 no son iguales, pero uno de los dos es igual a 1.
- 3 y 1 (la forma `(4,)` puede ser vista como `(1,4)`) no son iguales, pero uno
  de los dos es igual a 1.

Exploremos cómo se pueden realizar estas operaciones cuando las dimensiones no
son iguales, en este caso, el arreglo cuya dimension es 1 es extendido para
ajustarse a la dimensión del otro arreglo, tomemos por ejemplo una matriz de
ceros de forma `(3,4)` y un vector de forma `(4,)`:

```python
import numpy
A = numpy.zeros((3, 4))
B = numpy.array([1, 2, 3, 4])
print(A + B)
# [[1. 2. 3. 4.]
#  [1. 2. 3. 4.]
#  [1. 2. 3. 4.]]
```

De manera similar funcionaría nuestro ejemplo sobre dos arreglos con formas
`(3,1)` y `(4,)`:

```python
import numpy
A = numpy.zeros((3, 1))
B = numpy.array([1, 2, 3, 4])
print(A + B)
# [[1. 2. 3. 4.]
#  [1. 2. 3. 4.]
#  [1. 2. 3. 4.]]
```

## Otras funciones

NumPy también ofrece una variedad de funciones especiales que se pueden aplicar
sobre cada uno de los elementos de un arreglo, por ejemplo:

```python
import numpy
x = numpy.pi * numpy.array([0, 0.5, 1, 1.5, 2])
print(numpy.sin(x))
# [ 0.0000000e+00  1.0000000e+00  1.2246468e-16 -1.0000000e+00 -2.4492936e-16]
print(numpy.round(numpy.sin(x), 2))
# [ 0.  1.  0. -1. -0.]
```

En el paquete NumPy directamente, se pueden encontrar las funciones matemáticas
esenciales como `numpy.sin`, `numpy.cos`, `numpy.sqr`, `numpy.log`, mientras
que en el paquete SciPy se pueden encontrar funciones especiales como las
funciones de Bezel.

Otras funciones como `numpy.sum` y `numpy.prod` calculan la sumatoria o la
productoria de una arreglo, estas reciben un eje o una lista de ejes para
calcular la reducción a lo largo de ellos. Por ejemplo, para calcular la norma
de un vector procederíamos:

```python
import numpy
x = numpy.array([1, 1, 1])
print(numpy.sqrt(numpy.sum(x * x)))
# 1.7320508075688772
```

Para esta operación hay un alias, la funcion `numpy.linalg.norm`. En el paquete
`numpy.linalg` se pueden encontrar varias funciones relacionadas con álgebra
lineal. Para calcular la norma de cada uno de los vectores en una matriz, se
puede proceder[^2]:

```python
import numpy
r = numpy.random.randint(10, size=(5, 3))
print(r)
# [[5 8 9]
#  [0 3 2]
#  [9 4 3]
#  [6 9 8]
#  [7 3 6]]
print(numpy.linalg.norm(r, axis=1))
# [13.03840481  3.60555128 10.29563014 13.45362405  9.69535971]
```

## Ejemplo: Velocidad inicial de un sistema de partículas

Para calcular la velocidad inicial de un sistema de partículas para una
simulación de dinámica molecular se asignan las velocidades como vectores cada
uno con componentes aleatorias tomadas de una distribución normal. Si se suman
los momentos de cada partícula, en este caso, dado que las velocidades se
tomaron de una distribución aleatoria, el resultado podría ser un valor
diferente de cero, el _momentum_ lineal en una simulación de dinámica molecular
no es deseable así que se debe anular restando la velocidad media de las
partículas a cada una de las velocidades de las partículas, generemos como
ejemplo este estado inicial:

```python
import numpy

n = 100   # número de partículas
k = 1     # factor que escala con la temperatura

# usamos una función de creación
v = k * numpy.random.normal(size=(n, 3))

# calculamos la velocidad media de las partículas
# usamos el parámetro axis
mean_v = numpy.mean(v, axis=0)
print(mean_v)
# [-0.04088513  0.01260944  0.05857773]

# restamos la media de la velocidad para eliminar el momentum lineal
# aquí usamos broadcasting
v = v - mean_v
print(numpy.sum(v, axis=0))
# [ 7.54951657e-15  4.10782519e-15 -7.77156117e-16]
# aproximadamente [0 0 0], no hay momentum lineal
```

De esta manera generamos un vector con las velocidades iniciales de una
simulación de dinámica molecular usando algunas herramientas básicas de NumPy,
notemos que con un poco más de _broadcasting_ se podría eliminar el _momentum_
angular para partículas de distintas masas. Notemos también que usando las
posiciones y algunas líneas de código extra podríamos también eliminar el
_momentum_ angular.

Esta entrada presenta solo un pequeño abrebocas de las capacidades de los
arreglos de numpy, queremos invitar a los lectores a que exploren la
herramienta, un buen punto de partida es la [documentación]. Además, en este
documento nos enfocamos en la ergonomía y la forma de usar NumPy, pero cabe
resaltar que cada una de las operaciones que se indican a lo largo de este
documento se realizan por medio de librerías de bajo nivel como se indicó en la
introducción.

[^1]: La coma después del tamaño de un arreglo unidimensional es necesaria para
      indicar que la forma sigue siendo una tupla.

[^2]: En estos casos usualmente tengo que "adivinar" el parámetro `axis` que debo
      pasar a la funcion en NumPy, espero que sea más o menos claro el parámetro
      para el lector.

[broadcasting]: https://docs.scipy.org/doc/numpy-1.14.0/user/basics.broadcasting.html
[NumPy]: http://www.numpy.org/
[SciPy]: https://www.scipy.org/
[documentación]: https://docs.scipy.org/doc/
