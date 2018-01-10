---
title: "Meltdown: Una explicación técnica y sencilla"
date: "2018-01-08T03:36:38-03:00"
tags: [meltdown, exploit, arquitectura]
---

Hace menos de una semana se dieron a conocer dos *bugs* muy grandes y ocultos que afectan a gran parte de los procesadores: *meltdown* y *spectre*.
¿Qué hace importante a estos exploits?
Que sean **fundamentales**: no dependen de un sistema operativo o de un programa específico, sino que depende del procesador.
Incluso uno de ellos (*spectre*) funcionaría sobre prácticamente cualquier procesador moderno.

En esta entrada vamos a analizar [`meltdown`](https://meltdownattack.com/meltdown.pdf), un bug que estuvo presente *en todos los procesadores Intel* desde hace 20 años y que asombra por su sencillez.
Más allá del sistema operativo, `meltdown` permite leer datos sensibles de otros procesos o máquinas virtuales a una velocidad de 500 kb/s.

Pero, para comprender como funciona `meltdown`, primero tenemos que repasar algunos detalles del funcionamiento del procesador.

## Arquitectura del Procesador

La información que "le pertenece" al procesador se guarda en los llamados *registros*.[^1]
Sobre éstos puede hacer una cantidad de operaciones, como por ejemplo sumarlos, multiplicarlos, cambiarlos de lugar, etcétera.
Cuáles y cuántos son los registros y qué operaciones puede hacer son, básicamente, la [**arquitectura**](https://es.wikipedia.org/wiki/Conjunto_de_instrucciones).
Es un modelo abstracto (básicamente, cómo ve al procesador un programador a través de un [lenguaje *assembler*](https://es.wikipedia.org/wiki/Lenguaje_ensamblador)), que no define de forma unívoca cómo se realizan esas operaciones o dónde aparecen los registros, es decir, su implementación.

La implementación de las instrucciones que puede realizar un procesador se llama [microarquitectura](https://es.wikipedia.org/wiki/Microarquitectura).
El estado de esta microarquitectura no es alterable: es decir, y esto es muy importante, **no se puede programar sobre la microarquitectura u obtener su estado**.
Aquí es donde todo se vuelve sutil y complicado y donde se realizan muchas optimizaciones del procesador muy conocidas.
Vamos a explicar tres conceptos de microarquitectura muy importantes en general y, específicamente, para comprender cómo funcionan *meltdown* y *spectre*.

### Memoria Cache

Evidentemente, no toda la información que usa un programa puede estar en los registros del procesador (que, sumados, en general no superan 1 kB de memoria).
Los programas residen, en su gran parte, en la memoria principal (la memoria RAM) y, para realizar operaciones, el procesador *trae* de la memoria principal los datos que necesita.
Esta solución tiene un inconveniente: un procesador típico tarda 0.2 nanosegundos (un nanosegundo es una mil millonésima parte de un segundo) en realizar una operación, pero el acceso a la memoria principal lleva 100ns.
Para ponerlo en perspectiva, si uno tardara 1 segundo en hacer una suma y quisiera sumar dos números, tendría que esperar **más de 10 minutos** para saber cuáles son los números (5 minutos para cada uno) que va a sumar.
Afortunadamente, este problema se evita generalmente agregando un nuevo tipo de memoria, llamado "memoria cache".
Esta memoria está en el chip del procesador y es de muy rápido acceso y poca capacidad.
¿Cómo funciona?
Cuando el procesador necesita acceder a una posición de la memoria principal, de paso, trae algunos valores que están cerca de esa posición (a pesar de que no los necesite en ese momento y no sea exactamente el que pidió) a la memoria cache, con la esperanza de que vaya a tener que usarlos pronto.
En nuestro ejemplo, si los números que vamos a sumar están juntos, en vez de 10 minutos, tardaríamos sólo 5.
Si tuviéramos que sumar muchos números que están cerca, la ventaja se vuelve mayor.
Cuando necesitamos un dato de la memoria principal y está en el cache, se conoce como *cache hit*.
Cuando no está, es un *cache miss*.

### Ejecución fuera de orden

Al agregar la memoria cache se reducen mucho las demoras en obtener datos de la memoria principal, pero así y todo los *cache misses* demoran mucho la ejecución del código.
Supongamos que tenemos secuencialmente las operaciones 1 y 2, donde la operación 1 genera un *cache miss* y la 2 genera un *cache hit*.
Si la operación 2 no depende del resultado de la operación 1, no hay problema en que ejecutemos la operación 2 mientras el procesador "va a buscar" la información necesaria para ejecutar la 1.
Entonces, efectivamente, primero se ejecutaría la operación 2, para guardarla en un lugar temporal (perteneciente a la microarquitectura).
Luego, una vez ejecutada la operación 1, **consolida** la operación 2 en el registro adecuado y, así queda en la arquitectura.
En conclusión, la **consolidación** es siempre en el orden explicitado, pero la ejecución puede ser **fuera de orden**.

### Branch prediction

Imaginemos ahora el caso anterior, pero entre la operación 1 y la 2 hay una sentencia condicional que sí depende del resultado de la operación 1.
Algo así[^2]:

```c
z = a*x; // op 1
if (z > 5) {
  w = z + y; // op 2 primer caso
}
else {
  w = z - y; // op 2 segundo caso
}
```

La situación es similar a la anterior, pero ahora, hasta tener el valor de `z` no sabemos qué operación hacer.
No nos queda otra que esperar al resultado, y ya no podemos ganar tiempo como antes... ¿o sí?
El *branch prediction* (que forma parte de, en general, la *ejecución especulativa*) consiste en ejecutar alguna de las dos tratando de predecir qué va a resultar de la condición y guardando el resultado en un lugar temporal.
En caso de que lo hayamos predicho correctamente, **consolidamos** el resultado temporal a `w`.
Si no, tendremos que recalcular `w`.
Fíjense que sólo con que el predictor sea al azar (es decir, que aleatoriamente elija con 50% de probabilidades seguir un camino u otro) ya la ejecución especulativa es aceptada la mitad de las veces[^3].

## Meltdown: Modificando el estado de la microarquitectura

Cuando ejecutamos un programa cualquiera, éste no tiene permitido acceder a cualquier lugar de la memoria principal.
Esto es de esperar, ya que si no cualquier programa que ejecutemos podría leer todo lo que estamos ejecutando y obtener, por ejemplo, nuestras claves bancarias.
Así, al intentar acceder a una posición de memoria prohibida (es decir, que no le pertenece al programa que se está ejecutando), se dispara una *excepción* y la ejecución se detiene.
El objetivo de `meltdown` es obtener la información de **toda la memoria principal**, a pesar de que su acceso no está permitido.

Con las características que describimos ya es suficiente para entender cómo funciona `meltdown`.
**IMPORTANTE:** Por ahora, para simplificar un poco las cosas, por un rato supongamos que el comportamiento del *cache* es ligeramente distinto: cuando va a buscar un dato en la memoria principal, trae **sólo a ese dato** a la memoria cache.[^4]

Como es de esperar, es de una sencillez que deslumbra.
El objetivo es leer el byte que está guardado en una posición de memoria inaccesible a nuestro programa (esa posición de memoria la llamamos `mem`), situada en el espacio de memoria del *kernel*, que puede acceder a todas las posiciones de la memoria física.
Supongamos que el programa que estamos ejecutando tiene una sección de 256 bytes propios en la memoria principal, que no está alojada en la memoria cache[^5].
Dicho en otras palabras, supongamos que tenemos un `array` de C de 256 bytes de tamaño, al que llamaremos `probe`.
Ahora ejecutamos las siguientes instrucciones:

```c
x = *mem; // guardamos en x el contenido de la posición de memoria mem
tmp = probe[x];
```

La primera instrucción, como trata de acceder a una posición de memoria prohibida, dispara una *excepción* y, efectivamente, `x` nunca toma el valor que está guardado en `mem`.
Debido a la ejecución fuera de orden, cuando se carga el valor de `mem` en `x`, es probable que el procesador ya haya comenzado a ejecutar la instrucción siguiente como parte de la ejecución fuera de orden y las haya guardado en la posición temporal (recordemos, perteneciente a la microarquitectura).
Como ya mencionamos, la **consolidación** de los datos se realiza en estricto orden, y aquí queda claro por qué.
Es durante la consolidación que se maneja cualquier tipo de excepción.
Como en este caso la primera instrucción genera una excepción, la segunda instrucción no se consolida y, entonces, el valor de `probe[x]` no queda guardado en ningún lugar de la arquitectura.

Sin embargo, y aquí está el punto jugoso del asunto, la segunda instrucción no se consolidó pero *se ejecutó*.
Y al ejecutarse, trajo el valor de `probe[x]` a la memoria cache.
En conclusión, logramos modificar la microarquitectura.

## Meltdown: Obteniendo los secretos

Una vez que terminamos de ejecutar el código ya mencionado, la microarquitectura queda ligeramente modificada.
Al comienzo de nuestro problema ninguno de los elementos de `probe` residían en la memoria cache; al terminarlo, `probe[x]` está en la memoria cache.
¿Podremos aprovechar esto de alguna forma?
Recordemos cuál era todo el punto de tener una memoria cache: los elementos que están en ella se acceden mucho más rápido que en la memoria principal.
Entonces hacemos un pequeño ejercicio: tratamos de acceder a *cada uno* de los elementos de `probe` y medimos cuánto tiempo demanda ese acceso.
Al realizar esta medición observamos que el acceso a todas las posiciones `i` de `probe[i]` llevan cerca de `100 ns`, excepto el acceso a `probe[84]` que tarda sensiblemente menos.
¿Qué pasó?
Simple: pasó que `probe[84]` estaba ya guardado en el cache y entonces fue más rápido acc--- ¡un momento!
Si `probe[x]` estaba en el cache luego de ejecutar las instrucciones que mencionamos y ahora vemos que `probe[84]` está en la cache... eso quiere decir que x es 84.
¡Es decir que lo que estaba en esa memoria inaccesible era 84!

## Detalles que no tuvimos en cuenta

### El comportamiento real de la cache

El ejemplo de `meltdown` que dimos suponía un comportamiento ligeramente diferente de la cache, en el que sólo traía el valor pedido.
En realidad, trae una sección de `n` bytes[^6] contigua al valor pedido (llamado tamaño de página de memoria).
La solución, igual, es sencillísima: el array `probe` tiene tamaño `256*n` (es decir, de tamaño igual a 256 páginas) y el acceso lo hacemos a `probe[x*n]`.
Así nos garantizamos que cada acceso defina unívocamente a una página del cache[^7].

### Bueno, pero el programa efectivamente dispara una excepción

Sí, es cierto, pero hay varias soluciones posibles:

1. Que el programa, en vez de ejecutar el código, lance un sub-proceso que lo ejecute.
Así, cuando ese sub-proceso dispara la excepción (un *segmentation fault* o `SIGSEGV`), el control puede seguir en el programa original.

2. Usar un *handle* para manejar la señal; por ejemplo [libsigsegv](https://www.gnu.org/software/libsigsegv/).

3. Que el código se ejecute después de un condicional que se prediga incorrectamente.
De esta forma, se ejecuta especulativamente pero **nunca** se consolida y, como las excepciones se disparan al consolidar las operaciones, nunca obtenemos una excepción.

4. Suprimir la excepción con [Intel TSX](https://software.intel.com/en-us/node/524022), una implementación de memoria transaccional en hardware que, dicho mal y pronto, permite que múltiples instrucciones se agrupen en una *transacción* que, si falla, revierte las operaciones hechas pero no dispara ninguna excepción.

### ¿Y si se dispara la excepción antes de la ejecución posterior?

Cuando describíamos `meltdown` dijimos: "Debido a la ejecución fuera de orden, cuando se carga el valor de `mem` en `x`, es probable que el procesador ya haya comenzado a ejecutar la instrucción siguiente como parte de la ejecución fuera de orden y las haya guardado en la posición temporal (recordemos, perteneciente a la microarquitectura)."

Es decir, si es probable que ya haya comenzado a ejecutar la instrucción siguiente, también es probable que no lo haya hecho.
Cuando se dispara la excepción **todos** los registros se hacen cero[^8], y `x` es un registro.
La solución es entonces que trate de leer el valor guarado en `mem` siempre que `x` no sea cero.

## Resultados de meltdown

Los resultados de `meltdown` son asombrosos: lee correctamente el 99.98% de la memoria prohibida a una velocidad de 500 kb/s.
Funciona en todos los procesadores de Intel probados, pero no en los AMD.
Esto se puede deber a varios motivos, como por ejemplo que en esas microarquitecturas el tamaño de los *buffers* utilizados para la ejecución fuera de orden sean muy pequeños y la excepción se dispare siempre antes de que se ejecuten las operaciones posteriores.
Afortunadamente tiene una solución en el corto plazo llamada KAISER, que evita que, para el espacio de memoria del usuario, exista una posición de memoria que vaya al *kernel*.
A pesar de que la solución no es total y todavía deja algunas vulnerabilidades, mitiga bastante el efecto de `meltdown`.
¿El costo?
Los programas podrían ser hasta un 30% más lentos.

## Conclusión

`meltdown` es un bug que estuvo presente desde hace 20 años, todo terreno y que, como dijimos, asombra por su sencillez.
Sin la necesidad de vulnerabilidades de software e independientemente del sistema operativo, `meltdown` permite leer datos sensibles de otros procesos o máquinas virtuales a una velocidad de 500 kb/s.



[^1]: Claro que la información de la "computadora" propiamente dicha también se encuentra en, por ejemplo, la memoria RAM.

[^2]: Esto es una cuestión conceptual.
Los saltos condicionales y las asignaciones son un poco distintas en la arquitectura.

[^3]: Hoy en día los predictores tienen una precisión de aproximadamente [95%](https://www.ece.cmu.edu/~ece447/s13/lib/exe/fetch.php?media=onur-447-spring13-lecture11-branch-prediction-afterlecture.pdf)

[^4]: La generalización para los casos en los que el cache trae más de un dato funcionan con una muy ligera variación.

[^5]: Esto se puede lograr de muchas maneras, pero de cualquier modo cuando se ejecuta el programa, el `array ` comienza localizado en la memoria principal y fuera de la cache.

[^6]: El valor típico para la mayoría de los sistemas operativos es 4kb.

[^7]: Visto de esta forma, podemos suponer que el cache imaginario que inventamos era para un sistema con un tamaño de página de 1 byte.

[^8]: Esto es esperable porque hay que borrar cualquier información prohibida que se haya guardado en los registros
