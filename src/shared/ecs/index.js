// ====================================================================
// ====================================================================
// {1} ECS INDEX — EXPORT PÚBLICO
// ====================================================================
// Punto de entrada único para todo el sistema ECS.
// ====================================================================

export { ECSWorld, ComponentType } from './ecs-world.js';

export {
  Element, ElementSymbol,
  getCPKColor, getRadius,
  registerMoleculeComponents, symbolToElement
} from './molecule-components.js';

export {
  PDBParseSystem,
  ColorSystem,
  StyleSystem,
  RenderSystem
} from './molecule-systems.js';

export { ECSMoleculeManager } from './ecs-molecule-manager.js';