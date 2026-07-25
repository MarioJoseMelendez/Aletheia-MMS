# Aletheia — Arquitectura del Sistema

> **Aletheia**: Simulador de Macromoléculas Biológicas en 3D para exhibiciones museográficas, ferias científicas y entornos educativos.
>
> **Licencia**: LPEd — Uso libre para museos, educación y gobierno. Uso comercial reservado a **Mario José Melendez Vasquez** y **Kahuna Agency**. Ver [LICENSE.md](./LICENSE.md).

---

## Índice

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura de Pantallas](#3-arquitectura-de-pantallas)
4. [Flujo de Datos](#4-flujo-de-datos)
5. [Arquitectura de Datos (ECS + Data-Oriented)](#5-arquitectura-de-datos-ecs--data-oriented)
6. [Infraestructura Cloudflare](#6-infraestructura-cloudflare)
7. [Decisiones de Diseño](#7-decisiones-de-diseño)
8. [Roadmap / Fases](#8-roadmap--fases)
9. [Licencia](#9-licencia)

---

## 1. Visión General

Aletheia es un sistema de **visualización 3D en tiempo real de macromoléculas biológicas** diseñado específicamente para:

- **Museos de ciencia** → Pantalla de exhibición (proyector/led wall) + tablet de control para guías
- **Ferias científicas** → Stand interactivo donde visitantes exploran moléculas
- **Aulas y laboratorios** → Herramienta pedagógica para bioquímica y biología molecular
- **Entidades gubernamentales** → Contenido educativo de acceso público

### Principios Rectores

| Principio | Descripción |
|-----------|-------------|
| **Resiliencia total** | El sistema funciona 100% offline con datos demo precargados. La infraestructura cloud es un plus, no un requisito. |
| **Bajo costo operativo** | Cloudflare Workers (gratis), R2 (almacenamiento barato), sin servidor que mantener. |
| **UX museográfica** | Interfaz mínima, sin teclados visibles, sin cursores en la pantalla de exhibición. |
| **Pedagogía primero** | Colores CPK (estándar científico), estilos de visualización intercambiables. |
| **Display 100% esclavo** | La pantalla de exhibición no tiene lógica propia. Toda acción viene del Control vía WebSocket. Sin auto-rotación, sin idle timer. |
| **Código abierto** | Transparencia total para instituciones públicas. |

---

## 2. Stack Tecnológico

```
┌────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite)                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │  Display   │  │  Control   │  │   Admin   │              │
│  │   (3D)     │  │(Interact.) │  │   (CRUD)  │              │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘              │
│        └───────────────┼──────────────┘                    │
│                        ▼                                   │
│              ┌─────────────────┐                           │
│              │   Shared (ECS)   │                           │
│              │   Constants, WS  │                           │
│              └────────┬────────┘                           │
├───────────────────────┼────────────────────────────────────┤
│                 Proxy /api /ws                             │
├───────────────────────┼────────────────────────────────────┤
│                   BACKEND (Worker)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐     │
│  │ Hono API │  │  Durable  │  │  Cloudflare Infra    │     │
│  │  REST    │  │  Object   │  │  D1 · KV · R2        │     │
│  └────┬─────┘  └────┬─────┘  └──────────────────────┘     │
│       │              │                                     │
│       ▼              ▼                                     │
│  ┌──────────┐  ┌──────────┐                               │
│  │ Mem Store│  │ WebSocket│                               │
│  │ Fallback │  │  Sync    │                               │
│  └──────────┘  └──────────┘                               │
└────────────────────────────────────────────────────────────┘
```

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Build** | Vite 6 (multi-page) | Build ultra-rápido, HMR nativo, proxy dev integrado |
| **3D** | Three.js r172 | Motor 3D WebGL más maduro, ecosistema enorme |
| **Backend** | Hono + Cloudflare Workers | Edge computing sin servidor, cold start mínimo, API REST liviana |
| **WebSocket** | Durable Objects | Broadcast en tiempo real entre pantallas, persistencia de estado |
| **Database** | D1 (SQLite edge) | Consultas SQL directamente en el edge, sin latencia de DB externa |
| **KV** | Cloudflare KV | Cache rápido de metadatos de moléculas |
| **Storage** | Cloudflare R2 | Almacenamiento de archivos PDB y audio, compatible con S3 |
| **Tiempo real** | WebSocket nativo | Sin dependencias de Socket.IO, protocolo directo |

---

## 3. Arquitectura de Pantallas

### 3.1 Display (`/display`)

**Propósito**: Pantalla principal de exhibición. Es 100% esclava del Control — no tiene lógica propia, no auto-rota, no tiene idle. Solo renderiza lo que el Control le ordena.

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │           CANVAS THREE.JS                  │  │
│  │    (Fondo #000000, cursor: none)           │  │
│  │                                            │  │
│  │              ○   ○   ○                     │  │
│  │            ○   ◆   ○   ○                   │  │
│  │          ○   ○   ○   ○   ○                 │  │
│  │                                            │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────┐                        │
│  │ Hemoglobina         │  ← Molecule Overlay    │
│  │ Proteína tetramérica│    (esquina inferior   │
│  │ encargada del...    │     izquierda)         │
│  └─────────────────────┘                        │
│                                                 │
│  ┌─────────────────────┐ Loading Screen         │
│  │  ⟳ Cargando...      │  (se oculta al cargar) │
│  └─────────────────────┘                        │
└─────────────────────────────────────────────────┘
```

**Eventos que escucha (todos del Control)**:

| Evento | Acción |
|--------|--------|
| `select-molecule` | Carga PDB y renderiza molécula |
| `camera-update` | Posiciona cámara exactamente como la del Control (position + target) |
| `style-change` | Cambia estilo visual (ball-and-stick, spheres, sticks) |
| `audio-control` | Play/Pause/Stop del audio |
| `reset-view` | Restablece cámara a posición inicial |

### 3.2 Control (`/control`)

**Propósito**: Interfaz táctil para el guía/presentador. Es el cerebro del sistema.

```
┌─────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────────────────┐   │
│ │ ALETHEIA      │ │  Vista Previa                │   │
│ │ Simulador...  │ │  ┌──────────────────────┐    │   │
│ │               │ │  │   Preview 3D         │    │   │
│ │ 🔍 Buscar...  │ │  │   (OrbitControls)    │    │   │
│ │               │ │  └──────────────────────┘    │   │
│ │ ┌────────────┐│ │                              │   │
│ │ │Hemoglobina ││ │  Visualización               │   │
│ │ │Proteínas   ││ │  [Ball&Stick] [Esferas] [Sticks]│   │
│ │ ├────────────┤│ │  [Resetear Vista]             │   │
│ │ │ADN         ││ │                              │   │
│ │ │Ác. Nucleicos││ │  Audio                       │   │
│ │ ├────────────┤│ │  ▶ ⏸ ⏹ ━━━━━━━━━━━━         │   │
│ │ │tRNA        ││ │  pista_audio.mp3              │   │
│ │ └────────────┘│ │                              │   │
│ └──────────────┘ └──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Eventos que emite**:

| Evento | Cuándo |
|--------|--------|
| `select-molecule` | Click en lista de moléculas |
| `camera-update` | Cada vez que OrbitControls detecta cambio (arrastre, zoom) |
| `style-change` | Click en botón de estilo |
| `audio-control` | Click en Play/Pause/Stop |
| `reset-view` | Click en botón Resetear Vista |

### 3.3 Admin (`/admin`)

**Propósito**: Panel de gestión de contenido para curadores.

| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombre | Texto | Sí |
| Descripción | Textarea | No |
| Categoría | Texto | No |
| Archivo PDB | Drag & Drop (.pdb) | Sí |
| Archivo Audio | Drag & Drop (*) | No |

**Flujo de subida**:
1. Usuario llena formulario + arrastra archivos
2. Se envía `multipart/form-data` a `POST /api/molecules`
3. Worker almacena:
   - Metadatos en D1 / KV / memoria
   - Archivos en R2 / memoria
4. La molécula aparece inmediatamente en la lista de Control

---

## 4. Flujo de Datos

### 4.1 Sincronización en Tiempo Real (WebSocket)

```
┌─────────┐         ┌──────────────┐         ┌─────────┐
│ Control │         │ Durable Obj  │         │ Display │
│  (WS)   │         │  SyncRoom    │         │  (WS)   │
└────┬────┘         └──────┬───────┘         └────┬────┘
     │                     │                      │
     │  select-molecule    │                      │
     │────────────────────►│                      │
     │                     │  select-molecule     │
     │                     │─────────────────────►│
     │                     │                      │
     │  camera-update      │                      │
     │  {pos, target}      │                      │
     │────────────────────►│                      │
     │                     │  camera-update       │
     │                     │─────────────────────►│
     │                     │                      │
     │  style-change       │                      │
     │────────────────────►│                      │
     │                     │  style-change        │
     │                     │─────────────────────►│
     │                     │                      │
     │  audio-control      │                      │
     │────────────────────►│                      │
     │                     │  audio-control       │
     │                     │─────────────────────►│
```

**SyncRoom** (Durable Object): Mantiene el estado de la sala y hace broadcast a todos los clientes conectados excepto al emisor. El Display es puramente receptor; nunca emite eventos de cámara o control.

### 4.2 Carga de Datos (API REST)

```
┌────────┐    GET /api/molecules    ┌──────────┐
│ Control │────────────────────────►│  Worker   │
│ (Admin) │◄─────── JSON ──────────│  (Hono)   │
└────────┘                         └─────┬────┘
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                            D1 SQL    KV Cache   Mem Store
                           (primario) (secundario) (fallback)
                                         
┌────────┐    GET /api/files/:file    ┌──────────┐
│ Display │──────────────────────────►│  Worker   │
│ Control │◄──────── .pdb text ──────│  (Hono)   │
└────────┘                           └─────┬────┘
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                            R2 Bucket   Mem Store   RCSB Proxy
                           (primario)  (fallback)  (último recurso)
```

---

## 5. Arquitectura de Datos (ECS + Data-Oriented)

### 5.1 Motivación

La representación tradicional de moléculas como objetos Three.js (`Mesh`, `Group`, `BufferGeometry`) mezcla datos con lógica de renderizado. Para una simulación eficiente, adoptamos un enfoque **ECS (Entity Component System)** con almacenamiento en **typed arrays** contiguos, inspirado en la programación orientada a datos (Data-Oriented Design).

### 5.2 Estructura ECS

```
┌────────────────────────────────────────────────┐
│                  ECS World                       │
├────────────────────────────────────────────────┤
│  Entities: pool de IDs (índices numéricos)      │
│                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ Entity 0 │ Entity 1 │ Entity 2 │ Entity 3 │  │
│  │ (Átomo)  │ (Átomo)  │ (Átomo)  │ (Átomo)  │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
│                                                  │
│  Componentes (Typed Arrays contiguos):            │
│                                                  │
│  Position3D  │ x0 y0 z0 │ x1 y1 z1 │ x2 y2 z2 │  │
│  (Float32Array * 3)                              │
│                                                  │
│  ElementType │ H │ C │ O │ N │ S │ P │ ...     │  │
│  (Uint8Array)                                     │
│                                                  │
│  VisualColor │ r0 g0 b0 │ r1 g1 b1 │ r2 g2 b2 │  │
│  (Float32Array * 3)                              │
│                                                  │
│  VisualRadius │ 1.2 │ 0.8 │ 0.6 │ 1.0 │ ...    │  │
│  (Float32Array)                                   │
│                                                  │
│  BondPairs   │ a0b0 a1b1 │ a2b2 a3b3 │ ...     │  │
│  (Uint16Array * 2 por enlace)                    │
└──────────────────────────────────────────────────┘
```

### 5.3 Componentes

| Componente | Tipo | Descripción |
|-----------|------|-------------|
| `Position3D` | `Float32Array(n * 3)` | Coordenadas x,y,z en angstroms |
| `ElementType` | `Uint8Array(n)` | Tipo de elemento químico (enum) |
| `VisualColor` | `Float32Array(n * 3)` | Color r,g,b normalizado [0-1] |
| `VisualRadius` | `Float32Array(n)` | Radio de esfera para render |
| `BondPairs` | `Uint16Array(m * 2)` | Pares de índices de átomos enlazados |
| `ActiveFlag` | `Uint8Array(n)` | 0/1 para habilitar/deshabilitar entidades |

### 5.4 Sistemas

| Sistema | Entrada | Salida | Descripción |
|---------|---------|--------|-------------|
| `PDBParseSystem` | Texto PDB | Llena Position3D + ElementType + BondPairs | Transforma el archivo PDB en datos ECS crudos |
| `ColorSystem` | ElementType | Llena VisualColor | Asigna colores CPK según elemento |
| `StyleSystem` | ElementType + estilo | Llena VisualRadius | Calcula radios según estilo visual (ball-and-stick, spheres, sticks) |
| `RenderSystem` | Position3D + VisualColor + VisualRadius + BondPairs | InstancedMesh Three.js | Construye la geometría optimizada con instancing |

### 5.5 Beneficios del Enfoque ECS

| Beneficio | Explicación |
|-----------|-------------|
| **Cache locality** | Los datos de posición de todos los átomos están en un bloque contiguo de memoria (Float32Array). La CPU aprovecha el caché L1/L2 al iterar. |
| **SIMD-friendly** | Los typed arrays son procesables con instrucciones SIMD para operaciones vectoriales. |
| **Instancing nativo** | Three.js `InstancedMesh` se alimenta directamente de matrices calculadas a partir de arrays planos. |
| **Serialización barata** | Enviar un Float32Array por WebSocket es trivial: `ws.send(positionBuffer.buffer)`. Sin JSON, sin overhead. |
| **Separación concerns** | Los datos de simulación (posición, elemento) están separados de los datos de presentación (color, radio). |
| **Mutable eficiente** | Cambiar el estilo visual solo reescribe `VisualRadius` sin tocar `Position3D`. No hay objetos que reconstruir. |

### 5.6 Pipeline de Carga

```
PDB Text (raw)
    │
    ▼
PDBParseSystem
    │  → entities 0..N creadas
    │  → Position3D llenado con coordenadas atómicas
    │  → ElementType llenado con símbolos químicos
    │  → BondPairs llenado con enlaces covalentes
    ▼
ColorSystem
    │  → VisualColor llenado con colores CPK
    │    (H=blanco, C=gris, O=rojo, N=azul, S=amarillo, P=naranja)
    ▼
StyleSystem (según estilo activo)
    │  → VisualRadius calculado:
    │    ball-and-stick: C=0.4, H=0.3, O=0.35...
    │    spheres: todos a 1.5 (esferas grandes)
    │    sticks: todos a 0.2 (solo varillas delgadas)
    ▼
RenderSystem
    │  → Itera Position3D + VisualColor + VisualRadius
    │  → Construye matrices de transformación 4x4
    │  → Alimenta InstancedMesh de Three.js
    ▼
Three.js Scene
```

---

## 6. Infraestructura Cloudflare

### 6.1 Componentes

| Recurso | Propósito | Estrategia de Fallback |
|---------|-----------|------------------------|
| **Worker** (Hono) | API REST + WebSocket upgrade | N/A (siempre disponible) |
| **D1** | Base de datos SQL primaria | Si no existe → KV → Memoria |
| **KV** | Cache de moléculas | Si falla → Datos demo en memoria |
| **R2** | Almacenamiento de archivos | Si falla → Mem store → RCSB proxy |
| **Durable Object** | Sala de sincronización WS | Si no disponible → WS falla graceful |

### 6.2 Estrategia de Fallback

```
Worker Request
    │
    ├── D1 disponible? ──Sí──► Responder con D1
    │   No
    ├── KV disponible? ───Sí──► Responder con KV
    │   No
    └── Usar memoria local ──► Responder con datos demo
```

Esta estrategia garantiza que Aletheia funcione incluso si:
- No hay bindings de Cloudflare configurados en desarrollo local
- D1 está en mantenimiento
- KV tiene un error transitorio
- R2 no responde

---

## 7. Decisiones de Diseño

### 7.1 Display 100% Esclavo del Control

**Decisión**: El Display no tiene auto-rotación, ni idle timer, ni lógica de movimiento propia. Toda acción de cámara (rotación, zoom, reset) viene exclusivamente del Control vía WebSocket.

**Motivación**: Se eliminó el desfase que ocurría cuando el Display auto-rotaba mientras el Control no, causando que al intentar retomar el control la molécula ya no respondiera correctamente. La sincronización ahora es perfecta porque la cámara del Display copia exactamente `camera.position` y `controls.target` del Control en cada frame.

### 7.2 Three.js con InstancedMesh en lugar de Mesh individual

**Decisión**: Usar `InstancedMesh` para átomos y enlaces.

**Motivación**: Una molécula como la Hemoglobina (~5000 átomos) generaría 5000 objetos `Mesh` individuales. Cada Mesh tiene overhead de 1 draw call. `InstancedMesh` reduce todo a **2 draw calls** (átomos + enlaces).

### 7.3 Sincronización por posición de cámara en lugar de quaternions

**Decisión**: Enviar `cameraPos + targetPos` en lugar de quaternions invertidos.

**Motivación**: El enfoque anterior enviaba un quaternion de la cámara del Control, lo invertía, y lo aplicaba al `moleculeGroup` del Display. Esto causaba desfases porque la rotación del grupo y la cámara son transformaciones inversas. Ahora se envía la posición exacta de la cámara y el punto al que mira, y el Display copia esos valores directamente. La vista es idéntica.

### 7.4 WebSocket nativo vs Socket.IO

**Decisión**: WebSocket nativo con wrapper ligero (~120 líneas).

**Motivación**: Socket.IO requiere su protocolo propio (long-polling como fallback) que no es necesario en Cloudflare Workers. El Durable Object maneja WebSocket nativo sin intermediarios.

### 7.5 Cursor oculto en Display

**Decisión**: `cursor: none` en la pantalla de exhibición.

**Motivación**: En un museo, el cursor del mouse en una pantalla de proyector es antiestético y confunde a los visitantes.

### 7.6 Multi-page Vite en lugar de SPA

**Decisión**: Vite multi-page con HTML plano + JS vanilla.

**Motivación**: Las 3 pantallas son independientes (no navegan entre sí). Sin framework, sin bundle innecesario. Cada página carga solo lo que necesita.

### 7.7 Datos Demo Precargados

**Decisión**: 3 moléculas demo incluidas en el código.

| Nombre | PDB ID | Átomos | Categoría |
|--------|--------|--------|-----------|
| Hemoglobina | 1A3N | ~4779 | Proteínas |
| ADN (B-DNA) | 1BNA | ~486 | Ácidos Nucleicos |
| tRNA | 1EHZ | ~1653 | Ácidos Nucleicos |

**Flujo de carga demo**: Vite tiene URLs de RCSB PDB configuradas en su proxy de desarrollo, permitiendo desarrollo 100% offline sin backend.

---

## 8. Roadmap / Fases

| Fase | Estado | Descripción |
|------|--------|-------------|
| **Fase 1** Skeleton | ✅ Completa | Estructura del proyecto, Vite multi-page, HTML/CSS/JS base |
| **Fase 2** Backend | ✅ Completa | Worker Hono + D1 + R2 + KV + Durable Object |
| **Fase 3** Shared | ✅ Completa | ECS Core, Constants, MoleculeLoader, WebSocket Client |
| **Fase 4** Display | ✅ Completa | Escena 3D esclava del Control, loading screen, overlay |
| **Fase 5** Control | ✅ Completa | Lista de moléculas, preview 3D, controles de estilo y audio |
| **Fase 6** Admin | ✅ Completa | CRUD de moléculas, upload de PDB/audio, Drag & Drop |
| **Fase 7** Polish | 🔄 En progreso | ECS optimization, mejoras de rendering, tests |

---

## 9. Licencia

LPEd — Licencia Pública Educativa Aletheia.

**Uso libre** para museos, instituciones educativas, ferias científicas, entidades gubernamentales y organizaciones sin fines de lucro con fines educativos. El software no puede cobrarse como producto independiente, pero sí puede incluirse en exhibiciones que cobren entrada.

**Uso comercial** estrictamente reservado a **Mario José Melendez Vasquez** (titular), **Kahuna Agency** y terceros con licencia explícita.

Ver el archivo [LICENSE.md](./LICENSE.md) para el texto completo.