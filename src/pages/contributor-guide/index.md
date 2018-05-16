---
title: Guía para contribuir
date: "2017-11-14T03:14:18+00:00"
author: odarbelaeze
---

Hay varias formas de contribuir a la construcción de este blog, eso va a
depender del nivel de conocimiento y compromiso del contribuyente, la forma
más fácil de contribuir es abrir un issue en el
[repositorio](https://github.com/sci-prog/sci-prog.github.io) del blog si
encuentran algún error o quieren proponer un tema a tratar.

## Proponer un tema

El blog de sci prog se va a enfocar en temas relacionados con scientific
programming, con un énfasis especial en high performance computing y high
througput computing, son bienvenidos posts relacionados con:

* Programación científica, casos de estudio y técnicas.
* Uso de librerías en distintos lenguajes de programación.
* Flujos de trabajo asociados al desarrollo de aplicaciones científicas.
* Desarrollos y guías de análisis y visualización de datos.

Si tienen una idea para un artículo en uno de estos temas o algún tema
relacionado no duden en abrir un issue, si les parece que nuevos temas
deberían ser agregados no duden en proponerlos a través de un issue.

## Aportar un artículo

Aportar un artículo puede ser tan simple cómo enviar un mensaje o crear un
issue con el contenido del artículo, de otra manera, basta con fork del
[repositorio](https://github.com/sci-prog/sci-prog.github.io) crear una rama
nueva (no es tan necesario desde un fork) y agregar una nueva carpeta en el
directorio `src/pages`, el directorio debe tener un `slug` como nombre,
`en-este-formato`, dentro del directorio debe crear un archivo `index.md` con
el siguiente formato,

```markdown
---
title: Guía para contribuir
date: "2017-11-14T03:14:18+00:00"
---

Contenido del artículo...
```

El título indicado en el campo `title` será añadido al principio del artículo
renderizado así que el documento markdown no debe contener títulos de primer
nivel. Una vez el artículo este listo, o requiera feedback, será hora de
crear un pull request, una vez este pull request sea completado
satisfactoriamente el artículo será publicado automáticamente.

## Atribución

Cada artículo será atribuido a su autor, o autores, sin embargo, los
componentes para realizar la atribución aún no se han implementado.
