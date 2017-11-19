---
title: "Interacción entre C y Python: Parte I"
date: "2017-11-19T02:45:18-03:00"
tags: [python, ctypes, python-c]
---

Se habla mucho de Python como un lenguaje para [pegar varios lenguajes distintos](https://www.google.com.ar/search?q=python+as+a+glue).
A pesar de que muchos usuarios y defensores de Python esgrimen este argumento para valorar Python por sobre otros lenguajes, la realidad es que cualquier lenguaje interpretad (como perl, ruby o el incipiente Julia) es capaz de realizarlo.
Sin embargo, y a pesar del Bloqueo Global del Intérprete (*GIL* por sus siglas en inglés), el [problema más difícil de Python](https://jeffknupp.com/blog/2012/03/31/pythons-hardest-problem/), Python (especialemte v2.7+) es el lenguaje interpretado principal en aplicaciones científicas, debido sobre todo a la alta disponibilidad de librerías científicas: NumPy, SciPy, SciKitLearn entre otras.
Una de las ventajas de los lenguajes interpretados por sobre los compilados se vuelve evidente al comparar un código simple para calcular valores medios en Python y C[^1]:

## Python
```python
# file: add_numbers.py
total = 10000000
for i in xrange(10):
  avg = 0.0
  for j in xrange(total):
    avg += j
    avg = avg/total
print "Average is {0}".format(avg)
```

##C
```c
/* file: add_numbers.c */
#include <stdio.h>
int main(int argc, char **argv) {
  int i, j, total;
  double avg;
  total = 10000000;
  for (i = 0; i < 10; i++) {
    avg = 0;
    for (j = 0; j < total; j++) {
      avg += j;
    }
    avg = avg/total;
  }
  printf("Average is %f\n", avg);
}
```

No sólo es la sintaxis de Python mucho más limpia, sino que además tengamos en cuenta que el código de C hay que compilarlo antes de ejecutarlo.
La pregunta es, entonces, ¿por qué usamos C?
La respuesta es obvia: ambos códigos realizan exactamente lo mismo, pero mientras que el código de Python lleva `8.047 s`[^2], el código en C tarda `0.284 s`: 28 veces más rápido[^3].
Entonces, ¿cómo podemos resolver el problema de la velocidad?
Cualquiera que haya utilizado NumPy sabe que un problema como éste encaja justo en esta librería.
Miremos cómo quedaría el código de Python utilizando NumPy:

## Python (with NumPy)
```python
# file: add_numbers_fast.py
from numpy import mean, arange
total = 10000000
a = arange(total)
for i in xrange(10):
  avg = mean(a)
print "Average is {0}".format(avg)
```

Este nuevo código tarda `0.266 s`, comparable con el de C.
Sin embargo, sabemos que NumPy es bastante estricto: tenemos que usar vectores y escribir nuestra implementación utilizando sólo funciones de NumPy para aprovechar su velocidad.
En consecuencia, perdimos la versatilidad de Python.
La pregunta es: ¿podemos tener la versatilidad del lenguaje interpretado y la velocidad de uno compilado?
Hay dos formas de hacer esto:

1. **Implementamos un lenguaje interpretado en C:**
   Así como Python está escrio en C, podemos escribir nuestro propio programa en C y también crear un lenguaje interpretado "alrededor" de nuestro programa principal.
   El problema principal es que tendríamos que reimplementar muchas cosas en C que no son críticas en tiempo y podría resultar, además, en un lenguaje no muy sólido y con reglas no muy claras.
   Un buen ejemplo de la escritura de un lenguaje interpretado desde cero, con los problemas ya mencionados, a partir de código en C es [LAMMPS](http://lammps.sandia.gov/).

2. **Escribimos código en C y en Python por separado y los conectamos:**
   Si todos los lenguajes, en el fondo, tienen que ser código de máquina, entonces *tiene que haber* una forma de comunicar los lenguajes que queramos entre sí.
   En este caso, podemos escribir **a)** Código de Python; **b)** Código de C; y **c)** una API C/Python que se encargue de la comunicación.
   Sólo escribimos la parte que consume tiempo en C y podemos usar la flexibilidad de Python.
   La ya mencionada librería NumPy hace esto de hecho para conseguir su gran velocidad[^4].

Vamos a focalizarnos en las siguientes entregas en la segunda opción.
Pero, a su vez, la API C/Python tiene muchas formas de ser implementada:

1. **Escribimos el módulo completo en C, al estilo de Python:**
   Si Python fue escrito en C, podemos escribir cualquier módulo de Python en C.
   Esto es a través de, por ejemplo, la [API `Python.h`](https://docs.python.org/2/c-api/).
   Personalmente, he hecho esto un par de veces, y se puede tornar bastante engorroso, ya que hay que escribir mucho del parseo de Python en C (por ejemplo, cómo acceder a los elementos de las listas), y también considerar cuidadosamente el manejo de memoria.
   La mayor ventaja, sin embargo, es que escribimos el código de C que va a ser ejecutado y, en consecuencia, podemos tomar decisiones de sintonía fina que pueden ser críticas en la velocidad de ejecución.

2. **Escribimos en módulo en Python y generamos códico en C a partir de él:** Esto es lo que hace [Cython](http://cython.org/).
   Como se puede ver de los ejemplos en la página oficina, escribimos puro código de Python y luego se convierte a C automáticamente.
   Esta traducción de un lenguaje a otro de similar nivel se conoce como *transpilación* (yuxtaposición de *translation* y *compilation*).
   Cython es, efectivamente, un *transpilador*[^5].
   Aunque esto parece muy bueno a priori, la verdad es que, como en cualquier compilador, se requiere muchísimo trabajo en el desarrollo para obtener buenas optimizaciones[^6].
   La sintonía fina que antes podíámos hacer con la API C/Python ya no se puede realizar.

3. **Escribimos el módulo en C y lo comunicamos explícitamente con Python:**
   Si pudiéramos exponer en Python los tipos de datos de bajo nivel de C (`int`, `float`...), podríamos utilizarlos para llamar a librerías de C.
   Ésta es la idea detrás de [ctypes](https://docs.python.org/2/library/ctypes.html).
   Escribimos una función en C como lo haríamos usualmente, pero luego la llamamos *desde Python* con los tipos de datos adecuados.
   De esta forma podemos escribir código en C como en el caso **1**, pero con la ventaja de que la interfaz y el manejo de memoria lo hacemos en Python.

Quiero detenerme a discutir brevemente la opción **2**.
Cython y otros parientes cercanos como [Numba](http://numba.pydata.org/) pueden resultar en mejoras de tiempo relativamente (¡y a veces sorprendentemente!) buenas con muy poco esfuerzo a partir de código en Python.
Son, obviamente, la opción a seguir si no supiéramos nada de C.
O, si el objetivo es que ese código de Python que se arrastra para tardar una hora pase a tardar 10 minutos, seguramente valga la pena intentar este tipo de alternativas.
Pero si escribimos código desde el comienzo mentalizados en el Cómputo de Alto Desempeño, definitivamente no va a alcanzar, justamente porque no podemos hacer optimizaciones "a mano" sobre el código de C, que es generado automáticamente[^7].

Las opciones **1** y **3** son muy similares y, en mi opinión, la opción **3** supera en todos los aspectos a la opción **1**.
Esto es apenas una introducción, y el objetivo es dar una mirada amplia de las posibilidades para llevar a cabo la comunicación entre Python y C.
En la segunda entrega vamos a mostrar algunos ejemplos de **ctypes** y su uso básico.
La tercera parte la vamos a dedicar a un uso avanzado de **ctypes** que no es discutido usualmente y resulta muy útil para hacer completamente transparente la implementación en C para un eventual usuario de la librería.

[^1]: Nobleza obliga, lo sintético del código no es una ventaja *per se* de los lenguajes interpretados por sobre los compilados, sino más bien es debido a las características usuales de estos lenguajes.

[^2]: Obviamente todas las medidas de performance son muy dependientes del hardware.

[^3]: Esto significa que una simulación de una hora llevaría un día si usáramos Python.
    Si bien 28x es obviamente una enorme mejora en tiempo, recuerdo haber discutido una vez con un (*muy buen*) programador, que no trabajaba en HPC, acerca de mejoras de 2x-5x.
    Todavía estoy bastante sorprendido por el hecho de que él no se sorprendía por una mejora de 5x.
    Nunca debemos olvidar que, antes de optimizar algo, tenemos que pensar seriamente si vale la pena el esfuerzo.

[^4]: Punto bonus: como estamos ejecutando en realidad una librería, liberamos el Bloque Global del Intérprete y, en la librería, podemos hacer *threading*.

[^5]: Podríamos discutir si efectivamente es un transpilador o un compilador.
    Es una discusión más profunda respecto de si C y Python son lenguajes del mismo nivel.

[^6]: Lo mismo vale al escribir código en C.
    Sin importar cuán bueno sea el compilador, no vamos a obtener mejor rendimiento que con un código bueno, escrito a mano en assembler.

[^7]: Hay una alternativa similar, llamada [F2PY](http://docs.scipy.org/doc/numpy-dev/f2py/), que implementa la misma idea, pero invertida.
    A partir de código de FORTRAN puro, genera automáticamente la interfaz de Python; en consecuencia, tenemos la sintonía fina en el lenguaje compilado y el código generado automáticamente y eventualmente no-optimizado en el ya lento Python (y no crítico en tiempo).
