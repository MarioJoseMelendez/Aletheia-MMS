// ====================================================================
// ====================================================================
// {1} COMPONENT: CONTROLS PANEL AND 3D PREVIEW
// ====================================================================
// Manages the mini 3D preview canvas.
// Keeps the rotation pivot 100% locked at the molecule's 3D center (0,0,0)
// so it always rotates on its own axis.
// ====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { moleculeLoader } from '../shared/molecule-loader.js';
import { wsClient } from '../shared/websocket-client.js';
import { WS_EVENTS, CONFIG, VISUALIZATION_STYLES } from '../shared/constants.js';

export class ControlsPanel {
  constructor() {
    this.container = document.getElementById('preview-container');
    this.styleButtons = document.querySelectorAll('.style-btn');
    this.resetBtn = document.getElementById('reset-view-btn');
    
    this.currentStyle = VISUALIZATION_STYLES.BALL_AND_STICK;
    this.currentMoleculeData = null;
    this.moleculeGroup = new THREE.Group();
    this.ecsBuilt = false;

    this.initScene();
    this.setupEventListeners();
  }

  // ====================================================================
  // {2} THREE.JS INITIALIZATION (PREVIEW)
  // ====================================================================
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a24);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 50);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(this.moleculeGroup);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 10);
    this.scene.add(dirLight);

    // {3} OrbitControls: Set strict pivot at origin (0,0,0)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Allow panning without altering the central rotation pivot
    this.controls.screenSpacePanning = true;

    // {4} EVENT EMISSION TO DISPLAY
    this.controls.addEventListener('change', () => {
      wsClient.emit(WS_EVENTS.CAMERA_UPDATE, {
        cameraPos: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
        targetPos: [this.controls.target.x, this.controls.target.y, this.controls.target.z]
      });
    });

    // Resize handler
    window.addEventListener('resize', () => {
      if (this.container.clientWidth > 0) {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      }
    });

    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // ====================================================================
  // {5} UI EVENTS
  // ====================================================================
  setupEventListeners() {
    this.styleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const style = e.target.dataset.style;
        this.setStyle(style);
        
        this.styleButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        wsClient.emit(WS_EVENTS.STYLE_CHANGE, style);
      });
    });

    this.resetBtn.addEventListener('click', () => {
      this.resetView();
    });
  }

  resetView() {
    this.controls.reset();
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);
    this.moleculeGroup.rotation.set(0, 0, 0);
    this.moleculeGroup.position.set(0, 0, 0);
    wsClient.emit(WS_EVENTS.RESET_VIEW, null);
  }

  // ====================================================================
  // {6} PREVIEW LOADING
  // ====================================================================
  async loadMoleculePreview(moleculeData) {
    this.currentMoleculeData = moleculeData;
    this.container.classList.add('loading');
    
    try {
      const pdbUrl = `${CONFIG.API_BASE_URL}/files/${moleculeData.pdbFile}`;
      const pdbRawData = await moleculeLoader.loadPDB(pdbUrl);
      
      // Build using ECS pipeline
      const newGroup = moleculeLoader.buildMolecule(pdbRawData, this.currentStyle);
      while (this.moleculeGroup.children.length > 0) {
        this.moleculeGroup.remove(this.moleculeGroup.children[0]);
      }
      this.moleculeGroup.add(newGroup);
      this.ecsBuilt = true;
      
      this.resetView();
    } catch (e) {
      console.error('[Preview] Error loading PDB', e);
    } finally {
      this.container.classList.remove('loading');
    }
  }

  setStyle(style) {
    this.currentStyle = style;
    if (this.ecsBuilt) {
      this._rebuildStyle();
    }
  }

  _rebuildStyle() {
    while (this.moleculeGroup.children.length > 0) {
      this.moleculeGroup.remove(this.moleculeGroup.children[0]);
    }
    const newGroup = moleculeLoader.rebuildStyle(this.currentStyle);
    if (newGroup) this.moleculeGroup.add(newGroup);
  }
}
