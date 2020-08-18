webpackJsonp([0x639b0b6ea552],{491:function(e,a){e.exports={data:{site:{siteMetadata:{title:"Scientific Programming Blog",siteUrl:"https://sci-prog.github.io",authors:[{name:"Oscar Arbelaez",photo:"https://avatars1.githubusercontent.com/u/1621518?s=460&v=4",github:"odarbelaeze",bio:"Simple programador de Colombia"},{name:"Pablo Alcain",photo:"https://avatars2.githubusercontent.com/u/6975120?s=400&v=4",github:"pabloalcain",bio:"Simple físico de Argentina"}]}},markdownRemark:{id:"/home/runner/work/sci-prog.github.io/sci-prog.github.io/src/pages/meltdown/index.md absPath of file >>> MarkdownRemark",html:'<p>Hace menos de una semana <a href="https://www.theregister.co.uk/2018/01/02/intel_cpu_design_flaw/">se dieron a conocer</a> dos <em>bugs</em> muy grandes y ocultos que afectan a gran parte de los procesadores: <em>meltdown</em> y <em>spectre</em>.\n¿Qué hace importante a estos exploits?\nQue sean <strong>fundamentales</strong>: no dependen de un sistema operativo o de un programa específico, sino que dependen del procesador.\nIncluso uno de ellos (<em>spectre</em>) funcionaría sobre prácticamente cualquier procesador moderno.</p>\n<p>En esta entrada vamos a analizar <a href="https://meltdownattack.com/meltdown.pdf"><code>meltdown</code></a>, un bug que estuvo presente <em>en todos los procesadores Intel</em> desde hace 20 años y que asombra por su sencillez.\nMás allá del sistema operativo, <code>meltdown</code> permite leer datos sensibles de otros procesos o máquinas virtuales a una velocidad de 500 kb/s.</p>\n<p>Pero, para comprender cómo funciona <code>meltdown</code>, primero tenemos que repasar algunos detalles del funcionamiento del procesador.</p>\n<h2>Arquitectura del Procesador</h2>\n<p>La información que “le pertenece” al procesador se guarda en los llamados <em>registros</em>.<sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup>\nSobre éstos puede hacer una cantidad de operaciones, como por ejemplo sumarlos, multiplicarlos, cambiarlos de lugar, etcétera.\nCuáles y cuántos son los registros y qué operaciones puede hacer son, básicamente, la <a href="https://es.wikipedia.org/wiki/Conjunto_de_instrucciones"><strong>arquitectura</strong></a>.\nEs un modelo abstracto (básicamente, cómo ve al procesador un programador a través de un <a href="https://es.wikipedia.org/wiki/Lenguaje_ensamblador">lenguaje <em>assembler</em></a>), que no define de forma unívoca cómo se realizan esas operaciones o dónde aparecen los registros, es decir, su implementación.</p>\n<p>La implementación de las instrucciones que puede realizar un procesador se llama <a href="https://es.wikipedia.org/wiki/Microarquitectura">microarquitectura</a>.\nEl estado de esta microarquitectura no es alterable: es decir, y esto es muy importante, <strong>no se puede programar sobre la microarquitectura u obtener su estado</strong>.\nAquí es donde todo se vuelve sutil y complicado y donde se realizan muchas optimizaciones del procesador muy conocidas.\nVamos a explicar tres conceptos de microarquitectura muy importantes en general y, específicamente, para comprender cómo funcionan <em>meltdown</em> y <em>spectre</em>.</p>\n<h3>Memoria Cache</h3>\n<p>Evidentemente, no toda la información que usa un programa puede estar en los registros del procesador (que, sumados, en general no superan 1 kB de memoria).\nLos programas residen, en su gran parte, en la memoria principal (la memoria RAM) y, para realizar operaciones, el procesador <em>trae</em> de la memoria principal los datos que necesita.\nEsta solución tiene un inconveniente: un procesador típico tarda 0.2 nanosegundos (un nanosegundo es una mil millonésima parte de un segundo) en realizar una operación, pero el acceso a la memoria principal lleva 100ns.\nPara ponerlo en perspectiva, si uno tardara 1 segundo en hacer una suma y quisiera sumar dos números, tendría que esperar <strong>más de 10 minutos</strong> para saber cuáles son los números (5 minutos para cada uno) que va a sumar.\nAfortunadamente, este problema se evita generalmente agregando un nuevo tipo de memoria, llamado “memoria cache”.\nEsta memoria está en el chip del procesador y es de muy rápido acceso y poca capacidad.\n¿Cómo funciona?\nCuando el procesador necesita acceder a una posición de la memoria principal, de paso, trae algunos valores que están cerca de esa posición (a pesar de que no los necesite en ese momento y no sea exactamente el que pidió) a la memoria cache, con la esperanza de que vaya a tener que usarlos pronto.\nEn nuestro ejemplo, si los números que vamos a sumar están juntos, en vez de 10 minutos, tardaríamos sólo 5.\nSi tuviéramos que sumar muchos números que están cerca, la ventaja se vuelve mayor.\nCuando necesitamos un dato de la memoria principal y está en el cache, se conoce como <em>cache hit</em>.\nCuando no está, es un <em>cache miss</em>.</p>\n<h3>Ejecución fuera de orden</h3>\n<p>Al agregar la memoria cache se reducen mucho las demoras en obtener datos de la memoria principal, pero así y todo los <em>cache misses</em> demoran mucho la ejecución del código.\nSupongamos que tenemos secuencialmente las operaciones 1 y 2, donde la operación 1 genera un <em>cache miss</em> y la 2 genera un <em>cache hit</em>.\nSi la operación 2 no depende del resultado de la operación 1, no hay problema en que ejecutemos la operación 2 mientras el procesador “va a buscar” la información necesaria para ejecutar la 1.\nEntonces, efectivamente, primero se ejecutaría la operación 2, para guardarla en un lugar temporal (perteneciente a la microarquitectura).\nLuego, una vez ejecutada la operación 1, <strong>consolida</strong> la operación 2 en el registro adecuado y, así queda en la arquitectura.\nEn conclusión, la <strong>consolidación</strong> es siempre en el orden explicitado, pero la ejecución puede ser <strong>fuera de orden</strong>.</p>\n<h3>Branch prediction</h3>\n<p>Imaginemos ahora el caso anterior, pero entre la operación 1 y la 2 hay una sentencia condicional que sí depende del resultado de la operación 1.\nAlgo así<sup id="fnref-2"><a href="#fn-2" class="footnote-ref">2</a></sup>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-c"><code>z <span class="token operator">=</span> a<span class="token operator">*</span>x<span class="token punctuation">;</span> <span class="token comment">// op 1</span>\n<span class="token keyword">if</span> <span class="token punctuation">(</span>z <span class="token operator">></span> <span class="token number">5</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>\n  w <span class="token operator">=</span> z <span class="token operator">+</span> y<span class="token punctuation">;</span> <span class="token comment">// op 2 primer caso</span>\n<span class="token punctuation">}</span>\n<span class="token keyword">else</span> <span class="token punctuation">{</span>\n  w <span class="token operator">=</span> z <span class="token operator">-</span> y<span class="token punctuation">;</span> <span class="token comment">// op 2 segundo caso</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>La situación es similar a la anterior, pero ahora, hasta tener el valor de <code>z</code> no sabemos qué operación hacer.\nNo nos queda otra que esperar al resultado, y ya no podemos ganar tiempo como antes… ¿o sí?\nEl <em>branch prediction</em> (que forma parte de, en general, la <em>ejecución especulativa</em>) consiste en ejecutar alguna de las dos tratando de predecir qué va a resultar de la condición y guardando el resultado en un lugar temporal.\nEn caso de que lo hayamos predicho correctamente, <strong>consolidamos</strong> el resultado temporal a <code>w</code>.\nSi no, tendremos que recalcular <code>w</code>.\nFíjense que sólo con que el predictor sea al azar (es decir, que aleatoriamente elija con 50% de probabilidades seguir un camino u otro) ya la ejecución especulativa es aceptada la mitad de las veces<sup id="fnref-3"><a href="#fn-3" class="footnote-ref">3</a></sup>.</p>\n<h2>Meltdown: Modificando el estado de la microarquitectura</h2>\n<p>Cuando ejecutamos un programa cualquiera, éste no tiene permitido acceder a cualquier lugar de la memoria principal.\nEsto es de esperar, ya que si no cualquier programa que ejecutemos podría leer todo lo que estamos ejecutando y obtener, por ejemplo, nuestras claves bancarias.\nAsí, al intentar acceder a una posición de memoria prohibida (es decir, que no le pertenece al programa que se está ejecutando), se dispara una <em>excepción</em> y la ejecución se detiene.\nEl objetivo de <code>meltdown</code> es obtener la información de <strong>toda la memoria principal</strong>, a pesar de que su acceso no está permitido.</p>\n<p>Con las características que describimos ya es suficiente para entender cómo funciona <code>meltdown</code>.\n<strong>IMPORTANTE:</strong> por ahora, para simplificar un poco las cosas, por un rato supongamos que el comportamiento del <em>cache</em> es ligeramente distinto: cuando va a buscar un dato en la memoria principal, trae <strong>sólo a ese dato</strong> a la memoria cache.<sup id="fnref-4"><a href="#fn-4" class="footnote-ref">4</a></sup></p>\n<p>Como es de esperar, es de una sencillez que deslumbra.\nEl objetivo es leer el byte que está guardado en una posición de memoria inaccesible a nuestro programa (esa posición de memoria la llamamos <code>mem</code>), situada en el espacio de memoria del <em>kernel</em>, que puede acceder a todas las posiciones de la memoria física.\nSupongamos que el programa que estamos ejecutando tiene una sección de 256 bytes propios en la memoria principal, que no está alojada en la memoria cache<sup id="fnref-5"><a href="#fn-5" class="footnote-ref">5</a></sup>.\nDicho en otras palabras, supongamos que tenemos un <code>array</code> de C de 256 bytes de tamaño, al que llamaremos <code>probe</code>.\nAhora ejecutamos las siguientes instrucciones:</p>\n<div class="gatsby-highlight">\n      <pre class="language-c"><code>x <span class="token operator">=</span> <span class="token operator">*</span>mem<span class="token punctuation">;</span> <span class="token comment">// guardamos en x el contenido de la posición de memoria mem</span>\ntmp <span class="token operator">=</span> probe<span class="token punctuation">[</span>x<span class="token punctuation">]</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>La primera instrucción, como trata de acceder a una posición de memoria prohibida, dispara una <em>excepción</em> y, efectivamente, <code>x</code> nunca toma el valor que está guardado en <code>mem</code>.\nDebido a la ejecución fuera de orden, cuando se carga el valor de <code>mem</code> en <code>x</code>, es probable que el procesador ya haya comenzado a ejecutar la instrucción siguiente como parte de la ejecución fuera de orden y las haya guardado en la posición temporal (recordemos, perteneciente a la microarquitectura).\nComo ya mencionamos, la <strong>consolidación</strong> de los datos se realiza en estricto orden, y aquí queda claro por qué.\nEs durante la consolidación que se maneja cualquier tipo de excepción.\nComo en este caso la primera instrucción genera una excepción, la segunda instrucción no se consolida y, entonces, el valor de <code>probe[x]</code> no queda guardado en ningún lugar de la arquitectura.</p>\n<p>Sin embargo, y aquí está el punto jugoso del asunto, la segunda instrucción no se consolidó pero <em>se ejecutó</em>.\nY al ejecutarse, trajo el valor de <code>probe[x]</code> a la memoria cache.\nEn conclusión, logramos modificar la microarquitectura.</p>\n<h2>Meltdown: Obteniendo los secretos</h2>\n<p>Una vez que terminamos de ejecutar el código ya mencionado, la microarquitectura queda ligeramente modificada.\nAl comienzo de nuestro problema ninguno de los elementos de <code>probe</code> residían en la memoria cache; al terminarlo, <code>probe[x]</code> está en la memoria cache.\n¿Podremos aprovechar esto de alguna forma?\nRecordemos cuál era todo el punto de tener una memoria cache: los elementos que están en ella se acceden mucho más rápido que en la memoria principal.\nEntonces hacemos un pequeño ejercicio: tratamos de acceder a <em>cada uno</em> de los elementos de <code>probe</code> y medimos cuánto tiempo demanda ese acceso.\nAl realizar esta medición observamos que el acceso a todas las posiciones <code>i</code> de <code>probe[i]</code> llevan cerca de <code>100 ns</code>, excepto el acceso a <code>probe[84]</code> que tarda sensiblemente menos.\n¿Qué pasó?\nSimple: pasó que <code>probe[84]</code> estaba ya guardado en el cache y entonces fue más rápido acc--- ¡un momento!\nSi <code>probe[x]</code> estaba en el cache luego de ejecutar las instrucciones que mencionamos y ahora vemos que <code>probe[84]</code> está en la cache… eso quiere decir que x es 84.\n¡Es decir que lo que estaba en esa memoria inaccesible era 84!</p>\n<h2>Detalles que no tuvimos en cuenta</h2>\n<h3>El comportamiento real de la cache</h3>\n<p>El ejemplo de <code>meltdown</code> que dimos suponía un comportamiento ligeramente diferente de la cache, en el que sólo traía el valor pedido.\nEn realidad, trae una sección de <code>n</code> bytes<sup id="fnref-6"><a href="#fn-6" class="footnote-ref">6</a></sup> contigua al valor pedido (llamado tamaño de página de memoria).\nLa solución, igual, es sencillísima: el array <code>probe</code> tiene tamaño <code>256*n</code> (es decir, de tamaño igual a 256 páginas) y el acceso lo hacemos a <code>probe[x*n]</code>.\nAsí nos garantizamos que cada acceso defina unívocamente a una página del cache<sup id="fnref-7"><a href="#fn-7" class="footnote-ref">7</a></sup>.</p>\n<h3>Bueno, pero el programa efectivamente dispara una excepción</h3>\n<p>Sí, es cierto, pero hay varias soluciones posibles:</p>\n<ol>\n<li>\n<p>Que el programa, en vez de ejecutar el código, lance un sub-proceso que lo ejecute.\nAsí, cuando ese sub-proceso dispara la excepción (un <em>segmentation fault</em> o <code>SIGSEGV</code>), el control puede seguir en el programa original.</p>\n</li>\n<li>\n<p>Usar un <em>handle</em> para manejar la señal; por ejemplo <a href="https://www.gnu.org/software/libsigsegv/">libsigsegv</a>.</p>\n</li>\n<li>\n<p>Que el código se ejecute después de un condicional que se prediga incorrectamente.\nDe esta forma, se ejecuta especulativamente pero <strong>nunca</strong> se consolida y, como las excepciones se disparan al consolidar las operaciones, nunca obtenemos una excepción.</p>\n</li>\n<li>\n<p>Suprimir la excepción con <a href="https://software.intel.com/en-us/node/524022">Intel TSX</a>, una implementación de memoria transaccional en hardware que, dicho mal y pronto, permite que múltiples instrucciones se agrupen en una <em>transacción</em> que, si falla, revierte las operaciones hechas pero no dispara ninguna excepción.</p>\n</li>\n</ol>\n<h3>¿Y si se dispara la excepción antes de la ejecución posterior?</h3>\n<p>Cuando describíamos <code>meltdown</code> dijimos: “Debido a la ejecución fuera de orden, cuando se carga el valor de <code>mem</code> en <code>x</code>, es probable que el procesador ya haya comenzado a ejecutar la instrucción siguiente como parte de la ejecución fuera de orden y las haya guardado en la posición temporal (recordemos, perteneciente a la microarquitectura).”</p>\n<p>Es decir, si es probable que ya haya comenzado a ejecutar la instrucción siguiente, también es probable que no lo haya hecho.\nCuando se dispara la excepción <strong>todos</strong> los registros se hacen cero<sup id="fnref-8"><a href="#fn-8" class="footnote-ref">8</a></sup>, y <code>x</code> es un registro.\nLa solución es entonces que trate de leer el valor guarado en <code>mem</code> siempre que <code>x</code> no sea cero.</p>\n<h2>Resultados de meltdown</h2>\n<p>Los resultados de <code>meltdown</code> son asombrosos: lee correctamente el 99.98% de la memoria prohibida a una velocidad de 500 kb/s.\nFunciona en todos los procesadores de Intel probados, pero no en los AMD.\nEsto se puede deber a varios motivos, como por ejemplo que en esas microarquitecturas el tamaño de los <em>buffers</em> utilizados para la ejecución fuera de orden sean muy pequeños y la excepción se dispare siempre antes de que se ejecuten las operaciones posteriores.\nAfortunadamente <em>meltdown</em> tiene una solución en el corto plazo llamada KAISER, que evita que, para el espacio de memoria del usuario, exista una posición de memoria que vaya al <em>kernel</em>.\nA pesar de que la solución no es total y todavía deja algunas vulnerabilidades, mitiga bastante el efecto de <code>meltdown</code>.\n¿El costo?\nLos programas podrían ser hasta un 30% más lentos.</p>\n<h2>Conclusión</h2>\n<p><code>meltdown</code> es un bug que estuvo presente desde hace 20 años, todo terreno y que, como dijimos, asombra por su sencillez.\nSin la necesidad de vulnerabilidades de software e independientemente del sistema operativo, <code>meltdown</code> permite leer datos sensibles de otros procesos o máquinas virtuales a una velocidad de 500 kb/s.</p>\n<div class="footnotes">\n<hr>\n<ol>\n<li id="fn-1">\n<p>Claro que la información de la “computadora” propiamente dicha también se encuentra en, por ejemplo, la memoria RAM.</p>\n<a href="#fnref-1" class="footnote-backref">↩</a>\n</li>\n<li id="fn-2">\n<p>Esto es una cuestión conceptual. Los saltos condicionales y las asignaciones son un poco distintas en la arquitectura.</p>\n<a href="#fnref-2" class="footnote-backref">↩</a>\n</li>\n<li id="fn-3">\n<p>Hoy en día los predictores tienen una precisión de aproximadamente <a href="https://www.ece.cmu.edu/~ece447/s13/lib/exe/fetch.php?media=onur-447-spring13-lecture11-branch-prediction-afterlecture.pdf">95%</a></p>\n<a href="#fnref-3" class="footnote-backref">↩</a>\n</li>\n<li id="fn-4">\n<p>La generalización para los casos en los que el cache trae más de un dato funcionan con una muy ligera variación.</p>\n<a href="#fnref-4" class="footnote-backref">↩</a>\n</li>\n<li id="fn-5">\n<p>Esto se puede lograr de muchas maneras, pero de cualquier modo cuando se ejecuta el programa, el <code>array</code> comienza localizado en la memoria principal y fuera de la cache.</p>\n<a href="#fnref-5" class="footnote-backref">↩</a>\n</li>\n<li id="fn-6">\n<p>El valor típico para la mayoría de los sistemas operativos es 4kb.</p>\n<a href="#fnref-6" class="footnote-backref">↩</a>\n</li>\n<li id="fn-7">\n<p>Visto de esta forma, podemos suponer que el cache imaginario que inventamos era para un sistema con un tamaño de página de 1 byte.</p>\n<a href="#fnref-7" class="footnote-backref">↩</a>\n</li>\n<li id="fn-8">\n<p>Esto es esperable porque hay que borrar cualquier información prohibida que se haya guardado en los registros.</p>\n<a href="#fnref-8" class="footnote-backref">↩</a>\n</li>\n</ol>\n</div>',frontmatter:{title:"Meltdown: Una explicación técnica y sencilla",date:"January 08, 2018",author:"pabloalcain"},fields:{slug:"/meltdown/"}}},pathContext:{slug:"/meltdown/"}}}});
//# sourceMappingURL=path---meltdown-36ea1df735d2937b866a.js.map