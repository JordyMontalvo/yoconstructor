# Specs de Desarrollo — Trivia Progresol en Tótem Táctil

**Proyecto:** Stand Progresol — Expo Yo Constructor 2026
**Documento interno — Equipo de desarrollo**
**Última actualización:** 31 de marzo de 2026

---

## 1. Hardware del Tótem

| Parámetro | Valor |
|---|---|
| Pantalla | 55" táctil capacitiva (multitouch) |
| Dimensiones totales | 187 cm alto x 72 cm ancho x 9 cm profundidad (pantalla) |
| Base | 73 cm x 46 cm |
| Sistema operativo | Android 13 |
| Orientación | Vertical (portrait) |
| Resolución | 1920 x 1080 px (Full HD, portrait = 1080 x 1920 efectivo) |
| Conectividad | WiFi disponible pero **no requerido** — la app funciona 100% offline |
| Consumo | ~200 W |

**Importante:** Confirmar con Peter Marx si el tótem tiene navegador preinstalado y versión de Chrome/WebView. Esto determina qué APIs de JavaScript están disponibles.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla | Máxima compatibilidad con WebView Android, sin dependencias de build |
| Modo kiosco | Fully Kiosk Browser (Android) | Bloqueo completo del sistema operativo, sin barra de navegación |
| Almacenamiento local | IndexedDB / localStorage | Persistencia offline de datos de partidas y registros |
| Exportación | CSV generado en cliente | Descarga de datos al cierre del evento |

**Por qué HTML5 y no Unity / app nativa:**
- Iteración rápida (cambios de diseño sin recompilar)
- No requiere Play Store ni sideloading de APK
- Fully Kiosk Browser carga directamente un HTML local o URL
- Suficiente para una trivia con animaciones CSS/JS

---

## 3. Fully Kiosk Browser — Configuración de Kiosco

### 3.1 Qué es

Fully Kiosk Browser es una app Android (~S/400 licencia) que convierte cualquier tablet/tótem en un kiosco dedicado. Bloquea acceso al sistema operativo, barra de navegación, gestos del sistema y botones físicos.

### 3.2 Configuración requerida

```
[Web Content Settings]
Start URL              = file:///sdcard/trivia/index.html   (o URL local del servidor)
Orientation            = Portrait (locked)
Autoplay Videos        = Enabled

[Kiosk Mode]
Enable Kiosk Mode      = ON
Lock System Bars       = ON (oculta barra de estado y navegación)
Lock Home Button       = ON
Lock Power Button      = ON (previene apagado accidental)
Lock Volume Buttons    = ON
Swipe to Exit          = OFF
Pinch to Exit          = OFF

[Motion Detection / Screensaver]
Screensaver Timer      = 120 segundos (2 min sin interacción → vuelve a pantalla de bienvenida)
Screensaver URL        = file:///sdcard/trivia/index.html (misma pantalla de bienvenida)

[Advanced]
Clear Cache on Idle    = OFF (preservar datos de IndexedDB)
JavaScript Alerts      = Disabled
Error Messages         = Hidden
Context Menus          = Disabled
Drag & Drop            = Disabled
Text Selection         = Disabled
```

### 3.3 Despliegue

1. Instalar Fully Kiosk Browser desde Play Store en el tótem
2. Activar licencia (clave se compra en fully-kiosk.com)
3. Copiar carpeta `trivia/` a almacenamiento interno del tótem (`/sdcard/trivia/`)
4. Configurar Start URL apuntando al `index.html` local
5. Activar Kiosk Mode
6. Probar que no sea posible salir de la app por ningún gesto o botón

**Contraseña de administrador:** Configurar un PIN de salida (ej: triple tap en esquina superior izquierda + PIN) para que el equipo técnico pueda salir del kiosco durante montaje/desmontaje.

---

## 4. Protecciones Touch en la App (CSS/JS)

Aunque Fully Kiosk bloquea gestos del sistema, la app misma debe prevenir comportamientos no deseados del navegador.

### 4.1 CSS obligatorio

```css
/* Aplicar al body o contenedor raíz */
* {
    touch-action: manipulation;    /* Solo permite tap y scroll vertical — bloquea pinch zoom, double-tap zoom */
    user-select: none;             /* Impide selección de texto */
    -webkit-user-select: none;
    overscroll-behavior: none;     /* Impide el "pull to refresh" y el bounce del scroll */
    -webkit-touch-callout: none;   /* Impide menú contextual en iOS/Android al mantener presionado */
}

html, body {
    overflow: hidden;              /* Sin scroll — cada pantalla ocupa el viewport completo */
    position: fixed;
    width: 100%;
    height: 100%;
}
```

### 4.2 JavaScript obligatorio

```javascript
// Prevenir zoom por gestos
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());

// Prevenir double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevenir pull-to-refresh
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();  // Bloquea multitouch (pinch)
    }
}, { passive: false });

// Prevenir back con swipe (por si acaso)
window.addEventListener('popstate', (e) => {
    history.pushState(null, '', window.location.href);
});
history.pushState(null, '', window.location.href);
```

### 4.3 Meta tags en el HTML

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
```

---

## 5. Arquitectura de la App

### 5.1 Estructura de archivos

```
trivia/
├── index.html              # Entry point — pantalla de bienvenida
├── css/
│   └── styles.css          # Estilos globales + protecciones touch
├── js/
│   ├── app.js              # Lógica principal, navegación entre pantallas
│   ├── questions.js         # Banco de preguntas (JSON embebido o archivo separado)
│   ├── storage.js           # Capa de almacenamiento (IndexedDB wrapper)
│   └── export.js            # Generación y descarga de CSV
├── assets/
│   ├── images/              # Logos, fondos, iconos
│   ├── fonts/               # Tipografías de marca (embebidas, no Google Fonts)
│   └── sounds/              # Efectos de sonido opcionales (acierto/error)
└── data/
    └── questions.json       # Banco de preguntas (alternativa a embebido)
```

### 5.2 Flujo de pantallas (Paquete Base)

```
[Bienvenida] → [Pregunta 1] → [Feedback] → [Pregunta 2] → ... → [Pregunta 10] → [Resultado] → [Bienvenida]
     │                                                                                              ▲
     └──────────────────────── Screensaver (2 min idle) ────────────────────────────────────────────┘
```

Cada "pantalla" es un cambio de estado en el DOM — **no hay navegación de páginas** (SPA). Esto evita problemas con el historial del navegador y el botón back.

### 5.3 Modelo de datos — Preguntas

```javascript
{
    "id": 1,
    "pregunta": "¿Cuál es el componente principal del cemento?",
    "opciones": [
        "Arena",
        "Clinker",
        "Grava",
        "Agua"
    ],
    "respuesta_correcta": 1,  // índice 0-based
    "categoria": "cemento"     // para posible filtrado futuro
}
```

El banco completo debe tener 20-30 preguntas. La app selecciona 10 al azar por partida para que no se repita la experiencia si alguien juega dos veces.

### 5.4 Almacenamiento offline (IndexedDB)

```javascript
// Esquema de la base de datos local
const DB_NAME = 'trivia_progresol';
const DB_VERSION = 1;

// Store: partidas
{
    id: auto,
    timestamp: "2026-04-23T14:30:00",
    puntaje: 7,          // respuestas correctas de 10
    total_preguntas: 10,
    duracion_segundos: 85
}

// Store: registros (si se activa módulo registro)
{
    id: auto,
    timestamp: "2026-04-23T14:29:00",
    nombre: "Juan Pérez",
    celular: "987654321",
    correo: "juan@mail.com"
}
```

### 5.5 Exportación CSV

Al finalizar el evento (o cuando el admin lo solicite):

1. El técnico sale del modo kiosco con el PIN de administrador
2. Abre una URL especial: `file:///sdcard/trivia/index.html#admin`
3. La pantalla de admin muestra botones para exportar:
   - `partidas_expo_2026.csv` — todas las partidas jugadas
   - `registros_expo_2026.csv` — todos los registros de visitantes (si aplica)
4. El CSV se descarga al almacenamiento del tótem, de donde se copia por USB

---

## 6. Consideraciones de UX para Pantalla Táctil de 55"

### 6.1 Zona de interacción

La pantalla mide 187 cm de alto. Un adulto promedio (165-170 cm en Perú) tiene rango cómodo de interacción entre ~80 cm y ~160 cm desde el suelo. Los elementos interactivos deben estar en esa zona.

```
┌─────────────────────┐  187 cm
│                     │
│   Branding / Logo   │  160+ cm → solo visual, no interactivo
│                     │
├─────────────────────┤
│                     │
│   ZONA INTERACTIVA  │  80 - 160 cm → botones, opciones, feedback
│                     │
│   (opciones de      │
│    respuesta aquí)  │
│                     │
├─────────────────────┤
│   Puntaje / Barra   │  <80 cm → info secundaria, no requiere tap
│   de progreso       │
└─────────────────────┘
  ├── 72 cm ancho ──┤
```

### 6.2 Tamaño de elementos táctiles

| Elemento | Tamaño mínimo recomendado |
|---|---|
| Botones de respuesta | 60 x 80 px mínimo (idealmente más grandes en 55") |
| Área de tap | 48 x 48 px mínimo absoluto (Google Material guidelines) |
| Texto de pregunta | 32-40 px font-size |
| Texto de opciones | 28-36 px font-size |
| Espaciado entre botones | 20 px mínimo (evitar taps accidentales) |

### 6.3 Feedback visual

- Al tocar una opción: cambio de color inmediato (<100ms) para confirmar que se registró el toque
- Respuesta correcta: fondo verde + ícono check
- Respuesta incorrecta: fondo rojo + ícono X + mostrar respuesta correcta
- Transición entre preguntas: 1.5-2 segundos para que el usuario procese el feedback

### 6.4 Accesibilidad en evento

- Contraste alto (ratio mínimo 4.5:1) — hay mucha luz ambiental en ferias
- Sin texto pequeño — todo legible a 1 metro de distancia
- Sin audio como único canal de feedback (el ruido del evento puede tapar sonidos)
- Reset automático: si nadie toca la pantalla en 2 minutos, volver a bienvenida

---

## 7. Checklist Pre-Evento

### Pruebas en tótem real (antes del 20 de abril)

- [ ] Verificar versión de Android WebView / Chrome en el tótem
- [ ] Instalar y licenciar Fully Kiosk Browser
- [ ] Cargar app en almacenamiento interno
- [ ] Confirmar que la orientación portrait se mantiene fija
- [ ] Probar que no se puede salir del kiosco con ningún gesto
- [ ] Probar que el screensaver/reset funciona tras 2 min de inactividad
- [ ] Verificar que IndexedDB persiste datos entre sesiones del navegador
- [ ] Probar exportación CSV y copia por USB
- [ ] Verificar rendimiento de animaciones CSS (sin lag en transiciones)
- [ ] Probar con toques rápidos y simultáneos (stress test de touch)
- [ ] Confirmar PIN de salida del administrador

### Día de montaje (20-22 de abril)

- [ ] Instalar app final con contenido aprobado por Dinamo
- [ ] Cargar banco de preguntas aprobado
- [ ] Configurar Fully Kiosk Browser con settings definitivos
- [ ] Verificar alimentación eléctrica estable al tótem
- [ ] Hacer 3 partidas completas de prueba
- [ ] Documentar PIN de admin y dejarlo con el equipo del stand

---

## 8. Entregables del Desarrollador

| Entregable | Formato | Deadline |
|---|---|---|
| Prototipo funcional (sin branding) | HTML5 en carpeta | 10 de abril |
| Versión con branding Progresol aplicado | HTML5 en carpeta | 16 de abril |
| Banco de preguntas integrado | JSON embebido | 16 de abril (depende de Dinamo entregar preguntas el 7/04) |
| Pruebas en tótem real | Sesión presencial | 18-19 de abril |
| Versión final para montaje | HTML5 en USB | 20 de abril |

---

## 9. Dependencias Externas

| Dependencia | Responsable | Estado |
|---|---|---|
| Manual de marca Progresol | Dinamo / Unacem | Deadline: 28 de marzo |
| Banco de 20-30 preguntas con respuestas | Dinamo / Unacem | Deadline: 7 de abril |
| Acceso al tótem para pruebas | Peter Marx | Coordinar fecha |
| Licencia Fully Kiosk Browser | Luis (Artemanifiesto) | Costo absorbido (S/400) |
