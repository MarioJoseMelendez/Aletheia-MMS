// ====================================================================
// ====================================================================
// {1} COMPONENTES MOLECULARES — DEFINICIONES ECS
// ====================================================================
// Configura los componentes específicos para simulación molecular:
// posición, elemento químico, color visual, radio, enlaces.
// ====================================================================

import { ECSWorld, ComponentType } from './ecs-world.js';

// ====================================================================
// {2} MAPEO DE ELEMENTOS QUÍMICOS (PARA COMPONENTE Uint8Array)
// ====================================================================
export const Element = {
  H: 0,  HE: 1, LI: 2, BE: 3, B: 4,  C: 5,  N: 6,  O: 7,
  F: 8,  NE: 9, NA: 10, MG: 11, AL: 12, SI: 13, P: 14, S: 15,
  CL: 16, AR: 17, K: 18, CA: 19,
  // Metales de transición comunes en metaloproteínas
  FE: 20, ZN: 21, CU: 22, MN: 23, MG2: 24,
  // Other
  UNKNOWN: 63
};

// Reverso: de valor numérico a símbolo
export const ElementSymbol = {};
for (const [sym, val] of Object.entries(Element)) {
  ElementSymbol[val] = sym;
}

// ====================================================================
// {3} COLORES CPK (Corey-Pauling-Koltun) EN RGB [0-1]
// ====================================================================
export const CPK_RGB = {
  [Element.H]:  [1.0, 1.0, 1.0],      // Blanco
  [Element.C]:  [0.565, 0.565, 0.565], // Gris
  [Element.O]:  [1.0, 0.05, 0.05],     // Rojo
  [Element.N]:  [0.188, 0.314, 0.973], // Azul
  [Element.S]:  [1.0, 1.0, 0.188],     // Amarillo
  [Element.P]:  [1.0, 0.502, 0.0],     // Naranja
  [Element.FE]: [0.878, 0.4, 0.2],     // Café
  [Element.ZN]: [0.49, 0.502, 0.69],   // Gris-azul
  [Element.CU]: [0.72, 0.45, 0.2],     // Cobre
  [Element.MN]: [0.6, 0.6, 0.6],       // Gris
  [Element.CL]: [0.12, 0.94, 0.12],    // Verde
  [Element.NA]: [0.4, 0.4, 1.0],       // Azul claro
  [Element.K]:  [0.6, 0.2, 0.8],       // Púrpura
  [Element.CA]: [0.24, 0.7, 0.44],     // Verde oscuro
};

const FALLBACK_RGB = [1.0, 0.08, 0.58]; // Rosa brillante para no mapeados

// ====================================================================
// {4} RADIOS ATÓMICOS POR ESTILO VISUAL
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
// {5} INICIALIZAR COMPONENTES EN UN MUNDO ECS
// ====================================================================
export function registerMoleculeComponents(world) {
  world.registerComponent(ComponentType.POSITION_3D, Float32Array, 3);
  world.registerComponent(ComponentType.ELEMENT_TYPE, Uint8Array, 1);
  world.registerComponent(ComponentType.VISUAL_COLOR, Float32Array, 3);
  world.registerComponent(ComponentType.VISUAL_RADIUS, Float32Array, 1);
  world.registerComponent(ComponentType.ACTIVE_FLAG, Uint8Array, 1);
}

// ====================================================================
// {6} HELPER: OBTENER COLOR CPK PARA UN ELEMENTO
// ====================================================================
export function getCPKColor(elementValue) {
  return CPK_RGB[elementValue] || FALLBACK_RGB;
}

// ====================================================================
// {7} HELPER: OBTENER RADIO PARA UN ELEMENTO Y ESTILO
// ====================================================================
export function getRadius(elementValue, style) {
  const config = RadiusConfig[style] || RadiusConfig['ball-and-stick'];
  return config[elementValue] !== undefined ? config[elementValue] : config.default;
}

// ====================================================================
// {8} PARSER: SÍMBOLO QUÍMICO → ELEMENT ENUM
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