// ====================================================================
// ====================================================================
// {1} ECS WORLD — ENTITY SYSTEM CORE
// ====================================================================
// Data-oriented implementation with contiguous typed arrays.
// Each entity is a numeric index into flat component pools.
// ====================================================================

// ====================================================================
// {2} CONSTANTS
// ====================================================================
const MAX_ENTITIES = 65536;
const MAX_COMPONENT_TYPES = 64;

// ====================================================================
// {3} COMPONENT TYPE REGISTRY
// ====================================================================
const ComponentType = {
  POSITION_3D: 0,
  ELEMENT_TYPE: 1,
  VISUAL_COLOR: 2,
  VISUAL_RADIUS: 3,
  BOND_PAIRS: 4,
  ACTIVE_FLAG: 5,
  _count: 6
};

// ====================================================================
// {4} ECS WORLD
// ====================================================================
export class ECSWorld {
  constructor() {
    this.nextEntityId = 0;
    this.components = new Map();
    this.systems = [];
    this.activeCount = 0;
  }

  // ====================================================================
  // {5} ENTITY MANAGEMENT
  // ====================================================================
  createEntity() {
    const id = this.nextEntityId++;
    if (id >= MAX_ENTITIES) {
      throw new Error(`ECSWorld: exceeded limit of ${MAX_ENTITIES} entities`);
    }
    return id;
  }

  createEntities(count) {
    const start = this.nextEntityId;
    for (let i = 0; i < count; i++) {
      this.nextEntityId++;
    }
    const end = this.nextEntityId;
    if (end > MAX_ENTITIES) {
      throw new Error(`ECSWorld: exceeded limit of ${MAX_ENTITIES} entities`);
    }
    return { start, count };
  }

  getActiveCount() {
    return this.activeCount;
  }

  // ====================================================================
  // {6} COMPONENT POOL MANAGEMENT
  // ====================================================================
  /**
   * Registers a component with a pre-allocated typed array.
   * @param {number} typeId  - Component type ID (from ComponentType)
   * @param {TypedArray} typedArrayCtor  - Constructor Float32Array, Uint8Array, etc.
   * @param {number} stride  - Elements per entity (1, 3, etc.)
   */
  registerComponent(typeId, typedArrayCtor, stride = 1) {
    const pool = new typedArrayCtor(MAX_ENTITIES * stride);
    this.components.set(typeId, { pool, stride, dirty: true });
  }

  /**
   * Writes data to the pool for a range of entities.
   * @param {number} typeId
   * @param {number} entityStart
   * @param {Array|TypedArray} data  - Flat data
   */
  setComponentData(typeId, entityStart, data) {
    const comp = this.components.get(typeId);
    if (!comp) throw new Error(`Component type ${typeId} not registered`);
    const offset = entityStart * comp.stride;
    comp.pool.set(data, offset);
    comp.dirty = true;
  }

  /**
   * Reads the pool directly (for systems).
   * @param {number} typeId
   * @returns {{ pool: TypedArray, stride: number }}
   */
  getComponent(typeId) {
    const comp = this.components.get(typeId);
    if (!comp) throw new Error(`Component type ${typeId} not registered`);
    return comp;
  }

  /**
   * Reads data for a specific entity.
   * @param {number} typeId
   * @param {number} entityId
   * @returns {Array} flat values
   */
  getEntityComponent(typeId, entityId) {
    const comp = this.components.get(typeId);
    if (!comp) throw new Error(`Component type ${typeId} not registered`);
    const offset = entityId * comp.stride;
    return Array.from(comp.pool.subarray(offset, offset + comp.stride));
  }

  /**
   * Marks a component as clean (post-processing).
   */
  markClean(typeId) {
    const comp = this.components.get(typeId);
    if (comp) comp.dirty = false;
  }

  isDirty(typeId) {
    const comp = this.components.get(typeId);
    return comp ? comp.dirty : false;
  }

  // ====================================================================
  // {7} SYSTEM MANAGEMENT
  // ====================================================================
  addSystem(system) {
    this.systems.push(system);
  }

  update(deltaTime) {
    for (const system of this.systems) {
      system.execute(this, deltaTime);
    }
  }
}

// ====================================================================
// {8} COMPONENT TYPE EXPORT
// ====================================================================
export { ComponentType, MAX_ENTITIES };