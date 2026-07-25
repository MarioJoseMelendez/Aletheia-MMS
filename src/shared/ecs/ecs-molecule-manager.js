// ====================================================================
// ====================================================================
// {1} ECS MOLECULE MANAGER — ORQUESTADOR DEL PIPELINE ECS
// ====================================================================
// Interfaz unificada que coordina: ECS World → Parse → Color → Style → Render.
// Este módulo reemplaza la lógica anterior de molecule-loader.js
// como la capa de construcción de moléculas basada en ECS.
// ====================================================================

import { ECSWorld, ComponentType } from './ecs-world.js';
import { registerMoleculeComponents } from './molecule-components.js';
import { PDBParseSystem, ColorSystem, StyleSystem, RenderSystem } from './molecule-systems.js';

export class ECSMoleculeManager {
  constructor() {
    this.world = new ECSWorld();
    registerMoleculeComponents(this.world);

    this.parser = new PDBParseSystem();
    this.colorSystem = new ColorSystem();
    this.styleSystem = new StyleSystem('ball-and-stick');
    this.renderSystem = new RenderSystem();

    this.entityRange = null;
    this.bondData = null;
    this.lastPDBText = null;
  }

  // ====================================================================
  // {2} PIPELINE COMPLETO: PDB → ECS → THREE.JS
  // ====================================================================
  buildFromPDB(pdbText, style = 'ball-and-stick') {
    this.lastPDBText = pdbText;

    // 1. Parse PDB → llena Position3D + ElementType + BondPairs
    const parseResult = this.parser.execute(this.world, pdbText);
    this.entityRange = { start: parseResult.start, count: parseResult.count };
    this.bondData = parseResult.bondData;

    // 2. Asignar colores CPK
    this.colorSystem.execute(this.world, this.entityRange);

    // 3. Asignar radios según estilo
    this.styleSystem.setStyle(style);
    this.styleSystem.execute(this.world, this.entityRange);

    // 4. Render → InstancedMesh
    const moleculeGroup = this.renderSystem.execute(this.world, this.entityRange);

    // 5. Añadir enlaces si aplica
    const bondRadius = this.styleSystem.getBondRadius();
    const bondMesh = this.renderSystem.buildBonds(
      this.world, this.entityRange, this.bondData, bondRadius
    );
    if (bondMesh) {
      moleculeGroup.add(bondMesh);
    }

    return moleculeGroup;
  }

  // ====================================================================
  // {3} CAMBIO DE ESTILO (SIN REPARSEAR PDB)
  // ====================================================================
  rebuildStyle(style) {
    if (!this.entityRange || !this.lastPDBText) return null;

    this.styleSystem.setStyle(style);
    this.styleSystem.execute(this.world, this.entityRange);

    const moleculeGroup = this.renderSystem.execute(this.world, this.entityRange);

    const bondRadius = this.styleSystem.getBondRadius();
    const bondMesh = this.renderSystem.buildBonds(
      this.world, this.entityRange, this.bondData, bondRadius
    );
    if (bondMesh) {
      moleculeGroup.add(bondMesh);
    }

    return moleculeGroup;
  }

  // ====================================================================
  // {4} ACCESO A DATOS CRUDOS (para depuración / serialización)
  // ====================================================================
  getRawPositions() {
    if (!this.entityRange) return null;
    const comp = this.world.getComponent(ComponentType.POSITION_3D);
    const { start, count } = this.entityRange;
    return comp.pool.subarray(start * 3, (start + count) * 3);
  }

  getRawElements() {
    if (!this.entityRange) return null;
    const comp = this.world.getComponent(ComponentType.ELEMENT_TYPE);
    const { start, count } = this.entityRange;
    return comp.pool.subarray(start, start + count);
  }

  getRawColors() {
    if (!this.entityRange) return null;
    const comp = this.world.getComponent(ComponentType.VISUAL_COLOR);
    const { start, count } = this.entityRange;
    return comp.pool.subarray(start * 3, (start + count) * 3);
  }

  getAtomCount() {
    return this.entityRange ? this.entityRange.count : 0;
  }

  // ====================================================================
  // {5} LIMPIEZA
  // ====================================================================
  dispose() {
    this.renderSystem.dispose();
    this.world = null;
    this.entityRange = null;
    this.bondData = null;
  }
}