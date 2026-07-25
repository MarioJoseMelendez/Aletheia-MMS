// ====================================================================
// ====================================================================
// {1} ECS INDEX — PUBLIC EXPORT
// ====================================================================
// Single entry point for the entire ECS system.
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