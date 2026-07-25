// ====================================================================
// ====================================================================
// {1} MOLECULAR SYSTEMS — ECS PIPELINE
// ====================================================================
// Systems that process raw ECS World data to
// transform it into renderable geometry with Three.js.
// ====================================================================

import * as THREE from 'three';
import { ComponentType } from './ecs-world.js';
import { getCPKColor, getRadius, symbolToElement } from './molecule-components.js';

// ====================================================================
// {2} PDB PARSE SYSTEM
// ====================================================================
// Takes raw PDB text and fills Position3D + ElementType + BondPairs.
// ====================================================================
export class PDBParseSystem {
  constructor() {
    this.lastAtomCount = 0;
  }

  execute(world, pdbText) {
    const lines = pdbText.split('\n');
    const atoms = [];
    const bonds = [];

    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const x = parseFloat(line.substring(30, 38));
        const y = parseFloat(line.substring(38, 46));
        const z = parseFloat(line.substring(46, 54));
        const elementSymbol = line.substring(76, 78).trim() || line.substring(12, 14).trim();
        const element = symbolToElement(elementSymbol);

        atoms.push({ x, y, z, element });
      }

      if (line.startsWith('CONECT')) {
        const parts = line.trim().split(/\s+/);
        const atomIndex = parseInt(parts[1], 10) - 1;
        for (let i = 2; i < parts.length; i++) {
          const bondIndex = parseInt(parts[i], 10) - 1;
          if (bondIndex >= 0) {
            bonds.push([atomIndex, bondIndex]);
          }
        }
      }
    }

    const count = atoms.length;
    const { start } = world.createEntities(count);
    const posData = new Float32Array(count * 3);
    const elemData = new Uint8Array(count);
    const bondData = new Uint16Array(bonds.length * 2);

    for (let i = 0; i < count; i++) {
      const atom = atoms[i];
      posData[i * 3]     = atom.x;
      posData[i * 3 + 1] = atom.y;
      posData[i * 3 + 2] = atom.z;
      elemData[i] = atom.element;
    }

    for (let i = 0; i < bonds.length; i++) {
      bondData[i * 2]     = bonds[i][0];
      bondData[i * 2 + 1] = bonds[i][1];
    }

    world.setComponentData(ComponentType.POSITION_3D, start, posData);
    world.setComponentData(ComponentType.ELEMENT_TYPE, start, elemData);

    world.setComponentData(ComponentType.ACTIVE_FLAG, start, new Uint8Array(count).fill(1));

    world.activeCount = count;
    this.lastAtomCount = count;

    return { start, count, bondData, bondCount: bonds.length };
  }
}

// ====================================================================
// {3} COLOR SYSTEM
// ====================================================================
// Fills VisualColor according to ElementType using the CPK table.
// ====================================================================
export class ColorSystem {
  execute(world, entityRange) {
    const { start, count } = entityRange;
    const elemComp = world.getComponent(ComponentType.ELEMENT_TYPE);
    const colorComp = world.getComponent(ComponentType.VISUAL_COLOR);

    const elem = elemComp.pool;
    const color = colorComp.pool;

    for (let i = 0; i < count; i++) {
      const entityOffset = (start + i);
      const elemVal = elem[entityOffset];
      const rgb = getCPKColor(elemVal);
      const colorOffset = entityOffset * 3;
      color[colorOffset]     = rgb[0];
      color[colorOffset + 1] = rgb[1];
      color[colorOffset + 2] = rgb[2];
    }
  }
}

// ====================================================================
// {4} STYLE SYSTEM
// ====================================================================
// Calculates VisualRadius according to ElementType and the active style.
// ====================================================================
export class StyleSystem {
  constructor(initialStyle = 'ball-and-stick') {
    this.currentStyle = initialStyle;
  }

  setStyle(style) {
    this.currentStyle = style;
  }

  getBondRadius() {
    const r = {
      'ball-and-stick': 0.15,
      'sticks': 0.2,
      'spheres': 0
    };
    return r[this.currentStyle] || 0.15;
  }

  execute(world, entityRange) {
    const { start, count } = entityRange;
    const elemComp = world.getComponent(ComponentType.ELEMENT_TYPE);
    const radiusComp = world.getComponent(ComponentType.VISUAL_RADIUS);

    const elem = elemComp.pool;
    const radius = radiusComp.pool;

    for (let i = 0; i < count; i++) {
      const entityOffset = start + i;
      radius[entityOffset] = getRadius(elem[entityOffset], this.currentStyle);
    }
  }
}

// ====================================================================
// {5} RENDER SYSTEM
// ====================================================================
// Builds Three.js InstancedMesh from ECS data.
// Reuses base geometries (icosahedron for atoms, cylinder for bonds).
// ====================================================================
export class RenderSystem {
  constructor() {
    this.baseSphereGeo = new THREE.IcosahedronGeometry(1, 3);
    this.baseCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
    this.atomGroup = null;
    this.bondGroup = null;
  }

  execute(world, entityRange) {
    const { start, count } = entityRange;
    if (count === 0) return null;

    const posComp = world.getComponent(ComponentType.POSITION_3D);
    const colorComp = world.getComponent(ComponentType.VISUAL_COLOR);
    const radiusComp = world.getComponent(ComponentType.VISUAL_RADIUS);

    const positions = posComp.pool;
    const colors = colorComp.pool;
    const radii = radiusComp.pool;

    const group = new THREE.Group();
    const up = new THREE.Vector3(0, 1, 0);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const color = new THREE.Color();
    const scale = new THREE.Vector3();

    // --- Center calculation ---
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < count; i++) {
      const off = (start + i) * 3;
      cx += positions[off];
      cy += positions[off + 1];
      cz += positions[off + 2];
    }
    cx /= count;
    cy /= count;
    cz /= count;

    const offsetVec = new THREE.Vector3(cx, cy, cz);

    // {6} ATOM INSTANCED MESH
    const atomMat = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.1
    });

    const atomMesh = new THREE.InstancedMesh(this.baseSphereGeo, atomMat, count);

    for (let i = 0; i < count; i++) {
      const entityId = start + i;
      const off = entityId * 3;

      position.set(positions[off] - cx, positions[off + 1] - cy, positions[off + 2] - cz);
      color.setRGB(colors[off], colors[off + 1], colors[off + 2]);

      const r = radii[entityId];
      scale.set(r, r, r);

      matrix.makeTranslation(position.x, position.y, position.z);
      matrix.scale(scale);

      atomMesh.setMatrixAt(i, matrix);
      atomMesh.setColorAt(i, color);
    }

    atomMesh.instanceMatrix.needsUpdate = true;
    if (atomMesh.instanceColor) atomMesh.instanceColor.needsUpdate = true;
    group.add(atomMesh);
    this.atomGroup = atomMesh;

    group.position.set(0, 0, 0);
    return group;
  }

  /**
   * Builds bonds separately (called with BondPairs).
   */
  buildBonds(world, entityRange, bondData, bondRadius) {
    const { start, count } = entityRange;
    if (!bondData || bondData.length === 0 || bondRadius <= 0) return null;

    const posComp = world.getComponent(ComponentType.POSITION_3D);
    const positions = posComp.pool;

    const bondCount = bondData.length / 2;
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.2
    });

    const bondMesh = new THREE.InstancedMesh(this.baseCylinderGeo, bondMat, bondCount);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const startPos = new THREE.Vector3();
    const endPos = new THREE.Vector3();
    const center = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < bondCount; i++) {
      const ai = bondData[i * 2];
      const bi = bondData[i * 2 + 1];

      startPos.set(
        positions[(start + ai) * 3],
        positions[(start + ai) * 3 + 1],
        positions[(start + ai) * 3 + 2]
      );
      endPos.set(
        positions[(start + bi) * 3],
        positions[(start + bi) * 3 + 1],
        positions[(start + bi) * 3 + 2]
      );

      center.copy(startPos).add(endPos).multiplyScalar(0.5);

      const direction = new THREE.Vector3().subVectors(endPos, startPos);
      const length = direction.length();
      direction.normalize();

      quaternion.setFromUnitVectors(up, direction);
      scale.set(bondRadius, length, bondRadius);

      matrix.compose(center, quaternion, scale);
      bondMesh.setMatrixAt(i, matrix);
    }

    bondMesh.instanceMatrix.needsUpdate = true;
    this.bondGroup = bondMesh;
    return bondMesh;
  }

  dispose() {
    if (this.atomGroup) {
      this.atomGroup.geometry?.dispose();
      this.atomGroup.material?.dispose();
    }
    if (this.bondGroup) {
      this.bondGroup.geometry?.dispose();
      this.bondGroup.material?.dispose();
    }
  }
}