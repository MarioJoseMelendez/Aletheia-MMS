# TODO — Pending Tasks

> Aletheia — 3D Biological Macromolecule Simulator. This document tracks features that are still pending or incomplete.

## Overview

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | Audio Upload | 🟡 Partial | High |
| 2 | New PDB Upload | 🟡 Partial | High |
| 3 | Databases (D1 / KV / R2) | 🟡 Partial | High |
| 4 | UI/UX Improvements | 🔴 Pending | Medium |

---

## 1. Audio Upload

**Current state:**
- Admin panel has a drag & drop zone for audio (`src/admin/index.html:79`, `src/admin/upload-form.js:1`) and the Worker accepts `audio` via `multipart/form-data` (`worker/src/index.js:178`).
- Display screen can play audio received via `audioFile` + WebSocket `AUDIO_CONTROL` (`src/display/display.js:90`, `src/control/audio-controls.js:1`).
- Storage fallback chain is implemented: `R2 -> memory` (`worker/src/index.js:192`).

**Pending:**
- [ ] Validate audio formats on frontend (`audio/*` accept filter is too permissive). Enforce `mp3`, `ogg`, `wav` with size limit (e.g., 20 MB).
- [ ] Show audio waveform / duration preview in Admin after upload.
- [ ] Persist audio metadata (duration, codec) in D1 alongside molecule row.
- [ ] Handle audio streaming via R2 `Range` requests instead of full file load (`worker/src/index.js:100` currently returns full `Response`).
- [ ] Add audio delete/replace flow in Admin (currently only create).
- [ ] Test autoplay policy across museum browsers (some block `play()` without user gesture — `src/display/display.js:139` already catches error but needs UX fallback).
- [ ] Add Cloudflare R2 lifecycle rule for orphaned audio cleanup.

## 2. New PDB Upload

**Current state:**
- Admin `upload-form.js` sends `POST /api/molecules` with `pdb` file; Worker stores it in `memoryFileStore` + R2 (`worker/src/index.js:189`) and creates DB entry.
- PDB parsing is ECS-based (`src/shared/ecs/molecule-systems.js:1`, `src/shared/molecule-loader.js:1`) with CPK colors and `InstancedMesh` rendering.
- Fallback demo files are served from `public/assets/pdb/` and `https://files.rcsb.org/download/*.pdb` (`vite.config.js:53`, `worker/src/index.js:56`).

**Pending:**
- [ ] Validate PDB file structure on upload (check `ATOM`/`HETATM` records, atom count, reject malformed files).
- [ ] Calculate `atomCount` server-side by parsing PDB (currently hardcoded to `0` in `worker/src/index.js:209`).
- [ ] Add support for `.cif` / `.mol2` in addition to `.pdb` if required.
- [ ] Implement molecule edit/update flow (`PUT /api/molecules/:id`) — currently only `POST` and `GET` exist.
- [ ] Implement molecule delete (`DELETE /api/molecules/:id`) with R2 + D1 + KV cleanup (`src/admin/admin.js:81` currently shows toast only).
- [ ] Add deduplication: prevent uploading same PDB content twice (hash check).
- [ ] Add upload progress tracking for large PDBs (Hemoglobin ~4779 atoms is fine, but larger complexes can be >50k atoms).
- [ ] Sanitize `pdbFile` / `audioFile` filenames to prevent path traversal.

## 3. Databases (D1 / KV / R2)

**Current state:**
- Worker has fault-tolerant fallback: `D1 -> KV -> memory` for molecules (`worker/src/index.js:152`) and `R2 -> memory -> RCSB proxy` for files (`worker/src/index.js:100`).
- `wrangler.toml:1` defines `ALETHEIA_KV`, `ALETHEIA_STORAGE` (R2), and `DB` (D1) bindings + `SYNC_ROOM` Durable Object.

**Pending:**
- [ ] Finalize D1 schema and migrations (currently `CREATE TABLE IF NOT EXISTS` on every request — move to `wrangler d1 migrations apply`).
- [ ] Add indexes on `category`, `createdAt` for listing/sorting.
- [ ] Implement proper KV serialization versioning (handle schema changes when `DEFAULT_DEMO_MOLECULES` updates).
- [ ] Add R2 bucket CORS and public access policy for direct file serving.
- [ ] Configure local vs production `wrangler.toml` environments (`[env.production]` vs `[env.dev]`).
- [ ] Add KV cache invalidation on `POST`/`DELETE` (currently overwrites whole `molecules` key — may race with concurrent writes).
- [ ] Add Durable Object persistence for `SYNC_ROOM` state (currently ephemeral broadcast only).
- [ ] Add backup/export endpoint (`GET /api/export`) for museum offline sync.
- [ ] Document required `wrangler secret` / `vars` for deployment.

## 4. UI/UX Improvements

**Current state:**
- Three independent Vite multi-page apps: `display` (fullscreen, `cursor: none`, `scene.js:18`), `control` (sidebar + preview with `OrbitControls`), `admin` (table + modal).
- Responsive via CSS grid (`index.html:36`) but not fully tested on tablets/projectors.

**Pending:**
- [ ] **Display:** Add idle screensaver / attract mode (currently `auto-rotate.js` is disabled per design decision `README.md:384` — re-evaluate for museum idle time).
- [ ] **Display:** Improve overlay typography and contrast for projector visibility (test on LED wall).
- [ ] **Control:** Add loading skeleton and error states for `molecule-list.js` fetch failures.
- [ ] **Control:** Add visual feedback when WebSocket is disconnected (currently silent fallback).
- [ ] **Control:** Style buttons need active state polish and i18n (recently fixed `Esferas` → `Spheres` in `src/control/index.html:60`).
- [ ] **Admin:** Add confirmation modal styling, pagination, and search/filter for molecule table.
- [ ] **Admin:** Show file size and atom count preview before saving.
- [ ] **Global:** Add dark/light theme toggle and accessibility (keyboard navigation, ARIA labels).
- [ ] **Global:** Add i18n infrastructure if multi-language is needed (code is now fully English).
- [ ] **Build:** Optimize Three.js bundle (currently full `three@0.172` import — consider tree-shaking or `three/addons`).

---

## How to Contribute

1. Pick a task from above.
2. Create a branch: `git checkout -b feat/<task-name>`
3. Implement + test locally (`npm run dev` → `http://localhost:5173/`).
4. Update this file (mark `[x]`).
5. Open a PR against `main`.

---

*Last updated: 2026-09-06 — All source strings and comments are now in English (`lang="en"`, `en-US` locale).*
