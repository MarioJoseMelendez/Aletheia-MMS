# Fase 1 — Esqueleto del Proyecto

> **Objetivo**: Crear la estructura completa del proyecto, instalar dependencias, configurar Vite multi-page, y crear los HTML base de las 3 pantallas. Al finalizar, las 3 páginas deben ser accesibles desde el navegador mostrando un placeholder.

---

## Reglas de Código

> Todos los comentarios deben seguir esta convención estrictamente:
> - Separadores `=` de **68 caracteres** dentro del comentario
> - Pasos numerados: `{1}`, `{2}`, `{3}`…
> - **Doble línea de `=`** arriba y abajo para títulos/módulos principales
> - **Línea simple de `=`** arriba y abajo para secciones
> - `{N}` inline para comentarios cortos
>
> **Ejemplo JS:**
> ```js
> // ====================================================================
> // ====================================================================
> // {1} NOMBRE DEL MÓDULO
> // ====================================================================
> // Descripción.
> // ====================================================================
>
> // ====================================================================
> // {2} SECCIÓN
> // ====================================================================
> // Descripción.
> // ====================================================================
>
> // {3} Comentario inline
> ```
>
> **Ejemplo CSS:**
> ```css
> /* ====================================================================
>    ====================================================================
>    {1} SECCIÓN PRINCIPAL
>    ====================================================================
>    Descripción.
>    ==================================================================== */
> ```
>
> **Ejemplo HTML:**
> ```html
> <!-- ==================================================================
>      ==================================================================
>      {1} SECCIÓN
>      ==================================================================
>      Descripción.
>      ================================================================== -->
> ```

---

## Paso 1 — Crear `package.json`

**Archivo**: `package.json` (raíz del proyecto)

```json
{
  "name": "aletheia",
  "version": "1.0.0",
  "description": "Aletheia — Simulador de Macromoléculas Biológicas",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"node server/index.js\" \"vite\"",
    "dev:server": "node server/index.js",
    "dev:client": "vite",
    "build": "vite build",
    "start": "node server/index.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "socket.io": "^4.8.0",
    "multer": "^1.4.5-lts.2",
    "cors": "^2.8.5",
    "three": "^0.172.0"
  },
  "devDependencies": {
    "vite": "^6.3.0",
    "concurrently": "^9.1.0"
  }
}
```

Después de crear el archivo, ejecutar:
```bash
npm install
```

---

## Paso 2 — Crear `vite.config.js`

**Archivo**: `vite.config.js` (raíz del proyecto)

Este archivo configura Vite como una app multi-page con 3 entry points (display, control, admin), y hace proxy de las peticiones API y WebSocket hacia el backend Express.

```js
// ====================================================================
// ====================================================================
// {1} CONFIGURACIÓN VITE — ALETHEIA
// ====================================================================
// Multi-page app con 3 entry points:
// - display: pantalla de exhibición fullscreen
// - control: pantalla de control interactivo
// - admin: panel de administración
// Proxy de /api y /socket.io hacia el backend Express.
// ====================================================================

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({

  // ====================================================================
  // {2} ENTRY POINTS MULTI-PAGE
  // ====================================================================
  build: {
    rollupOptions: {
      input: {
        display: resolve(__dirname, 'src/display/index.html'),
        control: resolve(__dirname, 'src/control/index.html'),
        admin: resolve(__dirname, 'src/admin/index.html')
      }
    }
  },

  // ====================================================================
  // {3} ALIAS DE IMPORTACIÓN
  // ====================================================================
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared')
    }
  },

  // ====================================================================
  // {4} PROXY HACIA EL BACKEND
  // ====================================================================
  // Redirige /api y /socket.io al servidor Express en :3001
  // ====================================================================
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
});
```

---

## Paso 3 — Crear estructura de directorios

Crear las siguientes carpetas vacías (si no existen aún):

```
server/
server/routes/
server/websocket/
server/data/
server/data/pdb/
server/data/audio/
src/
src/shared/
src/display/
src/control/
src/admin/
public/
public/assets/
public/assets/fonts/
public/assets/icons/
```

---

## Paso 4 — Crear HTML base: Display

**Archivo**: `src/display/index.html`

Esta página es la pantalla de exhibición fullscreen. Fondo negro puro `#000000`. Incluye el loading screen y el molecule overlay como bloques HTML estáticos delimitados con comentarios claros para que el usuario pueda personalizarlos fácilmente sin tocar JS.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aletheia — Exhibición</title>
  <meta name="description" content="Aletheia: Visualización de macromoléculas biológicas en 3D" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./display.css" />
</head>
<body>

  <!-- ==================================================================
       ==================================================================
       {1} CANVAS 3D
       ==================================================================
       Contenedor del canvas de Three.js. Ocupa el 100% del viewport.
       ================================================================== -->
  <div id="canvas-container"></div>

  <!-- ==================================================================
       ==================================================================
       {2} LOADING SCREEN — PERSONALIZABLE
       ==================================================================
       Pantalla de carga. Puedes modificar TODO el HTML y CSS de esta
       sección libremente. El JS solo controla la clase .hidden.
       ================================================================== -->
  <!-- LOADING SCREEN START -->
  <div id="loading-screen">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">Cargando molécula…</p>
      <div class="loading-bar">
        <div class="loading-bar-fill"></div>
      </div>
    </div>
  </div>
  <!-- LOADING SCREEN END -->

  <!-- ==================================================================
       ==================================================================
       {3} MOLECULE OVERLAY — PERSONALIZABLE
       ==================================================================
       Desplegable con info de la molécula actual. Puedes modificar
       TODO el HTML y CSS. El JS solo inyecta texto y controla .hidden.
       ================================================================== -->
  <!-- MOLECULE OVERLAY START -->
  <div id="molecule-overlay" class="hidden">
    <h2 id="molecule-name"></h2>
    <p id="molecule-description"></p>
  </div>
  <!-- MOLECULE OVERLAY END -->

  <!-- ==================================================================
       {4} SCRIPT PRINCIPAL
       ================================================================== -->
  <script type="module" src="./display.js"></script>

</body>
</html>
```

---

## Paso 5 — Crear HTML base: Control

**Archivo**: `src/control/index.html`

Pantalla de control interactivo. Layout con sidebar (lista de moléculas) y área principal (preview 3D + controles).

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aletheia — Control</title>
  <meta name="description" content="Aletheia: Panel de control para simulador de macromoléculas" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./control.css" />
</head>
<body>

  <!-- ==================================================================
       ==================================================================
       {1} LAYOUT PRINCIPAL
       ==================================================================
       Grid de dos columnas: sidebar izquierdo + área principal derecha.
       ================================================================== -->
  <div id="app-layout">

    <!-- ==================================================================
         {2} SIDEBAR — LISTA DE MOLÉCULAS
         ================================================================== -->
    <aside id="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">Aletheia</h1>
        <p class="app-subtitle">Simulador de Macromoléculas</p>
      </div>

      <div class="search-container">
        <input
          type="text"
          id="molecule-search"
          placeholder="Buscar molécula…"
          autocomplete="off"
        />
      </div>

      <ul id="molecule-list"></ul>
    </aside>

    <!-- ==================================================================
         {3} ÁREA PRINCIPAL
         ================================================================== -->
    <main id="main-area">

      <!-- {4} Vista previa 3D -->
      <section id="preview-section">
        <h2 class="section-title">Vista Previa</h2>
        <div id="preview-container"></div>
      </section>

      <!-- {5} Controles de visualización -->
      <section id="controls-section">
        <h2 class="section-title">Visualización</h2>
        <div id="style-buttons">
          <button class="style-btn active" data-style="ball-and-stick">Ball &amp; Stick</button>
          <button class="style-btn" data-style="spheres">Esferas</button>
          <button class="style-btn" data-style="sticks">Sticks</button>
        </div>
        <button id="reset-view-btn" class="action-btn">Resetear Vista</button>
      </section>

      <!-- {6} Controles de audio -->
      <section id="audio-section">
        <h2 class="section-title">Audio</h2>
        <p id="audio-track-name">Sin audio seleccionado</p>
        <div id="audio-controls">
          <button id="audio-play-btn" class="audio-btn" disabled>▶</button>
          <button id="audio-pause-btn" class="audio-btn" disabled>⏸</button>
          <button id="audio-stop-btn" class="audio-btn" disabled>⏹</button>
        </div>
        <div id="audio-progress">
          <div id="audio-progress-fill"></div>
        </div>
      </section>

    </main>
  </div>

  <script type="module" src="./control.js"></script>

</body>
</html>
```

---

## Paso 6 — Crear HTML base: Admin

**Archivo**: `src/admin/index.html`

Panel de administración para gestionar macromoléculas (CRUD + uploads).

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aletheia — Admin</title>
  <meta name="description" content="Aletheia: Panel de administración para macromoléculas" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./admin.css" />
</head>
<body>

  <!-- ==================================================================
       ==================================================================
       {1} HEADER
       ================================================================== -->
  <header id="admin-header">
    <h1>Aletheia — Administración</h1>
    <p>Gestión de macromoléculas</p>
  </header>

  <!-- ==================================================================
       ==================================================================
       {2} CONTENIDO PRINCIPAL
       ================================================================== -->
  <main id="admin-main">

    <!-- {3} Botón para agregar nueva molécula -->
    <div class="toolbar">
      <button id="add-molecule-btn" class="primary-btn">+ Nueva Molécula</button>
    </div>

    <!-- {4} Tabla de moléculas -->
    <div class="table-container">
      <table id="molecules-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Átomos</th>
            <th>Audio</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="molecules-tbody"></tbody>
      </table>
    </div>

    <!-- {5} Modal de creación/edición -->
    <div id="molecule-modal" class="modal hidden">
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <h2 id="modal-title">Nueva Molécula</h2>
        <form id="molecule-form">
          <div class="form-group">
            <label for="mol-name">Nombre</label>
            <input type="text" id="mol-name" required />
          </div>
          <div class="form-group">
            <label for="mol-description">Descripción</label>
            <textarea id="mol-description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="mol-category">Categoría</label>
            <input type="text" id="mol-category" placeholder="Ej: Proteínas, ADN, Lípidos" />
          </div>
          <div class="form-group">
            <label>Archivo PDB</label>
            <div id="pdb-dropzone" class="dropzone">
              <p>Arrastra tu archivo .pdb aquí o haz click para seleccionar</p>
              <input type="file" id="mol-pdb" accept=".pdb" />
            </div>
            <p id="pdb-filename" class="file-indicator"></p>
          </div>
          <div class="form-group">
            <label>Archivo de Audio</label>
            <div id="audio-dropzone" class="dropzone">
              <p>Arrastra tu archivo de audio aquí o haz click para seleccionar</p>
              <input type="file" id="mol-audio" accept="audio/*" />
            </div>
            <p id="audio-filename" class="file-indicator"></p>
          </div>
          <div class="form-actions">
            <button type="button" id="cancel-btn" class="secondary-btn">Cancelar</button>
            <button type="submit" id="save-btn" class="primary-btn">Guardar</button>
          </div>
        </form>
        <div id="upload-progress" class="hidden">
          <div class="progress-bar">
            <div id="upload-progress-fill" class="progress-fill"></div>
          </div>
          <p id="upload-status">Subiendo archivos…</p>
        </div>
      </div>
    </div>

  </main>

  <!-- {6} Toast notifications -->
  <div id="toast-container"></div>

  <script type="module" src="./admin.js"></script>

</body>
</html>
```

---

## Paso 7 — Crear CSS placeholder para cada pantalla

Crea estos 3 archivos CSS con contenido mínimo para que las páginas carguen sin errores. **No implementar estilos completos todavía** — eso se hace en sus fases respectivas.

### `src/display/display.css`
```css
/* ====================================================================
   ====================================================================
   {1} DISPLAY — ESTILOS BASE (PLACEHOLDER)
   ====================================================================
   Estilos mínimos para que la página cargue. Se completará en Fase 4.
   ==================================================================== */

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #000000;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}
```

### `src/control/control.css`
```css
/* ====================================================================
   ====================================================================
   {1} CONTROL — ESTILOS BASE (PLACEHOLDER)
   ====================================================================
   Estilos mínimos para que la página cargue. Se completará en Fase 5.
   ==================================================================== */

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0a0a0f;
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
}
```

### `src/admin/admin.css`
```css
/* ====================================================================
   ====================================================================
   {1} ADMIN — ESTILOS BASE (PLACEHOLDER)
   ====================================================================
   Estilos mínimos para que la página cargue. Se completará en Fase 6.
   ==================================================================== */

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0a0a0f;
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
}
```

---

## Paso 8 — Crear JS placeholder para cada pantalla

Crea estos 3 archivos JS mínimos para evitar errores 404 al cargar los HTML.

### `src/display/display.js`
```js
// ====================================================================
// ====================================================================
// {1} DISPLAY — ENTRY POINT (PLACEHOLDER)
// ====================================================================
// Se implementará en Fase 4.
// ====================================================================

console.log('[Aletheia] Display page loaded');
```

### `src/control/control.js`
```js
// ====================================================================
// ====================================================================
// {1} CONTROL — ENTRY POINT (PLACEHOLDER)
// ====================================================================
// Se implementará en Fase 5.
// ====================================================================

console.log('[Aletheia] Control page loaded');
```

### `src/admin/admin.js`
```js
// ====================================================================
// ====================================================================
// {1} ADMIN — ENTRY POINT (PLACEHOLDER)
// ====================================================================
// Se implementará en Fase 6.
// ====================================================================

console.log('[Aletheia] Admin page loaded');
```

---

## Paso 9 — Crear `server/data/molecules.json` con datos iniciales vacíos

**Archivo**: `server/data/molecules.json`

```json
{
  "molecules": []
}
```

---

## Paso 10 — Crear placeholder del backend

**Archivo**: `server/index.js`

```js
// ====================================================================
// ====================================================================
// {1} ALETHEIA BACKEND — PLACEHOLDER
// ====================================================================
// Se implementará completamente en Fase 2.
// Por ahora solo arranca Express para verificar el setup.
// ====================================================================

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Aletheia' });
});

app.listen(PORT, () => {
  console.log(`[Aletheia] Backend running on http://localhost:${PORT}`);
});
```

---

## Verificación

Después de completar todos los pasos, verifica lo siguiente:

```bash
# 1. Instalar dependencias
npm install

# 2. Verificar que Vite arranca y sirve las 3 páginas
npx vite --open

# Las siguientes URLs deben funcionar:
# http://localhost:5173/src/display/    → Página negra (display)
# http://localhost:5173/src/control/    → Página oscura (control)
# http://localhost:5173/src/admin/      → Página oscura (admin)

# 3. Verificar que el backend arranca
node server/index.js
# Debe imprimir: [Aletheia] Backend running on http://localhost:3001

# 4. Verificar health check
curl http://localhost:3001/api/health
# Debe responder: {"status":"ok","name":"Aletheia"}
```

Si todo funciona, la Fase 1 está completa. Proceder a Fase 2.
