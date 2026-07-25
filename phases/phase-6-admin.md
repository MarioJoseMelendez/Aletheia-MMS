# Fase 6 — Panel de Administración

> **Objetivo**: Implementar el panel de admin protegido por ruta simple con contraseña. Permite gestionar macromoléculas: crear nuevas (subir `.pdb` + audio), editar metadata, eliminar. Incluye formulario con drag-and-drop y set demo inicial (Hemoglobina, ADN, ARN).

---

## Reglas de Código

> Todos los comentarios deben seguir esta convención estrictamente:
> - Separadores `=` de **68 caracteres** dentro del comentario
> - Pasos numerados: `{1}`, `{2}`, `{3}`…
> - **Doble línea de `=`** arriba y abajo para títulos/módulos principales
> - **Línea simple de `=`** arriba y abajo para secciones
> - `{N}` inline para comentarios cortos

---

## Prerequisitos

- Fases 1-2 completadas (backend con API REST funcional)

---

## Paso 1 — Proteger la ruta del Admin en el backend

**Archivo**: `server/index.js` — Agregar middleware de autenticación simple.

Agregar lo siguiente **antes** de montar las rutas en el archivo `server/index.js` existente:

```js
// ====================================================================
// {X} PROTECCIÓN DEL ADMIN — RUTA SIMPLE
// ====================================================================
// Middleware que protege la ruta /admin con una contraseña query param.
// Uso: /src/admin/?key=aletheia2026
// Si la key no es correcta, devuelve 401.
//
// NOTA: Esto NO protege la API REST, solo la página del admin.
// Para producción, implementar autenticación real.
// ====================================================================
const ADMIN_KEY = process.env.ADMIN_KEY || 'aletheia2026';

// Este middleware se aplica en Vite dev mediante un plugin personalizado
// o verificando en el frontend. Para simplificar, la verificación se
// hace en el frontend (admin.js) consultando /api/auth/verify.
```

Agregar este endpoint al archivo `server/routes/molecules.js` o crear una ruta nueva:

```js
// ====================================================================
// {22} VERIFICAR CLAVE DE ADMIN
// ====================================================================
router.post('/auth/verify', (req, res) => {
  const ADMIN_KEY = process.env.ADMIN_KEY || 'aletheia2026';
  const { key } = req.body;

  if (key === ADMIN_KEY) {
    res.json({ authorized: true });
  } else {
    res.status(401).json({ authorized: false, error: 'Clave incorrecta' });
  }
});
```

---

## Paso 2 — Implementar `src/admin/admin.css`

**Archivo**: `src/admin/admin.css` (reemplazar placeholder)

Estilos completos del panel admin. Mismo sistema de diseño que la pantalla de control (tema oscuro, glassmorphism).

```css
/* ====================================================================
   ====================================================================
   {1} ADMIN — ESTILOS PRINCIPALES
   ====================================================================
   Panel de administración de Aletheia.
   Mismo sistema de diseño que la pantalla de control.
   ==================================================================== */

/* ====================================================================
   {2} VARIABLES
   ==================================================================== */
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: rgba(18, 18, 30, 0.8);
  --border-color: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);
  --text-primary: #f0f0f0;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.35);
  --accent: #00d4aa;
  --accent-hover: #00e8bb;
  --accent-glow: rgba(0, 212, 170, 0.15);
  --danger: #ff4466;
  --danger-glow: rgba(255, 68, 102, 0.15);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --transition: 0.2s ease;
}

/* ====================================================================
   {3} RESET Y BASE
   ==================================================================== */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}

/* ====================================================================
   {4} LOGIN SCREEN
   ==================================================================== */
#login-screen {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  transition: opacity 0.4s ease, visibility 0.4s ease;
}

#login-screen.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.login-box {
  text-align: center;
  max-width: 360px;
  width: 100%;
  padding: 40px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
}

.login-box h2 {
  font-size: 20px;
  margin-bottom: 8px;
  font-weight: 600;
}

.login-box p {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.login-box input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  outline: none;
  margin-bottom: 16px;
  transition: border-color var(--transition);
}

.login-box input:focus {
  border-color: var(--accent);
}

.login-error {
  color: var(--danger);
  font-size: 12px;
  margin-bottom: 12px;
  min-height: 18px;
}

/* ====================================================================
   {5} HEADER
   ==================================================================== */
#admin-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

#admin-header h1 {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--accent), #7b61ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

#admin-header p {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ====================================================================
   {6} MAIN CONTENT
   ==================================================================== */
#admin-main {
  padding: 24px 32px;
  max-width: 1000px;
}

#admin-main.hidden {
  display: none;
}

/* {7} Toolbar */
.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

/* {8} Botones */
.primary-btn {
  padding: 10px 20px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.primary-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px var(--accent-glow);
}

.secondary-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.danger-btn {
  padding: 6px 14px;
  background: var(--danger-glow);
  color: var(--danger);
  border: 1px solid rgba(255, 68, 102, 0.2);
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}

.danger-btn:hover {
  background: rgba(255, 68, 102, 0.25);
  border-color: var(--danger);
}

.edit-btn {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}

.edit-btn:hover {
  background: var(--accent-glow);
  color: var(--accent);
  border-color: rgba(0, 212, 170, 0.3);
}

/* ====================================================================
   {9} TABLA DE MOLÉCULAS
   ==================================================================== */
.table-container {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  backdrop-filter: blur(8px);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  padding: 14px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
}

tbody td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: var(--text-secondary);
}

tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

tbody tr:last-child td {
  border-bottom: none;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

/* ====================================================================
   {10} MODAL
   ==================================================================== */
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.modal.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  font-size: 18px;
  margin-bottom: 24px;
}

/* {11} Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color var(--transition);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--accent);
}

.form-group textarea {
  resize: vertical;
}

/* {12} Dropzone */
.dropzone {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition);
  position: relative;
}

.dropzone:hover,
.dropzone.dragover {
  border-color: var(--accent);
  background: var(--accent-glow);
}

.dropzone p {
  font-size: 13px;
  color: var(--text-muted);
  pointer-events: none;
}

.dropzone input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file-indicator {
  font-size: 12px;
  color: var(--accent);
  margin-top: 8px;
  min-height: 18px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 28px;
}

/* {13} Upload progress */
.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.3s ease;
}

#upload-status {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

/* ====================================================================
   {14} TOAST NOTIFICATIONS
   ==================================================================== */
#toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 300;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 14px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-primary);
  backdrop-filter: blur(12px);
  animation: toast-in 0.3s ease forwards;
  max-width: 360px;
}

.toast.success {
  border-left: 3px solid var(--accent);
}

.toast.error {
  border-left: 3px solid var(--danger);
}

.toast.removing {
  animation: toast-out 0.3s ease forwards;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes toast-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(40px); }
}
```

---

## Paso 3 — Actualizar `src/admin/index.html`

**Archivo**: `src/admin/index.html` (reemplazar completamente)

Agregar la pantalla de login al HTML existente.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aletheia — Admin</title>
  <meta name="description" content="Aletheia: Panel de administración" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./admin.css" />
</head>
<body>

  <!-- ==================================================================
       ==================================================================
       {1} LOGIN SCREEN
       ==================================================================
       Pantalla de autenticación simple con clave.
       ================================================================== -->
  <div id="login-screen">
    <div class="login-box">
      <h2>🔒 Administración</h2>
      <p>Ingresa la clave de acceso</p>
      <input type="password" id="admin-key-input" placeholder="Clave de acceso" autocomplete="off" />
      <p class="login-error" id="login-error"></p>
      <button class="primary-btn" id="login-btn" style="width: 100%;">Acceder</button>
    </div>
  </div>

  <!-- ==================================================================
       ==================================================================
       {2} HEADER
       ================================================================== -->
  <header id="admin-header" class="hidden">
    <h1>Aletheia — Administración</h1>
    <p>Gestión de macromoléculas</p>
  </header>

  <!-- ==================================================================
       ==================================================================
       {3} CONTENIDO PRINCIPAL
       ================================================================== -->
  <main id="admin-main" class="hidden">

    <!-- {4} Toolbar -->
    <div class="toolbar">
      <button id="add-molecule-btn" class="primary-btn">+ Nueva Molécula</button>
    </div>

    <!-- {5} Tabla de moléculas -->
    <div class="table-container">
      <table id="molecules-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Archivo PDB</th>
            <th>Audio</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="molecules-tbody"></tbody>
      </table>
    </div>

    <!-- {6} Modal de creación/edición -->
    <div id="molecule-modal" class="modal hidden">
      <div class="modal-backdrop" id="modal-backdrop"></div>
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
            <input type="text" id="mol-category" placeholder="Ej: Proteínas, Ácidos Nucleicos" />
          </div>
          <div class="form-group">
            <label>Archivo PDB</label>
            <div id="pdb-dropzone" class="dropzone">
              <p>Arrastra tu .pdb aquí o haz click</p>
              <input type="file" id="mol-pdb" accept=".pdb" />
            </div>
            <p id="pdb-filename" class="file-indicator"></p>
          </div>
          <div class="form-group">
            <label>Archivo de Audio</label>
            <div id="audio-dropzone" class="dropzone">
              <p>Arrastra tu audio aquí o haz click</p>
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

  <!-- {7} Toast notifications -->
  <div id="toast-container"></div>

  <script type="module" src="./admin.js"></script>

</body>
</html>
```

---

## Paso 4 — Implementar `src/admin/upload-form.js`

**Archivo**: `src/admin/upload-form.js`

Módulo que gestiona el formulario de upload con drag-and-drop y las dropzones.

```js
// ====================================================================
// ====================================================================
// {1} UPLOAD FORM — FORMULARIO DE SUBIDA
// ====================================================================
// Gestiona el formulario modal para crear/editar moléculas.
// Incluye drag-and-drop para .pdb y audio.
// ====================================================================

import { API_BASE_URL } from '@shared/constants.js';

// {2} Estado
let editingId = null;
let pdbFile = null;
let audioFile = null;

// ====================================================================
// {3} INICIALIZAR
// ====================================================================
// @param {Function} onSaveSuccess - Callback después de guardar con éxito
// ====================================================================
export function initUploadForm(onSaveSuccess) {

  // {4} Setup dropzones
  setupDropzone('pdb-dropzone', 'mol-pdb', 'pdb-filename', (file) => {
    pdbFile = file;
  });

  setupDropzone('audio-dropzone', 'mol-audio', 'audio-filename', (file) => {
    audioFile = file;
  });

  // {5} Form submit
  const form = document.getElementById('molecule-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSubmit(onSaveSuccess);
    });
  }

  // {6} Cancel button
  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  // {7} Backdrop click
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }
}

// ====================================================================
// {8} SETUP DROPZONE
// ====================================================================
function setupDropzone(dropzoneId, inputId, indicatorId, onFile) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  const indicator = document.getElementById(indicatorId);

  if (!dropzone || !input) return;

  // {9} Drag events
  ['dragenter', 'dragover'].forEach(event => {
    dropzone.addEventListener(event, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(event => {
    dropzone.addEventListener(event, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  // {10} Drop
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) {
      onFile(file);
      if (indicator) indicator.textContent = `📎 ${file.name}`;
    }
  });

  // {11} Input change
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      onFile(file);
      if (indicator) indicator.textContent = `📎 ${file.name}`;
    }
  });
}

// ====================================================================
// {12} ABRIR MODAL — CREAR
// ====================================================================
export function openCreateModal() {
  editingId = null;
  pdbFile = null;
  audioFile = null;

  document.getElementById('modal-title').textContent = 'Nueva Molécula';
  document.getElementById('mol-name').value = '';
  document.getElementById('mol-description').value = '';
  document.getElementById('mol-category').value = '';
  document.getElementById('pdb-filename').textContent = '';
  document.getElementById('audio-filename').textContent = '';
  document.getElementById('mol-pdb').value = '';
  document.getElementById('mol-audio').value = '';

  showUploadUI(false);
  document.getElementById('molecule-modal').classList.remove('hidden');
}

// ====================================================================
// {13} ABRIR MODAL — EDITAR
// ====================================================================
export function openEditModal(molecule) {
  editingId = molecule.id;
  pdbFile = null;
  audioFile = null;

  document.getElementById('modal-title').textContent = 'Editar Molécula';
  document.getElementById('mol-name').value = molecule.name;
  document.getElementById('mol-description').value = molecule.description || '';
  document.getElementById('mol-category').value = molecule.category || '';
  document.getElementById('pdb-filename').textContent = molecule.pdbFile ? `📎 ${molecule.pdbFile}` : '';
  document.getElementById('audio-filename').textContent = molecule.audioFile ? `📎 ${molecule.audioFile}` : '';

  showUploadUI(false);
  document.getElementById('molecule-modal').classList.remove('hidden');
}

// ====================================================================
// {14} CERRAR MODAL
// ====================================================================
function closeModal() {
  document.getElementById('molecule-modal').classList.add('hidden');
  editingId = null;
  pdbFile = null;
  audioFile = null;
}

// ====================================================================
// {15} HANDLE SUBMIT
// ====================================================================
async function handleSubmit(onSaveSuccess) {
  const name = document.getElementById('mol-name').value.trim();
  const description = document.getElementById('mol-description').value.trim();
  const category = document.getElementById('mol-category').value.trim();

  // {16} Validación
  if (!name) {
    showToast('El nombre es requerido', 'error');
    return;
  }

  if (!editingId && !pdbFile) {
    showToast('El archivo PDB es requerido', 'error');
    return;
  }

  // {17} Construir FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('category', category);

  if (pdbFile) formData.append('pdbFile', pdbFile);
  if (audioFile) formData.append('audioFile', audioFile);

  // {18} Mostrar progreso
  showUploadUI(true);

  try {
    const url = editingId
      ? `${API_BASE_URL}/molecules/${editingId}`
      : `${API_BASE_URL}/molecules`;

    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error desconocido');
    }

    const result = await response.json();

    showToast(
      editingId ? 'Molécula actualizada' : 'Molécula creada',
      'success'
    );

    closeModal();

    // {19} Refrescar tabla
    if (onSaveSuccess) onSaveSuccess();

  } catch (error) {
    console.error('[Admin] Error saving molecule:', error);
    showToast(error.message, 'error');
    showUploadUI(false);
  }
}

// ====================================================================
// {20} UI HELPERS
// ====================================================================
function showUploadUI(show) {
  const progress = document.getElementById('upload-progress');
  const form = document.getElementById('molecule-form');

  if (show) {
    progress?.classList.remove('hidden');
    form?.classList.add('hidden');
  } else {
    progress?.classList.add('hidden');
    form?.classList.remove('hidden');
  }
}

// ====================================================================
// {21} TOAST NOTIFICATIONS
// ====================================================================
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // {22} Auto-remove después de 3 segundos
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

## Paso 5 — Implementar `src/admin/admin.js`

**Archivo**: `src/admin/admin.js` (reemplazar placeholder)

Entry point del panel admin. Maneja login, tabla CRUD, y delegación al formulario de upload.

```js
// ====================================================================
// ====================================================================
// {1} ADMIN — ENTRY POINT PRINCIPAL
// ====================================================================
// Panel de administración de Aletheia.
// - Login con clave simple
// - Tabla CRUD de moléculas
// - Formulario de upload con drag-and-drop
// ====================================================================

import { API_BASE_URL } from '@shared/constants.js';
import { initUploadForm, openCreateModal, openEditModal, showToast } from './upload-form.js';

// ====================================================================
// {2} ESTADO
// ====================================================================
let isAuthorized = false;

// ====================================================================
// {3} INICIALIZACIÓN
// ====================================================================
function init() {
  console.log('[Admin] Initializing...');

  setupLogin();
  setupAddButton();
  initUploadForm(() => loadMolecules());
}

// ====================================================================
// {4} LOGIN
// ====================================================================
function setupLogin() {
  const loginBtn = document.getElementById('login-btn');
  const keyInput = document.getElementById('admin-key-input');
  const errorEl = document.getElementById('login-error');

  // {5} Click en botón
  if (loginBtn) {
    loginBtn.addEventListener('click', () => attemptLogin());
  }

  // {6} Enter en input
  if (keyInput) {
    keyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  async function attemptLogin() {
    const key = keyInput?.value.trim();
    if (!key) {
      if (errorEl) errorEl.textContent = 'Ingresa la clave';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      const result = await response.json();

      if (result.authorized) {
        isAuthorized = true;
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('admin-header')?.classList.remove('hidden');
        document.getElementById('admin-main')?.classList.remove('hidden');
        loadMolecules();
      } else {
        if (errorEl) errorEl.textContent = 'Clave incorrecta';
      }
    } catch (error) {
      console.error('[Admin] Login error:', error);
      if (errorEl) errorEl.textContent = 'Error de conexión';
    }
  }
}

// ====================================================================
// {7} BOTÓN AGREGAR
// ====================================================================
function setupAddButton() {
  const btn = document.getElementById('add-molecule-btn');
  if (btn) {
    btn.addEventListener('click', () => openCreateModal());
  }
}

// ====================================================================
// {8} CARGAR Y RENDERIZAR TABLA
// ====================================================================
async function loadMolecules() {
  try {
    const response = await fetch(`${API_BASE_URL}/molecules`);
    const molecules = await response.json();
    renderTable(molecules);
  } catch (error) {
    console.error('[Admin] Error loading molecules:', error);
    showToast('Error cargando moléculas', 'error');
  }
}

// ====================================================================
// {9} RENDERIZAR TABLA
// ====================================================================
function renderTable(molecules) {
  const tbody = document.getElementById('molecules-tbody');
  if (!tbody) return;

  if (molecules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No hay moléculas registradas. Haz click en "+ Nueva Molécula" para agregar.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = molecules.map(mol => `
    <tr data-id="${mol.id}">
      <td style="color: var(--text-primary); font-weight: 500;">${mol.name}</td>
      <td>${mol.category || '—'}</td>
      <td style="font-family: monospace; font-size: 11px;">${mol.pdbFile}</td>
      <td>${mol.audioFile ? '🔊 Sí' : '—'}</td>
      <td style="font-size: 11px;">${new Date(mol.createdAt).toLocaleDateString('es-MX')}</td>
      <td class="actions-cell">
        <button class="edit-btn" data-action="edit" data-id="${mol.id}">Editar</button>
        <button class="danger-btn" data-action="delete" data-id="${mol.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  // {10} Event delegation para acciones
  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const molecule = molecules.find(m => m.id === id);

      if (action === 'edit' && molecule) {
        openEditModal(molecule);
      } else if (action === 'delete' && molecule) {
        await deleteMolecule(molecule);
      }
    });
  });
}

// ====================================================================
// {11} ELIMINAR MOLÉCULA
// ====================================================================
async function deleteMolecule(molecule) {
  // {12} Confirmación
  const confirmed = confirm(`¿Eliminar "${molecule.name}"?\nEsta acción no se puede deshacer.`);
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/molecules/${molecule.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar');
    }

    showToast('Molécula eliminada', 'success');
    loadMolecules();
  } catch (error) {
    console.error('[Admin] Error deleting:', error);
    showToast(error.message, 'error');
  }
}

// ====================================================================
// {13} ARRANQUE
// ====================================================================
init();
```

---

## Paso 6 — Descargar archivos PDB demo

Descargar los 3 archivos PDB de demo desde RCSB PDB y colocarlos en `server/data/pdb/`. También crear el `molecules.json` inicial.

### Archivos PDB a descargar:

| Molécula | PDB ID | URL de descarga |
|----------|--------|-----------------|
| Hemoglobina | 1A3N | `https://files.rcsb.org/download/1A3N.pdb` |
| ADN (doble hélice) | 1BNA | `https://files.rcsb.org/download/1BNA.pdb` |
| ARN (tRNA) | 1EHZ | `https://files.rcsb.org/download/1EHZ.pdb` |

Ejecutar:
```bash
curl -o server/data/pdb/hemoglobin.pdb https://files.rcsb.org/download/1A3N.pdb
curl -o server/data/pdb/dna.pdb https://files.rcsb.org/download/1BNA.pdb
curl -o server/data/pdb/rna.pdb https://files.rcsb.org/download/1EHZ.pdb
```

### Actualizar `server/data/molecules.json`:

```json
{
  "molecules": [
    {
      "id": "hemoglobin",
      "name": "Hemoglobina",
      "description": "Proteína transportadora de oxígeno presente en los glóbulos rojos. Formada por 4 subunidades (2 alfa y 2 beta) con un grupo hemo que contiene hierro.",
      "category": "Proteínas",
      "pdbFile": "hemoglobin.pdb",
      "audioFile": null,
      "atomCount": 0,
      "createdAt": "2026-07-20T00:00:00Z"
    },
    {
      "id": "dna",
      "name": "ADN (Doble Hélice)",
      "description": "Fragmento de ácido desoxirribonucleico en conformación B. Estructura icónica de doble hélice que almacena la información genética de los seres vivos.",
      "category": "Ácidos Nucleicos",
      "pdbFile": "dna.pdb",
      "audioFile": null,
      "atomCount": 0,
      "createdAt": "2026-07-20T00:00:00Z"
    },
    {
      "id": "rna",
      "name": "ARN de Transferencia (tRNA)",
      "description": "ARN de transferencia de fenilalanina de levadura. Molécula adaptadora que traduce el código genético en proteínas durante la síntesis proteica.",
      "category": "Ácidos Nucleicos",
      "pdbFile": "rna.pdb",
      "audioFile": null,
      "atomCount": 0,
      "createdAt": "2026-07-20T00:00:00Z"
    }
  ]
}
```

> **NOTA**: Los campos `audioFile` son `null` porque no hay audios de demo. El usuario los subirá desde el admin.

---

## Verificación

```bash
# 1. Verificar que los PDB se descargaron
ls -la server/data/pdb/
# Debe mostrar: hemoglobin.pdb, dna.pdb, rna.pdb

# 2. Iniciar todo
npm run dev

# 3. Abrir admin
# http://localhost:5173/src/admin/

# Verificar:
# ✅ Pantalla de login aparece
# ✅ Ingresar "aletheia2026" → accede al panel
# ✅ Tabla muestra las 3 moléculas demo
# ✅ Click en "+ Nueva Molécula" → abre modal
# ✅ Drag-and-drop funciona en las dropzones
# ✅ Crear una molécula → aparece en la tabla
# ✅ Editar una molécula → actualiza en la tabla
# ✅ Eliminar una molécula → desaparece de la tabla
# ✅ Toast notifications aparecen y desaparecen
```

Si todo funciona, la Fase 6 está completa. Proceder a Fase 7.
