// ====================================================================
// ====================================================================
// {1} 3D SCENE — DISPLAY
// ====================================================================
// Three.js setup (Scene, Camera, Renderer, Lights).
// Handles injecting the loaded molecule and applying transformations.
// ====================================================================

import * as THREE from 'three';

export class DisplayScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.scene = new THREE.Scene();
    
    // {2} Pure Black Background
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Default initial position
    this.camera.position.set(0, 0, 50);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.moleculeGroup = new THREE.Group();
    this.scene.add(this.moleculeGroup);

    this._setupLights();

    // {3} Bindings
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);
  }

  // ====================================================================
  // {4} LIGHT SETUP
  // ====================================================================
  _setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 15);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-10, -20, -15);
    this.scene.add(dirLight2);
  }

  // ====================================================================
  // {5} PUBLIC METHODS
  // ====================================================================
  
  /**
   * Reemplaza la molécula actual por una nueva
   * @param {THREE.Group} newMoleculeGroup
   */
  setMolecule(newMoleculeGroup) {
    while (this.moleculeGroup.children.length > 0) {
      const child = this.moleculeGroup.children[0];
      this.moleculeGroup.remove(child);
    }
    
    this.moleculeGroup.add(newMoleculeGroup);
  }

  /**
   * Posiciona la cámara exactamente como la del Control
   * @param {Array} cameraPos [x, y, z]
   * @param {Array} targetPos [x, y, z]
   */
  setCamera(cameraPos, targetPos) {
    this.camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
    this.camera.lookAt(targetPos[0], targetPos[1], targetPos[2]);
  }

  /**
   * Restablece la vista a la posición por defecto
   */
  resetView() {
    this.moleculeGroup.position.set(0, 0, 0);
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);
  }

  // ====================================================================
  // {6} RENDER LOOP
  // ====================================================================
  animate() {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
