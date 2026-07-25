// ====================================================================
// ====================================================================
// {1} COMPONENT: MOLECULE LIST
// ====================================================================
// Fetches the list from the Worker API, renders the sidebar menu
// and emits the selection event to the WebSocket.
// Includes instant fallback demo data to guarantee 100% availability.
// ====================================================================

import { CONFIG, WS_EVENTS } from '../shared/constants.js';
import { wsClient } from '../shared/websocket-client.js';

const FALLBACK_DEMO_MOLECULES = [
  {
    id: 'hemoglobin-demo',
    name: 'Hemoglobina',
    description: 'Proteína tetramérica encargada del transporte de oxígeno en los glóbulos rojos.',
    category: 'Proteínas',
    pdbFile: 'demo_1A3N.pdb',
    audioFile: null,
    createdAt: new Date().toISOString(),
    atomCount: 4779
  },
  {
    id: 'dna-demo',
    name: 'ADN (Doble Hélice B-DNA)',
    description: 'Estructura de doble hélice de ácido desoxirribonucleico conteniendo la información genética.',
    category: 'Ácidos Nucleicos',
    pdbFile: 'demo_1BNA.pdb',
    audioFile: null,
    createdAt: new Date().toISOString(),
    atomCount: 486
  },
  {
    id: 'rna-demo',
    name: 'ARN de Transferencia (tRNA)',
    description: 'Molécula de ARN encargada de transferir aminoácidos al ribosoma durante la traducción.',
    category: 'Ácidos Nucleicos',
    pdbFile: 'demo_1EHZ.pdb',
    audioFile: null,
    createdAt: new Date().toISOString(),
    atomCount: 1653
  }
];

export class MoleculeList {
  constructor(onSelectCallback) {
    this.listElement = document.getElementById('molecule-list');
    this.searchInput = document.getElementById('molecule-search');
    this.molecules = [];
    this.activeId = null;
    this.onSelectCallback = onSelectCallback;

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => this.filterList(e.target.value));
    }
  }

  // ====================================================================
  // {2} DATA LOADING (FETCH WITH DEMO FALLBACK)
  // ====================================================================
  async loadMolecules() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/molecules`);
      if (!response.ok) throw new Error('Invalid network response');
      const data = await response.json();
      this.molecules = (data && data.molecules && data.molecules.length > 0) 
        ? data.molecules 
        : FALLBACK_DEMO_MOLECULES;
    } catch (error) {
      console.warn('[MoleculeList] Using demo fallback set:', error);
      this.molecules = FALLBACK_DEMO_MOLECULES;
    }
    
    this.render(this.molecules);
    
    // Auto-select the first molecule so it doesn't appear empty
    if (this.molecules.length > 0 && !this.activeId) {
      this.selectMolecule(this.molecules[0]);
    }
  }

  // ====================================================================
  // {3} UI RENDERING
  // ====================================================================
  render(moleculesToRender) {
    this.listElement.innerHTML = '';
    
    if (moleculesToRender.length === 0) {
      this.listElement.innerHTML = '<li class="empty-msg">No molecules found.</li>';
      return;
    }

    moleculesToRender.forEach(mol => {
      const li = document.createElement('li');
      li.className = `molecule-item ${this.activeId === mol.id ? 'active' : ''}`;
      li.dataset.id = mol.id;
      
      li.innerHTML = `
        <div class="mol-info">
          <span class="mol-name">${mol.name}</span>
          <span class="mol-category">${mol.category || 'General'}</span>
        </div>
      `;

      li.addEventListener('click', () => this.selectMolecule(mol));
      this.listElement.appendChild(li);
    });
  }

  filterList(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = this.molecules.filter(mol => 
      mol.name.toLowerCase().includes(lowerQuery) || 
      (mol.category && mol.category.toLowerCase().includes(lowerQuery))
    );
    this.render(filtered);
  }

  // ====================================================================
  // {4} SELECTION AND EMISSION
  // ====================================================================
  selectMolecule(mol) {
    this.activeId = mol.id;
    this.render(this.molecules);

    // 1. Emit to server (Durable Object -> Display)
    wsClient.emit(WS_EVENTS.SELECT_MOLECULE, mol);

    // 2. Notify locally (for the 3D Preview)
    if (this.onSelectCallback) {
      this.onSelectCallback(mol);
    }
  }
}
