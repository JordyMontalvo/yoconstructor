# Game Design Document — Trivia Interactiva Progresol

**Proyecto:** Stand Progresol — Expo Yo Constructor 2026
**Cliente:** Dinamo / Grupo Unacem
**Desarrollo:** MNFTO Studio (Artemanifiesto)
**Fecha:** 7 de abril de 2026 | **Versión:** 1.0

---

## 1. Resumen Ejecutivo

Trivia interactiva educacional sobre cemento, concreto y productos de la línea Progresol (Unacem), desplegada en un tótem táctil de 55" durante la Expo Yo Constructor 2026 (23-26 de abril, Lima). El objetivo es atraer visitantes al stand, educar sobre los productos, y generar una experiencia de marca memorable.

| Parámetro | Valor |
|---|---|
| Género | Trivia / Quiz educacional |
| Plataforma | Tótem táctil 55" (Android 13, HTML5) |
| Duración por partida | ~2-3 minutos (10 preguntas con timer) |
| Jugadores | 1 jugador por partida, sin registro |
| Banco de preguntas | 30 preguntas, 10 aleatorias por partida |
| Animaciones | Lottie + Canvas (partículas, confetti, transiciones elaboradas) |
| Modo offline | 100% offline, sin dependencia de red |

---

## 2. Flujo de Pantallas

La aplicación funciona como SPA (Single Page Application). Cada pantalla es un cambio de estado en el DOM, sin navegación real del navegador.

```
PORTADA → INSTRUCCIONES → PREGUNTA (x10) → FEEDBACK (x10) → RESULTADO → PORTADA
   ▲                                                                        │
   └──────────────── Screensaver (120s sin interacción) ────────────────────┘
```

Si no hay interacción por 2 minutos en cualquier punto, regresa a la portada (screensaver). En la pantalla de resultado, el timeout es de 10 segundos.

### 2.1 Pantalla: Portada Animada

**Propósito:** Atraer la atención de los visitantes que pasan por el stand. Comunicar la marca Progresol y la existencia de la trivia.

**Animación:** Fondo animado con partículas (tipo construcción/cemento). Logo Progresol con animación de entrada (scale + fade). Elementos decorativos en loop sutil para que la pantalla siempre se vea "viva".

**Elementos visibles:** Logo Progresol (zona superior), título de la trivia ("¿Cuánto sabes de construcción?" o similar), botón grande "INICIAR" pulsante en la zona interactiva (80-160cm del suelo).

**Interacción:** Tap en botón INICIAR → transición a Instrucciones.

**Idle:** Esta pantalla ES el screensaver. Las animaciones corren en loop infinito.

### 2.2 Pantalla: Instrucciones

**Propósito:** Explicar brevemente las reglas antes de empezar.

**Contenido:** Título "Cómo jugar". Texto breve: "Responde 10 preguntas sobre construcción y productos Progresol. Tienes [X] segundos por pregunta. Al final verás tu puntaje."

**Animación:** Entrada con slide-up o fade-in. Íconos animados ilustrando las reglas (reloj para timer, check para aciertos).

**Interacción:** Botón "COMENZAR" → transición a primera pregunta.

### 2.3 Pantalla: Pregunta (x10)

**Propósito:** Presentar una pregunta con 4 opciones de respuesta y un timer visual.

**Layout:**
- Zona superior: número de pregunta (ej: "3 de 10") + barra de progreso
- Centro: texto de la pregunta
- Zona interactiva: 4 botones de respuesta apilados verticalmente
- Zona inferior: timer visual (barra que se vacía o círculo countdown)

**Timer:** 15 segundos por pregunta (ajustable). Animación fluida de countdown. Si el tiempo se agota sin respuesta, se cuenta como incorrecta y se muestra la respuesta correcta.

**Interacción:** Tap en una opción → feedback inmediato (<100ms cambio visual) → transición a pantalla de feedback.

**Selección de preguntas:** Al iniciar la partida, se seleccionan 10 preguntas al azar del banco de 30 usando Fisher-Yates shuffle. El orden de las opciones dentro de cada pregunta también se aleatoriza.

### 2.4 Pantalla: Feedback (post-respuesta)

**Propósito:** Informar si acertó o no. En caso de error, educar mostrando la respuesta correcta.

| Escenario | Visual | Comportamiento |
|---|---|---|
| Respuesta correcta | Fondo verde, icono check animado (Lottie), la opción elegida se resalta en verde | Muestra "¡Correcto!" por 1.5 segundos, luego avanza a siguiente pregunta |
| Respuesta incorrecta | Fondo rojo en opción elegida + se resalta la correcta en verde, icono X animado | Muestra "Incorrecto" + "La respuesta correcta es: [X]" por 3 segundos, luego avanza |
| Tiempo agotado | Timer explota/desaparece con animación, se resalta la correcta en verde | Muestra "Se acabó el tiempo" + respuesta correcta por 3 segundos, cuenta como incorrecta |

### 2.5 Pantalla: Resultado

**Propósito:** Mostrar el desempeño final con un mensaje motivacional diferenciado según el puntaje.

| Puntaje | Tier | Mensaje (propuesta) | Animación |
|---|---|---|---|
| 0-3 de 10 | Aprendiz | "Tienes mucho por descubrir sobre construcción. ¡Progresol te acompaña en el camino!" | Animación sutil, icono de libro/aprendizaje |
| 4-7 de 10 | Constructor | "¡Vas por buen camino! Ya sabes bastante de construcción. Progresol es tu aliado." | Animación media, herramientas de construcción |
| 8-10 de 10 | Maestro Constructor | "¡Eres un experto! Construir es tu pasión y Progresol tu mejor herramienta." | Confetti + estrellas, animación celebratoria elaborada |

**Elementos visibles:** Puntaje numérico grande (ej: "7/10"), nombre del tier, mensaje motivacional, botón "VOLVER A JUGAR". Después de 10 segundos sin interacción, regresa automáticamente a la portada.

---

## 3. Mecánicas de Juego

### 3.1 Selección de preguntas

El banco contiene 30 preguntas. Al iniciar cada partida, se seleccionan 10 mediante el algoritmo Fisher-Yates shuffle para garantizar distribución uniforme. Las opciones dentro de cada pregunta también se reordenan aleatoriamente para evitar que la posición de la respuesta correcta sea predecible.

### 3.2 Timer por pregunta

Cada pregunta tiene un límite de 15 segundos (valor configurable en el código). El timer se representa visualmente como una barra que se vacía o un círculo de countdown. Los últimos 5 segundos tienen animación de urgencia (cambio de color a rojo, pulso). Si el tiempo se agota, la pregunta se marca como incorrecta automáticamente.

### 3.3 Sistema de puntaje

Cada respuesta correcta suma 1 punto. No hay puntos negativos ni bonus por velocidad. El puntaje final es la cantidad de aciertos sobre 10. La simpleza es intencional: el público objetivo es diverso (maestros de obra, autoconstructores, público general) y la mecánica debe ser inmediatamente comprensible.

### 3.4 Feedback educacional

Las respuestas correctas reciben feedback positivo breve ("¡Correcto!") y avanzan rápido (1.5s). Las respuestas incorrectas y los tiempos agotados muestran la respuesta correcta durante 3 segundos. Este es el componente educacional de la experiencia: el visitante aprende incluso cuando se equivoca.

### 3.5 Screensaver / Reset automático

Si no hay interacción táctil durante 120 segundos (configurable) en cualquier pantalla, la app regresa a la portada animada. Esto aplica tanto desde Fully Kiosk Browser (screensaver URL) como desde la propia app (timer de inactividad JS). Doble capa de protección para que la pantalla nunca quede en un estado intermedio.

---

## 4. Especificación de Animaciones

El cliente requiere animaciones elaboradas. Se usará una combinación de tecnologías según el tipo de animación:

| Tecnología | Uso | Ventaja | Consideración |
|---|---|---|---|
| Lottie (lottie-web) | Iconos animados, feedback (check, X, confetti), elementos decorativos | Exportable desde After Effects, archivos JSON livianos, loop nativo | Requiere que el diseñador entregue archivos .json de Lottie |
| CSS Animations | Transiciones entre pantallas, hover/tap states, pulso de botones, barra de progreso | Rendimiento nativo, sin dependencias, hardware-accelerated | Limitadas a transformaciones y propiedades CSS |
| Canvas 2D / Partículas | Fondo de portada (partículas flotantes), efecto confetti en resultado tier 3 | Libertad total, control frame-by-frame | Mayor consumo de CPU, necesita requestAnimationFrame optimizado |

### 4.1 Inventario de animaciones requeridas

| Pantalla | Animación | Tech | Assets necesarios |
|---|---|---|---|
| Portada | Partículas flotantes de fondo (loop infinito) | Canvas | Configuración de partículas (colores marca) |
| Portada | Logo Progresol entrada (scale + fade) | CSS | Logo PNG/SVG |
| Portada | Botón INICIAR pulsante | CSS | Ninguno |
| Instrucciones | Entrada slide-up de contenido | CSS | Ninguno |
| Instrucciones | Iconos animados (reloj, check) | Lottie | 2 archivos .json Lottie |
| Pregunta | Timer countdown (barra/círculo) | CSS+JS | Ninguno |
| Pregunta | Timer urgencia (últimos 5s: rojo + pulso) | CSS | Ninguno |
| Pregunta | Transición entre preguntas (slide) | CSS | Ninguno |
| Feedback | Check animado (correcto) | Lottie | 1 archivo .json Lottie |
| Feedback | X animada (incorrecto) | Lottie | 1 archivo .json Lottie |
| Feedback | Resaltado de opción correcta/incorrecta | CSS | Ninguno |
| Resultado | Número de puntaje con conteo animado (0→7) | JS+CSS | Ninguno |
| Resultado | Confetti/estrellas (tier Maestro) | Canvas | Configuración de partículas |
| Resultado | Icono de tier animado | Lottie | 3 archivos .json Lottie (1 por tier) |
| Todas | Transiciones entre pantallas | CSS | Ninguno |

**Total de assets Lottie requeridos:** 7 archivos .json (2 instrucciones + 1 check + 1 X + 3 tiers). Pueden usarse animaciones gratuitas de LottieFiles.com como base, personalizadas con los colores de marca.

---

## 5. Diagrama de Estados

| Estado | Descripción | Transiciones posibles |
|---|---|---|
| IDLE | Portada animada en loop. Esperando interacción. | Tap INICIAR → INSTRUCTIONS |
| INSTRUCTIONS | Pantalla de instrucciones visible. | Tap COMENZAR → PLAYING · Timeout 120s → IDLE |
| PLAYING | Pregunta activa, timer corriendo. | Tap opción → FEEDBACK · Timer agotado → FEEDBACK · Timeout 120s → IDLE |
| FEEDBACK | Mostrando resultado de la pregunta. | Auto (1.5-3s) → PLAYING (siguiente) · Auto → RESULT (si era pregunta 10) |
| RESULT | Mostrando puntaje final y tier. | Tap VOLVER → IDLE · Timeout 10s → IDLE |

**Variables de estado globales:** currentQuestion (0-9), score (0-10), selectedQuestions[] (array de 10), userAnswers[] (historial), gameState (enum de los 5 estados).

---

## 6. Historias de Usuario

### US-01: Portada animada

**Como** visitante del stand, **quiero** ver una pantalla atractiva y animada con la marca Progresol, **para** sentirme atraído a interactuar con el tótem.

**Criterios de aceptación:**
- ✓ La portada muestra el logo Progresol con animación de entrada (scale + fade)
- ✓ El fondo tiene partículas animadas en loop continuo (colores de marca)
- ✓ Hay un botón INICIAR grande y pulsante en la zona interactiva (80-160cm del suelo)
- ✓ El botón INICIAR responde al tap en menos de 100ms
- ✓ Las animaciones corren en loop infinito sin degradación de rendimiento
- ✓ La pantalla funciona como screensaver (se vuelve a ella tras 120s de inactividad)

**Prioridad:** Alta | **Estimación:** 4h

### US-02: Pantalla de instrucciones

**Como** jugador, **quiero** leer las reglas del juego antes de empezar, **para** entender cómo funciona la trivia y qué esperar.

**Criterios de aceptación:**
- ✓ Se muestra título "Cómo jugar" con instrucciones claras (número de preguntas, timer, puntaje)
- ✓ El contenido entra con animación slide-up
- ✓ Hay iconos animados (Lottie) ilustrando las reglas
- ✓ Botón COMENZAR visible y claro en zona interactiva
- ✓ Timeout de 120s regresa a portada si nadie toca COMENZAR

**Prioridad:** Alta | **Estimación:** 2h

### US-03: Presentación de pregunta con timer

**Como** jugador, **quiero** ver una pregunta con 4 opciones y un timer visual, **para** responder dentro del tiempo límite y sentir la urgencia del juego.

**Criterios de aceptación:**
- ✓ Se muestra el número de pregunta actual (ej: "3 de 10") y una barra de progreso
- ✓ El texto de la pregunta es legible (32-40px) y los botones de respuesta son grandes (zona interactiva)
- ✓ El timer de 15 segundos tiene animación fluida de countdown
- ✓ Los últimos 5 segundos del timer cambian a rojo con efecto pulso
- ✓ Las 4 opciones están en orden aleatorio (la correcta no está siempre en la misma posición)
- ✓ Al tocar una opción, hay feedback visual inmediato (<100ms)
- ✓ Si el timer llega a 0, se marca como incorrecta automáticamente

**Prioridad:** Alta | **Estimación:** 6h

### US-04: Feedback post-respuesta

**Como** jugador, **quiero** saber inmediatamente si mi respuesta fue correcta o incorrecta, y aprender la respuesta correcta cuando me equivoco, **para** aprender sobre construcción y productos Progresol mientras juego.

**Criterios de aceptación:**
- ✓ Respuesta correcta: fondo verde + icono check animado (Lottie) + texto "¡Correcto!"
- ✓ Respuesta correcta avanza automáticamente en 1.5 segundos
- ✓ Respuesta incorrecta: opción elegida en rojo + opción correcta resaltada en verde + icono X animado
- ✓ Respuesta incorrecta muestra "La respuesta correcta es: [X]" por 3 segundos
- ✓ Tiempo agotado: mismo comportamiento que incorrecta + texto "Se acabó el tiempo"
- ✓ Después del feedback, transición animada a la siguiente pregunta (o a resultado si era la 10)

**Prioridad:** Alta | **Estimación:** 4h

### US-05: Pantalla de resultado con tiers

**Como** jugador, **quiero** ver mi puntaje final con un mensaje personalizado según mi desempeño, **para** sentirme motivado y tener un cierre satisfactorio de la experiencia.

**Criterios de aceptación:**
- ✓ El puntaje se muestra con animación de conteo (0 hasta el número final)
- ✓ Tier Aprendiz (0-3): mensaje motivacional + animación sutil
- ✓ Tier Constructor (4-7): mensaje positivo + animación media
- ✓ Tier Maestro Constructor (8-10): mensaje celebratorio + confetti + animación elaborada
- ✓ Botón "VOLVER A JUGAR" visible en zona interactiva
- ✓ Si no hay interacción en 10 segundos, regresa automáticamente a la portada

**Prioridad:** Alta | **Estimación:** 5h

### US-06: Selección aleatoria de preguntas

**Como** operador del stand, **quiero** que cada partida tenga preguntas diferentes, **para** que los visitantes que repiten la experiencia no vean las mismas preguntas.

**Criterios de aceptación:**
- ✓ Se seleccionan 10 preguntas de un banco de 30 mediante Fisher-Yates shuffle
- ✓ El orden de las opciones dentro de cada pregunta también es aleatorio
- ✓ Dos partidas consecutivas tienen combinaciones distintas (verificable en testing)

**Prioridad:** Alta | **Estimación:** 1h

### US-07: Transiciones animadas entre pantallas

**Como** visitante, **quiero** que las transiciones entre pantallas sean fluidas y animadas, **para** que la experiencia se sienta profesional y pulida.

**Criterios de aceptación:**
- ✓ Portada → Instrucciones: transición fade/slide (300-500ms)
- ✓ Instrucciones → Pregunta 1: transición slide-left
- ✓ Pregunta N → Pregunta N+1: slide-left (sensación de avance)
- ✓ Pregunta 10 → Resultado: transición especial (zoom-in o fade elaborado)
- ✓ Resultado → Portada: fade-out / fade-in
- ✓ Ninguna transición supera los 500ms para mantener la responsividad
- ✓ Las animaciones usan GPU acceleration (transform, opacity) para rendimiento en Android WebView

**Prioridad:** Media | **Estimación:** 4h

### US-08: Reset automático por inactividad

**Como** operador del stand, **quiero** que la pantalla regrese a la portada si nadie interactúa por 2 minutos, **para** que la pantalla nunca quede en un estado intermedio sin supervisión.

**Criterios de aceptación:**
- ✓ Después de 120 segundos sin touch en cualquier pantalla (excepto portada), se regresa a portada
- ✓ El timer de inactividad se resetea con cada interacción táctil
- ✓ En pantalla de resultado, el timeout es de 10 segundos (más agresivo)
- ✓ Fully Kiosk Browser tiene configurado el mismo screensaver como respaldo

**Prioridad:** Alta | **Estimación:** 2h

### US-09: Registro de partidas (analytics)

**Como** cliente (Dinamo), **quiero** tener un registro de todas las partidas jugadas durante el evento, **para** reportar métricas de participación a Unacem.

**Criterios de aceptación:**
- ✓ Cada partida completada se guarda en IndexedDB con: timestamp, puntaje, duración, respuestas detalladas
- ✓ Los datos persisten entre reinicios del navegador
- ✓ Se puede exportar a CSV desde pantalla de admin (acceso con PIN)
- ✓ El CSV incluye: fecha/hora, puntaje, duración, detalle pregunta por pregunta

**Prioridad:** Media | **Estimación:** 3h

---

## 7. Resumen de Estimaciones

| ID | Historia | Horas | Prioridad |
|---|---|---|---|
| US-01 | Portada animada | 4h | Alta |
| US-02 | Pantalla de instrucciones | 2h | Alta |
| US-03 | Presentación de pregunta con timer | 6h | Alta |
| US-04 | Feedback post-respuesta | 4h | Alta |
| US-05 | Pantalla de resultado con tiers | 5h | Alta |
| US-06 | Selección aleatoria de preguntas | 1h | Alta |
| US-07 | Transiciones animadas entre pantallas | 4h | Media |
| US-08 | Reset automático por inactividad | 2h | Alta |
| US-09 | Registro de partidas (analytics) | 3h | Media |
| | **TOTAL ESTIMADO** | **31h** | |

Nota: las estimaciones incluyen desarrollo + pruebas unitarias, pero no incluyen pruebas en el tótem real ni el diseño gráfico de los assets (responsabilidad del diseñador). Las animaciones Lottie requieren assets del diseñador (7 archivos .json).

---

## 8. Dependencias y Assets Requeridos

| Asset | Responsable | Formato | Deadline |
|---|---|---|---|
| Logo Progresol | Dinamo | SVG o PNG @2x | Entregado |
| Paleta de colores de marca | Dinamo | HEX codes | Entregado |
| Tipografías de marca | Dinamo | WOFF2 / TTF | Entregado |
| Banco de 30 preguntas | Dinamo / Unacem | Tabla con respuesta correcta | 7 abril |
| 7 animaciones Lottie | Diseñador | .json (Lottie) | 12 abril |
| Textos de tiers (aprobados) | Dinamo | Texto | 10 abril |
| Mensajes de instrucciones | Dinamo | Texto | 10 abril |
