---
title: "Interacción entre C y Python: Parte II - ctypes"
date: "2017-11-19T15:23:38-03:00"
tags: [python, ctypes, python-c]
---

Discutimos [previamente]({% post_url c-python-i %}) acerca de la validez de [ctypes](https://docs.python.org/2/library/ctypes.html) para acelerar código de Python.
Vale mencionar que, a decir verdad, no estamos acelerando el código en Python: llamamos, desde Python, a un código en C que es más rápido.
Esta diferencia que parece casi trivial es fundamental para comprender este enfoque.
¿Qué tenemos que hacer siempre que queremos ejecutar código ya escrito?
*Linkeamos* a una librería.
Eso es lo que vamos a hacer en este caso: en vez de ejecutar una rutina en Python, vamos a darle ese trabajo a una librería de C.
Recordemos que hay dos tipos distintos de librerías: estáticas y dinámicas.
Para poder ejecutar una librería desde Python es evidente que vamos a necesitar que ésta sea dinámica, ya que las llamadas a funciones van a tener que ser resueltas en tiempo de ejecución (recordemos que Python no se compila, por lo que no hay "tiempo de compilación").

Construimos una librería muy pequeña que hace algunas operaciones matemáticas en escalares y vectores, separadas en dos archivos llamados `add_two.c` y `arrays.c`.

## Scalars
```c
/* file: add_two.c */

float add_float(float a, float b) {
  return a + b;
}

int add_int(int a, int b) {
  return a + b;
}

int add_float_ref(float *a, float *b, float *c) {
  *c = *a + *b;
  return 0;
}

int add_int_ref(int *a, int *b, int *c) {
  *c = *a + *b;
  return 0;
}
```

## Arrays
```c
/* file: arrays.c */

int add_int_array(int *a, int *b, int *c, int n) {
  int i;
  for (i = 0; i < n; i++) {
    c[i] = a[i] + b[i];
  }
  return 0;
}

float dot_product(float *a, float *b, int n) {
  float res;
  int i;
  res = 0;
  for (i = 0; i < n; i++) {
    res = res + a[i] * b[i];
  }
  return res;
}
```

Construimos la librería dinámica con
```
$ gcc -c -fPIC arrays.c
$ gcc -c -fPIC add_two.c
$ gcc -shared arrays.o add_two.o -o libmymath.so 
```

Y chequeamos que la librería efectivamente tenga todos los símbolos definidos
```
$ nm -n libmymath.so
...
0000000000000730 T add_float_array
00000000000008a0 T dot_product
00000000000008d0 T add_float
00000000000008e0 T add_int
00000000000008f0 T add_float_ref
0000000000000900 T add_int_ref
...
```

## Trabajando con escalares

### Enteros
Con la librería dinámica ya compilada, ahora la comunicamos con Python.
Ésa es la tarea de ctypes.
La librería ctypes es simplemente la definición de los tipos usuales de C (`int`, `float`, `double`...) y un *loader* dinámico de liberías.
¿Cómo usamos estas funciones en Python, entonces?
Tomemos, por ejemplo, `add_int`.
Sólo neecesitamos cargar con ctypes la librería que compilamos y llamamos a la función:

```python
>>> import ctypes as C
>>> math = C.CDLL('./libmymath.so')
>>> math.add_int(3, 4)
7
```
Y listo!
Logramos la titánica tarea de sumar dos enteros.

### Punto flotante
¿Qué pasa si tratamos de sumar dos números de punto flotante?

```python
>>> math.add_float(3, 4)
0
```

¿Qué pasó aquí?
La función de la libreríá interpreta las entradas como `float`, pero nunca le dijimos a Python que estamos pasándole números en punto flotante.
Una solución ingenua sería tratar de pasar simplemente `3.0` y `4.0` como parámetros, pero falla catastróficamente:

```python
>>> math.add_float(3.0, 4.0)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ctypes.ArgumentError: argument 1: <type 'exceptions.TypeError'>: Don't know how to convert parameter 1
```

Claramente no podemos pasar cualquier parámetro bajo la confianza de que Python puede resolverlo.
Recordemos que estamos llamando a una función de C, así que toda la magia del *duck typing* de Python no nos puede ayudar.
Tenemos que, explícitamente, decir que estamos pasando `float` de C.
Es decir, tenemos uqe usar los tipos definidos en `ctypes`:

```python
>>> math.add_float(C.c_float(3.0), C.c_float(4.0))
2
```

Estamos cerca.
Lo único que falta es que necesitamos que Python interprete el resultado como un `float` (¿cómo sabría Python qué tipo devuelve efectivamente la función?).

```python
>>> math.add_float.restype = C.c_float
>>> math.add_float(C.c_float(3.0), C.c_float(4.0))
7.0
```

Escribir `C.c_float` cada vez que queremos ejecutar esta función no parece ser la solución más limpia de todas.
Hay de hecho una forma mucho mejor para que Python sepa que la función van a tomar siempre `C.c_float` como argumentos, a través del método `argtypes`:

```python
>>> math.add_float.restype = C.c_float
>>> math.add_float.argtypes = [C.c_float, C.c_float]
>>> math.add_float(3, 4)
7.0
```

Y ahora la función puede ser llamada de forma completamente transparente, como llamaríamos a cualquier otra función de Python, pero en el fondo ejecuta código de C.

### Por referencia

Cuando pasamos los argumentos por referencia (aunque puede ser una forma rara para implementarla en escalares, al menos al principio), la notación es mucho más engorrosa, ya que necesitamos pasar una posición de memoria.
Podemos pedir la posición de memoria de una variable con la función `byref`:

```python
>>> three = C.c_int(3)
>>> four = C.c_int(4)
>>> res = C.c_int()
>>> math.add_int_ref(C.byref(three),
                     C.byref(four),
                     C.byref(res))
0
>>> res.value
7
```

Hay, sin embargo, una ventaja: como los argumentos son siempre posiciones de memoria (y, en consecuencia, *enteros*[^1]), funciona inmediatamente para cualquier tipo de variable:

```python
>>> three = C.c_float(3)
>>> four = C.c_float(4)
>>> res = C.c_float()
>>> math.add_int_ref(C.byref(three),
                     C.byref(four),
                     C.byref(res))
0
>>> res.value
7.0
```

Ahora la notación no se puede limpiar fácilmente como en el caso anterior, pero podemos escribir un *wrapper* de la función

```python
def add_int_ref_python(a, b):
  a_c = C.c_float(a)
  b_c = C.c_float(b)
  res_c = C.c_float()
  math.add_int_ref(C.byref(a_c), C.byref(b_c), C.byref(res_c))
  return res.value
```

Y ahí tenemos una llamada a C que suma por referencia y completamente transparente para el usuario final.

## Arrays

Con la experiencia de manejar argumentos por referencia en llamadas a funciones de C para escalares, manejar *arrays* no puede ser particularmente difícil: es simplemente una variable por referencia apuntando al primere elemento del *array*.
Es, en general, buena práctica manejar la memoria en Python, pero esto lleva a la siguiente pregunta: ¿cómo alocamos memoria en Python?
La forma más inmediata es:

```python
>>> in1 = (C.c_int * 3) (1, 2, -5)
>>> in2 = (C.c_int * 3) (-1, 3, 3)
>>> out = (C.c_int * 3) (0, 0, 0)
>>> math.add_int_ref(C.byref(in1),
                     C.byref(in2),
                     C.byref(out),
                     C.c_int(3))
>>> out[0], out[1], out[2]
(0, 5, -2)
```

### Numpy Arrays

Hay un enfoque distinto.
Ya tenemos todo un ecosistema desarrollado para trabajar con arrays: NumPy.
Un array de Numpy es un montón de metadatos (como tamaño, forma, tipo) y un puntero a la primera posición en memoria.
Podemos acceder a esa posición de memoria de un NumPy array a través de `data_as` o `data` en el array:

```python
>>> import numpy as np
>>> intp = C.POINTER(C.c_int)
>>> in1 = np.array([1, 2, -5], dtype=C.c_int)
>>> in2 = np.array([-1, 3, 3], dtype=C.c_int)
>>> out = np.zeros(3, dtype=C.c_int)
>>> math.add_int_ref(in1.ctypes.data_as(intp),
                     in2.ctypes.data_as(intp),
                     out.ctypes.data_as(intp),
                     C.c_int(3))
>>> out
array([ 0,  5, -2], dtype=int32)
```

Dos cosas son importantes aquí: a) no necesitamos definir el tipo como puntero a entero, podemos usar directamente el tipo `c_void_p` de ctypes; b) la salida es un array de NumPy que podemos usar inmediatamente en cualquier función de numpy.
Podemos, al igual que ne el caso anterior, crear un *wrapper* para esta función para usarlo transparentemente como si fuera una función de Python.

## Conclusiones

Esto cubre la mayor parte de la comunicación entre C y Python a través de funciones, que puede resultar útil si programamos en Python en un estilo parecido a C (con una programación más estructurada).
La siguiente parte de esta serie estará dedicada a una forma de usar ctypes orientada a objetos (y, consecuentemente, más "pythonica").


[^1]: Existe, de todos modos, el puntero a void, `c_void_p`, dentro de ctypes.
    Además podemos crear el puntero a cualquier otro tipo con la función `POINTER(type)`.
