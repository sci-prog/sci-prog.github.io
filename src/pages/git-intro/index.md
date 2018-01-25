---
title: "Introducción a git"
date: "2018-01-21T15:45:18-03:00"
tags: [git, workflow]
---

Una parte fundamental del trabajo de un científico es la comunicación: es importante poder informar a los colegas sobre los resultados de nuestras investigaciones y cómo se obtuvieron, como también cuándo se realizaron ciertos cambios en la metodología.
La comunicación de los resultados es vital, más allá de las herramientas escogidas.
Por ejemplo, en el trabajo de un científico experimental es fundamental documentar todos los intentos y las modificaciones que realizó en su experimento antes de obtener resultados, ya que ésta es, al fin y al cabo, la única forma que tiene para luego poder comunicarlos eficientemente: anotarlo en un cuaderno en vez de confiar en la memoria.

Para nosotros, los programadores científicos, la realidad es exactamente la misma.
Si tenemos un código que funciona y queremos agregarle una nueva característica, lo más probable es que queramos también documentar en qué momento se agregó para ser conscientes de cuál era el estado del programa cuando se obtuvieron los resultados que queremos comunicar.
Nuevamente, como ya mencionamos, más allá de la herramienta que se utilice, es importante que demos trazabilidad a nuestro trabajo para poder repetirlo e identificar cuándo se pudo haber filtrado un error.
Las herramientas disponibles para la trazabilidad y distribución del trabajo conocidas como de Control de Versiones, sí pueden hacer ese trabajo más sencillo.

# ¿Qué es un Sistema de Control de Versiones?

Supongamos que estamos desarrollando un programa que resuelve ecuaciones diferenciales numéricamente y que consta de un conjunto de archivos en una carpeta que se llama `ODESolver`, que originalmente resuelve ecuaciones diferenciales con el método de Euler.
En un momento dado, decidimos que queremos agregar una función para calcular Runge-Kutta de orden 4.
¿Cómo lo hacemos?
Una alternativa sería modificar directamente la carpeta en la que estamos trabajando, pero... ¿qué pasa si nos equivocamos y rompemos todo el código?
¿No nos gustaría poder volver a la versión original de `ODESolver` que sabíamos que funcionaba?

Entonces se nos ocurre una solución: copiamos la carpeta `ODESolver` a una que se llame `ODESolver_nuevo` y desarrollamos en esta.
Si nos equivocamos y rompemos todo el código, podemos volver a la carpeta original que ya sabíamos que funcionaba.
Después podemos hacer algunas mejoras a este método casero.
La primera puede ser que el nuevo nombre tenga algo relacionado con el desarrollo que hacemos; en el caso del ejemplo, `ODESolver_RK4`.
Pero sería aún mejor si llamáramos a la nueva carpeta `ODESolver_2` y creáramos un archivo de texto llamado, por ejemplo, `versiones.txt` para registrar los cambios que diga sencillamente:

```
1: Método de Euler
2: Desarrollo de Runge-Kutta de orden 4
```

De esta manera, si queremos agregar más cambios sólo tenemos que seguir la numeración secuencial y así podemos leer en el archivo de texto qué agrega cada versión.
Es más: cuando alguien quiere saber si la versión que usa tiene o no cierta funcionalidad, busca su versión en el archivo de texto y listo.
Lo que acabamos de describir es, aunque casero y muy primitivo, un Sistema de Control de Versiones[^1].
Las deficiencias de este SCV son evidentes: ¿qué pasa si, ya en la versión 19 del programa, encontramos un error en una función que existía desde la versión 0?
Tendríamos que ir versión por versión haciendo esa modificación.
Podemos pensar soluciones para este problema, pero todo parece indicar que, ante problemas que siguen creciendo, la única solución es llamar a un [megazord](https://www.youtube.com/watch?v=7mQuHh1X4H4).
Hay infinidad de herramientas, con distinto nivel de sofisticación, que permiten controlar las versiones de un software.
En esta entrega (y, me animo a decir, en general en el blog) vamos a hablar de la más extendida de todas: [`git`](https://git-scm.com/).

# Git: Una filosofía de trabajo

La ventaja de usar las herramientas adecuadas para el objetivo que uno quiere lograr (en este caso controlar las versiones) es que, de alguna forma, *favorecen* (¡o a veces hasta imponen!) una filosofía de trabajo.
Con `git` vamos a lograr hacer de forma sencilla lo antes mencionado con nuestro SCV casero y un par de cosas más:

1. Hacer backup de estados consistentes del proyecto
2. Documentar cambios
3. Seguir los *bugs* a través de la historia del desarrollo
4. Compartir cambios
5. Distribuir el desarrollo a muchas personas

Pero para poder entender bien cómo funciona `git` es necesario primero definir algunos conceptos claves[^2]:

## Estados

Los estados son análogos a las carpetas en el ejemplo del SCV casero que hicimos antes.
Es importante entender que son algo análogo y no exactamente lo mismo en cuanto a la función que cumplen, veremos más adelante en detalle por qué.
Cuando terminamos de trabajar en un estado y lo *consolidamos* (en nuestra analogía, sería decir que terminamos de desarrollar la funcionalidad que queríamos en la carpeta y, entonces, no modificamos más esa carpeta) lo llamamos *snapshot*.
El *snapshot* actual se llama `HEAD`.

## Ciclo de vida de los archivos

En un repositorio de git, cada archivo puede tener tres estados:

1. No-modificado
2. Modificado
3. Actualizado

Un archivo está en estado `no-modificado` cuando es exactamente igual al archivo que está guardado en el último *snapshot*.
Modificar un archivo (por ejemplo, cambiar el nombre de una variable) lo transforma, evidentemente, en un archivo `modificado`.
Pero, y esto es **muy importante**, `git` no *hace seguimiento* a un
archivo sólo porque está en estado `modificado`.
Para que `git` se *haga cargo* del archivo `modificado` lo tenemos que actualizar (o, el término en inglés, *stage*).
Con todos los archivos `actualizados`, podemos *consolidar* el cambio y, en consecuencia, tomar un nuevo *snapshot*.
Al hacer esto los archivos que estaban `actualizados` ahora forman parte del nuevo *snapshot* que pasa a ser el nuevo `HEAD` del repositorio.
Es decir que consolidar cambios actualiza automáticamente el `HEAD` del repositorio y de esta manera los archivos que eran `actualizados` pasan al estado `no-modificado`.
Finalmente, si creamos un archivo nuevo y le queremos hacer seguimiento, tenemos que *agregarlo* al repositorio.
De la misma manera, podemos *remover* un archivo del repositorio para dejar de seguirlo.

# Repositorios de git: Manos a la obra

Ahora vamos a retomar nuestro proyecto original, `ODESolver`, pero que desde el comienzo vamos a trabajar dentro de `git`.
El primer paso es crear el repositorio.
Para eso vamos a la carpeta (vacía) en la que queremos iniciar nuestro trabajo y ejecutamos:

```
$ git init .
```

A partir de este momento, esa carpeta va a ser considerada un repositorio de `git`.
Siempre que queramos saber en qué estado se encuentra el repositorio ejecutamos:

```
$ git status
On branch master

Initial commit

nothing to commit (create/copy files and use "git add" to track)
```

En este caso, tanto el repositorio como el directorio están vacíos.
Ahora creamos el archivo `euler.c`, que integra una ecuación con el método de Euler.
En el directorio aparece ese archivo, pero `git` no lo reconoce, pues nunca le dijimos que lo *siguiera*:

```
$ ls
euler.c


$ git status

On branch master

Initial commit

Untracked files:
  (use "git add <file>..." to include in what will be committed)

    euler.c

nothing added to commit but untracked files present (use "git add" to track)
```

Es decir, `euler.c` está en el estado `modificado`.
Si agregamos el archivo al repositorio (el comando es `git add`), pasa a ser `actualizado`:

```
$ git add euler.c
$ git status
On branch master

Initial commit

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)

    new file:   euler.c
```

Ahora *consolidamos* los archivos actualizados mediante `git commit`:

```
$ git commit -m "Agregado metodo de Euler"
[master (root-commit) 4c4a416] Agregado metodo de Euler
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 euler.c
```

Noten que agregamos un *flag* `-m` seguido de una breve explicación de los cambios.
Esto es conocido como el *mensaje de commit*.
Si no agregamos el *flag*, `git` abre un editor de texto en el que podemos escribir el mensaje.
`git` devuelve en pantalla un pequeño resumen de lo que dijo y un número hexadecimal, llamado *commit hash* (en este caso `4c4a416`) que es el que podemos utilizar luego para referirnos a este *snapshot*.
Si ahora preguntamos el estado del repositorio, obtenemos:

```
$ git status
On branch master
nothing to commit, working directory clean
```

Un comentario importante es el mensaje de *working directory clean*.
Eso es una forma de decir que no hay archivos en estado `modificado`, que es de esperar: el archivo `euler.c` es igual al que está guardado en `HEAD`.
A partir de acá, la tarea para generar un *snapshot* es siempre la misma:

1. Modificamos/creamos uno o varios archivos: pasan al *working directory*
2. Los agregamos al *staging area* con `git add`
3. Los consolidamos en un *snapshot* con `git commit`

Por ejemplo, ahora desarrollamos Runge-Kutta de orden 4.
Para eso creamos y modificamos el archivo `rk4.c` y:

```
$ git add rk4.c
$ git commit -m "Agregado Runge-Kutta de orden 4"
[master da5eb82] Agregado Runge-Kutta de orden 4
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 rk4.c
```

Si queremos ver la lista de mensajes de commit, ejecutamos:
```
$ git log
commit da5eb8249b5c9490ac5fa3818ad34ad7453db74e
Author: Pablo Alcain <pabloalcain@gmail.com>
Date:   Sun Jan 21 20:40:14 2018 -0300

    Agregado Runge-Kutta de orden 4

commit 4c4a41620df4a19f42ed47e837fc9f8e8f4d7ed1
Author: Pablo Alcain <pabloalcain@gmail.com>
Date:   Sun Jan 21 20:13:57 2018 -0300

    Agregado metodo de Euler
```

y vemos que muestra la historia de todos los *snapshots* del repositorio.
Si queremos ir a un *snapshot* en particular, es simplemente ejecutar `$ git checkout <commit hash>`[^3].
En este caso, para ir al *snapshot* en el que agregamos el método de Euler:

```
$ git checkout 4c4a
Note: checking out '4c4a'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by performing another checkout.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -b with the checkout command again. Example:

  git checkout -b new_branch_name

HEAD is now at 4c4a416... Agregado metodo de Euler
$ ls
euler.c
```

y observamos que "desapareció", en el *working directory*, el archivo `rk4.c`.
El `HEAD` dejó de ser `da5eb82...` y pasó a ser `4c4a416...`.
Si ahora queremos volver al *snapshot* en el que implementamos Runge-Kutta 4, ejecutamos:

```
$ git checkout da5e
Previous HEAD position was 4c4a416... Agregado metodo de Euler
HEAD is now at da5eb82... Agregado Runge-Kutta de orden 4
$ ls
euler.c  rk4.c
```

# Algunos comentarios interesantes

Cuando describmos los estados dijimos: "Es importante entender que es algo análogo y no exactamente lo mismo en cuanto a la función que cumplen, vamos a ver más adelante en detalle por qué".
En general, desarrollar toda una nueva funcionalidad (que sería cuando *consolidamos* una nueva carpeta en el SCV casero) lleva mucho tiempo, y tiene sentido hacer *commits* intermedios en los que no terminamos de desarrollar todo pero podemos volver atrás en la historia.
Esto jamás se nos habría ocurrido en el SCV casero porque es mucho trabajo *consolidar* algo: hay que copiar toda la carpeta, editar archivos nuevos, etcétera.
Pero si en `git` consolidar es cuestión de unos pocos comandos, ¿por qué no lo aprovechamos?
Así, entonces, tendremos muchos *commits* que no son interesantes *per se*.
¿Cómo identificamos entonces los *commits* interesantes, por ejemplo en los que implementamos una nueva funcionalidad?
Para resolver esto existen las etiquetas o *tags*.
Si queremos etiquetar un commit específico porque es interesante (en nuestro ejemplo el `4c4a16...`, que es en el que implementamos Euler, ejecutamos:

```
$ git tag v1.0 4c4a
```

Y ahora podemos referirnos a ese commit usando el nombre del *tag*:

```
$ git checkout v1.0
```

# Conclusión

Con realmente **muy** pocos comandos logramos, utilizando `git`, reproducir el comportamiento del Sistema de Control de Versiones casero que habíamos descrito, pero de forma sencilla y cómoda para el usuario.
Pero con esto estamos apenas arañando la superficie del verdadero poder de `git`.
Todavía nos quedan descubrir dos aspectos muy importantes: las *branches* y la distribución de código.
Eso lo dejamos para una siguiente entrega.



[^1]: Se puede seguir haciendo mejoras a este sistema casero, pero lo fundamental ya lo hace.
[^2]: Hay una gran cantidad de conceptos en `git`, como es de esperar.
    Pero si entendemos estos pocos conceptos en abstracto, es mucho más fácil entender todos los siguientes.
[^3]: No es necesario escribir el commit hash entero.
    Con escribir las primeras 4 cifras del número hexadecimal basta para ir hacia ese *snapshot*.
