---
title: "Interacción entre C y Python: Parte III - Uso avanzado de ctypes"
date: "2017-11-19T19:36:38-03:00"
tags: [python, ctypes, python-c]
---

Vamos a discutir ahora una forma completamente pythonica de comunicar C y Python y hacer que el resultado final sea completamente orientado a objetos.

En la [anterior entrega de esta serie](/c-python-ii/) discutimos cómo concetar Python y C a través de [ctypes](https://docs.python.org/2/library/ctypes.html) para acelerar código de Python[^1].
El objetivo principal era no sólo poder ejecutar código de C, sino tambíen poder hacerlo de forma *transparente* para el usuario final.
De esta forma podíamos llamar código en C de modo que el usuario de la librería nunca sabría si está realmente ejecutando código de C.
Tanto pasando los argumentos por valor o por referencia logramos la trasnparencia de *funciones* de C.
Sabemos, sin embargo, que a pesar de que Python es multiparadigma, su uso está muy orientado a la Progamación de Objetos.
¿No sería provechoso si pudiéramos emular el comportamiento orientado a objetos con ctypes?

## Estructuras
Entre los muchos tipos que ctypes expone a Python está la estructura `struct`.
Supongamos entonces qeue tenemos una estructura llamada `Rectangle` en C y una función que toma dicha estructura como argumento de la siguienta manera:

```c
/* file: rectangle.c */

struct _rect {
  float height, width;
};

typedef struct _rect Rectangle;

float area(Rectangle rect) {
  return rect.height * rect.width;
}
```
La compilamos como una librería dinámica
```
$ gcc -c -fPIC rectangle.c
$ gcc -shared rectangle.o -o libgeometry.so
```

Una estructura de C en Python es un objeto que hereda de `Structure` en ctypes, y las variables de la estructura (en este caso `height` y `width`) son llamados `_fields_` en la estructura de ctypes.
Así, una librería mínima de Python podría ser

```python
# file: geometry_minimal.py

import ctypes as C

CLIB = C.CDLL('./libgeometry.so')
CLIB.area.argtypes = [C.Structure]
CLIB.area.restype = C.c_float

class Rectangle(C.Structure):
  _fields_ = [("height", C.c_float),
              ("width", C.c_float)]

def area(rect):
  return CLIB.area(rect)
``
donde encapsulamos la función `area` de la librería de C[^2].

Podemos usar esta librería de forma completamente transparente desde python:
```python
>>> import geometry_minimal
>>> r = geometry_minimal.Rectangle()
>>> r.width = 10
>>> r.height = 30
>>> geometry_minimal.area(r)
300.0
```

## Interfaz de C/Python orientada a objetos a través de ctypes

### Disposición de memoria
Cuando utilizamos los `_fields_` de la estructura de ctypes tenemos que ser extremadamente cuidadosos: el orden tiene que ser el mismo que en la estructura original de C.
Estudiando la razón detrás de esto vamos a responder también una pregunta más importante: ¿Por qué funciona lo que hicimos recién?
Primero que nada: una estructura de C es en realidad una manera inteligente de nombrar posiciones de memoria relativas.
En este caso, `height` es un `float` (o sea, que tiene 4 bytes) que está localizado 0 bytes relativo a la posición de memoria `Rectangle`.
De forma análoga, `width` es un `float` que está localizado a 4 bytes de la posición de memoria de `Rectangle` (ya que los primeros 4 bytes están tomados por `height`)[^3].
Así que la función de C `area` simplemente toma los primeros 4 bytes comenzando por `rect` y loss egundo 4 bytes comenzando por `rect`, interpreta los datos como `float` y los multiplica.
¿Cómo podemos aprovechar este comportamiento desde Python?
Cuando definimos una `class` de Python heredando de una estructura de C, decimos que los primeros bytes van a estar ocupados por `_fields_`.
Cualquier otro método o atributu que agreguemos va a ser agregado a continuación.
En conclusión, la función `area` de C, cuando vaya a las posiciones de memoria que mencionamos recién, va a encontrar `height` y `width`, los valores que pretendíamos.
Esto funciona, obviamente, siempre que pongamos en el mismo orden los atributos en la estructura de C y los `_fields_` en la clase de Python.

### Implementación de la librería
Si modificamos la clase de Python agregando métodos o atributos nuevos, los primeros bytes van a mantenerse iguales.
Esto significa que, para las funciones de C, agregar métodos y atributos no va a cambiar la estructira (al menos en las posiciones de memoria que estaban originalmente permitidas en la estructura de C).
Esto es lo que vamos a usar para poder encapsular por completo la estructura de C como un objeto de Python.
Podríamos, por ejemplo, agregar un constructor simple `__init__`.
Pero el ejemplo más interesante es agregar métodos que originalmente eran funciones de C.
A partir de la explicación de más arriba, se vuelve claro que tiene que haber alguna forma de encapsular la función `area` de C como un método del objeto de Python.
El argumento que tenemos que usar para llamar la función `area` de C será la estructura en sí misma.
Ahora podemos crear una librería de Python más avanzada:

```python
# file: geometry.py

import ctypes as C

CLIB = C.CDLL('./libgeometry.so')
CLIB.area.argtypes = [C.Structure]
CLIB.area.restype = C.c_float

class Rectangle(C.Structure):
  _fields_ = [("height", C.c_float),
              ("width", C.c_float)]

  def __init__(self, height, width):
    self.height = height
    self.width = width

  def area(self):
    return CLIB.area(self)
```

¿Cómo usamos esta librería desde Python?

```python
>>> import geometry
>>> r = geometry.Rectangle(10, 20)
>>> r.area()
200.0
>>> r.width = 400
>>> r.area()
4000.0
```

Y, finalmente, la estructura de C y sus funciones están completamente encapsuladas.
Para el usuario fiunal no ahy diferencia entre esta librería y una hecha completamente en Python, pero aquí estamos ejecutando, en realidad, código de C.

## Conclusiones

Pudimos encapsular completamente el comportamiento de funciones de C que actúan sobre esctructuras como métodos de un objeto de Python.
Así obtuvimos un código completamente orientado a objetos, que a simple vista es puramente pythonico pero, en realidad, realiza sus cálculos en C.


[^1]: Recordemos que no estamos haciendo a Python más rápido sino ejecutando, desde Python, un código de C mucho más rápido.

[^2]: De hecho, ya que una estructura es una posición de memoria y éstas son `int`, no es *técnicamente* un requisito agregarle el `argtype` como `C.Structure`.

[^3]: En general no podemos directamente sumar los tamaños de los elementos que compnen a una estructura, ya que la [alineación de datos](https://en.wikipedia.org/wiki/Data_structure_alignment#Typical_alignment_of_C_structs_on_x86) es ligeramente más complicada.

[^4]: Ya existe un constructor por defecto para la `Structure` de ctypes, que inicializa los valores de `_fields_` a los argumentos pasados en el constructor.
