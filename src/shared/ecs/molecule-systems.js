// ====================================================================
// ====================================================================
// {1} MOLECULAR SYSTEMS — ECS PIPELINE
// ====================================================================
// Systems that process raw ECS World data to
// transform it into renderable geometry with Three.js.
// ====================================================================

import * as THREE from 'three';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';
import { ComponentType } from './ecs-world.js';
import { getCPKColor, getRadius, symbolToElement, ElementSymbol, Element } from './molecule-components.js';

// ====================================================================
// {2} PDB PARSE SYSTEM
// ====================================================================
// Takes raw PDB text and fills Position3D + ElementType + BondPairs.
// Bond pairs are generated using Three.js's PDBLoader which has a
// robust bond-detection algorithm (atomic distances + element-specific
// thresholds + CONECT records), giving the characteristic web pattern.
// ====================================================================
export class PDBParseSystem {
  constructor() {
    this.lastAtomCount = 0;
    this.pdbLoader = new PDBLoader();
  }

  execute(world, pdbText) {
    const lines = pdbText.split('\n');
    const atoms = [];
    const waterOIndices = [];

    // 1. Parse atoms with custom text parser
    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const x = parseFloat(line.substring(30, 38));
        const y = parseFloat(line.substring(38, 46));
        const z = parseFloat(line.substring(46, 54));
        const elementSymbol = line.substring(76, 78).trim() || line.substring(12, 14).trim();
        const element = symbolToElement(elementSymbol);
        const resName = line.substring(17, 20).trim();

        atoms.push({ x, y, z, element, elementStr: elementSymbol });

        if (resName === 'HOH' && elementSymbol === 'O') {
          waterOIndices.push(atoms.length - 1);
        }
      }
    }

    // 2. Generate artificial hydrogen atoms for water molecules
    const O_H_DIST = 0.96;
    const HOH_ANGLE = 104.5 * Math.PI / 180;
    const halfAngle = HOH_ANGLE / 2;
    const generatedHAtoms = [];
    const ohBonds = [];

    for (const oIdx of waterOIndices) {
      const ox = atoms[oIdx].x;
      const oy = atoms[oIdx].y;
      const oz = atoms[oIdx].z;

      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      const cosP = Math.cos(phi), sinP = Math.sin(phi);

      const rotate = (lx, ly, lz) => {
        let rx = lx * cosT + lz * sinT;
        let ry = ly;
        let rz = -lx * sinT + lz * cosT;
        let fy = ry * cosP - rz * sinP;
        let fz = ry * sinP + rz * cosP;
        return { x: rx + ox, y: fy + oy, z: fz + oz };
      };

      const sh = Math.sin(halfAngle);
      const ch = Math.cos(halfAngle);

      const h1 = rotate(-sh * O_H_DIST, 0, ch * O_H_DIST);
      const h2 = rotate(sh * O_H_DIST, 0, ch * O_H_DIST);

      const hIdx1 = atoms.length + generatedHAtoms.length;
      const hIdx2 = hIdx1 + 1;

      generatedHAtoms.push(
        { x: h1.x, y: h1.y, z: h1.z, element: Element.H, elementStr: 'H' },
        { x: h2.x, y: h2.y, z: h2.z, element: Element.H, elementStr: 'H' }
      );

      ohBonds.push([oIdx, hIdx1], [oIdx, hIdx2]);
    }

    const allAtoms = atoms.concat(generatedHAtoms);
    const count = allAtoms.length;
    const { start } = world.createEntities(count);
    const posData = new Float32Array(count * 3);
    const elemData = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      const atom = allAtoms[i];
      posData[i * 3]     = atom.x;
      posData[i * 3 + 1] = atom.y;
      posData[i * 3 + 2] = atom.z;
      elemData[i] = atom.element;
    }

    world.setComponentData(ComponentType.POSITION_3D, start, posData);
    world.setComponentData(ComponentType.ELEMENT_TYPE, start, elemData);
    world.setComponentData(ComponentType.ACTIVE_FLAG, start, new Uint8Array(count).fill(1));

    // 3. Detect bonds among original atoms, then add O-H bonds
    const bonds = this._detectBonds(pdbText, atoms);
    for (const bond of ohBonds) {
      bonds.push(bond);
    }

    const bondData = new Uint16Array(bonds.length * 2);
    for (let i = 0; i < bonds.length; i++) {
      bondData[i * 2]     = bonds[i][0];
      bondData[i * 2 + 1] = bonds[i][1];
    }

    world.activeCount = count;
    this.lastAtomCount = count;

    return { start, count, bondData, bondCount: bonds.length };
  }

  _detectBonds(pdbText, atoms) {
    const bondSet = new Set();
    const addBond = (a, b) => {
      if (a === b || a < 0 || b < 0 || a >= atoms.length || b >= atoms.length) return;
      const key = Math.min(a, b) * atoms.length + Math.max(a, b);
      bondSet.add(key);
    };

    try {
      // Use Three.js PDBLoader for chemically accurate bond detection
      // PDBLoader returns json.bonds with direct atom index pairs [a, b]
      const result = this.pdbLoader.parse(pdbText);

      if (result.json && result.json.bonds && result.json.bonds.length > 0) {
        for (const bond of result.json.bonds) {
          addBond(bond[0], bond[1]);
        }
      }
    } catch (e) {
      console.warn('[PDBParse] PDBLoader bond detection failed, using distance fallback:', e.message);
    }

    // If no bonds detected by PDBLoader, use distance fallback
    if (bondSet.size === 0 && atoms.length > 1) {
      this._fallbackBonds(atoms, addBond);
    }

    return Array.from(bondSet).map(key => [
      Math.floor(key / atoms.length),
      key % atoms.length
    ]);
  }

  _fallbackBonds(atoms, addBond) {
    const covalentRadii = {
      H: 0.31, C: 0.76, N: 0.71, O: 0.66,
      S: 1.05, P: 1.07, F: 0.57, CL: 0.99,
      FE: 1.32, ZN: 1.22, CU: 1.32, MN: 1.39,
      NA: 1.66, K: 2.03, CA: 1.76
    };
    const defaultRadius = 0.8;

    for (let i = 0; i < atoms.length; i++) {
      const r1 = covalentRadii[atoms[i].elementStr] || defaultRadius;
      for (let j = i + 1; j < atoms.length; j++) {
        const r2 = covalentRadii[atoms[j].elementStr] || defaultRadius;
        const bondThreshold = (r1 + r2) * 1.15; // 15% tolerance
        const thresholdSq = bondThreshold * bondThreshold;

        const dx = atoms[i].x - atoms[j].x;
        const dy = atoms[i].y - atoms[j].y;
        const dz = atoms[i].z - atoms[j].z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < thresholdSq) {
          addBond(i, j);
        }
      }
    }
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
// Both atoms and bonds share the same centroid to stay aligned.
// ====================================================================
export class RenderSystem {
  constructor() {
    this.baseSphereGeo = new THREE.IcosahedronGeometry(1, 3);
    this.baseCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
    this.atomGroup = null;
    this.bondGroup = null;
    this.centroid = new THREE.Vector3(0, 0, 0);
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
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const color = new THREE.Color();
    const scale = new THREE.Vector3();

    // Compute centroid for centering atoms AND bonds
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
    this.centroid.set(cx, cy, cz);

    // Atom InstancedMesh
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

  buildBonds(world, entityRange, bondData, bondRadius) {
    const { start, count } = entityRange;
    if (!bondData || bondData.length === 0 || bondRadius <= 0) return null;

    const posComp = world.getComponent(ComponentType.POSITION_3D);
    const positions = posComp.pool;
    const { x: cx, y: cy, z: cz } = this.centroid;

    const bondCount = bondData.length / 2;
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.2
    });

    const bondMesh = new THREE.InstancedMesh(this.baseCylinderGeo, bondMat, bondCount);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3();
    const startPos = new THREE.Vector3();
    const endPos = new THREE.Vector3();
    const center = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < bondCount; i++) {
      const ai = bondData[i * 2];
      const bi = bondData[i * 2 + 1];

      // Same centering as atoms: subtract centroid
      startPos.set(
        positions[(start + ai) * 3]     - cx,
        positions[(start + ai) * 3 + 1] - cy,
        positions[(start + ai) * 3 + 2] - cz
      );
      endPos.set(
        positions[(start + bi) * 3]     - cx,
        positions[(start + bi) * 3 + 1] - cy,
        positions[(start + bi) * 3 + 2] - cz
      );

      center.copy(startPos).add(endPos).multiplyScalar(0.5);

      const direction = new THREE.Vector3().subVectors(endPos, startPos);
      const length = direction.length();
      direction.normalize();

      quaternion.setFromUnitVectors(up, direction);
      scaleVec.set(bondRadius, length, bondRadius);

      matrix.compose(center, quaternion, scaleVec);
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