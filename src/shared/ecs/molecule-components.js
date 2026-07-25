// ====================================================================
// ====================================================================
// {1} MOLECULAR COMPONENTS — ECS DEFINITIONS
// ====================================================================
// Configures the specific components for molecular simulation:
// position, chemical element, visual color, radius, bonds.
// ====================================================================

import { ECSWorld, ComponentType } from './ecs-world.js';

// ====================================================================
// {2} CHEMICAL ELEMENT MAPPING (FOR Uint8Array COMPONENT)
// ====================================================================
export const Element = {
  H: 0,  HE: 1, LI: 2, BE: 3, B: 4,  C: 5,  N: 6,  O: 7,
  F: 8,  NE: 9, NA: 10, MG: 11, AL: 12, SI: 13, P: 14, S: 15,
  CL: 16, AR: 17, K: 18, CA: 19,
  // Common transition metals in metalloproteins
  FE: 20, ZN: 21, CU: 22, MN: 23, MG2: 24,
  // Other
  UNKNOWN: 63
};

// Reverse: from numeric value to symbol
export const ElementSymbol = {};
for (const [sym, val] of Object.entries(Element)) {
  ElementSymbol[val] = sym;
}

// ====================================================================
// {3} CPK COLORS (Corey-Pauling-Koltun) IN RGB [0-1]
// ====================================================================
export const CPK_RGB = {
  [Element.H]:  [1.0, 1.0, 1.0],      // White
  [Element.C]:  [0.565, 0.565, 0.565], // Grey
  [Element.O]:  [1.0, 0.05, 0.05],     // Red
  [Element.N]:  [0.188, 0.314, 0.973], // Blue
  [Element.S]:  [1.0, 1.0, 0.188],     // Yellow
  [Element.P]:  [1.0, 0.502, 0.0],     // Orange
  [Element.FE]: [0.878, 0.4, 0.2],     // Brown/rust
  [Element.ZN]: [0.49, 0.502, 0.69],   // Grey-blue
  [Element.CU]: [0.72, 0.45, 0.2],     // Copper
  [Element.MN]: [0.6, 0.6, 0.6],       // Grey
  [Element.CL]: [0.12, 0.94, 0.12],    // Green
  [Element.NA]: [0.4, 0.4, 1.0],       // Light blue
  [Element.K]:  [0.6, 0.2, 0.8],       // Purple
  [Element.CA]: [0.24, 0.7, 0.44],     // Dark green
  [Element.MG]: [0.54, 0.6, 0.78],     // Light purple/blue
  [Element.F]:  [0.5, 0.8, 0.5],       // Light green
  [Element.HE]: [0.85, 0.9, 0.2],      // Pale yellow
  [Element.LI]: [0.6, 0.4, 0.8],       // Purple
  [Element.BE]: [0.4, 0.8, 0.4],       // Green
  [Element.B]:  [0.8, 0.6, 0.4],       // Brown
  [Element.NE]: [0.7, 0.3, 0.9],       // Violet
  [Element.SI]: [0.5, 0.5, 0.5],       // Grey
  [Element.AL]: [0.6, 0.6, 0.6],       // Silver
  [Element.AR]: [0.5, 0.7, 0.9],       // Light blue
};

const FALLBACK_RGB = [1.0, 0.08, 0.58]; // Bright pink for unmapped

// ====================================================================
// {4} ATOMIC RADII BY VISUAL STYLE
// ====================================================================
export const RadiusConfig = {
  'ball-and-stick': {
    [Element.H]:  0.3,  [Element.C]:  0.4,
    [Element.N]:  0.35, [Element.O]:  0.35,
    [Element.S]:  0.45, [Element.P]:  0.45,
    [Element.FE]: 0.5,  [Element.ZN]: 0.5,
    [Element.CU]: 0.5,  [Element.MN]: 0.45,
    [Element.CL]: 0.45, [Element.NA]: 0.4,
    [Element.K]:  0.45, [Element.CA]: 0.45,
    default: 0.3
  },
  spheres: {
    default: 1.5
  },
  sticks: {
    default: 0.2
  }
};

export const BOND_RADIUS_CONFIG = {
  'ball-and-stick': 0.15,
  'sticks': 0.2,
  'spheres': 0
};

// ====================================================================
// {5} INITIALIZE COMPONENTS IN AN ECS WORLD
// ====================================================================
export function registerMoleculeComponents(world) {
  world.registerComponent(ComponentType.POSITION_3D, Float32Array, 3);
  world.registerComponent(ComponentType.ELEMENT_TYPE, Uint8Array, 1);
  world.registerComponent(ComponentType.VISUAL_COLOR, Float32Array, 3);
  world.registerComponent(ComponentType.VISUAL_RADIUS, Float32Array, 1);
  world.registerComponent(ComponentType.ACTIVE_FLAG, Uint8Array, 1);
}

// ====================================================================
// {6} HELPER: GET CPK COLOR FOR AN ELEMENT
// ====================================================================
export function getCPKColor(elementValue) {
  return CPK_RGB[elementValue] || FALLBACK_RGB;
}

// ====================================================================
// {7} HELPER: GET RADIUS FOR AN ELEMENT AND STYLE
// ====================================================================
export function getRadius(elementValue, style) {
  const config = RadiusConfig[style] || RadiusConfig['ball-and-stick'];
  return config[elementValue] !== undefined ? config[elementValue] : config.default;
}

// ====================================================================
// {8} PARSER: CHEMICAL SYMBOL → ELEMENT ENUM
// ====================================================================
const PDB_ELEMENT_MAP = {
  H: Element.H, C: Element.C, N: Element.N, O: Element.O,
  S: Element.S, P: Element.P, FE: Element.FE, ZN: Element.ZN,
  CU: Element.CU, MN: Element.MN, CL: Element.CL, NA: Element.NA,
  K: Element.K, CA: Element.CA, MG: Element.MG, F: Element.F,
  I: Element.UNKNOWN
};

export function symbolToElement(symbol) {
  const s = symbol.trim().toUpperCase();
  return PDB_ELEMENT_MAP[s] !== undefined ? PDB_ELEMENT_MAP[s] : Element.UNKNOWN;
}