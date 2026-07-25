# Fase 7 — Pulido Final

> **Objetivo**: Verificar la integración end-to-end, corregir bugs, optimizar performance, manejar edge cases, y asegurar que todo funciona como sistema completo.

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

- Fases 1-6 completadas
- Backend y frontend funcionando

---

## Paso 1 — Test de integración end-to-end

Ejecutar las siguientes pruebas manuales en orden. Cada una debe pasar antes de proceder a la siguiente.

### Test 1: Arranque limpio
```bash
# Borrar node_modules y reinstalar
rm -rf node_modules
npm install

# Iniciar todo
npm run dev

# Verificar que no hay errores en la consola del servidor
# Verificar que Vite arranca sin warnings
```

### Test 2: Display page
1. Abrir `http://localhost:5173/src/display/`
2. ✅ Fondo negro puro #000000
3. ✅ Loading screen aparece
4. ✅ Primera molécula (hemoglobina) se carga automáticamente
5. ✅ Loading screen desaparece con fade-out
6. ✅ Overlay de molécula aparece con nombre y descripción
7. ✅ Overlay desaparece después de ~5 segundos
8. ✅ Después de 30 segundos sin interacción, la molécula empieza a rotar
9. ✅ El cursor desaparece en modo idle
10. ✅ Si hago click, el idle se cancela y el cursor vuelve

### Test 3: Control page
1. Abrir `http://localhost:5173/src/control/` en otra pestaña
2. ✅ Sidebar muestra las 3 moléculas demo
3. ✅ Búsqueda filtra correctamente
4. ✅ Click en "ADN" → preview muestra ADN
5. ✅ La pantalla de display también cambia a ADN
6. ✅ Rotar la preview → el display rota sincronizado
7. ✅ Cambiar estilo a "Esferas" → cambia en ambas pantallas
8. ✅ Botón "Resetear Vista" → funciona en ambas
9. ✅ Botones de audio se activan/desactivan según si hay audio

### Test 4: Admin page
1. Abrir `http://localhost:5173/src/admin/`
2. ✅ Login con clave incorrecta → error
3. ✅ Login con "aletheia2026" → accede
4. ✅ Tabla muestra las 3 moléculas
5. ✅ Crear nueva molécula con un .pdb → aparece en tabla
6. ✅ La nueva molécula aparece en el control panel (recargar)
7. ✅ Editar molécula → se actualiza
8. ✅ Eliminar molécula → desaparece

### Test 5: Reconexión WebSocket
1. Detener el backend (`Ctrl+C`)
2. ✅ Las pantallas muestran warning en consola
3. Re-iniciar el backend
4. ✅ Las pantallas se reconectan automáticamente
5. ✅ La sincronización sigue funcionando

---

## Paso 2 — Correcciones comunes

### 2.1 — Error de CORS en audio autoplay
Si el navegador bloquea el autoplay del audio, agregar un handler de interacción del usuario:

En `src/display/display.js`, agregar después de crear el `audioElement`:

```js
// {X} Workaround para autoplay policy
// Algunos navegadores requieren interacción del usuario antes de
// permitir reproducir audio. Esto intenta reproducir silenciosamente
// al primer click en la página.
document.addEventListener('click', () => {
  if (audioElement && audioElement.paused && audioElement.src) {
    audioElement.play().catch(() => {});
  }
}, { once: true });
```

### 2.2 — Throttling de eventos WebSocket
Si la rotación se siente laggy en el display, verificar que el throttle en `controls-panel.js` esté configurado correctamente (16ms = ~60fps).

Si aún hay lag, aumentar el throttle:
```js
// Cambiar de 16ms a 33ms (~30fps) si hay problemas de performance
syncThrottleTimer = setTimeout(() => { ... }, 33);
```

### 2.3 — Memory leaks al cambiar moléculas
Verificar que `clearMolecule()` en `scene.js` limpia correctamente:
- ✅ Todas las geometrías se llaman `.dispose()`
- ✅ Todos los materiales se llaman `.dispose()`
- ✅ Los objetos se remueven de la escena

### 2.4 — PDB files grandes
Si un archivo PDB es muy grande (>5MB), el loading puede ser lento. Verificar que:
- ✅ El loading screen muestra progreso correcto
- ✅ No hay timeout en Express (por defecto no debería haber)
- ✅ Multer tiene el límite configurado en 50MB

---

## Paso 3 — Optimizaciones de Performance

### 3.1 — InstancedMesh para átomos
Verificar que `molecule-loader.js` usa `InstancedMesh` correctamente:
- ✅ Un `InstancedMesh` por tipo de elemento (no un mesh por átomo)
- ✅ `instanceMatrix.needsUpdate = true` después de setear matrices

### 3.2 — Limitar pixel ratio
En `scene.js` y `controls-panel.js`, verificar:
```js
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```
Esto evita que pantallas Retina/HiDPI causen problemas de performance.

### 3.3 — Dispose al desconectar
Si la pantalla se cierra, los recursos de Three.js deben limpiarse. Agregar en `display.js`:

```js
// {X} Cleanup al cerrar
window.addEventListener('beforeunload', () => {
  clearMolecule();
  renderer.dispose();
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
  }
});
```

---

## Paso 4 — Manejo de Edge Cases

### 4.1 — Sin moléculas en la base de datos
Si `molecules.json` está vacío:
- Display: mostrar mensaje "No hay moléculas disponibles" y ocultar loading
- Control: sidebar vacío con mensaje
- Admin: tabla vacía con instrucciones

### 4.2 — Archivo PDB corrupto o inválido
Si `PDBLoader` falla al parsear:
- Capturar el error en el catch de `loadPDB()`
- Mostrar mensaje de error en el loading screen
- No crashear la aplicación

### 4.3 — WebSocket desconectado
Si la conexión WebSocket se pierde:
- Los controles del control panel deben seguir funcionando localmente
- La preview 3D sigue operativa
- Socket.IO reintenta la conexión automáticamente

### 4.4 — Display sin control activo
Si la pantalla de display está abierta pero no hay control conectado:
- La molécula por defecto se carga normalmente
- El idle timer funciona
- La auto-rotación funciona

---

## Paso 5 — Verificación Final

Ejecutar este checklist completo:

```
[DISPLAY]
[ ] Fondo negro puro #000000 (no gris, no gradiente)
[ ] Loading screen aparece al cargar molécula
[ ] Loading screen desaparece con fade-out
[ ] Molécula se renderiza centrada
[ ] Overlay de info aparece y desaparece
[ ] Auto-rotación inicia después de 30s idle
[ ] Cursor se oculta en modo idle
[ ] Audio se auto-reproduce al seleccionar molécula
[ ] Recibe y aplica comandos del control vía WebSocket
[ ] Cambio de estilo funciona (spheres, ball-and-stick, sticks)
[ ] Reset view funciona
[ ] Resize de ventana mantiene la proporción

[CONTROL]
[ ] Lista de moléculas se carga desde la API
[ ] Búsqueda/filtro funciona
[ ] Preview 3D muestra la molécula seleccionada
[ ] Mover la preview sincroniza con el display
[ ] Botones de estilo cambian la visualización
[ ] Reset view funciona
[ ] Controles de audio se habilitan/deshabilitan correctamente
[ ] WebSocket se conecta y reconecta

[ADMIN]
[ ] Login screen aparece
[ ] Clave incorrecta muestra error
[ ] Clave correcta da acceso
[ ] Tabla muestra moléculas
[ ] Crear nueva molécula funciona
[ ] Drag-and-drop funciona para PDB y audio
[ ] Editar molécula funciona
[ ] Eliminar molécula funciona con confirmación
[ ] Toast notifications funcionan

[BACKEND]
[ ] Health check responde OK
[ ] CRUD de moléculas funciona
[ ] Upload de archivos funciona
[ ] WebSocket sincroniza control ↔ display
[ ] Archivos estáticos se sirven correctamente
[ ] Eliminación borra archivos del disco

[GENERAL]
[ ] No hay errores en la consola del navegador
[ ] No hay errores en la consola del servidor
[ ] El proyecto arranca limpio con npm run dev
```

---

## ¡Proyecto Completo!

Si todos los checks pasan, el proyecto Aletheia está funcional y listo para demo.

### URLs finales:
- **Display**: `http://localhost:5173/src/display/`
- **Control**: `http://localhost:5173/src/control/`
- **Admin**: `http://localhost:5173/src/admin/` (clave: `aletheia2026`)
