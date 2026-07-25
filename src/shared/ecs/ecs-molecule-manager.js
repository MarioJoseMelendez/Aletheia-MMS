// ====================================================================
// ====================================================================
// {1} ECS MOLECULE MANAGER — ECS PIPELINE ORCHESTRATOR
// ====================================================================
// Unified interface that coordinates: ECS World → Parse → Color → Style → Render.
// This module replaces the previous molecule-loader.js logic
// as the ECS-based molecule construction layer.
// ====================================================================

import { ECSWorld, ComponentType } from './ecs-world.js';
import { registerMoleculeComponents } from './molecule-components.js';
import { PDBParseSystem, ColorSystem, StyleSystem, RenderSystem } from './molecule-systems.js';
import * as THREE from 'three';

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
  // {2} COMPLETE PIPELINE: PDB → ECS → THREE.JS
  // ====================================================================
  buildFromPDB(pdbText, style = 'ball-and-stick') {
    this.lastPDBText = pdbText;

    // 1. Parse PDB → fills Position3D + ElementType + BondPairs
    const parseResult = this.parser.execute(this.world, pdbText);
    this.entityRange = { start: parseResult.start, count: parseResult.count };
    this.bondData = parseResult.bondData;

    if (parseResult.count === 0) {
      console.warn('[ECS] No atoms parsed from PDB data');
      return new THREE.Group();
    }

    // 2. Assign CPK colors
    this.colorSystem.execute(this.world, this.entityRange);

    // 3. Assign radii according to style
    this.styleSystem.setStyle(style);
    this.styleSystem.execute(this.world, this.entityRange);

    // 4. Render → InstancedMesh
    const moleculeGroup = this.renderSystem.execute(this.world, this.entityRange);
    if (!moleculeGroup) return new THREE.Group();

    // 5. Add bonds if applicable
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
  // {3} STYLE CHANGE (WITHOUT REPARSING PDB)
  // ====================================================================
  rebuildStyle(style) {
    if (!this.entityRange || !this.lastPDBText) return null;
    if (this.entityRange.count === 0) return new THREE.Group();

    this.styleSystem.setStyle(style);
    this.styleSystem.execute(this.world, this.entityRange);

    const moleculeGroup = this.renderSystem.execute(this.world, this.entityRange);
    if (!moleculeGroup) return new THREE.Group();

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
  // {4} RAW DATA ACCESS (for debugging / serialization)
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
  // {5} CLEANUP
  // ====================================================================
  dispose() {
    this.renderSystem.dispose();
    this.world = null;
    this.entityRange = null;
    this.bondData = null;
  }
}