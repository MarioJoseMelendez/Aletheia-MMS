// ====================================================================
// ====================================================================
// {1} CARGADOR DE MOLÉCULAS (ECS-BASED)
// ====================================================================
// Internamente usa el pipeline ECS (typed arrays + sistemas) en
// lugar de objetos Three.js dispersos. Expone la misma API pública
// hacia display.js y controls-panel.js para mantener compatibilidad.
// ====================================================================

import { ECSMoleculeManager } from './ecs/ecs-molecule-manager.js';

class MoleculeLoader {
  constructor() {
    this.manager = new ECSMoleculeManager();
  }

  // ====================================================================
  // {2} CARGAR PDB (FETCH → TEXTO CRUDO)
  // ====================================================================
  async loadPDB(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error cargando PDB: ${response.status} ${response.statusText}`);
    const text = await response.text();
    return text;
  }

  // ====================================================================
  // {3} CONSTRUIR GRUPO THREE.JS (PDB TEXT → ECS → INSTANCED MESH)
  // ====================================================================
  buildMolecule(pdbText, style = 'ball-and-stick') {
    return this.manager.buildFromPDB(pdbText, style);
  }

  // ====================================================================
  // {4} CAMBIAR ESTILO SIN REPARSEAR (usa datos ECS ya cargados)
  // ====================================================================
  rebuildStyle(style) {
    return this.manager.rebuildStyle(style);
  }

  // ====================================================================
  // {5} ACCESO A METADATOS
  // ====================================================================
  getAtomCount() {
    return this.manager.getAtomCount();
  }

  getRawPositions() {
    return this.manager.getRawPositions();
  }
}

export const moleculeLoader = new MoleculeLoader();