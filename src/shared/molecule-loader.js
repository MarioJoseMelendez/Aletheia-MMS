// ====================================================================
// ====================================================================
// {1} MOLECULE LOADER (ECS-BASED)
// ====================================================================
// Internally uses the ECS pipeline (typed arrays + systems)
// instead of scattered Three.js objects. Exposes the same public API
// to display.js and controls-panel.js for compatibility.
// ====================================================================

import { ECSMoleculeManager } from './ecs/ecs-molecule-manager.js';

class MoleculeLoader {
  constructor() {
    this.manager = new ECSMoleculeManager();
  }

  // ====================================================================
  // {2} LOAD PDB (FETCH → RAW TEXT)
  // ====================================================================
  async loadPDB(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error cargando PDB: ${response.status} ${response.statusText}`);
    const text = await response.text();
    return text;
  }

  // ====================================================================
  // {3} BUILD THREE.JS GROUP (PDB TEXT → ECS → INSTANCED MESH)
  // ====================================================================
  buildMolecule(pdbText, style = 'ball-and-stick') {
    return this.manager.buildFromPDB(pdbText, style);
  }

  // ====================================================================
  // {4} CHANGE STYLE WITHOUT REPARSING (uses already loaded ECS data)
  // ====================================================================
  rebuildStyle(style) {
    return this.manager.rebuildStyle(style);
  }

  // ====================================================================
  // {5} METADATA ACCESS
  // ====================================================================
  getAtomCount() {
    return this.manager.getAtomCount();
  }

  getRawPositions() {
    return this.manager.getRawPositions();
  }
}

export const moleculeLoader = new MoleculeLoader();