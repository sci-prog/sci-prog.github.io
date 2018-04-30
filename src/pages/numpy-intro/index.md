---
title: "Introducción a numpy"
date: "2018-04-29T15:45:18-03:00"
tags: [python, numpy]
---

*Python es demasiado lento* es una de las razones para usar cualquier otro
lenguaje cuando se trata de simulación y manipulación de datos, sin embargo
python es un excelente lenguaje para usar como **pegamento** para programas
escritos en otros lenguajes, uno de los ejemplos mas poderosos del poder de
python como pegamento es la librería [numpy](http://www.numpy.org/) y en
general todas las librerías del ecosistema [scipy](https://www.scipy.org/).
Estas librerías traen el poder de paquetes tradicionales muy fuertes como
blas y lapack al servicio de programas en python, dando como resultado un
excelente balance entre el rendimiento de los lenguajes de bajo nivel y
usabilidad de python. En las presente introducción vamos a explorar las
capacidades de la estructura de datos básica que nos ofrece numpy
`numpy.array`.

## Tamaño y ejes

Para estudiar el tamaño o forma (size or shape) de un arreglo, estudiamos
algunas de funciones que nos ofrece numpy para la creación de arreglos,
empecemos con la más humilde 😅 , construir un arreglo (o matriz)
convirtiendo una lista de listas en una matriz:

```python
import numpy
matrix = numpy.array([
  [1, 0],
  [0, 1],
])
print(matrix.shape) # (2,2)
```

Numpy ofrece, herramientas un poco más avanzadas para crear arreglos, como:

- Crear un arreglo lleno de unos (`1`) con un tamaño definido con `numpy.ones`
- Crear un arreglo lleno de ceros (`0`) con un tamaño igual al de otro arreglo `numpy.zeros_like`
- Crear un arreglo lleno de números aleatorios con distribución normal con un tamaño definido `numpy.random.normal`.

Este es un simple subconjunto de todas las herramientas que ofrece numpy para
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

Ahora, el tema que nos atañe es el tamaño o forma y los ejes, bien, los
arreglos de numpy son arreglos *n*-dimensionales, un arreglo de una dimensión
es un vector, un arreglo de dos dimensiones es una matriz y un cubo de datos
sería un arreglo de tres dimensiones, los arreglos *n*-dimensionales pueden
tener más dimensiones pero a partir de tres dimensiones es un poco difícil de
visualizar. Ahora el tamaño o forma de un arreglo es la cantidad de elementos
en cada dimensión, por ejemplo un vector en 3 dimensiones tendrá una forma
`(3,)`, una matriz de 2 por 2 tendrá forma `(2,2)`, las dimensiones también
se conocen como ejes, la primera dimensión de una matiz sería `axis=0`.

## Operaciones aritméticas

### Arreglo con escalar

Una vez creados los arreglos estos pueden ser operados con escalares, siendo
un arreglo de cualquier forma `A` y un escalar `c`, algunas operaciones que
se pueden realizar con numpy son:

- `A + c`  suma a cada uno de los elementos del arreglo `A` la constante `c`.
- `A - c`, `A * c`, `A / c` hacen cada operación con cada uno de los elementos del arreglo `A`.

```python
import numpy
A = numpy.array([1, 2, 3])
c = 1
D = A + c # [2, 3, 4]
```

### Arreglos de forma congruente

Las operaciones aritméticas entre arreglos de forma congruente son en general
elemento a elemento, si tenemos arreglos de la misma forma `A` y `B` se
pueden efectuar las operaciones `A + B`, `A - B`, `A * B` y `A / B`,

```python
import  numpy
A = numpy.array([1, 3])
B = numpy.array([1, 1])
C = A + B # [2, 4]
```

Python recientemente ha introducido un operador para multiplicación de
matrices, por ejemplo una si tenemos una matriz `A` de forma `(2, 3)` y una
matriz `B` de forma `(3, 2)`, entonces el producto entre matices `C` se
escribiría en python `C = A @ B` y tendría forma `(2, 2)` por otra parte otro
producto entre matrices `D = B @ A`

```python
import numpy
A = numpy.array([[1, 1, 1], [2, 2, 2]])
B = numpy.array([[3, 3], [4, 4], [5, 5]])
C = A @ B # [[12, 12], [24, 24]]
```

### Arreglos de forma aparentemente incongruente

Numpy tiene una característica llamada [broadcasting]



[broadcasting]: https://docs.scipy.org/doc/numpy-1.14.0/user/basics.broadcasting.html
