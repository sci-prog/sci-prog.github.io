---
title: "Una ligera introducción a Rust"
date: "2018-01-14T15:00:01-05:00"
tags: [rust, hpc]
---

[Rust][rust] es un nuevo lenguaje de programación para sistemas de bajo nivel y,
como tal, esta enfocado en proveer gran velocidad y tener una mínima huella en
tiempo de ejecución. Rust también va mas allá ofreciendo seguridad en memoria,
haciendo casi imposible tener un error de segmentación **sin incurrir en costo
en tiempo de ejecución**. Una descripcion corta del lenguage ha sido:
_velocidades similares a C o C++ con seguridad en memoria._

En el presente artículo introducimos cómo se siente trabajar en un proyecto
en rust, mostrando algunas de las ventajas en cuanto a calidad de vida que
presenta el lenguage con respecto a otros lenguajes de bajo nivel e
introduciendo algunos conceptos sobre el funcionamiento de rust.

## Instalación

Antes de empezar un proyecto necesitamos instalar las herramientas del lenguaje.
Para esto, la comunidad ha creado una herramienta de instalación llamada
[rustup], que se instala mediante el comando:

```bash
$ curl https://sh.rustup.rs -sSf | sh
```

Luego de instalar rustup, debemos instalar las herramientas de rust usando:

```bash
$ rustup install stable
```

Noten que el identificador `stable` indica que hay varias versiones de las
herramientas de rust en un momento dado, los 3 canales principales son
`nightly`, `beta` y `stable` y son actualizados cada 3 meses[^1].

Una vez instaladas las herramientas de rust, el compilador `rustc` estará
disponible, y también el gestor de paquetes `cargo`.

## Creación de un nuevo proyecto

Para crear un nuevo proyecto vamos a utilizar `cargo`. En este ejemplo,
escribiremos un pequeño programa para calcular el número `pi` usando Monte Carlo.

```
$ cargo new --bin pimc
```

Este comando crea un nuevo proyecto con un par de archivos:

```bash
$ tree pimc
pimc
├── Cargo.toml
└── src
    └── main.rs

1 directory, 2 files
```

El archivo `Cargo.toml` contiene metadatos sobre el proyecto[^2], entre otros:
nombre, autor, nombres de los ejecutables, dependencias (**dependencias!**).
Por otra parte el archivo `main.rs` contiene un pequeño `hola mundo`[^3]:

```rust
fn main() {
    println!("Hello, world!");
}
```

## Gestión de dependencias

Una de mis características favoritas de rust es que permite gestionar
dependencias usando `cargo` y [crates.io], esta característica es bastante
común en lenguajes de programación modernos como `javascript`, `python` o
`ruby`, pero es nueva en lenguages de programación de bajo nivel.

Para el pequeño programa para cálculo de `pi` necesitamos una librería para
generación de números aleatorios, la librería para este fin es [rand] y es
distribuída a través de [crates.io][crates.rand], vamos a listar `rand` como
una dependencia en el archivo `Cargo.toml`.

```toml
[package]
...

[dependencies]
rand = "0.4.2"
```

Al momento de construir el proyecto, `cargo` va a descargar la versión
especificada de `rand` y dado que se trata de un proyecto binario, va a crear
un archivo `Cargo.lock` con las firmas de cada paquete usado para verificar que
el binario siempre se construya con la misma version de cada dependencia.

Finalmente, ya que se trata de un paquete externo, debemos escribir en la
parte superior de `main.rs`[^4]:

```rust
extern crate rand;

fn main() {
  ...
}
```

## Hora de escribir código

Curiosamente, el ejemplo de cálculo de `pi` hace parte de la [documentación del
paquete rand][rand.mc], pero en pocas palabras, si se toma un conjunto de
puntos uniformemente distribuidos en un cuadrado que circunscribe un círculo,
la razón entre la cantidad de puntos en el círculo y la cantidad de puntos
totales, va a ser aproximadamente igual a la razón entre el área del círculo y
el área del cuadrado.

Hay que decir que rust soporta programación _imperativa_ y también
_declarativa_; ambos estilos tienen sus ventajas, ésta sería la versión
_imperativa_ de este ejemplo:

```rust
extern crate rand;

use rand::distributions::{IndependentSample, Range};

fn main() {
   let between = Range::new(-1f64, 1.);
   let mut rng = rand::thread_rng();

   let total = 1_000_000;
   let mut in_circle = 0;

   for _ in 0..total {
       let a = between.ind_sample(&mut rng);
       let b = between.ind_sample(&mut rng);
       if a*a + b*b <= 1. {
           in_circle += 1;
       }
   }

   // prints something close to 3.14159...
   println!("{}", 4. * (in_circle as f64) / (total as f64));
}
```

Bien, un par de nociones sobre rust antes de continuar.

* Rust es un lenguage con tipado estático y fuerte. Sin embargo su sintaxis
  estrícta permite que el compilador infiera los tipos de las variables en la
  mayoría de los casos. Por lo tanto podemos declarar variables sin decir
  directamente el tipo[^5], como vemos en la línea`let between = Range::new(-1f64, 1.);`.
* Las variables en rust son inmutables por defecto. `let mut` permite modificar
  este comportamiento, es decir nada de `const Type algo`. Esto permite al
  compilador realizar optimizaciones confiando en que en la mayoría del tiempo
  las variables van a permanecer inmutables.
* La sentencia `for` en rust itera sobre elementos dentro de un iterador,
  similar al comportamiento de `for` en python. `(a..b)` es _syntactic
  sugar_ para `Range(a, b)`. Nótese tambien que ni la sentencia `for` ni `if`
  requieren paréntesis alrededor, aunque los `{}` son obligatorios.
* El identificador `_` por defecto descarta el objeto asignado, y un
  identificador de la forma `_var` desactiva el checkeo del compilador sobre
  variables no usadas pero no descarta el objeto asignado.
* Rust implementa _move semantics_ en (casi) todas las estructuras de datos.
  Esto quiere decir que una llamada `b.ind_sample(rng)` transferiría la
  pertenencia del recurso `rng` a la función `ind_sample` y el recurso sería
  "eliminado" de la memoria una vez dicha función termine su _scope_. La
  solución de rust para esto es realizar _préstamos_: `&var` es un préstamo
  inmutable del recurso `var` mientras que `&mut var` es un préstamo mutable
  del recurso `var`[^6].
* No hay _type cohersion_ en rust, y los operadores aritméticos no estan
  sobrecargados para tipos diferentes, por tanto una instrucción como
  `let x = 3f64 * 2i32;` es ilegal en rust y por ningún motivo va a compilar.
  Así, tipos incompatibles tienen que ser manualmente reinterpretados
  usando `var as Type`.

Demasiados conceptos para un programa tan corto, pero, siendo tan estrictas las
reglas, el compilador se va a encargar de recordar cada una a los nuevos
programadores. Sólo para referencia, démosle un vistazo a la forma
_declarativa_ del mismo programa:

```rust
fn main() {
   let between = Range::new(-1f64, 1.);
   let mut rng = rand::thread_rng();
   let total = 1_000_000;
   let in_circle: i64 = (0..total)
       .map(|_| (
            between.ind_sample(&mut rng),
            between.ind_sample(&mut rng)
        ))
       .map(|(a, b)| if a*a + b*b <= 1. { 1 } else { 0 })
       .sum();
   // prints something close to 3.14159...
   println!("{}", 4. * (in_circle as f64) / (total as f64));
}
```

En forma declarativa le damos mas libertad al compilador de decidir cómo
materializar nuestra intención. Esto abre las puertas a obtener ganancias en
rendimiento con mejoras en el compilador y sin cambios en el código.

## Compilación y distribución

Para compilar y distribuir el programa usamos el gestor de paquetes `cargo`,
para correr el programa en modo _debug_ (compilación rápida y ejecución lenta)
usamos el comando:

```bash
$ cargo run
   Compiling pimc v0.1.0 (file:///home/oscar/Code/pimc)
    Finished dev [unoptimized + debuginfo] target(s) in 0.44 secs
     Running `target/debug/pimc`
3.142992
```

Para crear un ejecutable optimizado, disponemos del comando,

```bash
cargo run --release
```

Finalmente, para crear un ejecutable linkeado estáticamente para correr en
plataformas desconocidad de linux (un cluster heterogéneo o similar) vamos a
instalar un nuevo target usando `rustup` y compilar usando ese target[^7]:

```
rustup target add x86_64-unknown-linux-gnu
cargo build --release --target=x86_64-unknown-linux-gnu
```

Uno de los objetivos del equipo de rust es lograr _cross compilation_ con un
comando. Hay una muy buena [guía para cross compilation en rust][cross].

## Conclusión

Rust es un lenguaje de programación promisorio, con un muy buen ecosistema pese
a su juventud. Las herramientas de desarrollo disponibles y decisiones del lenguaje hacen
de programar en rust una experiencia _ergonómica_. La compilación cruzada
permite compilar programas complejos para correr de manera segura en ambientes
heterogéneos como [open science grid][osg] sin mucha dificultad, incluso cuando
la lista de dependencias es bastante larga. Finalmente las reglas estríctas del
lenguaje, aunque hacen un poco frustrante el lenguaje al principio, hacen mucho
más facil producir código libre de bugs a programadores con diferentes niveles
de experiencia.

El código en este artículo se puede encontrar en [github][intro.repo].


[^1]: Más sobre el ciclo de desarrollo de rust en su página de [releases]
[^2]: Mas sobre `Cargo.toml` en la [documentacion de referencia][cargo.reference]
[^3]: Esto se debe a que creamos el proyecto con un `--bin` flag de lo
  contrario encontraríamos `lib.rs` y una estructura un poco más seria.
[^4]: Las instrucciones `extern crate` deben ir en la raíz del proyecto, para
  el caso binario esto es `main.rs`, en otro caso sería `lib.rs`.
[^5]: En una nota relacionada, rust implementa _resource acquisition is
  initialization_ por tanto una sentencia como `let variable;` es ilegal, más
  sobre [raii].
[^6]: Los prestamos en rust son tipos de datos, es decir `T` es un tipo
  diferente a `&T` y a su vez a `&mut T`, no hay _type cohersion_ entre estos
  tipos, a diferencia de `C++` donde una funcion con la firma `void
  something(const & var)` va a poder ser llamada con un objeto concreto
  `something(var)` y el compilador se va a encargar de construir un `const &
  var` a partir del objeto concreto.
[^7]: Puede que se requieran otras herramientas de compilación, y un archivo
  `~/.cargo/config` pero una vez configurado funciona **así de fácil**.

[cargo.reference]: https://doc.rust-lang.org/cargo/reference/manifest.html
[crates.io]: https://crates.io/
[crates.rand]: https://crates.io/crates/rand
[cross]: https://github.com/japaric/rust-cross
[intro.repo]: https://github.com/sci-prog/pimc
[osg]: https://www.opensciencegrid.org/
[raii]: https://en.wikipedia.org/wiki/Resource_acquisition_is_initialization
[rand.mc]: https://doc.rust-lang.org/rand/rand/index.html#monte-carlo-estimation-of-%CF%80
[rand]: https://doc.rust-lang.org/rand/rand/index.html
[releases]: https://github.com/rust-lang/rust/blob/master/RELEASES.md
[rust]: https://www.rust-lang.org/
[rustup]: https://www.rustup.rs/

