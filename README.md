# Aletheia — System Architecture

> **Aletheia**: 3D Biological Macromolecule Simulator for museum exhibits, science fairs, and educational environments.
>
> **License**: LPEd — Free use for museums, education, and government. Commercial use reserved to **Mario José Melendez Vasquez** and **Kahuna Agency**. See [LICENSE.md](./LICENSE.md).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Screen Architecture](#3-screen-architecture)
4. [Data Flow](#4-data-flow)
5. [Data Architecture (ECS + Data-Oriented)](#5-data-architecture-ecs--data-oriented)
6. [Cloudflare Infrastructure](#6-cloudflare-infrastructure)
7. [Design Decisions](#7-design-decisions)
8. [Roadmap / Phases](#8-roadmap--phases)
9. [License](#9-license)

---

## 1. Overview

Aletheia is a **real-time 3D visualization system for biological macromolecules** specifically designed for:

- **Science museums** → Exhibition display (projector/led wall) + control tablet for guides
- **Science fairs** → Interactive booth where visitors explore molecules
- **Classrooms and labs** → Pedagogical tool for biochemistry and molecular biology
- **Government entities** → Public-access educational content

### Guiding Principles

| Principle | Description |
|-----------|-------------|
| **Total resilience** | The system works 100% offline with preloaded demo data. Cloud infrastructure is a plus, not a requirement. |
| **Low operating cost** | Cloudflare Workers (free), R2 (cheap storage), no server to maintain. |
| **Museum UX** | Minimal interface, no visible keyboards, no cursors on the exhibition display. |
| **Pedagogy first** | CPK colors (scientific standard), interchangeable visualization styles. |
| **Display 100% Slave to Control** | The exhibition display has no logic of its own. Every action comes from Control via WebSocket. No auto-rotation, no idle timer. |
| **Open source** | Total transparency for public institutions. |

---

## 2. Tech Stack

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

| Layer | Technology | Justification |
|------|-----------|---------------|
| **Build** | Vite 6 (multi-page) | Ultra-fast build, native HMR, integrated dev proxy |
| **3D** | Three.js r172 | Most mature WebGL 3D engine, huge ecosystem |
| **Backend** | Hono + Cloudflare Workers | Serverless edge computing, minimal cold start, lightweight REST API |
| **WebSocket** | Durable Objects | Real-time broadcast between screens, state persistence |
| **Database** | D1 (SQLite edge) | SQL queries directly at the edge, no external DB latency |
| **KV** | Cloudflare KV | Fast cache for molecule metadata |
| **Storage** | Cloudflare R2 | PDB file and audio storage, S3-compatible |
| **Real-time** | Native WebSocket | No Socket.IO dependencies, direct protocol |

---

## 3. Screen Architecture

### 3.1 Display (`/display`)

**Purpose**: Main exhibition screen. It is 100% slave to Control — no logic of its own, no auto-rotation, no idle. Only renders what Control commands.

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │           CANVAS THREE.JS                  │  │
│  │    (Background #000000, cursor: none)       │  │
│  │                                            │  │
│  │              ○   ○   ○                     │  │
│  │            ○   ◆   ○   ○                   │  │
│  │          ○   ○   ○   ○   ○                 │  │
│  │                                            │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────┐                        │
│  │ Hemoglobin          │  ← Molecule Overlay    │
│  │ Tetrameric protein  │    (bottom-left        │
│  │ responsible for...  │     corner)            │
│  └─────────────────────┘                        │
│                                                 │
│  ┌─────────────────────┐ Loading Screen         │
│  │  ⟳ Loading...       │  (hidden when loaded)  │
│  └─────────────────────┘                        │
└─────────────────────────────────────────────────┘
```

**Events it listens to (all from Control)**:

| Event | Action |
|--------|--------|
| `select-molecule` | Loads PDB and renders molecule |
| `camera-update` | Positions camera exactly like Control's (position + target) |
| `style-change` | Changes visual style (ball-and-stick, spheres, sticks) |
| `audio-control` | Play/Pause/Stop audio |
| `reset-view` | Resets camera to initial position |

### 3.2 Control (`/control`)

**Purpose**: Touch interface for the guide/presenter. It is the brain of the system.

```
┌─────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────────────────┐   │
│ │ ALETHEIA      │ │  Preview                     │   │
│ │ Simulator...  │ │  ┌──────────────────────┐    │   │
│ │               │ │  │   Preview 3D         │    │   │
│ │ 🔍 Search...  │ │  │   (OrbitControls)    │    │   │
│ │               │ │  └──────────────────────┘    │   │
│ │ ┌────────────┐│ │                              │   │
│ │ │Hemoglobin ││ │  Visualization               │   │
│ │ │Proteins   ││ │  [Ball&Stick] [Spheres] [Sticks]│   │
│ │ ├────────────┤│ │  [Reset View]                │   │
│ │ │DNA         ││ │                              │   │
│ │ │Nucleic Acids││ │  Audio                       │   │
│ │ ├────────────┤│ │  ▶ ⏸ ⏹ ━━━━━━━━━━━━         │   │
│ │ │tRNA        ││ │  track_audio.mp3              │   │
│ │ └────────────┘│ │                              │   │
│ └──────────────┘ └──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Events it emits**:

| Event | When |
|--------|--------|
| `select-molecule` | Click on molecule list |
| `camera-update` | Each time OrbitControls detects a change (drag, zoom) |
| `style-change` | Click on style button |
| `audio-control` | Click on Play/Pause/Stop |
| `reset-view` | Click on Reset View button |

### 3.3 Admin (`/admin`)

**Purpose**: Content management panel for curators.

| Field | Type | Required |
|-------|------|-----------|
| Name | Text | Yes |
| Description | Textarea | No |
| Category | Text | No |
| PDB File | Drag & Drop (.pdb) | Yes |
| Audio File | Drag & Drop (*) | No |

**Upload flow**:
1. User fills form + drags files
2. `multipart/form-data` is sent to `POST /api/molecules`
3. Worker stores:
   - Metadata in D1 / KV / memory
   - Files in R2 / memory
4. The molecule appears immediately in the Control list

---

## 4. Data Flow

### 4.1 Real-Time Synchronization (WebSocket)

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

**SyncRoom** (Durable Object): Maintains room state and broadcasts to all connected clients except the sender. The Display is purely a receiver; it never emits camera or control events.

### 4.2 Data Loading (REST API)

```
┌────────┐    GET /api/molecules    ┌──────────┐
│ Control │────────────────────────►│  Worker   │
│ (Admin) │◄─────── JSON ──────────│  (Hono)   │
└────────┘                         └─────┬────┘
                                          │
                               ┌──────────┼──────────┐
                               ▼          ▼          ▼
                             D1 SQL    KV Cache   Mem Store
                            (primary) (secondary) (fallback)
                                          
┌────────┐    GET /api/files/:file    ┌──────────┐
│ Display │──────────────────────────►│  Worker   │
│ Control │◄──────── .pdb text ──────│  (Hono)   │
└────────┘                           └─────┬────┘
                                            │
                               ┌────────────┼────────────┐
                               ▼            ▼            ▼
                             R2 Bucket   Mem Store   RCSB Proxy
                            (primary)  (fallback)  (last resort)
```

---

## 5. Data Architecture (ECS + Data-Oriented)

### 5.1 Motivation

The traditional representation of molecules as Three.js objects (`Mesh`, `Group`, `BufferGeometry`) mixes data with rendering logic. For efficient simulation, we adopt an **ECS (Entity Component System)** approach with storage in contiguous **typed arrays**, inspired by Data-Oriented Design.

### 5.2 ECS Structure

```
┌────────────────────────────────────────────────┐
│                  ECS World                       │
├────────────────────────────────────────────────┤
│  Entities: pool of IDs (numeric indices)        │
│                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ Entity 0 │ Entity 1 │ Entity 2 │ Entity 3 │  │
│  │ (Atom)   │ (Atom)   │ (Atom)   │ (Atom)   │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
│                                                  │
│  Components (Contiguous Typed Arrays):            │
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
│  (Uint16Array * 2 per bond)                     │
└──────────────────────────────────────────────────┘
```

### 5.3 Components

| Component | Type | Description |
|-----------|------|-------------|
| `Position3D` | `Float32Array(n * 3)` | x,y,z coordinates in angstroms |
| `ElementType` | `Uint8Array(n)` | Chemical element type (enum) |
| `VisualColor` | `Float32Array(n * 3)` | r,g,b normalized color [0-1] |
| `VisualRadius` | `Float32Array(n)` | Sphere radius for rendering |
| `BondPairs` | `Uint16Array(m * 2)` | Pairs of bonded atom indices |
| `ActiveFlag` | `Uint8Array(n)` | 0/1 to enable/disable entities |

### 5.4 Systems

| System | Input | Output | Description |
|---------|---------|--------|-------------|
| `PDBParseSystem` | PDB text | Fills Position3D + ElementType + BondPairs | Transforms PDB file into raw ECS data |
| `ColorSystem` | ElementType | Fills VisualColor | Assigns CPK colors per element |
| `StyleSystem` | ElementType + style | Fills VisualRadius | Calculates radii based on visual style (ball-and-stick, spheres, sticks) |
| `RenderSystem` | Position3D + VisualColor + VisualRadius + BondPairs | Three.js InstancedMesh | Builds optimized geometry with instancing |

### 5.5 Benefits of the ECS Approach

| Benefit | Explanation |
|-----------|-------------|
| **Cache locality** | All atom position data is in one contiguous memory block (Float32Array). The CPU leverages L1/L2 cache when iterating. |
| **SIMD-friendly** | Typed arrays can be processed with SIMD instructions for vector operations. |
| **Native instancing** | Three.js `InstancedMesh` is fed directly from matrices calculated from flat arrays. |
| **Cheap serialization** | Sending a Float32Array over WebSocket is trivial: `ws.send(positionBuffer.buffer)`. No JSON, no overhead. |
| **Separation of concerns** | Simulation data (position, element) is separated from presentation data (color, radius). |
| **Efficient mutation** | Changing the visual style only rewrites `VisualRadius` without touching `Position3D`. No objects to rebuild. |

### 5.6 Loading Pipeline

```
PDB Text (raw)
    │
    ▼
PDBParseSystem
    │  → entities 0..N created
    │  → Position3D filled with atomic coordinates
    │  → ElementType filled with chemical symbols
    │  → BondPairs filled with covalent bonds
    ▼
ColorSystem
    │  → VisualColor filled with CPK colors
    │    (H=white, C=gray, O=red, N=blue, S=yellow, P=orange)
    ▼
StyleSystem (according to active style)
    │  → VisualRadius calculated:
    │    ball-and-stick: C=0.4, H=0.3, O=0.35...
    │    spheres: all at 1.5 (large spheres)
    │    sticks: all at 0.2 (thin rods only)
    ▼
RenderSystem
    │  → Iterates Position3D + VisualColor + VisualRadius
    │  → Builds 4x4 transformation matrices
    │  → Feeds Three.js InstancedMesh
    ▼
Three.js Scene
```

---

## 6. Cloudflare Infrastructure

### 6.1 Components

| Resource | Purpose | Fallback Strategy |
|---------|-----------|------------------------|
| **Worker** (Hono) | REST API + WebSocket upgrade | N/A (always available) |
| **D1** | Primary SQL database | If missing → KV → Memory |
| **KV** | Molecule cache | If it fails → Demo data in memory |
| **R2** | File storage | If it fails → Mem store → RCSB proxy |
| **Durable Object** | WS sync room | If unavailable → WS gracefully degrades |

### 6.2 Fallback Strategy

```
Worker Request
    │
    ├── D1 available? ──Yes──► Respond with D1
    │   No
    ├── KV available? ───Yes──► Respond with KV
    │   No
    └── Use local memory ──► Respond with demo data
```

This strategy ensures Aletheia works even if:
- No Cloudflare bindings are configured in local development
- D1 is under maintenance
- KV has a transient error
- R2 is not responding

---

## 7. Design Decisions

### 7.1 Display 100% Slave to Control

**Decision**: The Display has no auto-rotation, no idle timer, and no movement logic of its own. Every camera action (rotation, zoom, reset) comes exclusively from Control via WebSocket.

**Motivation**: The drift that occurred when the Display auto-rotated while Control did not was eliminated, causing the molecule to no longer respond correctly when trying to regain control. Synchronization is now perfect because the Display's camera copies exactly `camera.position` and `controls.target` from Control every frame.

### 7.2 Three.js InstancedMesh Instead of Individual Meshes

**Decision**: Use `InstancedMesh` for atoms and bonds.

**Motivation**: A molecule like Hemoglobin (~5000 atoms) would generate 5000 individual `Mesh` objects. Each Mesh has an overhead of 1 draw call. `InstancedMesh` reduces everything to **2 draw calls** (atoms + bonds).

### 7.3 Camera Position Synchronization Instead of Quaternions

**Decision**: Send `cameraPos + targetPos` instead of inverted quaternions.

**Motivation**: The previous approach sent a quaternion from the Control's camera, inverted it, and applied it to the Display's `moleculeGroup`. This caused drift because the group rotation and the camera are inverse transformations. Now the exact camera position and look-at point are sent, and the Display copies those values directly. The view is identical.

### 7.4 Native WebSocket vs Socket.IO

**Decision**: Native WebSocket with a lightweight wrapper (~120 lines).

**Motivation**: Socket.IO requires its own protocol (long-polling as fallback) which is unnecessary in Cloudflare Workers. The Durable Object handles native WebSocket without intermediaries.

### 7.5 Hidden Cursor on Display

**Decision**: `cursor: none` on the exhibition screen.

**Motivation**: In a museum, the mouse cursor on a projector screen is unaesthetic and confuses visitors.

### 7.6 Multi-page Vite Instead of SPA

**Decision**: Vite multi-page with plain HTML + vanilla JS.

**Motivation**: The 3 screens are independent (they do not navigate between each other). No framework, no unnecessary bundle. Each page loads only what it needs.

### 7.7 Preloaded Demo Data

**Decision**: 3 demo molecules included in the code.

| Name | PDB ID | Atoms | Category |
|--------|--------|--------|-----------|
| Hemoglobin | 1A3N | ~4779 | Proteins |
| DNA (B-DNA) | 1BNA | ~486 | Nucleic Acids |
| tRNA | 1EHZ | ~1653 | Nucleic Acids |

**Demo loading flow**: Vite has RCSB PDB URLs configured in its dev proxy, allowing 100% offline development without a backend.

---

## 8. Roadmap / Phases

| Phase | Status | Description |
|------|--------|-------------|
| **Phase 1** Skeleton | ✅ Complete | Project structure, Vite multi-page, base HTML/CSS/JS |
| **Phase 2** Backend | ✅ Complete | Hono Worker + D1 + R2 + KV + Durable Object |
| **Phase 3** Shared | ✅ Complete | ECS Core, Constants, MoleculeLoader, WebSocket Client |
| **Phase 4** Display | ✅ Complete | 3D scene slave to Control, loading screen, overlay |
| **Phase 5** Control | ✅ Complete | Molecule list, 3D preview, style and audio controls |
| **Phase 6** Admin | ✅ Complete | Molecule CRUD, PDB/audio upload, Drag & Drop |
| **Phase 7** Polish | 🔄 In progress | ECS optimization, rendering improvements, tests |

---

## 9. License

LPEd — Aletheia Public Educational License.

**Free use** for museums, educational institutions, science fairs, government entities, and non-profit organizations for educational purposes. The software may not be sold as a standalone product, but may be included in exhibitions that charge admission.

**Commercial use** strictly reserved to **Mario José Melendez Vasquez** (owner), **Kahuna Agency** and third parties with an explicit license.

See the file [LICENSE.md](./LICENSE.md) for the full text.
